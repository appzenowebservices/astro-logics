import chalk from "chalk";
import { db } from "~/server/db";
// import { createProvider } from "llm/providers/provider";
import type { NativityContext } from "~/server/services/storyGenerator";
import { createProvider } from "../../../../llm/providers/provider";

// ============================================================================
// INTERFACES & TYPES
// ============================================================================

export interface DignityResult {
  dignityType: string;
  strength: number;
}

export interface PlanetDataType {
  planet: string;
  longitude: number;
  speed: number;
  houseCusp?: number;
  houseSign?: string;
}

// ============================================================================
// PLANETARY PROFILE CALCULATOR
// ============================================================================

export function calculatePlanetaryDignity(
  planet: string,
  sign: string,
  house: number,
): DignityResult {
  const domicileMap: Record<string, string[]> = {
    SUN: ["LEO"],
    MOON: ["CANCER"],
    MERCURY: ["GEMINI", "VIRGO"],
    VENUS: ["TAURUS", "LIBRA"],
    MARS: ["ARIES", "SCORPIO"],
    JUPITER: ["SAGITTARIUS", "PISCES"],
    SATURN: ["CAPRICORN", "AQUARIUS"],
    URANUS: ["AQUARIUS"],
    NEPTUNE: ["PISCES"],
    PLUTO: ["SCORPIO"],
    MEAN_NODE: ["GEMINI", "SAGITTARIUS"],
  };

  const isDomicile = domicileMap[planet]?.includes(sign);
  const angularBonus = [1, 4, 7, 10].includes(house) ? 0.2 : 0;

  if (isDomicile) {
    return {
      dignityType: "Domicile",
      strength: Math.min(1.0, 0.8 + angularBonus),
    };
  }

  return { dignityType: "Neutral", strength: 0.5 + angularBonus };
}

// ============================================================================
// ASPECT DETECTION & ANALYSIS
// ============================================================================

export function detectAspects(
  planets: PlanetDataType[],
  exactDateTime: Date,
): Array<{
  planet1: string;
  planet2: string;
  aspectType: string;
  orbDistance: number;
  isApplying: boolean;
  exactnessScore: number;
  orbStrength: number;
  speedWeighting: number;
}> {
  const aspects: Array<{
    planet1: string;
    planet2: string;
    aspectType: string;
    orbDistance: number;
    isApplying: boolean;
    exactnessScore: number;
    orbStrength: number;
    speedWeighting: number;
  }> = [];
  const ASPECT_ANGLES: Record<string, number> = {
    conjunction: 0,
    opposition: 180,
    square: 90,
    trine: 120,
    sextile: 60,
  };

  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const p1 = planets[i];
      const p2 = planets[j];

      let distance = Math.abs(p1.longitude - p2.longitude);
      if (distance > 180) distance = 360 - distance;

      for (const [aspectName, aspectAngle] of Object.entries(ASPECT_ANGLES)) {
        let orb = 8;
        if (aspectName === "square" || aspectName === "sextile") orb = 6;
        if (aspectName === "sextile") orb = 4;

        const angleDiff = Math.abs(distance - aspectAngle);
        if (angleDiff <= orb) {
          const isApplying = p1.speed > p2.speed && p1.longitude < p2.longitude;
          const exactnessScore = 1 - angleDiff / orb;

          aspects.push({
            planet1: p1.planet,
            planet2: p2.planet,
            aspectType: aspectName,
            orbDistance: angleDiff,
            isApplying,
            exactnessScore: Math.max(0, Math.min(1, exactnessScore)),
            orbStrength: 1 - angleDiff / orb,
            speedWeighting: Math.abs(p1.speed - p2.speed),
          });
        }
      }
    }
  }

  return aspects;
}

// ============================================================================
// WHOLE SIGN HOUSE SYSTEM (VEDIC/SIDEREAL)
// ============================================================================

