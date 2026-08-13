"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { stations } from "@/data/world";
import { getSnapshot, selectStation, subscribe } from "../../engine/journey";
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
export function Journey({ animate }: { animate: boolean }) {
  // The active station comes from the journey state, which is also what the
  // navigation highlights. Deriving it here from camera distance instead — as
  // this did — meant the building that lit up and the entry marked in the nav
  // could disagree, and they did.
  const [activeId, setActiveId] = useState<string | null>(
    () => getSnapshot().zoneId
  );

  useEffect(() => subscribe((snapshot) => setActiveId(snapshot.zoneId)), []);

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
      light.position.lerp(
        target.set(station.position.x, 14, station.position.z),
        step
      );
      light.intensity += (300 - light.intensity) * step;
    } else {
      light.intensity += (0 - light.intensity) * step;
    }
  });

  return (
    <group>
      <pointLight
        ref={lamp}
        color={palette.cloud}
        intensity={0}
        distance={70}
        decay={2}
      />
      {stations.map((station) => (
        <Station
          key={station.id}
          data={station}
          active={activeId === station.id}
          animate={animate}
          onSelect={() => selectStation(station.id)}
        />
      ))}
    </group>
  );
}
