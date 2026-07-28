import React, { useEffect } from 'react'
import Toolbar from './components/Toolbar.jsx'
import ComponentLibrary from './components/ComponentLibrary.jsx'
import CanvasStage from './components/CanvasStage.jsx'
import PropertyPanel from './components/PropertyPanel.jsx'
import StatsPanel from './components/StatsPanel.jsx'
import { useStore } from './store.js'
import ThreeScene from "./components/3d/ThreeScene.jsx";

export default function App() {
  const s = useStore()

  useEffect(() => {
    const onKey = (e) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return
      if (s.tool === 'wall') {
        if (e.key === 'Escape' || e.key === 'Enter') { s.wallFinish(); s.setTool('select'); e.preventDefault(); return }
      }
      if (e.ctrlKey && (e.key === 'z' || e.key === 'Z')) { s.undo(); e.preventDefault(); return }
      if (e.ctrlKey && (e.key === 'y' || e.key === 'Y')) { s.redo(); e.preventDefault(); return }
      const o = s.objects.find((x) => x.id === s.selectedId)
      if (e.key === 'Delete' || e.key === 'Backspace') { s.removeSelected(); e.preventDefault() }
      else if (e.key === 'r' || e.key === 'R') { s.rotateSelected() }
      else if (e.ctrlKey && (e.key === 'd' || e.key === 'D')) { s.duplicateSelected(); e.preventDefault() }
      else if (o && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        const step = e.shiftKey ? 100 : 10
        const patch = {}
        if (e.key === 'ArrowLeft') patch.x = o.x - step
        if (e.key === 'ArrowRight') patch.x = o.x + step
        if (e.key === 'ArrowUp') patch.y = o.y - step
        if (e.key === 'ArrowDown') patch.y = o.y + step
        s.commitObject(o.id, patch); e.preventDefault()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [s.tool, s.selectedId, s.objects])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <ComponentLibrary />
        <CanvasStage />
        <ThreeScene />
        <div style={rightPanel}>
          <h3 style={{ fontSize: 14, marginBottom: 8, borderBottom: '1px solid #eee', paddingBottom: 6 }}>🎯 属性</h3>
          <PropertyPanel />
          <StatsPanel />
        </div>
      </div>
      <div style={footer}>
        {s.tool === 'wall'
          ? '✏️ 画墙:点击落点,连续点下一点;按住Shift正交;双击或ESC完成'
          : 'R=旋转 · Del=删除 · Ctrl+D=复制 · Ctrl+Z/Y=撤销/重做 · 方向键=移动10mm(Shift=100mm) · 门窗拖到墙上自动吸附'}
      </div>
    </div>
  )
}

const rightPanel = { width: 280, background: '#fff', borderLeft: '1px solid #e5e7eb', padding: 12, overflowY: 'auto' }
const footer = { minHeight: 34, background: '#111827', color: '#9ca3af', fontSize: 11, display: 'flex', alignItems: 'center', padding: '0 14px' }
