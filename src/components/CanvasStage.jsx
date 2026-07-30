import React, { useRef, useEffect, useMemo, useState } from 'react'
import { Stage, Layer, Rect, Text, Line, Group, Transformer, Arc, Circle, Label, Tag } from 'react-konva'
import { useStore } from '../store.js'
import { detectCollisions } from '../utils/collision.js'
import { snapGrid, edgeSnap } from '../utils/snapping.js'
import { projectOpeningToWall, computeBaseY, footprint, CONTAINER_H } from '../utils/layout.js'
import { FLOOR_COLOR } from '../catalog.js'

function RectNode({ o, px, ox, oy, isSel, collided, over, onSelect, onDragStart, onDragEnd, onDragMove }) {
  const ref = useRef(); const trRef = useRef()
  useEffect(() => {
    if (isSel && trRef.current && ref.current) { trRef.current.nodes([ref.current]); trRef.current.getLayer().batchDraw() }
  }, [isSel])
  const wPx = o.w * px, dPx = o.d * px
  const stroke = collided || over ? '#dc2626' : isSel ? '#2563eb' : '#374151'
  return (
    <>
      <Group ref={ref} x={ox + o.x * px} y={oy + o.y * px} rotation={o.rotation} draggable
        onClick={(e) => onSelect(e)} onTap={(e) => onSelect(e)} opacity={o.layer > 0 ? 0.88 : 1}
        onDragStart={(e) => onDragStart(e.target)}
        onDragMove={(e) => onDragMove(e.target)}
        onDragEnd={(e) => onDragEnd(e.target)}>
        <Rect width={wPx} height={dPx} fill={o.color} stroke={stroke}
          strokeWidth={collided || over ? 3 : isSel ? 2 : 1} dash={over ? [6, 4] : undefined} />
        <Text width={wPx} height={dPx}
          text={`${o.name}\n${Math.round(o.w)}×${Math.round(o.d)}\n[L${o.layer}]`}
          fontSize={Math.max(9, Math.min(13, wPx / 12))} align="center" verticalAlign="middle" listening={false} />
      </Group>
      {isSel && <Transformer ref={trRef} rotationSnaps={[0, 90, 180, 270]}
        boundBoxFunc={(ob, nb) => (nb.width < 20 || nb.height < 20 ? ob : nb)} />}
    </>
  )
}

function OpeningNode({ o, px, ox, oy, isSel, onSelect, onDragStart, onDragEnd, onDragMove }) {
  const ref = useRef(); const trRef = useRef()
  useEffect(() => {
    if (isSel && trRef.current && ref.current) { trRef.current.nodes([ref.current]); trRef.current.getLayer().batchDraw() }
  }, [isSel])
  const wPx = o.w * px, dPx = o.d * px
  const isDoor = o.type === 'door' || o.type === 'double_door'
  return (
    <>
      <Group ref={ref} x={ox + o.x * px} y={oy + o.y * px} rotation={o.rotation} draggable
        onClick={(e) => onSelect(e)} onTap={(e) => onSelect(e)}
        onDragStart={(e) => onDragStart(e.target)}
        onDragMove={(e) => onDragMove(e.target)}
        onDragEnd={(e) => onDragEnd(e.target)}>
        <Rect width={wPx} height={dPx} fill={FLOOR_COLOR} stroke={isSel ? '#2563eb' : '#9ca3af'} strokeWidth={isSel ? 2 : 1} />
        {isDoor ? (
          <>
            <Line points={[0, dPx / 2, wPx, dPx / 2]} stroke={o.color} strokeWidth={2} />
            <Arc x={0} y={dPx / 2} innerRadius={0} outerRadius={wPx} angle={90} rotation={-90} stroke={o.color} strokeWidth={1.5} dash={[4, 3]} />
            <Line points={[0, dPx / 2, 0, dPx / 2 - wPx]} stroke={o.color} strokeWidth={2} />
          </>
        ) : (
          <>
            <Line points={[0, dPx * 0.35, wPx, dPx * 0.35]} stroke={o.color} strokeWidth={2} />
            <Line points={[0, dPx * 0.65, wPx, dPx * 0.65]} stroke={o.color} strokeWidth={2} />
          </>
        )}
        <Text width={wPx} y={dPx + 2} text={`${o.name} ${Math.round(o.w)}`} fontSize={10} align="center" listening={false} />
      </Group>
      {isSel && <Transformer ref={trRef} rotationSnaps={[0, 90, 180, 270]} enabledAnchors={['middle-left', 'middle-right']}
        boundBoxFunc={(ob, nb) => (nb.width < 20 ? ob : nb)} />}
    </>
  )
}

