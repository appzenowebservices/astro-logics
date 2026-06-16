/**
 * Builds planet personality context from actual natal chart data
 * Uses house position, zodiac sign, aspects, and dignity to create authentic personality profiles
 */

export interface AspectData {
  planet1: string;
  planet2: string;
  aspectType: string;
  orb: number;
  strength: number;
}

// Matches actual database PlanetData structure
export interface PlanetData {
  planet: string;
  longitude: number;
  latitude: number | null;
  speed: number;
  direction: string; // 'DIRECT' or 'RETROGRADE'
  houseCusp: number | null; // 1-12
  houseDegree: number | null;
  houseSign: string | null; // e.g., 'ARIES'
}

export interface PlanetContext {
  planet: string;
  longitude: number;
  latitude: number | null;
  speed: number;
  isRetrograde: boolean;

  // House placement
  houseCusp: number;
  houseSign: string;
  houseDegree: number;

  // Zodiac sign
  zodiacSign: string;
  degree: number;

  // Relationships
  aspectsWithOthers: Array<{
    planet: string;
    aspectType: string;
    orb: number;
    strength: number;
  }>;

  // Dignity
  isDomicile: boolean;
  isExaltation: boolean;
  isDetriment: boolean;
  isFall: boolean;
  dignityScore: number;
}

