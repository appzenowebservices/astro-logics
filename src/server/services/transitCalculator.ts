import type { Prisma } from "@prisma/client";
import { getSwissEph } from "~/server/astro/swissEph";
// import { createProvider } from "agent-runtime/src/llm/provider";
import chalk from "chalk";
import { createProvider } from "../../../llm/providers/provider";
// import { createProvider } from 'llm/providers/provider';
export type NativityAspect = Prisma.NativityAspectGetPayload<{}>;

export interface TransitSnapshot {
  date: Date;
  planets: Array<{
    planet: string;
    longitude: number;
    latitude: number | null;
    zodiacSign: string;
    degree: number;
    isRetrograde: boolean;
    speed: number;
  }>;
}

export interface PlanetaryScene {
  planet: string;
  natalPosition: number;
  currentPosition: number;
  movementDegrees: number;
  aspectsActive: Array<{
    withPlanet: string;
    aspectType: string;
    orb: number;
    isExact: boolean;
  }>;
  theme: string;
  plotTwist: string;
  intensity: number;
  behavioralPattern?: string;
  externalConflict?: string;
  likelyMistake?: string;
  relationshipEffect?: string;
  pressureDirection?: string;
}

export interface CurrentStoryState {
  dominantPressure: string;
  secondaryPressure: string[];

  emotionalTone: string;
  emotionalVolatility: number; // 0-100

  energyLevel: string;
  mentalLoad: number; // 0-100

  relationshipStrain: number; // 0-100
  communicationBreakdown: number; // 0-100

  selfControl: number; // 0-100
  impulsiveness: number; // 0-100

  avoidanceLevel: number; // 0-100
  overwhelmLevel: number; // 0-100

  confidenceState: string;
  identityPressure: number; // 0-100

  unresolvedPattern: string;
  repeatingBehaviorLoops: string[];

  externalPressureSources: string[];
  activeConflictZones: string[];

  copingMechanisms: string[];
  suppressedNeeds: string[];

  likelyFailurePoint: string;
  currentTrajectory: string;

  socialAtmosphere: string;
  trustLevel: number; // 0-100

  burnoutRisk: number; // 0-100

  narrativeMomentum: string;
  nextLikelyEscalation: string;

  timePressure: number; // 0-100
  stabilityIndex: number; // 0-100
}

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

export class TransitCalculator {
  /**
   * Generate transit snapshot for a given date
   */
  async getTransitSnapshot(
    date: Date,
    _latitude: number,
    _longitude: number,
  ): Promise<TransitSnapshot> {
    const swe = await getSwissEph();

    const jd = swe.julday(
      date.getUTCFullYear(),
      date.getUTCMonth() + 1,
      date.getUTCDate(),
      date.getUTCHours() +
        date.getUTCMinutes() / 60 +
        date.getUTCSeconds() / 3600,
    );

    const flags = swe.SEFLG_SWIEPH | swe.SEFLG_SIDEREAL | swe.SEFLG_SPEED;

    const planetMap: Record<string, number> = {
      SUN: swe.SE_SUN,
      MOON: swe.SE_MOON,
      MERCURY: swe.SE_MERCURY,
      VENUS: swe.SE_VENUS,
      MARS: swe.SE_MARS,
      JUPITER: swe.SE_JUPITER,
      SATURN: swe.SE_SATURN,
      URANUS: swe.SE_URANUS,
      NEPTUNE: swe.SE_NEPTUNE,
      PLUTO: swe.SE_PLUTO,
    };

    const planets = [
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
    ];

    // console.log(chalk.green(" ====== planets ===> ", planets));

    const STATIONARY_THRESHOLD = 0.0001;
    return {
      date,
      planets: planets.map((p) => {
        const planetId = planetMap[p];
        const res = swe.calc_ut(jd, planetId, flags);

        const longitude = ((res[0] % 360) + 360) % 360;
        const speed = res[3]; // Daily motion in degrees per day
        return {
          planet: p,
          longitude,
          zodiacSign: ZODIAC_SIGNS[Math.floor(longitude / 30)],
          degree: longitude % 30,
          /* 
             A planet is retrograde if speed is negative. 
             A planet is 'Stationary' if speed is effectively 0.
          */
          isRetrograde: speed < 0,
          isStationary: Math.abs(speed) < STATIONARY_THRESHOLD,
          speed: speed, // Keep the raw speed for cinematic interpolation
        };
      }),
    };
  }

