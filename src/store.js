import { create } from 'zustand'
import { SCENES } from './catalog.js'

let _id = 1
const nextId = (p = 'obj') => p + '-' + _id++
const snapshot = (s) => JSON.stringify({ objects: s.objects, walls: s.walls })
const applySnap = (str) => { const d = JSON.parse(str); return { objects: d.objects, walls: d.walls } }

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
    set({ ...applySnap(prev), _past: s._past, _future: s._future, selectedId: null, selectedWallId: null })
  },
  redo: () => {
    const s = get(); if (!s._future.length) return
    const nxt = s._future.pop(); s._past.push(snapshot(s))
    set({ ...applySnap(nxt), _past: s._past, _future: s._future, selectedId: null, selectedWallId: null })
  },

  setScene: (key) => { const s = SCENES[key]; if (s) set({ sceneKey: key, area: { w: s.w, d: s.d } }) },
  setArea: (w, d) => set({ area: { w: Number(w), d: Number(d) } }),
  setPxPerMm: (v) => set({ pxPerMm: v }),
  setGridMm: (v) => set({ gridMm: Number(v) }),
  toggleSnap: () => set((s) => ({ snap: !s.snap })),
  toggleEdgeSnap: () => set((s) => ({ edgeSnap: !s.edgeSnap })),
  toggleCollision: () => set((s) => ({ showCollision: !s.showCollision })),
  toggleOrtho: () => set((s) => ({ ortho: !s.ortho })),

  setTool: (t) => set({ tool: t, draftWall: null, selectedId: null, selectedWallId: null }),

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

  // ---- 墙选中 / 编辑 / 删除 ----
  selectWall: (id) => set({ selectedWallId: id, selectedId: null }),
  updateWall: (id, patch) => set((s) => ({ walls: s.walls.map((w) => (w.id === id ? { ...w, ...patch } : w)) })),
  commitWall: (id, patch) => { get().commit(); get().updateWall(id, patch) },
  updateWallPoint: (id, index, x, y) => set((s) => ({
    walls: s.walls.map((w) => {
      if (w.id !== id) return w
      const pts = w.points.map((p, i) => (i === index ? [x, y] : p))
      return { ...w, points: pts }
    })
  })),
  removeSelectedWall: () => {
    const s = get(); if (!s.selectedWallId) return
    get().commit()
    set({ walls: s.walls.filter((w) => w.id !== s.selectedWallId), selectedWallId: null })
  },

  addFromCatalog: (item) => {
    get().commit()
    set((s) => ({ objects: [...s.objects, {
      id: nextId(), type: item.type, name: item.name,
      x: 200 + Math.random() * 300, y: 200 + Math.random() * 200,
      w: item.w, d: item.d, h: item.h, rotation: 0,
      color: item.color, layer: item.layer, isOpening: !!item.isOpening }] }))
  },
  addCustom: (name, w, d, h, layer) => {
    get().commit()
    set((s) => ({ objects: [...s.objects, {
      id: nextId(), type: 'custom', name: name || '自定义',
      x: 200, y: 200, w: Number(w), d: Number(d), h: Number(h) || 0,
      rotation: 0, color: '#a3e635', layer: Number(layer) || 0, isOpening: false }] }))
  },

  updateObject: (id, patch) => set((s) => ({ objects: s.objects.map((o) => (o.id === id ? { ...o, ...patch } : o)) })),
  commitObject: (id, patch) => { get().commit(); get().updateObject(id, patch) },

  select: (id) => set({ selectedId: id, selectedWallId: null }),

  removeSelected: () => {
    const s = get(); if (!s.selectedId) return
    get().commit()
    set({ objects: s.objects.filter((o) => o.id !== s.selectedId), selectedId: null })
  },
  duplicateSelected: () => {
    const s = get(); const o = s.objects.find((x) => x.id === s.selectedId); if (!o) return
    get().commit()
    const copy = { ...o, id: nextId(), x: o.x + 100, y: o.y + 100 }
    set({ objects: [...s.objects, copy], selectedId: copy.id })
  },
  rotateSelected: () => {
    const s = get(); const o = s.objects.find((x) => x.id === s.selectedId); if (!o) return
    get().commit(); get().updateObject(o.id, { rotation: (o.rotation + 90) % 360 })
  },
  clearAll: () => { get().commit(); set({ objects: [], walls: [], selectedId: null, selectedWallId: null, draftWall: null }) },

  exportJSON: () => {
    const s = get()
    return JSON.stringify({ version: '4.2', area: s.area, sceneKey: s.sceneKey, gridMm: s.gridMm, objects: s.objects, walls: s.walls }, null, 2)
  },
  importJSON: (text) => {
    try {
      const d = JSON.parse(text); get().commit()
      set({
        area: d.area || get().area, sceneKey: d.sceneKey || 'custom', gridMm: d.gridMm ?? 100,
        objects: (d.objects || []).map((o) => ({ ...o, id: o.id || nextId() })),
        walls: (d.walls || []).map((w) => ({ ...w, id: w.id || nextId('wall') })),
        selectedId: null, selectedWallId: null, draftWall: null
      })
      return true
    } catch (e) { alert('JSON 解析失败: ' + e.message); return false }
  }
}))