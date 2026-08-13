"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";
import type { LayerId, Station as StationData, StationLayer } from "@/data/world";
import { Building } from "./Building";
import { FlowParticles, type FlowSegment } from "../../engine/FlowParticles";
import { NodeIcon } from "../../engine/NodeIcon";
import {
  BUILDING_DEPTH,
  BUILDING_WIDTH,
  LAYER_HEIGHT,
  NODE_SIZE,
  NODE_SPREAD,
  stationHalf,
  stationHeight,
} from "../../engine/metrics";
import { palette } from "../../engine/palette";
import { ProjectedText } from "../../engine/ProjectedText";

/**
 * One stage of the career, drawn as the system it was.
 *
 * Not a building: an architecture diagram standing up in space. Data at the
 * bottom because it is the foundation, services above it, interfaces on top,
 * and — at the last station only — an AI tier crowning the whole thing. Every
 * node is a technology named in that role's highlights, sitting in the tier it
 * actually occupies.
 *
 * That is the argument the world makes, and it is made in geometry: 2016 is
 * three thin tiers and six nodes, today is four dense tiers with traffic
 * running between them. Nobody has to read a word to see the difference.
 */

/** Bottom to top in the world — the reverse of how a diagram is read on paper. */
const WORLD_ORDER: LayerId[] = ["data", "service", "interface", "ai"];

const LAYER_COLOR: Record<LayerId, string> = {
  data: palette.data,
  service: palette.active,
  interface: palette.text,
  ai: palette.ai,
};

export function Station({
  data,
  active,
  animate,
  onSelect,
}: {
  data: StationData;
  active: boolean;
  animate: boolean;
  onSelect: () => void;
}) {
  const half = stationHalf(data);
  const height = stationHeight(data);
  const { x, z } = data.position;

  /** Tiers in world order, with the y each one sits at. */
  const tiers = useMemo(() => {
    const present = WORLD_ORDER.map((id) =>
      data.layers.find((layer) => layer.id === id)
    ).filter((layer): layer is StationLayer => Boolean(layer));

    return present.map((layer, index) => ({
      layer,
      y: 1.4 + index * LAYER_HEIGHT,
      color: new THREE.Color(LAYER_COLOR[layer.id]),
      nodes: layout(layer.nodes.length, half),
    }));
  }, [data.layers, half]);

  /** One line per node, from the node down into the tier below it. */
  const { connections, flow } = useMemo(() => {
    const points: number[] = [];
    const segments: FlowSegment[] = [];

    for (let i = 1; i < tiers.length; i += 1) {
      const upper = tiers[i];
      const lower = tiers[i - 1];
      for (const node of upper.nodes) {
        const from: [number, number, number] = [node.x, upper.y, node.z];
        const to: [number, number, number] = [0, lower.y + 0.4, 0];
        points.push(...from, ...to);
        segments.push({ from, to, color: upper.color });
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(points, 3)
    );
    return { connections: geometry, flow: segments };
  }, [tiers]);

  const connectionMaterial = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: new THREE.Color(palette.structure),
        transparent: true,
        opacity: 0.4,
      }),
    []
  );

  const idle = useMemo(() => new THREE.Color(palette.structure), []);
  const lit = useMemo(() => new THREE.Color(palette.active), []);

  useFrame((_, delta) => {
    const step = Math.min(delta * 3, 1);
    connectionMaterial.color.lerp(active ? lit : idle, step);
    // Mutating the material in place is how three.js is driven; the lint rule
    // is aimed at React state, and this object is neither.
    // eslint-disable-next-line react-hooks/immutability
    connectionMaterial.opacity +=
      ((active ? 0.75 : 0.35) - connectionMaterial.opacity) * step;
  });

  return (
    <group position={[x, 0, z]}>
      {/* Hit area. Invisible, generous, and the only thing that takes clicks —
          the visitor should not have to hit a specific node. */}
      <mesh
        position={[0, height / 2, 0]}
        onClick={(event) => {
          event.stopPropagation();
          onSelect();
        }}
        onPointerOver={() => {
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "";
        }}
      >
        <boxGeometry args={[half * 2.2, height + 2, half * 2.2]} />
        <meshBasicMaterial visible={false} />
      </mesh>

      <Platform half={half} active={active} />
      <Building half={half} height={height} active={active} />

      <lineSegments geometry={connections} material={connectionMaterial} />
      <FlowParticles segments={flow} active={active} animate={animate} />

      {tiers.map((tier) => (
        <Tier
          key={tier.layer.id}
          layer={tier.layer}
          y={tier.y}
          half={half}
          color={tier.color}
          nodes={tier.nodes}
          active={active}
        />
      ))}

      {data.boundary ? (
        <Boundary half={half} label={data.boundary} height={height} active={active} />
      ) : null}

      <GroundLabel data={data} half={half} active={active} />
    </group>
  );
}

