import { create } from 'zustand'
import { SCENES } from './catalog.js'
import { reflowOpenings } from './utils/layout.js'

// 全局状态中枢 v4.5(多选)
let _id = 1
const nextId = (p = 'obj') => p + '-' + _id++
const snapshot = (s) => JSON.stringify({ objects: s.objects, walls: s.walls })
const applySnap = (str) => { const d = JSON.parse(str); return { objects: d.objects, walls: d.walls } }
// selectedId 派生:恰好选中一个时=该id,否则null(单选UI用)
const primary = (ids) => (ids.length === 1 ? ids[0] : null)

export const useStore = create((set, get) => ({
  area: { w: SCENES.container_40hq.w, d: SCENES.container_40hq.d },
  sceneKey: 'container_40hq',
  pxPerMm: 0.05,
  gridMm: 100,
  snap: true,
  edgeSnap: true,
  showCollision: true,
  ortho: true,
  tool: 'select',
  draftWall: null,
  objects: [],
  walls: [],
  selectedIds: [],
  selectedId: null,
  selectedWallId: null,
  _past: [],
  _future: [],

  commit: () => {
    const s = get(); s._past.push(snapshot(s))
    if (s._past.length > 60) s._past.shift()
    set({ _past: s._past, _future: [] })
  },
  undo: () => {
    const s = get(); if (!s._past.length) return
    const prev = s._past.pop(); s._future.push(snapshot(s))
    set({ ...applySnap(prev), _past: s._past, _future: s._future, selectedIds: [], selectedId: null, selectedWallId: null })
  },
  redo: () => {
    const s = get(); if (!s._future.length) return
    const nxt = s._future.pop(); s._past.push(snapshot(s))
    set({ ...applySnap(nxt), _past: s._past, _future: s._future, selectedIds: [], selectedId: null, selectedWallId: null })
  },

  setScene: (key) => { const s = SCENES[key]; if (s) set({ sceneKey: key, area: { w: s.w, d: s.d } }) },
  setArea: (w, d) => set({ area: { w: Number(w), d: Number(d) } }),
  setPxPerMm: (v) => set({ pxPerMm: v }),
  setGridMm: (v) => set({ gridMm: Number(v) }),
  toggleSnap: () => set((s) => ({ snap: !s.snap })),
  toggleEdgeSnap: () => set((s) => ({ edgeSnap: !s.edgeSnap })),
  toggleCollision: () => set((s) => ({ showCollision: !s.showCollision })),
  toggleOrtho: () => set((s) => ({ ortho: !s.ortho })),

  setTool: (t) => set({ tool: t, draftWall: null, selectedIds: [], selectedId: null, selectedWallId: null }),

  wallAddPoint: (pt) => set((s) => {
    if (!s.draftWall) return { draftWall: { points: [pt], cursor: pt } }
    return { draftWall: { points: [...s.draftWall.points, pt], cursor: pt } }
  }),
  wallSetCursor: (pt) => set((s) => (s.draftWall ? { draftWall: { ...s.draftWall, cursor: pt } } : {})),
  wallFinish: () => {
    const s = get()
    if (s.draftWall && s.draftWall.points.length >= 2) {
      get().commit()
      set({ walls: [...s.walls, { id: nextId('wall'), points: s.draftWall.points, thickness: 100, h: 2800 }], draftWall: null })
    } else { set({ draftWall: null }) }
  },
  wallCancel: () => set({ draftWall: null }),

  // ---- 墙 ----
  selectWall: (id) => set({ selectedWallId: id, selectedIds: [], selectedId: null }),
  updateWall: (id, patch) => set((s) => {
    const walls = s.walls.map((w) => (w.id === id ? { ...w, ...patch } : w))
    return { walls, objects: reflowOpenings(s.objects, walls) }
  }),
  commitWall: (id, patch) => { get().commit(); get().updateWall(id, patch) },
  updateWallPoint: (id, index, x, y) => set((s) => {
    const walls = s.walls.map((w) => {
      if (w.id !== id) return w
      const pts = w.points.map((p, i) => (i === index ? [x, y] : p))
      return { ...w, points: pts }
    })
    return { walls, objects: reflowOpenings(s.objects, walls) }
  }),
  removeSelectedWall: () => {
    const s = get(); if (!s.selectedWallId) return
    get().commit()
    const walls = s.walls.filter((w) => w.id !== s.selectedWallId)
    const objects = s.objects.map((o) =>
      (o.isOpening && o.wallRef && o.wallRef.wallId === s.selectedWallId) ? { ...o, wallRef: null } : o
    )
    set({ walls, objects, selectedWallId: null })
  },

  // ---- 对象增删 ----
  addFromCatalog: (item) => {
    get().commit()
    const id = nextId()
    set((s) => ({ objects: [...s.objects, {
      id, type: item.type, name: item.name,
      x: 200 + Math.random() * 300, y: 200 + Math.random() * 200,
      w: item.w, d: item.d, h: item.h, rotation: 0,
      color: item.color, layer: item.layer, isOpening: !!item.isOpening, wallRef: null }],
      selectedIds: [id], selectedId: id, selectedWallId: null }))
  },
  addCustom: (name, w, d, h, layer) => {
    get().commit()
    const id = nextId()
    set((s) => ({ objects: [...s.objects, {
      id, type: 'custom', name: name || '自定义',
      x: 200, y: 200, w: Number(w), d: Number(d), h: Number(h) || 0,
      rotation: 0, color: '#a3e635', layer: Number(layer) || 0, isOpening: false, wallRef: null }],
      selectedIds: [id], selectedId: id, selectedWallId: null }))
  },

  updateObject: (id, patch) => set((s) => ({ objects: s.objects.map((o) => (o.id === id ? { ...o, ...patch } : o)) })),
  commitObject: (id, patch) => { get().commit(); get().updateObject(id, patch) },

  // ---- 多选 ----
  select: (id) => set({ selectedIds: id ? [id] : [], selectedId: id || null, selectedWallId: null }),
  toggleSelect: (id) => set((s) => {
    const has = s.selectedIds.includes(id)
    const ids = has ? s.selectedIds.filter((x) => x !== id) : [...s.selectedIds, id]
    return { selectedIds: ids, selectedId: primary(ids), selectedWallId: null }
  }),
  setSelection: (ids) => set({ selectedIds: ids, selectedId: primary(ids), selectedWallId: null }),
  clearSelection: () => set({ selectedIds: [], selectedId: null }),

  // 整组移动(dx,dy mm)。doCommit=true 时先存历史(键盘微调用)
  moveSelectedBy: (dx, dy, doCommit) => {
    const s = get(); if (!s.selectedIds.length) return
    if (doCommit) get().commit()
    set((st) => ({ objects: st.objects.map((o) => (st.selectedIds.includes(o.id) ? { ...o, x: o.x + dx, y: o.y + dy } : o)) }))
  },

  removeSelected: () => {
    const s = get(); if (!s.selectedIds.length) return
    get().commit()
    set({ objects: s.objects.filter((o) => !s.selectedIds.includes(o.id)), selectedIds: [], selectedId: null })
  },
  duplicateSelected: () => {
    const s = get(); if (!s.selectedIds.length) return
    get().commit()
    const copies = s.objects.filter((o) => s.selectedIds.includes(o.id))
      .map((o) => ({ ...o, id: nextId(), x: o.x + 100, y: o.y + 100, wallRef: null }))
    const ids = copies.map((c) => c.id)
    set({ objects: [...s.objects, ...copies], selectedIds: ids, selectedId: primary(ids) })
  },
  rotateSelected: () => {
    const s = get(); if (s.selectedIds.length !== 1) return
    const o = s.objects.find((x) => x.id === s.selectedIds[0]); if (!o) return
    get().commit(); get().updateObject(o.id, { rotation: (o.rotation + 90) % 360 })
  },
  clearAll: () => { get().commit(); set({ objects: [], walls: [], selectedIds: [], selectedId: null, selectedWallId: null, draftWall: null }) },

  exportJSON: () => {
    const s = get()
    return JSON.stringify({ version: '4.5', area: s.area, sceneKey: s.sceneKey, gridMm: s.gridMm, objects: s.objects, walls: s.walls }, null, 2)
  },
  importJSON: (text) => {
    try {
      const d = JSON.parse(text); get().commit()
      set({
        area: d.area || get().area, sceneKey: d.sceneKey || 'custom', gridMm: d.gridMm ?? 100,
        objects: (d.objects || []).map((o) => ({ wallRef: null, ...o, id: o.id || nextId() })),
        walls: (d.walls || []).map((w) => ({ ...w, id: w.id || nextId('wall') })),
        selectedIds: [], selectedId: null, selectedWallId: null, draftWall: null
      })
      return true
    } catch (e) { alert('JSON 解析失败: ' + e.message); return false }
  }
}))
