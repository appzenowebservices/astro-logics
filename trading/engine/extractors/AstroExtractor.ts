import type { AstroState } from "../types";

interface PlanetInput {
  planet: string;
  longitude: number;
  degree: number;
  sign: string;
  speed: number;
  isRetrograde: boolean;
}

interface AstroChartInput {
  planets: PlanetInput[];
  ascendant: { longitude: number; degree: number; sign: string };
}

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

export class AstroExtractor {
  extract(chart: AstroChartInput | null): AstroState {
    if (!chart || !chart.planets || chart.planets.length === 0) {
      return {
        planetaryPressure: 0,
        aspectTension: 0,
        ingressProximity: 0,
        retrogradeInfluence: 0,
        speedDispersion: 0,
        elementalImbalance: 0,
        lunarPhase: 0,
        confidence: 0,
      };
    }

    const { planets } = chart;

    // ====================================================
    // PLANETARY PRESSURE
    // ====================================================
    // Fast planets (Moon, Mercury, Venus) moving fast + hard aspects = pressure.
    // Normalize by aggregating absolute speeds of inner planets.
    const innerPlanets = ["MOON", "MERCURY", "VENUS", "MARS"];
    const outerPlanets = ["JUPITER", "SATURN", "URANUS", "NEPTUNE", "PLUTO"];

    let innerSpeedSum = 0;
    let innerCount = 0;
    for (const p of planets) {
      if (innerPlanets.includes(p.planet)) {
        innerSpeedSum += Math.abs(p.speed);
        innerCount++;
      }
    }
    const avgInnerSpeed = innerCount > 0 ? innerSpeedSum / innerCount : 0;
    // Moon max speed ~14 deg/day, Mercury ~2, Venus ~1.5
    // Normalize so that Moon-dominated speeds give ~0.8+
    const planetaryPressure = Math.min(1, avgInnerSpeed / 8);

    // ====================================================
    // ASPECT TENSION
    // ====================================================
    let tensionSum = 0;
    let aspectCount = 0;
    for (let i = 0; i < planets.length; i++) {
      for (let j = i + 1; j < planets.length; j++) {
        const a = planets[i];
        const b = planets[j];
        let diff = Math.abs(a.longitude - b.longitude);
        if (diff > 180) diff = 360 - diff;

        // Hard aspects: conjunction (0-8°), square (80-100°), opposition (170-190°)
        let tension = 0;
        if (diff < 8)
          tension = 1 - diff / 8; // conjunction
        else if (diff >= 80 && diff <= 100)
          tension = 1 - Math.abs(diff - 90) / 10; // square
        else if (diff >= 170 && diff <= 190)
          tension = 1 - Math.abs(diff - 180) / 10; // opposition

        // Weight by speed (moving planets = more relevant)
        const speedWeight = (Math.abs(a.speed) + Math.abs(b.speed)) / 2;
        const normalizedWeight = Math.min(1, speedWeight / 2);

        tensionSum += tension * normalizedWeight;
        aspectCount++;
      }
    }
    const aspectTension =
      aspectCount > 0 ? Math.min(1, tensionSum / aspectCount) : 0;

    // ====================================================
    // INGRESS PROXIMITY
    // ====================================================
    let minIngressDistance = 30;
    for (const p of planets) {
      // Distance to next sign boundary
      const distToNext = 30 - p.degree;
      // Distance to previous sign boundary
      const distToPrev = p.degree;
      const closest = Math.min(distToNext, distToPrev);
      if (closest < minIngressDistance) {
        minIngressDistance = closest;
      }
    }
    // Within 3 degrees of a sign change = high ingress proximity
    const ingressProximity = Math.min(1, (3 - minIngressDistance) / 3);

    // ====================================================
    // RETROGRADE INFLUENCE
    // ====================================================
    const retroCount = planets.filter((p) => p.isRetrograde).length;
    const retrogradeInfluence = retroCount / planets.length;

    // ====================================================
    // SPEED DISPERSION
    // ====================================================
    const speeds = planets.map((p) => Math.abs(p.speed));
    const meanSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
    const variance =
      speeds.reduce((acc, s) => acc + (s - meanSpeed) ** 2, 0) / speeds.length;
    const stdDev = Math.sqrt(variance);
    // Normalize: typical std dev for mixed inner/outer planets ~3-5
    const speedDispersion = Math.min(1, stdDev / 5);

    // ====================================================
    // ELEMENTAL IMBALANCE
    // ====================================================
    const elementCounts: Record<string, number> = {
      FIRE: 0,
      EARTH: 0,
      AIR: 0,
      WATER: 0,
    };
    for (const p of planets) {
      const element = ELEMENTS[p.sign];
      if (element) elementCounts[element]++;
    }
    const total = planets.length || 1;
    const maxElement = Math.max(...Object.values(elementCounts));
    const minElement = Math.min(...Object.values(elementCounts));
    const elementalImbalance =
      total > 0 ? (maxElement - minElement) / total : 0;

    // ====================================================
    // LUNAR PHASE
    // ====================================================
    const moon = planets.find((p) => p.planet === "MOON");
    const sun = planets.find((p) => p.planet === "SUN");
    let lunarPhase = 0;
    if (moon && sun) {
      let moonSunAngle = Math.abs(moon.longitude - sun.longitude);
      if (moonSunAngle > 180) moonSunAngle = 360 - moonSunAngle;
      lunarPhase = moonSunAngle / 180; // 0 = new moon, 1 = full moon
    }

    // ====================================================
    // CONFIDENCE
    // ====================================================
    const hasMoon = !!moon;
    const hasSun = !!sun;
    const confidence =
      hasMoon && hasSun ? 0.9 : planets.length >= 5 ? 0.7 : 0.4;

    return {
      planetaryPressure,
      aspectTension,
      ingressProximity,
      retrogradeInfluence,
      speedDispersion,
      elementalImbalance,
      lunarPhase,
      confidence,
    };
  }
}
