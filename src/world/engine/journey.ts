/**
 * Where the visitor is along the rail, kept deliberately outside React.
 *
 * The value changes every frame; putting it in component state would rerender
 * the tree sixty times a second. Instead the scene reads the mutable object
 * directly in its frame loop, and React only hears about the coarse things it
 * actually renders — the active zone, the selected station, and whether the
 * visitor has moved at all.
 */

import { stations } from "@/data/world";
import { stationRail, THRESHOLD } from "./rail";

export type JourneySnapshot = {
  /** Coarse position along the rail, used by the HUD to highlight the nav. */
  zoneId: string;
  /** Station whose panel is open, if any. */
  selectedId: string | null;
  /** True once the visitor has moved at all, which retires the hints. */
  hasMoved: boolean;
};

type Listener = (snapshot: JourneySnapshot) => void;

const listeners = new Set<Listener>();

export const journey = {
  /** Where the camera is easing towards, 0–1. */
  target: 0,
  /** Where the camera actually is. Eased towards `target` each frame. */
  progress: 0,
};

let snapshot: JourneySnapshot = {
  zoneId: "entrance",
  selectedId: null,
  hasMoved: false,
};

export function getSnapshot(): JourneySnapshot {
  return snapshot;
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function publish(next: JourneySnapshot) {
  if (
    next.zoneId === snapshot.zoneId &&
    next.selectedId === snapshot.selectedId &&
    next.hasMoved === snapshot.hasMoved
  ) {
    return;
  }
  snapshot = next;
  listeners.forEach((listener) => listener(snapshot));
}

/**
 * Which zone a rail position belongs to. A station claims the rail from
 * halfway back to the one before it, so the nav highlights whichever station
 * the visitor is actually among.
 */
function zoneAt(t: number): string {
  if (t < THRESHOLD) return "entrance";

  let current = "site";
  let previous = THRESHOLD;
  for (const station of stations) {
    const at = stationRail[station.id];
    if (t >= (previous + at) / 2) current = station.id;
    previous = at;
  }
  return current;
}

export function advance(delta: number) {
  setTarget(journey.target + delta);
}

export function setTarget(value: number) {
  journey.target = clamp01(value);
  publish({
    ...snapshot,
    zoneId: zoneAt(journey.target),
    hasMoved: snapshot.hasMoved || journey.target > 0.002,
  });
}

/** Cinematic jump used by the secondary navigation. */
export function goToStation(id: string) {
  const at = stationRail[id];
  if (at === undefined) return;
  setTarget(at);
  publish({ ...snapshot, zoneId: zoneAt(at), selectedId: id, hasMoved: true });
}

/** Steps to the next or previous station from wherever the visitor is now. */
export function goToAdjacentStation(direction: 1 | -1) {
  const positions = stations.map((station) => stationRail[station.id]);
  const current = journey.target;

  const next =
    direction === 1
      ? positions.find((at) => at > current + 0.01)
      : [...positions].reverse().find((at) => at < current - 0.01);

  if (next !== undefined) {
    setTarget(next);
    return;
  }
  // Past the last station going forwards, or before the first going back:
  // the ends of the rail are the atrium and the closing view.
  setTarget(direction === 1 ? 1 : 0);
}

export function selectStation(id: string | null) {
  publish({ ...snapshot, selectedId: id });
}

/** Eases `progress` towards `target`. Frame-rate independent. */
export function tick(dt: number, reducedMotion: boolean) {
  const distance = Math.abs(journey.target - journey.progress);
  // A long jump gets a slower spring, so crossing the world reads as a travelling
  // shot rather than a cut. Short scroll nudges stay responsive.
  const damping = reducedMotion ? 6 : distance > 0.12 ? 1.7 : 3.2;
  const factor = 1 - Math.exp(-damping * dt);
  journey.progress += (journey.target - journey.progress) * factor;
}

export function resetJourney() {
  journey.target = 0;
  journey.progress = 0;
  snapshot = { zoneId: "entrance", selectedId: null, hasMoved: false };
  listeners.forEach((listener) => listener(snapshot));
}

function clamp01(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}
