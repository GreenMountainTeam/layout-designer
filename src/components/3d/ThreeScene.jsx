import React, { useState, useRef, useEffect, useMemo } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Grid, TransformControls } from "@react-three/drei";
import * as THREE from "three";
import { useStore } from "../../store.js";

const FURN = new Set(["desk", "chair", "sofa", "cabinet", "bed", "rtable"]);
// 各场景容器净高(mm),用于体积装载率
const CONTAINER_H = { container_40hq: 2694, container_20gp: 2393, room: 2800, desk: 2000, custom: 2500 };

function useMmToWorld() {
  const area = useStore((s) => s.area);
  const x2w = (xmm) => (xmm - area.w / 2) / 1000;
  const z2w = (ymm) => (ymm - area.d / 2) / 1000;
  return { x2w, z2w, area };
}

function Mat({ color, selected }) {
  return (
    <meshStandardMaterial
      color={selected ? "#ff44aa" : color}
      emissive={selected ? "#ff44aa" : "#000000"}
      emissiveIntensity={selected ? 0.35 : 0}
    />
  );
}

// ===== 带孔墙几何(A方案真开洞) =====
function makeWallGeo(Lm, wallHm, thickM, holes) {
  const shape = new THREE.Shape();
  const hL = Lm / 2;
  shape.moveTo(-hL, 0);
  shape.lineTo(hL, 0);
  shape.lineTo(hL, wallHm);
  shape.lineTo(-hL, wallHm);
  shape.lineTo(-hL, 0);
  holes.forEach((h) => {
    const u0 = Math.max(-hL, h.u0), u1 = Math.min(hL, h.u1);
    const v0 = Math.max(0, h.v0), v1 = Math.min(wallHm, h.v1);
    if (u1 <= u0 || v1 <= v0) return;
    const p = new THREE.Path();
    p.moveTo(u0, v0);
    p.lineTo(u1, v0);
    p.lineTo(u1, v1);
    p.lineTo(u0, v1);
    p.lineTo(u0, v0);
    shape.holes.push(p);
  });
  const geo = new THREE.ExtrudeGeometry(shape, { depth: thickM, bevelEnabled: false });
  geo.translate(0, 0, -thickM / 2);
  return geo;
}

function WallSegment({ x1, y1, x2, y2, wall, openings, x2w, z2w, selected, onSelect }) {
  const dx = x2 - x1, dy = y2 - y1;
  const Lmm = Math.hypot(dx, dy) || 1;
  const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
  const angle = Math.atan2(dy, dx);

  const holes = [];
  openings.forEach((o) => {
    const ocx = o.x + o.w / 2, ocy = o.y + o.d / 2;
    const t = ((ocx - x1) * dx + (ocy - y1) * dy) / (Lmm * Lmm);
    const perp = Math.abs((ocx - x1) * -dy + (ocy - y1) * dx) / Lmm;
    if (t >= 0 && t <= 1 && perp < wall.thickness / 2 + 500) {
      const along = t * Lmm;
      const uC = (along - Lmm / 2) / 1000;
      const halfW = o.w / 2 / 1000;
      const isWin = o.type === "window" || o.type === "bay_window";
      const sill = isWin ? 0.9 : 0;
      const oh = (o.h || (isWin ? 1500 : 2100)) / 1000;
      holes.push({ u0: uC - halfW, u1: uC + halfW, v0: sill, v1: sill + oh });
    }
  });

  const key = JSON.stringify(holes) + `|${Lmm}|${wall.h}|${wall.thickness}`;
  const geo = useMemo(
    () => makeWallGeo(Lmm / 1000, wall.h / 1000, wall.thickness / 1000, holes),
    [key] // eslint-disable-line react-hooks/exhaustive-deps
  );
  useEffect(() => () => geo.dispose(), [geo]);

  return (
    <mesh geometry={geo} position={[x2w(cx), 0, z2w(cy)]} rotation={[0, -angle, 0]}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}>
      <meshStandardMaterial color={selected ? "#3b82f6" : "#9ca3af"} side={THREE.DoubleSide} />
    </mesh>
  );
}

