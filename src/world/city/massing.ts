/**
 * The shape of a building, worked out from its spec and nothing else.
 *
 * Kept as plain data rather than as a `THREE.Group` so the geometry can be
 * derived once, memoised, and rendered declaratively the way the rest of this
 * scene is — and so the massing can be reasoned about without a renderer.
 *
 * What turns a box into a building, in order of how much each one buys:
 *
 *  1. A **cornice** — a slab 8% wider than the shaft, capping every tier. One
 *     mesh, and the silhouette stops reading as a crate.
 *  2. **Setbacks** — the long roles step in as they rise, which is what gives
 *     the skyline its variety without a single hand-placed value.
 *  3. **Rooftop plant** — one or two small boxes, so the roofline has
 *     something on it besides a horizon.
 *  4. **A mast**, on what is still running, with a beacon at the tip.
 */

import * as THREE from "three";
import type { BuildingSpec } from "@/data/city";
import { hasAntenna, setbackCount } from "@/data/city";
import { FACADE_DEPTH, FACADE_WIDTH } from "../engine/metrics";
import { hashInt, hashRange, hashUnit } from "./hash";

/** How much narrower each tier is than the one below it. */
const SETBACK_RATIO = 0.7;
/** How much of the tier below a setback tier is worth, in height. */
const SETBACK_HEIGHT = 0.35;
/** The cornice oversail, as a share of the shaft it caps. */
const CORNICE_OVERSAIL = 0.08;
const CORNICE_HEIGHT = 0.15;

export type Plan = "box" | "L" | "U";

export type Tier = {
  /** Bottom of the shaft, in world units above the platform. */
  base: number;
  /** Centre of the shaft. */
  y: number;
  height: number;
  width: number;
  depth: number;
  /**
   * Footprint at this tier's own size, and the cornice that caps it.
   *
   * Drawn at true size rather than scaled from one shared plan, because
   * `ExtrudeGeometry` writes its UVs in geometry units: at true size the window
   * grid is in world units and one repeat setting fits the whole city. Scale
   * the mesh instead and every setback gets narrower windows than the tier
   * below it, which is the sort of thing nobody can name but everybody sees.
   */
  shape: THREE.Shape;
  corniceShape: THREE.Shape;
  /** Bottom of the cornice. */
  corniceBase: number;
};

export type RoofProp = {
  x: number;
  z: number;
  width: number;
  depth: number;
  height: number;
  /** Centre height. */
  y: number;
};

export type Mast = {
  /** Centre of the shaft. */
  y: number;
  height: number;
  radius: number;
  /** Where the beacon sits. */
  beaconY: number;
};

export type Massing = {
  plan: Plan;
  tiers: Tier[];
  props: RoofProp[];
  mast: Mast | null;
  /** Total height, platform to the top cornice. */
  height: number;
};

/**
 * The building, as geometry.
 *
 * `half` and `height` come from `metrics.ts` rather than from the spec: the
 * height has to clear the floors of the system standing inside it, and how many
 * floors there are is a fact of the scene, not of the data.
 */
export function buildMassing(
  spec: BuildingSpec,
  half: number,
  height: number
): Massing {
  const plan = planFor(spec);
  const width = half * FACADE_WIDTH;
  const depth = half * FACADE_DEPTH;

  const tiers = tiersFor(plan, spec, width, depth, height);
  const top = tiers[tiers.length - 1];

  return {
    plan,
    tiers,
    props: propsFor(spec, top),
    mast: mastFor(spec, top, height),
    height,
  };
}

/** Three plans, chosen by the id so a building never changes its own shape. */
function planFor(spec: BuildingSpec): Plan {
  return (["box", "L", "U"] as const)[hashInt(`${spec.id}:plan`, 3)];
}

/**
 * Shafts from the platform up, each stepping in over the one below.
 *
 * The heights are a geometric series so the setbacks add up to exactly the
 * height the building was given — an earlier version stacked them on top and
 * the towers overshot their own framing distance.
 */
