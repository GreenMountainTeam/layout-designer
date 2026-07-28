import React, { useState, useRef, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";
import * as THREE from "three";
import { useStore } from "../../store.js";

// ===== 坐标换算 =====
// 2D 里 (0,0) 在区域左上角;3D 里区域中心在世界原点。
// 所以要把 mm 坐标减去区域一半,再转成米(/1000)。
function useMmToWorld() {
  const area = useStore((s) => s.area);
  const x2w = (xmm) => (xmm - area.w / 2) / 1000;
  const z2w = (ymm) => (ymm - area.d / 2) / 1000;
  return { x2w, z2w, area };
}

// ===== 单个对象(盒子) =====
function BoxObject({ object, selected, x2w, z2w }) {
  const color = selected ? "#ff44aa" : object.color || "#cccccc";
  const hMeter = Math.max(0.05, (object.h || 100) / 1000);

  // 2D 是左上角坐标,3D 盒子按中心定位:corner + 半宽/半深
  const cxmm = object.x + object.w / 2;
  const cymm = object.y + object.d / 2;

  return (
    <mesh
      position={[
        x2w(cxmm),
        hMeter / 2 + (object.layer || 0) * 0.15,
        z2w(cymm)
      ]}
      rotation={[0, (-(object.rotation || 0) * Math.PI) / 180, 0]}
    >
      <boxGeometry args={[object.w / 1000, hMeter, object.d / 1000]} />
      <meshStandardMaterial
        color={color}
        transparent={(object.layer || 0) > 0}
        opacity={(object.layer || 0) > 0 ? 0.9 : 1}
        emissive={selected ? "#ff44aa" : "#000000"}
        emissiveIntensity={selected ? 0.35 : 0}
      />
    </mesh>
  );
}

// ===== 墙(折线拆成段) =====
function WallMesh({ wall, x2w, z2w }) {
  const segments = [];
  for (let i = 0; i < wall.points.length - 1; i++) {
    const [x1, y1] = wall.points[i];
    const [x2, y2] = wall.points[i + 1];
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    const cx = (x1 + x2) / 2;
    const cy = (y1 + y2) / 2;
    const angle = Math.atan2(dy, dx);

    segments.push(
      <mesh
        key={i}
        position={[x2w(cx), wall.h / 2000, z2w(cy)]}
        rotation={[0, -angle, 0]}
      >
        <boxGeometry
          args={[length / 1000, wall.h / 1000, wall.thickness / 1000]}
        />
        <meshStandardMaterial color="#9ca3af" />
      </mesh>
    );
  }
  return <>{segments}</>;
}

// ===== 地板 =====
function Floor({ area }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[area.w / 1000, area.d / 1000]} />
      <meshStandardMaterial color="#f3f4f6" />
    </mesh>
  );
}

// ===== 区域边界框(蓝色线框,一眼看出是否超界) =====
function AreaBox({ area }) {
  const w = area.w / 1000;
  const d = area.d / 1000;
  const h = 2.8; // 默认墙高参考值
  const geo = React.useMemo(
    () => new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d)),
    [w, h, d]
  );
  return (
    <lineSegments position={[0, h / 2, 0]} geometry={geo}>
      <lineBasicMaterial color="#3b82f6" />
    </lineSegments>
  );
}

// ===== 相机预设 =====
function CameraRig({ view, area, controlsRef }) {
  const { camera } = useThree();
  useEffect(() => {
    if (view === "free") return; // 自由模式不强制
    const span = Math.max(area.w, area.d) / 1000;
    if (view === "top") {
      camera.position.set(0, span * 1.3, 0.001);
    } else if (view === "iso") {
      camera.position.set(span * 0.8, span * 0.6, span * 0.8);
    }
    camera.lookAt(0, 0, 0);
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  }, [view, area.w, area.d, camera, controlsRef]);
  return null;
}

export default function ThreeScene() {
  const objects = useStore((s) => s.objects);
  const walls = useStore((s) => s.walls);
  const selectedId = useStore((s) => s.selectedId);
  const { x2w, z2w, area } = useMmToWorld();
  const [view, setView] = useState("iso");
  const controlsRef = useRef();

  const span = Math.max(area.w, area.d) / 1000;

  return (
    <div style={{ flex: 1, background: "#111827", position: "relative" }}>
      {/* 视角切换按钮 */}
      <div style={btnBar}>
        {[
          ["top", "俯视"],
          ["iso", "45°"],
          ["free", "自由"]
        ].map(([k, label]) => (
          <button
            key={k}
            onClick={() => setView(k)}
            style={{ ...vbtn, ...(view === k ? vbtnActive : {}) }}
          >
            {label}
          </button>
        ))}
      </div>

      <Canvas shadows camera={{ position: [span * 0.8, span * 0.6, span * 0.8], fov: 50, near: 0.1, far: span * 20 }}>
        <ambientLight intensity={1} />
        <directionalLight position={[span, span, span * 0.6]} intensity={1.5} castShadow />

        <Floor area={area} />
        <AreaBox area={area} />
        <Grid
          infiniteGrid
          cellSize={0.5}
          sectionSize={2}
          fadeDistance={span * 4}
          position={[0, 0.001, 0]}
        />

        {walls.map((wall) => (
          <WallMesh key={wall.id} wall={wall} x2w={x2w} z2w={z2w} />
        ))}

        {objects.map((object) => (
          <BoxObject
            key={object.id}
            object={object}
            selected={object.id === selectedId}
            x2w={x2w}
            z2w={z2w}
          />
        ))}

        <CameraRig view={view} area={area} controlsRef={controlsRef} />
        <OrbitControls ref={controlsRef} makeDefault />
      </Canvas>
    </div>
  );
}

const btnBar = {
  position: "absolute",
  top: 8,
  right: 8,
  zIndex: 10,
  display: "flex",
  gap: 4
};
const vbtn = {
  background: "rgba(31,41,55,0.85)",
  color: "#fff",
  border: "1px solid #4b5563",
  borderRadius: 4,
  padding: "4px 10px",
  fontSize: 12,
  cursor: "pointer"
};
const vbtnActive = { background: "#2563eb", borderColor: "#3b82f6" };