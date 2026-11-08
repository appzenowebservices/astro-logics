// src/astro/AstroLayer.jsx
//
// The live sidereal parliament: twelve house sectors, nine grahas placed at
// their true longitude from Kaalvanta. Retrograde planets carry a warning
// ring, combust planets dim, and clicking one opens its dossier in the HUD.

import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { AdditiveBlending, DoubleSide } from "three";
import { useAstro, astroActions } from "./astroStore";
import { SIGN_GLYPHS, SIGNS } from "./planetMeta";

const RING_RADIUS = 9.4;
const DEG = Math.PI / 180;
// Hologram sits in front of the office spawn (spawn is [-2, 1.5, 2.7]).
const CENTER = [-2, 1.95, 3.2];
const SCALE = 0.17;

const polar = (longitude, radius) => {
  const angle = longitude * DEG;
  return [Math.sin(angle) * radius, 0, -Math.cos(angle) * radius];
};

function HouseRing() {
  const arcs = useMemo(
    () =>
      SIGNS.map((sign, index) => {
        const longitude = index * 30;
        return {
          sign,
          glyph: SIGN_GLYPHS[index],
          thetaStart: Math.PI / 2 - (longitude + 30) * DEG,
          mid: longitude + 15,
        };
      }),
    [],
  );

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <circleGeometry args={[RING_RADIUS + 0.15, 64]} />
        <meshBasicMaterial color="#050a14" transparent opacity={0.28} />
      </mesh>

      {arcs.map((arc, index) => (
        <mesh key={arc.sign} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <ringGeometry
            args={[RING_RADIUS - 0.35, RING_RADIUS, 32, 1, arc.thetaStart, 30 * DEG]}
          />
          <meshBasicMaterial
            color="#8fb3d9"
            transparent
            opacity={index % 2 === 0 ? 0.1 : 0.035}
            side={DoubleSide}
          />
        </mesh>
      ))}

      {arcs.map((arc) => {
        const [x, , z] = polar(arc.mid, RING_RADIUS + 0.55);
        return (
          <Html
            key={`sign-${arc.sign}`}
            position={[x, 0.05, z]}
            center
            distanceFactor={8}
            zIndexRange={[8, 0]}
          >
            <span className="astro-sign" title={arc.sign}>
              {arc.glyph}
            </span>
          </Html>
        );
      })}
    </group>
  );
}

function AscendantMarker({ ascendant }) {
  if (!ascendant) return null;
  const [x, , z] = polar(ascendant.longitude, RING_RADIUS + 0.1);

  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.5, 0]}>
        <coneGeometry args={[0.14, 0.42, 4]} />
        <meshBasicMaterial color="#f4b942" />
      </mesh>
      <Html position={[0, 1.0, 0]} center distanceFactor={7} zIndexRange={[9, 0]}>
        <span className="astro-asc">ASC</span>
      </Html>
    </group>
  );
}

function EarthCore() {
  return (
    <group>
      <mesh>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial
          color="#3f6fa8"
          emissive="#1d3c63"
          emissiveIntensity={0.6}
          roughness={0.7}
        />
      </mesh>
      <Html position={[0, 0.95, 0]} center distanceFactor={7} zIndexRange={[9, 0]}>
        <span className="astro-earth">EARTH · YOU</span>
      </Html>
    </group>
  );
}

function Planet({ graha, selected }) {
  const bob = useRef();
  const [hovered, setHovered] = useState(false);
  const [x, , z] = polar(graha.longitude, graha.radius);
  const dim = graha.condition === "combust" ? 0.4 : 1;

  useFrame(({ clock }) => {
    if (!bob.current) return;
    const t = clock.getElapsedTime();
    bob.current.position.y = Math.sin(t * 0.9 + graha.radius) * 0.09;
  });

  return (
    <group position={[x, 0, z]}>
      <group ref={bob}>
        <mesh
          onClick={(event) => {
            event.stopPropagation();
            astroActions.select(graha.key);
          }}
          onPointerOver={() => {
            setHovered(true);
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            setHovered(false);
            document.body.style.cursor = "";
          }}
        >
          <sphereGeometry args={[0.34, 24, 24]} />
          <meshBasicMaterial
            color={graha.color}
            transparent
            opacity={dim}
          />
        </mesh>

        <mesh>
          <sphereGeometry args={[0.62, 20, 20]} />
          <meshBasicMaterial
            color={graha.color}
            transparent
            opacity={0.12 * dim}
            blending={AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        {graha.isRetrograde && (
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.56, 0.012, 8, 48]} />
            <meshBasicMaterial color="#f0b429" transparent opacity={0.85} />
          </mesh>
        )}

        {selected && (
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.52, 0.58, 40]} />
            <meshBasicMaterial
              color="#ffffff"
              transparent
              opacity={0.9}
              side={DoubleSide}
            />
          </mesh>
        )}
      </group>

      {(hovered || selected) && (
      <Html
        position={[0, 0.95, 0]}
        center
        distanceFactor={5}
        zIndexRange={[10, 0]}
      >
        <button
          type="button"
          className={`astro-tag ui-interactive ${selected ? "sel" : ""}`}
          onClick={(event) => {
            event.stopPropagation();
            astroActions.select(graha.key);
          }}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          <span className="astro-tag-glyph" style={{ color: graha.color }}>
            {graha.glyph}
          </span>
          <span className="astro-tag-name">{graha.label}</span>
          <span className="astro-tag-deg">
            {Number(graha.degree).toFixed(1)}°
          </span>
        </button>
      </Html>
      )}
    </group>
  );
}

export function AstroLayer() {
  const { active, grahas, chart, selected } = useAstro();

  if (!active || !grahas.length) return null;

  return (
    <group position={CENTER} scale={SCALE}>
      <HouseRing />
      <AscendantMarker ascendant={chart?.ascendant} />
      <EarthCore />

      {grahas.map((graha) => (
        <Planet
          key={graha.key}
          graha={graha}
          selected={selected === graha.key}
        />
      ))}

      <pointLight position={[0, 3, 0]} intensity={6} distance={22} color="#8fb3d9" />
    </group>
  );
}
