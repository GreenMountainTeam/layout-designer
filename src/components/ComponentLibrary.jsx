import React from 'react'
import { CATALOG } from '../catalog.js'
import { useStore } from '../store.js'

export default function ComponentLibrary() {
  const addFromCatalog = useStore((s) => s.addFromCatalog)
  const addCustom = useStore((s) => s.addCustom)

  const handleCustom = () => {
    const name = prompt('对象名称:', '自定义'); if (!name) return
    const w = Number(prompt('长 w (mm):', '500')); if (!w) return
    const d = Number(prompt('宽 d (mm):', '500')); if (!d) return
    const h = Number(prompt('高 h (mm,可留空):', '0')) || 0
    const layer = Number(prompt('图层 (0地面/1台面/2顶层):', '0')) || 0
    addCustom(name, w, d, h, layer)
  }

  return (
    <div style={wrap}>
      {Object.entries(CATALOG).map(([key, mod]) => (
        <div key={key} style={{ marginBottom: 10 }}>
          <div style={groupTitle}>{mod.label}</div>
          {mod.items.map((item) => (
            <button key={item.type} style={itemBtn} onClick={() => addFromCatalog(item)} title={`${item.w}×${item.d}×${item.h} mm`}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ ...swatch, background: item.color }} />{item.name}
              </span>
              <span style={dim}>{item.w}×{item.d}</span>
              <span style={{ ...badge, ...(item.layer > 0 ? badgeL1 : {}) }}>L{item.layer}</span>
            </button>
          ))}
        </div>
      ))}
      <div style={groupTitle}>➕ 自定义</div>
      <button style={itemBtn} onClick={handleCustom}>自定义矩形…</button>
    </div>
  )
}

const wrap = { width: 210, background: '#fff', borderRight: '1px solid #e5e7eb', padding: 10, overflowY: 'auto' }
const groupTitle = { fontSize: 12, fontWeight: 600, color: '#374151', margin: '8px 0 6px', borderBottom: '1px solid #eee', paddingBottom: 4 }
const itemBtn = { width: '100%', margin: '3px 0', padding: '6px 8px', textAlign: 'left', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 4, cursor: 'pointer', fontSize: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4 }
const dim = { color: '#6b7280', fontSize: 11 }
const swatch = { width: 12, height: 12, borderRadius: 2, border: '1px solid #ccc', display: 'inline-block' }
const badge = { background: '#e5e7eb', color: '#374151', padding: '1px 5px', borderRadius: 8, fontSize: 10 }
const badgeL1 = { background: '#fde68a', color: '#78350f' }
