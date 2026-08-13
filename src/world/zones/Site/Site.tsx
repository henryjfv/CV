"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { stations } from "@/data/world";
import {
  CITY_CENTRE_X,
  CITY_FAR_Z,
  CITY_HALF_WIDTH,
} from "../../engine/bounds";
import { stationHalf } from "../../engine/metrics";

/**
 * The ground the career is built on: the corridor out of the atrium, the
 * drafting grid the plan is set out over, and the avenue the visitor walks.
 *
 * The buildings themselves live in `Journey` — this is the site, not the city.
 */

const last = stations[stations.length - 1];

const GRID_FROM = -26;
/** Past the far face of the closing station, so the plan does not end early. */
const GRID_TO = CITY_FAR_Z - 12;
/** Reaches whichever district lane is furthest out, whatever that is today. */
const GRID_HALF_WIDTH = Math.abs(CITY_CENTRE_X) + CITY_HALF_WIDTH + 20;
/** The avenue stops at the steps of the last building, not inside it. */
const PATH_TO = last.position.z + stationHalf(last);

export function Site() {
  return (
    <group>
      <Corridor />
      <GroundPlan />
    </group>
  );
}

/** Ribs receding from the threshold, instanced into a single draw call. */
function Corridor() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const count = 22;

  // Warm, not graphite. These ribs were lit by an interior when they were drawn;
  // now they stand in the open under a setting sun, and the old colour read as
  // black bars laid across the sky rather than as the structure they are.
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#8a7062"),
        roughness: 0.85,
        metalness: 0.1,
      }),
    []
  );

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const matrix = new THREE.Matrix4();
    for (let i = 0; i < count; i += 1) {
      // The ribs widen as they recede: the space opens up as the visitor leaves
      // the atrium behind.
      const t = i / (count - 1);
      const z = -3.5 - t * 22;
      const scale = 1 + t * 0.9;
      matrix.makeScale(scale, scale, 1);
      matrix.setPosition(0, 0, z);
      mesh.setMatrixAt(i, matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [count]);

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} material={material}>
      <torusGeometry args={[4.6, 0.08, 6, 4, Math.PI]} />
    </instancedMesh>
  );
}

function GroundPlan() {
  const gridGeometry = useMemo(() => {
    const points: number[] = [];
    const step = 4;
    for (let z = GRID_FROM; z >= GRID_TO; z -= step) {
      points.push(-GRID_HALF_WIDTH, 0, z, GRID_HALF_WIDTH, 0, z);
    }
    for (let x = -GRID_HALF_WIDTH; x <= GRID_HALF_WIDTH; x += step) {
      points.push(x, 0, GRID_FROM, x, 0, GRID_TO);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
    return geometry;
  }, []);

  const gridMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: new THREE.Color("#7b5f52"),
        transparent: true,
        opacity: 0.32,
      }),
    []
  );

  /**
   * The kerbs are warm now, and dimmer.
   *
   * They were the interface blue, untone-mapped, which under the graphite
   * palette was one accent among several. Against a sunset it was the loudest
   * thing on screen — two neon rails running the length of a city that has no
   * other neon in it.
   */
  const pathMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color("#e8b48a"),
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
      }),
    []
  );

  return (
    <group position={[0, 0.01, 0]}>
      <lineSegments geometry={gridGeometry} material={gridMaterial} />
      {/* The avenue: one continuous line, so there is never a question about
          which way the world goes. */}
      {/* Two kerb lines rather than one central stripe: a stripe under the
          camera fills the bottom of the frame with a bright wedge, and an
          avenue is defined by its edges anyway. */}
      {[-3.4, 3.4].map((x) => (
        <mesh
          key={x}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[x, 0.02, (GRID_FROM + PATH_TO) / 2]}
          material={pathMaterial}
        >
          <planeGeometry args={[0.16, Math.abs(PATH_TO - GRID_FROM)]} />
        </mesh>
      ))}
    </group>
  );
}
