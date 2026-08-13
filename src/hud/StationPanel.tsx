"use client";

import { useEffect, useMemo, useRef } from "react";
import type { Station } from "@/data/world";
import { worldTiers } from "@/world/engine/metrics";

/**
 * What a station is, in words.
 *
 * Deliberately ordinary DOM rather than markup projected into the scene: this
 * is where the actual claims of the CV are made, and they have to be
 * selectable, readable by a screen reader and reachable by keyboard. The world
 * says "this role was bigger than the last one"; the panel says what it was.
 */
export function StationPanel({
  station,
  floor,
  onFloor,
  onClose,
}: {
  station: Station;
  /** Which floor the camera is on. The panel and the building stay in step. */
  floor: number;
  onFloor: (floor: number) => void;
  onClose: () => void;
}) {
  const panel = useRef<HTMLElement>(null);

  // Floor numbers count from the ground up — that is what the camera climbs —
  // but the list reads top-down, so the numbering is kept and the order
  // reversed rather than the other way round.
  const floors = useMemo(
    () =>
      worldTiers(station)
        .map((layer, index) => ({ layer, index }))
        .reverse(),
    [station]
  );

  useEffect(() => {
    panel.current?.focus();
  }, [station.id]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <aside
      ref={panel}
      className="panel"
      tabIndex={-1}
      aria-label={`${station.role.title}, ${station.role.period}`}
    >
      <header className="panel__head">
        <p className="panel__year">
          {station.yearLabel} · {station.stage}
        </p>
        <button
          type="button"
          className="panel__close"
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>
      </header>

      <h2 className="panel__title">{station.role.title}</h2>
      <p className="panel__context">
        {station.role.context}
        <span aria-hidden="true"> · </span>
        {station.role.period}
      </p>

      <ul className="panel__highlights">
        {station.role.highlights.map((highlight) => (
          <li key={highlight}>{highlight}</li>
        ))}
      </ul>

      {/* The floors of the building, listed the way a building directory is:
          top floor first. The one the camera is standing on is marked —
          scrolling the world moves this marker, and clicking a floor moves the
          world. The panel is not a modal over the scene; it is its index. */}
      <dl className="panel__layers">
        {floors.map(({ layer, index }) => (
          <div
            key={layer.id}
            className={`panel__layer panel__layer--${layer.id}${
              index === floor ? " is-current" : ""
            }`}
          >
            <dt>
              <button type="button" onClick={() => onFloor(index)}>
                {layer.label}
              </button>
            </dt>
            <dd>
              {layer.nodes.map((node) => (
                <span key={node}>{node}</span>
              ))}
            </dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}
