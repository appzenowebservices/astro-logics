"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  Loader,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Zap,
  Terminal,
  Cpu,
} from "lucide-react";
import { api } from "~/trpc/react";
import { motion, AnimatePresence } from "framer-motion";
import PlanetCharacter2D, {
  type CharacterConfig,
  type CharacterMood,
} from "./PlanetCharacter2D";

const PLANET_NAMES = [
  "SUN",
  "MOON",
  "MERCURY",
  "VENUS",
  "MARS",
  "JUPITER",
  "SATURN",
  "URANUS",
  "NEPTUNE",
  "PLUTO",
  "MEAN_NODE",
  "TRUE_NODE",
] as const;

type PlanetName = (typeof PLANET_NAMES)[number];

const PLANET_ROLES: Record<PlanetName, string> = {
  SUN: "Chief Identity Officer",
  MOON: "Director of Mood",
  MERCURY: "Lead Comms Engineer",
  VENUS: "Value Architect",
  MARS: "Execution Lead",
  JUPITER: "Expansion Strategist",
  SATURN: "Compliance & Structure",
  URANUS: "Innovation Disruptor",
  NEPTUNE: "Creative Visionary",
  PLUTO: "Transformation Lead",
  MEAN_NODE: "Destiny Specialist",
  TRUE_NODE: "Path Optimizer",
};

const PLANET_COLORS: Record<
  PlanetName,
  { primary: string; secondary: string; emoji: string }
> = {
  SUN: { primary: "#FFD700", secondary: "#FFA500", emoji: "☉" },
  MOON: { primary: "#E0E0E0", secondary: "#A9A9A9", emoji: "☽" },
  MERCURY: { primary: "#87CEEB", secondary: "#4169E1", emoji: "☿" },
  VENUS: { primary: "#FFB6C1", secondary: "#FF69B4", emoji: "♀" },
  MARS: { primary: "#DC143C", secondary: "#FF4500", emoji: "♂" },
  JUPITER: { primary: "#DAA520", secondary: "#FF8C00", emoji: "♃" },
  SATURN: { primary: "#B8860B", secondary: "#8B7355", emoji: "♄" },
  URANUS: { primary: "#00CED1", secondary: "#008B8B", emoji: "♅" },
  NEPTUNE: { primary: "#4169E1", secondary: "#1E90FF", emoji: "♆" },
  PLUTO: { primary: "#2F4F4F", secondary: "#696969", emoji: "♇" },
  MEAN_NODE: { primary: "#C0C0C0", secondary: "#808080", emoji: "☊" },
  TRUE_NODE: { primary: "#A9A9A9", secondary: "#696969", emoji: "☋" },
};

function personalityToCharacterConfig(personalityState: any): CharacterConfig {
  if (!personalityState) return {};

  const {
    expressionProfile = {},
    visualInfluences = {},
    emotionalVector = {},
    behavioralBiases = [],
  } = personalityState;

  // Extract values with defaults
  const tempo = expressionProfile?.tempo || 0.5; // 0-1
  const intensity = emotionalVector?.intensity || 50; // 0-100
  const volatility = emotionalVector?.volatility || 0; // 0-100

  // Derive mood from behavioral biases and emotional state
  let mood: CharacterMood = "neutral";
  if (behavioralBiases?.includes("analytical") && intensity < 40) {
    mood = "sleepy";
  } else if (
    behavioralBiases?.includes("immediate-expression") &&
    volatility > 60
  ) {
    mood = "shocked";
  } else if (
    behavioralBiases?.includes("emotionally-reactive") &&
    intensity > 75
  ) {
    mood = "happy";
  }

  return {
    bodyColor: expressionProfile?.colorPalette?.[0] || "#AE2012",
    auraColor: expressionProfile?.colorPalette?.[1] || "#E9C46A",
    bobSpeed: Math.max(0.5, 3 - tempo * 2), // Faster tempo = faster bob
    bobIntensity: Math.max(0.1, tempo * 0.25),
    rotationSpeed: Math.max(0.1, tempo * 0.8), // Faster tempo = more rotation
    auraPulseSpeed: Math.max(0.8, 3 - intensity / 50), // High intensity = faster pulse
    eyeColor: visualInfluences?.eyeColor || "#2D241E",
    mood, // Will be used by PlanetCharacter2D for expression changes
  };
}

