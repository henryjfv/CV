"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { BUILDING_DEPTH, BUILDING_WIDTH } from "../../engine/metrics";
import { palette } from "../../engine/palette";

/**
 * The structure that makes a stack of tiers a building.
 *
 * Columns from the platform to the roof, passing through every floor, plus the
 * mullions of a façade and a roof slab to close it. Nothing here is opaque:
 * the whole point of the station is the system inside it, so the building is
 * drawn the way an architect draws one before it is clad — in line work, with
 * the floors readable straight through the elevation.
 *
 * This is where the two metaphors finally meet. The floors of the building are
 * the tiers of the architecture; walking up it is walking up the stack.
 */
export function Building({
  half,
  height,
  active,
}: {
  half: number;
  height: number;
  active: boolean;
}) {
  const width = half * BUILDING_WIDTH;
  const depth = half * BUILDING_DEPTH;
  const base = 0.5;
  const top = height - 0.4;

  /** Columns at the corners, and along the long faces of a larger building. */
  const columns = useMemo(() => {
    const x = width / 2;
    const z = depth / 2;
    const positions: [number, number][] = [
      [-x, -z],
      [x, -z],
      [-x, z],
      [x, z],
    ];
    // A wide building needs intermediate columns or the span reads as a
    // billboard rather than a structure.
    const bays = Math.max(0, Math.round(width / 9) - 1);
    for (let i = 1; i <= bays; i += 1) {
      const at = -x + (width * i) / (bays + 1);
      positions.push([at, -z], [at, z]);
    }
    return positions;
  }, [width, depth]);

  /** Mullions: the vertical rhythm of a façade, as line work only. */
  const facade = useMemo(() => {
    const points: number[] = [];
    const x = width / 2;
    const z = depth / 2;
    const step = width / Math.max(4, Math.round(width / 3.2));

    for (let at = -x + step; at < x - 0.01; at += step) {
      points.push(at, base, -z, at, top, -z);
      points.push(at, base, z, at, top, z);
    }
    // The two short faces get a single mullion each.
    points.push(-x, base, 0, -x, top, 0);
    points.push(x, base, 0, x, top, 0);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
    return geometry;
  }, [width, depth, base, top]);

  const roofOutline = useMemo(
    () =>
      new THREE.EdgesGeometry(
        new THREE.BoxGeometry(width + 1.2, 0.4, depth + 1.2)
      ),
    [width, depth]
  );

  const structural = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#212932"),
        roughness: 0.75,
        metalness: 0.35,
      }),
    []
  );

  return (
    <group>
      {columns.map(([x, z]) => (
        <mesh
          key={`${x}:${z}`}
          position={[x, (base + top) / 2, z]}
          material={structural}
        >
          <boxGeometry args={[0.34, top - base, 0.34]} />
        </mesh>
      ))}

      <lineSegments geometry={facade}>
        <lineBasicMaterial
          color={palette.structure}
          transparent
          opacity={active ? 0.5 : 0.22}
        />
      </lineSegments>

      {/* Roof: a slab that overhangs slightly, so the building has a top edge
          instead of stopping at the last floor. */}
      <mesh position={[0, top + 0.2, 0]} material={structural}>
        <boxGeometry args={[width + 1.2, 0.4, depth + 1.2]} />
      </mesh>
      <lineSegments position={[0, top + 0.2, 0]} geometry={roofOutline}>
        <lineBasicMaterial
          color={active ? palette.active : palette.structure}
          transparent
          opacity={active ? 0.8 : 0.4}
        />
      </lineSegments>
    </group>
  );
}
