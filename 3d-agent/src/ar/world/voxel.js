// Voxel helpers: collect axis-aligned boxes into one merged, vertex-colored
// geometry so a whole street is a single draw call.

import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

export function boxesToGeometry(boxes) {
  const geometries = boxes.map(({ p, s, c }) => {
    const [w, h, d] = Array.isArray(s) ? s : [s, s, s];
    const geometry = new THREE.BoxGeometry(w, h, d);
    const color = new THREE.Color(c);
    const count = geometry.attributes.position.count;
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.translate(p[0], p[1], p[2]);
    return geometry;
  });
  return mergeGeometries(geometries);
}
