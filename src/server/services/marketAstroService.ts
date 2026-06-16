import prisma from "../../../prisma-client/client";
import { getSwissEph } from "~/server/astro/swissEph";
import {
  computePlanetaryState,
  type PlanetaryComputedState,
} from "./astroOntology";
import { TransitCalculator } from "./transitCalculator";

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

const ELEMENTS: Record<string, string> = {
  ARIES: "FIRE",
  LEO: "FIRE",
  SAGITTARIUS: "FIRE",
  TAURUS: "EARTH",
  VIRGO: "EARTH",
  CAPRICORN: "EARTH",
  GEMINI: "AIR",
  LIBRA: "AIR",
  AQUARIUS: "AIR",
  CANCER: "WATER",
  SCORPIO: "WATER",
  PISCES: "WATER",
};

const PLANET_IDS = [
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
] as const;

export type MarketAssetProfileInput = {
  symbol: string;
  label?: string;
  category?: string;
  exchange?: string;
  birthDateTime?: Date;
  timezone?: string;
  latitude?: number;
  longitude?: number;
  locationName?: string;
  coordinateSystem?: "SIDEREAL" | "TROPICAL";
};

export type NatalPlanet = {
  planet: string;
  longitude: number;
  latitude: number;
  speed: number;
  direction: "RETROGRADE" | "DIRECT";
  houseCusp: number;
  houseDegree: number;
  houseSign: string;
};

export type ActiveAspect = {
  aspectType: string;
  orb: number;
};

export type PlanetaryAstroState = {
  planet: string;
  natalLongitude: number;
  currentLongitude: number;
  movementDegrees: number;
  intensity: number;
  activeAspects: ActiveAspect[];
  vectorState: PlanetaryComputedState["vectorState"];
  cognitionState: PlanetaryComputedState["cognitionState"];
  symbolicState: PlanetaryComputedState["symbolicState"];
};

export type MarketAstroState = {
  planetaryPressure: number;
  aspectTension: number;
  ingressProximity: number;
  retrogradeInfluence: number;
  speedDispersion: number;
  elementalImbalance: number;
  lunarPhase: number;
  confidence: number;
  assetNatal: {
    symbol: string;
    birthDateTime: string;
    locationName: string;
    timezone: string;
  };
  dominantLatentAxes: Array<{ axis: string; value: number }>;
  dominantTransitPlanets: string[];
  latentVector: number[];
  narrative: string;
};

export type AssetTransitAstroState = {
  profileId: string;
  symbol: string;
  timestamp: number;
  date: string;
  natalPlanets: NatalPlanet[];
  transitPlanets: Array<{
    planet: string;
    longitude: number;
    speed: number;
    isRetrograde: boolean;
    sign: string;
    degree: number;
  }>;
  planetaryStates: PlanetaryAstroState[];
  latentVector: number[];
  astroState: MarketAstroState;
};

export type AssetSessionAstroBrief = {
  symbol: string;
  timeframe?: string;
  from: string;
  to: string;
  profile: {
    id: string;
    symbol: string;
    label: string | null;
    category: string | null;
    exchange: string | null;
    birthDateTime: string;
    locationName: string;
    timezone: string;
  };
  current: AssetTransitAstroState;
  evolution: AssetTransitAstroState[];
  preparedBecause: string[];
  summary: string;
  logs: string[];
};

type DefaultAssetConfig = {
  label: string;
  category: string;
  exchange: string;
  birthDateTime: Date;
  timezone: string;
  latitude: number;
  longitude: number;
  locationName: string;
};

const DEFAULT_ASSETS: Record<string, DefaultAssetConfig> = {
  GBPUSD: {
    label: "GBP / USD",
    category: "Forex",
    exchange: "OTC/London",
    birthDateTime: new Date("1972-01-01T00:00:00.000Z"),
    timezone: "Europe/London",
    latitude: 51.5074,
    longitude: -0.1278,
    locationName: "London",
  },
  EURUSD: {
    label: "EUR / USD",
    category: "Forex",
    exchange: "OTC/London",
    birthDateTime: new Date("1999-01-01T00:00:00.000Z"),
    timezone: "Europe/London",
    latitude: 51.5074,
    longitude: -0.1278,
    locationName: "London",
  },
  BTCUSD: {
    label: "BTC / USD",
    category: "Crypto",
    exchange: "COINBASE",
    birthDateTime: new Date("2009-01-03T18:15:05.000Z"),
    timezone: "UTC",
    latitude: 0,
    longitude: 0,
    locationName: "UTC",
  },
};

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function normalizeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase();
}