/** Positions for n nodes spread across a tier, in rows if there are many. */
function layout(count: number, half: number): { x: number; z: number }[] {
  if (count === 0) return [];
  const perRow = count > 4 ? Math.ceil(count / 2) : count;
  const rows = Math.ceil(count / perRow);
  const spanX = half * NODE_SPREAD;
  const spanZ = rows > 1 ? half * 0.5 : 0;

  return Array.from({ length: count }, (_, index) => {
    const row = Math.floor(index / perRow);
    const inRow = index % perRow;
    const rowCount = Math.min(perRow, count - row * perRow);
    const stepX = rowCount > 1 ? (spanX * 2) / (rowCount - 1) : 0;
    return {
      x: rowCount > 1 ? -spanX + stepX * inRow : 0,
      z: rows > 1 ? -spanZ + row * spanZ * 2 : 0,
    };
  });
}

/** The ground the system stands on. */
function Platform({ half, active }: { half: number; active: boolean }) {
  const outline = useMemo(
    () =>
      new THREE.EdgesGeometry(new THREE.BoxGeometry(half * 2, 0.5, half * 2)),
    [half]
  );

  return (
    <group>
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[half * 2, 0.5, half * 2]} />
        <meshStandardMaterial
          color={new THREE.Color(palette.surface)}
          roughness={0.7}
          metalness={0.25}
        />
      </mesh>
      <lineSegments position={[0, 0.25, 0]} geometry={outline}>
        <lineBasicMaterial
          color={active ? palette.active : palette.structure}
          transparent
          opacity={0.75}
        />
      </lineSegments>
    </group>
  );
}

