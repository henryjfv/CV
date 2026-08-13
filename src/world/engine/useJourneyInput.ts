"use client";

import { useEffect } from "react";
import { advance, goToAdjacentStation, setTarget } from "./journey";

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

    const onWheel = (event: WheelEvent) => {
      if (overPanel(event.target)) return;
      // The page itself does not scroll while the world is on screen; letting
      // the browser also scroll would fight the rail.
      event.preventDefault();
      advance(wheelPixels(event) / PIXELS_PER_RAIL);
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
      // Never swallow keys aimed at the HUD, the skip link or the text layer.
      const target = event.target as HTMLElement | null;
      if (target && target.closest("a, button, input, textarea, [tabindex]")) {
        return;
      }

      switch (event.key) {
        // Arrows step between stations rather than nudging the rail: one press,
        // one place in the career, which is what a keyboard visitor wants.
        case "ArrowDown":
        case "ArrowRight":
          event.preventDefault();
          goToAdjacentStation(1);
          break;
        case "ArrowUp":
        case "ArrowLeft":
          event.preventDefault();
          goToAdjacentStation(-1);
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
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [enabled]);
}
