"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { sky } from "../engine/palette";

/**
 * The sky, as four stops on an inverted sphere.
 *
 * Not an image: this site is exported statically to GitHub Pages and a sky
 * texture large enough not to band would outweigh the entire JavaScript bundle.
 * Not a flat background colour either — a single colour behind a city reads as
 * a backdrop, and what makes dusk legible is the band of violet sitting between
 * the navy overhead and the burn at the horizon.
 *
 * The dome rides with the camera and the gradient is read in object space, so
 * the horizon sits at eye level everywhere. Left at the origin it would not:
 * the camera travels three hundred units down the world and would end up close
 * enough to the far wall of its own sky to see the gradient bend.
 */

const vertexShader = /* glsl */ `
  varying vec3 vDirection;
  void main() {
    // Object space, and the object is centred on the camera: this *is* the
    // view direction, with nothing to transform.
    vDirection = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uZenith;
  uniform vec3 uUpper;
  uniform vec3 uLower;
  uniform vec3 uHorizon;
  varying vec3 vDirection;

  void main() {
    float h = normalize(vDirection).y;
    // The interesting third of the sky is the strip just above the horizon, so
    // the stops are bunched there rather than spread evenly to the zenith.
    vec3 colour = mix(uHorizon, uLower, smoothstep(0.0, 0.09, h));
    colour = mix(colour, uUpper, smoothstep(0.06, 0.32, h));
    colour = mix(colour, uZenith, smoothstep(0.28, 0.85, h));
    // Below the horizon the ground plane takes over; holding the horizon colour
    // there keeps the seam invisible wherever the plane ends.
    colour = mix(uHorizon, colour, smoothstep(-0.04, 0.01, h));
    gl_FragColor = vec4(colour, 1.0);
  }
`;

export function Sky() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uZenith: { value: new THREE.Color(sky.zenith) },
          uUpper: { value: new THREE.Color(sky.upper) },
          uLower: { value: new THREE.Color(sky.lower) },
          uHorizon: { value: new THREE.Color(sky.horizon) },
        },
        side: THREE.BackSide,
        // The dome is behind everything by construction; writing depth would
        // only give the far clip plane something to fight with.
        depthWrite: false,
        fog: false,
      }),
    []
  );

  const dome = useRef<THREE.Mesh>(null);

  useFrame(({ camera }) => {
    dome.current?.position.copy(camera.position);
  });

  // Inside the camera's far plane (400), and low-poly: it is a gradient, and a
  // gradient does not need geometry.
  return (
    <mesh ref={dome} material={material} renderOrder={-1} frustumCulled={false}>
      <sphereGeometry args={[360, 24, 16]} />
    </mesh>
  );
}