export function calculateWholeSignHouse(
  planetLongitude: number,
  ascendantLongitude: number,
): { house: number; sign: string; degree: number } {
  const SIGNS = [
    "ARIES",
    "TAURUS",
    "GEMINI",
    "CANCER",
    "LEO",
    "VIRGO",
    "LIBRA",
    "SCORPIO",
    "SAGITTARIUS",
    "CAPRICORN",
    "AQUARIUS",
    "PISCES",
  ];

  // Normalize longitudes to 0-360
  const normalizedPlanet = ((planetLongitude % 360) + 360) % 360;
  const normalizedAsc = ((ascendantLongitude % 360) + 360) % 360;

  // Get zodiac sign index (0-11)
  const planetSignIndex = Math.floor(normalizedPlanet / 30);
  const ascSignIndex = Math.floor(normalizedAsc / 30);

  // Calculate house number using Whole Sign system
  // House = (Planet sign - Ascendant sign + 12) % 12 + 1
  const houseNumber = ((planetSignIndex - ascSignIndex + 12) % 12) + 1;

  return {
    house: houseNumber,
    sign: SIGNS[planetSignIndex],
    degree: Math.floor(normalizedPlanet % 30),
  };
}

// ============================================================================
// DIGNITY DESCRIPTION
// ============================================================================

export function getDignityDescription(context: any): string {
  if (context.isExaltation) return `Exalted in ${context.zodiacSign}`;
  if (context.isDomicile) return `In Domicile in ${context.zodiacSign}`;
  if (context.isDetriment) return `In Detriment in ${context.zodiacSign}`;
  if (context.isFall) return `In Fall in ${context.zodiacSign}`;
  return `Neutral (score: ${context.dignityScore.toFixed(1)}/5)`;
}

// ============================================================================
// NARRATIVE GENERATION
// ============================================================================

const ZODIAC_SIGNS = [
  "ARIES",
  "TAURUS",
  "GEMINI",
  "CANCER",
  "LEO",
  "VIRGO",
  "LIBRA",
  "SCORPIO",
  "SAGITTARIUS",
  "CAPRICORN",
  "AQUARIUS",
  "PISCES",
];

function getZodiacSign(longitude: number): string {
  const normalized = ((longitude % 360) + 360) % 360;
  return ZODIAC_SIGNS[Math.floor(normalized / 30)] || "UNKNOWN";
}

function buildNatalSummary(chart: any): string {
  const natalPlanets = (chart.ephemerisData?.planets || []).map((p: any) => ({
    planet: p.planet,
    longitude: p.longitude,
    direction: p.direction,
    houseSign: p.houseSign,
  }));

  return natalPlanets
    .map(
      (planet) =>
        `${planet.planet}: ${planet.houseSign} / ${getZodiacSign(planet.longitude)} @ ${planet.longitude.toFixed(1)}° / ${planet.direction}`,
    )
    .join("\n");
}

function buildProfileSummary(chart: any): string {
  const planetaryProfiles = (chart.planetaryProfiles || []).map((p: any) => ({
    planet: p.planet,
    primaryDomain: p.primaryDomain || "Unknown",
    dignity: p.dignity || "Neutral",
    strength: Number(p.strength ?? 0),
  }));

  return planetaryProfiles
    .map(
      (profile) =>
        `${profile.planet}: ${profile.primaryDomain} (${profile.dignity}) strength=${Math.round(profile.strength * 100)}%`,
    )
    .join("\n");
}

function buildAspectsSummary(chart: any): string {
  const natalAspects = (chart.aspects || []).map((a: any) => ({
    planet1: a.planet1,
    planet2: a.planet2,
    aspectType: a.aspectType,
    orbDistance: a.orbDistance,
    isApplying: Boolean(a.isApplying),
  }));

  return natalAspects
    .slice(0, 12)
    .map(
      (aspect) =>
        `${aspect.planet1} ${aspect.aspectType} ${aspect.planet2} @ ${aspect.orbDistance.toFixed(1)}° ${aspect.isApplying ? "applying" : "separating"}`,
    )
    .join("\n");
}

function buildTransitSummary(scenes: any[]): string {
  return scenes
    .map((scene, index) => {
      const sign = getZodiacSign(scene.currentPosition);
      const aspects =
        (scene.aspectsActive || [])
          .map(
            (aspect: any) => `${aspect.aspectType} (${aspect.orb.toFixed(1)}°)`,
          )
          .join(", ") || "no major aspect";
      return `${index + 1}. ${scene.planet} ${sign} @ ${scene.currentPosition.toFixed(1)}° / ${scene.intensity}% / ${scene.theme} / ${aspects}`;
    })
    .join("\n");
}

