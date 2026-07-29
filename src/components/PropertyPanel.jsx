import React from 'react'
import { useStore } from '../store.js'
import { LAYER_NAMES } from '../catalog.js'

export default function PropertyPanel() {
  const { objects, walls, selectedId, selectedWallId,
          updateObject, commitObject, updateWall, commitWall, removeSelectedWall } = useStore()

  // ===== 墙属性面板 =====
  const wall = walls.find((w) => w.id === selectedWallId)
  if (wall) {
    let len = 0
    for (let i = 0; i < wall.points.length - 1; i++) {
      const [ax, ay] = wall.points[i], [bx, by] = wall.points[i + 1]
      len += Math.hypot(bx - ax, by - ay)
    }
    return (
      <div>
        <div style={{ ...row, color: '#2563eb', fontWeight: 600 }}>🧱 墙体已选中</div>
        <div style={row}>
          <label style={lab}>墙段数</label>
          <input style={{ ...inp, background: '#f3f4f6' }} value={wall.points.length - 1} readOnly />
        </div>
        <div style={row}>
          <label style={lab}>总长 (mm)</label>
          <input style={{ ...inp, background: '#f3f4f6' }} value={Math.round(len)} readOnly />
        </div>
        <div style={row}>
          <label style={lab}>墙厚 (mm)</label>
          <input style={inp} type="number" value={Math.round(wall.thickness)}
            onChange={(e) => updateWall(wall.id, { thickness: Number(e.target.value) })}
            onBlur={() => commitWall(wall.id, {})} />
        </div>
        <div style={row}>
          <label style={lab}>墙高 (mm)</label>
          <input style={inp} type="number" value={Math.round(wall.h)}
            onChange={(e) => updateWall(wall.id, { h: Number(e.target.value) })}
            onBlur={() => commitWall(wall.id, {})} />
        </div>
        <button style={delBtn} onClick={removeSelectedWall}>🗑️ 删除这面墙 (Del)</button>
        <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 8 }}>提示:在 2D 图里拖动蓝色端点可改变墙形状。</p>
      </div>
    )
  }

  // ===== 对象属性面板 =====
  const o = objects.find((x) => x.id === selectedId)
  if (!o) return <p style={{ color: '#9ca3af', fontSize: 13 }}>未选中对象。点击 2D/3D 里的物体或墙进行编辑。</p>

  const num = (label, key) => (
    <div style={row}>
      <label style={lab}>{label}</label>
      <input style={inp} type="number" value={Math.round(o[key])}
        onChange={(e) => updateObject(o.id, { [key]: Number(e.target.value) })}
        onBlur={() => commitObject(o.id, {})} />
    </div>
  )

  return (
    <div>
      <div style={row}>
        <label style={lab}>名称</label>
        <input style={inp} value={o.name} onChange={(e) => updateObject(o.id, { name: e.target.value })} />
      </div>
      <div style={row}>
        <label style={lab}>类型</label>
        <input style={{ ...inp, background: '#f3f4f6' }} value={o.type + (o.isOpening ? ' (门窗)' : '')} readOnly />
      </div>
      <div style={row}>
        <label style={lab}>图层 (Layer)</label>
        <select style={inp} value={o.layer} onChange={(e) => commitObject(o.id, { layer: Number(e.target.value) })}>
          {Object.entries(LAYER_NAMES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      {num('长 w (mm)', 'w')}
      {num('宽 d (mm)', 'd')}
      {num('高 h (mm)', 'h')}
      {num('X (mm)', 'x')}
      {num('Y (mm)', 'y')}
      {num('旋转 (°)', 'rotation')}
      <div style={row}>
        <label style={lab}>颜色</label>
        <input type="color" value={o.color} onChange={(e) => updateObject(o.id, { color: e.target.value })} style={{ width: '100%' }} />
      </div>
    </div>
  )
}

const row = { marginBottom: 8 }
const lab = { display: 'block', fontSize: 12, color: '#4b5563', marginBottom: 2 }
const inp = { width: '100%', padding: '4px 6px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 13 }
const delBtn = { width: '100%', marginTop: 8, padding: '8px', background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', borderRadius: 4, cursor: 'pointer', fontSize: 13 }
