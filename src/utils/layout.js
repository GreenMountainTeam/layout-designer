// ============================================================
// V4.5 共享几何/布局工具(2D 与 3D 共用)
//  - realCenter   : 物体真实几何中心(考虑旋转)
//  - footprint    : 旋转后的轴对齐外接矩形(mm)
//  - overlapArea  : 两 footprint 的水平重叠面积
//  - projectOpeningToWall / openingFromRef / reflowOpenings : 门窗贴墙
//  - computeBaseY : 堆叠——箱子底面 = 水平重叠到的下方箱子中最高的顶面
//                   (不可穿透模型,修复"合计重叠却掉底层"的 bug)
//  - analyze / CONTAINER_H : 装载率/剩余体积/容器净高
// 所有坐标单位 mm。x,y 为对象【左上角】。
// ============================================================

export function realCenter(o) {
  const rad = ((o.rotation || 0) * Math.PI) / 180
  const cos = Math.cos(rad), sin = Math.sin(rad)
  return {
    cx: o.x + (o.w / 2) * cos - (o.d / 2) * sin,
    cy: o.y + (o.w / 2) * sin + (o.d / 2) * cos
  }
}

export function footprint(o) {
  const c = realCenter(o)
  const rot = (((o.rotation || 0) % 360) + 360) % 360
  const swap = rot === 90 || rot === 270
  const w = swap ? o.d : o.w
  const d = swap ? o.w : o.d
  return { x1: c.cx - w / 2, y1: c.cy - d / 2, x2: c.cx + w / 2, y2: c.cy + d / 2 }
}

export function areaOf(fp) { return (fp.x2 - fp.x1) * (fp.y2 - fp.y1) }

export function overlapArea(a, b) {
  const ox = Math.max(0, Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1))
  const oy = Math.max(0, Math.min(a.y2, b.y2) - Math.max(a.y1, b.y1))
  return ox * oy
}

// ---------- 门窗贴墙 ----------
function segList(walls) {
  const segs = []
  walls.forEach((w) => {
    for (let i = 0; i < w.points.length - 1; i++) {
      segs.push({ wallId: w.id, index: i, a: w.points[i], b: w.points[i + 1], thickness: w.thickness, h: w.h })
    }
  })
  return segs
}
function projectPointToSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay
  const len2 = dx * dx + dy * dy
  if (len2 === 0) return { x: ax, y: ay, t: 0 }
  let t = ((px - ax) * dx + (py - ay) * dy) / len2
  t = Math.max(0, Math.min(1, t))
  return { x: ax + t * dx, y: ay + t * dy, t }
}

export function projectOpeningToWall(op, walls, maxDistMm = 600) {
  const c = realCenter(op)
  let best = null
  segList(walls).forEach((s) => {
    const [ax, ay] = s.a, [bx, by] = s.b
    const pr = projectPointToSeg(c.cx, c.cy, ax, ay, bx, by)
    const dist = Math.hypot(c.cx - pr.x, c.cy - pr.y)
    if (best === null || dist < best.dist) best = { dist, pr, s }
  })
  if (!best || best.dist > maxDistMm) return null
  return openingFromRef(op, { wallId: best.s.wallId, index: best.s.index, t: best.pr.t }, walls)
}

export function openingFromRef(op, ref, walls) {
  const wall = walls.find((w) => w.id === ref.wallId)
  if (!wall || ref.index >= wall.points.length - 1) return null
  const [ax, ay] = wall.points[ref.index]
  const [bx, by] = wall.points[ref.index + 1]
  const px = ax + (bx - ax) * ref.t
  const py = ay + (by - ay) * ref.t
  const rotation = Math.round(((Math.atan2(by - ay, bx - ax) * 180 / Math.PI) % 360 + 360) % 360)
  const rad = rotation * Math.PI / 180
  const ox = (op.w / 2) * Math.cos(rad) - (op.d / 2) * Math.sin(rad)
  const oy = (op.w / 2) * Math.sin(rad) + (op.d / 2) * Math.cos(rad)
  return { x: px - ox, y: py - oy, rotation, wallRef: { wallId: ref.wallId, index: ref.index, t: ref.t } }
}

export function reflowOpenings(objects, walls) {
  return objects.map((o) => {
    if (!o.isOpening || !o.wallRef) return o
    const r = openingFromRef(o, o.wallRef, walls)
    if (!r) return o
    return { ...o, x: r.x, y: r.y, rotation: r.rotation }
  })
}

// ---------- 堆叠(最高顶面 / 不可穿透) ----------
const MIN_OVERLAP_RATIO = 0.05 // 过滤浮点/吸附噪声
export function computeBaseY(objects) {
  const solids = objects.filter((o) => !o.isOpening)
  const fps = solids.map((o) => footprint(o))
  const areas = fps.map((f) => areaOf(f))
  const baseY = {}
  for (let i = 0; i < solids.length; i++) {
    let top = 0
    for (let j = 0; j < i; j++) {
      const ov = overlapArea(fps[i], fps[j])
      const minA = Math.min(areas[i], areas[j])
      if (minA > 0 && ov / minA >= MIN_OVERLAP_RATIO) {
        const t = (baseY[solids[j].id] || 0) + (solids[j].h || 0)
        if (t > top) top = t
      }
    }
    baseY[solids[i].id] = top
  }
  return baseY
}

// ---------- 分析 ----------
const CONTAINER_H = { container_40hq: 2694, container_20gp: 2393, room: 2800, desk: 2000, custom: 2500 }
export function analyze(objects, area, sceneKey) {
  const areaMm2 = area.w * area.d
  const ch = CONTAINER_H[sceneKey] || 2500
  const totalM3 = (areaMm2 * ch) / 1e9
  let floorMm2 = 0, volMm3 = 0, count = 0
  objects.forEach((o) => {
    if (o.isOpening) return
    count++
    if ((o.layer || 0) === 0) floorMm2 += o.w * o.d
    volMm3 += o.w * o.d * (o.h || 0)
  })
  const usedM3 = volMm3 / 1e9
  return {
    floorPct: areaMm2 ? (floorMm2 / areaMm2) * 100 : 0,
    volPct: totalM3 ? (usedM3 / totalM3) * 100 : 0,
    usedM3, totalM3, remainM3: Math.max(0, totalM3 - usedM3),
    count, containerH: ch
  }
}

export { CONTAINER_H }
