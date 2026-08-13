"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";
import { facadeFamily, litFraction, type BuildingSpec } from "@/data/city";
import { facade, TRIM } from "../engine/palette";
import { buildMassing, CORNICE_HEIGHT } from "./massing";
import { useWindowTexture } from "./useWindowTexture";

/** Glass from the street, and all but clear once the visitor is inside. */
const SHELL_OPACITY = 0.52;
const ENTERED_OPACITY = 0.15;

/**
 * A building, as it is seen from the street.
 *
 * The shell is translucent on purpose. Every earlier version of this scene drew
 * the system inside the building — tiers, technology nodes, traffic running
 * between them — and a solid wall would have thrown all of it away in exchange
 * for a skyline. So the façade is glass: from the avenue the volume reads as a
 * building, and the architecture behind it stays legible as a glow through it.
 *
 * The trim does not follow that rule. Cornices, rooftop plant and the mast are
 * opaque, because the silhouette is what stops a translucent volume reading as
 * a hologram — the edges have to be solid even when the walls are not.
 */
export function Facade({
  spec,
  half,
  height,
  active,
  entered,
  animate,
  detailed,
}: {
  spec: BuildingSpec;
  half: number;
  height: number;
  active: boolean;
  entered: boolean;
  animate: boolean;
  detailed: boolean;
}) {
  const massing = useMemo(
    () => buildMassing(spec, half, height),
    [spec, half, height]
  );

  /**
   * A shaft and a cornice per tier, extruded at true size.
   *
   * True size rather than one plan scaled per tier, because the window grid is
   * mapped in world units — see `useWindowTexture`. The cost is a few more
   * geometries for eight buildings, which is nothing next to windows that
   * change size as the tower steps in.
   */
  const geometries = useMemo(
    () =>
      massing.tiers.map((tier) => ({
        shaft: new THREE.ExtrudeGeometry(tier.shape, {
          depth: tier.height,
          bevelEnabled: false,
        }),
        cornice: new THREE.ExtrudeGeometry(tier.corniceShape, {
          depth: CORNICE_HEIGHT,
          bevelEnabled: false,
        }),
      })),
    [massing.tiers]
  );

  const family = facadeFamily(spec);
  // The grid itself is always drawn; only the flicker is a device decision.
  const grid = useWindowTexture(family, litFraction(spec), animate && detailed);

  const shell = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(facade[family]),
        roughness: 0.7,
        metalness: 0.05,
        transparent: true,
        opacity: SHELL_OPACITY,
        // Without this the shell writes depth and hides the very tiers it
        // exists to reveal — the glass would be opaque to everything drawn
        // after it, which in this scene is the entire system.
        depthWrite: false,
        side: THREE.DoubleSide,
        // The windows are emissive, not painted: the lit cells have to survive
        // being in shadow, which is where most of this city is.
        emissive: new THREE.Color("#ffffff"),
        emissiveIntensity: 1,
        emissiveMap: grid,
      }),
    [family, grid]
  );

  const trim = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(TRIM),
        roughness: 0.8,
        metalness: 0.1,
      }),
    []
  );

  /**
   * Going in turns the glass almost clear.
   *
   * Eased in the frame loop rather than swapped: the whole point of entering is
   * watching the shell let go of the system it was holding, and a jump cut
   * between two opacities does not read as anything at all.
   */
  useFrame((_, delta) => {
    const wanted = entered ? ENTERED_OPACITY : SHELL_OPACITY;
    if (Math.abs(shell.opacity - wanted) < 0.002) return;
    const step = Math.min(delta * 2.6, 1);
    // three.js materials are mutated in place by design; the lint rule is aimed
    // at React state, and this is neither.
    // eslint-disable-next-line react-hooks/immutability
    shell.opacity += (wanted - shell.opacity) * step;
  });

  const beacon = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#ff6b57"),
        emissive: new THREE.Color("#ff6b57"),
        emissiveIntensity: 2.4,
        toneMapped: false,
      }),
    []
  );

  return (
    <group>
      {massing.tiers.map((tier, index) => (
        <group key={index}>
          <mesh
            geometry={geometries[index].shaft}
            material={shell}
            castShadow
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, tier.base, 0]}
          />
          {/* The cornice: the single detail that stops a box being a box. */}
          <mesh
            geometry={geometries[index].cornice}
            material={trim}
            castShadow
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, tier.corniceBase, 0]}
          />
        </group>
      ))}

      {/* Rooftop plant is the first thing to go on a weak device: two boxes a
          few pixels across, times eight buildings, for a silhouette the fog
          has already softened. The cornices stay — those carry the form. */}
      {(detailed ? massing.props : []).map((prop, index) => (
        <mesh
          key={index}
          material={trim}
          castShadow
          position={[prop.x, prop.y, prop.z]}
        >
          <boxGeometry args={[prop.width, prop.height, prop.depth]} />
        </mesh>
      ))}

      {massing.mast ? (
        <group>
          <mesh material={trim} position={[0, massing.mast.y, 0]}>
            <cylinderGeometry
              args={[
                massing.mast.radius,
                massing.mast.radius,
                massing.mast.height,
                6,
              ]}
            />
          </mesh>
          {/* The beacon marks what is still running. It is the only red in the
              city, and one building wears it. */}
          <mesh material={beacon} position={[0, massing.mast.beaconY, 0]}>
            <sphereGeometry args={[0.22, 8, 8]} />
          </mesh>
          {active && detailed ? (
            <pointLight
              position={[0, massing.mast.beaconY, 0]}
              color="#ff6b57"
              intensity={6}
              distance={12}
              decay={2}
            />
          ) : null}
        </group>
      ) : null}
    </group>
  );
}
