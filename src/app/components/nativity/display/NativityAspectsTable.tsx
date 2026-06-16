"use client";
import React from "react";

interface Aspect {
  id: string;
  planet1: string;
  planet2: string;
  aspectType: string;
  orbDistance: number;
  isApplying: boolean;
  exactnessScore: number;
  orbStrength: number;
  speedWeighting: number;
}

interface NativityAspectsTableProps {
  aspects: Aspect[];
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

const ASPECT_SYMBOLS: Record<string, string> = {
  conjunction: "☌",
  opposition: "☍",
  square: "□",
  trine: "△",
  sextile: "∗",
};

export default function NativityAspectsTable({
  aspects,
}: NativityAspectsTableProps) {
  const sortedAspects = [...aspects].sort(
    (a, b) => b.exactnessScore - a.exactnessScore,
  );

  return (
    <div className="h-full w-full overflow-y-auto">
      {sortedAspects.length === 0 ? (
        <div className="flex h-full w-full items-center justify-center text-stone-500">
          <p className="text-sm">No aspects detected</p>
        </div>
      ) : (
        <table className="w-full border-collapse">
          <thead className="sticky top-0 border-b border-[#2D241E] bg-[#14110F]">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-bold text-stone-400">
                Aspect
              </th>
              <th className="px-4 py-2 text-right text-xs font-bold text-stone-400">
                Orb
              </th>
              <th className="px-4 py-2 text-center text-xs font-bold text-stone-400">
                Phase
              </th>
              <th className="px-4 py-2 text-right text-xs font-bold text-stone-400">
                Exactness
              </th>
              <th className="px-4 py-2 text-right text-xs font-bold text-stone-400">
                Strength
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedAspects.map((aspect) => (
              <tr
                key={aspect.id}
                className="border-b border-[#2D241E] transition-colors hover:bg-[#1A1714]"
              >
                <td className="px-4 py-3 text-sm font-semibold">
                  <span className="text-lg text-[#E29626]">
                    {PLANET_SYMBOLS[aspect.planet1] || aspect.planet1[0]}
                  </span>
                  <span className="mx-1 text-sm text-stone-500">
                    {ASPECT_SYMBOLS[aspect.aspectType] || aspect.aspectType}
                  </span>
                  <span className="text-lg text-[#E29626]">
                    {PLANET_SYMBOLS[aspect.planet2] || aspect.planet2[0]}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-mono text-sm text-white">
                  {aspect.orbDistance > 0 ? "+" : ""}
                  {aspect.orbDistance.toFixed(2)}°
                </td>
                <td className="px-4 py-3 text-center text-sm">
                  {aspect.isApplying ? (
                    <span className="text-xs font-bold text-blue-500">
                      APPLYING
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-purple-500">
                      SEPARATING
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right text-sm">
                  <div className="inline-flex items-center gap-2">
                    <div className="h-1 w-16 overflow-hidden rounded-full bg-[#2D241E]">
                      <div
                        className="h-full bg-gradient-to-r from-[#E29626] to-[#F0A030]"
                        style={{ width: `${aspect.exactnessScore * 100}%` }}
                      />
                    </div>
                    <span className="font-mono text-white">
                      {(aspect.exactnessScore * 100).toFixed(0)}%
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right text-sm">
                  <div className="inline-flex items-center gap-2">
                    <div className="h-1 w-12 overflow-hidden rounded-full bg-[#2D241E]">
                      <div
                        className="h-full bg-gradient-to-r from-[#E29626] to-[#F0A030]"
                        style={{ width: `${aspect.orbStrength * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-stone-400">
                      {(aspect.orbStrength * 100).toFixed(0)}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
