// V4.5 3D 空间碰撞:水平投影重叠 且 高度区间重叠 才算碰撞
import { footprint, overlapArea } from './layout.js'

const EPS = 1 // mm

export function detectCollisions(objects, baseY = {}) {
  const hits = new Set()
  const list = objects.filter((o) => !o.isOpening)
  const fps = list.map((o) => footprint(o))
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const a = list[i], b = list[j]
      const hOv = overlapArea(fps[i], fps[j])
      if (hOv <= EPS) continue
      const za0 = baseY[a.id] || 0, za1 = za0 + (a.h || 0)
      const zb0 = baseY[b.id] || 0, zb1 = zb0 + (b.h || 0)
      const vOv = Math.min(za1, zb1) - Math.max(za0, zb0)
      if (vOv > EPS) { hits.add(a.id); hits.add(b.id) }
    }
  }
  return hits
}