function WallMesh({ wall, openings, x2w, z2w, selected, onSelect }) {
  const segs = [];
  for (let i = 0; i < wall.points.length - 1; i++) {
    const [x1, y1] = wall.points[i];
    const [x2, y2] = wall.points[i + 1];
    segs.push(
      <WallSegment key={i} x1={x1} y1={y1} x2={x2} y2={y2}
        wall={wall} openings={openings} x2w={x2w} z2w={z2w}
        selected={selected} onSelect={onSelect} />
    );
  }
  return <>{segs}</>;
}

// ===== 造型 parts(相对 group 原点,地面为 y=0) =====
function furnitureParts(o, selected) {
  const w = o.w / 1000, d = o.d / 1000, h = (o.h || 500) / 1000;
  const base = o.color || "#cccccc";
  const legT = 0.05;
  const parts = [];
  if (o.type === "desk") {
    const topT = 0.04, lh = h - topT;
    parts.push(<mesh key="top" position={[0, h - topT / 2, 0]}><boxGeometry args={[w, topT, d]} /><Mat color={base} selected={selected} /></mesh>);
    const lx = w / 2 - legT, lz = d / 2 - legT;
    [[-lx, -lz], [lx, -lz], [-lx, lz], [lx, lz]].forEach((p, i) =>
      parts.push(<mesh key={"l" + i} position={[p[0], lh / 2, p[1]]}><boxGeometry args={[legT, lh, legT]} /><Mat color="#8b5e34" selected={selected} /></mesh>));
  } else if (o.type === "chair") {
    const seatH = Math.min(0.45, h * 0.5), seatT = 0.05;
    parts.push(<mesh key="seat" position={[0, seatH, 0]}><boxGeometry args={[w, seatT, d]} /><Mat color={base} selected={selected} /></mesh>);
    parts.push(<mesh key="back" position={[0, seatH + (h - seatH) / 2, -(d / 2 - 0.03)]}><boxGeometry args={[w, h - seatH, 0.05]} /><Mat color={base} selected={selected} /></mesh>);
    const lx = w / 2 - legT, lz = d / 2 - legT;
    [[-lx, -lz], [lx, -lz], [-lx, lz], [lx, lz]].forEach((p, i) =>
      parts.push(<mesh key={"l" + i} position={[p[0], seatH / 2, p[1]]}><boxGeometry args={[legT, seatH, legT]} /><Mat color="#6b7280" selected={selected} /></mesh>));
  } else if (o.type === "sofa") {
    const baseH = h * 0.5, armW = w * 0.1;
    parts.push(<mesh key="base" position={[0, baseH / 2, 0]}><boxGeometry args={[w, baseH, d]} /><Mat color={base} selected={selected} /></mesh>);
    parts.push(<mesh key="back" position={[0, baseH + (h - baseH) / 2, -(d / 2 - d * 0.125)]}><boxGeometry args={[w, h - baseH, d * 0.25]} /><Mat color={base} selected={selected} /></mesh>);
    parts.push(<mesh key="al" position={[-(w / 2 - armW / 2), h * 0.4, 0]}><boxGeometry args={[armW, h * 0.6, d]} /><Mat color={base} selected={selected} /></mesh>);
    parts.push(<mesh key="ar" position={[w / 2 - armW / 2, h * 0.4, 0]}><boxGeometry args={[armW, h * 0.6, d]} /><Mat color={base} selected={selected} /></mesh>);
  } else if (o.type === "bed") {
    const frameH = h * 0.4;
    parts.push(<mesh key="frame" position={[0, frameH / 2, 0]}><boxGeometry args={[w, frameH, d]} /><Mat color="#a16207" selected={selected} /></mesh>);
    parts.push(<mesh key="mat" position={[0, frameH + h * 0.15, d * 0.02]}><boxGeometry args={[w * 0.95, h * 0.3, d * 0.92]} /><Mat color={base} selected={selected} /></mesh>);
    parts.push(<mesh key="pil" position={[0, frameH + h * 0.3 + 0.04, -(d / 2 - d * 0.15)]}><boxGeometry args={[w * 0.5, 0.08, d * 0.18]} /><Mat color="#ffffff" selected={selected} /></mesh>);
  } else if (o.type === "rtable") {
    const topT = 0.05, r = Math.max(w, d) / 2;
    parts.push(<mesh key="top" position={[0, h - topT / 2, 0]}><cylinderGeometry args={[r, r, topT, 32]} /><Mat color={base} selected={selected} /></mesh>);
    parts.push(<mesh key="pole" position={[0, h / 2, 0]}><cylinderGeometry args={[0.04, 0.04, h, 16]} /><Mat color="#6b7280" selected={selected} /></mesh>);
    parts.push(<mesh key="foot" position={[0, 0.025, 0]}><cylinderGeometry args={[r * 0.4, r * 0.4, 0.05, 24]} /><Mat color="#6b7280" selected={selected} /></mesh>);
  } else if (o.type === "cabinet") {
    parts.push(<mesh key="body" position={[0, h / 2, 0]}><boxGeometry args={[w, h, d]} /><Mat color={base} selected={selected} /></mesh>);
    parts.push(<mesh key="h1" position={[-0.03, h * 0.5, d / 2 + 0.01]}><boxGeometry args={[0.03, 0.18, 0.03]} /><Mat color="#374151" selected={selected} /></mesh>);
    parts.push(<mesh key="h2" position={[0.03, h * 0.5, d / 2 + 0.01]}><boxGeometry args={[0.03, 0.18, 0.03]} /><Mat color="#374151" selected={selected} /></mesh>);
  }
  return parts;
}

