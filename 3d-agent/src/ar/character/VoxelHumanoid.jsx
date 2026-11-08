// Voxel humanoids built from three.js boxes — the market trio from the
// reference: MAN (kurta + vest + bag), WOMAN (orange saree), ELDER (purple
// saree, glasses, cane). Same rig as every other character: ground, yaw,
// shadow; limb motion is code-driven.

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

const KINDS = {
  man: {
    skin: "#c9885a",
    hair: "#1c1512",
    top: "#3f6fb5",
    bottom: "#e8e4da",
    shoe: "#5f3c1c",
    vest: "#1e2a3d",
    bag: "#b98a4a",
    speed: 1,
  },
  woman: {
    skin: "#c9885a",
    hair: "#171310",
    top: "#e8641f",
    bottom: "#e8b93a",
    blouse: "#1f8f7a",
    sandal: "#7a4a24",
    gold: "#f2c94c",
    bindi: "#d92b2b",
    speed: 0.95,
  },
  elder: {
    skin: "#c9885a",
    hair: "#cfcfcf",
    top: "#8e5bbf",
    bottom: "#f2c94c",
    blouse: "#8e5bbf",
    sandal: "#7a4a24",
    gold: "#f2c94c",
    speed: 0.68,
  },
};

const DARK = "#241a14";

function Box({ position, size, color, rough = 0.85 }) {
  return (
    <mesh position={position}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={rough} />
    </mesh>
  );
}

