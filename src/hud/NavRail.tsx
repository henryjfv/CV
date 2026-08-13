"use client";

import { stations } from "@/data/world";
import { goToStation, setTarget } from "@/world/engine/journey";

/**
 * The secondary navigation the brief asks for: discreet, out of the way, and
 * there for the visitor who would rather jump than walk.
 *
 * It is a list of years rather than a menu of sections, because that is what
 * the world is — the only two places that are not a year are where you come in
 * and where the whole thing is.
 */
export function NavRail({ activeZone }: { activeZone: string }) {
  return (
    <nav className="nav" aria-label="Jump to a point in the career">
      <ul>
        <li>
          <button
            type="button"
            className={`nav__item${activeZone === "entrance" ? " is-active" : ""}`}
            onClick={() => setTarget(0)}
          >
            Identity
          </button>
        </li>
        {stations.map((station) => (
          <li key={station.id}>
            <button
              type="button"
              className={`nav__item${activeZone === station.id ? " is-active" : ""}`}
              onClick={() => goToStation(station.id)}
            >
              {/* The employer, not the year: two roles share 2023, and "2023"
                  twice in a list tells the visitor nothing about either. */}
              <span className="nav__where">{station.role.context}</span>
              <span className="nav__when">{station.yearLabel}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
