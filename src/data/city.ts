/**
 * The city, as numbers.
 *
 * `resume.ts` says what each role was; `world.ts` says what system it built.
 * This file says how big the building is, how bright it burns and what colour
 * its façade is — and nothing else. Every value here is a measurement of the
 * role (months worked, scope, whether it is still running), never a value
 * picked because it looked good.
 *
 * The two mappings that carry the argument:
 *
 *  - **Height measures the system, not the calendar.** Tying height to months
 *    would make Opensols (43 months) the tallest tower and the current lead
 *    role (14 months, a distributed team, a four-tier platform) the shortest
 *    building in the city — the opposite of what the career did.
 *  - **Footprint measures the calendar.** How long a role lasted is how much
 *    ground it holds. Opensols is wide and stepped; 2025 is tall and slim.
 *
 * With these numbers exactly one building falls under the `actividad`
 * threshold and goes grey: CloudTechnologyCenter, 2016, at the mouth of the
 * city. That single dark volume is what gives the lit ones their meaning.
 */

import type { Experience } from "./resume";
import type { StationLayer } from "./world";
import { stations } from "./world";

export type District = "mobile" | "backend" | "data" | "clients";

/**
 * Façade palettes. A family per technology lineage rather than per role, so
 * the skyline groups by what the work *was* and not by who paid for it.
 */
export type FacadeFamily = "cream" | "paleBlue" | "sage" | "terracotta" | "legacy";

/** A floor of the building: one tier of the system, with the panel copy for it. */
export type Chapter = {
  id: string;
  /** The tier's own label, e.g. "MICROSERVICES". */
  title: string;
  nodes: string[];
};

/**
 * Below this, a building is archived and takes the grey palette. The threshold
 * is deliberately low — it is a statement that a system stopped, not a
 * judgement on the work.
 */
export const DORMANT_BELOW = 0.15;

/**
 * X lane of each district. Chronology stays on Z; the district picks the lane.
 *
 * Client work sits in the outer *left* lane rather than the outer right, and
 * that is not a matter of taste. The camera rides a rail through the city, and
 * with client work on the right the run from 2018 to 2021 cut straight through
 * the Opensols block — the collision check in `rail.ts` said so out loud. On
 * the left, every leg of the journey crosses the empty avenue instead.
 */
export const DISTRICT_X: Record<District, number> = {
  mobile: -30,
  backend: 30,
  clients: -62,
  data: 0,
};

export const DISTRICT_LABEL: Record<District, string> = {
  mobile: "MOBILE",
  backend: "BACKEND",
  data: "DATA · AI",
  clients: "CLIENT WORK",
};

/** What is written on the drawing, before any geometry is derived from it. */
type CityEntry = {
  id: string;
  distrito: District;
  anioInicio: number;
  /** `null` = still running. */
  anioFin: number | null;
  /** Full months between the start and end of the role. */
  meses: number;
  /** 1–10: team, users, surface area, number of systems in flight at once. */
  alcance: number;
  /** 0–1: how alive the system is today. Drives how many windows are lit. */
  actividad: number;
  /** Technology lineage, most representative first. Picks the façade family. */
  stack: string[];
};

/**
 * Chronological, matching `world.ts`. Months are counted from the periods in
 * `resume.ts`; scope and activity are the only two judgement calls in the file,
 * and both are written down here rather than buried in a component.
 */
const ENTRIES: CityEntry[] = [
  {
    id: "cloudtech",
    distrito: "mobile",
    anioInicio: 2016,
    anioFin: 2018,
    meses: 21, // Apr 2016 – Jan 2018
    alcance: 3, // two production apps, one bounded school domain
    actividad: 0.05, // the one dark building in the city
    stack: ["Java", "Android"],
  },
  {
    id: "opensols",
    distrito: "backend",
    anioInicio: 2018,
    anioFin: 2022,
    meses: 43, // Aug 2018 – Mar 2022, the longest stretch
    alcance: 7, // several projects in parallel, corporate and energy clients
    actividad: 0.15,
    stack: ["Vue.js", "Python", "Django", ".NET", "Xamarin"],
  },
  {
    id: "freelance",
    distrito: "clients",
    anioInicio: 2021,
    anioFin: 2022,
    meses: 18,
    alcance: 4, // three complete products, teams of one
    actividad: 0.15,
    stack: ["Vue.js", "Node.js", "TypeScript", "Flutter"],
  },
  {
    id: "indra",
    distrito: "backend",
    anioInicio: 2022,
    anioFin: 2023,
    meses: 12, // Mar 2022 – Mar 2023
    alcance: 6, // insurance and lending, four fronts at once
    actividad: 0.2,
    stack: ["Java", "AWS Lambda", "Python", "Flutter", "Angular"],
  },
  {
    id: "byondit",
    distrito: "mobile",
    anioInicio: 2023,
    anioFin: 2023,
    meses: 6, // Jul 2023 – Dec 2023
    alcance: 4,
    actividad: 0.18,
    stack: ["Flutter", "Python", "AWS"],
  },
  {
    id: "imagineapps-freelance",
    distrito: "clients",
    anioInicio: 2023,
    anioFin: 2024,
    meses: 11, // Oct 2023 – Aug 2024
    alcance: 6, // an investment platform end to end, plus a logistics app
    actividad: 0.2,
    stack: ["React.js", "Node.js", "MongoDB", "React Native"],
  },
  {
    id: "personalsoft",
    distrito: "mobile",
    anioInicio: 2024,
    anioFin: 2025,
    meses: 11, // Aug 2024 – Jun 2025
    alcance: 5, // banking, iOS and Android
    actividad: 0.3,
    stack: ["Flutter", "AWS", "Azure DevOps"],
  },
  {
    id: "imagineapps-lead",
    distrito: "data",
    anioInicio: 2025,
    anioFin: null,
    meses: 14, // Jun 2025 – today
    alcance: 10, // distributed team, multi-cloud platform, several products
    actividad: 1, // the only fully lit building
    stack: ["Django", "FastAPI", "PostgreSQL", "Airflow", "Angular", "Next.js"],
  },
];

