"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { stations } from "@/data/world";
import {
  exitBuilding,
  getSnapshot,
  goToFloor,
  journey,
  subscribe,
  type JourneySnapshot,
} from "@/world/engine/journey";
import { NavRail } from "./NavRail";
import { StationPanel } from "./StationPanel";

/**
 * The interface stays out of the way: a progress mark, two hints that retire
 * themselves, a discreet list of years, and one always-available way out to the
 * written CV. No navbar, nothing that competes with the architecture.
 */
export function Hud({ onExitToText }: { onExitToText: () => void }) {
  const [snapshot, setSnapshot] = useState<JourneySnapshot>(getSnapshot);
  const progressRef = useRef<HTMLSpanElement>(null);

  useEffect(() => subscribe(setSnapshot), []);

  // Read straight from the mutable journey object on its own frame loop: the
  // value changes continuously and is not worth a rerender.
  useEffect(() => {
    let frame = 0;
    const paint = () => {
      const node = progressRef.current;
      if (node) node.style.transform = `scaleY(${journey.progress})`;
      frame = requestAnimationFrame(paint);
    };
    frame = requestAnimationFrame(paint);
    return () => cancelAnimationFrame(frame);
  }, []);

  const closePanel = useCallback(() => exitBuilding(), []);

  const selected =
    snapshot.level === "building" && snapshot.selectedId
      ? stations.find((station) => station.id === snapshot.selectedId)
      : undefined;

  const atStation = stations.some((station) => station.id === snapshot.zoneId);

  return (
    <div className="hud">
      {/* First in the DOM, so it is the first thing a keyboard reaches. The
          canvas takes no focus, and an ordinary `#resume` anchor would point at
          an element the stylesheet is hiding while the world is up. */}
      <button type="button" className="hud__exit" onClick={onExitToText}>
        Read as text
      </button>

      {/* Held back until the visitor moves. The opening shot is type set into
          architecture, and a list of employers sits right on top of it —
          besides which, there is nothing to navigate to before you have set
          off. */}
      <div className={`hud__nav${snapshot.hasMoved ? " is-shown" : ""}`}>
        <NavRail activeZone={snapshot.zoneId} />
      </div>

      <div className="hud__progress" aria-hidden="true">
        <span ref={progressRef} className="hud__progress-fill" />
      </div>

      <p
        className={`hud__hints${snapshot.hasMoved ? " is-retired" : ""}`}
        aria-hidden={snapshot.hasMoved}
      >
        <span>Scroll to move</span>
        <span>Move the pointer to look</span>
      </p>

      {/* Only offered once there is something to click. The hint appears with
          the first station and never comes back. */}
      <p
        className={`hud__hints hud__hints--second${
          atStation && !snapshot.selectedId ? "" : " is-retired"
        }`}
        aria-hidden={!atStation || Boolean(snapshot.selectedId)}
      >
        <span>Click a building to open it</span>
      </p>

      {selected ? (
        <StationPanel
          station={selected}
          floor={snapshot.floor}
          onFloor={goToFloor}
          onClose={closePanel}
        />
      ) : null}
    </div>
  );
}
