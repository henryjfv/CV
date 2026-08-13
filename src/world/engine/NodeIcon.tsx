"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { iconPathFor, useIconTexture } from "./useIconTexture";

const toCamera = new THREE.Vector3();

/**
 * The mark on the face of a technology node.
 *
 * It turns to face the camera and floats just clear of the cube, rather than
 * being painted onto one of its six sides — a fixed face is edge-on half the
 * time, and a node whose mark disappears as you walk past is worse than a node
 * with no mark at all.
 *
 * Shown whether or not the station is awake, dimmer when it is not: this is
 * what stops a distant station from being a row of anonymous boxes. The name
 * still only appears on arrival.
 */
export function NodeIcon({
  name,
  layerId,
  color,
  size,
  active,
}: {
  name: string;
  layerId: string;
  color: string;
  /** Edge length of the node this sits on. */
  size: number;
  active: boolean;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const path = useMemo(() => iconPathFor(name, layerId), [name, layerId]);
  const texture = useIconTexture(path, "#ffffff");

  useFrame(({ camera }) => {
    const node = mesh.current;
    if (!node) return;
    node.quaternion.copy(camera.quaternion);
    // Ride just outside the cube along the line of sight, so the glyph is never
    // buried inside the geometry it belongs to.
    node.parent?.getWorldPosition(toCamera);
    toCamera.subVectors(camera.position, toCamera).normalize();
    node.position.copy(toCamera).multiplyScalar(size * 0.58);
  });

  if (!texture) return null;

  return (
    <mesh ref={mesh}>
      <planeGeometry args={[size * 0.6, size * 0.6]} />
      <meshBasicMaterial
        map={texture}
        color={color}
        transparent
        opacity={active ? 0.95 : 0.55}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}
