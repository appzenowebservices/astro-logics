import { promises as fs } from "fs";
import path from "path";

const ASTRO_DATA_ROOT = path.join(process.cwd(), "astro-data");

const dedupe = <T>(items: Array<T | null | undefined>): T[] =>
  Array.from(
    new Set(
      items.filter((item): item is T => item !== null && item !== undefined),
    ),
  );

const cache = new Map<string, any>();

const loadAstroData = async <T = any>(
  relativePath: string,
): Promise<T | null> => {
  if (cache.has(relativePath)) {
    return cache.get(relativePath) as T;
  }
  try {
    const fullPath = path.join(ASTRO_DATA_ROOT, relativePath);
    const file = await fs.readFile(fullPath, "utf-8");
    const data = JSON.parse(file) as T;
    cache.set(relativePath, data);
    return data;
  } catch {
    return null;
  }
};

export const getSignOntology = async (sign: string) => {
  const normalized = sign.trim().toLowerCase();
  return await loadAstroData<Record<string, any>>(`signs/${normalized}.json`);
};

export const getHouseSceneOntology = async (house: number) => {
  if (house < 1 || house > 12) {
    house = 1;
  }

  return (
    (await loadAstroData<Record<string, any>>(`houses/HOUSE_${house}.json`)) ||
    (await loadAstroData<Record<string, any>>("houses/HOUSE_1.json")) ||
    null
  );
};

export const getPlanetOntology = async (planet: string) => {
  const normalized = planet.trim().toLowerCase();
  return await loadAstroData<Record<string, any>>(`planets/${normalized}.json`);
};

export interface PlanetaryComputedState {
  astroState: {
    planet: string;
    sign: string;
    house: number;
    natalLongitude: number;
    currentLongitude: number;
    movementDegrees: number;
    intensity: number;
    activeAspects: string[];
  };

  cognitionState: {
    agency: number;
    stability: number;
    abstraction: number;
    emotionality: number;
    novelty: number;
    coherence: number;
    sociality: number;
    futureOrientation: number;
  };

  vectorState: {
    latentVector: number[];

    symbolicPressure: number;

    tensionLevel: number;

    integrationDifficulty: number;

    manifestationStrength: number;

    [axis: string]: number | number[];
  };

  symbolicState: {
    archetypes: string[];

    dominantDrive: string;

    shadowExpression: string;

    behavioralExpression: string[];
  };

  narrativeState: {
    storyFunction: string;

    environmentalArena: string[];

    cinematicExpressions: string[];

    sceneHooks: string[];
  };
}

