import React from 'react'
import { useStore } from '../store.js'
import { LAYER_NAMES } from '../catalog.js'

export default function PropertyPanel() {
  const { objects, selectedId, updateObject, commitObject } = useStore()
  const o = objects.find((x) => x.id === selectedId)
  if (!o) return <p style={{ color: '#9ca3af', fontSize: 13 }}>未选中对象。点击画布上的物体进行编辑。</p>

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
      {num('高 h (mm, 3D预留)', 'h')}
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
