"use client";
import React, { Suspense } from "react";
import { ENTITY_CONFIG } from "./entityConfig";

// Use React.lazy for dynamic import with proper error handling
const PlanetScene = React.lazy(() =>
  import("./PlanetScene").catch((err) => {
    console.error("Failed to load planet scene:", err);
    throw err;
  }),
);

interface PlanetCharacterProps {
  planet: string;
  personality: {
    mood: string;
    traits: string[];
    color: string;
    energy: number;
  };
  isActive: boolean;
}

const LoadingFallback = () => (
  <div className="flex h-full w-full items-center justify-center">
    <div className="text-xs text-stone-400">Loading 3D character...</div>
  </div>
);

export default function PlanetCharacter3D({
  planet,
  personality,
  isActive,
}: PlanetCharacterProps) {
  return (
    <div
      className="relative w-full overflow-hidden rounded border border-[#333] bg-gradient-to-b from-[#0f0f0f] to-[#1a1a1a]"
      style={{ height: ENTITY_CONFIG.CANVAS.height }}
    >
      <Suspense fallback={<LoadingFallback />}>
        <PlanetScene
          planet={planet}
          personality={personality}
          isActive={isActive}
        />
      </Suspense>

      {/* Overlay info */}
      <div className="pointer-events-none absolute top-2 right-2 left-2 z-10">
        <div className="text-xs font-semibold text-white">{planet}</div>
        <div className="mt-1 text-xs text-[#E29626]">
          Mood: <span className="capitalize">{personality.mood}</span>
        </div>
      </div>

      {/* Energy indicator */}
      <div className="pointer-events-none absolute right-2 bottom-2 z-10">
        <div className="text-xs text-gray-400">Energy</div>
        <div className="mt-1 h-2 w-24 overflow-hidden rounded bg-[#333]">
          <div
            className="h-full bg-[#E29626] transition-all duration-500"
            style={{ width: `${personality.energy * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
