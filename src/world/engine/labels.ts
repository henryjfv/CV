/**
 * Which labels are allowed to be on screen at once.
 *
 * Type in a 3D scene has a problem flat design does not: two labels can be
 * metres apart in the world and land on top of each other in the frame, and
 * which pair does that changes every time the camera moves. Laying them out
 * once is not an option — the layout has to be recomputed from where the camera
 * actually is.
 *
 * So every label that could collide registers here, and one pass per frame
 * decides. Two rules, in this order:
 *
 *  1. **Nothing may be cut by the edge of the frame.** A half-word at the
 *     border reads as a bug, not as a label that ran out of room.
 *  2. **Nearest wins.** Labels are placed in order of distance to the camera,
 *     and anything overlapping something already placed is dropped. Priority
 *     lets the building being stood at keep its type when the one behind it
 *     would otherwise win on distance alone.
 *
 * The pass is greedy rather than optimal. An optimal packing would flicker:
 * the winner of a contested pair would change as the camera drifts, which is
 * worse than a label that stays hidden for as long as it is contested.
 */

import * as THREE from "three";

export type LabelHandle = {
  mesh: THREE.Mesh;
  /** Plate size in world units, used to work out how big it lands on screen. */
  width: number;
  height: number;
  /** Higher wins ties. The active station's labels are raised above the rest. */
  priority: number;
};

const registry = new Set<LabelHandle>();

export function registerLabel(handle: LabelHandle): () => void {
  registry.add(handle);
  return () => {
    registry.delete(handle);
  };
}

type Placed = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

const worldPosition = new THREE.Vector3();
const projected = new THREE.Vector3();

/**
 * Runs the pass. Called from a single frame loop rather than from each label,
 * because the decision is about all of them together.
 */
export function cullLabels(
  camera: THREE.PerspectiveCamera,
  viewportWidth: number,
  viewportHeight: number
) {
  if (registry.size === 0) return;

  const halfFovTan = Math.tan(((camera.fov / 2) * Math.PI) / 180);
  const candidates: { handle: LabelHandle; rect: Placed; order: number }[] = [];

  for (const handle of registry) {
    const { mesh } = handle;
    if (!mesh.parent) continue;

    mesh.getWorldPosition(worldPosition);
    const distance = camera.position.distanceTo(worldPosition);

    projected.copy(worldPosition).project(camera);
    // Behind the camera, or outside the frustum entirely.
    if (projected.z > 1) {
      mesh.visible = false;
      continue;
    }

    // Labels billboard, so their plate always faces the camera: the on-screen
    // size is the world size scaled by how far away it is.
    const pixelsPerUnit = viewportHeight / (2 * halfFovTan * distance);
    const w = handle.width * pixelsPerUnit;
    const h = handle.height * pixelsPerUnit;
    const cx = ((projected.x + 1) / 2) * viewportWidth;
    const cy = ((1 - projected.y) / 2) * viewportHeight;

    const rect: Placed = {
      left: cx - w / 2,
      right: cx + w / 2,
      top: cy - h / 2,
      bottom: cy + h / 2,
    };

    // Rule 1: never cut by the frame. A label wholly off screen is simply not
    // in shot; one straddling the edge is the thing that looks broken.
    const offScreen =
      rect.right < 0 ||
      rect.left > viewportWidth ||
      rect.bottom < 0 ||
      rect.top > viewportHeight;
    const clipped =
      !offScreen &&
      (rect.left < 0 ||
        rect.right > viewportWidth ||
        rect.top < 0 ||
        rect.bottom > viewportHeight);

    if (offScreen || clipped) {
      mesh.visible = false;
      continue;
    }

    candidates.push({ handle, rect, order: distance - handle.priority * 1000 });
  }

  candidates.sort((a, b) => a.order - b.order);

  const placed: Placed[] = [];
  for (const candidate of candidates) {
    const clash = placed.some(
      (rect) =>
        candidate.rect.left < rect.right &&
        candidate.rect.right > rect.left &&
        candidate.rect.top < rect.bottom &&
        candidate.rect.bottom > rect.top
    );
    candidate.handle.mesh.visible = !clash;
    if (!clash) placed.push(candidate.rect);
  }
}
