// Voxel street world — an Indian market lane built entirely from code:
// cobbled ground, two side buildings (orange house, blue chai shop), a far
// facade, a fruit-mart stall, a tree and an auto-rickshaw. All static boxes
// merge into a single vertex-colored mesh (one draw call); the signs are
// canvas-textured planes.

import { useMemo } from "react";
import * as THREE from "three";
import { boxesToGeometry } from "./voxel";

const C = {
  orange: "#e6913a",
  orangeDark: "#c9762b",
  terracotta: "#a94f2c",
  cream: "#e8d9b8",
  blue: "#4f8fd0",
  blueDark: "#2f6ba3",
  frame: "#1c4f7a",
  glass: "#7fb3d5",
  glassLight: "#a8d8f0",
  green: "#2f7d4f",
  greenLight: "#57a86a",
  leaf: "#4c9a4f",
  leafDark: "#357a3c",
  wood: "#8a5a2a",
  woodDark: "#5f3c1c",
  black: "#1d1f24",
  grey: "#9aa0a6",
  yellow: "#f2c94c",
  red: "#d94b3d",
  concrete: "#b9b2a4",
};

function buildStreetBoxes() {
  const boxes = [];
  const add = (p, s, c) => boxes.push({ p, s, c });

  /* ---------- LEFT ORANGE HOUSE (front faces +x) ---------- */
  add([-5.4, 3.3, -2.5], [3.6, 6.6, 7], C.orange);
  add([-5.4, 6.72, -2.5], [3.9, 0.3, 7.3], C.terracotta);
  add([-5.4, 6.95, -2.5], [3.1, 0.2, 6.4], C.orangeDark);
  for (const y of [1.7, 3.5, 5.3]) {
    for (const z of [-5.3, -3.9, -2.5, -1.1, 0.3]) {
      add([-3.56, y, z], [0.12, 1.1, 0.9], C.frame);
      add([-3.5, y, z], [0.12, 0.82, 0.62], C.glass);
      add([-3.6, y + 0.65, z], [0.22, 0.12, 1.02], C.terracotta);
    }
  }
  // balcony on the second floor with plants
  add([-3.2, 2.58, -3.0], [1.1, 0.18, 3.2], C.cream);
  for (const z of [-4.4, -3.7, -3.0, -2.3, -1.6]) {
    add([-2.72, 2.92, z], [0.07, 0.62, 0.07], C.wood);
  }
  add([-2.72, 3.24, -3.0], [0.07, 0.08, 3.2], C.wood);
  add([-2.95, 3.02, -4.25], [0.28, 0.42, 0.28], C.leaf);
  add([-2.95, 3.02, -1.85], [0.28, 0.42, 0.28], C.leafDark);
  add([-3.56, 0.98, 1.5], [0.14, 1.96, 1.02], C.woodDark);

  /* ---------- RIGHT BLUE CHAI-SHOP BUILDING (front faces -x) ---------- */
  add([5.2, 2.6, -1.5], [3.4, 5.2, 6], C.blue);
  add([5.2, 5.32, -1.5], [3.7, 0.3, 6.3], C.blueDark);
  for (const y of [2.6, 3.9]) {
    for (const z of [-3.6, -2.2, -0.8, 0.6]) {
      add([3.46, y, z], [0.12, 1.0, 0.8], C.frame);
      add([3.41, y, z], [0.12, 0.72, 0.55], C.glassLight);
    }
  }
  // ground-floor shop: dark opening, counter, sign board
  add([3.46, 1.0, 1.4], [0.14, 2.0, 1.3], C.black);
  add([3.1, 0.52, 1.4], [0.6, 1.04, 1.5], C.wood);
  add([3.42, 2.32, 1.4], [0.2, 0.62, 1.6], C.terracotta);

  /* ---------- FAR FACADE (front faces +z) ---------- */
  add([0, 3.0, -11.5], [9, 6, 4], C.orange);
  add([0, 6.15, -11.5], [9.4, 0.3, 4.4], C.terracotta);
  for (const y of [1.8, 3.7]) {
    for (const x of [-3.2, -1.6, 0, 1.6, 3.2]) {
      add([x, y, -9.44], [0.9, 1.05, 0.12], C.frame);
      add([x, y, -9.38], [0.64, 0.78, 0.12], C.glass);
    }
  }
  add([0, 2.35, -9.35], [4.2, 0.42, 0.24], C.blueDark);
  add([-1.4, 0.98, -9.4], [1.0, 1.96, 0.16], C.woodDark);
  add([0, 0.04, -7.0], [9.2, 0.08, 5.5], C.concrete);

  /* ---------- FRUIT MART STALL (front faces +z) ---------- */
  const sx = -4.15;
  const sz = 1.2;
  for (const [dx, dz] of [[-0.8, -0.85], [0.8, -0.85], [-0.8, 0.85], [0.8, 0.85]]) {
    add([sx + dx, 1.05, sz + dz], [0.11, 2.1, 0.11], C.wood);
  }
  add([sx, 2.2, sz], [1.95, 0.12, 2.15], C.green);
  add([sx, 2.06, sz + 1.03], [1.75, 0.4, 0.08], C.greenLight);
  add([sx, 0.56, sz - 0.65], [1.7, 1.12, 0.45], C.wood);
  add([sx - 0.48, 0.24, sz + 0.05], [0.58, 0.48, 0.58], C.greenLight);
  add([sx + 0.2, 0.24, sz + 0.05], [0.58, 0.48, 0.58], "#3d6fb5");
  add([sx - 0.48, 0.72, sz + 0.05], [0.58, 0.48, 0.58], C.red);
  add([sx - 0.5, 1.18, sz - 0.68], [0.17, 0.17, 0.17], "#e8b93a");
  add([sx - 0.2, 1.18, sz - 0.72], [0.17, 0.17, 0.17], C.red);
  add([sx + 0.12, 1.18, sz - 0.68], [0.17, 0.17, 0.17], C.greenLight);
  add([sx + 0.44, 1.18, sz - 0.72], [0.17, 0.17, 0.17], "#e8833a");
  add([sx, 2.48, sz + 1.0], [1.85, 0.72, 0.12], C.green);

  /* ---------- TREE (right foreground) ---------- */
  const tx = 4.7;
  const tz = 2.1;
  add([tx, 0.9, tz], [0.42, 1.8, 0.42], C.wood);
  add([tx, 2.15, tz], [1.75, 0.95, 1.75], C.leaf);
  add([tx - 0.42, 2.8, tz - 0.32], [1.1, 0.7, 1.1], C.leafDark);
  add([tx + 0.5, 2.65, tz + 0.42], [0.95, 0.7, 0.95], C.greenLight);
  add([tx, 3.15, tz], [0.95, 0.62, 0.95], C.leaf);
  add([tx - 0.6, 2.3, tz + 0.3], [0.13, 0.13, 0.13], "#e8833a");
  add([tx + 0.55, 2.45, tz - 0.5], [0.13, 0.13, 0.13], "#e8b93a");
  add([tx + 0.2, 2.95, tz + 0.6], [0.13, 0.13, 0.13], "#e8833a");

  /* ---------- AUTO-RICKSHAW ---------- */
  const rx = 2.75;
  const rz = 0.3;
  add([rx, 0.56, rz], [1.02, 0.66, 1.52], C.green);
  add([rx, 1.08, rz - 0.06], [1.06, 0.46, 1.26], C.black);
  add([rx, 0.84, rz], [1.04, 0.12, 1.54], C.yellow);
  add([rx, 0.98, rz + 0.8], [0.86, 0.42, 0.07], C.glassLight);
  add([rx - 0.57, 0.3, rz - 0.5], [0.12, 0.62, 0.62], C.black);
  add([rx + 0.57, 0.3, rz - 0.5], [0.12, 0.62, 0.62], C.black);
  add([rx, 0.3, rz + 0.48], [0.15, 0.62, 0.15], C.black);
  add([rx, 0.72, rz + 0.84], [0.18, 0.18, 0.1], C.yellow);

  /* ---------- OVERHEAD CABLES ---------- */
  add([0.2, 4.7, -1.3], [7.5, 0.035, 0.035], C.black);
  add([0.2, 4.4, -0.2], [7.5, 0.035, 0.035], C.black);

  return boxes;
}