export default function CanvasStage() {
  const s = useStore()
  const { objects, walls, annotations, selectedIds, selectedWallId, area, gridMm, snap, edgeSnap: edgeOn,
          showCollision, sceneKey, tool, draftWall, ortho,
          select, toggleSelect, setSelection, selectWall, commit,
          updateObject, updateWallPoint, wallAddPoint, wallSetCursor,
          addAnnotation, removeAnnotation } = s
  const [guides, setGuides] = useState([])
  const [rb, setRb] = useState(null)
  const [measure, setMeasure] = useState(null) // {a:[mm], b:[mm]|null}
  const rbStart = useRef(null)
  const dragRef = useRef(null)
  const shiftRef = useRef(false)

  const stageW = (window.innerWidth - 210 - 280) / 2
  const stageH = window.innerHeight - 48 - 34

  const { px, ox, oy } = useMemo(() => {
    const pad = 40
    const scale = Math.min((stageW - pad * 2) / area.w, (stageH - pad * 2) / area.d)
    const areaWpx = area.w * scale, areaDpx = area.d * scale
    return { px: scale, ox: (stageW - areaWpx) / 2, oy: (stageH - areaDpx) / 2 }
  }, [area.w, area.d, stageW, stageH])

  useEffect(() => { s.setPxPerMm(px) }, [px])
  useEffect(() => {
    const kd = (e) => { if (e.key === 'Shift') shiftRef.current = true }
    const ku = (e) => { if (e.key === 'Shift') shiftRef.current = false }
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku)
    return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku) }
  }, [])

  const baseYMap = useMemo(() => computeBaseY(objects), [objects])
  const containerH = CONTAINER_H[sceneKey] || 2500
  const overSet = useMemo(() => {
    const set = new Set()
    objects.forEach((o) => { if (!o.isOpening && (baseYMap[o.id] || 0) + (o.h || 0) > containerH + 1) set.add(o.id) })
    return set
  }, [objects, baseYMap, containerH])
  const collisions = useMemo(() => (showCollision ? detectCollisions(objects, baseYMap) : new Set()), [objects, showCollision, baseYMap])

  const toMm = (pxX, pxY) => ({ x: (pxX - ox) / px, y: (pxY - oy) / px })
  const applyOrtho = (pt) => {
    if (!draftWall || !draftWall.points.length) return pt
    if (!(ortho || shiftRef.current)) return pt
    const last = draftWall.points[draftWall.points.length - 1]
    const dx = Math.abs(pt.x - last[0]), dy = Math.abs(pt.y - last[1])
    return dx > dy ? { x: pt.x, y: last[1] } : { x: last[0], y: pt.y }
  }
  const snapPt = (pt) => ({ x: snapGrid(pt.x, gridMm, snap), y: snapGrid(pt.y, gridMm, snap) })

  const handleStageMouseDown = (e) => {
    const stage = e.target.getStage()
    const pos = stage.getPointerPosition()
    if (tool === 'wall') {
      let pt = snapPt(applyOrtho(toMm(pos.x, pos.y)))
      if (draftWall && draftWall.points.length) {
        const last = draftWall.points[draftWall.points.length - 1]
        if (Math.hypot(pt.x - last[0], pt.y - last[1]) < 30) return
      }
      wallAddPoint([pt.x, pt.y]); return
    }
    if (tool === 'measure') {
      const mm = toMm(pos.x, pos.y)
      if (!measure || measure.b) setMeasure({ a: [mm.x, mm.y], b: null })
      else setMeasure({ ...measure, b: [mm.x, mm.y] })
      return
    }
    if (tool === 'annotate') {
      const mm = toMm(pos.x, pos.y)
      const text = prompt('标注文字:', '标注')
      if (text) addAnnotation(mm.x, mm.y, text)
      return
    }
    if (e.target === stage) {
      rbStart.current = { x: pos.x, y: pos.y }
      setRb({ x: pos.x, y: pos.y, w: 0, h: 0 })
    }
  }
  const handleStageMouseMove = (e) => {
    const stage = e.target.getStage()
    const pos = stage.getPointerPosition()
    if (tool === 'wall' && draftWall) { const pt = snapPt(applyOrtho(toMm(pos.x, pos.y))); wallSetCursor([pt.x, pt.y]); return }
    if (tool === 'measure' && measure && !measure.b) { const mm = toMm(pos.x, pos.y); setMeasure({ ...measure, cursor: [mm.x, mm.y] }); return }
    if (rbStart.current) {
      const x0 = rbStart.current.x, y0 = rbStart.current.y
      setRb({ x: Math.min(x0, pos.x), y: Math.min(y0, pos.y), w: Math.abs(pos.x - x0), h: Math.abs(pos.y - y0) })
    }
  }
  const handleStageMouseUp = () => {
    if (tool !== 'select') return
    if (rbStart.current && rb) {
      if (rb.w < 5 && rb.h < 5) select(null)
      else {
        const r = { x1: (rb.x - ox) / px, y1: (rb.y - oy) / px, x2: (rb.x + rb.w - ox) / px, y2: (rb.y + rb.h - oy) / px }
        const ids = objects.filter((o) => { const f = footprint(o); return !(f.x2 < r.x1 || f.x1 > r.x2 || f.y2 < r.y1 || f.y1 > r.y2) }).map((o) => o.id)
        setSelection(ids)
      }
    }
    rbStart.current = null; setRb(null)
  }
  const handleDblClick = () => { if (tool === 'wall') s.wallFinish() }

  const onSelectObj = (o, e) => {
    if (tool !== 'select') return
    if (e && e.evt && e.evt.shiftKey) toggleSelect(o.id)
    else if (!selectedIds.includes(o.id)) select(o.id)
  }
  const onDragStart = (o) => {
    if (tool !== 'select') return
    let ids = selectedIds
    if (!ids.includes(o.id)) { select(o.id); ids = [o.id] }
    commit()
    const starts = {}
    useStore.getState().objects.forEach((ob) => { if (ids.includes(ob.id)) starts[ob.id] = { x: ob.x, y: ob.y } })
    dragRef.current = { ids, starts, startNode: { x: o.x, y: o.y } }
  }
  const onDragMove = (o, node) => {
    const dr = dragRef.current; if (!dr) return
    let mm = toMm(node.x(), node.y())
    mm = { x: snapGrid(mm.x, gridMm, snap), y: snapGrid(mm.y, gridMm, snap) }
    if (edgeOn && !o.isOpening && dr.ids.length === 1) {
      const r = edgeSnap(o, objects, mm.x, mm.y, 80); mm = { x: r.x, y: r.y }; setGuides(r.guides)
    }
    const dx = mm.x - dr.startNode.x, dy = mm.y - dr.startNode.y
    dr.ids.forEach((id) => { if (id !== o.id) { const st = dr.starts[id]; updateObject(id, { x: st.x + dx, y: st.y + dy }) } })
    updateObject(o.id, { x: mm.x, y: mm.y })
    node.x(ox + mm.x * px); node.y(oy + mm.y * px)
  }
  const onDragEnd = (o, node) => {
    const dr = dragRef.current
    if (o.isOpening && dr && dr.ids.length === 1) {
      const mm = toMm(node.x(), node.y())
      const r = projectOpeningToWall({ ...o, x: mm.x, y: mm.y }, walls, 600)
      if (r) updateObject(o.id, { x: r.x, y: r.y, rotation: r.rotation, wallRef: r.wallRef })
      else updateObject(o.id, { wallRef: null })
    }
    dragRef.current = null; setGuides([])
  }
  const onTransformEnd = (o, node) => {
    const sx = node.scaleX(), sy = node.scaleY()
    node.scaleX(1); node.scaleY(1)
    s.commitObject(o.id, { x: (node.x() - ox) / px, y: (node.y() - oy) / px, w: Math.max(20, o.w * sx), d: Math.max(20, o.d * sy), rotation: Math.round(node.rotation()) })
  }

  const gridLines = []
  if (gridMm > 0) {
    for (let x = 0; x <= area.w; x += gridMm)
      gridLines.push(<Line key={'gx' + x} points={[ox + x * px, oy, ox + x * px, oy + area.d * px]} stroke="#d3d8e0" strokeWidth={0.5} listening={false} />)
    for (let y = 0; y <= area.d; y += gridMm)
      gridLines.push(<Line key={'gy' + y} points={[ox, oy + y * px, ox + area.w * px, oy + y * px]} stroke="#d3d8e0" strokeWidth={0.5} listening={false} />)
  }

  const wallPts = (w) => w.points.flatMap(([x, y]) => [ox + x * px, oy + y * px])
  const draftPts = draftWall ? [...draftWall.points, draftWall.cursor].flatMap(([x, y]) => [ox + x * px, oy + y * px]) : null
  const ordered = [...objects].sort((a, b) => (a.layer || 0) - (b.layer || 0))
  const selWall = walls.find((w) => w.id === selectedWallId)

  // 测量线端点(px)
  const mA = measure ? [ox + measure.a[0] * px, oy + measure.a[1] * px] : null
  const mB = measure ? (measure.b ? [ox + measure.b[0] * px, oy + measure.b[1] * px] : (measure.cursor ? [ox + measure.cursor[0] * px, oy + measure.cursor[1] * px] : null)) : null
  const mDist = measure && (measure.b || measure.cursor) ? Math.round(Math.hypot((measure.b || measure.cursor)[0] - measure.a[0], (measure.b || measure.cursor)[1] - measure.a[1])) : null

  const cursor = tool === 'select' ? 'default' : 'crosshair'

  return (
    <div style={{ width: stageW, background: '#e8eaed', overflow: 'hidden', cursor }}>
      <Stage width={stageW} height={stageH}
        onMouseDown={handleStageMouseDown} onMouseMove={handleStageMouseMove} onMouseUp={handleStageMouseUp} onDblClick={handleDblClick}>
        <Layer listening={false}>
          <Rect x={ox} y={oy} width={area.w * px} height={area.d * px} fill={FLOOR_COLOR} stroke="#1f2937" strokeWidth={2} />
          {gridLines}
        </Layer>

        <Layer>
          {walls.map((w) => {
            const isSel = w.id === selectedWallId
            return (
              <Line key={w.id} points={wallPts(w)} stroke={isSel ? '#2563eb' : '#6b7280'}
                strokeWidth={Math.max(2, w.thickness * px)} lineJoin="round" lineCap="round"
                hitStrokeWidth={Math.max(12, w.thickness * px)}
                onClick={(e) => { e.cancelBubble = true; if (tool === 'select') selectWall(w.id) }}
                onTap={(e) => { e.cancelBubble = true; if (tool === 'select') selectWall(w.id) }} />
            )
          })}
          {draftPts && (
            <>
              <Line points={draftPts} stroke="#dc2626" strokeWidth={Math.max(2, 100 * px)} dash={[8, 5]} lineJoin="round" lineCap="round" listening={false} />
              {draftWall.points.map(([x, y], i) => (<Circle key={i} x={ox + x * px} y={oy + y * px} radius={3} fill="#dc2626" listening={false} />))}
            </>
          )}
          {selWall && tool === 'select' && selWall.points.map(([x, y], i) => (
            <Circle key={'ep' + i} x={ox + x * px} y={oy + y * px} radius={6} fill="#ffffff" stroke="#2563eb" strokeWidth={2} draggable
              onDragStart={() => commit()}
              onDragMove={(e) => {
                let nx = (e.target.x() - ox) / px, ny = (e.target.y() - oy) / px
                nx = snapGrid(nx, gridMm, snap); ny = snapGrid(ny, gridMm, snap)
                e.target.x(ox + nx * px); e.target.y(oy + ny * px)
                updateWallPoint(selWall.id, i, nx, ny)
              }} />
          ))}
        </Layer>

        <Layer>
          {ordered.map((o) => o.isOpening ? (
            <OpeningNode key={o.id} o={o} px={px} ox={ox} oy={oy} isSel={selectedIds.includes(o.id)}
              onSelect={(e) => onSelectObj(o, e)}
              onDragStart={() => onDragStart(o)} onDragMove={(n) => onDragMove(o, n)} onDragEnd={(n) => onDragEnd(o, n)} />
          ) : (
            <RectNode key={o.id} o={o} px={px} ox={ox} oy={oy}
              isSel={selectedIds.includes(o.id)} collided={collisions.has(o.id)} over={overSet.has(o.id)}
              onSelect={(e) => onSelectObj(o, e)}
              onDragStart={() => onDragStart(o)} onDragMove={(n) => onDragMove(o, n)} onDragEnd={(n) => onDragEnd(o, n)}
              onTransformEnd={(n) => onTransformEnd(o, n)} />
          ))}
        </Layer>

        {/* 标注层 */}
        <Layer>
          {annotations.map((a) => (
            <Label key={a.id} x={ox + a.x * px} y={oy + a.y * px}
              onClick={() => { if (tool === 'select' && confirm('删除该标注?')) removeAnnotation(a.id) }}
              onTap={() => { if (tool === 'select' && confirm('删除该标注?')) removeAnnotation(a.id) }}>
              <Tag fill="#fef3c7" stroke="#f59e0b" cornerRadius={3} />
              <Text text={a.text} fontSize={12} padding={4} fill="#92400e" />
            </Label>
          ))}
        </Layer>

        {/* 测量层 */}
        <Layer listening={false}>
          {guides.map((g, i) => g.vertical
            ? <Line key={i} points={[ox + g.pos * px, oy + g.a * px, ox + g.pos * px, oy + g.b * px]} stroke="#ef4444" strokeWidth={1} dash={[4, 3]} />
            : <Line key={i} points={[ox + g.a * px, oy + g.pos * px, ox + g.b * px, oy + g.pos * px]} stroke="#ef4444" strokeWidth={1} dash={[4, 3]} />
          )}
          {rb && rb.w > 2 && rb.h > 2 && (<Rect x={rb.x} y={rb.y} width={rb.w} height={rb.h} fill="rgba(37,99,235,0.12)" stroke="#2563eb" strokeWidth={1} dash={[4, 3]} />)}
          {mA && mB && (
            <>
              <Line points={[mA[0], mA[1], mB[0], mB[1]]} stroke="#16a34a" strokeWidth={2} dash={[6, 4]} />
              <Circle x={mA[0]} y={mA[1]} radius={4} fill="#16a34a" />
              <Circle x={mB[0]} y={mB[1]} radius={4} fill="#16a34a" />
              <Label x={(mA[0] + mB[0]) / 2} y={(mA[1] + mB[1]) / 2 - 10}>
                <Tag fill="#16a34a" cornerRadius={3} />
                <Text text={`${mDist} mm`} fontSize={12} padding={3} fill="#fff" />
              </Label>
            </>
          )}
        </Layer>
      </Stage>
    </div>
  )
}
