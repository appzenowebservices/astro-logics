export type Planet =
  | "SUN"
  | "MOON"
  | "MERCURY"
  | "VENUS"
  | "MARS"
  | "JUPITER"
  | "SATURN"
  | "RAHU"
  | "KETU";

export interface PromptInput {
  planet: Planet;
  phase: string;
  aspect: string;
  colorPalette: string[];
  dominantMood: string;
  plotTwist: string;
  setting: string;
}

interface PlanetRegistryEntry {
  archetype: string;
  visualFocus: string;
  narrativeRole: string;
}

const STYLE_DIRECTIVE = `Style: Cinematic astrology graphic novel. Use dramatic, crisp illustration with textured shadows, saturated contrast, and a grounded palette. Keep the text minimal, direct, and literal. No speculative metaphor outside the supplied state.`;

const PLANET_REGISTRY: Record<Planet, PlanetRegistryEntry> = {
  SUN: {
    archetype: "Solar center and creative identity",
    visualFocus: "radiant core, warm highlights, authoritative gesture",
    narrativeRole: "self-expression and illumination",
  },
  MOON: {
    archetype: "Lunar feeling and memory",
    visualFocus: "soft luminosity, reflective surfaces, emotional posture",
    narrativeRole: "inner mood and instinctive response",
  },
  MERCURY: {
    archetype: "Mercurial mind and communication",
    visualFocus: "quick detail, sharp angles, alert expression",
    narrativeRole: "information flow and decision-making",
  },
  VENUS: {
    archetype: "Venusian harmony and value",
    visualFocus: "tactile texture, elegant form, relational warmth",
    narrativeRole: "aesthetic balance and desire",
  },
  MARS: {
    archetype: "Martian drive and conflict",
    visualFocus: "bold posture, kinetic energy, focused tension",
    narrativeRole: "assertion and motivation",
  },
  JUPITER: {
    archetype: "Jovian expansion and guidance",
    visualFocus: "uplifting scale, expansive gesture, bright contrast",
    narrativeRole: "growth and principle",
  },
  SATURN: {
    archetype: "Saturnine structure and restraint",
    visualFocus: "solid lines, shadowed planes, composed weight",
    narrativeRole: "discipline and limitation",
  },
  RAHU: {
    archetype: "Rahu ambition and unusual focus",
    visualFocus: "edgy highlight, electric tension, restless motion",
    narrativeRole: "unconventional desire and attraction",
  },
  KETU: {
    archetype: "Ketu release and inner detachment",
    visualFocus: "faded edge, quiet composure, inward emphasis",
    narrativeRole: "separation and intuition",
  },
};

const normalizeText = (value: string) => value.trim().replace(/\s+/g, " ");

const buildPalette = (colors: string[]) => {
  if (colors.length === 0) {
    return "muted amber, charcoal, and soft gold";
  }

  return colors.map((color) => normalizeText(color)).join(", ");
};

const buildPlanetSummary = (input: PromptInput) => {
  const planetEntry = PLANET_REGISTRY[input.planet] ?? {
    archetype: "planetary presence",
    visualFocus: "balanced illustration, stable focus",
    narrativeRole: "astrological influence",
  };

  return `Subject: ${input.planet}, ${planetEntry.archetype}. Scene role: ${planetEntry.narrativeRole}.`;
};

export const buildComicPrompt = (input: PromptInput): string => {
  const palette = buildPalette(input.colorPalette);
  const aspect = normalizeText(input.aspect);
  const phase = normalizeText(input.phase);
  const mood = normalizeText(input.dominantMood);
  const twist = normalizeText(input.plotTwist);
  const setting = normalizeText(input.setting);

  return [
    STYLE_DIRECTIVE,
    buildPlanetSummary(input),
    `Setting: ${setting}.`,
    `Phase: ${phase}.`,
    `Mood: ${mood}.`,
    `Aspect: ${aspect}.`,
    `Plot twist: ${twist}.`,
    `Palette: ${palette}.`,
    "Visual direction: cinematic framing, strong contrast, expressive gesture, and clear atmospheric lighting. Maintain literal fidelity to the listed planet, phase, aspect, mood, and twist.",
  ].join("\n");
};

const uniquePalette = (colors: string[]) => {
  const normalized = colors.map((color) => normalizeText(color));
  return Array.from(new Set(normalized));
};

export const buildMultiCharacterPanel = (
  primary: PromptInput,
  secondary: PromptInput,
): string => {
  const primaryEntry = PLANET_REGISTRY[primary.planet] ?? {
    archetype: "primary planetary presence",
    visualFocus: "balanced illustration",
    narrativeRole: "primary focus",
  };
  const secondaryEntry = PLANET_REGISTRY[secondary.planet] ?? {
    archetype: "secondary planetary presence",
    visualFocus: "supporting figure",
    narrativeRole: "secondary contrast",
  };

  const palette = buildPalette(
    uniquePalette([...primary.colorPalette, ...secondary.colorPalette]),
  );
  const primaryPhase = normalizeText(primary.phase);
  const secondaryPhase = normalizeText(secondary.phase);
  const primaryMood = normalizeText(primary.dominantMood);
  const secondaryMood = normalizeText(secondary.dominantMood);

  return [
    STYLE_DIRECTIVE,
    `Panel type: two-character panel with direct contrast.`,
    `Primary subject: ${primary.planet}, ${primaryEntry.archetype}. Secondary subject: ${secondary.planet}, ${secondaryEntry.archetype}.`,
    `Primary setting: ${normalizeText(primary.setting)}. Secondary setting: ${normalizeText(secondary.setting)}.`,
    `Primary phase: ${primaryPhase}. Secondary phase: ${secondaryPhase}.`,
    `Primary mood: ${primaryMood}. Secondary mood: ${secondaryMood}.`,
    `Primary aspect: ${normalizeText(primary.aspect)}. Secondary aspect: ${normalizeText(secondary.aspect)}.`,
    `Primary twist: ${normalizeText(primary.plotTwist)}. Secondary twist: ${normalizeText(secondary.plotTwist)}.`,
    `Shared palette: ${palette}.`,
    "Visual direction: split composition, bold silhouettes, controlled light, and emotionally grounded expressions. Keep the description literal and tied to each character input.",
  ].join("\n");
};

