// Scene layer: the sprite character. A yaw-only billboard whose texture is one
// frame of a sprite sheet (Nischal idle/walk), UV-cropped to the character's
// content box so the feet sit exactly on the ground plane, with the shared
// blob shadow keeping it grounded.

import { useEffect, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { BlobShadow } from "./BlobShadow";
import { useCharacterRig } from "./useCharacterRig";

const CHARACTER_HEIGHT = 1.7;

export function SpriteBillboard({
  sheet,
  animation = "idle",
  scale = 1,
  shadow = true,
  targetRef,
  epoch = 0,
}) {
  const materialRef = useRef();
  const frameAcc = useRef(0);
  const [texture, setTexture] = useState(null);

  const rig = useCharacterRig({ targetRef, scale, epoch, shadow });
  const active = sheet ? sheet[animation] ?? sheet.idle : null;
  const crop = active?.crop;

  useEffect(() => {
    if (!active?.url) return undefined;
    const tex = new THREE.TextureLoader().load(active.url);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    frameAcc.current = 0;
    setTexture(tex);
    return () => {
      tex.dispose();
      setTexture(null);
    };
  }, [active?.url]);

  useFrame((_, delta) => {
    if (materialRef.current) {
      materialRef.current.opacity = 0.2 + 0.8 * rig.easeRef.current;
    }
    if (!texture || !active || !crop) return;

    frameAcc.current += Math.min(delta, 0.05) * (active.fps || 8);
    const frame = Math.floor(frameAcc.current) % Math.max(1, active.frames);
    const col = frame % active.cols;
    const row = Math.floor(frame / active.cols);

    // Sheet size comes from the loaded image, not the descriptor: sheets can
    // differ in resolution (idle/walk are 1280, dance is 1024).
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
  });

  const aspect = crop ? crop.w / crop.h : 1;
  const planeHeight = CHARACTER_HEIGHT;
  const planeWidth = planeHeight * aspect;

  return (
    <>
      <group ref={rig.groupRef} position={[0, 0, 0]}>
        <group ref={rig.rotorRef}>
          <mesh position={[0, planeHeight / 2, 0]}>
            <planeGeometry args={[planeWidth, planeHeight]} />
            <meshBasicMaterial
              ref={materialRef}
              map={texture}
              transparent
              opacity={0}
              alphaTest={0.08}
              side={THREE.DoubleSide}
              toneMapped={false}
            />
          </mesh>
        </group>
      </group>
      <BlobShadow shadowRef={rig.shadowRef} materialRef={rig.shadowMaterialRef} />
    </>
  );
}
