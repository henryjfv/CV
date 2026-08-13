"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { registerLabel } from "./labels";
import { useTextTexture } from "./useTextTexture";

type ProjectedTextProps = {
  text: string;
  /**
   * World height of the generated plate, not of the glyphs — the canvas keeps
   * padding around the type, so the letters stand about half this tall. Width
   * follows from the text's own aspect ratio.
   */
  size: number;
  /**
   * Caps the plate's width in world units, shrinking the height to match.
   * Type set against a wall has to fit the wall: without this, a longer name
   * silently runs off both ends of the architecture.
   */
  maxWidth?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  color?: string;
  opacity?: number;
  tracking?: number;
  fontWeight?: string | number;
  /**
   * Additive reads as light thrown onto a surface; normal reads as type
   * engraved into it. The difference is what separates the projected name from
   * the labels cut into the floor.
   */
  mode?: "projected" | "engraved";
  /**
   * Turns to face the camera every frame. Required for anything labelling an
   * object in space: a fixed plane skews with perspective and slides visibly
   * away from the thing it names.
   */
  billboard?: boolean;
  /**
   * Enters the label into the collision pass: it will be hidden rather than
   * allowed to overlap a nearer label or be cut by the edge of the frame.
   * Only for type that names an object in space — anything set into the
   * architecture itself is part of the architecture and always drawn.
   */
  avoidCollisions?: boolean;
  /** Higher survives a collision. Used to keep the active building's labels. */
  priority?: number;
};

/**
 * Type that belongs to the architecture rather than floating above it.
 */
export function ProjectedText({
  text,
  size,
  maxWidth,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  color = "#ffffff",
  opacity = 1,
  tracking = 0.08,
  fontWeight = 500,
  mode = "projected",
  billboard = false,
  avoidCollisions = false,
  priority = 0,
}: ProjectedTextProps) {
  const generated = useTextTexture({ text, tracking, fontWeight });
  const mesh = useRef<THREE.Mesh>(null);

  // Computed before the early return below, so the hooks that need it run on
  // every render whether or not the texture has been rasterised yet.
  const aspect = generated?.aspect ?? 1;
  const height =
    maxWidth !== undefined ? Math.min(size, maxWidth / aspect) : size;
  const width = height * aspect;

  useFrame(({ camera }) => {
    if (!billboard || !mesh.current) return;
    mesh.current.quaternion.copy(camera.quaternion);
  });

  useEffect(() => {
    if (!avoidCollisions || !mesh.current) return;
    return registerLabel({ mesh: mesh.current, width, height, priority });
  }, [avoidCollisions, width, height, priority, generated]);

  const material = useMemo(() => {
    if (!generated) return null;
    return new THREE.MeshBasicMaterial({
      map: generated.texture,
      transparent: true,
      opacity,
      color: new THREE.Color(color),
      blending: mode === "projected" ? THREE.AdditiveBlending : THREE.NormalBlending,
      depthWrite: false,
      toneMapped: false,
    });
  }, [generated, color, opacity, mode]);

  if (!generated || !material) return null;

  return (
    <mesh ref={mesh} position={position} rotation={rotation} material={material}>
      <planeGeometry args={[width, height]} />
    </mesh>
  );
}
