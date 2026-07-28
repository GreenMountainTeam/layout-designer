// 吸附工具集(单位 mm)
export function snapGrid(v, gridMm, on) {
  return on && gridMm ? Math.round(v / gridMm) * gridMm : v
}

function aabb(o, x = o.x, y = o.y) {
  const rot = ((o.rotation % 360) + 360) % 360
  const swap = rot === 90 || rot === 270
  const w = swap ? o.d : o.w
  const d = swap ? o.w : o.d
  return { x1: x, y1: y, x2: x + w, y2: y + d, w, d }
}

// 边缘贴紧:返回 { x, y, guides }
export function edgeSnap(moving, others, cx, cy, thresholdMm) {
  const box = aabb(moving, cx, cy)
  const mv = { left: box.x1, right: box.x2, cxx: box.x1 + box.w / 2, top: box.y1, bottom: box.y2, cyy: box.y1 + box.d / 2 }
  let dx = null, dy = null
  const guides = []

  for (const o of others) {
    if (o.id === moving.id) continue
    if ((o.layer || 0) !== (moving.layer || 0)) continue
    if (o.isOpening) continue
    const b = aabb(o)
    const ob = { left: b.x1, right: b.x2, cxx: b.x1 + b.w / 2, top: b.y1, bottom: b.y2, cyy: b.y1 + b.d / 2 }
    const xPairs = [[mv.left, ob.left], [mv.left, ob.right], [mv.right, ob.left], [mv.right, ob.right], [mv.cxx, ob.cxx]]
    for (const [m, t] of xPairs) {
      const diff = t - m
      if (Math.abs(diff) <= thresholdMm && (dx === null || Math.abs(diff) < Math.abs(dx))) dx = diff
    }
    const yPairs = [[mv.top, ob.top], [mv.top, ob.bottom], [mv.bottom, ob.top], [mv.bottom, ob.bottom], [mv.cyy, ob.cyy]]
    for (const [m, t] of yPairs) {
      const diff = t - m
      if (Math.abs(diff) <= thresholdMm && (dy === null || Math.abs(diff) < Math.abs(dy))) dy = diff
    }
  }

  const nx = cx + (dx || 0)
  const ny = cy + (dy || 0)
  const nb = aabb(moving, nx, ny)

  if (dx !== null) {
    for (const o of others) {
      if (o.id === moving.id || (o.layer || 0) !== (moving.layer || 0) || o.isOpening) continue
      const b = aabb(o)
      const xs = [b.x1, b.x2, b.x1 + b.w / 2]
      const mxs = [nb.x1, nb.x2, nb.x1 + nb.w / 2]
      for (const xv of xs) for (const m2 of mxs) {
        if (Math.abs(xv - m2) < 0.5) guides.push({ vertical: true, pos: xv, a: Math.min(b.y1, nb.y1), b: Math.max(b.y2, nb.y2) })
      }
    }
  }
  if (dy !== null) {
    for (const o of others) {
      if (o.id === moving.id || (o.layer || 0) !== (moving.layer || 0) || o.isOpening) continue
      const b = aabb(o)
      const ys = [b.y1, b.y2, b.y1 + b.d / 2]
      const mys = [nb.y1, nb.y2, nb.y1 + nb.d / 2]
      for (const yv of ys) for (const m2 of mys) {
        if (Math.abs(yv - m2) < 0.5) guides.push({ vertical: false, pos: yv, a: Math.min(b.x1, nb.x1), b: Math.max(b.x2, nb.x2) })
      }
    }
  }
  return { x: nx, y: ny, guides }
}

function projectPointToSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay
  const len2 = dx * dx + dy * dy
  if (len2 === 0) return { x: ax, y: ay, t: 0 }
  let t = ((px - ax) * dx + (py - ay) * dy) / len2
  t = Math.max(0, Math.min(1, t))
  return { x: ax + t * dx, y: ay + t * dy, t }
}

// 门窗吸附到最近墙段。返回 {x,y,rotation}(x,y 为左上角 mm)
export function snapToWall(opening, walls, maxDistMm) {
  const cx = opening.x + opening.w / 2
  const cy = opening.y + opening.d / 2
  let best = null
  for (const wall of walls) {
    const pts = wall.points
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, ay] = pts[i], [bx, by] = pts[i + 1]
      const pr = projectPointToSeg(cx, cy, ax, ay, bx, by)
      const dist = Math.hypot(cx - pr.x, cy - pr.y)
      if (best === null || dist < best.dist) {
        best = { dist, px: pr.x, py: pr.y, ang: Math.atan2(by - ay, bx - ax) * 180 / Math.PI }
      }
    }
  }
  if (!best || best.dist > maxDistMm) return null
  const rot = ((best.ang % 360) + 360) % 360
  const rad = rot * Math.PI / 180
  const ox = (opening.w / 2) * Math.cos(rad) - (opening.d / 2) * Math.sin(rad)
  const oy = (opening.w / 2) * Math.sin(rad) + (opening.d / 2) * Math.cos(rad)
  return { x: best.px - ox, y: best.py - oy, rotation: Math.round(rot) }
}
