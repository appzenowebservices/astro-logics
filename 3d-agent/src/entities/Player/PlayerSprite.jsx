// src/entities/Player/PlayerSprite.jsx
//
// 2D model for the player character in the simulation: the Nischal sprite
// sheets rendered as a camera-facing billboard, driven by the simulation state
// (walk/run → walk sheet, everything else → idle). Feet sit at the group
// origin, matching MODEL_OFFSET_Y, so the sprite stands exactly on the floor.

import { useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { animationsOf, resolveCharacter } from "../../ar/assets/characters";
import { BlobShadow } from "../../ar/character/BlobShadow";
import { playerState } from "./playerState";

const CHARACTER_HEIGHT = 1.7;

// Sheet from the URL (?character=virgo), defaults to the first registered one.
const CHARACTER_KEY =
  typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("character") ?? undefined
    : undefined;
const CHARACTER = resolveCharacter(CHARACTER_KEY);
const AVAILABLE = animationsOf(CHARACTER);

const _worldPos = new THREE.Vector3();
const _worldQuat = new THREE.Quaternion();
const _euler = new THREE.Euler();

export function PlayerSprite({ onRef }) {
  const group = useRef();
  const rotor = useRef();
  const materialRef = useRef();
  const shadowRef = useRef();
  const shadowMaterialRef = useRef();
  const frameAcc = useRef(0);
  const camera = useThree((state) => state.camera);
  const [animation, setAnimation] = useState("idle");
  const [texture, setTexture] = useState(null);

  const active = CHARACTER[animation] ?? CHARACTER.idle;
  const crop = active.crop;

  useEffect(() => {
    if (onRef && group.current) onRef(group.current);
  }, [onRef]);

  useEffect(() => {
    const tex = new THREE.TextureLoader().load(active.url);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    frameAcc.current = 0;
    setTexture(tex);
    return () => tex.dispose();
  }, [active.url]);

  useFrame((_, delta) => {
    const groupNode = group.current;
    if (!groupNode) return;

    // sheet from the simulation state (falling back to idle when the character
    // has no walk sheet, e.g. Virgo)
    const moving = playerState.animationState === "walk" || playerState.animationState === "run";
    const next = moving && AVAILABLE.includes("walk") ? "walk" : "idle";
    if (next !== animation) setAnimation(next);

    // step the sheet
    if (texture && crop) {
      frameAcc.current += Math.min(delta, 0.06) * (active.fps || 8);
      const frame = Math.floor(frameAcc.current) % Math.max(1, active.frames);
      const col = frame % active.cols;
      const row = Math.floor(frame / active.cols);
      const image = texture.image;
      const sheetW = image?.width ?? active.cols * 256;
      const sheetH = image?.height ?? active.rows * 256;
      const cellW = sheetW / active.cols;
      const cellH = sheetH / active.rows;
      texture.repeat.set(crop.w / sheetW, crop.h / sheetH);
      texture.offset.set(
        (col * cellW + crop.x) / sheetW,
        1 - (row * cellH + crop.y + crop.h) / sheetH
      );
    }

    // yaw-only billboard, compensating the model group's movement yaw
    if (rotor.current) {
      groupNode.updateWorldMatrix(true, false);
      groupNode.getWorldPosition(_worldPos);
      groupNode.getWorldQuaternion(_worldQuat);
      const parentYaw = _euler.setFromQuaternion(_worldQuat, "YXZ").y;
      const worldYaw = Math.atan2(camera.position.x - _worldPos.x, camera.position.z - _worldPos.z);
      rotor.current.rotation.y = worldYaw - parentYaw;
    }
  });

  const aspect = crop ? crop.w / crop.h : 1;
  const width = CHARACTER_HEIGHT * aspect;

  return (
    <group ref={group}>
      <group ref={rotor}>
        <mesh position={[0, CHARACTER_HEIGHT / 2, 0]}>
          <planeGeometry args={[width, CHARACTER_HEIGHT]} />
          <meshBasicMaterial
            ref={materialRef}
            map={texture}
            transparent
            alphaTest={0.08}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </mesh>
      </group>
      <BlobShadow shadowRef={shadowRef} materialRef={shadowMaterialRef} size={0.95} />
    </group>
  );
}
