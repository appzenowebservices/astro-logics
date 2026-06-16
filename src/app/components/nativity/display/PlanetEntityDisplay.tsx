"use client";
import React from "react";
import { type PlanetPersonality } from "./personalityParser";

interface PlanetEntityDisplayProps {
  planet: string;
  personality: PlanetPersonality;
  avatar: string;
}

export default function PlanetEntityDisplay({
  planet,
  personality,
  avatar,
}: PlanetEntityDisplayProps) {
  const getMoodEmoji = (mood: string): string => {
    const moodMap: Record<string, string> = {
      radiant: "✨",
      contemplative: "🌙",
      passionate: "🔥",
      gentle: "💎",
      chaotic: "⚡",
      analytical: "🧠",
      enigmatic: "✴️",
    };
    return moodMap[mood] || "●";
  };

  const getMoodColor = (mood: string): string => {
    const colorMap: Record<string, string> = {
      radiant: "from-yellow-500 to-orange-400",
      contemplative: "from-blue-400 to-purple-500",
      passionate: "from-red-500 to-pink-500",
      gentle: "from-green-400 to-cyan-400",
      chaotic: "from-purple-500 to-pink-600",
      analytical: "from-cyan-400 to-blue-600",
      enigmatic: "from-slate-500 to-slate-600",
    };
    return colorMap[mood] || "from-slate-400 to-slate-500";
  };

  return (
    <div className="space-y-3">
      {/* Mood and Energy Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getMoodEmoji(personality.mood)}</span>
          <div>
            <div className="text-xs text-stone-400">Current State</div>
            <div className="text-sm font-semibold capitalize">
              {personality.mood}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-stone-400">Resonance</div>
          <div className="text-sm font-semibold text-[#E29626]">
            {Math.round(personality.energy * 100)}%
          </div>
        </div>
      </div>

      {/* Energy Bar visualization */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs text-stone-500">Life Force</span>
          <span className="text-xs text-stone-500">
            {personality.traits.length} traits
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded bg-[#1a1a1a]">
          <div
            className={`h-full bg-gradient-to-r ${getMoodColor(
              personality.mood,
            )} transition-all duration-500`}
            style={{ width: `${personality.energy * 100}%` }}
          />
        </div>
      </div>

      {/* Personality Traits Grid */}
      <div>
        <div className="mb-2 text-xs font-semibold text-[#E29626]">
          Essence Traits
        </div>
        <div className="flex flex-wrap gap-2">
          {personality.traits.map((trait) => (
            <div
              key={trait}
              className="rounded border border-[#333] bg-gradient-to-r from-[#1a1a1a] to-[#0f0f0f] px-2 py-1 text-xs font-medium text-stone-300 capitalize"
              title={trait}
            >
              {trait}
            </div>
          ))}
        </div>
      </div>

      {/* Avatar Text - Full narrative */}
      <div>
        <details className="group">
          <summary className="flex cursor-pointer items-center gap-1 text-xs text-stone-400 transition-colors hover:text-stone-300">
            <span className="inline-block transition-transform group-open:rotate-90">
              ▶
            </span>
            The {planet}'s Whispers
          </summary>
          <div className="mt-3 rounded border border-[#333] bg-[#0f0f0f] p-3">
            <div className="max-h-64 overflow-y-auto text-xs leading-relaxed whitespace-pre-wrap text-stone-300">
              {avatar}
            </div>
          </div>
        </details>
      </div>

      {/* Interaction hint */}
      <div className="text-xs text-stone-500 italic">
        This entity carries the unique signature of {planet} in your natal chart
      </div>
    </div>
  );
}