function normalizeLongitude(longitude: number): number {
  return ((longitude % 360) + 360) % 360;
}

function getSignAtLongitude(longitude: number): string {
  const index = Math.floor(normalizeLongitude(longitude) / 30);
  return SIGNS[index] ?? "ARIES";
}

function getDegreeInSign(longitude: number): number {
  return normalizeLongitude(longitude) % 30;
}

function calculateLongitudeDifference(long1: number, long2: number): number {
  let diff = long2 - long1;
  while (diff > 180) diff -= 360;
  while (diff < -180) diff += 360;
  return diff;
}

function calculateWholeSignHouse(
  longitude: number,
  ascendantLongitude: number,
) {
  const signIndex = Math.floor(normalizeLongitude(longitude) / 30);
  const ascendantSignIndex = Math.floor(
    normalizeLongitude(ascendantLongitude) / 30,
  );
  const house = ((signIndex - ascendantSignIndex + 12) % 12) + 1;

  return {
    house,
    sign: SIGNS[signIndex] ?? "ARIES",
    degree: getDegreeInSign(longitude),
  };
}

function findActiveAspects(
  natalLongitude: number,
  transitLongitude: number,
): ActiveAspect[] {
  const aspectDefinitions = [
    { angle: 0, name: "CONJUNCTION", orb: 8 },
    { angle: 60, name: "SEXTILE", orb: 6 },
    { angle: 90, name: "SQUARE", orb: 8 },
    { angle: 120, name: "TRINE", orb: 8 },
    { angle: 150, name: "QUINCUNX", orb: 6 },
    { angle: 180, name: "OPPOSITION", orb: 8 },
  ];

  return aspectDefinitions
    .map((definition) => {
      const rawDiff = Math.abs(
        calculateLongitudeDifference(natalLongitude, transitLongitude) -
          definition.angle,
      );
      const orb = Math.min(rawDiff, 360 - rawDiff);

      return {
        aspectType: definition.name,
        orb,
        allowedOrb: definition.orb,
      };
    })
    .filter((aspect) => aspect.orb <= aspect.allowedOrb)
    .map(({ aspectType, orb }) => ({ aspectType, orb }));
}

function aspectWeight(aspectType: string): number {
  switch (aspectType) {
    case "OPPOSITION":
      return 1;
    case "SQUARE":
      return 0.9;
    case "CONJUNCTION":
      return 0.8;
    case "QUINCUNX":
      return 0.55;
    case "TRINE":
      return 0.35;
    case "SEXTILE":
      return 0.25;
    default:
      return 0;
  }
}