function Humanoid({ kind, animation, talking = false }) {
  const p = KINDS[kind] ?? KINDS.man;
  const leftLeg = useRef();
  const rightLeg = useRef();
  const leftArm = useRef();
  const rightArm = useRef();
  const upper = useRef();
  const skirt = useRef();
  const head = useRef();
  const cavity = useRef();
  const tongue = useRef();

  const saree = kind !== "man";

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const walking = animation === "walk";
    const speed = p.speed ?? 1;
    const w = Math.sin(t * (walking ? 6.2 : 1.5) * speed);
    const legAmp = walking ? 0.5 : 0.03;
    const armAmp = walking ? (kind === "elder" ? 0.08 : 0.34) : 0.04;

    if (leftLeg.current) leftLeg.current.rotation.x = w * legAmp;
    if (rightLeg.current) rightLeg.current.rotation.x = -w * legAmp;
    if (leftArm.current) leftArm.current.rotation.x = -w * armAmp;
    if (rightArm.current) rightArm.current.rotation.x = w * armAmp;
    if (upper.current) {
      upper.current.position.y = Math.abs(w) * (walking ? 0.03 : 0.008);
      upper.current.rotation.y = walking ? Math.sin(t * 3 * speed) * 0.05 : Math.sin(t * 0.7) * 0.04;
      upper.current.rotation.x = (kind === "elder" ? 0.12 : 0) + (walking ? 0.04 : 0);
    }
    if (skirt.current) skirt.current.rotation.z = w * (walking ? 0.06 : 0.015);
    if (head.current) {
      head.current.rotation.y = Math.sin(t * 0.6 * speed) * 0.07;
      head.current.rotation.x = talking ? -0.02 + Math.sin(t * 12) * 0.02 : 0;
    }
    if (cavity.current) {
      const open = talking
        ? 0.01 + (0.5 + 0.5 * Math.sin(t * 15.5)) * (0.022 + 0.01 * Math.sin(t * 3.9))
        : 0.008;
      cavity.current.scale.y = open;
      cavity.current.position.y = -open / 2;
      if (tongue.current) {
        tongue.current.position.y = -open + 0.007;
        tongue.current.visible = open > 0.025;
      }
    }
  });

  return (
    <group>
      {!saree ? (
        <>
          <group ref={leftLeg} position={[-0.11, 0.82, 0]}>
            <Box position={[0, -0.35, 0]} size={[0.16, 0.7, 0.18]} color={p.bottom} />
            <Box position={[0, -0.77, 0.03]} size={[0.17, 0.1, 0.26]} color={p.shoe} />
          </group>
          <group ref={rightLeg} position={[0.11, 0.82, 0]}>
            <Box position={[0, -0.35, 0]} size={[0.16, 0.7, 0.18]} color={p.bottom} />
            <Box position={[0, -0.77, 0.03]} size={[0.17, 0.1, 0.26]} color={p.shoe} />
          </group>
        </>
      ) : (
        <>
          <group ref={skirt} position={[0, 0.98, 0]}>
            <Box position={[0, -0.48, 0]} size={[0.42, 1.0, 0.32]} color={p.top} />
            <Box position={[0, -0.94, 0]} size={[0.46, 0.1, 0.36]} color={p.bottom} />
            <Box position={[0, -0.62, 0]} size={[0.44, 0.06, 0.34]} color={p.bottom} />
          </group>
          <Box position={[-0.1, 0.05, 0.09]} size={[0.12, 0.08, 0.22]} color={p.skin} />
          <Box position={[0.1, 0.05, 0.09]} size={[0.12, 0.08, 0.22]} color={p.skin} />
        </>
      )}

      <group ref={upper}>
        {!saree ? (
          <>
            <Box position={[0, 1.1, 0]} size={[0.44, 0.62, 0.28]} color={p.top} />
            <Box position={[0, 1.12, -0.15]} size={[0.42, 0.5, 0.12]} color={p.vest} />
            <Box position={[-0.15, 1.12, 0.16]} size={[0.14, 0.5, 0.1]} color={p.vest} />
            <Box position={[0.15, 1.12, 0.16]} size={[0.14, 0.5, 0.1]} color={p.vest} />
            <Box position={[0, 1.39, 0.14]} size={[0.14, 0.1, 0.06]} color={p.skin} />
            <mesh position={[-0.16, 1.18, 0.17]} rotation-z={0.5}>
              <boxGeometry args={[0.07, 0.55, 0.05]} />
              <meshStandardMaterial color={p.bag} roughness={0.9} />
            </mesh>
            <Box position={[-0.36, 0.92, 0.06]} size={[0.26, 0.32, 0.16]} color={p.bag} />
          </>
        ) : (
          <>
            <Box position={[0, 1.12, 0]} size={[0.36, 0.36, 0.24]} color={p.blouse} />
            <Box position={[0, 1.3, 0]} size={[0.4, 0.3, 0.3]} color={p.top} />
            <Box position={[0, 0.99, 0]} size={[0.4, 0.08, 0.3]} color={p.bottom} />
            <mesh position={[0.13, 1.3, 0.03]} rotation-z={-0.32}>
              <boxGeometry args={[0.15, 0.68, 0.3]} />
              <meshStandardMaterial color={p.top} roughness={0.85} />
            </mesh>
            <mesh position={[0.21, 1.26, 0.03]} rotation-z={-0.32}>
              <boxGeometry args={[0.05, 0.6, 0.31]} />
              <meshStandardMaterial color={p.bottom} roughness={0.85} />
            </mesh>
          </>
        )}

        <Box position={[0, 1.46, 0]} size={[0.12, 0.1, 0.12]} color={p.skin} />

        {[[leftArm, -0.27], [rightArm, 0.27]].map(([ref, x]) => (
          <group key={x} ref={ref} position={[x, 1.36, 0]}>
            {!saree ? (
              <>
                <Box position={[0, -0.16, 0]} size={[0.13, 0.32, 0.16]} color={p.top} />
                <Box position={[0, -0.46, 0]} size={[0.09, 0.3, 0.11]} color={p.skin} />
              </>
            ) : (
              <>
                <Box position={[0, -0.12, 0]} size={[0.11, 0.26, 0.13]} color={p.blouse} />
                <Box position={[0, -0.4, 0]} size={[0.08, 0.28, 0.1]} color={p.skin} />
              </>
            )}
            <Box position={[0, -0.62, 0]} size={[0.1, 0.1, 0.1]} color={p.skin} />
            {kind === "elder" && x > 0 ? (
              <>
                <Box position={[0.04, -0.88, 0.1]} size={[0.05, 0.92, 0.05]} color="#8a5a2a" />
                <Box position={[0, -0.44, 0.1]} size={[0.14, 0.05, 0.05]} color="#6b4420" />
              </>
            ) : null}
          </group>
        ))}

        <group ref={head} position={[0, 1.63, 0]}>
          <Box position={[0, 0, 0]} size={[0.25, 0.29, 0.25]} color={p.skin} />
          <Box position={[0, 0.16, 0]} size={[0.27, 0.11, 0.27]} color={p.hair} />
          {saree ? <Box position={[0, 0.11, -0.16]} size={[0.17, 0.17, 0.15]} color={p.hair} /> : null}
          {saree ? <Box position={[0, -0.26, -0.15]} size={[0.07, 0.5, 0.07]} color={p.hair} /> : null}
          <Box position={[-0.06, 0.02, 0.128]} size={[0.04, 0.05, 0.02]} color={DARK} />
          <Box position={[0.06, 0.02, 0.128]} size={[0.04, 0.05, 0.02]} color={DARK} />
          <Box position={[-0.06, 0.08, 0.128]} size={[0.08, 0.02, 0.02]} color={p.hair} />
          <Box position={[0.06, 0.08, 0.128]} size={[0.08, 0.02, 0.02]} color={p.hair} />
          <group position={[0, -0.075, kind === "man" ? 0.152 : 0.133]}>
            <mesh ref={cavity}>
              <boxGeometry args={[0.075, 1, 0.018]} />
              <meshStandardMaterial color="#4a241f" roughness={0.9} />
            </mesh>
            <mesh position={[0, -0.001, 0.006]}>
              <boxGeometry args={[0.055, 0.01, 0.014]} />
              <meshStandardMaterial color="#f8f4ea" roughness={0.5} />
            </mesh>
            <mesh ref={tongue} position={[0, 0, 0.006]}>
              <boxGeometry args={[0.04, 0.012, 0.012]} />
              <meshStandardMaterial color="#b5493d" roughness={0.8} />
            </mesh>
          </group>
          {kind === "man" ? (
            <>
              <Box position={[0, -0.13, 0.1]} size={[0.23, 0.15, 0.09]} color={p.hair} />
              <Box position={[0, -0.05, 0.135]} size={[0.12, 0.03, 0.03]} color={p.hair} />
            </>
          ) : null}
          {kind === "woman" ? (
            <>
              <Box position={[0, 0.1, 0.13]} size={[0.035, 0.05, 0.02]} color={p.bindi} />
              <Box position={[-0.13, -0.04, 0]} size={[0.04, 0.08, 0.03]} color={p.gold} />
              <Box position={[0.13, -0.04, 0]} size={[0.04, 0.08, 0.03]} color={p.gold} />
            </>
          ) : null}
          {kind === "elder" ? (
            <>
              <Box position={[0, 0.02, 0.132]} size={[0.24, 0.035, 0.03]} color="#222222" />
              <Box position={[-0.12, 0.02, 0.06]} size={[0.03, 0.03, 0.15]} color="#222222" />
              <Box position={[0.12, 0.02, 0.06]} size={[0.03, 0.03, 0.15]} color="#222222" />
              <Box position={[0, -0.13, 0.06]} size={[0.2, 0.06, 0.04]} color="#bdb7ae" />
            </>
          ) : null}
        </group>
      </group>
    </group>
  );
}

export function ManBody({ animation, talking }) {
  return <Humanoid kind="man" animation={animation} talking={talking} />;
}

export function WomanBody({ animation, talking }) {
  return <Humanoid kind="woman" animation={animation} talking={talking} />;
}

export function ElderBody({ animation, talking }) {
  return <Humanoid kind="elder" animation={animation} talking={talking} />;
}
