import React, { useRef, useEffect, useMemo, useState } from 'react'
import { Stage, Layer, Rect, Text, Line, Group, Transformer, Arc, Circle } from 'react-konva'
import { useStore } from '../store.js'
import { detectCollisions } from '../utils/collision.js'
import { snapGrid, edgeSnap, snapToWall } from '../utils/snapping.js'
import { FLOOR_COLOR } from '../catalog.js'

function RectNode({ o, px, ox, oy, isSel, collided, onSelect, onDragEnd, onTransformEnd, onDragMove }) {
  const ref = useRef(); const trRef = useRef()
  useEffect(() => {
    if (isSel && trRef.current && ref.current) { trRef.current.nodes([ref.current]); trRef.current.getLayer().batchDraw() }
  }, [isSel])
  const wPx = o.w * px, dPx = o.d * px
  return (
    <>
      <Group ref={ref} x={ox + o.x * px} y={oy + o.y * px} rotation={o.rotation} draggable
        onClick={onSelect} onTap={onSelect} opacity={o.layer > 0 ? 0.88 : 1}
        onDragMove={(e) => onDragMove(e.target)}
        onDragEnd={(e) => onDragEnd(e.target)}
        onTransformEnd={() => onTransformEnd(ref.current)}>
        <Rect width={wPx} height={dPx} fill={o.color}
          stroke={collided ? '#dc2626' : isSel ? '#2563eb' : '#374151'}
          strokeWidth={collided ? 3 : isSel ? 2 : 1} />
        <Text width={wPx} height={dPx}
          text={`${o.name}\n${Math.round(o.w)}×${Math.round(o.d)}\n[L${o.layer}]`}
          fontSize={Math.max(9, Math.min(13, wPx / 12))} align="center" verticalAlign="middle" listening={false} />
      </Group>
      {isSel && <Transformer ref={trRef} rotationSnaps={[0, 90, 180, 270]}
        boundBoxFunc={(ob, nb) => (nb.width < 20 || nb.height < 20 ? ob : nb)} />}
    </>
  )
}

