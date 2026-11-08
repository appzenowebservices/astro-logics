// Renders a high-detail voxel character: static detail merges per body part
// (head / torso / arms / legs) while eyes and mouth are live meshes so the
// character can blink and talk. Glow parts (visor, chest core) stay emissive.

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { boxesToGeometry } from "../world/voxel";
import { DETAILED_CHARACTERS, buildCharacterParts } from "./voxelModels";

function Part({ geometry, position, partRef, children }) {
  return (
    <group ref={partRef} position={position}>
      <mesh geometry={geometry}>
        <meshStandardMaterial vertexColors roughness={0.82} metalness={0.05} />
      </mesh>
      {children}
    </group>
  );
}

function Glow({ position, size, color }) {
  return (
    <mesh position={position}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.9} toneMapped={false} />
    </mesh>
  );
}

function Eye({ face, groupRef, iris, side }) {
  return (
    <group ref={groupRef} position={[side * face.eyeX, face.eyeY, 0.166]}>
      <mesh>
        <boxGeometry args={[face.eyeW, face.eyeH, 0.02]} />
        <meshStandardMaterial color="#f8f4ea" roughness={0.5} />
      </mesh>
      <mesh position={[0, -0.004, 0.013]}>
        <boxGeometry args={[face.eyeW * 0.52, face.eyeH * 0.62, 0.016]} />
        <meshStandardMaterial color={iris} roughness={0.4} />
      </mesh>
      <mesh position={[side * face.eyeW * 0.15, face.eyeH * 0.14, 0.025]}>
        <boxGeometry args={[0.018, 0.018, 0.01]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} />
      </mesh>
    </group>
  );
}

function Mouth({ face, cavityRef, teethRef, tongueRef }) {
  return (
    <group position={[0, face.mouthY, 0.168]}>
      <mesh ref={cavityRef}>
        <boxGeometry args={[face.mouthW, 1, 0.022]} />
        <meshStandardMaterial color="#4a241f" roughness={0.9} />
      </mesh>
      <mesh ref={teethRef}>
        <boxGeometry args={[face.mouthW * 0.55, 0.012, 0.018]} />
        <meshStandardMaterial color="#f8f4ea" roughness={0.5} />
      </mesh>
      <mesh ref={tongueRef}>
        <boxGeometry args={[face.mouthW * 0.4, 0.014, 0.016]} />
        <meshStandardMaterial color="#b5493d" roughness={0.8} />
      </mesh>
    </group>
  );
}