export type BuildingSpec = CityEntry & {
  /** Employer and title, assembled from the CV entry rather than retyped. */
  nombre: string;
  /** Where it stands. Chronology on Z, district on X. */
  position: { x: number; z: number };
  yearLabel: string;
  stage: string;
  /** Network or account perimeter drawn around the block, where there is one. */
  perimetro?: string;
  /** The tiers of the system, bottom to top in the diagram's own order. */
  layers: StationLayer[];
  /** One per tier: the floors the visitor scrolls through inside. */
  capitulos: Chapter[];
  /** The CV entry itself, for the panel. */
  role: Experience;
};

/**
 * Which façade family a stack belongs to. Explicit rather than clever: a
 * lookup that guesses from substrings puts "JavaScript" and "Java" in the same
 * family, which is exactly the confusion this map exists to prevent.
 */
const FAMILY_BY_TECHNOLOGY: Record<string, FacadeFamily> = {
  Java: "cream",
  ".NET": "cream",
  "Vue.js": "paleBlue",
  "React.js": "paleBlue",
  "Node.js": "paleBlue",
  "Next.js": "paleBlue",
  TypeScript: "paleBlue",
  Angular: "paleBlue",
  Python: "sage",
  Django: "sage",
  FastAPI: "sage",
  PostgreSQL: "sage",
  Airflow: "sage",
  "AWS Lambda": "sage",
  Flutter: "terracotta",
  Android: "terracotta",
  "React Native": "terracotta",
  Ionic: "terracotta",
  Xamarin: "terracotta",
};

/** The façade family of a building: its lead technology, unless it is dark. */
export function facadeFamily(spec: BuildingSpec): FacadeFamily {
  if (spec.actividad < DORMANT_BELOW) return "legacy";
  for (const technology of spec.stack) {
    const family = FAMILY_BY_TECHNOLOGY[technology];
    if (family) return family;
  }
  return "paleBlue";
}

/**
 * Height, in world units. Scope drives it; the caller is responsible for
 * making sure the floors of the system still fit inside (see `metrics.ts`),
 * because the number of tiers lives with the geometry, not with the data.
 */
export function scopeHeight(spec: BuildingSpec): number {
  return clamp(2 + spec.alcance * 2.1, 2, 22);
}

/** Half the footprint. Months on the job, held between six and four years. */
export function tenureHalf(spec: BuildingSpec): number {
  return 4 + clamp(spec.meses, 6, 48) * 0.22;
}

/** Stepped tops for the long roles: 0 under a year, 1 under three, 2 beyond. */
export function setbackCount(spec: BuildingSpec): number {
  if (spec.meses < 12) return 0;
  if (spec.meses < 36) return 1;
  return 2;
}

/** A mast, with a beacon, on what is still running and on what was largest. */
export function hasAntenna(spec: BuildingSpec): boolean {
  return spec.anioFin === null || spec.alcance >= 8;
}

/** Fraction of window cells burning. Kept under the saturation budget. */
export function litFraction(spec: BuildingSpec): number {
  return clamp(spec.actividad * 0.4, 0.02, 0.4);
}

export const city: BuildingSpec[] = ENTRIES.map((entry) => {
  const station = stations.find((candidate) => candidate.id === entry.id);
  if (!station) {
    throw new Error(`city.ts references an unknown station: ${entry.id}`);
  }

  return {
    ...entry,
    nombre: `${station.role.context} — ${station.role.title}`,
    position: station.position,
    yearLabel: station.yearLabel,
    stage: station.stage,
    perimetro: station.boundary,
    layers: station.layers,
    // Derived, not retyped: the floors of the building *are* the tiers of the
    // system, and the copy for each one is the tier's own label and contents.
    capitulos: station.layers.map((layer) => ({
      id: layer.id,
      title: layer.label,
      nodes: layer.nodes,
    })),
    role: station.role,
  };
});

const byId = new Map(city.map((spec) => [spec.id, spec]));

export function specFor(id: string): BuildingSpec {
  const spec = byId.get(id);
  if (!spec) throw new Error(`city.ts has no building for: ${id}`);
  return spec;
}

/** Buildings of one district, in the order they were built. */
export function district(id: District): BuildingSpec[] {
  return city.filter((spec) => spec.distrito === id);
}

export const DISTRICTS: District[] = ["mobile", "backend", "clients", "data"];

function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}