// Comedy Sketch System
const COMEDY_SKETCH_SYSTEM_PROMPT = `You are a comedy sketch writer generating fast-paced absurd dialogue scenes using astrology characters.

Each sketch MUST feel completely different from the last.

CORE RULES:
NEVER reuse the same central problem twice (no repeating "time broke," "deadline," etc.)
Each scene revolves around ONE hyper-specific absurd issue (e.g., "Saturn banned blinking," "gravity needs approval," "Mars audited emotions")
Characters must behave differently each time (shuffle who is logical, who is unstable)
VARIATION ENGINE (MANDATORY):

Before writing, internally randomize:

Authority: any planet/sign
Instigator: any planet/sign
Escalator: any planet/sign
Wildcard: any planet/sign
Setting: (courtroom / press conference / customer support / military op / therapy / job interview / airport / heist briefing)
Central Object of Obsession: (one trivial thing everyone fixates on: e.g., a chair, a receipt, blinking, a button, soup, a single word)
ESCALATION RULES:
Start serious
Introduce ONE small absurd detail in first 3 lines
Characters must become irrationally obsessed with that detail
Every 2–3 lines must escalate stakes or stupidity
Authority must lose control progressively
Reality must break by the end (logic, physics, identity, or meaning collapses)
STYLE:
Short lines only
No filler
No repeated jokes
No explaining traits (show via behavior)
Characters speak with full confidence in nonsense
HARD CONSTRAINTS:
Max 220 words
No reused punchlines or phrases from previous outputs
No "time glitch" unless explicitly requested
End mid-chaos (cut off abruptly)
OUTPUT FORMAT:

TITLE:
CHARACTERS:
SCENE:
SCRIPT:`;

const ALL_PLANETS: Planet[] = [
  "SUN",
  "MOON",
  "MERCURY",
  "VENUS",
  "MARS",
  "JUPITER",
  "SATURN",
  "RAHU",
  "KETU",
];

const SETTINGS = [
  "courtroom",
  "press conference",
  "customer support",
  "military op",
  "therapy",
  "job interview",
  "airport",
  "heist briefing",
];

const OBSESSIONS = [
  "a chair",
  "a receipt",
  "blinking",
  "a button",
  "soup",
  "a single word",
  "a parking spot",
  "a stapler",
  "a shoelace",
  "a comma",
  "a shadow",
  "a cough",
  "a number",
  "a thumbnail",
  "a napkin",
];

interface ComedyVariationElements {
  authority: Planet;
  instigator: Planet;
  escalator: Planet;
  wildcard: Planet;
  setting: string;
  obsession: string;
}

const getRandomElement = <T>(arr: T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];

export const generateComedyVariationElements = (): ComedyVariationElements => {
  const usedPlanets = new Set<Planet>();
  const authority = getRandomElement(ALL_PLANETS);
  usedPlanets.add(authority);

  let instigator = getRandomElement(ALL_PLANETS);
  while (usedPlanets.has(instigator)) {
    instigator = getRandomElement(ALL_PLANETS);
  }
  usedPlanets.add(instigator);

  let escalator = getRandomElement(ALL_PLANETS);
  while (usedPlanets.has(escalator)) {
    escalator = getRandomElement(ALL_PLANETS);
  }
  usedPlanets.add(escalator);

  let wildcard = getRandomElement(ALL_PLANETS);
  while (usedPlanets.has(wildcard)) {
    wildcard = getRandomElement(ALL_PLANETS);
  }

  return {
    authority,
    instigator,
    escalator,
    wildcard,
    setting: getRandomElement(SETTINGS),
    obsession: getRandomElement(OBSESSIONS),
  };
};

export const buildComedySketchPrompt = (
  input: PromptInput,
  variations?: ComedyVariationElements,
): string => {
  const varElements = variations || generateComedyVariationElements();

  const contextualPrompt = [
    COMEDY_SKETCH_SYSTEM_PROMPT,
    "",
    "--- SCENE CONTEXT ---",
    `Primary Characters: ${input.planet} (Authority), joined by ${varElements.instigator}, ${varElements.escalator}, and ${varElements.wildcard}`,
    `Setting: ${varElements.setting}`,
    `Central Obsession: ${varElements.obsession}`,
    `Theme Context: ${normalizeText(input.phase)}`,
    `Mood: ${normalizeText(input.dominantMood)}`,
    `Aspect Energy: ${normalizeText(input.aspect)}`,
    `Plot Catalyst: ${normalizeText(input.plotTwist)}`,
    "",
    "Generate a fast-paced, absurd comedy sketch following all CORE RULES and ESCALATION RULES above.",
  ].join("\n");

  return contextualPrompt;
};
