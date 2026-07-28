// 同层碰撞检测(旋转按 90/270 换宽高的 AABB 近似)
function getAABB(o) {
  const rot = ((o.rotation % 360) + 360) % 360
  const swap = rot === 90 || rot === 270
  const w = swap ? o.d : o.w
  const d = swap ? o.w : o.d
  return { x1: o.x, y1: o.y, x2: o.x + w, y2: o.y + d }
}
function overlap(a, b) {
  return !(a.x2 <= b.x1 || b.x2 <= a.x1 || a.y2 <= b.y1 || b.y2 <= a.y1)
}
export function detectCollisions(objects) {
  const hits = new Set()
  const list = objects.filter((o) => !o.isOpening)
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const a = list[i], b = list[j]
      if ((a.layer || 0) !== (b.layer || 0)) continue
      if (overlap(getAABB(a), getAABB(b))) { hits.add(a.id); hits.add(b.id) }
    }
  }
  return hits
}
export { getAABB }