function tiersFor(
  plan: Plan,
  spec: BuildingSpec,
  width: number,
  depth: number,
  height: number
): Tier[] {
  const setbacks = setbackCount(spec);

  let total = 0;
  for (let i = 0; i <= setbacks; i += 1) total += SETBACK_HEIGHT ** i;
  const baseHeight = height / total;

  const tiers: Tier[] = [];
  let y = 0;
  for (let i = 0; i <= setbacks; i += 1) {
    const tierHeight = baseHeight * SETBACK_HEIGHT ** i;
    const scale = SETBACK_RATIO ** i;
    const tierWidth = width * scale;
    const tierDepth = depth * scale;
    tiers.push({
      base: y,
      y: y + tierHeight / 2,
      height: tierHeight,
      width: tierWidth,
      depth: tierDepth,
      shape: footprint(plan, tierWidth, tierDepth),
      corniceShape: footprint(
        plan,
        tierWidth * (1 + CORNICE_OVERSAIL),
        tierDepth * (1 + CORNICE_OVERSAIL)
      ),
      corniceBase: y + tierHeight,
    });
    y += tierHeight + CORNICE_HEIGHT;
  }
  return tiers;
}

/** Plant on the roof: a tank, a chiller. Placed on the top tier, never off it. */
function propsFor(spec: BuildingSpec, top: Tier): RoofProp[] {
  const count = 1 + hashInt(`${spec.id}:props`, 2);
  const roof = top.corniceBase + CORNICE_HEIGHT;

  return Array.from({ length: count }, (_, index) => {
    const seed = `${spec.id}:prop:${index}`;
    const width = hashRange(`${seed}:w`, top.width * 0.14, top.width * 0.26);
    const depth = hashRange(`${seed}:d`, top.depth * 0.14, top.depth * 0.26);
    const height = hashRange(`${seed}:h`, 0.5, 1.4);
    // Held inside half the roof, so plant never overhangs the cornice.
    const spread = 0.5;
    return {
      x: (hashUnit(`${seed}:x`) - 0.5) * (top.width - width) * spread,
      z: (hashUnit(`${seed}:z`) - 0.5) * (top.depth - depth) * spread,
      width,
      depth,
      height,
      y: roof + height / 2,
    };
  });
}

function mastFor(spec: BuildingSpec, top: Tier, height: number): Mast | null {
  if (!hasAntenna(spec)) return null;
  const roof = top.corniceBase + CORNICE_HEIGHT;
  const mastHeight = height * 0.28;
  return {
    y: roof + mastHeight / 2,
    height: mastHeight,
    radius: 0.09,
    beaconY: roof + mastHeight,
  };
}

/**
 * The plan, drawn in XY and laid flat by the renderer.
 *
 * L and U are the full rectangle with a bite taken out, which keeps every plan
 * inside the same block — the building still fills the ground it was given, it
 * just does not fill it squarely.
 */
function footprint(plan: Plan, width: number, depth: number): THREE.Shape {
  const w = width / 2;
  const d = depth / 2;
  const shape = new THREE.Shape();

  if (plan === "box") {
    shape.moveTo(-w, -d);
    shape.lineTo(w, -d);
    shape.lineTo(w, d);
    shape.lineTo(-w, d);
    shape.closePath();
    return shape;
  }

  if (plan === "L") {
    const cutW = width * 0.45;
    const cutD = depth * 0.45;
    shape.moveTo(-w, -d);
    shape.lineTo(w, -d);
    shape.lineTo(w, d - cutD);
    shape.lineTo(w - cutW, d - cutD);
    shape.lineTo(w - cutW, d);
    shape.lineTo(-w, d);
    shape.closePath();
    return shape;
  }

  const notchW = width * 0.34;
  const notchD = depth * 0.5;
  shape.moveTo(-w, -d);
  shape.lineTo(w, -d);
  shape.lineTo(w, d);
  shape.lineTo(notchW / 2, d);
  shape.lineTo(notchW / 2, d - notchD);
  shape.lineTo(-notchW / 2, d - notchD);
  shape.lineTo(-notchW / 2, d);
  shape.lineTo(-w, d);
  shape.closePath();
  return shape;
}

export { CORNICE_HEIGHT, CORNICE_OVERSAIL };