  /**
   * Calculate active aspects between natal and transit positions
   */
  async calculatePlanetaryTithis(
    natalPlanets: Array<{ planet: string; longitude: number }>,
    transitPlanets: TransitSnapshot["planets"],
  ): Promise<PlanetaryScene[]> {
    const scenes: PlanetaryScene[] = [];
    const aspectOrbs = {
      conjunction: 8,
      sextile: 6,
      square: 8,
      trine: 8,
      opposition: 8,
      quincunx: 6,
    };

    for (const natalPlanet of natalPlanets) {
      const transitPlanet = transitPlanets.find(
        (t) => t.planet === natalPlanet.planet,
      );

      if (!transitPlanet) continue;

      const movement = this.calculateLongitudeDifference(
        natalPlanet.longitude,
        transitPlanet.longitude,
      );

      const aspects = this.findActiveAspects(
        natalPlanet.longitude,
        transitPlanet.longitude,
        aspectOrbs,
        natalPlanet.planet,
      );

      const {
        theme,
        plotTwist,
        intensity,
        behavioralPattern,
        externalConflict,
        likelyMistake,
        relationshipEffect,
        pressureDirection,
      } = await this.generatePlotElements(
        natalPlanet.planet,
        aspects,
        movement,
      );
      console.log(chalk.bgGreen(`PLANET : `));
      console.log(chalk.green(`${natalPlanet.planet} `));
      console.log(chalk.red(`THEME : `));
      console.log(chalk.green(`${theme} `));
      console.log(chalk.bgYellowBright(`plotTwist :`));
      console.log(chalk.green(` ${plotTwist} `));
      console.log(chalk.bgYellowBright(`behavioralPattern :`));
      console.log(chalk.green(` ${behavioralPattern} `));
      console.log(chalk.bgYellowBright(`externalConflict :`));
      console.log(chalk.green(` ${externalConflict} `));
      console.log(chalk.bgYellowBright(`likelyMistake :`));
      console.log(chalk.green(` ${likelyMistake} `));
      console.log(chalk.bgYellowBright(`relationshipEffect :`));
      console.log(chalk.green(` ${relationshipEffect} `));
      console.log(chalk.bgYellowBright(`pressureDirection :`));
      console.log(chalk.green(` ${pressureDirection} `));

      scenes.push({
        planet: natalPlanet.planet,
        natalPosition: natalPlanet.longitude,
        currentPosition: transitPlanet.longitude,
        movementDegrees: movement,
        aspectsActive: aspects,
        theme,
        plotTwist,
        intensity,
        behavioralPattern,
        externalConflict,
        likelyMistake,
        relationshipEffect,
        pressureDirection,
      });
    }

    return scenes;
  }

