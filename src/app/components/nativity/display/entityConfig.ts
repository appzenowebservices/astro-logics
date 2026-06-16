/**
 * Planet Entity System Configuration
 * Customize colors, moods, animations, and behaviors
 */

export const ENTITY_CONFIG = {
  // 3D Animation Settings
  ANIMATION: {
    idleFloatSpeed: 0.8,
    idleFloatHeight: 0.3,
    hoverScaleAmount: 1.2,
    hoverScaleLerp: 0.1,
    autoRotateSpeed: 2,
    rotationIntensity: 0.1,
  },

  // Colors & Visuals
  VISUALS: {
    // Aura ring configuration
    primaryRingScale: (energy: number) => 1.3 + energy * 0.5,
    primaryRingOpacity: 0.6,
    secondaryRingScale: (energy: number) => 1.5 + energy * 0.3,
    secondaryRingOpacity: 0.4,

    // Material settings
    metalness: 0.4,
    roughness: 0.6,

    // Lighting
    ambientIntensity: 0.6,
    directionalIntensity: 0.8,
    pointLightDistance: 8,
  },

  // Camera Settings
  CAMERA: {
    fov: 50,
    defaultPosition: [0, 0, 3],
    autoRotate: true,
    enableZoom: true,
    enablePan: false,
  },

  // UI Text
  TEXT: {
    summonButtonText: "Summon",
    summoning: "Summoning…",
    headerText: "Meet your planets",
    subHeaderText:
      "Summon each planet to reveal their living essence and personality",
    characterProfileText: "Character Profile",
    whispersText: "Whispers",
    noWhispersText: "No avatar yet.",
    noPlanetsText: "No planets loaded.",
    summiningIndicator: "Summoning {planet}...",
    clickToRevealText: "Click Summon to reveal",
    essenceText: "'s essence",
  },

  // Energy Level Thresholds
  ENERGY_THRESHOLDS: {
    low: 0.33,
    medium: 0.66,
    high: 1.0,
  },

  // Personality Parsing Sensitivity
  PARSING: {
    maxTraits: 5,
    minWordLength: 4,
    energyLengthWeight: 0.3,
    energyExclamationWeight: 1,
    energyQuestionWeight: 0.3,
  },

  // Mood to Icon mapping for future UI enhancements
  MOOD_ICONS: {
    radiant: "✨",
    contemplative: "🌙",
    passionate: "🔥",
    gentle: "💎",
    chaotic: "⚡",
    analytical: "🧠",
    enigmatic: "✴️",
  },

  // Mood to Color gradient mapping
  MOOD_GRADIENTS: {
    radiant: "from-yellow-500 to-orange-400",
    contemplative: "from-blue-400 to-purple-500",
    passionate: "from-red-500 to-pink-500",
    gentle: "from-green-400 to-cyan-400",
    chaotic: "from-purple-500 to-pink-600",
    analytical: "from-cyan-400 to-blue-600",
    enigmatic: "from-slate-500 to-slate-600",
  },

  // Canvas Size
  CANVAS: {
    height: "16rem", // h-64 in tailwind
    heightLoading: "16rem", // h-64
    heightInactive: "10rem", // h-40
  },
};

export default ENTITY_CONFIG;
