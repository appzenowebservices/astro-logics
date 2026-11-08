// Tracking layer (phase 1): screen -> ground-plane unprojection for placement.
// A WebXR hit-test provider and a vision (MediaPipe) provider plug into the same
// target ref contract in later phases; nothing here depends on them.

import * as THREE from "three";

const GROUND_PLANE = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const RAYCASTER = new THREE.Raycaster();

export const PLACE_LIMITS = { x: 2.6, zNear: -4, zFar: 1.6 };

/**
 * Unproject a viewport point onto the y=0 ground plane.
 * `mirrored` flips the X axis because the mirrored stage is CSS-scaled.
 * Returns { x, z } or null when the ray never meets the plane.
 */
export function screenToGround(clientX, clientY, rect, camera, mirrored, out) {
  const nx = (clientX - rect.left) / rect.width;
  const ny = (clientY - rect.top) / rect.height;
  const ndcX = mirrored ? -(nx * 2 - 1) : nx * 2 - 1;
  const ndcY = -(ny * 2 - 1);
  RAYCASTER.setFromCamera({ x: ndcX, y: ndcY }, camera);
  const hit = RAYCASTER.ray.intersectPlane(GROUND_PLANE, out);
  return hit ? { x: hit.x, z: hit.z } : null;
}

export function clampPoint(x, z) {
  return {
    x: THREE.MathUtils.clamp(x, -PLACE_LIMITS.x, PLACE_LIMITS.x),
    z: THREE.MathUtils.clamp(z, PLACE_LIMITS.zNear, PLACE_LIMITS.zFar),
  };
}

export const damp = THREE.MathUtils.damp;