function buildNativityContext(chart: any, scenes: any[]): NativityContext {
  const natalPlanets = (chart.ephemerisData?.planets || []).map((p: any) => ({
    planet: p.planet,
    longitude: p.longitude,
    latitude: p.latitude,
    speed: Math.abs(p.speed || 0),
    direction: p.direction,
    houseCusp: p.houseCusp,
    houseSign: p.houseSign,
  }));

  const natalAspects = (chart.aspects || []).map((a: any) => ({
    planet1: a.planet1,
    planet2: a.planet2,
    aspectType: a.aspectType,
    orbDistance: a.orbDistance,
    isApplying: Boolean(a.isApplying),
    exactnessScore: Number(a.exactnessScore ?? 0),
  }));

  const planetaryProfiles = (chart.planetaryProfiles || []).map((p: any) => ({
    planet: p.planet,
    primaryDomain: p.primaryDomain || "Unknown",
    secondaryDomain: p.secondaryDomain || null,
    strength: Number(p.strength ?? 0),
    dignity: p.dignity || "Neutral",
  }));

  const transitingPlanets = scenes.map((scene) => ({
    planet: scene.planet,
    longitude: scene.currentPosition,
    aspects: (scene.aspectsActive || []).map((aspect: any) => ({
      planet: aspect.withPlanet || scene.planet,
      aspectType: aspect.aspectType,
      orb: aspect.orb,
    })),
  }));

  return {
    planets: natalPlanets,
    aspects: natalAspects,
    planetaryProfiles,
    transitingPlanets,
  };
}

export async function generateScenarioOutline(
  scenes: any[],
  chart: any,
): Promise<string> {
  const summaryNatalPlanets = buildNatalSummary(chart);
  const summaryProfiles = buildProfileSummary(chart);
  const summaryNatalAspects = buildAspectsSummary(chart);
  const summaryTransitScenes = buildTransitSummary(scenes);
  // console.log(chalk.yellow('\nsummaryTransitScenes=============='))

  const nativityContext: NativityContext = buildNativityContext(chart, scenes);

  const previousStoriesData = await db.currentStory.findMany({
    where: {
      nativityChart: {
        userId: chart.userId,
      },
      transitDate: {
        lt: new Date(),
      },
    },
    select: {
      mainNarrative: true,
      themes: true,
      transitDate: true,
    },
    orderBy: {
      transitDate: "desc",
    },
    take: 10,
  });

  const previousStories = previousStoriesData
    .map(
      (s) =>
        `Date: ${s.transitDate.toISOString().split("T")[0]}, Themes: ${s.themes.join(", ")}, Narrative: ${s.mainNarrative}`,
    )
    .join("\n\n");

  const prompt = `
[USER PROFILE]
Name: ${chart.name || "Unknown"}

[NATAL CORE]
${summaryNatalPlanets}

[ACTIVE TRANSITS]
${summaryTransitScenes}

[PAST STORY MEMORY]
${previousStories || "None"}

[TASK]
Analyze the user's CURRENT LIFE TRAJECTORY from recurring astrological patterns.

Do NOT generate scenes.
Do NOT generate dialogue.
Do NOT narrate events.

Your job is to detect:
- recurring behavioral loops
- current pressure points
- likely mistakes
- relationship dynamics
- future trajectory if unchanged

FORMAT STRICTLY:

DOMINANT_PATTERN:
[Main recurring life pattern currently activated]

RECURRING_BEHAVIOR:
[What the user repeatedly does under this pressure]

CURRENT_PRESSURE:
[What external situation is intensifying the pattern]

EXTERNAL_TRIGGER:
[What real-world circumstance is activating this now]

LIKELY_MISTAKE:
[What the user is most likely to do wrong]

EMOTIONAL_COST:
[What this pattern drains emotionally]

RELATIONSHIP_IMPACT:
[How this affects others around them]

TRAJECTORY:
[Where this situation is heading if unchanged]

[HARD RULES]
- No astrology terms
- No scenes
- No dialogue
- No philosophy
- No generic emotional language
- Everything must feel grounded and plausible
- Focus on behavioral patterns, not abstract personality

Only output this format.
`;

  const provider = createProvider({
    provider: process.env.USE_LOCAL_LLM === "true" ? "local" : "groq",
    baseUrl:
      process.env.USE_LOCAL_LLM === "true"
        ? process.env.LLAMA_CPP_URL || "http://localhost:8000"
        : undefined,
    model:
      process.env.USE_LOCAL_LLM === "true"
        ? process.env.LLAMA_CPP_MODEL || "local-gguf-model"
        : process.env.GROQ_MODEL || "mixtral-8x7b-32768",
  });

  const response = await provider.generate({
    system:
      "You are an expert astrological storyteller. Output the scene script in the exact requested format only.",
    user: prompt,
  });

  return response.text.trim();
}

