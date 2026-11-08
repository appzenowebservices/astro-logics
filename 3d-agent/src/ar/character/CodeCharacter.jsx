// Code-driven characters: built from three.js primitives, animated in useFrame.
// No external formats, no runtimes — every shape and motion here is ours.
// Feet/base sit at y=0; the shared rig handles grounding, scale, yaw and shadow.

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { BlobShadow } from "./BlobShadow";
import { DetailedHumanoid } from "./DetailedHumanoid";
import { useCharacterRig } from "./useCharacterRig";
import { ElderBody, ManBody, WomanBody } from "./VoxelHumanoid";

const AMBER = "#f6ad3f";
const AQUA = "#5eead4";

/* ---------------- AGENT — stylized humanoid suit ---------------- */

function AgentBody({ animation }) {
  const leftLeg = useRef();
  const rightLeg = useRef();
  const leftArm = useRef();
  const rightArm = useRef();
  const upper = useRef();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const walking = animation === "walk";
    const speed = walking ? 7.2 : 1.6;
    const swing = Math.sin(t * speed) * (walking ? 0.62 : 0.05);

    if (leftLeg.current) leftLeg.current.rotation.x = swing;
    if (rightLeg.current) rightLeg.current.rotation.x = -swing;
    if (leftArm.current) leftArm.current.rotation.x = -swing * 0.75;
    if (rightArm.current) rightArm.current.rotation.x = swing * 0.75;
    if (upper.current) {
      upper.current.position.y = Math.abs(Math.sin(t * speed)) * (walking ? 0.035 : 0.012);
      upper.current.rotation.x = walking ? 0.07 : 0;
      upper.current.rotation.y = walking ? Math.sin(t * speed * 0.5) * 0.06 : Math.sin(t * 0.6) * 0.05;
    }
  });

  return (
    <group>
      {/* legs */}
      {[
        [leftLeg, -0.11],
        [rightLeg, 0.11],
      ].map(([ref, x]) => (
        <group key={x} ref={ref} position={[x, 0.88, 0]}>
          <mesh position={[0, -0.44, 0]}>
            <capsuleGeometry args={[0.075, 0.6, 6, 12]} />
            <meshStandardMaterial color="#101830" roughness={0.75} />
          </mesh>
          <mesh position={[0, -0.84, 0.03]}>
            <boxGeometry args={[0.15, 0.08, 0.26]} />
            <meshStandardMaterial color="#0b1020" roughness={0.5} />
          </mesh>
        </group>
      ))}

      {/* upper body */}
      <group ref={upper}>
        <mesh position={[0, 0.86, 0]}>
          <boxGeometry args={[0.3, 0.18, 0.22]} />
          <meshStandardMaterial color="#141d33" roughness={0.7} />
        </mesh>
        <mesh position={[0, 1.17, 0]}>
          <capsuleGeometry args={[0.19, 0.34, 6, 16]} />
          <meshStandardMaterial color="#1d2a4a" roughness={0.65} />
        </mesh>
        <mesh position={[0, 1.27, 0.165]}>
          <boxGeometry args={[0.17, 0.32, 0.03]} />
          <meshStandardMaterial color="#ffe9b8" roughness={0.8} />
        </mesh>
        <mesh position={[0, 1.21, 0.185]}>
          <coneGeometry args={[0.05, 0.24, 4]} />
          <meshStandardMaterial color={AMBER} roughness={0.4} emissive={AMBER} emissiveIntensity={0.25} />
        </mesh>
        <mesh position={[0.1, 1.3, 0.18]}>
          <cylinderGeometry args={[0.025, 0.025, 0.01, 16]} />
          <meshStandardMaterial color={AQUA} emissive={AQUA} emissiveIntensity={1.4} />
        </mesh>

        {/* arms */}
        {[
          [leftArm, -0.26],
          [rightArm, 0.26],
        ].map(([ref, x]) => (
          <group key={x} ref={ref} position={[x, 1.4, 0]}>
            <mesh position={[0, -0.32, 0]}>
              <capsuleGeometry args={[0.06, 0.5, 6, 12]} />
              <meshStandardMaterial color="#1d2a4a" roughness={0.65} />
            </mesh>
            <mesh position={[0, -0.64, 0]}>
              <sphereGeometry args={[0.068, 12, 12]} />
              <meshStandardMaterial color="#f2c894" roughness={0.8} />
            </mesh>
          </group>
        ))}

        {/* neck + head */}
        <mesh position={[0, 1.5, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.1, 12]} />
          <meshStandardMaterial color="#f2c894" roughness={0.8} />
        </mesh>
        <mesh position={[0, 1.63, 0]}>
          <sphereGeometry args={[0.145, 24, 20]} />
          <meshStandardMaterial color="#f2c894" roughness={0.8} />
        </mesh>
        <mesh position={[0, 1.665, -0.012]}>
          <sphereGeometry args={[0.15, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
          <meshStandardMaterial color="#1b1426" roughness={0.9} />
        </mesh>
        <mesh position={[0, 1.645, 0.128]}>
          <boxGeometry args={[0.17, 0.04, 0.02]} />
          <meshStandardMaterial color={AQUA} emissive={AQUA} emissiveIntensity={1.6} />
        </mesh>
      </group>
    </group>
  );
}

/* ---------------- ROBOT — boxy mech ---------------- */

function RobotBody({ animation }) {
  const leftLeg = useRef();
  const rightLeg = useRef();
  const leftArm = useRef();
  const rightArm = useRef();
  const head = useRef();
  const core = useRef();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const walking = animation === "walk";
    const speed = walking ? 8 : 1.4;
    const swing = Math.sin(t * speed) * (walking ? 0.5 : 0.04);

    if (leftLeg.current) leftLeg.current.rotation.x = swing;
    if (rightLeg.current) rightLeg.current.rotation.x = -swing;
    if (leftArm.current) leftArm.current.rotation.x = -swing * 0.9;
    if (rightArm.current) rightArm.current.rotation.x = swing * 0.9;
    if (head.current) head.current.rotation.y = Math.sin(t * 0.8) * (walking ? 0.12 : 0.05);
    if (core.current) core.current.material.emissiveIntensity = 1.1 + Math.sin(t * 3) * 0.35;
  });

  const body = "#2a3550";
  const dark = "#1a2338";

  return (
    <group>
      {[
        [leftLeg, -0.13],
        [rightLeg, 0.13],
      ].map(([ref, x]) => (
        <group key={x} ref={ref} position={[x, 0.62, 0]}>
          <mesh position={[0, -0.26, 0]}>
            <boxGeometry args={[0.11, 0.44, 0.13]} />
            <meshStandardMaterial color={dark} roughness={0.6} metalness={0.35} />
          </mesh>
          <mesh position={[0, -0.5, 0.03]}>
            <boxGeometry args={[0.15, 0.07, 0.22]} />
            <meshStandardMaterial color="#0d1424" roughness={0.5} metalness={0.4} />
          </mesh>
        </group>
      ))}

      <mesh position={[0, 0.92, 0]}>
        <boxGeometry args={[0.46, 0.46, 0.3]} />
        <meshStandardMaterial color={body} roughness={0.55} metalness={0.35} />
      </mesh>
      <mesh ref={core} position={[0, 0.95, 0.16]}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial color={AQUA} emissive={AQUA} emissiveIntensity={1.2} />
      </mesh>

      {[
        [leftArm, -0.31],
        [rightArm, 0.31],
      ].map(([ref, x]) => (
        <group key={x} ref={ref} position={[x, 1.1, 0]}>
          <mesh position={[0, -0.2, 0]}>
            <boxGeometry args={[0.09, 0.38, 0.11]} />
            <meshStandardMaterial color={dark} roughness={0.6} metalness={0.35} />
          </mesh>
          <mesh position={[0, -0.42, 0]}>
            <boxGeometry args={[0.11, 0.1, 0.12]} />
            <meshStandardMaterial color={body} roughness={0.5} metalness={0.4} />
          </mesh>
        </group>
      ))}

      <group ref={head} position={[0, 1.32, 0]}>
        <mesh>
          <boxGeometry args={[0.3, 0.24, 0.26]} />
          <meshStandardMaterial color={body} roughness={0.5} metalness={0.4} />
        </mesh>
        <mesh position={[0, 0.01, 0.135]}>
          <boxGeometry args={[0.24, 0.07, 0.02]} />
          <meshStandardMaterial color={AQUA} emissive={AQUA} emissiveIntensity={1.8} />
        </mesh>
        <mesh position={[0, 0.2, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.16, 8]} />
          <meshStandardMaterial color={dark} metalness={0.5} />
        </mesh>
        <mesh position={[0, 0.29, 0]}>
          <sphereGeometry args={[0.032, 12, 12]} />
          <meshStandardMaterial color={AMBER} emissive={AMBER} emissiveIntensity={1.6} />
        </mesh>
      </group>
    </group>
  );
}

