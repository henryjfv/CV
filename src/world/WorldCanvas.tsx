"use client";

import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import type { QualitySettings } from "./engine/quality";
import { World } from "./World";

/**
 * The canvas and its render settings. Split from `World` so the scene graph
 * never has to care about device tiers, and from `WorldStage` so the stage can
 * decide whether a canvas should exist at all.
 */
export function WorldCanvas({
  quality,
  onReady,
}: {
  quality: QualitySettings;
  onReady: () => void;
}) {
  return (
    <Canvas
      dpr={quality.dpr}
      // The long shadows are half of what says "sunset", so they survive down
      // to the mid tier and are only dropped on phones and weak machines.
      shadows={quality.tier === "high" || quality.tier === "mid"}
      gl={{
        antialias: quality.antialias,
        powerPreference: "high-performance",
        // Nothing is composited behind the canvas, and an opaque drawing buffer
        // is measurably cheaper.
        alpha: false,
      }}
      camera={{ fov: 42, near: 0.1, far: 400, position: [0, 1.65, 15] }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.32;
        onReady();
      }}
    >
      <World quality={quality} />
    </Canvas>
  );
}