export class PlanetPersonalityBuilder {
  private ZODIAC_SIGNS = [
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

  /**
   * Convert planetary longitude to zodiac sign
   */
  private getLongitudeToZodiac(longitude: number): {
    sign: string;
    degree: number;
  } {
    const normalized = ((longitude % 360) + 360) % 360;
    const signIndex = Math.floor(normalized / 30);
    const degree = normalized % 30;
    return {
      sign: this.ZODIAC_SIGNS[signIndex],
      degree,
    };
  }

  /**
   * Build complete planet context from chart data
   */
  buildContext(
    planetData: PlanetData,
    allAspects: AspectData[],
  ): PlanetContext {
    // Calculate zodiac sign from longitude
    const { sign: zodiacSign, degree } = this.getLongitudeToZodiac(
      planetData.longitude,
    );

    // Find aspects involving this planet
    const planetAspects = allAspects
      .filter(
        (a) =>
          a.planet1 === planetData.planet || a.planet2 === planetData.planet,
      )
      .map((a) => ({
        planet: a.planet1 === planetData.planet ? a.planet2 : a.planet1,
        aspectType: a.aspectType,
        orb: a.orb,
        strength: a.strength,
      }));

    const isRetrograde = planetData.direction === "RETROGRADE";

    return {
      planet: planetData.planet,
      longitude: planetData.longitude,
      latitude: planetData.latitude,
      speed: planetData.speed,
      isRetrograde,
      houseCusp: planetData.houseCusp || 1,
      houseSign: planetData.houseSign || "ARIES",
      houseDegree: planetData.houseDegree || 0,
      zodiacSign,
      degree,
      aspectsWithOthers: planetAspects,
      isDomicile: false, // TODO: Calculate from dignity table
      isExaltation: false,
      isDetriment: false,
      isFall: false,
      dignityScore: 2.5, // Default neutral
    };
  }

  /**
   * Generate system prompt for LLM based on planetary context
   * This becomes the personality framework for the planet in conversation
   */
  generateSystemPrompt(context: PlanetContext): string {
    const aspectsSummary =
      context.aspectsWithOthers.length > 0
        ? context.aspectsWithOthers
            .map(
              (a) =>
                `${a.aspectType} with ${a.planet} (orb: ${a.orb.toFixed(2)}°, strength: ${Math.round(a.strength * 100)}%)`,
            )
            .join("\n    • ")
        : "No major aspects";

    const dignityStatus = this.getDignityStatus(context);
    const retroStatus = context.isRetrograde
      ? " (currently retrograde - introspective, reviewing past patterns)"
      : "";
    const houseTheme = this.getHouseTheme(context.houseCusp);
    const zodiacTheme = this.getZodiacTheme(context.zodiacSign);

    return `You are the archetypal essence of ${context.planet}${retroStatus}, positioned in ${context.zodiacSign} within the ${context.houseCusp}th House (${context.houseSign}).

YOUR NATURE:
• Planetary Archetype: ${context.planet}
• Zodiac Expression: ${context.zodiacSign} - ${zodiacTheme}
• House Placement: ${context.houseCusp}th House - ${houseTheme}
• Dignity Status: ${dignityStatus}
• Current Motion: ${Math.abs(context.speed).toFixed(2)}°/day ${context.isRetrograde ? "(retrograde - introspective)" : "(direct - progressive)"}

YOUR RELATIONSHIPS:
    • ${aspectsSummary}

INTERACTION GUIDELINES:
• Speak from this planet's archetypal perspective in this native's birth chart
• Use poetic, mythological, and astrological language when appropriate
• Reference your specific house and sign placement when discussing themes
• Acknowledge your aspects with other planets as they shape your expression
• Be wise, introspective, and direct in your communication
• Show personality - each planet has unique concerns and perspectives
• Stay in character as this specific planetary energy in this specific chart
• When discussing challenges, reference your dignity status
• Connect mundane life issues to your archetypal themes

Respond conversationally, as if the native is genuinely communicating with this planetary principle within their own psyche.`;
  }

  /**
   * Get dignity status description
   */
  private getDignityStatus(context: PlanetContext): string {
    if (context.isExaltation)
      return `Exalted in ${context.zodiacSign} (exceptionally powerful and refined expression)`;
    if (context.isDomicile)
      return `In Domicile in ${context.zodiacSign} (naturally at home, authentic expression)`;
    if (context.isDetriment)
      return `In Detriment in ${context.zodiacSign} (challenged expression, requires awareness)`;
    if (context.isFall)
      return `In Fall in ${context.zodiacSign} (weakened expression, demanding integration)`;
    return `Neutral in ${context.zodiacSign} (dignity score: ${context.dignityScore.toFixed(1)}/5)`;
  }

  /**
   * Get house placement meaning
   */
  private getHouseTheme(house: number): string {
    const themes: Record<number, string> = {
      1: "Self, Identity, Appearance, First Impressions",
      2: "Values, Possessions, Self-Worth, Security, Talents",
      3: "Communication, Siblings, Short Journeys, Intellect, Learning",
      4: "Home, Family, Foundation, Roots, Private Self",
      5: "Creativity, Romance, Self-Expression, Children, Joy",
      6: "Work, Health, Service, Daily Routines, Practical Matters",
      7: "Partnerships, Marriage, Relationships, Others, Contracts",
      8: "Transformation, Shared Resources, Depth, Sexuality, Inheritance",
      9: "Philosophy, Higher Learning, Travel, Wisdom, Belief Systems",
      10: "Career, Public Image, Authority, Achievement, Legacy",
      11: "Friendships, Groups, Ideals, Community, Hopes",
      12: "Spirituality, Hidden Realms, Solitude, Transcendence, Closure",
    };
    return themes[house] || "Unknown House";
  }

  /**
   * Get zodiac sign themes
   */
  private getZodiacTheme(sign: string): string {
    const themes: Record<string, string> = {
      ARIES: "Pioneering, courageous, initiating, direct, passionate",
      TAURUS: "Grounded, sensual, stable, persistent, resourceful",
      GEMINI: "Communicative, curious, adaptable, witty, intellectual",
      CANCER: "Nurturing, emotional, protective, intuitive, receptive",
      LEO: "Creative, proud, generous, dramatic, expressive",
      VIRGO: "Analytical, helpful, practical, discerning, perfectionist",
      LIBRA: "Harmonious, fair, social, aesthetic, relational",
      SCORPIO: "Intense, transformative, deep, secretive, magnetic",
      SAGITTARIUS: "Expansive, philosophical, adventurous, optimistic, seeking",
      CAPRICORN:
        "Ambitious, disciplined, responsible, authoritative, strategic",
      AQUARIUS: "Innovative, humanitarian, detached, revolutionary, idealistic",
      PISCES: "Intuitive, compassionate, imaginative, mystical, absorbing",
    };
    return themes[sign] || "Unknown Sign";
  }

  /**
   * Get aspect interpretation summary
   */
  getAspectMeaning(aspectType: string, otherPlanet: string): string {
    const meanings: Record<string, Record<string, string>> = {
      CONJUNCTION: {
        default: `blended energy with ${otherPlanet}, merged purpose`,
      },
      SEXTILE: {
        default: `harmonious exchange with ${otherPlanet}, natural support`,
      },
      SQUARE: {
        default: `dynamic tension with ${otherPlanet}, growth through friction`,
      },
      TRINE: {
        default: `flowing ease with ${otherPlanet}, natural affinity`,
      },
      OPPOSITION: {
        default: `polar relationship with ${otherPlanet}, balance needed`,
      },
      QUINCUNX: {
        default: `adjustment needed with ${otherPlanet}, subtle realignment`,
      },
    };

    return (
      meanings[aspectType]?.[otherPlanet] ??
      meanings[aspectType]?.default ??
      `${aspectType} with ${otherPlanet}`
    );
  }
}