export default function NativityCharacterTab({
  nativityChartId,
}: {
  nativityChartId: string;
}) {
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetName>("SUN");
  const [logs, setLogs] = useState<string[]>([]);
  const planetColor = PLANET_COLORS[selectedPlanet];

  const {
    data: personalityData,
    isLoading,
    error,
  } = api.titans.getPersonalityState.useQuery(
    { chartId: nativityChartId },
    {
      staleTime: 60000, // Cache for 1 minute
      gcTime: 300000, // Keep in cache for 5 minutes
      trpc: {
        context: {
          req: {
            headers: {
              // Increase timeout to 2 minutes (120 seconds)
              "x-timeout": "120000",
            },
          },
        },
      },
    },
  );

  // Simulate ChatDev "Processing Logs" - MUST be before early returns
  useEffect(() => {
    const newLog = `[SYSTEM]: Summoning ${selectedPlanet} (${PLANET_ROLES[selectedPlanet]})...`;
    setLogs((prev) => [newLog, ...prev].slice(0, 5));
  }, [selectedPlanet]);

  // Compute character config - MUST be before early returns
  const characterConfig = useMemo(
    () => personalityToCharacterConfig(personalityData),
    [personalityData],
  );
  console.log("personalityData", personalityData);

  // Show loading state while server computes
  if (isLoading) {
    return (
      <div className="flex h-full w-full flex-col overflow-hidden bg-[#0F0D0C] font-mono text-stone-200 selection:bg-orange-500/30">
        {/* 1. TOP NAV / STATUS BAR */}
        <div className="flex h-14 items-center justify-between border-b border-white/5 bg-black/40 px-6 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <Cpu size={18} className="animate-pulse text-orange-500" />
            <span className="text-xs tracking-tighter uppercase opacity-50">
              Computing planetary core...
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] tracking-widest uppercase">
            <div className="h-2 w-2 animate-pulse rounded-full bg-yellow-500 shadow-[0_0_8px_#eab308]" />
            <span>Processing</span>
          </div>
        </div>

        {/* Loading spinner */}
        <div className="flex flex-1 items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Loader size={48} className="text-orange-500" />
          </motion.div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex h-full w-full flex-col overflow-hidden bg-[#0F0D0C] font-mono text-stone-200 selection:bg-orange-500/30">
        {/* 1. TOP NAV / STATUS BAR */}
        <div className="flex h-14 items-center justify-between border-b border-white/5 bg-black/40 px-6 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <AlertCircle size={18} className="text-red-500" />
            <span className="text-xs tracking-tighter uppercase opacity-50">
              Error loading personality
            </span>
          </div>
        </div>

        {/* Error message */}
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <div className="text-center text-red-400">
            <AlertCircle size={48} className="mx-auto mb-4" />
            <p className="text-sm">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  // Show empty state if no data
  if (!personalityData) {
    return (
      <div className="flex h-full w-full flex-col overflow-hidden bg-[#0F0D0C] font-mono text-stone-200 selection:bg-orange-500/30">
        {/* 1. TOP NAV / STATUS BAR */}
        <div className="flex h-14 items-center justify-between border-b border-white/5 bg-black/40 px-6 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <Cpu size={18} className="text-stone-500" />
            <span className="text-xs tracking-tighter uppercase opacity-50">
              No data available
            </span>
          </div>
        </div>

        {/* Empty state */}
        <div className="flex flex-1 items-center justify-center">
          <p className="text-stone-400">No personality state data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[#0F0D0C] font-mono text-stone-200 selection:bg-orange-500/30">
      {/* 1. TOP NAV / STATUS BAR */}
      <div className="flex h-14 items-center justify-between border-b border-white/5 bg-black/40 px-6 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Cpu size={18} className="animate-pulse text-orange-500" />
          <span className="text-xs tracking-tighter uppercase opacity-50">
            Celestial_OS v2.0.4
          </span>
        </div>
        <div className="flex items-center gap-6 text-[10px] tracking-widest uppercase">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]" />
            <span>Agent_Active</span>
          </div>
          <div className="opacity-40">CRC: {nativityChartId.slice(-8)}</div>
        </div>
      </div>

      <div className="relative flex flex-1">
        {/* 2. LEFT SIDEBAR: THE TERMINAL LOG (ChatDev Style) */}
        <div className="hidden w-64 flex-col gap-4 border-r border-white/5 bg-black/20 p-4 md:flex">
          <div className="mb-2 flex items-center gap-2 text-[10px] text-orange-500/70">
            <Terminal size={12} /> CONSOLE_OUTPUT
          </div>
          <div className="space-y-3">
            <AnimatePresence>
              {logs.map((log, i) => (
                <motion.div
                  key={log + i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="border-l border-white/10 pl-2 text-[9px] leading-relaxed opacity-60"
                >
                  {log}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* 3. MAIN STAGE: ISOMETRIC VIEW */}
        <div className="group relative flex-1 overflow-hidden">
          {/* Isometric Grid Background */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `radial-gradient(${planetColor.primary} 1px, transparent 0)`,
              backgroundSize: "40px 40px",
            }}
          />

          {/* The Floor "Podium" */}
          <div className="absolute bottom-[20%] left-1/2 h-[200px] w-[400px] -translate-x-1/2 rounded-[100%] bg-white/5 blur-3xl" />

          {/* Isometric Tile (The Agent's Base) */}
          <div className="absolute bottom-[25%] left-1/2 h-24 w-48 -translate-x-1/2 rotate-[15deg] skew-x-[-45deg] border border-white/20 bg-gradient-to-b from-white/10 to-transparent shadow-2xl" />

          {/* Character Stage */}
          <div className="absolute inset-0 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedPlanet}
                initial={{ opacity: 0, scale: 0.5, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.2, y: -20 }}
                className="relative z-10 scale-[1.8]"
              >
                <PlanetCharacter2D
                  config={characterConfig}
                  planet={selectedPlanet}
                  height="h-40"
                />

                {/* Role Label Tag */}
                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 rounded-full border border-white/20 bg-black/80 px-3 py-1 whitespace-nowrap shadow-xl">
                  <span className="text-[10px] font-bold tracking-tighter text-white/90 uppercase">
                    {selectedPlanet} // {PLANET_ROLES[selectedPlanet]}
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* CRT Scanline Effect */}
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_2px,3px_100%]" />
        </div>
      </div>

      {/* 4. FOOTER: GAME CONTROLS */}
      <div className="flex h-32 flex-col gap-3 border-t border-white/10 bg-black p-4">
        <div className="flex items-center justify-between px-2 text-[10px] tracking-widest text-stone-500 uppercase">
          <span>Select Active Unit</span>
          <span>
            Energy Output:{" "}
            {personalityData?.expressionProfile?.tempo
              ? Math.round(personalityData.expressionProfile.tempo * 100)
              : "--"}
            %
          </span>
        </div>

        <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-2">
          {PLANET_NAMES.map((planet) => (
            <button
              key={planet}
              onClick={() => setSelectedPlanet(planet)}
              className={`flex-shrink-0 rounded-md border px-4 py-2 text-[11px] font-bold transition-all ${
                selectedPlanet === planet
                  ? "translate-y-[-2px] border-orange-400 bg-orange-500 text-black shadow-[0_4px_0_#9a3412]"
                  : "border-white/5 bg-white/5 text-stone-500 hover:bg-white/10"
              } `}
            >
              {planet}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