function OpeningNode({ o, px, ox, oy, isSel, onSelect, onDragEnd, onDragMove }) {
  const ref = useRef(); const trRef = useRef()
  useEffect(() => {
    if (isSel && trRef.current && ref.current) { trRef.current.nodes([ref.current]); trRef.current.getLayer().batchDraw() }
  }, [isSel])
  const wPx = o.w * px, dPx = o.d * px
  const isDoor = o.type === 'door' || o.type === 'double_door'
  return (
    <>
      <Group ref={ref} x={ox + o.x * px} y={oy + o.y * px} rotation={o.rotation} draggable
        onClick={onSelect} onTap={onSelect}
        onDragMove={(e) => onDragMove(e.target)}
        onDragEnd={(e) => onDragEnd(e.target)}>
        <Rect width={wPx} height={dPx} fill={FLOOR_COLOR}
          stroke={isSel ? '#2563eb' : '#9ca3af'} strokeWidth={isSel ? 2 : 1} />
        {isDoor ? (
          <>
            <Line points={[0, dPx / 2, wPx, dPx / 2]} stroke={o.color} strokeWidth={2} />
            <Arc x={0} y={dPx / 2} innerRadius={0} outerRadius={wPx} angle={90} rotation={-90}
              stroke={o.color} strokeWidth={1.5} dash={[4, 3]} />
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
  const { objects, walls, selectedId, selectedWallId, area, gridMm, snap, edgeSnap: edgeOn, showCollision,
          tool, draftWall, ortho, select, selectWall, commit, commitObject,
          updateWallPoint, wallAddPoint, wallSetCursor } = s
  const [guides, setGuides] = useState([])
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

  const collisions = useMemo(() => (showCollision ? detectCollisions(objects) : new Set()), [objects, showCollision])
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
    if (tool === 'wall') {
      const pos = e.target.getStage().getPointerPosition()
      let pt = snapPt(applyOrtho(toMm(pos.x, pos.y)))
      if (draftWall && draftWall.points.length) {
        const last = draftWall.points[draftWall.points.length - 1]
        if (Math.hypot(pt.x - last[0], pt.y - last[1]) < 30) return
      }
      wallAddPoint([pt.x, pt.y]); return
    }
    if (e.target === e.target.getStage()) select(null)
  }
  const handleStageMouseMove = (e) => {
    if (tool !== 'wall' || !draftWall) return
    const pos = e.target.getStage().getPointerPosition()
    const pt = snapPt(applyOrtho(toMm(pos.x, pos.y)))
    wallSetCursor([pt.x, pt.y])
  }
  const handleDblClick = () => { if (tool === 'wall') s.wallFinish() }

  const onObjDragMove = (o, node) => {
    let mm = toMm(node.x(), node.y())
    mm = { x: snapGrid(mm.x, gridMm, snap), y: snapGrid(mm.y, gridMm, snap) }
    if (edgeOn && !o.isOpening) {
      const r = edgeSnap(o, objects, mm.x, mm.y, 80)
      mm = { x: r.x, y: r.y }; setGuides(r.guides)
    }
    node.x(ox + mm.x * px); node.y(oy + mm.y * px)
  }
  const onObjDragEnd = (o, node) => {
    let mm = toMm(node.x(), node.y())
    if (o.isOpening) {
      const snapped = snapToWall({ ...o, x: mm.x, y: mm.y }, walls, 600)
      if (snapped) mm = snapped
      commitObject(o.id, { x: mm.x, y: mm.y, rotation: snapped ? snapped.rotation : o.rotation })
    } else {
      commitObject(o.id, { x: mm.x, y: mm.y })
    }
    setGuides([])
  }
  const onObjTransformEnd = (o, node) => {
    const sx = node.scaleX(), sy = node.scaleY()
    node.scaleX(1); node.scaleY(1)
    commitObject(o.id, {
      x: (node.x() - ox) / px, y: (node.y() - oy) / px,
      w: Math.max(20, o.w * sx), d: Math.max(20, o.d * sy),
      rotation: Math.round(node.rotation())
    })
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

  return (
    <div style={{ width: stageW, background: '#e8eaed', overflow: 'hidden', cursor: tool === 'wall' ? 'crosshair' : 'default' }}>
      <Stage width={stageW} height={stageH}
        onMouseDown={handleStageMouseDown} onMouseMove={handleStageMouseMove} onDblClick={handleDblClick}>
        <Layer listening={false}>
          <Rect x={ox} y={oy} width={area.w * px} height={area.d * px} fill={FLOOR_COLOR} stroke="#1f2937" strokeWidth={2} />
          {gridLines}
        </Layer>

        {/* 墙层:可点选 */}
        <Layer>
          {walls.map((w) => {
            const isSel = w.id === selectedWallId
            return (
              <Line key={w.id} points={wallPts(w)}
                stroke={isSel ? '#2563eb' : '#6b7280'}
                strokeWidth={Math.max(2, w.thickness * px)} lineJoin="round" lineCap="round"
                hitStrokeWidth={Math.max(12, w.thickness * px)}
                onClick={(e) => { e.cancelBubble = true; if (tool !== 'wall') selectWall(w.id) }}
                onTap={(e) => { e.cancelBubble = true; if (tool !== 'wall') selectWall(w.id) }} />
            )
          })}
          {draftPts && (
            <>
              <Line points={draftPts} stroke="#dc2626" strokeWidth={Math.max(2, 100 * px)} dash={[8, 5]} lineJoin="round" lineCap="round" listening={false} />
              {draftWall.points.map(([x, y], i) => (
                <Circle key={i} x={ox + x * px} y={oy + y * px} radius={3} fill="#dc2626" listening={false} />
              ))}
            </>
          )}
          {/* 选中墙的端点:可拖动编辑 */}
          {selWall && tool !== 'wall' && selWall.points.map(([x, y], i) => (
            <Circle key={'ep' + i} x={ox + x * px} y={oy + y * px} radius={6}
              fill="#ffffff" stroke="#2563eb" strokeWidth={2} draggable
              onDragStart={() => commit()}
              onDragMove={(e) => {
                let nx = (e.target.x() - ox) / px
                let ny = (e.target.y() - oy) / px
                nx = snapGrid(nx, gridMm, snap); ny = snapGrid(ny, gridMm, snap)
                e.target.x(ox + nx * px); e.target.y(oy + ny * px)
                updateWallPoint(selWall.id, i, nx, ny)
              }} />
          ))}
        </Layer>

        {/* 对象层 */}
        <Layer>
          {ordered.map((o) => o.isOpening ? (
            <OpeningNode key={o.id} o={o} px={px} ox={ox} oy={oy} isSel={o.id === selectedId}
              onSelect={() => select(o.id)}
              onDragMove={(node) => onObjDragMove(o, node)}
              onDragEnd={(node) => onObjDragEnd(o, node)} />
          ) : (
            <RectNode key={o.id} o={o} px={px} ox={ox} oy={oy}
              isSel={o.id === selectedId} collided={collisions.has(o.id)}
              onSelect={() => select(o.id)}
              onDragMove={(node) => onObjDragMove(o, node)}
              onDragEnd={(node) => onObjDragEnd(o, node)}
              onTransformEnd={(node) => onObjTransformEnd(o, node)} />
          ))}
        </Layer>

        <Layer listening={false}>
          {guides.map((g, i) => g.vertical
            ? <Line key={i} points={[ox + g.pos * px, oy + g.a * px, ox + g.pos * px, oy + g.b * px]} stroke="#ef4444" strokeWidth={1} dash={[4, 3]} />
            : <Line key={i} points={[ox + g.a * px, oy + g.pos * px, ox + g.b * px, oy + g.pos * px]} stroke="#ef4444" strokeWidth={1} dash={[4, 3]} />
          )}
        </Layer>
      </Stage>
    </div>
  )
}
