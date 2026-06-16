"use client";
import React from "react";

interface SystemGuideProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function PlanetEntitySystemGuide({
  isOpen = true,
  onClose,
}: SystemGuideProps) {
  if (!isOpen) return null;

  return (
    <div className="mb-4 space-y-4 rounded border border-[#333] bg-[#0f0f0f] p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-[#E29626]">
          🌌 Planet Entities Guide
        </h4>
        {onClose && (
          <button
            onClick={onClose}
            className="text-xs text-stone-500 transition-colors hover:text-stone-300"
          >
            ✕
          </button>
        )}
      </div>

      <div className="space-y-3 text-xs text-stone-300">
        <div>
          <h5 className="mb-1 font-semibold text-stone-200">
            ✨ What Are Planet Entities?
          </h5>
          <p>
            Each planet in your natal chart is a living entity with its own
            personality, mood, and energy. When you summon them, the LLM
            generates a narrative description that becomes their "soul."
          </p>
        </div>

        <div>
          <h5 className="mb-1 font-semibold text-stone-200">
            🎨 How Personalities Are Built
          </h5>
          <ul className="ml-2 space-y-1">
            <li>
              • <span className="text-[#E29626]">Mood</span> - detected from the
              text (radiant, contemplative, passionate, etc.)
            </li>
            <li>
              • <span className="text-[#E29626]">Traits</span> - extracted from
              the narrative as key characteristics
            </li>
            <li>
              • <span className="text-[#E29626]">Energy</span> - calculated from
              text length, punctuation, and expressiveness
            </li>
            <li>
              • <span className="text-[#E29626]">Color</span> - planet-specific
              astrological colors
            </li>
          </ul>
        </div>

        <div>
          <h5 className="mb-1 font-semibold text-stone-200">
            3️⃣ The 3D Character
          </h5>
          <p>
            Each entity renders as a glowing orb with animated rings
            representing their energy aura. Hover to interact. The brighter and
            more active the aura, the higher their energy level.
          </p>
        </div>

        <div>
          <h5 className="mb-1 font-semibold text-stone-200">
            💫 Understanding the Display
          </h5>
          <ul className="ml-2 space-y-1">
            <li>
              • Sphere color = planetary association (Sun is gold, Mars is red,
              etc.)
            </li>
            <li>
              • Ring intensity = personality energy (how active the entity is)
            </li>
            <li>• Glow strength = how expressive their personality is</li>
            <li>
              • Traits tags = core characteristics extracted from their
              narrative
            </li>
          </ul>
        </div>

        <div className="rounded border border-[#333] bg-[#1a1a1a] p-2">
          <h5 className="mb-1 font-semibold text-stone-200">🔮 Pro Tip</h5>
          <p>
            Each time you summon a planet with the same chart, you'll get a
            different narrative but the same underlying personality type. This
            ensures consistency while allowing variety.
          </p>
        </div>
      </div>

      <div className="text-xs text-stone-500 italic">
        Summon your planets to begin communing with the cosmic forces within
        your natal chart.
      </div>
    </div>
  );
}