export async function generateSceneScriptFromScenarios(
  scenarioOutline: string,
  scenes: any[],
  chart: any,
): Promise<string> {
  const summaryNatalPlanets = buildNatalSummary(chart);
  const summaryTransitScenes = buildTransitSummary(scenes);
  const nativityContext: NativityContext = buildNativityContext(chart, scenes);
  console.log(chalk.yellow("\nscenarioOutline============================"));
  console.log(scenarioOutline);

  const prompt = `
[NARRATIVE STATE]
${scenarioOutline}

[TASK]
Convert this narrative state into ONE continuous real-life scene unfolding in 3 escalating beats.

This must feel like:
- pressure becoming visible
- behavior creating consequences
- tension escalating naturally

FORMAT:

TITLE:
SETTING:

BEAT 1:
ACTION:
DIALOGUE:
STATE:

BEAT 2:
ACTION:
DIALOGUE:
STATE:

BEAT 3:
ACTION:
DIALOGUE:
STATE:

[HARD RULES]
- Same setting throughout
- Dialogue must be short and reactive
- Show consequences happening live
- No speeches or monologues
- No astrology or cosmic language
- The conflict must escalate naturally
- The user must make a visible mistake, avoidance, or reaction

Only output this format.
`;

  const provider = createProvider({
    provider: process.env.USE_LOCAL_LLM === "true" ? "local" : "groq",
    baseUrl:
      process.env.USE_LOCAL_LLM === "true"
        ? process.env.LLAMA_CPP_URL || "http://localhost:8000"
        : undefined,
    model:
      process.env.USE_LOCAL_LLM === "true"
        ? process.env.LLAMA_CPP_MODEL || "local-gguf-model"
        : process.env.GROQ_MODEL || "mixtral-8x7b-32768",
  });

  const response = await provider.generate({
    system:
      "You are an expert astrological storyteller. Output the scene script in the exact requested format only.",
    user: prompt,
  });

  return response.text.trim();
}

export function extractThemes(scenes: any[]): string[] {
  const themes = new Set<string>();

  for (const scene of scenes) {
    if (scene.intensity > 70) {
      themes.add(`${scene.planet} activation`);
    }
    scene.aspectsActive.forEach((a: any) => {
      themes.add(`${a.aspectType} aspect`);
    });
  }

  return Array.from(themes);
}

export function getMoodFromEnergy(energy: number, actionType: string): string {
  if (actionType === "boost") return "Energized 🔋";
  if (actionType === "heal") return "Renewed 💚";
  if (actionType === "challenge") return "Awakened ⚡";

  if (energy > 85) return "Ecstatic 🌟";
  if (energy > 70) return "Joyful ✨";
  if (energy > 55) return "Active 💫";
  if (energy > 40) return "Calm 🌙";
  if (energy > 25) return "Weary 😔";
  return "Struggling 🌑";
}

export function generateFallbackNarrative(scenes: any[], chart: any): string {
  const topScenes = scenes
    .slice(0, 3)
    .map((s) => s.planet)
    .join(", ");
  const maxIntensity = Math.max(...scenes.map((s) => s.intensity || 0), 0);
  const topTheme =
    scenes.length > 0 && scenes[0].theme ? scenes[0].theme : "cosmic alignment";

  const intensity =
    maxIntensity > 75 ? "CRITICAL" : maxIntensity > 50 ? "HIGH" : "MODERATE";

  return `[KAALVANTA SYSTEM - FALLBACK MODE]

Chart: ${chart.name || "Unknown"}
Status: LLM Service Temporarily Unavailable

ACTIVE PLANETARY INFLUENCES:
${topScenes}

SYSTEM STATE: ${intensity}

PRIMARY THEME: ${topTheme}

SCENE SUMMARY:
The cosmic machinery churns with ${scenes.length > 0 ? "multiple" : "subtle"} planetary shifts. ${topScenes} are the primary focus of today's celestial traffic. 

NARRATIVE THREAD:
Your natal chart encounters ${intensity.toLowerCase()} transit influence. The cosmic backend is recalibrating your life's code. Expect shifts in the areas governed by ${topScenes}.

AGENTIC_STATE: SYSTEM_MONITORING
[System will regenerate detailed narrative when LLM services are restored]

---
Note: This is a fallback narrative. Detailed analysis will be available when the LLM service recovers.`;
}