export const computePlanetaryState = async (options: {
  planet: string;
  sign: string;
  house: number;
  natalLongitude: number;
  currentLongitude: number;
  movementDegrees: number;
  intensity: number;
  planetProfile?: Record<string, any> | null;
  activeAspects: Array<{ aspectType: string }>;
}): Promise<PlanetaryComputedState> => {
  // =========================================================
  // LOAD ONTOLOGIES
  // =========================================================

  const planetData = await getPlanetOntology(options.planet);

  const signData = await getSignOntology(options.sign);

  const houseData = await getHouseSceneOntology(options.house);

  // =========================================================
  // ACTIVE ASPECTS
  // =========================================================

  const activeAspectTypes = options.activeAspects
    .map((a) => (a.aspectType || "").toUpperCase().trim())
    .filter(Boolean);

  // =========================================================
  // UNIVERSAL AXES
  // =========================================================

  const UNIVERSAL_AXES = [
    "valence",
    "arousal",
    "agency",
    "dominance",
    "coherence",
    "stability",
    "novelty",
    "volatility",

    "abstraction",
    "symbolic_density",
    "pattern_recognition",
    "analyticity",
    "intuition",
    "mental_speed",
    "focus",
    "diffusion",

    "past_orientation",
    "present_orientation",
    "future_orientation",
    "cyclicality",
    "urgency",
    "patience",

    "desire_intensity",
    "attachment",
    "avoidance",
    "expansion",
    "contraction",
    "ambition",
    "survival_drive",

    "sociality",
    "individuality",
    "collectivism",
    "relational_depth",
    "boundary_strength",
    "empathy",
    "dominance_social",

    "materiality",
    "spirituality",
    "sensory_density",
    "idealism",
    "pragmatism",

    "integration",
    "fragmentation",
    "entropy",
    "adaptability",
    "rigidity",

    "expressiveness",
    "repression",
    "reactivity",
    "responsiveness",

    "meaning_orientation",
    "identity_coherence",
    "transcendence",
    "ego_density",
  ];

  // =========================================================
  // LATENT ACCESSORS
  // =========================================================

  const getPlanetAxis = (axis: string) => planetData?.latentVector?.[axis] ?? 0;

  const getSignModifier = (axis: string) => signData?.latentVector?.[axis] ?? 0;

  const getHouseModifier = (axis: string) =>
    houseData?.latentVector?.[axis] ?? 0;

  // =========================================================
  // SOFT NORMALIZATION
  // =========================================================
  //
  // Prevents saturation collapse.
  // Keeps semantic gradients alive.
  //
  // Old:
  // clamp(-1, 1)
  //
  // New:
  // smooth bounded compression
  //
  // =========================================================

  const softNormalize = (v: number) => {
    const normalized = v / (1 + Math.abs(v));

    return Number(normalized.toFixed(4));
  };

  // =========================================================
  // BASE VECTOR SYNTHESIS
  // =========================================================

  const latentVector: Record<string, number> = {};

  for (const axis of UNIVERSAL_AXES) {
    const planetValue = getPlanetAxis(axis);

    const signValue = getSignModifier(axis);

    const houseValue = getHouseModifier(axis);

    // =====================================================
    // PLANET CORE
    // =====================================================

    const baseIdentity = planetValue;

    // =====================================================
    // SIGN MODULATION
    // =====================================================

    const signInfluence = 1 + signValue * 0.35;

    // =====================================================
    // HOUSE PROJECTION
    // =====================================================

    const houseInfluence = 1 + houseValue * 0.25;

    // =====================================================
    // SYNTHESIS
    // =====================================================

    const synthesized = baseIdentity * signInfluence * houseInfluence;

    latentVector[axis] = softNormalize(synthesized);
  }

  // =========================================================
  // ASPECT DISTORTION FIELD
  // =========================================================

  for (const aspect of activeAspectTypes) {
    switch (aspect) {
      case "SQUARE":
        latentVector.coherence *= 0.72;
        latentVector.stability *= 0.81;

        latentVector.agency *= 1.12;

        latentVector.reactivity *= 1.18;
        latentVector.fragmentation *= 1.16;
        latentVector.volatility *= 1.14;

        break;

      case "OPPOSITION":
        latentVector.coherence *= 0.68;

        latentVector.relational_depth *= 1.18;

        latentVector.fragmentation *= 1.18;

        latentVector.intuition *= 1.06;

        latentVector.identity_coherence *= 0.82;

        break;

      case "TRINE":
        latentVector.coherence *= 1.14;
        latentVector.stability *= 1.12;

        latentVector.integration *= 1.16;

        latentVector.responsiveness *= 1.08;

        break;

      case "SEXTILE":
        latentVector.novelty *= 1.08;

        latentVector.sociality *= 1.06;

        latentVector.adaptability *= 1.12;

        latentVector.pattern_recognition *= 1.08;

        break;

      case "CONJUNCTION":
        latentVector.agency *= 1.12;

        latentVector.desire_intensity *= 1.12;

        latentVector.focus *= 1.1;

        latentVector.ego_density *= 1.06;

        break;

      case "QUINCUNX":
        latentVector.coherence *= 0.82;

        latentVector.diffusion *= 1.14;

        latentVector.adaptability *= 1.08;

        break;

      default:
        break;
    }
  }

  // =========================================================
  // FINAL SOFT NORMALIZATION
  // =========================================================

  for (const axis of Object.keys(latentVector)) {
    latentVector[axis] = softNormalize(latentVector[axis]);
  }

  // =========================================================
  // PLANETARY IDENTITY ANCHOR
  // =========================================================
  //
  // Prevents semantic drift.
  //
  // Keeps:
  // Mercury -> Mercury-like
  // Saturn -> Saturn-like
  //
  // even after many transformations.
  //
  // =========================================================

  for (const axis of UNIVERSAL_AXES) {
    const corePlanetValue = getPlanetAxis(axis);

    const transformedValue = latentVector[axis] ?? 0;

    latentVector[axis] = softNormalize(
      transformedValue * 0.72 + corePlanetValue * 0.28,
    );
  }

  // =========================================================
  // COGNITION STATE
  // =========================================================

  const cognitionState = {
    agency: latentVector.agency,

    stability: latentVector.stability,

    abstraction: latentVector.abstraction,

    novelty: latentVector.novelty,

    coherence: latentVector.coherence,

    sociality: latentVector.sociality,

    futureOrientation: latentVector.future_orientation,
  };

  // =========================================================
  // DERIVED METRICS
  // =========================================================

  const symbolicPressure = softNormalize(
    Math.abs((latentVector.coherence ?? 0) - (latentVector.novelty ?? 0)),
  );

  const tensionLevel = softNormalize(
    (activeAspectTypes.includes("SQUARE") ? 0.8 : 0.2) +
      (activeAspectTypes.includes("OPPOSITION") ? 0.5 : 0) +
      (activeAspectTypes.includes("QUINCUNX") ? 0.35 : 0),
  );

  const integrationDifficulty = softNormalize(
    1 - (latentVector.integration ?? 0),
  );

  const manifestationStrength = softNormalize(
    (latentVector.agency ?? 0) * (latentVector.coherence ?? 0),
  );

  // =========================================================
  // ARCHETYPAL SYNTHESIS
  // =========================================================

  const archetypes = dedupe([
    ...(planetData?.coreEssence?.archetypes || []),

    ...(signData?.coreEssence?.archetypes || []),

    ...(houseData?.archetypes || []),
  ]).slice(0, 12);

  // =========================================================
  // SYMBOLIC STATE
  // =========================================================

  const symbolicState = {
    archetypes,

    dominantDrive:
      planetData?.motivationalStructure?.coreNeeds?.[0] || "self-expression",

    shadowExpression: signData?.shadowPatterns?.[0] || "internal contradiction",

    behavioralExpression: dedupe([
      ...(signData?.behavioralMicroPatterns || []),

      ...(houseData?.behavioralDynamics || []),
    ]).slice(0, 12),
  };

  // =========================================================
  // FINAL RETURN
  // =========================================================

  return {
    astroState: {
      planet: options.planet,

      sign: options.sign,

      house: options.house,

      natalLongitude: options.natalLongitude,

      currentLongitude: options.currentLongitude,

      movementDegrees: options.movementDegrees,

      intensity: options.intensity,

      activeAspects: activeAspectTypes,
    },

    cognitionState,

    vectorState: {
      ...latentVector,

      latentVector: UNIVERSAL_AXES.map((axis) => latentVector[axis] ?? 0),

      symbolicPressure,

      tensionLevel,

      integrationDifficulty,

      manifestationStrength,
    },

    symbolicState,
  };
};
