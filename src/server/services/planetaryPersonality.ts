import type { Prisma } from "@prisma/client";
export type PlanetaryProfile = Prisma.PlanetaryProfileGetPayload<{}>;
export type NativityAspect = Prisma.NativityAspectGetPayload<{}>;

export interface PlanetPersonality {
  planet: string;
  archetype: string;
  primaryTheme: string;
  psychologicalFunction: string;
  lifeDomain: string;
  currentExpression: string;
  strength: number;
  visibility: number;
  dignity: string;
  house: number;
  zodiacSign: string;
  isRetrograde: boolean;
  speed: number;
  relationships: PlanetRelationship[];
  challenges: string[];
  potentials: string[];
  therapeuticGuidance: string;
  colorCode: string;
}

export interface PlanetRelationship {
  planet: string;
  relationshipType: "ally" | "neutral" | "challenger" | "teacher";
  aspectType: string;
  orb: number;
  description: string;
  therapeuticMeaning: string;
  icon: string;
}

const PLANET_ARCHETYPES: Record<
  string,
  {
    archetype: string;
    theme: string;
    function: string;
    domain: string;
    color: string;
  }
> = {
  SUN: {
    archetype: "The Hero",
    theme: "Core Identity & Life Expression",
    function: "Conscious Will & Purpose",
    domain: "Self, Vitality, Life Direction",
    color: "#FFD700",
  },
  MOON: {
    archetype: "The Nurturer",
    theme: "Emotional Nature & Instincts",
    function: "Emotional Response & Security",
    domain: "Feelings, Home, Protection",
    color: "#E0E0E0",
  },
  MERCURY: {
    archetype: "The Messenger",
    theme: "Thought & Communication",
    function: "Perception & Exchange",
    domain: "Mind, Speech, Learning",
    color: "#FFA500",
  },
  VENUS: {
    archetype: "The Harmonizer",
    theme: "Values & Relationships",
    function: "Appreciation & Connection",
    domain: "Love, Beauty, Resources",
    color: "#00FF00",
  },
  MARS: {
    archetype: "The Warrior",
    theme: "Drive & Courage",
    function: "Action & Assertion",
    domain: "Energy, Passion, Courage",
    color: "#FF0000",
  },
  JUPITER: {
    archetype: "The Sage",
    theme: "Growth & Wisdom",
    function: "Expansion & Meaning",
    domain: "Fortune, Learning, Vision",
    color: "#9966FF",
  },
  SATURN: {
    archetype: "The Mentor",
    theme: "Discipline & Boundaries",
    function: "Structure & Responsibility",
    domain: "Time, Authority, Mastery",
    color: "#696969",
  },
  URANUS: {
    archetype: "The Rebel",
    theme: "Innovation & Freedom",
    function: "Awakening & Change",
    domain: "Revolution, Technology, Truth",
    color: "#00FFFF",
  },
  NEPTUNE: {
    archetype: "The Mystic",
    theme: "Transcendence & Dreams",
    function: "Dissolution & Union",
    domain: "Spirit, Art, Compassion",
    color: "#4169E1",
  },
  PLUTO: {
    archetype: "The Alchemist",
    theme: "Transformation & Power",
    function: "Regeneration & Depth",
    domain: "Psychology, Occult, Death/Rebirth",
    color: "#8B0000",
  },
  MEAN_NODE: {
    archetype: "The Guide",
    theme: "Life Purpose & Destiny",
    function: "Soul Growth & Direction",
    domain: "Evolution, Karma, Path",
    color: "#FFD700",
  },
};

