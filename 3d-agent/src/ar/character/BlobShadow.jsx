// Shared soft blob shadow used by every character path.

import { useMemo } from "react";
import * as THREE from "three";

let cachedTexture = null;

function getBlobTexture() {
  if (cachedTexture) return cachedTexture;
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 6, size / 2, size / 2, size / 2 - 2);
  gradient.addColorStop(0, "rgba(0, 0, 0, 0.55)");
  gradient.addColorStop(0.55, "rgba(0, 0, 0, 0.26)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  cachedTexture = new THREE.CanvasTexture(canvas);
  cachedTexture.colorSpace = THREE.SRGBColorSpace;
  return cachedTexture;
}

export function BlobShadow({ shadowRef, materialRef, size = 1 }) {
  const texture = useMemo(() => getBlobTexture(), []);
  return (
    <mesh ref={shadowRef} rotation-x={-Math.PI / 2} position={[0, 0.003, 0]} renderOrder={-1}>
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial
        ref={materialRef}
        map={texture}
        transparent
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}
