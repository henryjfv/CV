"use client";

import * as THREE from "three";
import { CameraRig } from "./engine/CameraRig";
import { Dust } from "./engine/Dust";
import { palette } from "./engine/palette";
import type { QualitySettings } from "./engine/quality";
import { Entrance } from "./zones/Entrance/Entrance";
import { Journey } from "./zones/Journey/Journey";
import { Site } from "./zones/Site/Site";

/**
 * Everything inside the canvas. Light does the dramatic work here — the palette
 * stays graphite and the accents are reserved for meaning, so the space has to
 * be shaped by how it is lit rather than by how it is coloured.
 */
export function World({ quality }: { quality: QualitySettings }) {
  const animate = !quality.reducedMotion;

  return (
    <>
      <color attach="background" args={[palette.void]} />
      {/* Exponential rather than linear: it thickens with distance the way a
          large interior does, and it hides the far edge of the site plan. */}
      <fogExp2 attach="fog" args={[palette.void, 0.0075]} />

      <CameraRig reducedMotion={quality.reducedMotion} />

      {/* Barely-there fill, so unlit faces read as dark grey rather than black. */}
      <ambientLight intensity={0.28} color={palette.cloud} />
      {/* The atrium's own light: high, cold, from behind the visitor. */}
      <directionalLight
        position={[6, 18, 12]}
        intensity={1.45}
        color="#cfe0f2"
      />
      {/* Counter-light that separates the walls from the void. Kept low: any
          more and the blue washes across the floor instead of edging it. */}
      <directionalLight position={[-10, 6, -14]} intensity={0.18} color={palette.active} />
      {/* Sky-to-ground fill over the site. Without it the stations read as flat
          black cut-outs: their faces have nothing to catch. */}
      <hemisphereLight
        args={[palette.cloud, palette.void, 0.5]}
        position={[0, 30, -90]}
      />

      <Floor />
      <Entrance />
      <Site />
      <Journey animate={animate} />
      <Dust count={quality.particles} animate={animate} />
    </>
  );
}

/** One large plane under everything, dark enough to read as polished stone. */
function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -40]} receiveShadow={false}>
      <planeGeometry args={[300, 320]} />
      {/* Matte, not polished. A reflective floor turned every lamp into a
          large soft stain across the bottom of the frame. */}
      <meshStandardMaterial
        color={new THREE.Color(palette.void)}
        roughness={0.95}
        metalness={0.05}
      />
    </mesh>
  );
}