const RELATIONSHIP_MATRIX: Record<string, Record<string, string>> = {
  SUN: {
    MOON: "ally",
    MERCURY: "neutral",
    VENUS: "ally",
    MARS: "neutral",
    JUPITER: "ally",
    SATURN: "challenger",
    URANUS: "challenger",
    NEPTUNE: "neutral",
    PLUTO: "challenger",
    MEAN_NODE: "ally",
  },
  MOON: {
    SUN: "ally",
    MERCURY: "neutral",
    VENUS: "ally",
    MARS: "challenger",
    JUPITER: "ally",
    SATURN: "challenger",
    URANUS: "challenger",
    NEPTUNE: "ally",
    PLUTO: "challenger",
    MEAN_NODE: "ally",
  },
  MERCURY: {
    SUN: "neutral",
    MOON: "neutral",
    VENUS: "ally",
    MARS: "challenger",
    JUPITER: "ally",
    SATURN: "neutral",
    URANUS: "ally",
    NEPTUNE: "challenger",
    PLUTO: "neutral",
    MEAN_NODE: "neutral",
  },
  VENUS: {
    SUN: "ally",
    MOON: "ally",
    MERCURY: "ally",
    MARS: "challenger",
    JUPITER: "ally",
    SATURN: "challenger",
    URANUS: "neutral",
    NEPTUNE: "ally",
    PLUTO: "challenger",
    MEAN_NODE: "ally",
  },
  MARS: {
    SUN: "neutral",
    MOON: "challenger",
    MERCURY: "challenger",
    VENUS: "challenger",
    JUPITER: "ally",
    SATURN: "challenger",
    URANUS: "ally",
    NEPTUNE: "challenger",
    PLUTO: "ally",
    MEAN_NODE: "neutral",
  },
  JUPITER: {
    SUN: "ally",
    MOON: "ally",
    MERCURY: "ally",
    VENUS: "ally",
    MARS: "ally",
    SATURN: "challenger",
    URANUS: "ally",
    NEPTUNE: "ally",
    PLUTO: "neutral",
    MEAN_NODE: "ally",
  },
  SATURN: {
    SUN: "challenger",
    MOON: "challenger",
    MERCURY: "neutral",
    VENUS: "challenger",
    MARS: "challenger",
    JUPITER: "challenger",
    URANUS: "challenger",
    NEPTUNE: "challenger",
    PLUTO: "ally",
    MEAN_NODE: "ally",
  },
  URANUS: {
    SUN: "challenger",
    MOON: "challenger",
    MERCURY: "ally",
    VENUS: "neutral",
    MARS: "ally",
    JUPITER: "ally",
    SATURN: "challenger",
    NEPTUNE: "ally",
    PLUTO: "neutral",
    MEAN_NODE: "ally",
  },
  NEPTUNE: {
    SUN: "neutral",
    MOON: "ally",
    MERCURY: "challenger",
    VENUS: "ally",
    MARS: "challenger",
    JUPITER: "ally",
    SATURN: "challenger",
    URANUS: "ally",
    PLUTO: "neutral",
    MEAN_NODE: "ally",
  },
  PLUTO: {
    SUN: "challenger",
    MOON: "challenger",
    MERCURY: "neutral",
    VENUS: "challenger",
    MARS: "ally",
    JUPITER: "neutral",
    SATURN: "ally",
    URANUS: "neutral",
    NEPTUNE: "neutral",
    MEAN_NODE: "ally",
  },
};

const ASPECT_MEANINGS: Record<
  string,
  {
    type: string;
    harmonicValue: number;
    description: string;
  }
> = {
  conjunction: {
    type: "Merger",
    harmonicValue: 0.9,
    description: "Blended energies, unified expression",
  },
  sextile: {
    type: "Harmony",
    harmonicValue: 0.8,
    description: "Easy cooperation and flow",
  },
  square: {
    type: "Tension",
    harmonicValue: 0.3,
    description: "Creative friction driving growth",
  },
  trine: {
    type: "Grace",
    harmonicValue: 0.95,
    description: "Natural talent and ease",
  },
  opposition: {
    type: "Polarity",
    harmonicValue: 0.4,
    description: "Opposites that complete each other",
  },
  quincunx: {
    type: "Adjustment",
    harmonicValue: 0.2,
    description: "Requires conscious integration",
  },
};

