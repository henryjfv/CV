"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { stations } from "@/data/world";
import { journey, tick } from "./journey";
import { railGaze, railPath } from "./rail";

/**
 * The camera never free-flies. It rides a fixed rail through the world and the
 * pointer only nudges the framing by a few degrees, which is what keeps the
 * experience cinematic instead of a game the visitor has to learn to play.
 */

const PARALLAX_STRENGTH = 1.15;

/**
 * The atrium wall is 26 units wide and the camera meets it from 26 away. Any
 * viewport narrower than widescreen crops it — which is why the name and the
 * engraved lines were running off both edges of the frame.
 *
 * Rather than shrinking the type until it fits the worst case, the camera opens
 * up as the window narrows. Capped, because past about seventy degrees the
 * perspective distortion costs more than the crop did.
 */
const REQUIRED_WIDTH = 30;
const REQUIRED_AT_DISTANCE = 26;
const BASE_FOV = 42;
const MAX_FOV = 70;

function fovForViewport(aspect: number): number {
  const halfHorizontal = Math.atan(REQUIRED_WIDTH / 2 / REQUIRED_AT_DISTANCE);
  const vertical = 2 * Math.atan(Math.tan(halfHorizontal) / aspect);
  const degrees = (vertical * 180) / Math.PI;
  return Math.min(MAX_FOV, Math.max(BASE_FOV, degrees));
}
/**
 * The gaze curve now runs through the centre of every station, so the framing
 * is already right and this only adds a little extra attention on approach.
 * It used to do the whole job, and swung the camera far enough that half the
 * frame was empty sky.
 */
const INTEREST_RANGE = 26;
const INTEREST_STRENGTH = 0.18;

const position = new THREE.Vector3();
const lookAt = new THREE.Vector3();
const interest = new THREE.Vector3();
const parallax = new THREE.Vector2();

export function CameraRig({ reducedMotion }: { reducedMotion: boolean }) {
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);
  const pointer = useRef(new THREE.Vector2(0, 0));

  useEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;
    // three.js objects are mutated in place by design, and R3F expects exactly
    // this — the camera is an external system, not React state.
    // eslint-disable-next-line react-hooks/immutability
    camera.fov = fovForViewport(size.width / size.height);
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height]);

  // Precomputed once: the point the camera should turn towards as it passes
  // each station — roughly the middle of its mass, not its foundation.
  const focalPoints = useMemo(
    () =>
      stations.map((station) => ({
        z: station.position.z,
        point: new THREE.Vector3(
          station.position.x,
          2 + station.complexity * 1.6,
          station.position.z
        ),
      })),
    []
  );

  useEffect(() => {
    if (reducedMotion) return;
    const onPointerMove = (event: PointerEvent) => {
      // -1 … 1 across the viewport.
      pointer.current.set(
        (event.clientX / window.innerWidth) * 2 - 1,
        (event.clientY / window.innerHeight) * 2 - 1
      );
    };
    window.addEventListener("pointermove", onPointerMove);
    return () => window.removeEventListener("pointermove", onPointerMove);
  }, [reducedMotion]);

  useFrame((_, rawDelta) => {
    // A tab that was backgrounded returns one enormous delta; clamping it stops
    // the camera from teleporting on the first frame back.
    const dt = Math.min(rawDelta, 0.05);
    tick(dt, reducedMotion);

    const t = journey.progress;
    railPath.getPoint(t, position);
    railGaze.getPoint(t, lookAt);

    // Passing a building and not looking at it is what makes a fly-through feel
    // like a screensaver. The nearest station pulls the gaze, and lets go.
    let strongest = 0;
    for (const focal of focalPoints) {
      const distance = Math.abs(position.z - focal.z);
      if (distance > INTEREST_RANGE) continue;
      const weight = (1 - distance / INTEREST_RANGE) ** 2;
      if (weight > strongest) {
        strongest = weight;
        interest.copy(focal.point);
      }
    }
    if (strongest > 0) {
      lookAt.lerp(interest, strongest * INTEREST_STRENGTH);
    }

    parallax.lerp(pointer.current, 1 - Math.exp(-4 * dt));
    if (!reducedMotion) {
      lookAt.x += parallax.x * PARALLAX_STRENGTH;
      lookAt.y -= parallax.y * PARALLAX_STRENGTH * 0.5;
    }

    camera.position.copy(position);
    camera.lookAt(lookAt);
  });

  return null;
}