function boxParts(o, selected) {
  const hMeter = Math.max(0.05, (o.h || 100) / 1000);
  const trans = (o.layer || 0) > 0;
  return [
    <mesh key="b">
      <boxGeometry args={[o.w / 1000, hMeter, o.d / 1000]} />
      <meshStandardMaterial color={selected ? "#ff44aa" : o.color || "#cccccc"}
        transparent={trans} opacity={trans ? 0.9 : 1}
        emissive={selected ? "#ff44aa" : "#000000"} emissiveIntensity={selected ? 0.35 : 0} />
    </mesh>
  ];
}

function openingParts(o, selected) {
  const isWin = o.type === "window" || o.type === "bay_window";
  const hMeter = Math.max(0.1, (o.h || 2100) / 1000);
  const color = selected ? "#ff44aa" : isWin ? "#7dd3fc" : "#b45309";
  return [
    <mesh key="o">
      <boxGeometry args={[o.w / 1000, hMeter, Math.max(0.02, (o.d / 1000) * 0.4)]} />
      <meshStandardMaterial color={color} transparent={isWin} opacity={isWin ? 0.4 : 1}
        emissive={selected ? "#ff44aa" : "#000000"} emissiveIntensity={selected ? 0.4 : 0} />
    </mesh>
  ];
}