  /**
   * Generate narrative plot elements
   */
  private async generatePlotElements(
    planet: string,
    aspects: Array<{ aspectType: string; orb: number }>,
    movement: number,
  ): Promise<{
    theme: string;
    plotTwist: string;
    intensity: number;
    behavioralPattern: string;
    externalConflict: string;
    likelyMistake: string;
    relationshipEffect: string;
    pressureDirection: string;
  }> {
    const intensity = Math.min(
      100,
      aspects.reduce((sum, a) => {
        const orbInfluence = Math.max(0, 8 - a.orb) * 10;
        return sum + orbInfluence;
      }, 0),
    );

    const prompt = `
You are generating behavioral pressure analysis from planetary transit data.

IMPORTANT:
- No spirituality
- No mythology
- No cosmic language
- No symbolism
- No fantasy
- No psychological jargon
- No motivational language

Generate grounded HUMAN behavioral dynamics only.

PLANET: ${planet}
MOVEMENT: ${movement.toFixed(2)}°
ACTIVE ASPECTS:
${
  aspects.length > 0
    ? aspects.map((a) => `${a.aspectType} (${a.orb.toFixed(1)}°)`).join(", ")
    : "none"
}

PLANETARY BEHAVIORAL ARCHETYPES:

SUN:
identity pressure, recognition needs, ego sensitivity, direction

MOON:
emotional safety, habits, reactions, comfort-seeking

MERCURY:
communication, overthinking, quick decisions, misunderstandings

VENUS:
relationships, validation, harmony, avoidance of discomfort

MARS:
impatience, force, conflict, pushing too hard

JUPITER:
overcommitment, optimism, excess, expansion beyond limits

SATURN:
fear of mistakes, restraint, responsibility, delay

URANUS:
restlessness, disruption, rejection of control

NEPTUNE:
avoidance, confusion, unrealistic expectations

PLUTO:
obsession, control struggles, emotional intensity

FIELD RULES:

theme:
- core human tension
- short phrase only
- NOT a full sentence

behavioralPattern:
- recurring behavior under pressure
- observable action
- what the person repeatedly does

externalConflict:
- real-world situation creating pressure
- must involve another person, system, or responsibility

likelyMistake:
- specific wrong move caused by pressure
- realistic and human

relationshipEffect:
- how others respond over time
- emotional or communication consequence

pressureDirection:
- what life is forcing the person toward
- concrete adjustment or realization

plotTwist:
- subtle complication
- realistic consequence
- not dramatic fantasy

GOOD OUTPUT EXAMPLES:

{
  "theme": "Overcommitting beyond realistic capacity",
  "behavioralPattern": "Says yes before checking existing responsibilities",
  "externalConflict": "Multiple people now expect updates simultaneously",
  "likelyMistake": "Promises faster results than possible",
  "relationshipEffect": "Others become less patient with delays",
  "pressureDirection": "Learning to disappoint expectations earlier instead of later",
  "plotTwist": "A small unfinished task suddenly becomes urgent"
}

BAD OUTPUT EXAMPLES:
- spiritual awakening
- cosmic shift
- destiny unfolding
- emotional transformation
- hidden celestial truths
- ancient forces
- collective consciousness

CRITICAL:
Each field must describe a DIFFERENT layer of the same pressure pattern.
Do NOT repeat the same idea across fields.

Return ONLY valid JSON.
`;
    // console.log(chalk.bgBlueBright('\nPrompt for LLM:', prompt));

    try {
      const llm = createProvider({ provider: "groq" });
      const response = await llm.generate({
        system:
          'You are an expert astrologer. Output ONLY valid JSON with "theme", "plotTwist", "behavioralPattern", "externalConflict", "likelyMistake", "relationshipEffect", and "pressureDirection" fields. No markdown, no comments.',
        user: prompt,
      });

      let text = response.text.trim();

      // Remove markdown code blocks
      text = text.replace(/^```json?\s*\n?/, "").replace(/\n?\s*```$/, "");

      // Extract theme using regex - handles unescaped content
      const themeMatch =
        /"theme"\s*:\s*"([^"]*(?:\\"[^"]*)*)"/.exec(text) ||
        /'theme'\s*:\s*'([^']*(?:\\'[^']*)*)'/.exec(text);
      const theme = themeMatch?.[1]?.replace(/\\"/g, '"') || "";

      // Extract plotTwist using regex - handles unescaped content
      const plotTwistMatch =
        /"plotTwist"\s*:\s*"([^"]*(?:\\"[^"]*)*)"/.exec(text) ||
        /'plotTwist'\s*:\s*'([^']*(?:\\'[^']*)*)'/.exec(text);
      const plotTwist = plotTwistMatch?.[1]?.replace(/\\"/g, '"') || "";

      // Extract behavioralPattern
      const behavioralPatternMatch =
        /"behavioralPattern"\s*:\s*"([^"]*(?:\\"[^"]*)*)"/.exec(text) ||
        /'behavioralPattern'\s*:\s*'([^']*(?:\\'[^']*)*)'/.exec(text);
      const behavioralPattern =
        behavioralPatternMatch?.[1]?.replace(/\\"/g, '"') || "";

      // Extract externalConflict
      const externalConflictMatch =
        /"externalConflict"\s*:\s*"([^"]*(?:\\"[^"]*)*)"/.exec(text) ||
        /'externalConflict'\s*:\s*'([^']*(?:\\'[^']*)*)'/.exec(text);
      const externalConflict =
        externalConflictMatch?.[1]?.replace(/\\"/g, '"') || "";

      // Extract likelyMistake
      const likelyMistakeMatch =
        /"likelyMistake"\s*:\s*"([^"]*(?:\\"[^"]*)*)"/.exec(text) ||
        /'likelyMistake'\s*:\s*'([^']*(?:\\'[^']*)*)'/.exec(text);
      const likelyMistake = likelyMistakeMatch?.[1]?.replace(/\\"/g, '"') || "";

      // Extract relationshipEffect
      const relationshipEffectMatch =
        /"relationshipEffect"\s*:\s*"([^"]*(?:\\"[^"]*)*)"/.exec(text) ||
        /'relationshipEffect'\s*:\s*'([^']*(?:\\'[^']*)*)'/.exec(text);
      const relationshipEffect =
        relationshipEffectMatch?.[1]?.replace(/\\"/g, '"') || "";

      // Extract pressureDirection
      const pressureDirectionMatch =
        /"pressureDirection"\s*:\s*"([^"]*(?:\\"[^"]*)*)"/.exec(text) ||
        /'pressureDirection'\s*:\s*'([^']*(?:\\'[^']*)*)'/.exec(text);
      const pressureDirection =
        pressureDirectionMatch?.[1]?.replace(/\\"/g, '"') || "";

      return {
        theme: theme.trim() || "Energy shifts in unexpected ways",
        plotTwist:
          plotTwist.trim() || "Unexpected developments shift your perspective",
        behavioralPattern:
          behavioralPattern.trim() ||
          "Responding to pressure with familiar habits",
        externalConflict:
          externalConflict.trim() || "External demands create tension",
        likelyMistake: likelyMistake.trim() || "Overreacting to minor issues",
        relationshipEffect:
          relationshipEffect.trim() || "Communication becomes strained",
        pressureDirection:
          pressureDirection.trim() || "Pushing towards necessary changes",
        intensity: Math.round(intensity),
      };
    } catch (error) {
      console.error(
        "Transit plot generation failed, falling back to defaults",
        error,
      );
      return {
        theme:
          Math.abs(movement) < 2
            ? "Stable energy holds its ground"
            : "A shift is demanding your focus",
        plotTwist: "A hidden angle flips the usual pattern unexpectedly.",
        behavioralPattern: "Falling back to default behavioral responses",
        externalConflict: "Unexpected external pressures emerge",
        likelyMistake: "Misjudging the timing of actions",
        relationshipEffect: "Interactions become more challenging",
        pressureDirection: "Pushing towards adaptation",
        intensity: Math.round(intensity),
      };
    }
  }

  /**
   * Generate collective story state from all planetary scenes
   */
  async generateCollectiveStoryState(
    scenes: PlanetaryScene[],
  ): Promise<CurrentStoryState> {
    const prompt = `
You are generating a collective behavioral pressure analysis from multiple planetary transit scenes.

IMPORTANT:
- No spirituality, mythology, cosmic language, symbolism, fantasy, psychological jargon, or motivational language
- Generate grounded HUMAN behavioral dynamics only
- Aggregate all planetary influences into a unified current state

PLANETARY SCENES:
${scenes
  .map(
    (scene) => `
PLANET: ${scene.planet}
THEME: ${scene.theme}
BEHAVIORAL PATTERN: ${scene.behavioralPattern}
EXTERNAL CONFLICT: ${scene.externalConflict}
LIKELY MISTAKE: ${scene.likelyMistake}
RELATIONSHIP EFFECT: ${scene.relationshipEffect}
PRESSURE DIRECTION: ${scene.pressureDirection}
INTENSITY: ${scene.intensity}
`,
  )
  .join("\n")}

Generate a comprehensive JSON object representing the collective current story state. Each field must be derived from the aggregated planetary influences.

Return ONLY valid JSON with all the specified fields.
`;

    try {
      const llm = createProvider({ provider: "groq" });
      const response = await llm.generate({
        system:
          "You are an expert behavioral analyst. Output ONLY valid JSON with all the specified fields for the current story state. No markdown, no comments.",
        user: prompt,
      });

      let text = response.text.trim();
      text = text.replace(/^```json?\s*\n?/, "").replace(/\n?\s*```$/, "");

      const parsed = JSON.parse(text);
      return parsed as CurrentStoryState;
    } catch (error) {
      console.error(
        "Collective story state generation failed, using defaults",
        error,
      );
      return {
        dominantPressure: "Accumulated daily pressures",
        secondaryPressure: ["Work demands", "Personal responsibilities"],
        emotionalTone: "Overwhelmed",
        emotionalVolatility: 60,
        energyLevel: "Drained",
        mentalLoad: 75,
        relationshipStrain: 50,
        communicationBreakdown: 40,
        selfControl: 45,
        impulsiveness: 55,
        avoidanceLevel: 60,
        overwhelmLevel: 70,
        confidenceState: "Uncertain",
        identityPressure: 65,
        unresolvedPattern: "Procrastination cycles",
        repeatingBehaviorLoops: [
          "Avoiding difficult conversations",
          "Overcommitting",
        ],
        externalPressureSources: ["Work deadlines", "Family expectations"],
        activeConflictZones: ["Time management", "Communication"],
        copingMechanisms: ["Distraction", "Overworking"],
        suppressedNeeds: ["Rest", "Emotional support"],
        likelyFailurePoint: "Breaking under accumulated stress",
        currentTrajectory: "Heading toward burnout",
        socialAtmosphere: "Tense",
        trustLevel: 40,
        burnoutRisk: 80,
        narrativeMomentum: "Escalating pressure",
        nextLikelyEscalation: "Major conflict or breakdown",
        timePressure: 85,
        stabilityIndex: 25,
      };
    }
  }

  private findActiveAspects(
    natalLong: number,
    transitLong: number,
    aspectOrbs: Record<string, number>,
    natalPlanet: string,
  ): Array<{
    withPlanet: string;
    aspectType: string;
    orb: number;
    isExact: boolean;
  }> {
    const diff = this.calculateLongitudeDifference(natalLong, transitLong);
    const active: Array<{
      withPlanet: string;
      aspectType: string;
      orb: number;
      isExact: boolean;
    }> = [];

    const aspects = [
      { angle: 0, name: "conjunction" },
      { angle: 60, name: "sextile" },
      { angle: 90, name: "square" },
      { angle: 120, name: "trine" },
      { angle: 180, name: "opposition" },
      { angle: 150, name: "quincunx" },
    ];

    for (const aspect of aspects) {
      const orb = Math.abs(diff - aspect.angle);
      const allowedOrb = aspectOrbs[aspect.name] || 8;

      if (orb <= allowedOrb || orb >= 360 - allowedOrb) {
        active.push({
          withPlanet: natalPlanet,
          aspectType: aspect.name,
          orb: Math.min(orb, 360 - orb),
          isExact: Math.min(orb, 360 - orb) < 1,
        });
      }
    }

    return active;
  }

  private calculateLongitudeDifference(long1: number, long2: number): number {
    let diff = long2 - long1;
    while (diff > 180) diff -= 360;
    while (diff < -180) diff += 360;
    return diff;
  }

  private getPlanetBasePosition(planet: string): number {
    const positions: Record<string, number> = {
      SUN: 0,
      MOON: 45,
      MERCURY: 90,
      VENUS: 135,
      MARS: 180,
      JUPITER: 225,
      SATURN: 270,
      URANUS: 45,
      NEPTUNE: 315,
      PLUTO: 120,
    };
    return positions[planet] || 0;
  }

  private getPlanetSpeed(planet: string): number {
    const speeds: Record<string, number> = {
      SUN: 1.0,
      MOON: 13.2,
      MERCURY: 1.3,
      VENUS: 1.2,
      MARS: 0.5,
      JUPITER: 0.08,
      SATURN: 0.03,
      URANUS: 0.01,
      NEPTUNE: 0.005,
      PLUTO: 0.002,
    };
    return speeds[planet] || 0.1;
  }

  private isRetrograde(planet: string, _dayOfYear: number): boolean {
    // Simplified logic - in production, use actual ephemeris
    return Math.random() > 0.85;
  }
}