function mean(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getVectorNumber(
  state: PlanetaryComputedState["vectorState"],
  axis: string,
): number {
  const value = state[axis];
  return typeof value === "number" ? value : 0;
}

function standardDeviation(values: number[]): number {
  if (!values.length) return 0;
  const average = mean(values);
  const variance = mean(values.map((value) => (value - average) ** 2));
  return Math.sqrt(variance);
}

function getAssetConfig(symbol: string): DefaultAssetConfig {
  const normalized = normalizeSymbol(symbol);
  const fallback = DEFAULT_ASSETS.GBPUSD;
  const matched = DEFAULT_ASSETS[normalized];

  return (
    matched ?? {
      label: normalized,
      category: "Market",
      exchange: "UNKNOWN",
      birthDateTime: fallback.birthDateTime,
      timezone: fallback.timezone,
      latitude: fallback.latitude,
      longitude: fallback.longitude,
      locationName: fallback.locationName,
    }
  );
}

async function calculateAssetNatalPlanets(input: {
  symbol: string;
  birthDateTime: Date;
  timezone: string;
  latitude: number;
  longitude: number;
  coordinateSystem: "SIDEREAL" | "TROPICAL";
}): Promise<NatalPlanet[]> {
  const swe = (await getSwissEph()) as any;
  const date = new Date(input.birthDateTime);
  const jd = swe.julday(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
    date.getUTCHours() +
      date.getUTCMinutes() / 60 +
      date.getUTCSeconds() / 3600,
    1,
  );

  if (input.coordinateSystem === "SIDEREAL") {
    swe.set_sid_mode(swe.SE_SIDM_LAHIRI);
  }

  const flags =
    input.coordinateSystem === "SIDEREAL"
      ? swe.SEFLG_SIDEREAL | swe.SEFLG_SPEED
      : swe.SEFLG_SPEED;
  const housesResult = swe.houses_ex(
    jd,
    flags,
    input.latitude,
    input.longitude,
    "P",
  );
  const ascendantLongitude = housesResult.ascmc?.[0] ?? 0;

  return PLANET_IDS.map((planet) => {
    const planetId =
      planet === "MEAN_NODE" ? swe.SE_MEAN_NODE : swe[`SE_${planet}`];
    const res = swe.calc_ut(jd, planetId, flags);
    const longitude = normalizeLongitude(res[0]);
    const houseInfo = calculateWholeSignHouse(longitude, ascendantLongitude);

    return {
      planet,
      longitude,
      latitude: res[1] ?? 0,
      speed: res[3] ?? 0,
      direction: res[3] < 0 ? "RETROGRADE" : "DIRECT",
      houseCusp: houseInfo.house,
      houseDegree: houseInfo.degree,
      houseSign: houseInfo.sign,
    };
  });
}

async function computeNatalPlanetaryStates(
  natalPlanets: NatalPlanet[],
): Promise<PlanetaryAstroState[]> {
  return Promise.all(
    natalPlanets.map(async (planet) => {
      const activeAspects = natalPlanets
        .filter((candidate) => candidate.planet !== planet.planet)
        .flatMap((candidate) => {
          const aspects = findActiveAspects(
            planet.longitude,
            candidate.longitude,
          );
          return aspects.map((aspect) => ({
            aspectType: aspect.aspectType,
            orb: aspect.orb,
          }));
        });

      const intensity = Math.min(
        100,
        activeAspects.reduce(
          (sum, aspect) => sum + Math.max(0, 8 - aspect.orb) * 10,
          0,
        ),
      );

      const computedState = await computePlanetaryState({
        planet: planet.planet,
        sign: planet.houseSign,
        house: planet.houseCusp,
        natalLongitude: planet.longitude,
        currentLongitude: planet.longitude,
        movementDegrees: 0,
        intensity,
        activeAspects,
      });

      return {
        planet: planet.planet,
        natalLongitude: planet.longitude,
        currentLongitude: planet.longitude,
        movementDegrees: 0,
        intensity,
        activeAspects,
        vectorState: computedState.vectorState,
        cognitionState: computedState.cognitionState,
        symbolicState: computedState.symbolicState,
      };
    }),
  );
}

function aggregateLatentVector(
  planetaryStates: PlanetaryAstroState[],
): number[] {
  const axisKeys = Array.from(
    new Set(
      planetaryStates.flatMap((state) =>
        Object.keys(state.vectorState).filter((key) => key !== "latentVector"),
      ),
    ),
  ).sort();

  return axisKeys.map((axis) => {
    const values = planetaryStates.map((state) =>
      getVectorNumber(state.vectorState, axis),
    );

    return Number(mean(values).toFixed(4));
  });
}

function getDominantLatentAxes(
  planetaryStates: PlanetaryAstroState[],
): Array<{ axis: string; value: number }> {
  const axisKeys = Array.from(
    new Set(
      planetaryStates.flatMap((state) =>
        Object.keys(state.vectorState).filter((key) => key !== "latentVector"),
      ),
    ),
  );

  return axisKeys
    .map((axis) => {
      const values = planetaryStates.map((state) =>
        getVectorNumber(state.vectorState, axis),
      );

      return {
        axis,
        value: Number(mean(values).toFixed(4)),
      };
    })
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
    .slice(0, 6);
}

function getDominantTransitPlanets(
  planetaryStates: PlanetaryAstroState[],
): string[] {
  return planetaryStates
    .map((state) => ({
      planet: state.planet,
      score:
        state.intensity / 100 +
        Math.abs(state.vectorState.symbolicPressure ?? 0) * 0.25,
    }))
    .sort((a, b) => b.score - a.score)
    .map((item) => item.planet)
    .slice(0, 4);
}

function getIngressProximity(
  transitPlanets: AssetTransitAstroState["transitPlanets"],
): number {
  const proximities = transitPlanets.map((planet) => {
    const closestBoundary = Math.min(30 - planet.degree, planet.degree);
    return clamp01((3 - closestBoundary) / 3);
  });

  return Number(mean(proximities).toFixed(4));
}

function getElementalImbalance(
  transitPlanets: AssetTransitAstroState["transitPlanets"],
): number {
  const counts: Record<string, number> = {
    FIRE: 0,
    EARTH: 0,
    AIR: 0,
    WATER: 0,
  };

  for (const planet of transitPlanets) {
    const element = ELEMENTS[planet.sign] ?? "FIRE";
    counts[element] = (counts[element] ?? 0) + 1;
  }

  const values = Object.values(counts);
  const total = values.reduce((sum, value) => sum + value, 0) || 1;
  const max = Math.max(...values);
  const min = Math.min(...values);

  return Number(((max - min) / total).toFixed(4));
}

function getLunarPhase(
  transitPlanets: AssetTransitAstroState["transitPlanets"],
): number {
  const moon = transitPlanets.find((planet) => planet.planet === "MOON");
  const sun = transitPlanets.find((planet) => planet.planet === "SUN");

  if (!moon || !sun) return 0;

  let angle = Math.abs(moon.longitude - sun.longitude);
  if (angle > 180) angle = 360 - angle;

  return Number((1 - angle / 180).toFixed(4));
}

function buildAstroNarrative(
  symbol: string,
  planetaryStates: PlanetaryAstroState[],
  dominantAxes: Array<{ axis: string; value: number }>,
  dominantPlanets: string[],
): string {
  const axisText = dominantAxes
    .slice(0, 3)
    .map(
      (axis) =>
        `${axis.axis.replace(/_/g, " ")} ${axis.value > 0 ? "+" : ""}${axis.value.toFixed(2)}`,
    )
    .join(", ");

  const planetText = dominantPlanets.length
    ? dominantPlanets.join(" + ")
    : "no dominant planet";

  return `${symbol} transit field is being shaped by ${planetText}. Dominant latent axes: ${axisText || "balanced/low signal"}.`;
}

export async function getOrCreateMarketAssetProfile(
  input: MarketAssetProfileInput,
): Promise<ReturnType<typeof prisma.marketAssetProfile.findUnique>> {
  const symbol = normalizeSymbol(input.symbol);
  const config = getAssetConfig(symbol);
  const birthDateTime = input.birthDateTime ?? config.birthDateTime;
  const coordinateSystem = input.coordinateSystem ?? "SIDEREAL";

  const existing = await prisma.marketAssetProfile.findUnique({
    where: { symbol },
  });

  if (existing) return existing;

  const natalPlanets = await calculateAssetNatalPlanets({
    symbol,
    birthDateTime,
    timezone: input.timezone ?? config.timezone,
    latitude: input.latitude ?? config.latitude,
    longitude: input.longitude ?? config.longitude,
    coordinateSystem,
  });

  return prisma.marketAssetProfile.create({
    data: {
      symbol,
      label: input.label ?? config.label,
      category: input.category ?? config.category,
      exchange: input.exchange ?? config.exchange,
      birthDateTime,
      birthTimestamp: BigInt(birthDateTime.getTime()),
      timezone: input.timezone ?? config.timezone,
      latitude: input.latitude ?? config.latitude,
      longitude: input.longitude ?? config.longitude,
      locationName: input.locationName ?? config.locationName,
      coordinateSystem,
      natalPlanets,
    },
  });
}

export async function getMarketAssetProfiles() {
  return prisma.marketAssetProfile.findMany({
    orderBy: { symbol: "asc" },
  });
}

export async function getAssetTransitAstroState(
  profile: {
    id: string;
    symbol: string;
    birthDateTime: Date;
    timezone: string;
    latitude: number;
    longitude: number;
    locationName: string;
    coordinateSystem: string;
    natalPlanets: unknown;
  },
  timestamp: number,
): Promise<AssetTransitAstroState> {
  const natalPlanets =
    Array.isArray(profile.natalPlanets) && profile.natalPlanets.length
      ? (profile.natalPlanets as NatalPlanet[])
      : await calculateAssetNatalPlanets({
          symbol: profile.symbol,
          birthDateTime: profile.birthDateTime,
          timezone: profile.timezone,
          latitude: profile.latitude,
          longitude: profile.longitude,
          coordinateSystem:
            profile.coordinateSystem === "TROPICAL" ? "TROPICAL" : "SIDEREAL",
        });

  const transitCalc = new TransitCalculator();
  const date = new Date(timestamp);
  const transitSnapshot = await transitCalc.getTransitSnapshot(
    date,
    profile.latitude,
    profile.longitude,
  );
  const transitPlanets = transitSnapshot.planets.map((planet) => ({
    planet: planet.planet,
    longitude: normalizeLongitude(planet.longitude),
    speed: planet.speed,
    isRetrograde: planet.isRetrograde,
    sign: getSignAtLongitude(planet.longitude),
    degree: getDegreeInSign(planet.longitude),
  }));

  const planetaryStates = await Promise.all(
    natalPlanets.map(async (natalPlanet) => {
      const transitPlanet = transitPlanets.find(
        (planet) => planet.planet === natalPlanet.planet,
      );
      if (!transitPlanet) return null;

      const movementDegrees = calculateLongitudeDifference(
        natalPlanet.longitude,
        transitPlanet.longitude,
      );
      const activeAspects = findActiveAspects(
        natalPlanet.longitude,
        transitPlanet.longitude,
      );
      const intensity = Math.min(
        100,
        activeAspects.reduce(
          (sum, aspect) => sum + Math.max(0, 8 - aspect.orb) * 10,
          0,
        ),
      );

      const computedState = await computePlanetaryState({
        planet: natalPlanet.planet,
        sign: natalPlanet.houseSign,
        house: natalPlanet.houseCusp,
        natalLongitude: natalPlanet.longitude,
        currentLongitude: transitPlanet.longitude,
        movementDegrees,
        intensity,
        activeAspects,
      });

      return {
        planet: natalPlanet.planet,
        natalLongitude: natalPlanet.longitude,
        currentLongitude: transitPlanet.longitude,
        movementDegrees,
        intensity,
        activeAspects,
        vectorState: computedState.vectorState,
        cognitionState: computedState.cognitionState,
        symbolicState: computedState.symbolicState,
      };
    }),
  ).then((states) => states.filter(Boolean) as PlanetaryAstroState[]);

  const latentVector = aggregateLatentVector(planetaryStates);
  const dominantLatentAxes = getDominantLatentAxes(planetaryStates);
  const dominantTransitPlanets = getDominantTransitPlanets(planetaryStates);
  const aspectTension = clamp01(
    mean(
      planetaryStates.flatMap((state) =>
        state.activeAspects.map((aspect) => aspectWeight(aspect.aspectType)),
      ),
    ),
  );
  const ingressProximity = getIngressProximity(transitPlanets);
  const retrogradeInfluence = clamp01(
    transitPlanets.filter((planet) => planet.isRetrograde).length /
      transitPlanets.length,
  );
  const speedDispersion = clamp01(
    standardDeviation(transitPlanets.map((planet) => planet.speed)) / 5,
  );
  const elementalImbalance = getElementalImbalance(transitPlanets);
  const lunarPhase = getLunarPhase(transitPlanets);
  const planetaryPressure = clamp01(
    mean([
      Math.abs(
        mean(
          planetaryStates.map((state) =>
            getVectorNumber(state.vectorState, "valence"),
          ),
        ),
      ),
      mean(
        planetaryStates.map((state) =>
          getVectorNumber(state.vectorState, "arousal"),
        ),
      ),
      mean(
        planetaryStates.map((state) =>
          getVectorNumber(state.vectorState, "agency"),
        ),
      ),
      mean(
        planetaryStates.map((state) =>
          getVectorNumber(state.vectorState, "urgency"),
        ),
      ),
      mean(
        planetaryStates.map((state) =>
          getVectorNumber(state.vectorState, "symbolicPressure"),
        ),
      ),
    ]),
  );
  const avgIntensity =
    mean(planetaryStates.map((state) => state.intensity)) / 100;
  const confidence = clamp01(
    0.45 + aspectTension * 0.2 + avgIntensity * 0.25 + speedDispersion * 0.1,
  );
  const narrative = buildAstroNarrative(
    profile.symbol,
    planetaryStates,
    dominantLatentAxes,
    dominantTransitPlanets,
  );

  return {
    profileId: profile.id,
    symbol: profile.symbol,
    timestamp,
    date: date.toISOString(),
    natalPlanets,
    transitPlanets,
    planetaryStates,
    latentVector,
    astroState: {
      planetaryPressure,
      aspectTension,
      ingressProximity,
      retrogradeInfluence,
      speedDispersion,
      elementalImbalance,
      lunarPhase,
      confidence,
      assetNatal: {
        symbol: profile.symbol,
        birthDateTime: profile.birthDateTime.toISOString(),
        locationName: profile.locationName,
        timezone: profile.timezone,
      },
      dominantLatentAxes,
      dominantTransitPlanets,
      latentVector,
      narrative,
    },
  };
}

export async function getAssetSessionAstroBrief(input: {
  symbol: string;
  timeframe?: string;
  from?: Date;
  to?: Date;
  steps?: number;
}): Promise<AssetSessionAstroBrief> {
  const logs: string[] = [];
  logs.push(`[START] getAssetSessionAstroBrief for ${input.symbol}`);

  const profile = await getOrCreateMarketAssetProfile({ symbol: input.symbol });
  if (!profile) throw new Error("Market asset profile could not be created");
  logs.push(`[PROFILE] Found/created profile for ${profile.symbol}`);

  const to = input.to ?? new Date();
  const from = input.from ?? new Date(to.getTime() - 24 * 60 * 60 * 1000);
  const steps = clamp(input.steps ?? 8, 3, 12);
  const timestamps = Array.from({ length: steps }, (_, index) => {
    const progress = index / (steps - 1);
    return Math.round(
      from.getTime() + (to.getTime() - from.getTime()) * progress,
    );
  });
  logs.push(
    `[TIMESTAMPS] ${steps} steps from ${from.toISOString()} to ${to.toISOString()}`,
  );

  logs.push(
    `[SCAN] Starting parallel astro state computation for ${steps} timestamps`,
  );

  const evolution = await Promise.all(
    timestamps.map(async (timestamp, idx) => {
      logs.push(
        `[STEP ${idx}] Computing astro state for ${new Date(timestamp).toISOString()}`,
      );
      const result = await getAssetTransitAstroState(profile, timestamp);
      logs.push(
        `[STEP ${idx}] Completed - confidence: ${result.astroState.confidence.toFixed(3)}`,
      );
      return result;
    }),
  );
  logs.push(`[SCAN] All ${steps} steps completed`);

  const current = evolution[evolution.length - 1];
  const first = evolution[0];

  const preparedBecause = [
    `${current.symbol} is being read as an asset natal chart born at ${current.astroState.assetNatal.birthDateTime}.`,
    `Current transit field confidence is ${Math.round(current.astroState.confidence * 100)}%.`,
    `Dominant transit planets: ${current.astroState.dominantTransitPlanets.join(", ") || "none"}.`,
    `Dominant latent axes: ${current.astroState.dominantLatentAxes.map((axis) => axis.axis).join(", ")}.`,
    `Session drift from start to now: ${current.astroState.narrative}`,
  ];

  const firstPressure = first.astroState.planetaryPressure;
  const currentPressure = current.astroState.planetaryPressure;
  const pressureDelta = currentPressure - firstPressure;
  const summary =
    pressureDelta >= 0.12
      ? "Astro latent pressure is building through the selected session."
      : pressureDelta <= -0.12
        ? "Astro latent pressure is cooling through the selected session."
        : "Astro latent pressure is stable through the selected session.";
  logs.push(
    `[SUMMARY] pressureDelta=${pressureDelta.toFixed(3)} -> ${summary}`,
  );

  return {
    symbol: current.symbol,
    timeframe: input.timeframe,
    from: from.toISOString(),
    to: to.toISOString(),
    profile: {
      id: profile.id,
      symbol: profile.symbol,
      label: profile.label,
      category: profile.category,
      exchange: profile.exchange,
      birthDateTime: profile.birthDateTime.toISOString(),
      locationName: profile.locationName,
      timezone: profile.timezone,
    },
    current,
    evolution,
    preparedBecause,
    summary,
    logs,
  };
}