// ===== 可选中 / 可拖动的对象 =====
function ObjectItem({ object, selected, x2w, z2w, onSelect, onCommit, orbitRef }) {
  const grpRef = useRef();
  const isFurn = FURN.has(object.type);
  const isOpen = !!object.isOpening;
  const rot = (-(object.rotation || 0) * Math.PI) / 180;

  let baseY, parts;
  if (isFurn) { baseY = (object.layer || 0) * 0.15; parts = furnitureParts(object, selected); }
  else if (isOpen) {
    const isWin = object.type === "window" || object.type === "bay_window";
    const hMeter = Math.max(0.1, (object.h || 2100) / 1000);
    baseY = (isWin ? 0.9 : 0) + hMeter / 2; parts = openingParts(object, selected);
  } else {
    const hMeter = Math.max(0.05, (object.h || 100) / 1000);
    baseY = hMeter / 2 + (object.layer || 0) * 0.15; parts = boxParts(object, selected);
  }

  const cx = object.x + object.w / 2, cy = object.y + object.d / 2;
  const inner = (
    <group ref={grpRef} position={[x2w(cx), baseY, z2w(cy)]} rotation={[0, rot, 0]}
      onClick={(e) => { e.stopPropagation(); onSelect(object.id); }}>
      {parts}
    </group>
  );

  if (!selected) return inner;

  return (
    <TransformControls
      mode="translate" showY={false} size={0.7}
      onMouseDown={() => { if (orbitRef.current) orbitRef.current.enabled = false; }}
      onMouseUp={() => {
        if (orbitRef.current) orbitRef.current.enabled = true;
        const p = grpRef.current.position;
        const cxmm = p.x * 1000 + useStore.getState().area.w / 2;
        const cymm = p.z * 1000 + useStore.getState().area.d / 2;
        onCommit(object.id, { x: cxmm - object.w / 2, y: cymm - object.d / 2 });
      }}
    >
      {inner}
    </TransformControls>
  );
}

function Floor({ area }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[area.w / 1000, area.d / 1000]} />
      <meshStandardMaterial color="#f3f4f6" />
    </mesh>
  );
}

function AreaBox({ area }) {
  const w = area.w / 1000, d = area.d / 1000, h = 2.8;
  const geo = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d)), [w, h, d]);
  return (
    <lineSegments position={[0, h / 2, 0]} geometry={geo}>
      <lineBasicMaterial color="#3b82f6" />
    </lineSegments>
  );
}

function CameraRig({ view, area, controlsRef }) {
  const { camera } = useThree();
  useEffect(() => {
    if (view === "free") return;
    const span = Math.max(area.w, area.d) / 1000;
    if (view === "top") camera.position.set(0, span * 1.3, 0.001);
    else if (view === "iso") camera.position.set(span * 0.8, span * 0.6, span * 0.8);
    camera.lookAt(0, 0, 0);
    if (controlsRef.current) { controlsRef.current.target.set(0, 0, 0); controlsRef.current.update(); }
  }, [view, area.w, area.d, camera, controlsRef]);
  return null;
}

