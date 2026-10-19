import { z } from "zod";
import type { McpToolDef } from "../registry.js";
import { getSwissEph } from "~/server/astro/swissEph";
import { computePlanetaryState } from "~/server/services/astroOntology";
import { aggregateLatentVector, getDominantLatentAxes } from "~/server/services/marketAstroService";
import {
  getSignOntology,
  getPlanetOntology,
  getHouseSceneOntology,
} from "~/server/services/astroOntology";

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
] as const;

function calculateWholeSignHouse(
  planetLongitude: number,
  ascendantLongitude: number,
): { house: number; sign: string; degree: number } {
  const normalizedPlanet = ((planetLongitude % 360) + 360) % 360;
  const normalizedAsc = ((ascendantLongitude % 360) + 360) % 360;
  const planetSignIndex = Math.floor(normalizedPlanet / 30);
  const ascSignIndex = Math.floor(normalizedAsc / 30);
  const houseNumber = ((planetSignIndex - ascSignIndex + 12) % 12) + 1;
  return {
    house: houseNumber,
    sign: SIGNS[planetSignIndex]!,
    degree: Math.floor(normalizedPlanet % 30),
  };
}

function detectAspects(
  planets: Array<{ planet: string; longitude: number; speed: number }>,
): Array<{
  planet1: string;
  planet2: string;
  aspectType: string;
  orbDistance: number;
  isApplying: boolean;
  exactnessScore: number;
}> {
  const aspects: Array<{
    planet1: string;
    planet2: string;
    aspectType: string;
    orbDistance: number;
    isApplying: boolean;
    exactnessScore: number;
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
      const p1 = planets[i]!;
      const p2 = planets[j]!;

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
          });
        }
      }
    }
  }

  return aspects;
}

const personalityVectorsInputSchema = {
  birthDateTime: z.coerce
    .date()
    .describe("Birth moment as an ISO 8601 timestamp, e.g. 1990-06-15T04:30:00Z"),
  latitude: z.number().min(-90).max(90).describe("Birth latitude, decimal degrees"),
  longitude: z.number().min(-180).max(180).describe("Birth longitude, decimal degrees"),
  coordinateSystem: z
    .enum(["SIDEREAL", "TROPICAL"])
    .optional()
    .describe("Zodiac system (default SIDEREAL / Lahiri)"),
};

export const computePersonalityVectorsTool: McpToolDef<
  typeof personalityVectorsInputSchema
