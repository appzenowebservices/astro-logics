import { z } from "zod";
import type { McpToolDef } from "../registry.js";
import { getSwissEph } from "~/server/astro/swissEph";
import { getPlanetOntology } from "~/server/services/astroOntology";

// ============================================================================
// PURE HELPERS - copied from src/server/api/routers/helpers.ts (createChart
// uses them identically). That module cannot be imported directly because it
// imports `~/server/db`, which is commented out in this repo. Keep in sync
// with helpers.ts when the app's calculation rules change.
// ============================================================================

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

// Source: helpers.ts calculatePlanetaryDignity
function calculatePlanetaryDignity(
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

// Source: helpers.ts detectAspects
function detectAspects(
  planets: PlanetDataType[],
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
            orbStrength: 1 - angleDiff / orb,
            speedWeighting: Math.abs(p1.speed - p2.speed),
          });
        }
      }
    }
  }

  return aspects;
}

// Source: helpers.ts calculateWholeSignHouse
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

// ============================================================================
// NATAL CHART COMPUTATION - mirrors createChart in
// src/server/api/routers/nativity.ts (minus persistence and the deep
// symbolic-pipeline vectors, which are not needed for readings).
// ============================================================================

export async function computeNatalChart(input: {
  birthDateTime: Date;
  latitude: number;
  longitude: number;
  coordinateSystem: "SIDEREAL" | "TROPICAL";
}) {
  const swe = (await getSwissEph()) as any;

  const dateTime = new Date(input.birthDateTime);
  const birthTimestamp = dateTime.getTime();

  const year = dateTime.getUTCFullYear();
  const month = dateTime.getUTCMonth() + 1;
  const day = dateTime.getUTCDate();
  const hours =
    dateTime.getUTCHours() +
    dateTime.getUTCMinutes() / 60 +
    dateTime.getUTCSeconds() / 3600;

  const jd = swe.julday(year, month, day, hours, 1);

  const flags =
    input.coordinateSystem === "SIDEREAL"
      ? swe.SEFLG_SIDEREAL
      : swe.SEFLG_TROPIC;

  const housesResult = swe.houses_ex(
    jd,
    flags,
    input.latitude,
    input.longitude,
    "P",
  );
  const ascendantLongitude = housesResult.ascmc?.[0] ?? 0;
  const houses = housesResult.houses ?? [];

  const planetsToCalc = [
    swe.SE_SUN,
    swe.SE_MOON,
    swe.SE_MERCURY,
    swe.SE_VENUS,
    swe.SE_MARS,
    swe.SE_JUPITER,
    swe.SE_SATURN,
    swe.SE_URANUS,
    swe.SE_NEPTUNE,
    swe.SE_PLUTO,
    swe.SE_MEAN_NODE,
  ];
  const planetNames = [
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
  ];

  const planets = planetsToCalc.map((planetId, idx) => {
    const res = swe.calc_ut(jd, planetId, flags);
    const houseInfo = calculateWholeSignHouse(res[0], ascendantLongitude);
    return {
      planet: planetNames[idx]!,
      longitude: res[0],
      latitude: res[1],
      speed: res[3],
      acceleration: res[5],
      direction: res[3] < 0 ? "RETROGRADE" : "DIRECT",
      houseCusp: houseInfo.house,
      houseDegree: houseInfo.degree,
      houseSign: houseInfo.sign,
    };
  });

  const angularDistances = planets
    .slice(0, -1)
    .flatMap((p1, i) =>
      planets.slice(i + 1).map((p2) => {
        let distance = Math.abs(p1.longitude - p2.longitude);
        if (distance > 180) distance = 360 - distance;
        return {
          planet1: p1.planet,
          planet2: p2.planet,
          distance,
          speedWeighting: Math.abs((p1.speed || 0) - (p2.speed || 0)),
        };
      }),
    );

  const aspects = detectAspects(planets);

  const planetaryProfiles = await Promise.all(
    planets.map(async (planetData) => {
      const planetOntology = await getPlanetOntology(planetData.planet);
      const expressionDomains: string[] =
        (planetOntology?.coreEssence as { expressionDomains?: string[] } | undefined)
          ?.expressionDomains ?? [];

      const activeAspects = aspects.filter(
        (a) =>
          a.planet1 === planetData.planet || a.planet2 === planetData.planet,
      );

      const dignity = calculatePlanetaryDignity(
        planetData.planet,
        planetData.houseSign || "ARIES",
        planetData.houseCusp || 1,
      );

      return {
        planet: planetData.planet,
        longitude: planetData.longitude,
        latitude: planetData.latitude,
        speed: planetData.speed,
        acceleration: planetData.acceleration,
        direction: planetData.direction,
        houseCusp: planetData.houseCusp,
        houseDegree: planetData.houseDegree,
        houseSign: planetData.houseSign,
        dignity: dignity.dignityType,
        strength: dignity.strength,
        primaryDomain: expressionDomains[0] ?? "",
        secondaryDomain: expressionDomains[1] ?? null,
        activeAspectCount: activeAspects.length,
      };
    }),
  );

  return {
    birthDateTime: dateTime.toISOString(),
    birthTimestamp,
    julianDay: jd,
    coordinateSystem: input.coordinateSystem,
    latitude: input.latitude,
    longitude: input.longitude,
    ascendant: ascendantLongitude,
    houses: houses.map((cusp: number, idx: number) => ({ house: idx + 1, cusp })),
    planets,
    angularDistances,
    aspects,
    planetaryProfiles,
  };
}

const natalChartInputSchema = {
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

export const computeNatalChartTool: McpToolDef<typeof natalChartInputSchema> = {
  name: "compute_natal_chart",
  description:
    "Compute a natal chart (sidereal Lahiri by default): planet positions, houses, aspects, dignity and planetary profiles for a birth moment and location.",
  inputSchema: natalChartInputSchema,
  handler: async ({ birthDateTime, latitude, longitude, coordinateSystem }) =>
    computeNatalChart({
      birthDateTime,
      latitude,
      longitude,
      coordinateSystem: coordinateSystem ?? "SIDEREAL",
    }),
};