export default function ThreeScene() {
  const objects = useStore((s) => s.objects);
  const walls = useStore((s) => s.walls);
  const selectedId = useStore((s) => s.selectedId);
  const selectedWallId = useStore((s) => s.selectedWallId);
  const select = useStore((s) => s.select);
  const selectWall = useStore((s) => s.selectWall);
  const commitObject = useStore((s) => s.commitObject);
  const sceneKey = useStore((s) => s.sceneKey);
  const { x2w, z2w, area } = useMmToWorld();
  const [view, setView] = useState("iso");
  const controlsRef = useRef();
  const glRef = useRef();
  const span = Math.max(area.w, area.d) / 1000;
  const openings = objects.filter((o) => o.isOpening);

  // ===== 装载率 =====
  const stats = useMemo(() => {
    const areaMm2 = area.w * area.d;
    let floorMm2 = 0, volMm3 = 0;
    objects.forEach((o) => {
      if (o.isOpening) return;
      if ((o.layer || 0) === 0) floorMm2 += o.w * o.d;
      volMm3 += o.w * o.d * (o.h || 0);
    });
    const ch = CONTAINER_H[sceneKey] || 2500;
    return {
      floorPct: areaMm2 ? (floorMm2 / areaMm2) * 100 : 0,
      volM3: volMm3 / 1e9,
      volPct: areaMm2 * ch ? (volMm3 / (areaMm2 * ch)) * 100 : 0
    };
  }, [objects, area, sceneKey]);

  const shot = () => {
    const gl = glRef.current; if (!gl) return;
    try {
      const url = gl.domElement.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url; a.download = `layout_3d_${Date.now()}.png`; a.click();
    } catch (e) { alert("截图失败: " + e.message); }
  };

  const bar = (pct) => Math.max(0, Math.min(100, pct));

  return (
    <div style={{ width: (window.innerWidth - 210 - 280) / 2, background: "#111827", position: "relative" }}>
      {/* 顶部按钮 */}
      <div style={btnBar}>
        {[["top", "俯视"], ["iso", "45°"], ["free", "自由"]].map(([k, label]) => (
          <button key={k} onClick={() => setView(k)}
            style={{ ...vbtn, ...(view === k ? vbtnActive : {}) }}>{label}</button>
        ))}
        <button onClick={shot} style={vbtn}>📷 截图</button>
      </div>

      {/* 装载率 HUD */}
      <div style={hud}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>📦 装载率</div>
        <div style={hudRow}><span>占地率</span><b>{stats.floorPct.toFixed(1)}%</b></div>
        <div style={track}><div style={{ ...fill, width: bar(stats.floorPct) + "%", background: "#38bdf8" }} /></div>
        <div style={hudRow}><span>体积率</span><b>{stats.volPct.toFixed(1)}%</b></div>
        <div style={track}><div style={{ ...fill, width: bar(stats.volPct) + "%", background: "#4ade80" }} /></div>
        <div style={{ ...hudRow, marginTop: 4 }}><span>体积</span><b>{stats.volM3.toFixed(2)} m³</b></div>
      </div>

      <Canvas shadows gl={{ preserveDrawingBuffer: true }}
        onCreated={({ gl }) => { glRef.current = gl; }}
        camera={{ position: [span * 0.8, span * 0.6, span * 0.8], fov: 50, near: 0.1, far: span * 20 }}>
        <ambientLight intensity={1} />
        <directionalLight position={[span, span, span * 0.6]} intensity={1.5} castShadow />

        {/* 点空白取消选中 */}
        <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} onClick={() => select(null)}>
          <planeGeometry args={[span * 20, span * 20]} />
          <meshBasicMaterial visible={false} />
        </mesh>

        <Floor area={area} />
        <AreaBox area={area} />
        <Grid infiniteGrid cellSize={0.5} sectionSize={2} fadeDistance={span * 4} position={[0, 0.001, 0]} />

        {walls.map((wall) => (
          <WallMesh key={wall.id} wall={wall} openings={openings} x2w={x2w} z2w={z2w}
            selected={wall.id === selectedWallId} onSelect={() => selectWall(wall.id)} />
        ))}

        {objects.map((o) => (
          <ObjectItem key={o.id} object={o} selected={o.id === selectedId}
            x2w={x2w} z2w={z2w} onSelect={select} onCommit={commitObject} orbitRef={controlsRef} />
        ))}

        <CameraRig view={view} area={area} controlsRef={controlsRef} />
        <OrbitControls ref={controlsRef} makeDefault />
      </Canvas>
    </div>
  );
}

const btnBar = { position: "absolute", top: 8, right: 8, zIndex: 10, display: "flex", gap: 4 };
const vbtn = { background: "rgba(31,41,55,0.85)", color: "#fff", border: "1px solid #4b5563", borderRadius: 4, padding: "4px 10px", fontSize: 12, cursor: "pointer" };
const vbtnActive = { background: "#2563eb", borderColor: "#3b82f6" };
const hud = { position: "absolute", left: 8, bottom: 8, zIndex: 10, background: "rgba(17,24,39,0.85)", color: "#e5e7eb", padding: "8px 10px", borderRadius: 6, fontSize: 12, width: 160 };
const hudRow = { display: "flex", justifyContent: "space-between", margin: "2px 0" };
const track = { height: 6, background: "#374151", borderRadius: 3, overflow: "hidden", marginBottom: 4 };
const fill = { height: "100%", borderRadius: 3 };
