// World layer: a stylized AR stage around the character.
//   stage — holographic pedestal (disc + ring + rotating arcs + pulse) that
//           follows the character's ground position
//   all   — stage + ground grid + floating embers
// Everything is unlit/additive so it composites cleanly over the camera feed
// and records into the same GL canvas.

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { damp } from "../tracking/placement";

const AMBER = "#f6ad3f";
const AQUA = "#5eead4";
const NAVY = "#3b4a6b";

function makeDiscTexture() {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 4, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(246, 173, 63, 0.5)");
  gradient.addColorStop(0.45, "rgba(246, 173, 63, 0.16)");
  gradient.addColorStop(0.8, "rgba(94, 234, 212, 0.05)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function Embers({ count = 64, radius = 2.6 }) {
  const pointsRef = useRef();

  const { positions, speeds } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * radius;
      pos[i * 3] = Math.cos(angle) * r;
      pos[i * 3 + 1] = Math.random() * 1.8 + 0.05;
      pos[i * 3 + 2] = Math.sin(angle) * r;
      spd[i] = 0.08 + Math.random() * 0.18;
    }
    return { positions: pos, speeds: spd };
  }, [count, radius]);

  useFrame((_, delta) => {
    const points = pointsRef.current;
    if (!points) return;
    points.rotation.y += delta * 0.06;
    const attr = points.geometry.attributes.position;
    for (let i = 0; i < speeds.length; i += 1) {
      let y = attr.getY(i) + speeds[i] * delta;
      if (y > 1.9) y = 0.05;
      attr.setY(i, y);
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={AMBER}
        size={0.035}
        sizeAttenuation
        transparent
        opacity={0.75}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
}

export function ArWorld({ mode = "off", targetRef, scale = 1 }) {
  const groupRef = useRef();
  const arcsRef = useRef();
  const pulseRef = useRef();
  const discTexture = useMemo(() => makeDiscTexture(), []);
  useEffect(() => () => discTexture.dispose(), [discTexture]);

  useFrame(({ clock }, delta) => {
    const group = groupRef.current;
    if (!group) return;
    const dt = Math.min(delta, 0.05);
    const target = targetRef.current;

    group.position.x = damp(group.position.x, target.x, 9, dt);
    group.position.z = damp(group.position.z, target.z, 9, dt);
    const currentScale = damp(group.scale.x, scale, 9, dt);
    group.scale.setScalar(currentScale);

    if (arcsRef.current) arcsRef.current.rotation.y += dt * 0.7;
    if (pulseRef.current) {
      const pulse = 1 + Math.sin(clock.elapsedTime * 2.4) * 0.045;
      pulseRef.current.scale.setScalar(pulse);
      pulseRef.current.material.opacity = 0.45 + Math.sin(clock.elapsedTime * 2.4) * 0.18;
    }
  });

  return (
    <>
      {mode === "all" ? (
        <gridHelper
          args={[26, 52, AMBER, NAVY]}
          position={[0, 0.002, 0]}
          onUpdate={(grid) => {
            grid.material.transparent = true;
            grid.material.opacity = 0.18;
            grid.material.depthWrite = false;
          }}
        />
      ) : null}

      {mode !== "off" ? (
        <group ref={groupRef} position={[0, 0, 0]}>
          <mesh rotation-x={-Math.PI / 2} position={[0, 0.006, 0]} renderOrder={-2}>
            <circleGeometry args={[0.62, 48]} />
            <meshBasicMaterial
              map={discTexture}
              transparent
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>

          <mesh rotation-x={-Math.PI / 2} position={[0, 0.008, 0]} renderOrder={-2}>
            <ringGeometry args={[0.52, 0.56, 64]} />
            <meshBasicMaterial
              color={AMBER}
              transparent
              opacity={0.8}
              depthWrite={false}
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
              toneMapped={false}
            />
          </mesh>

          <mesh ref={pulseRef} rotation-x={-Math.PI / 2} position={[0, 0.009, 0]} renderOrder={-2}>
            <ringGeometry args={[0.66, 0.69, 64]} />
            <meshBasicMaterial
              color={AQUA}
              transparent
              opacity={0.5}
              depthWrite={false}
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
              toneMapped={false}
            />
          </mesh>

          <group ref={arcsRef} position={[0, 0.01, 0]}>
            <mesh rotation-x={-Math.PI / 2} renderOrder={-2}>
              <ringGeometry args={[0.6, 0.64, 48, 1, 0, Math.PI * 0.55]} />
              <meshBasicMaterial
                color={AMBER}
                transparent
                opacity={0.9}
                depthWrite={false}
                side={THREE.DoubleSide}
                blending={THREE.AdditiveBlending}
                toneMapped={false}
              />
            </mesh>
            <mesh rotation-x={-Math.PI / 2} rotation-z={Math.PI} renderOrder={-2}>
              <ringGeometry args={[0.6, 0.64, 48, 1, 0, Math.PI * 0.55]} />
              <meshBasicMaterial
                color={AQUA}
                transparent
                opacity={0.8}
                depthWrite={false}
                side={THREE.DoubleSide}
                blending={THREE.AdditiveBlending}
                toneMapped={false}
              />
            </mesh>
          </group>
        </group>
      ) : null}

      {mode === "all" ? <Embers /> : null}
    </>
  );
}
