"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

export type FlowSegment = {
  from: [number, number, number];
  to: [number, number, number];
  color: THREE.Color;
};

/**
 * Requests moving through a system.
 *
 * Every particle is a point that interpolates between the two ends of its
 * segment, entirely in the vertex shader — the CPU never touches a position,
 * so a station with forty connections costs one draw call and no per-frame
 * work. This is what makes an architecture read as running rather than drawn.
 */

const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  uniform float uIntensity;
  attribute vec3 aFrom;
  attribute vec3 aTo;
  attribute float aOffset;
  attribute vec3 aColor;
  varying vec3 vColor;
  varying float vFade;

  void main() {
    float t = fract(uTime * 0.28 + aOffset);
    vec3 p = mix(aFrom, aTo, t);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = uSize * (14.0 / max(-mv.z, 0.001));
    gl_Position = projectionMatrix * mv;

    vColor = aColor;
    // Fade in and out at the ends, so packets arrive rather than blink off.
    vFade = smoothstep(0.0, 0.12, t) * (1.0 - smoothstep(0.85, 1.0, t)) * uIntensity;
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vFade;

  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;
    gl_FragColor = vec4(vColor, smoothstep(0.5, 0.0, d) * vFade);
  }
`;

export function FlowParticles({
  segments,
  perSegment = 3,
  active,
  animate,
}: {
  segments: FlowSegment[];
  perSegment?: number;
  /** Traffic is barely visible until the visitor is at the station. */
  active: boolean;
  animate: boolean;
}) {
  const material = useRef<THREE.ShaderMaterial>(null);

  const geometry = useMemo(() => {
    const count = segments.length * perSegment;
    const positions = new Float32Array(count * 3);
    const from = new Float32Array(count * 3);
    const to = new Float32Array(count * 3);
    const color = new Float32Array(count * 3);
    const offset = new Float32Array(count);

    let i = 0;
    for (const segment of segments) {
      for (let k = 0; k < perSegment; k += 1) {
        from.set(segment.from, i * 3);
        to.set(segment.to, i * 3);
        color.set([segment.color.r, segment.color.g, segment.color.b], i * 3);
        // Evenly spaced along the segment, so traffic is a stream and not a
        // clump. No randomness: the scene must look the same on every visit.
        offset[i] = k / perSegment;
        i += 1;
      }
    }

    const geo = new THREE.BufferGeometry();
    // `position` goes unused by the shader but three needs it to size the draw.
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aFrom", new THREE.BufferAttribute(from, 3));
    geo.setAttribute("aTo", new THREE.BufferAttribute(to, 3));
    geo.setAttribute("aColor", new THREE.BufferAttribute(color, 3));
    geo.setAttribute("aOffset", new THREE.BufferAttribute(offset, 1));
    return geo;
  }, [segments, perSegment]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSize: { value: 3.6 },
      uIntensity: { value: 0.25 },
    }),
    []
  );

  useFrame((_, delta) => {
    const current = material.current;
    if (!current) return;
    if (animate) current.uniforms.uTime.value += Math.min(delta, 0.05);
    const target = active ? 1 : 0.22;
    current.uniforms.uIntensity.value +=
      (target - current.uniforms.uIntensity.value) * Math.min(delta * 2.5, 1);
  });

  if (segments.length === 0) return null;

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
