import React, { useState } from 'react'
import { useStore } from '../store.js'
import { LAYER_NAMES } from '../catalog.js'

function ArrayFill() {
  const arrayFill = useStore((s) => s.arrayFill)
  const [nx, setNx] = useState(3)
  const [ny, setNy] = useState(2)
  const [gap, setGap] = useState(20)
  const [mode, setMode] = useState('uniform')
  return (
    <div style={{ marginTop: 10, padding: 8, background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 4 }}>
      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>🔢 阵列填充</div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
        <label style={{ flex: 1, fontSize: 12 }}>列(X)<input style={inp} type="number" value={nx} onChange={(e) => setNx(+e.target.value)} /></label>
        <label style={{ flex: 1, fontSize: 12 }}>行(Y)<input style={inp} type="number" value={ny} onChange={(e) => setNy(+e.target.value)} /></label>
      </div>
      <label style={{ display: 'block', fontSize: 12, marginBottom: 6 }}>间距(mm)<input style={inp} type="number" value={gap} onChange={(e) => setGap(+e.target.value)} /></label>
      <label style={{ display: 'block', fontSize: 12, marginBottom: 6 }}>朝向
        <select style={inp} value={mode} onChange={(e) => setMode(e.target.value)}>
          <option value="uniform">统一朝向</option>
          <option value="brick">交替行旋转90°(砖砌)</option>
        </select>
      </label>
      <button style={okBtn} onClick={() => arrayFill(nx, ny, gap, gap, mode)}>生成阵列</button>
      <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>以当前对象为起点向右下方阵列。砖砌模式步长按长边,避免重叠。</p>
    </div>
  )
}

export default function PropertyPanel() {
  const { objects, walls, annotations, selectedIds, selectedId, selectedWallId,
          updateObject, commitObject, updateWall, commitWall, removeSelectedWall,
          removeSelected, duplicateSelected } = useStore()

  // 墙
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
        <div style={row}><label style={lab}>墙段数</label><input style={{ ...inp, background: '#f3f4f6' }} value={wall.points.length - 1} readOnly /></div>
        <div style={row}><label style={lab}>总长 (mm)</label><input style={{ ...inp, background: '#f3f4f6' }} value={Math.round(len)} readOnly /></div>
        <div style={row}><label style={lab}>墙厚 (mm)</label><input style={inp} type="number" value={Math.round(wall.thickness)} onChange={(e) => updateWall(wall.id, { thickness: +e.target.value })} onBlur={() => commitWall(wall.id, {})} /></div>
        <div style={row}><label style={lab}>墙高 (mm)</label><input style={inp} type="number" value={Math.round(wall.h)} onChange={(e) => updateWall(wall.id, { h: +e.target.value })} onBlur={() => commitWall(wall.id, {})} /></div>
        <button style={delBtn} onClick={removeSelectedWall}>🗑️ 删除这面墙 (Del)</button>
      </div>
    )
  }

  // 多选
  if (selectedIds.length > 1) {
    return (
      <div>
        <div style={{ ...row, color: '#2563eb', fontWeight: 600 }}>🔲 已选中 {selectedIds.length} 个对象</div>
        <p style={{ fontSize: 12, color: '#6b7280' }}>可整组拖动移动。</p>
        <button style={okBtn} onClick={duplicateSelected}>📋 复制这组 (Ctrl+D)</button>
        <button style={delBtn} onClick={removeSelected}>🗑️ 删除这组 (Del)</button>
      </div>
    )
  }

  const o = objects.find((x) => x.id === selectedId)
  if (!o) return <p style={{ color: '#9ca3af', fontSize: 13 }}>未选中对象。点击物体,或空白处框选多个。测量/标注见顶部工具。</p>

  const num = (label, key) => (
    <div style={row}>
      <label style={lab}>{label}</label>
      <input style={inp} type="number" value={Math.round(o[key])}
        onChange={(e) => updateObject(o.id, { [key]: +e.target.value })}
        onBlur={() => commitObject(o.id, {})} />
    </div>
  )

  return (
    <div>
      <div style={row}><label style={lab}>名称</label><input style={inp} value={o.name} onChange={(e) => updateObject(o.id, { name: e.target.value })} /></div>
      <div style={row}><label style={lab}>类型</label><input style={{ ...inp, background: '#f3f4f6' }} value={o.type + (o.isOpening ? ' (门窗)' : '')} readOnly /></div>
      <div style={row}>
        <label style={lab}>图层 (Layer)</label>
        <select style={inp} value={o.layer} onChange={(e) => commitObject(o.id, { layer: +e.target.value })}>
          {Object.entries(LAYER_NAMES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      {num('长 w (mm)', 'w')}
      {num('宽 d (mm)', 'd')}
      {num('高 h (mm)', 'h')}
      {num('X (mm)', 'x')}
      {num('Y (mm)', 'y')}
      {num('旋转 (°)', 'rotation')}
      <div style={row}><label style={lab}>颜色</label><input type="color" value={o.color} onChange={(e) => updateObject(o.id, { color: e.target.value })} style={{ width: '100%' }} /></div>
      {!o.isOpening && <ArrayFill />}
    </div>
  )
}

const row = { marginBottom: 8 }
const lab = { display: 'block', fontSize: 12, color: '#4b5563', marginBottom: 2 }
const inp = { width: '100%', padding: '4px 6px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 13 }
const delBtn = { width: '100%', marginTop: 8, padding: '8px', background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', borderRadius: 4, cursor: 'pointer', fontSize: 13 }
const okBtn = { width: '100%', marginTop: 6, padding: '8px', background: '#dbeafe', color: '#1d4ed8', border: '1px solid #93c5fd', borderRadius: 4, cursor: 'pointer', fontSize: 13 }