/* ---------------- ORB — floating drone ---------------- */

function OrbBody({ animation }) {
  const bob = useRef();
  const spin = useRef();
  const sats = useRef();

  const satellites = useMemo(
    () =>
      [0, 1, 2].map((i) => {
        const angle = (i / 3) * Math.PI * 2;
        return {
          position: [Math.cos(angle) * 0.42, Math.sin(angle * 2) * 0.12, Math.sin(angle) * 0.42],
          color: i % 2 === 0 ? AQUA : AMBER,
        };
      }),
    []
  );

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const fast = animation === "walk";
    const speed = fast ? 2.4 : 0.8;
    if (bob.current) {
      bob.current.position.y = 0.98 + Math.sin(t * (fast ? 3.4 : 1.6)) * (fast ? 0.09 : 0.04);
    }
    if (spin.current) {
      spin.current.rotation.y += delta * speed;
      spin.current.rotation.z += delta * speed * 0.35;
    }
    if (sats.current) sats.current.rotation.y -= delta * speed * 1.7;
  });

  return (
    <group>
      <group ref={bob} position={[0, 0.98, 0]}>
        <mesh>
          <sphereGeometry args={[0.2, 24, 24]} />
          <meshStandardMaterial
            color="#0c2b33"
            emissive={AQUA}
            emissiveIntensity={1.4}
            roughness={0.3}
            metalness={0.2}
          />
        </mesh>
        <mesh>
          <icosahedronGeometry args={[0.26, 2]} />
          <meshBasicMaterial color={AQUA} wireframe transparent opacity={0.28} toneMapped={false} />
        </mesh>
        <group ref={spin}>
          <mesh rotation={[Math.PI / 2.2, 0, 0]}>
            <torusGeometry args={[0.36, 0.012, 8, 64]} />
            <meshStandardMaterial color={AMBER} emissive={AMBER} emissiveIntensity={1.4} />
          </mesh>
          <mesh rotation={[Math.PI / 1.6, Math.PI / 3, 0]}>
            <torusGeometry args={[0.33, 0.009, 8, 64]} />
            <meshStandardMaterial color={AQUA} emissive={AQUA} emissiveIntensity={1.2} />
          </mesh>
        </group>
      </group>
      <group ref={sats}>
        {satellites.map((sat, i) => (
          <mesh key={i} position={sat.position}>
            <sphereGeometry args={[0.032, 12, 12]} />
            <meshStandardMaterial color={sat.color} emissive={sat.color} emissiveIntensity={1.6} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/* ---------------- dispatcher ---------------- */

const BODIES = {
  man: ManBody,
  woman: WomanBody,
  elder: ElderBody,
  agent: AgentBody,
  robot: RobotBody,
  orb: OrbBody,
};

export function CodeCharacter({
  variant = "agent",
  animation = "idle",
  talking = false,
  targetRef,
  scale,
  shadow,
  epoch,
}) {
  const rig = useCharacterRig({
    targetRef,
    scale,
    epoch,
    shadow,
    shadowScale: variant === "orb" ? 0.45 : 1,
  });
  const Body = BODIES[variant];

  return (
    <>
      <group ref={rig.groupRef} position={[0, 0, 0]}>
        <group ref={rig.rotorRef}>
          {Body ? (
            <Body animation={animation} talking={talking} />
          ) : (
            <DetailedHumanoid kind={variant} animation={animation} talking={talking} />
          )}
        </group>
      </group>
      <BlobShadow shadowRef={rig.shadowRef} materialRef={rig.shadowMaterialRef} />
    </>
  );
}