export class PlanetaryPersonalityService {
  buildPlanetPersonality(
    profile: PlanetaryProfile,
    aspects: NativityAspect[],
    house: number,
    zodiacSign: string,
    isRetrograde: boolean,
    speed: number,
  ): PlanetPersonality {
    const archData = PLANET_ARCHETYPES[profile.planet] || PLANET_ARCHETYPES.SUN;

    // Calculate relationships based on aspects
    const relationships = this.calculateRelationships(profile.planet, aspects);

    // Determine challenges and potentials
    const { challenges, potentials } = this.inferThemes(
      profile.planet,
      profile.strength,
      zodiacSign,
      isRetrograde,
      relationships,
    );

    // Generate therapeutic guidance
    const therapeuticGuidance = this.generateTherapeuticGuidance(
      profile.planet,
      profile.strength,
      challenges,
      potentials,
      isRetrograde,
    );

    return {
      planet: profile.planet,
      archetype: archData.archetype,
      primaryTheme: archData.theme,
      psychologicalFunction: archData.function,
      lifeDomain: archData.domain || profile.primaryDomain || "General",
      currentExpression: this.expressionLevel(profile.strength),
      strength: profile.strength,
      visibility: profile.visibility || 0.7,
      dignity: profile.dignity || "Neutral",
      house,
      zodiacSign,
      isRetrograde,
      speed,
      relationships,
      challenges,
      potentials,
      therapeuticGuidance,
      colorCode: archData.color,
    };
  }

  private calculateRelationships(
    planet: string,
    aspects: NativityAspect[],
  ): PlanetRelationship[] {
    const planetAspects = aspects.filter(
      (a) => a.planet1 === planet || a.planet2 === planet,
    );

    return planetAspects.map((aspect) => {
      const otherPlanet =
        aspect.planet1 === planet ? aspect.planet2 : aspect.planet1;
      const relationshipType = this.determineRelationshipType(
        planet,
        otherPlanet,
        aspect.aspectType,
      );
      const aspectMeaning = ASPECT_MEANINGS[
        aspect.aspectType.toLowerCase() as keyof typeof ASPECT_MEANINGS
      ] || {
        type: aspect.aspectType,
        harmonicValue: 0.5,
        description: "Dynamic interaction",
      };

      return {
        planet: otherPlanet,
        relationshipType,
        aspectType: aspect.aspectType,
        orb: aspect.orbDistance,
        description: `${aspectMeaning.type}: ${aspectMeaning.description}`,
        therapeuticMeaning: this.therapeuticAspectMeaning(
          planet,
          otherPlanet,
          aspect.aspectType,
          relationshipType,
        ),
        icon: this.getRelationshipIcon(relationshipType, aspect.aspectType),
      };
    });
  }

  private determineRelationshipType(
    planet1: string,
    planet2: string,
    aspect: string,
  ): "ally" | "neutral" | "challenger" | "teacher" {
    const baseRelationship =
      RELATIONSHIP_MATRIX[planet1]?.[planet2] || "neutral";

    // Aspects modify the base relationship
    if (aspect === "square" || aspect === "opposition") {
      if (baseRelationship === "ally") return "teacher";
      if (baseRelationship === "challenger") return "challenger";
      return "challenger";
    }

    if (aspect === "trine" || aspect === "sextile") {
      if (baseRelationship === "challenger") return "neutral";
      if (baseRelationship === "ally") return "ally";
      return "neutral";
    }

    return baseRelationship as "ally" | "neutral" | "challenger" | "teacher";
  }

