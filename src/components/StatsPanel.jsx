import React, { useMemo } from 'react'
import { useStore } from '../store.js'
import { detectCollisions } from '../utils/collision.js'
import { computeBaseY } from '../utils/layout.js'

export default function StatsPanel() {
  const { objects, walls, area } = useStore()

  const stats = useMemo(() => {
    const areaM2 = (area.w * area.d) / 1e6
    let usedL0 = 0, usedL1 = 0
    objects.forEach((o) => {
      if (o.isOpening) return
      const a = (o.w * o.d) / 1e6
      if ((o.layer || 0) === 0) usedL0 += a
      else if ((o.layer || 0) === 1) usedL1 += a
    })
    let wallLen = 0
    walls.forEach((w) => {
      for (let i = 0; i < w.points.length - 1; i++) {
        const [ax, ay] = w.points[i], [bx, by] = w.points[i + 1]
        wallLen += Math.hypot(bx - ax, by - ay)
      }
    })
    const collisions = detectCollisions(objects, computeBaseY(objects)).size
    return {
      areaM2, count: objects.length, walls: walls.length, wallLenM: wallLen / 1000,
      usedL0, usedL1, ratio: areaM2 ? (usedL0 / areaM2) * 100 : 0, collisions
    }
  }, [objects, walls, area])

  const line = (label, value) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '2px 0' }}>
      <span style={{ color: '#6b7280' }}>{label}</span><b>{value}</b>
    </div>
  )

  return (
    <div style={{ marginTop: 14 }}>
      <h3 style={{ fontSize: 14, marginBottom: 8, borderBottom: '1px solid #eee', paddingBottom: 6 }}>📊 统计</h3>
      {line('区域', `${area.w}×${area.d} mm`)}
      {line('区域面积', `${stats.areaM2.toFixed(2)} m²`)}
      {line('对象数', stats.count)}
      {line('墙段数', stats.walls)}
      {line('墙总长', `${stats.wallLenM.toFixed(2)} m`)}
      {line('L0 地面占用', `${stats.usedL0.toFixed(2)} m²`)}
      {line('L1 台面占用', `${stats.usedL1.toFixed(2)} m²`)}
      {line('地面利用率', `${stats.ratio.toFixed(1)}%`)}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', marginTop: 4, borderTop: '1px dashed #eee' }}>
        <span style={{ color: '#6b7280' }}>碰撞(3D)</span>
        <b style={{ color: stats.collisions > 0 ? '#dc2626' : '#16a34a' }}>
          {stats.collisions > 0 ? `🔴 ${stats.collisions} 处` : '🟢 无'}
        </b>
      </div>
    </div>
  )
}