function cobbleTexture() {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#6f747b";
  ctx.fillRect(0, 0, size, size);
  const cols = 6;
  const rows = 6;
  const cw = size / cols;
  const ch = size / rows;
  const shades = ["#9aa0a6", "#8a9096", "#a4aab0", "#7d838a"];
  for (let y = 0; y < rows; y += 1) {
    for (let x = -1; x <= cols; x += 1) {
      const px = x * cw + (y % 2 ? cw * 0.5 : 0);
      const py = y * ch;
      ctx.fillStyle = shades[(x + y * 3 + shades.length) % shades.length];
      if (ctx.roundRect) {
        ctx.beginPath();
        ctx.roundRect(px + 2, py + 2, cw - 4, ch - 4, 7);
        ctx.fill();
      } else {
        ctx.fillRect(px + 2, py + 2, cw - 4, ch - 4);
      }
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(5, 7);
  return texture;
}

function signTexture(lines, { bg, fg = "#f4f1ea", border }) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 192;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = border ?? fg;
  ctx.lineWidth = 10;
  ctx.strokeRect(9, 9, canvas.width - 18, canvas.height - 18);
  ctx.fillStyle = fg;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const rowHeight = 64;
  lines.forEach((line, index) => {
    ctx.font = `bold ${line.size ?? 52}px "Segoe UI", ui-monospace, monospace`;
    ctx.fillText(line.text, canvas.width / 2, 96 + (index - (lines.length - 1) / 2) * rowHeight);
  });
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function Sign({ texture, position, rotationY = 0, width = 1.6, height = 0.6 }) {
  return (
    <mesh position={position} rotation-y={rotationY}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={texture} transparent toneMapped={false} />
    </mesh>
  );
}

export function VoxelStreet() {
  const geometry = useMemo(() => boxesToGeometry(buildStreetBoxes()), []);
  const cobbles = useMemo(() => cobbleTexture(), []);
  const fruitSign = useMemo(
    () =>
      signTexture([{ text: "FRUIT MART", size: 58 }], {
        bg: "#1f6b43",
        border: "#e8d9b8",
      }),
    []
  );
  const chaiSign = useMemo(
    () =>
      signTexture([{ text: "CHAI", size: 54 }, { text: "SHOP", size: 54 }], {
        bg: "#8a4a2a",
        border: "#f2c94c",
      }),
    []
  );

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.002, -3]}>
        <planeGeometry args={[18, 26]} />
        <meshStandardMaterial map={cobbles} roughness={1} metalness={0} />
      </mesh>

      <mesh geometry={geometry}>
        <meshStandardMaterial vertexColors roughness={0.88} metalness={0.04} />
      </mesh>

      <Sign texture={fruitSign} position={[-4.15, 2.48, 2.27]} width={1.62} height={0.56} />
      <Sign
        texture={chaiSign}
        position={[3.3, 2.32, 1.4]}
        rotationY={-Math.PI / 2}
        width={1.3}
        height={0.56}
      />
    </group>
  );
}