export function DetailedHumanoid({ kind, animation, talking = false }) {
  const cfg = DETAILED_CHARACTERS[kind];

  const model = useMemo(() => {
    const built = buildCharacterParts(cfg);
    const parts = {};
    for (const [key, part] of Object.entries(built)) {
      if (key === "face") continue;
      parts[key] = { ...part, geometry: boxesToGeometry(part.boxes) };
    }
    return { parts, face: built.face };
  }, [cfg]);

  useEffect(
    () => () => {
      for (const part of Object.values(model.parts)) part.geometry.dispose();
    },
    [model]
  );

  const head = useRef();
  const torso = useRef();
  const armL = useRef();
  const armR = useRef();
  const legL = useRef();
  const legR = useRef();
  const eyeL = useRef();
  const eyeR = useRef();
  const cavity = useRef();
  const teeth = useRef();
  const tongue = useRef();
  const blink = useRef({ nextAt: 0, start: -10 });

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const walking = animation === "walk";
    const speed = cfg.speed ?? 1;
    const w = Math.sin(t * (walking ? 6.2 : 1.5) * speed);
    const legAmp = walking ? 0.5 : 0.03;
    const armAmp = walking ? 0.34 : 0.04;

    if (legL.current) legL.current.rotation.x = w * legAmp;
    if (legR.current) legR.current.rotation.x = -w * legAmp;
    if (armL.current) armL.current.rotation.x = -w * armAmp;
    if (armR.current) armR.current.rotation.x = w * armAmp;
    if (torso.current) {
      torso.current.position.y = model.parts.torso.pivot[1] + Math.abs(w) * (walking ? 0.03 : 0.008);
      torso.current.rotation.y = walking ? Math.sin(t * 3 * speed) * 0.05 : Math.sin(t * 0.7) * 0.04;
      torso.current.rotation.x = walking ? 0.05 : 0;
    }

    // face — blink + talk
    const b = blink.current;
    if (t >= b.nextAt) {
      b.start = t;
      b.nextAt = t + (talking ? 1.6 : 2.6) + Math.random() * (talking ? 1.2 : 3);
    }
    const bt = t - b.start;
    const closed = bt >= 0 && bt < 0.05 ? bt / 0.05 : bt < 0.13 ? 1 - (bt - 0.05) / 0.08 : 0;
    const scaleY = Math.max(0.12, 1 - closed * 0.92);
    if (eyeL.current) eyeL.current.scale.y = scaleY;
    if (eyeR.current) eyeR.current.scale.y = scaleY;

    if (cavity.current) {
      const open = talking
        ? 0.012 + (0.5 + 0.5 * Math.sin(t * 15.5)) * (0.024 + 0.01 * Math.sin(t * 3.7))
        : 0.01;
      cavity.current.scale.y = open;
      cavity.current.position.y = -open / 2;
      if (teeth.current) teeth.current.position.y = -0.002;
      if (tongue.current) {
        tongue.current.position.y = -open + 0.008;
        tongue.current.visible = open > 0.03;
      }
    }
    if (head.current) {
      head.current.rotation.y = Math.sin(t * 0.6 * speed) * 0.08;
      head.current.rotation.x = talking ? -0.02 + Math.sin(t * 12) * 0.02 : 0;
    }
  });

  const face = model.face;

  return (
    <>
      <Part geometry={model.parts.legL.geometry} position={model.parts.legL.pivot} partRef={legL} />
      <Part geometry={model.parts.legR.geometry} position={model.parts.legR.pivot} partRef={legR} />
      <Part geometry={model.parts.torso.geometry} position={model.parts.torso.pivot} partRef={torso}>
        {cfg.glow?.core ? (
          <Glow position={[0, 0.33, 0.165]} size={[0.12, 0.12, 0.04]} color={cfg.glow.core} />
        ) : null}
      </Part>
      <Part geometry={model.parts.armL.geometry} position={model.parts.armL.pivot} partRef={armL} />
      <Part geometry={model.parts.armR.geometry} position={model.parts.armR.pivot} partRef={armR} />
      <Part geometry={model.parts.head.geometry} position={model.parts.head.pivot} partRef={head}>
        {face ? (
          <>
            <Eye face={face} groupRef={eyeL} iris={face.iris} side={-1} />
            <Eye face={face} groupRef={eyeR} iris={face.iris} side={1} />
            {face.lens ? (
              <>
                <mesh position={[-face.eyeX, face.eyeY, 0.185]}>
                  <boxGeometry args={[face.eyeW + 0.004, face.eyeH + 0.004, 0.006]} />
                  <meshStandardMaterial
                    color={face.lensColor}
                    transparent
                    opacity={0.22}
                    roughness={0.12}
                    metalness={0.1}
                  />
                </mesh>
                <mesh position={[face.eyeX, face.eyeY, 0.185]}>
                  <boxGeometry args={[face.eyeW + 0.004, face.eyeH + 0.004, 0.006]} />
                  <meshStandardMaterial
                    color={face.lensColor}
                    transparent
                    opacity={0.22}
                    roughness={0.12}
                    metalness={0.1}
                  />
                </mesh>
              </>
            ) : null}
            <Mouth face={face} cavityRef={cavity} teethRef={teeth} tongueRef={tongue} />
          </>
        ) : null}
        {cfg.glow?.visor ? (
          <Glow position={[0, 0.19, 0.185]} size={[0.3, 0.075, 0.04]} color={cfg.glow.visor} />
        ) : null}
      </Part>
    </>
  );
}
