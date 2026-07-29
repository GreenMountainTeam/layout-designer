import React, { useEffect } from 'react'
import Toolbar from './components/Toolbar.jsx'
import ComponentLibrary from './components/ComponentLibrary.jsx'
import CanvasStage from './components/CanvasStage.jsx'
import ThreeScene from './components/3d/ThreeScene.jsx'
import PropertyPanel from './components/PropertyPanel.jsx'
import StatsPanel from './components/StatsPanel.jsx'
import { useStore } from './store.js'

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

      // 墙选中
      if (s.selectedWallId) {
        if (e.key === 'Delete' || e.key === 'Backspace') { s.removeSelectedWall(); e.preventDefault(); return }
        if (e.key === 'Escape') { s.selectWall(null); return }
      }

      // 对象(单/多)
      const has = s.selectedIds.length > 0
      if (e.key === 'Delete' || e.key === 'Backspace') { if (has) { s.removeSelected(); e.preventDefault() } }
      else if (e.key === 'r' || e.key === 'R') { s.rotateSelected() }
      else if (e.ctrlKey && (e.key === 'd' || e.key === 'D')) { if (has) { s.duplicateSelected(); e.preventDefault() } }
      else if (e.key === 'Escape') { s.clearSelection() }
      else if (has && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        const step = e.shiftKey ? 100 : 10
        let dx = 0, dy = 0
        if (e.key === 'ArrowLeft') dx = -step
        if (e.key === 'ArrowRight') dx = step
        if (e.key === 'ArrowUp') dy = -step
        if (e.key === 'ArrowDown') dy = step
        s.moveSelectedBy(dx, dy, true)
        e.preventDefault()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [s.tool, s.selectedIds, s.selectedWallId])

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
          ? '✏️ 画墙:点击落点,连续点;Shift正交;双击或ESC完成'
          : '空白拖动=框选 · Shift点击=加选 · 拖动=整组移动 · Del删除 · Ctrl+D复制 · 3D单选可拖动手柄 · 📷截图'}
      </div>
    </div>
  )
}

const rightPanel = { width: 280, background: '#fff', borderLeft: '1px solid #e5e7eb', padding: 12, overflowY: 'auto' }
const footer = { minHeight: 34, background: '#111827', color: '#9ca3af', fontSize: 11, display: 'flex', alignItems: 'center', padding: '0 14px' }
