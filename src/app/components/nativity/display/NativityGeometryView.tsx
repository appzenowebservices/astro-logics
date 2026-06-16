"use client";
import React from "react";

interface AngularDistance {
  id: string;
  planet1: string;
  planet2: string;
  distance: number;
  speedWeighting: number;
}

interface NativityGeometryViewProps {
  distances: AngularDistance[];
}

const PLANET_SYMBOLS: Record<string, string> = {
  SUN: "☉",
  MOON: "☽",
  MERCURY: "☿",
  VENUS: "♀",
  MARS: "♂",
  JUPITER: "♃",
  SATURN: "♄",
  URANUS: "♅",
  NEPTUNE: "♆",
  PLUTO: "♇",
  MEAN_NODE: "☊",
};

export default function NativityGeometryView({
  distances,
}: NativityGeometryViewProps) {
  const sortedDistances = [...distances].sort(
    (a, b) => a.distance - b.distance,
  );

  return (
    <div className="h-full w-full overflow-y-auto p-4">
      {sortedDistances.length === 0 ? (
        <div className="flex h-full items-center justify-center text-stone-500">
          <p className="text-sm">No angular relationships</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedDistances.map((dist) => (
            <div
              key={dist.id}
              className="rounded border border-[#2D241E] bg-[#1A1714] p-4 transition-colors hover:border-[#E29626]"
            >
              {/* Planet Pair */}
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xl text-[#E29626]">
                  {PLANET_SYMBOLS[dist.planet1] || dist.planet1[0]}
                </span>
                <span className="mx-2 text-xs text-stone-500">↔</span>
                <span className="text-xl text-[#E29626]">
                  {PLANET_SYMBOLS[dist.planet2] || dist.planet2[0]}
                </span>
              </div>

              {/* Distance Title */}
              <p className="mb-2 font-mono text-xs text-stone-400">
                {dist.planet1} ↔ {dist.planet2}
              </p>

              {/* Distance Value */}
              <div className="mb-3">
                <div className="font-mono text-2xl font-bold text-white">
                  {dist.distance.toFixed(2)}°
                </div>
                <p className="mt-1 text-xs text-stone-500">Angular distance</p>
              </div>

              {/* Distance Bar */}
              <div className="space-y-2">
                <div className="h-2 w-full overflow-hidden rounded-full bg-[#2D241E]">
                  <div
                    className="h-full bg-gradient-to-r from-[#E29626] to-[#F0A030]"
                    style={{ width: `${(dist.distance / 180) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-stone-500">
                  <span>0°</span>
                  <span>90°</span>
                  <span>180°</span>
                </div>
              </div>

              {/* Speed Weighting */}
              <div className="mt-4 border-t border-[#2D241E] pt-3">
                <p className="mb-1 text-xs text-stone-600">Speed Weight</p>
                <div className="flex items-center gap-2">
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-[#2D241E]">
                    <div
                      className="h-full bg-gradient-to-r from-blue-600 to-blue-400"
                      style={{ width: `${dist.speedWeighting * 100}%` }}
                    />
                  </div>
                  <span className="font-mono text-xs text-white">
                    {(dist.speedWeighting * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
