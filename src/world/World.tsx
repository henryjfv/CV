"use client";

import { Bloom, EffectComposer } from "@react-three/postprocessing";
import * as THREE from "three";
import { Sky } from "./city/Sky";
import {
  CITY_CENTRE_X,
  CITY_CENTRE_Z,
  CITY_HALF_DEPTH,
  CITY_HALF_WIDTH,
  GROUND_MARGIN,
} from "./engine/bounds";
import { CameraRig } from "./engine/CameraRig";
import { Dust } from "./engine/Dust";
import { LabelCuller } from "./engine/LabelCuller";
import { sky } from "./engine/palette";
import type { QualitySettings } from "./engine/quality";
import { Entrance } from "./zones/Entrance/Entrance";
import { Journey } from "./zones/Journey/Journey";
import { Site } from "./zones/Site/Site";

/**
 * Everything inside the canvas.
 *
 * The city is lit by one low sun and the sky it sits under, and that is nearly
 * the whole scheme. Façades are pale, so all three tones of a volume — the face
 * the sun reaches, the face that only sees sky, and the face in shadow — are
 * produced by the light rather than painted on. Anything that tried to colour a
 * wall directly here would be undoing that.
 */
export function World({ quality }: { quality: QualitySettings }) {
  const animate = !quality.reducedMotion;
  // Phones and weak machines get the massing and the windows, and lose the
  // things that cost a draw call each and read at a metre: rooftop plant, the
  // mast, the beacon's lamp.
  const detailed = quality.tier === "high" || quality.tier === "mid";

  return (
    <>
      <Sky />
      {/* Horizon-coloured and thin: far districts have to settle into the dusk
          rather than float in front of it. Any denser and the closing tower —
          three hundred units down the axis — is gone before it is arrived at. */}
      <fogExp2 attach="fog" args={[sky.horizon, 0.0038]} />

      <CameraRig reducedMotion={quality.reducedMotion} />

      {/* Barely-there fill. The hemisphere below does the real ambient work;
          this only stops the deepest corners going to black. */}
      <ambientLight intensity={0.24} color={sky.upper} />

      {/* The setting sun. Low enough that the shadows run long across the
          ground plane, which is what says "late" without a clock anywhere. */}
      <directionalLight
        position={[86, 30, -110]}
        intensity={1.6}
        color="#ffb08a"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0005}
        // The shadow camera has to hold the whole city, not the default ten
        // units around the origin — otherwise only the entrance casts anything.
        shadow-camera-near={1}
        shadow-camera-far={520}
        shadow-camera-left={-140}
        shadow-camera-right={140}
        shadow-camera-top={140}
        shadow-camera-bottom={-140}
      />

      {/* Violet overhead, warm ground bounce. This is what puts the third tone
          on a façade: the face that sees neither sun nor shadow. */}
      <hemisphereLight
        args={[sky.upper, "#b8836e", 0.6]}
        position={[0, 40, -120]}
      />

      <Floor />
      <Entrance />
      <Site />
      <Journey animate={animate} detailed={detailed} />
      <Dust count={quality.particles} animate={animate} />

      {/* Last, so every label has already turned to face the camera by the
          time the collision pass measures where it landed. */}
      <LabelCuller />

      {quality.tier === "high" || quality.tier === "mid" ? <Post /> : null}
    </>
  );
}

/**
 * Bloom, and deliberately less of it than the reference asked for.
 *
 * Pale façades are already near the top of the range, so a bloom tuned for a
 * dark scene blows the walls out and takes the cornices with it — and the
 * cornice is the one detail holding the silhouette together. The threshold sits
 * high enough that only the lit windows and the beacon cross it.
 */
function Post() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        luminanceThreshold={0.85}
        luminanceSmoothing={0.2}
        intensity={0.35}
        radius={0.4}
        mipmapBlur
      />
    </EffectComposer>
  );
}

/**
 * The ground the city stands on: asphalt at dusk, taking the long shadows.
 *
 * Sized from `cityBox` rather than by hand. The plane used to carry its own
 * numbers and stopped 30 units short of the closing tower, leaving the last
 * building of the whole career — the one shot that has to land — standing on
 * nothing.
 */
function Floor() {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[CITY_CENTRE_X, 0, CITY_CENTRE_Z]}
      receiveShadow
    >
      <planeGeometry
        args={[
          (CITY_HALF_WIDTH + GROUND_MARGIN) * 2,
          (CITY_HALF_DEPTH + GROUND_MARGIN) * 2,
        ]}
      />
      {/* Matte, not polished. A reflective floor turned every lamp into a
          large soft stain across the bottom of the frame. */}
      <meshStandardMaterial
        color={new THREE.Color("#6a5751")}
        roughness={0.95}
        metalness={0.05}
      />
    </mesh>
  );
}
