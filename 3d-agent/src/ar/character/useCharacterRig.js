// Shared character transform: follow the tracking target with exponential
// damping, drop-in landing, scale damping, camera-facing yaw, and shadow
// follow/fade. Used by both the sprite billboard and the procedural characters.

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { damp } from "../tracking/placement";

const LAND_DURATION = 0.45;
const LAND_HEIGHT = 0.45;

export function useCharacterRig({
  targetRef,
  scale = 1,
  epoch = 0,
  shadow = true,
  shadowScale = 1,
  characterHeight = 1.7,
}) {
  const groupRef = useRef();
  const rotorRef = useRef();
  const shadowRef = useRef();
  const shadowMaterialRef = useRef();
  const easeRef = useRef(1);
  const spawnAt = useRef(null);
  const clock = useThree((state) => state.clock);
  const camera = useThree((state) => state.camera);

  useEffect(() => {
    spawnAt.current = clock.elapsedTime;
  }, [epoch, clock]);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    const target = targetRef.current;
    const dt = Math.min(delta, 0.05);

    group.position.x = damp(group.position.x, target.x, 7, dt);
    group.position.z = damp(group.position.z, target.z, 7, dt);

    const spawned = spawnAt.current ?? clock.elapsedTime;
    const landT = THREE.MathUtils.clamp((clock.elapsedTime - spawned) / LAND_DURATION, 0, 1);
    const ease = 1 - Math.pow(1 - landT, 3);
    easeRef.current = ease;
    group.position.y = (1 - ease) * LAND_HEIGHT;

    const currentScale = damp(group.scale.x, scale, 9, dt);
    group.scale.setScalar(currentScale);

    if (rotorRef.current) {
      rotorRef.current.rotation.y = Math.atan2(
        camera.position.x - group.position.x,
        camera.position.z - group.position.z
      );
    }

    const shadowMesh = shadowRef.current;
    if (shadowMesh) {
      shadowMesh.position.x = group.position.x;
      shadowMesh.position.z = group.position.z;
      shadowMesh.scale.setScalar(currentScale * characterHeight * 0.6 * shadowScale);
      if (shadowMaterialRef.current) {
        shadowMaterialRef.current.opacity = THREE.MathUtils.clamp(
          1 - group.position.y / 0.7,
          0,
          1
        );
      }
      shadowMesh.visible = shadow;
    }
  });

  return { groupRef, rotorRef, shadowRef, shadowMaterialRef, easeRef };
}
