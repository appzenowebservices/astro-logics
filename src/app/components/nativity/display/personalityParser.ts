// Planet personality types and color mappings
export interface PlanetPersonality {
  mood: string;
  traits: string[];
  color: string;
  energy: number;
}

export interface PlanetEntity {
  planet: string;
  personality: PlanetPersonality;
  avatar: string; // Raw LLM response
}

// Color associations for planets
const PLANET_COLORS: Record<string, string> = {
  Sun: "#FFD700", // Gold
  Moon: "#C0C0C0", // Silver
  Mercury: "#B4860B", // Dark goldenrod
  Venus: "#2E8B57", // Sea green
  Mars: "#DC143C", // Crimson
  Jupiter: "#DAA520", // Goldenrod
  Saturn: "#A9A9A9", // Dark gray
  Uranus: "#4B0082", // Indigo
  Neptune: "#4169E1", // Royal blue
  Pluto: "#2F4F4F", // Dark slate gray
};

// Mood mappings from text patterns
const MOOD_KEYWORDS: Record<string, string[]> = {
  radiant: ["bright", "shine", "powerful", "strong", "confident"],
  contemplative: ["think", "ponder", "wonder", "curious", "mysterious"],
  passionate: ["fire", "intense", "desire", "drive", "energy"],
  gentle: ["soft", "calm", "soothe", "nurture", "peace"],
  chaotic: ["wild", "unpredictable", "rebel", "revolution", "transform"],
  analytical: ["logic", "analysis", "pattern", "detail", "precise"],
};

/**
 * Parse LLM avatar text to extract personality traits
 */
export function parsePersonality(
  avatarText: string,
  planet: string,
): PlanetPersonality {
  if (!avatarText?.length) {
    return getDefaultPersonality(planet);
  }

  const textLower = avatarText.toLowerCase();

  // Determine mood
  let mood = "enigmatic";
  for (const [moodName, keywords] of Object.entries(MOOD_KEYWORDS)) {
    if (keywords.some((kw) => textLower.includes(kw))) {
      mood = moodName;
      break;
    }
  }

  // Extract traits from sentences (first 5 significant words)
  const traits = extractTraits(avatarText);

  // Energy level based on punctuation and word count
  const energy = calculateEnergy(avatarText);

  return {
    mood,
    traits,
    color: PLANET_COLORS[planet] || "#E29626",
    energy,
  };
}

function extractTraits(text: string): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  const traits: string[] = [];

  for (const sentence of sentences) {
    const words = sentence
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 4);
    if (words.length > 0) {
      // Get first meaningful word as trait
      const trait = words[0].toLowerCase().replace(/[.,!?;:]/g, "");
      if (trait && !traits.includes(trait) && traits.length < 5) {
        traits.push(trait);
      }
    }
  }

  return traits.length > 0 ? traits : ["mysterious"];
}

function calculateEnergy(text: string): number {
  // Base energy on character count (longer = more expressive)
  const lengthEnergy = Math.min(text.length / 500, 1);

  // Exclamation marks increase energy
  const exclamationCount = (text.match(/!/g) || []).length;
  const exclamationEnergy = Math.min(exclamationCount / 3, 0.5);

  // Questions indicate thoughtfulness (medium energy)
  const questionCount = (text.match(/\?/g) || []).length;
  const questionEnergy = Math.min(questionCount / 5, 0.3);

  return Math.min(
    0.5 + lengthEnergy * 0.3 + exclamationEnergy + questionEnergy,
    1,
  );
}

/**
 * Get default personality for a planet
 */
export function getDefaultPersonality(planet: string): PlanetPersonality {
  const defaults: Record<string, PlanetPersonality> = {
    Sun: {
      mood: "radiant",
      traits: ["vital", "radiant", "dynamic"],
      color: PLANET_COLORS.Sun,
      energy: 0.85,
    },
    Moon: {
      mood: "contemplative",
      traits: ["intuitive", "nurturing", "reflective"],
      color: PLANET_COLORS.Moon,
      energy: 0.65,
    },
    Mercury: {
      mood: "analytical",
      traits: ["curious", "communicative", "quick"],
      color: PLANET_COLORS.Mercury,
      energy: 0.75,
    },
    Venus: {
      mood: "gentle",
      traits: ["graceful", "harmonious", "loving"],
      color: PLANET_COLORS.Venus,
      energy: 0.7,
    },
    Mars: {
      mood: "passionate",
      traits: ["fierce", "courageous", "driven"],
      color: PLANET_COLORS.Mars,
      energy: 0.9,
    },
    Jupiter: {
      mood: "radiant",
      traits: ["expansive", "benevolent", "grand"],
      color: PLANET_COLORS.Jupiter,
      energy: 0.8,
    },
    Saturn: {
      mood: "contemplative",
      traits: ["disciplined", "wise", "steady"],
      color: PLANET_COLORS.Saturn,
      energy: 0.6,
    },
    Uranus: {
      mood: "chaotic",
      traits: ["revolutionary", "unpredictable", "innovative"],
      color: PLANET_COLORS.Uranus,
      energy: 0.8,
    },
    Neptune: {
      mood: "contemplative",
      traits: ["dreamy", "mystical", "transcendent"],
      color: PLANET_COLORS.Neptune,
      energy: 0.7,
    },
    Pluto: {
      mood: "chaotic",
      traits: ["transformative", "intense", "hidden"],
      color: PLANET_COLORS.Pluto,
      energy: 0.75,
    },
  };

  return (
    defaults[planet] || {
      mood: "enigmatic",
      traits: ["mysterious", "unknown"],
      color: "#E29626",
      energy: 0.6,
    }
  );
}
