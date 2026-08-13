"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { stations } from "@/data/world";
import { enterBuilding, getSnapshot, subscribe } from "../../engine/journey";
import { stationHeight } from "../../engine/metrics";
import { palette } from "../../engine/palette";
import { Station } from "./Station";

/** Reused every frame so the travelling lamp allocates nothing. */
const target = new THREE.Vector3();

/**
 * 02 — THE JOURNEY.
 *
 * The four stations, placed along the avenue. Which one is awake is worked out
 * from the camera's own position in the frame loop, and only written to state
 * when it actually changes — a handful of rerenders across the whole walk,
 * rather than sixty a second.
 */
export function Journey({
  animate,
  detailed,
}: {
  animate: boolean;
  detailed: boolean;
}) {
  // The active station comes from the journey state, which is also what the
  // navigation highlights. Deriving it here from camera distance instead — as
  // this did — meant the building that lit up and the entry marked in the nav
  // could disagree, and they did.
  const [activeId, setActiveId] = useState<string | null>(
    () => getSnapshot().zoneId
  );
  // Which building the visitor is inside, if any. Separate from `activeId`:
  // the station being approached and the one being stood in are different
  // things, and only the second one turns its walls to glass.
  const [enteredId, setEnteredId] = useState<string | null>(() => {
    const snapshot = getSnapshot();
    return snapshot.level === "building" ? snapshot.selectedId : null;
  });

  useEffect(
    () =>
      subscribe((snapshot) => {
        setActiveId(snapshot.zoneId);
        setEnteredId(snapshot.level === "building" ? snapshot.selectedId : null);
      }),
    []
  );

  const lamp = useRef<THREE.PointLight>(null);

  useFrame((_, delta) => {
    // A single lamp that travels to whichever station is awake, instead of one
    // light per station. Six point lights would be six real costs on every
    // material in range; this is one, and it makes arriving somewhere feel like
    // the lights coming up.
    const light = lamp.current;
    if (!light) return;
    const station = stations.find((entry) => entry.id === activeId);
    const step = Math.min(delta * 2, 1);
    if (station) {
      // Above the roof, not inside the building: a lamp at a fixed height ended
      // up between the floors of the taller stations and glowed through them.
      light.position.lerp(
        target.set(
          station.position.x,
          stationHeight(station) + 9,
          station.position.z
        ),
        step
      );
      light.intensity += (160 - light.intensity) * step;
    } else {
      light.intensity += (0 - light.intensity) * step;
    }
  });

  return (
    <group>
      {/* Warm, and dimmer than it was under the graphite palette: a cold lamp
          at full strength over a city at dusk reads as a searchlight, not as
          the building the visitor has arrived at. */}
      <pointLight
        ref={lamp}
        color="#ffd9b8"
        intensity={0}
        distance={70}
        decay={2}
      />
      {stations.map((station) => (
        <Station
          key={station.id}
          data={station}
          active={activeId === station.id}
          entered={enteredId === station.id}
          animate={animate}
          detailed={detailed}
          onSelect={() => enterBuilding(station.id)}
        />
      ))}
    </group>
  );
}
