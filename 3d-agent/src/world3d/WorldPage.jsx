// /world — the voxel street and the Nischal sprite together in a real 3D view
// (orbit camera, no camera feed). Same scene modules as /ar-feature, so the
// character and world stay identical across both pages.

import { useCallback, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { VoxelStreet } from "../ar/world/VoxelStreet";
import { SpriteBillboard } from "../ar/character/SpriteBillboard";
import { CHARACTER_KEYS, animationsOf, resolveCharacter } from "../ar/assets/characters";
import "./world3d.css";

export function WorldPage() {
  const [characterKey, setCharacterKey] = useState(CHARACTER_KEYS[0]);
  const [animation, setAnimation] = useState("idle");
  const targetRef = useRef({ x: 0.35, z: -1.4 });

  const sheet = resolveCharacter(characterKey);
  const animations = animationsOf(sheet);

  const handleCharacter = useCallback((key) => {
    setCharacterKey(key);
    const next = resolveCharacter(key);
    setAnimation((current) => (next[current] ? current : "idle"));
  }, []);

  return (
    <div className="world-root">
      <Canvas
        dpr={[1, 2]}
        shadows={false}
        camera={{ position: [2.9, 1.9, 2.4], fov: 55 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={["#0a1020"]} />
        <fog attach="fog" args={["#0a1020", 14, 30]} />

        <hemisphereLight args={["#dfe9ff", "#0b1020", 0.85]} />
        <directionalLight position={[3.2, 5, 2.2]} intensity={1.7} />
        <pointLight position={[-2.6, 2.6, 1.6]} intensity={5} distance={10} color="#5eead4" />

        <VoxelStreet />

        <SpriteBillboard
          sheet={sheet}
          animation={animation}
          scale={1}
          shadow
          targetRef={targetRef}
          epoch={0}
        />

        <OrbitControls
          target={[0.2, 0.9, -1.2]}
          enableDamping
          dampingFactor={0.08}
          minDistance={1.6}
          maxDistance={14}
          maxPolarAngle={Math.PI / 2.05}
        />
      </Canvas>

      <div className="world-hud">
        <div className="world-title">
          <span className="world-kicker">MITHUNA · VOXEL WORLD</span>
          <b>Nischal in the market lane</b>
        </div>
        <div className="world-actions">
          {CHARACTER_KEYS.map((key) => (
            <button
              key={key}
              className={`world-btn${characterKey === key ? " on" : ""}`}
              onClick={() => handleCharacter(key)}
            >
              {key}
            </button>
          ))}
          <span className="world-sep" />
          {animations.map((name) => (
            <button
              key={name}
              className={`world-btn${animation === name ? " on" : ""}`}
              onClick={() => setAnimation(name)}
            >
              {name}
            </button>
          ))}
        </div>
        <div className="world-links">
          <a href="/">Landing</a>
          <a href="/ar-feature">AR feature</a>
          <a href="/simulation">Console</a>
        </div>
        <div className="world-hint">drag to orbit · scroll to zoom</div>
      </div>
    </div>
  );
}
