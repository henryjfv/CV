/**
 * Maps the CV onto the world: which station represents which role, how much
 * architecture each one gets, and — the part that matters — the *shape* of the
 * system that role built.
 *
 * Every node listed here is a technology named in that role's highlights, and
 * every layer is where that technology actually sits in a system. Nothing is
 * added. What the world argues is not "he knows many tools" but "the systems
 * got deeper": one interface over one API over one database in 2016, and a
 * four-layer architecture with an AI tier today.
 *
 * Content lives in `resume.ts`; scene wiring lives here.
 */

import { experience, type Experience } from "./resume";

/** The tiers a system is drawn in, from the top of the diagram down. */
export type LayerId = "interface" | "service" | "data" | "ai";

export type StationLayer = {
  id: LayerId;
  label: string;
  nodes: string[];
};

export const LAYER_ORDER: LayerId[] = ["interface", "service", "data", "ai"];

/**
 * Half the width of a station's platform, by complexity 1–5. Lives here rather
 * than with the camera code because the layout below depends on it: stations
 * have to be spaced by how big they are, not by numbers picked by eye.
 */
export const STATION_HALF: Record<number, number> = {
  1: 6,
  2: 8,
  3: 10,
  4: 13,
  5: 17,
};

export type Station = {
  id: string;
  /** Short label carved into the world, e.g. "2016". */
  yearLabel: string;
  /** The stage of the career this station represents. */
  stage: string;
  /**
   * How much ground the station takes, 1–5. The world grows as the career
   * does, and the two most recent roles are the largest on purpose.
   */
  complexity: 1 | 2 | 3 | 4 | 5;
  /** The system this role built, tier by tier. */
  layers: StationLayer[];
  /**
   * Something that encloses the whole system rather than sitting in a tier —
   * drawn as a perimeter around the station.
   */
  boundary?: string;
  /**
   * Where the station stands. They alternate across the avenue so the visitor
   * passes between them, and the last one closes the axis head-on: the career
   * does not end beside the path, it ends at the end of it.
   *
   * Spacing follows the platforms: each station is set back far enough that
   * the one before it is out of shot, and the closing station sits far enough
   * down the axis that the camera can stand back and hold all of it — the
   * previous layout put that final viewpoint on top of Imagine Apps.
   */
  position: { x: number; z: number };
  /** The underlying CV entry. */
  role: Experience;
};

function byId(id: string): Experience {
  const found = experience.find((entry) => entry.id === id);
  if (!found) {
    throw new Error(`world.ts references an unknown experience id: ${id}`);
  }
  return found;
}

/**
 * Chronological — the world is walked forwards in time, which is the opposite
 * order to how a CV lists roles.
 */
