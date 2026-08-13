"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { cullLabels } from "./labels";

/**
 * Runs the label collision pass, once for the whole scene.
 *
 * Every third frame rather than every frame: the pass costs a projection and a
 * rectangle test per label, and the camera does not move far enough in 50ms for
 * the difference to be visible. It is only re-run more often than that when the
 * viewport itself changes, which is handled by `size` being a dependency of the
 * scene rather than of this loop.
 *
 * It must run *after* the labels have billboarded themselves, which it does:
 * R3F calls frame callbacks in mount order and this is mounted last in `World`.
 */
export function LabelCuller() {
  const size = useThree((state) => state.size);
  const frame = useRef(0);

  useFrame(({ camera }) => {
    frame.current += 1;
    if (frame.current % 3 !== 0) return;
    if (!(camera instanceof THREE.PerspectiveCamera)) return;
    cullLabels(camera, size.width, size.height);
  });

  return null;
}