function Tier({
  layer,
  y,
  half,
  color,
  nodes,
  active,
}: {
  layer: StationLayer;
  y: number;
  half: number;
  color: THREE.Color;
  nodes: { x: number; z: number }[];
  active: boolean;
}) {
  // The floor slab is the building's own footprint: a tier that is narrower
  // than the structure around it reads as a shelf, not as a storey.
  const width = half * BUILDING_WIDTH;
  const depth = half * BUILDING_DEPTH;

  const deckOutline = useMemo(
    () => new THREE.EdgesGeometry(new THREE.BoxGeometry(width, 0.34, depth)),
    [width, depth]
  );

  const nodeGeometry = useMemo(
    () => new THREE.BoxGeometry(NODE_SIZE, NODE_SIZE, NODE_SIZE),
    []
  );
  const nodeOutline = useMemo(
    () => new THREE.EdgesGeometry(nodeGeometry),
    [nodeGeometry]
  );

  return (
    <group position={[0, y, 0]}>
      {/* The deck: a thin plate, so the tier reads as a level of a system
          rather than another solid box. */}
      <mesh position={[0, -0.5, 0]}>
        <boxGeometry args={[width, 0.34, depth]} />
        <meshStandardMaterial
          color={new THREE.Color("#1B222B")}
          emissive={color}
          emissiveIntensity={active ? 0.12 : 0.05}
          roughness={0.6}
          metalness={0.35}
        />
      </mesh>
      <lineSegments position={[0, -0.5, 0]} geometry={deckOutline}>
        <lineBasicMaterial color={color} transparent opacity={active ? 0.9 : 0.45} />
      </lineSegments>

      {/* Tier name, engraved into the edge of its own deck. Always readable:
          this is the part that says the world is an architecture. */}
      <ProjectedText
        text={layer.label}
        size={0.78}
        maxWidth={width * 0.5}
        position={[0, -0.5, depth / 2 + 0.14]}
        color={color.getStyle()}
        opacity={active ? 1 : 0.5}
        tracking={0.24}
        billboard
      />

      {nodes.map((node, index) => (
        <group key={layer.nodes[index]} position={[node.x, 0.35, node.z]}>
          <mesh geometry={nodeGeometry}>
            <meshStandardMaterial
              color={new THREE.Color("#161C24")}
              emissive={color}
              emissiveIntensity={active ? 0.55 : 0.22}
              roughness={0.45}
              metalness={0.4}
            />
          </mesh>
          <lineSegments geometry={nodeOutline}>
            <lineBasicMaterial
              color={color}
              transparent
              opacity={active ? 1 : 0.55}
            />
          </lineSegments>
          <NodeIcon
            name={layer.nodes[index]}
            layerId={layer.id}
            color={color.getStyle()}
            size={NODE_SIZE}
            active={active}
          />
          {active ? (
            <ProjectedText
              text={layer.nodes[index].toUpperCase()}
              size={0.5}
              maxWidth={5}
              position={[0, NODE_SIZE * 1.1, 0]}
              color={palette.text}
              opacity={0.95}
              tracking={0.12}
              billboard
            />
          ) : null}
        </group>
      ))}
    </group>
  );
}

/** Something that wraps the whole system: a VPC, a cloud account. */
function Boundary({
  half,
  label,
  height,
  active,
}: {
  half: number;
  label: string;
  height: number;
  active: boolean;
}) {
  const outline = useMemo(() => {
    const w = half * 2.25;
    const h = height + 1.2;
    return new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, w));
  }, [half, height]);

  return (
    <group position={[0, (height + 1.2) / 2, 0]}>
      <lineSegments geometry={outline}>
        <lineBasicMaterial
          color={palette.cloud}
          transparent
          opacity={active ? 0.4 : 0.16}
        />
      </lineSegments>
      <ProjectedText
        text={label}
        size={0.62}
        maxWidth={half * 1.2}
        position={[0, (height + 1.2) / 2 - 0.9, half * 1.13]}
        color={palette.cloud}
        opacity={active ? 0.8 : 0.35}
        tracking={0.26}
        billboard
      />
    </group>
  );
}

/** Year and stage, set into the plan the way a drawing is annotated. */
function GroundLabel({
  data,
  half,
  active,
}: {
  data: StationData;
  half: number;
  active: boolean;
}) {
  const towardsAvenue = data.position.x < -1 ? 1 : data.position.x > 1 ? -1 : 0;
  // The station that closes the axis is looked at head-on, so a label set out
  // in front of it lands in the visitor's lap. It goes against the platform.
  const position: [number, number, number] =
    towardsAvenue === 0
      ? [0, 0.06, half + 2.5]
      : [towardsAvenue * (half + 6), 0.06, 0];

  return (
    <group position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <ProjectedText
        text={data.yearLabel}
        size={2.1}
        position={[0, 0, 0]}
        color={active ? palette.active : palette.textMuted}
        opacity={active ? 0.75 : 0.4}
        tracking={0.1}
        fontWeight={600}
        mode="engraved"
      />
      <ProjectedText
        text={data.stage}
        size={0.8}
        maxWidth={18}
        position={[0, -1.7, 0]}
        color={palette.textMuted}
        opacity={active ? 0.55 : 0.28}
        tracking={0.2}
        mode="engraved"
      />
    </group>
  );
}
