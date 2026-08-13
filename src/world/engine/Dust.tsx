"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { palette } from "./palette";

/**
 * Suspended particles, moved entirely on the GPU.
 *
 * The alternative — writing new positions into a buffer every frame — costs
 * CPU time proportional to the particle count and would be the first thing to
 * drop frames on a laptop. Here the count only costs vertices.
 */

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  attribute float aSeed;
  varying float vFade;

  void main() {
    vec3 p = position;
    float phase = aSeed * 6.2831853;
    p.y += sin(uTime * 0.17 + phase) * 0.7;
    p.x += cos(uTime * 0.11 + phase) * 0.5;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = uSize * (14.0 / max(-mv.z, 0.001));
    gl_Position = projectionMatrix * mv;

    // Nearer motes read brighter; the far field stays as texture.
    vFade = smoothstep(140.0, 8.0, -mv.z) * (0.35 + aSeed * 0.65);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  varying float vFade;

  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;
    float alpha = smoothstep(0.5, 0.0, d) * vFade * 0.55;
    gl_FragColor = vec4(uColor, alpha);
  }
`;

/**
 * Seeded PRNG (mulberry32).
 *
 * `Math.random()` would be two problems at once: it is impure, so a render that
 * runs twice produces a different field, and it makes the scene unrepeatable —
 * a directed experience wants the same motes in the same places on every visit,
 * the way a set stays put between takes.
 */
function createRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function Dust({ count, animate }: { count: number; animate: boolean }) {
  const material = useRef<THREE.ShaderMaterial>(null);

  const geometry = useMemo(() => {
    const random = createRandom(0x5eed);
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i += 1) {
      positions[i * 3] = (random() - 0.5) * 90;
      positions[i * 3 + 1] = random() * 26;
      // Denser near the atrium, thinning out over the site.
      positions[i * 3 + 2] = 16 - Math.pow(random(), 0.7) * 130;
      seeds[i] = random();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    return geo;
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSize: { value: 2.4 },
      uColor: { value: new THREE.Color(palette.cloud) },
    }),
    []
  );

  useFrame((_, delta) => {
    if (!animate || !material.current) return;
    material.current.uniforms.uTime.value += Math.min(delta, 0.05);
  });

  if (count === 0) return null;

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