  private therapeuticAspectMeaning(
    planet1: string,
    planet2: string,
    aspect: string,
    relationshipType: string,
  ): string {
    const meanings: Record<string, Record<string, string>> = {
      ally: {
        conjunction: "Natural synergy - these energies amplify each other",
        trine: "Effortless cooperation - talent and grace",
        sextile: "Constructive support - creativity flows naturally",
      },
      neutral: {
        conjunction: "Different energies merging - integration needed",
        square: "Productive tension - both sides want expression",
        opposition: "Complementary opposites - balance creates wholeness",
      },
      challenger: {
        conjunction: "Conflicting drives - requires conscious choice",
        square: "Friction creates growth - resistance builds character",
        opposition: "Polarized needs - integration leads to wisdom",
        quincunx: "Awkward adjustment - patience builds mastery",
      },
      teacher: {
        square: "Teaching through challenge - growth in difficulty",
        opposition: "Opposite truths - wholeness through inclusion",
      },
    };

    return (
      meanings[relationshipType]?.[aspect.toLowerCase()] ||
      "Dynamic interaction - observe the pattern"
    );
  }

  private inferThemes(
    planet: string,
    strength: number,
    zodiacSign: string,
    isRetrograde: boolean,
    relationships: PlanetRelationship[],
  ): { challenges: string[]; potentials: string[] } {
    const challenges: string[] = [];
    const potentials: string[] = [];

    // Strength-based challenges
    if (strength < 0.4) {
      challenges.push(
        `${planet} is underdeveloped - needs conscious cultivation`,
      );
      potentials.push(`Great potential for growth and development`);
    }

    // Retrograde considerations
    if (isRetrograde) {
      challenges.push(
        `${planet} retrograde - introspective expression, internal work needed`,
      );
      potentials.push(`Deep inner wisdom available through reflection`);
    }

    // Relationship-based themes
    const challengerCount = relationships.filter(
      (r) => r.relationshipType === "challenger",
    ).length;
    const allyCount = relationships.filter(
      (r) => r.relationshipType === "ally",
    ).length;

    if (challengerCount > allyCount) {
      challenges.push(
        `Multiple challenging relationships - requires diplomacy`,
      );
      potentials.push(
        `Pressure creates brilliance - adversity strengthens character`,
      );
    }

    if (allyCount >= 3) {
      potentials.push(
        `Strong support network - gifts naturally expressed through allies`,
      );
    }

    return { challenges, potentials };
  }

  private generateTherapeuticGuidance(
    planet: string,
    strength: number,
    challenges: string[],
    potentials: string[],
    isRetrograde: boolean,
  ): string {
    const strengthLevel = strength > 0.7 ? "strong" : "moderate";
    const retroText = isRetrograde
      ? "Work inwardly, journal, meditate on this planet's gifts."
      : "Express outwardly, take action, embody this planet's qualities.";

    const archData = PLANET_ARCHETYPES[planet] || PLANET_ARCHETYPES.SUN;
    const guidance = [
      `${planet} is your ${strengthLevel} expression of ${archData.theme}.`,
      `Focus: ${potentials[0] || "Develop this planetary energy"}`,
      challenges.length > 0
        ? `Challenge: ${challenges[0]} - Transform this into wisdom.`
        : "This planet flows well in your chart.",
      retroText,
    ];

    return guidance.join(" ");
  }

  private expressionLevel(strength: number): string {
    if (strength > 0.85) return "Radiant Expression";
    if (strength > 0.7) return "Strong Expression";
    if (strength > 0.55) return "Clear Expression";
    if (strength > 0.4) return "Developing Expression";
    return "Emerging Expression";
  }

  private getRelationshipIcon(
    relationshipType: string,
    aspect: string,
  ): string {
    const icons: Record<string, Record<string, string>> = {
      ally: {
        conjunction: "🤝",
        trine: "✨",
        sextile: "🌟",
        default: "💚",
      },
      neutral: {
        conjunction: "⚖️",
        square: "⚡",
        opposition: "🔄",
        default: "💙",
      },
      challenger: {
        conjunction: "⚔️",
        square: "🔥",
        opposition: "⚡",
        quincunx: "❓",
        default: "🧡",
      },
      teacher: {
        square: "📚",
        opposition: "🪞",
        default: "💛",
      },
    };

    return (
      icons[relationshipType]?.[aspect.toLowerCase()] ||
      icons[relationshipType]?.default ||
      "•"
    );
  }
}