export const stations: Station[] = [
  {
    id: "cloudtech",
    yearLabel: "2016",
    stage: "MOBILE",
    complexity: 1,
    layers: [
      { id: "interface", label: "ANDROID", nodes: ["Android", "Java"] },
      {
        id: "service",
        label: "SCHOOL MANAGEMENT",
        nodes: ["Attendance", "Grades", "Wallet", "Agenda", "Certificates"],
      },
    ],
    position: { x: -30, z: -42 },
    role: byId("cloudtech"),
  },
  {
    id: "opensols",
    yearLabel: "2018",
    stage: "FULL STACK",
    complexity: 2,
    layers: [
      { id: "interface", label: "WEB · MOBILE", nodes: ["Vue.js", "Xamarin"] },
      {
        id: "service",
        label: "BACKEND",
        nodes: ["Python", "Django", ".NET", "Jitsi", "Wompi"],
      },
      { id: "data", label: "DATA", nodes: ["Flight datasets"] },
    ],
    position: { x: 30, z: -70 },
    role: byId("opensols"),
  },
  {
    id: "freelance",
    yearLabel: "2021",
    stage: "INDEPENDENT PROJECTS",
    complexity: 2,
    layers: [
      { id: "interface", label: "CLIENTS", nodes: ["Vue.js", "Flutter"] },
      { id: "service", label: "BACKEND", nodes: ["Node.js", "TypeScript"] },
      { id: "data", label: "DATA", nodes: ["MySQL", "Supabase"] },
    ],
    position: { x: -30, z: -100 },
    role: byId("freelance"),
  },
  {
    id: "indra",
    yearLabel: "2022",
    stage: "CLOUD · SERVERLESS",
    complexity: 3,
    layers: [
      { id: "interface", label: "MOBILE", nodes: ["Flutter", "Ionic", "Angular"] },
      {
        id: "service",
        label: "SERVERLESS",
        nodes: ["AWS Lambda", "Java", "Python", "JavaScript"],
      },
      { id: "data", label: "DATA", nodes: ["DynamoDB"] },
    ],
    // The first system with a network perimeter drawn around it.
    boundary: "VPC",
    position: { x: 30, z: -134 },
    role: byId("indra"),
  },
  {
    id: "byondit",
    yearLabel: "2023",
    stage: "WALLET · CLOUD",
    complexity: 2,
    layers: [
      { id: "interface", label: "WALLET", nodes: ["Flutter"] },
      {
        id: "service",
        label: "BACKEND · RELEASE",
        nodes: ["Python", "AWS", "Split.io", "Segment"],
      },
    ],
    position: { x: -30, z: -164 },
    role: byId("byondit"),
  },
  {
    id: "imagineapps-freelance",
    yearLabel: "2023",
    stage: "WEB · MOBILE · INTEGRATIONS",
    complexity: 4,
    layers: [
      {
        id: "interface",
        label: "WEB · MOBILE",
        nodes: ["React.js", "React Native", "Expo", "Redux"],
      },
      {
        id: "service",
        label: "SERVICES",
        nodes: ["Node.js", "JWT", "SignNow", "SendGrid", "Withpersona", "Docker"],
      },
      {
        id: "data",
        label: "DATA · STORAGE",
        nodes: ["MongoDB", "SQL Server", "Sequelize", "AWS S3"],
      },
    ],
    position: { x: 30, z: -200 },
    role: byId("imagineapps-freelance"),
  },
  {
    id: "personalsoft",
    yearLabel: "2024",
    stage: "BANKING MOBILE",
    complexity: 2,
    layers: [
      { id: "interface", label: "BANKING APP", nodes: ["Flutter"] },
      { id: "service", label: "PLATFORM", nodes: ["AWS", "Azure DevOps"] },
    ],
    position: { x: -30, z: -234 },
    role: byId("personalsoft"),
  },
  {
    id: "imagineapps-lead",
    yearLabel: "2025",
    stage: "ARCHITECTURE · DATA · AI",
    complexity: 5,
    layers: [
      {
        id: "interface",
        label: "PORTAL",
        nodes: ["Angular", "Next.js", "TypeScript", "Tailwind", "Ant Design"],
      },
      {
        id: "service",
        label: "MICROSERVICES",
        nodes: ["Django", "FastAPI", "OpenAPI", "Docker", "CI/CD"],
      },
      {
        id: "data",
        label: "DATA PLATFORM",
        nodes: ["PostgreSQL", "Airflow", "SFTP", "Siigo", "SIESA", "Power BI"],
      },
      // The tier no earlier station has. The evolution is visible in the
      // silhouette before a single word is read.
      { id: "ai", label: "AI", nodes: ["LLM", "Local models", "AI agents"] },
    ],
    boundary: "AWS · AZURE",
    position: { x: 0, z: -300 },
    role: byId("imagineapps-lead"),
  },
];

/** Every technology drawn at a station, in diagram order. */
export function stationNodes(station: Station): string[] {
  return station.layers.flatMap((layer) => layer.nodes);
}

export type ZoneStatus = "built" | "planned";

export type Zone = {
  id: string;
  /** Label used by the discreet secondary navigation. */
  label: string;
  status: ZoneStatus;
};

/**
 * The full plan of the world. Zones marked `planned` are not yet built and are
 * never presented as content that exists.
 */
export const zones: Zone[] = [
  { id: "entrance", label: "Identity", status: "built" },
  { id: "site", label: "The Site", status: "built" },
  { id: "journey", label: "Journey", status: "built" },
  { id: "stack", label: "The Stack", status: "planned" },
  { id: "domains", label: "Domains", status: "planned" },
  { id: "archive", label: "Archive", status: "planned" },
  { id: "observatory", label: "Contact", status: "planned" },
];
