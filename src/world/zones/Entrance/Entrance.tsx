"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { profile, yearsOfExperience } from "@/data/resume";
import { palette } from "../../engine/palette";
import { ProjectedText } from "../../engine/ProjectedText";

/**
 * 01 — THE ENTRANCE.
 *
 * An atrium, not a background with a headline on top. The name is thrown onto
 * the far wall the way a projector would throw it; the role and the years are
 * cut into the side panels; and the way out is a lit opening in the base of
 * that same wall — entering the world means walking through the name.
 */

const WALL_Z = -2;
const WALL_HEIGHT = 9.5;
const WALL_HALF_WIDTH = 13;
/** Half-width of the opening in the wall. */
const GAP = 2.7;
const GAP_HEIGHT = 4.2;

export function Entrance() {
  const surface = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(palette.surface),
        roughness: 0.92,
        metalness: 0.04,
      }),
    []
  );

  // Deliberately lighter than the surfaces they wrap: in architectural
  // visualisation the line work is what carries the form, and at this exposure
  // the structure tone alone disappears into the walls.
  const structure = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: new THREE.Color("#414D5A"),
        transparent: true,
        opacity: 0.7,
      }),
    []
  );

  const panelWidth = WALL_HALF_WIDTH - GAP;

  return (
    <group>
      {/* --- The wall carrying the name, split around the opening --------- */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * (GAP + panelWidth / 2), 0, WALL_Z]}>
          <mesh position={[0, WALL_HEIGHT / 2, 0]} material={surface}>
            <boxGeometry args={[panelWidth, WALL_HEIGHT, 0.6]} />
          </mesh>
          <BoxOutline
            width={panelWidth}
            height={WALL_HEIGHT}
            depth={0.6}
            y={WALL_HEIGHT / 2}
            material={structure}
          />
        </group>
      ))}

      {/* Lintel over the opening. */}
      <group position={[0, 0, WALL_Z]}>
        <mesh position={[0, GAP_HEIGHT + (WALL_HEIGHT - GAP_HEIGHT) / 2, 0]} material={surface}>
          <boxGeometry args={[GAP * 2, WALL_HEIGHT - GAP_HEIGHT, 0.6]} />
        </mesh>
        <BoxOutline
          width={GAP * 2}
          height={WALL_HEIGHT - GAP_HEIGHT}
          depth={0.6}
          y={GAP_HEIGHT + (WALL_HEIGHT - GAP_HEIGHT) / 2}
          material={structure}
        />
      </group>

      {/* --- The name, thrown across the full width of the wall ----------- */}
      <ProjectedText
        text={profile.shortName.toUpperCase()}
        size={3.4}
        maxWidth={WALL_HALF_WIDTH * 1.62}
        position={[0, 7.1, WALL_Z + 0.32]}
        color={palette.text}
        opacity={0.94}
        tracking={0.12}
        fontWeight={600}
      />

      {/* --- Role and years, cut into the panels -------------------------- */}
      <ProjectedText
        text={profile.role.toUpperCase()}
        size={0.62}
        maxWidth={panelWidth * 0.92}
        position={[-(GAP + panelWidth / 2), 3.5, WALL_Z + 0.32]}
        color={palette.textMuted}
        opacity={0.85}
        tracking={0.22}
        mode="engraved"
      />
      <ProjectedText
        text="NODE.JS · TYPESCRIPT · PYTHON · JAVA"
        size={0.5}
        maxWidth={panelWidth * 0.92}
        position={[-(GAP + panelWidth / 2), 2.75, WALL_Z + 0.32]}
        color={palette.textMuted}
        opacity={0.55}
        tracking={0.18}
        mode="engraved"
      />
      <ProjectedText
        text={`${yearsOfExperience} YEARS BUILDING SYSTEMS`}
        size={0.62}
        position={[GAP + panelWidth / 2, 3.5, WALL_Z + 0.32]}
        color={palette.active}
        opacity={0.75}
        tracking={0.22}
        mode="engraved"
      />
      <ProjectedText
        text={profile.location.toUpperCase()}
        size={0.52}
        position={[GAP + panelWidth / 2, 2.8, WALL_Z + 0.32]}
        color={palette.textMuted}
        opacity={0.6}
        tracking={0.22}
        mode="engraved"
      />

      {/* --- The threshold ------------------------------------------------ */}
      <Threshold />

      {/* --- Side walls ---------------------------------------------------- */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * WALL_HALF_WIDTH, 0, 7]}>
          <mesh position={[0, WALL_HEIGHT / 2, 0]} rotation={[0, Math.PI / 2, 0]} material={surface}>
            <boxGeometry args={[18, WALL_HEIGHT, 0.4]} />
          </mesh>
        </group>
      ))}

      <Ceiling material={structure} />
    </group>
  );
}

/**
 * Beams overhead. Without them the atrium is three walls under an open sky and
 * reads as a stage set; with them the visitor is indoors, and the name is lit
 * type on the far wall of a room they are standing in.
 */
function Ceiling({ material }: { material: THREE.LineBasicMaterial }) {
  const geometry = useMemo(() => {
    const points: number[] = [];
    const y = WALL_HEIGHT + 1.6;
    const from = 16;
    const to = WALL_Z;
    for (let z = from; z >= to; z -= 2.4) {
      points.push(-WALL_HALF_WIDTH, y, z, WALL_HALF_WIDTH, y, z);
    }
    points.push(-WALL_HALF_WIDTH, y, from, -WALL_HALF_WIDTH, y, to);
    points.push(WALL_HALF_WIDTH, y, from, WALL_HALF_WIDTH, y, to);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
    return geo;
  }, []);

  return <lineSegments geometry={geometry} material={material} />;
}

/** The lit opening, and the glow it spills onto the atrium floor. */
function Threshold() {
  return (
    <group position={[0, 0, WALL_Z]}>
      {/* Light source recessed behind the opening. */}
      <mesh position={[0, GAP_HEIGHT / 2, -0.8]}>
        <planeGeometry args={[GAP * 2, GAP_HEIGHT]} />
        <meshBasicMaterial
          color={palette.active}
          transparent
          opacity={0.16}
          toneMapped={false}
        />
      </mesh>
      {/* The pool of light on the atrium floor is this lamp falling off with
          distance, not a translucent plane laid on the floor: a plane has a
          hard edge where it ends, and a hard edge is exactly what a spill of
          light does not have. */}
      <pointLight
        position={[0, GAP_HEIGHT * 0.6, -1.4]}
        color={palette.active}
        intensity={26}
        distance={30}
        decay={2}
      />
    </group>
  );
}

/** Line work around a box, which is what makes the architecture read. */
function BoxOutline({
  width,
  height,
  depth,
  y,
  material,
}: {
  width: number;
  height: number;
  depth: number;
  y: number;
  material: THREE.LineBasicMaterial;
}) {
  const geometry = useMemo(
    () => new THREE.EdgesGeometry(new THREE.BoxGeometry(width, height, depth)),
    [width, height, depth]
  );
  return <lineSegments position={[0, y, 0]} geometry={geometry} material={material} />;
}