> = {
  name: "compute_personality_vectors",
  description:
    "Compute the deep personality vectors (52-axis latent space) for a birth chart. Returns per-planet vectors (valence, arousal, agency, coherence, etc.), chart-level aggregate, dominant axes, and derived metrics (symbolicPressure, tensionLevel, integrationDifficulty, manifestationStrength). Use this to generate agent souls and personality profiles.",
  inputSchema: personalityVectorsInputSchema,
  handler: async ({ birthDateTime, latitude, longitude, coordinateSystem }) => {
    const swe = (await getSwissEph()) as any;
    const coordSystem = coordinateSystem ?? "SIDEREAL";

    const dateTime = new Date(birthDateTime);
    const year = dateTime.getUTCFullYear();
    const month = dateTime.getUTCMonth() + 1;
    const day = dateTime.getUTCDate();
    const hours =
      dateTime.getUTCHours() +
      dateTime.getUTCMinutes() / 60 +
      dateTime.getUTCSeconds() / 3600;

    const jd = swe.julday(year, month, day, hours, 1);
    const flags = coordSystem === "SIDEREAL" ? swe.SEFLG_SIDEREAL : swe.SEFLG_TROPIC;

    const housesResult = swe.houses_ex(jd, flags, latitude, longitude, "P");
    const ascendantLongitude = housesResult.ascmc?.[0] ?? 0;

    const planetsToCalc = [
      { id: swe.SE_SUN, name: "SUN" },
      { id: swe.SE_MOON, name: "MOON" },
      { id: swe.SE_MERCURY, name: "MERCURY" },
      { id: swe.SE_VENUS, name: "VENUS" },
      { id: swe.SE_MARS, name: "MARS" },
      { id: swe.SE_JUPITER, name: "JUPITER" },
      { id: swe.SE_SATURN, name: "SATURN" },
      { id: swe.SE_URANUS, name: "URANUS" },
      { id: swe.SE_NEPTUNE, name: "NEPTUNE" },
      { id: swe.SE_PLUTO, name: "PLUTO" },
      { id: swe.SE_MEAN_NODE, name: "MEAN_NODE" },
    ];

    const planets = planetsToCalc.map(({ id, name }) => {
      const res = swe.calc_ut(jd, id, flags);
      const houseInfo = calculateWholeSignHouse(res[0], ascendantLongitude);
      return {
        planet: name,
        longitude: res[0],
        latitude: res[1],
        speed: res[3],
        direction: res[3] < 0 ? "RETROGRADE" : "DIRECT",
        houseCusp: houseInfo.house,
        houseSign: houseInfo.sign,
        sign: houseInfo.sign,
        house: houseInfo.house,
      };
    });

    const aspects = detectAspects(planets);

    const perPlanetVectors = await Promise.all(
      planets.map(async (planetData) => {
        const activeAspects = aspects.filter(
          (a) =>
            a.planet1 === planetData.planet || a.planet2 === planetData.planet,
        );

        const computedState = await computePlanetaryState({
          planet: planetData.planet,
          sign: planetData.sign,
          house: planetData.house,
          natalLongitude: planetData.longitude,
          currentLongitude: planetData.longitude,
          movementDegrees: 0,
          intensity: 1.0,
          activeAspects: activeAspects.map((a) => ({
            aspectType: a.aspectType,
            orb: a.orbDistance,
          })),
        });

        return {
          planet: planetData.planet,
          sign: planetData.sign,
          house: planetData.house,
          direction: planetData.direction,
          astroState: computedState.astroState,
          cognitionState: computedState.cognitionState,
          vectorState: computedState.vectorState,
          symbolicState: computedState.symbolicState,
        };
      }),
    );

    const aggregateVector = aggregateLatentVector(
      perPlanetVectors.map((pv) => ({
        planet: pv.planet,
        natalLongitude: pv.astroState.natalLongitude,
        currentLongitude: pv.astroState.currentLongitude,
        movementDegrees: pv.astroState.movementDegrees,
        intensity: pv.astroState.intensity,
        activeAspects: pv.astroState.activeAspects.map((a) => ({
          aspectType: a,
          orb: 0,
        })),
        vectorState: pv.vectorState,
        cognitionState: pv.cognitionState,
        symbolicState: pv.symbolicState,
      })),
    );

    const dominantAxes = getDominantLatentAxes(
      perPlanetVectors.map((pv) => ({
        planet: pv.planet,
        natalLongitude: pv.astroState.natalLongitude,
        currentLongitude: pv.astroState.currentLongitude,
        movementDegrees: pv.astroState.movementDegrees,
        intensity: pv.astroState.intensity,
        activeAspects: pv.astroState.activeAspects.map((a) => ({
          aspectType: a,
          orb: 0,
        })),
        vectorState: pv.vectorState,
        cognitionState: pv.cognitionState,
        symbolicState: pv.symbolicState,
      })),
    );

    const derivedMetrics = {
      symbolicPressure:
        perPlanetVectors.reduce(
          (sum, pv) => sum + (pv.vectorState.symbolicPressure ?? 0),
          0,
        ) / perPlanetVectors.length,
      tensionLevel:
        perPlanetVectors.reduce(
          (sum, pv) => sum + (pv.vectorState.tensionLevel ?? 0),
          0,
        ) / perPlanetVectors.length,
      integrationDifficulty:
        perPlanetVectors.reduce(
          (sum, pv) => sum + (pv.vectorState.integrationDifficulty ?? 0),
          0,
        ) / perPlanetVectors.length,
      manifestationStrength:
        perPlanetVectors.reduce(
          (sum, pv) => sum + (pv.vectorState.manifestationStrength ?? 0),
          0,
        ) / perPlanetVectors.length,
    };

    const AXIS_LABELS: Record<string, string> = {
      valence: "emotional tone",
      arousal: "activation energy",
      agency: "action orientation",
      dominance: "assertiveness",
      coherence: "systematic thinking",
      stability: "emotional grounding",
      novelty: "openness to new experience",
      volatility: "emotional flux",
      abstraction: "conceptual thinking",
      symbolic_density: "symbolic richness",
      pattern_recognition: "pattern sensitivity",
      analyticity: "analytical mode",
      intuition: "intuitive perception",
      mental_speed: "cognitive tempo",
      focus: "attention concentration",
      diffusion: "awareness spread",
      past_orientation: "retrospective pull",
      present_orientation: "immediacy",
      future_orientation: "forward-looking",
      cyclicality: "rhythmic awareness",
      urgency: "time pressure",
      patience: "endurance",
      desire_intensity: "drive strength",
      attachment: "bonding tendency",
      avoidance: "withdrawal pattern",
      expansion: "growth impulse",
      contraction: "consolidation impulse",
      ambition: "achievement drive",
      survival_drive: "self-preservation",
      sociality: "social engagement",
      individuality: "autonomy",
      collectivism: "group orientation",
      relational_depth: "bonding depth",
      boundary_strength: "ego boundaries",
      empathy: "resonance capacity",
      dominance_social: "social authority",
      materiality: "material focus",
      spirituality: "transcendence orientation",
      sensory_density: "sensory engagement",
      idealism: "vision orientation",
      pragmatism: "practical grounding",
      integration: "wholeness",
      fragmentation: "dispersion",
      entropy: "dissolution tendency",
      adaptability: "flexibility",
      rigidity: "structure attachment",
      expressiveness: "outward flow",
      repression: "inward containment",
      reactivity: "impulse speed",
      responsiveness: "reception openness",
      meaning_orientation: "purpose seeking",
      identity_coherence: "self-continuity",
      transcendence: "beyond-self orientation",
      ego_density: "self-reference weight",
    };

    const axisKeys = [
      "valence", "arousal", "agency", "dominance", "coherence", "stability",
      "novelty", "volatility", "abstraction", "symbolic_density",
      "pattern_recognition", "analyticity", "intuition", "mental_speed",
      "focus", "diffusion", "past_orientation", "present_orientation",
      "future_orientation", "cyclicality", "urgency", "patience",
      "desire_intensity", "attachment", "avoidance", "expansion",
      "contraction", "ambition", "survival_drive", "sociality",
      "individuality", "collectivism", "relational_depth", "boundary_strength",
      "empathy", "dominance_social", "materiality", "spirituality",
      "sensory_density", "idealism", "pragmatism", "integration",
      "fragmentation", "entropy", "adaptability", "rigidity", "expressiveness",
      "repression", "reactivity", "responsiveness", "meaning_orientation",
      "identity_coherence", "transcendence", "ego_density",
    ];

    const aggregateObject: Record<string, number> = {};
    for (let i = 0; i < axisKeys.length; i++) {
      aggregateObject[axisKeys[i]!] = aggregateVector[i] ?? 0;
    }

    return {
      birthDateTime: dateTime.toISOString(),
      coordinateSystem: coordSystem,
      latitude,
      longitude,
      aggregate: aggregateObject,
      dominantAxes: dominantAxes.map((d) => ({
        axis: d.axis,
        value: d.value,
        label: AXIS_LABELS[d.axis] ?? d.axis,
      })),
      derivedMetrics: {
        symbolicPressure: Number(derivedMetrics.symbolicPressure.toFixed(4)),
        tensionLevel: Number(derivedMetrics.tensionLevel.toFixed(4)),
        integrationDifficulty: Number(derivedMetrics.integrationDifficulty.toFixed(4)),
        manifestationStrength: Number(derivedMetrics.manifestationStrength.toFixed(4)),
      },
      perPlanet: perPlanetVectors.map((pv) => ({
        planet: pv.planet,
        sign: pv.sign,
        house: pv.house,
        direction: pv.direction,
        latentVector: pv.vectorState.latentVector,
        derivedMetrics: {
          symbolicPressure: pv.vectorState.symbolicPressure,
          tensionLevel: pv.vectorState.tensionLevel,
          integrationDifficulty: pv.vectorState.integrationDifficulty,
          manifestationStrength: pv.vectorState.manifestationStrength,
        },
        cognitionState: pv.cognitionState,
        symbolicState: pv.symbolicState,
      })),
    };
  },
};
