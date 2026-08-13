"use client";

import { useEffect } from "react";
import { stations } from "@/data/world";
import {
  advance,
  enterBuilding,
  exitBuilding,
  getSnapshot,
  goToAdjacentStation,
  orbitBy,
  setTarget,
  stepFloor,
} from "./journey";

/**
 * How much scrolling it takes to walk the whole world, in CSS pixels.
 *
 * The rail used to advance by a fixed factor of `deltaY`, which was wrong twice
 * over. A trackpad flick emits thousands of pixels of momentum, so one gesture
 * threw the visitor from the entrance to the last station — it read as the
 * scroll being broken rather than being fast. And `deltaY` is only in pixels
 * when `deltaMode` says so: some mice and browsers report *lines* (about three
 * per notch), which made the same code advance the rail by a thousandth of its
 * length per notch. That genuinely does nothing.
 */
const PIXELS_PER_RAIL = 5200;
/** No single event may jump more than this, which tames momentum scrolling. */
const MAX_PIXELS_PER_EVENT = 160;
const TOUCH_PIXELS_PER_RAIL = 2600;

/**
 * Scrolling inside a building climbs it, one floor per gesture rather than by
 * a fraction of a floor — a storey is a chapter, and half a chapter is nothing.
 */
const PIXELS_PER_FLOOR = 260;
/** Radians of swing per pixel dragged, while stopped at a building. */
const ORBIT_PER_PIXEL = 0.004;

/** How many floors the building currently being stood in has. */
function floorsOf(id: string | null): number {
  const station = stations.find((entry) => entry.id === id);
  return station ? station.layers.length : 0;
}

/** Approximate CSS pixels per line and per page, for non-pixel wheel events. */
const PIXELS_PER_LINE = 16;

function wheelPixels(event: WheelEvent): number {
  const scale =
    event.deltaMode === WheelEvent.DOM_DELTA_LINE
      ? PIXELS_PER_LINE
      : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
        ? window.innerHeight
        : 1;
  const pixels = event.deltaY * scale;
  return Math.max(-MAX_PIXELS_PER_EVENT, Math.min(MAX_PIXELS_PER_EVENT, pixels));
}

/**
 * Moving through the world is scrolling, dragging or pressing an arrow —
 * never a flight simulator. The visitor cannot leave the rail, so there is no
 * way to get lost, and no control to learn.
 */
export function useJourneyInput(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    /**
     * An open panel is a scrollable surface floating over the scene. Scrolling
     * it has to scroll it — driving the camera from under the visitor's cursor
     * while they are reading is the kind of thing that makes a 3D site feel
     * hostile.
     */
    const overPanel = (target: EventTarget | null) =>
      target instanceof Element && target.closest(".panel") !== null;

    /** Scroll inside a building is measured in floors, so it accumulates. */
    let climbed = 0;

    const onWheel = (event: WheelEvent) => {
      if (overPanel(event.target)) return;
      // The page itself does not scroll while the world is on screen; letting
      // the browser also scroll would fight the rail.
      event.preventDefault();

      const snapshot = getSnapshot();
      if (snapshot.level === "building") {
        // Inside, the same gesture means something else: the scroll walks up
        // the building instead of down the avenue. Leaving the rail wired here
        // would fling the visitor out of a building they are reading.
        climbed += wheelPixels(event);
        const floors = Math.trunc(climbed / PIXELS_PER_FLOOR);
        if (floors !== 0) {
          climbed -= floors * PIXELS_PER_FLOOR;
          stepFloor(floors, floorsOf(snapshot.selectedId));
        }
        return;
      }

      advance(wheelPixels(event) / PIXELS_PER_RAIL);
    };

    /**
     * Dragging swings the view around the building being stood at.
     *
     * Only once the rail has arrived somewhere: an orbit while travelling would
     * be a second camera control fighting the first, and the rail is what makes
     * this world impossible to get lost in.
     */
    let dragging: number | null = null;
    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0 || overPanel(event.target)) return;
      if (getSnapshot().level === "city") return;
      dragging = event.clientX;
    };
    const onPointerMove = (event: PointerEvent) => {
      if (dragging === null) return;
      orbitBy((event.clientX - dragging) * ORBIT_PER_PIXEL);
      dragging = event.clientX;
    };
    const onPointerUp = () => {
      dragging = null;
    };

    let lastTouchY: number | null = null;
    const onTouchStart = (event: TouchEvent) => {
      lastTouchY = overPanel(event.target)
        ? null
        : (event.touches[0]?.clientY ?? null);
    };
    const onTouchMove = (event: TouchEvent) => {
      const y = event.touches[0]?.clientY;
      if (y === undefined || lastTouchY === null) return;
      advance((lastTouchY - y) / TOUCH_PIXELS_PER_RAIL);
      lastTouchY = y;
    };
    const onTouchEnd = () => {
      lastTouchY = null;
    };

    const onKeyDown = (event: KeyboardEvent) => {
      // Never swallow keys aimed at a control — the HUD, the skip link, the
      // text layer. Containers are not controls, though: the open panel takes
      // focus so a screen reader lands on it, and matching `[tabindex]` here
      // meant that from the moment a building opened, every arrow key was
      // dropped and the floors could not be climbed at all.
      const target = event.target as HTMLElement | null;
      if (target && target.closest("a, button, input, textarea, select")) {
        return;
      }

      const snapshot = getSnapshot();
      const inside = snapshot.level === "building";

      switch (event.key) {
        case "Escape":
          if (!inside) break;
          event.preventDefault();
          exitBuilding();
          break;
        // Enter opens whatever the visitor is standing at. Clicking a building
        // is the obvious way in; this is the one that works without a pointer,
        // and it pairs with the year list, which is what Tab reaches.
        case "Enter":
          if (inside || snapshot.level !== "district") break;
          event.preventDefault();
          enterBuilding(snapshot.zoneId);
          break;
        // Arrows step between stations rather than nudging the rail: one press,
        // one place in the career, which is what a keyboard visitor wants.
        // Inside a building the same keys climb it, so the keyboard and the
        // scroll wheel never mean two different things at once.
        case "ArrowDown":
        case "ArrowRight":
          event.preventDefault();
          if (inside) stepFloor(1, floorsOf(snapshot.selectedId));
          else goToAdjacentStation(1);
          break;
        case "ArrowUp":
        case "ArrowLeft":
          event.preventDefault();
          if (inside) stepFloor(-1, floorsOf(snapshot.selectedId));
          else goToAdjacentStation(-1);
          break;
        case "PageDown":
        case " ":
          event.preventDefault();
          advance(0.08);
          break;
        case "PageUp":
          event.preventDefault();
          advance(-0.08);
          break;
        case "Home":
          event.preventDefault();
          setTarget(0);
          break;
        case "End":
          event.preventDefault();
          setTarget(1);
          break;
        default:
          break;
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [enabled]);
}
