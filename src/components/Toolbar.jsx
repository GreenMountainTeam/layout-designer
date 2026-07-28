import React, { useRef } from 'react'
import { useStore } from '../store.js'
import { SCENES } from '../catalog.js'

export default function Toolbar() {
  const s = useStore()
  const fileRef = useRef()

  const doExport = () => {
    const blob = new Blob([s.exportJSON()], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob); a.download = `layout_${Date.now()}.json`; a.click()
  }
  const doImport = (e) => {
    const f = e.target.files[0]; if (!f) return
    const r = new FileReader(); r.onload = () => s.importJSON(r.result); r.readAsText(f); e.target.value = ''
  }
  const toolBtn = (t, label) => (
    <button style={{ ...btn, ...(s.tool === t ? btnActive : {}) }} onClick={() => s.setTool(t)}>{label}</button>
  )

  return (
    <div style={bar}>
      <strong style={{ fontSize: 14 }}>📐 Layout Designer</strong><span style={ver}>v3.0</span>
      <div style={sep} />
      {toolBtn('select', '🖱️ 选择')}
      {toolBtn('wall', '✏️ 画墙')}
      {s.tool === 'wall' && (
        <>
          <label style={chk}><input type="checkbox" checked={s.ortho} onChange={s.toggleOrtho} /> 正交(Shift)</label>
          <button style={btn} onClick={s.wallFinish}>✓ 完成(ESC)</button>
        </>
      )}
      <div style={sep} />
      <span style={lbl}>场景</span>
      <select value={s.sceneKey} style={sel} onChange={(e) => s.setScene(e.target.value)}>
        {Object.entries(SCENES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
      </select>
      <input style={numIn} type="number" value={s.area.w} onChange={(e) => s.setArea(e.target.value, s.area.d)} title="长(mm)" />
      <span>×</span>
      <input style={numIn} type="number" value={s.area.d} onChange={(e) => s.setArea(s.area.w, e.target.value)} title="宽(mm)" />
      <div style={sep} />
      <span style={lbl}>网格</span>
      <select value={s.gridMm} style={sel} onChange={(e) => s.setGridMm(e.target.value)}>
        <option value={0}>关闭</option><option value={50}>50</option><option value={100}>100</option>
        <option value={500}>500</option><option value={1000}>1000</option>
      </select>
      <label style={chk}><input type="checkbox" checked={s.snap} onChange={s.toggleSnap} /> 网格吸附</label>
      <label style={chk}><input type="checkbox" checked={s.edgeSnap} onChange={s.toggleEdgeSnap} /> 贴紧</label>
      <label style={chk}><input type="checkbox" checked={s.showCollision} onChange={s.toggleCollision} /> 碰撞</label>
      <div style={sep} />
      <button style={btn} onClick={s.undo} title="撤销 Ctrl+Z">↶</button>
      <button style={btn} onClick={s.redo} title="重做 Ctrl+Y">↷</button>
      <button style={btn} onClick={s.rotateSelected} disabled={!s.selectedId}>↻90°</button>
      <button style={btn} onClick={s.duplicateSelected} disabled={!s.selectedId}>📋</button>
      <button style={btn} onClick={s.removeSelected} disabled={!s.selectedId}>🗑️</button>
      <button style={btn} onClick={() => { if (confirm('清空全部?')) s.clearAll() }}>清空</button>
      <div style={{ ...sep, marginLeft: 'auto' }} />
      <button style={btn} onClick={doExport}>💾 保存</button>
      <button style={btn} onClick={() => fileRef.current.click()}>📂 加载</button>
      <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={doImport} />
    </div>
  )
}

const bar = { background: '#1f2937', color: '#fff', minHeight: 48, padding: '0 12px', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'nowrap', overflowX: 'auto' }
const ver = { fontSize: 11, opacity: 0.6 }
const sep = { width: 1, height: 22, background: '#4b5563', margin: '0 3px' }
const lbl = { fontSize: 12, opacity: 0.8 }
const sel = { background: '#374151', color: '#fff', border: '1px solid #4b5563', borderRadius: 4, padding: '4px 6px', fontSize: 12 }
const numIn = { width: 66, background: '#374151', color: '#fff', border: '1px solid #4b5563', borderRadius: 4, padding: '4px 6px', fontSize: 12 }
const chk = { fontSize: 12, display: 'flex', alignItems: 'center', gap: 3, whiteSpace: 'nowrap' }
const btn = { background: '#374151', color: '#fff', border: '1px solid #4b5563', borderRadius: 4, padding: '4px 8px', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }
const btnActive = { background: '#2563eb', borderColor: '#3b82f6' }
