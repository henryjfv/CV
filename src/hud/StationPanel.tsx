"use client";

import { useEffect, useRef } from "react";
import type { Station } from "@/data/world";

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
  onClose,
}: {
  station: Station;
  onClose: () => void;
}) {
  const panel = useRef<HTMLElement>(null);

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

      {/* Grouped by tier rather than listed flat, so the panel repeats the
          shape the building just showed: interfaces over services over data. */}
      <dl className="panel__layers">
        {station.layers.map((layer) => (
          <div key={layer.id} className={`panel__layer panel__layer--${layer.id}`}>
            <dt>{layer.label}</dt>
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
