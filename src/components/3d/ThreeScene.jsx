import React from "react";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  Grid,
  PerspectiveCamera
} from "@react-three/drei";

import { useStore } from "../../store.js";

function BoxObject({ object, selected }) {
  const color = selected
    ? "#ff44aa"
    : object.color || "#cccccc";

  return (
    <mesh
      position={[
        object.x / 1000,
        (object.h || 100) / 2000 + object.layer * 0.15,
        object.y / 1000
      ]}
      rotation={[
        0,
        (-object.rotation * Math.PI) / 180,
        0
      ]}
    >
      <boxGeometry
        args={[
          object.w / 1000,
          Math.max(0.05, object.h / 1000),
          object.d / 1000
        ]}
      />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

function WallMesh({ wall }) {
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
        position={[
          cx / 1000,
          wall.h / 2000,
          cy / 1000
        ]}
        rotation={[0, -angle, 0]}
      >
        <boxGeometry
          args={[
            length / 1000,
            wall.h / 1000,
            wall.thickness / 1000
          ]}
        />
        <meshStandardMaterial color="#888888" />
      </mesh>
    );
  }

  return <>{segments}</>;
}

function Floor() {
  const area = useStore((s) => s.area);

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
    >
      <planeGeometry
        args={[
          area.w / 1000,
          area.d / 1000
        ]}
      />
      <meshStandardMaterial color="#f3f4f6" />
    </mesh>
  );
}

export default function ThreeScene() {
  const objects = useStore((s) => s.objects);
  const walls = useStore((s) => s.walls);
  const selectedId = useStore((s) => s.selectedId);

  return (
    <div
      style={{
        flex: 1,
        background: "#111827"
      }}
    >
      <Canvas shadows>
        <PerspectiveCamera
          makeDefault
          position={[8, 6, 8]}
        />

        <ambientLight intensity={1} />

        <directionalLight
          position={[10, 10, 5]}
          intensity={1.5}
        />

        <Floor />

        <Grid
          infiniteGrid
          cellSize={0.5}
          sectionSize={2}
          fadeDistance={30}
        />

        {walls.map((wall) => (
          <WallMesh
            key={wall.id}
            wall={wall}
          />
        ))}

        {objects.map((object) => (
          <BoxObject
            key={object.id}
            object={object}
            selected={object.id === selectedId}
          />
        ))}

        <OrbitControls />
      </Canvas>
    </div>
  );
}
