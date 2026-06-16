import type { Prisma } from "@prisma/client";
export type PlanetaryProfile = Prisma.PlanetaryProfileGetPayload<{}>;
export type NativityAspect = Prisma.NativityAspectGetPayload<{}>;
import type { PlanetaryScene } from "./transitCalculator";

export interface RashoffScene {
  planetPOV: string;
  narrative: string;
  otherPlanetaryProfiles: Array<{
    planet: string;
    relationshipType: string;
    tension: number;
    dialogue: string;
  }>;
  visualCues: {
    lighting: string;
    atmosphere: string;
    colorPalette: string[];
  };
  actionSequence: string;
}

export class RashoffTheatre {
  /**
   * Generate theatrical narrative from each planet's perspective
   */
  generateTheatricalScene(
    scene: PlanetaryScene,
    natalProfiles: PlanetaryProfile[],
    natalAspects: NativityAspect[],
  ): RashoffScene {
    const mainPlanet = natalProfiles.find((p) => p.planet === scene.planet);
    if (!mainPlanet) throw new Error(`Planet ${scene.planet} not found`);

    // Get relationships with other planets
    const relatedAspects = natalAspects.filter(
      (a) => a.planet1 === scene.planet || a.planet2 === scene.planet,
    );

    const otherPlanetaryProfiles = relatedAspects.map((aspect) => {
      const otherPlanet =
        aspect.planet1 === scene.planet ? aspect.planet2 : aspect.planet1;
      const profile = natalProfiles.find((p) => p.planet === otherPlanet);

      return {
        planet: otherPlanet,
        relationshipType: this.determineRelationship(aspect.aspectType),
        tension: this.calculateTension(aspect),
        dialogue: this.generateDialogue(
          scene.planet,
          otherPlanet,
          aspect.aspectType,
        ),
      };
    });

    return {
      planetPOV: scene.planet,
      narrative: this.generateNarrative(scene, mainPlanet),
      otherPlanetaryProfiles,
      visualCues: this.generateVisualCues(scene),
      actionSequence: this.generateActionSequence(scene, relatedAspects.length),
    };
  }

  private generateNarrative(
    scene: NativityCurrentStoryTab,
    profile: PlanetaryProfile,
  ): string {
    const intensity =
      scene.intensity > 70
        ? "DRAMATIC"
        : scene.intensity > 40
          ? "MODERATE"
          : "SUBTLE";

    const movement =
      Math.abs(scene.movementDegrees) > 5
        ? "rapidly"
        : Math.abs(scene.movementDegrees) > 1
          ? "steadily"
          : "imperceptibly";

    const baseNarrative = `From ${scene.planet}'s perspective:

The energy ${movement} shifts across the sky. 
${scene.theme}

Current Status: ${intensity} INTENSITY (${scene.intensity}%)
Movement: ${scene.movementDegrees > 0 ? "Forward" : "Retrograde"} ${Math.abs(scene.movementDegrees).toFixed(2)}°

The Plot Unfolds:
"${scene.plotTwist}"

Active Relationships: ${scene.aspectsActive.length} aspect(s)
${scene.aspectsActive.map((a) => `  • ${a.aspectType.toUpperCase()} (${a.orb.toFixed(1)}° orb)`).join("\n")}

Strength in Chart: ${(profile.strength * 100).toFixed(0)}%
Primary Domain: ${profile.primaryDomain || "Universal"}`;

    return baseNarrative;
  }

  private generateVisualCues(scene: PlanetaryScene): {
    lighting: string;
    atmosphere: string;
    colorPalette: string[];
  } {
    const PLANET_VISUALS: Record<
      string,
      {
        lighting: string;
        colors: string[];
        atmosphereIntense: string;
        atmosphereSubtle: string;
      }
    > = {
      SUN: {
        lighting: "Golden rays breaking through clouds",
        colors: ["#FFD700", "#FFA500", "#FF6B6B"],
        atmosphereIntense: "Blazing radiance consuming everything",
        atmosphereSubtle: "Gentle warmth spreading slowly",
      },
      MOON: {
        lighting: "Silvery glow casting soft shadows",
        colors: ["#E0E0E0", "#4A5568", "#667EEA"],
        atmosphereIntense: "Overwhelming emotional tide",
        atmosphereSubtle: "Quiet introspection and safety",
      },
      MERCURY: {
        lighting: "Quick flashes of electric insight",
        colors: ["#FFA500", "#FFD700", "#87CEEB"],
        atmosphereIntense: "Frantic communication overload",
        atmosphereSubtle: "Clear thoughts crystallizing",
      },
      VENUS: {
        lighting: "Soft romantic luminescence",
        colors: ["#00FF00", "#FFB6C1", "#DDA0DD"],
        atmosphereIntense: "Passionate magnetism intensified",
        atmosphereSubtle: "Graceful beauty emerging",
      },
      MARS: {
        lighting: "Red hot fire erupting",
        colors: ["#FF0000", "#8B0000", "#FF4500"],
        atmosphereIntense: "Explosive combative energy",
        atmosphereSubtle: "Determined purposeful drive",
      },
      JUPITER: {
        lighting: "Expansive benefic glow",
        colors: ["#9966FF", "#4169E1", "#FFD700"],
        atmosphereIntense: "Overwhelming abundance and luck",
        atmosphereSubtle: "Quiet blessings multiplying",
      },
      SATURN: {
        lighting: "Austere shadow and structure",
        colors: ["#696969", "#2F4F4F", "#808080"],
        atmosphereIntense: "Heavy oppressive responsibility",
        atmosphereSubtle: "Solid ground underfoot",
      },
      URANUS: {
        lighting: "Sudden electric shocks of light",
        colors: ["#00FFFF", "#00CED1", "#20B2AA"],
        atmosphereIntense: "Shocking revolutionary breakthrough",
        atmosphereSubtle: "Gradual awakening unfolds",
      },
      NEPTUNE: {
        lighting: "Dreamy diffused illumination",
        colors: ["#4169E1", "#9370DB", "#8A2BE2"],
        atmosphereIntense: "Overwhelming dissolving boundaries",
        atmosphereSubtle: "Mystical visions appearing",
      },
      PLUTO: {
        lighting: "Deep shadow with hidden light",
        colors: ["#8B0000", "#1a1a1a", "#4B0082"],
        atmosphereIntense: "Transformative death-rebirth",
        atmosphereSubtle: "Quiet psychological depth",
      },
    };

    const visuals = PLANET_VISUALS[scene.planet] || PLANET_VISUALS.SUN;
    const isIntense = scene.intensity > 60;

    return {
      lighting: visuals.lighting,
      atmosphere: isIntense
        ? visuals.atmosphereIntense
        : visuals.atmosphereSubtle,
      colorPalette: visuals.colors,
    };
  }

  private generateActionSequence(
    scene: PlanetaryScene,
    aspectCount: number,
  ): string {
    const actions: string[] = [];

    // Opening
    actions.push(
      `[SCENE OPENS] The ${scene.planet} descends onto the stage...`,
    );

    // Movement
    if (Math.abs(scene.movementDegrees) > 5) {
      actions.push(
        `[ACTION] Rapid movement across the celestial plane - ${Math.abs(scene.movementDegrees).toFixed(1)}° shift`,
      );
    } else {
      actions.push(
        `[PAUSE] A moment of stillness - introspection and consolidation`,
      );
    }

    // Relationships
    if (aspectCount > 0) {
      actions.push(
        `[INTERACTION] ${aspectCount} relationship(s) activate on stage`,
      );
    }

    // Climax
    if (scene.intensity > 70) {
      actions.push(
        `[CLIMAX] Energy peaks - ${scene.plotTwist.split(" ").slice(0, 5).join(" ")}...`,
      );
    } else if (scene.intensity > 40) {
      actions.push(`[BUILD] Tension rises slowly - plot thickens`);
    } else {
      actions.push(`[GENTLE] Subtle shifts beneath the surface`);
    }

    // Resolution
    actions.push(`[RESOLUTION] The transformation unfolds...`);

    return actions.join("\n");
  }

  private generateDialogue(
    mainPlanet: string,
    otherPlanet: string,
    aspectType: string,
  ): string {
    const dialogueMap: Record<
      string,
      Record<string, Record<string, string>>
    > = {
      SUN: {
        MOON: {
          conjunction:
            "SUN: 'I shine brightest when you reflect my light.' MOON: 'And I glow most tenderly when you warm my soul.'",
          square:
            "SUN: 'Why do you hide what I expose?' MOON: 'To protect what your brightness might burn.'",
          trine:
            "SUN: 'Your intuition guides my purpose.' MOON: 'And your direction gives my feelings meaning.'",
        },
        MERCURY: {
          conjunction:
            "SUN: 'Speak your truth clearly.' MERCURY: 'Your words will illuminate the way.'",
          square:
            "SUN: 'Your words scatter my focus.' MERCURY: 'Your intensity silences my voice.'",
          trine:
            "SUN: 'Tell my story to the world.' MERCURY: 'With clarity that shines bright.'",
        },
        VENUS: {
          conjunction:
            "SUN: 'You magnetize all I value.' VENUS: 'And you give my beauty purpose.'",
          square:
            "SUN: 'You compromise my authenticity.' VENUS: 'Your intensity threatens harmony.'",
          trine:
            "SUN: 'You dress my essence in grace.' VENUS: 'And you radiate what I cherish.'",
        },
      },
    };

    const aspectKey = aspectType.toLowerCase();
    return (
      dialogueMap[mainPlanet]?.[otherPlanet]?.[aspectKey] ||
      `${mainPlanet}: 'We meet in the dance of the cosmos.' ${otherPlanet}: 'Each step changes what we become.'`
    );
  }

  private determineRelationship(aspectType: string): string {
    const relationshipMap: Record<string, string> = {
      conjunction: "merger",
      sextile: "support",
      square: "tension",
      trine: "harmony",
      opposition: "polarity",
      quincunx: "adjustment",
    };
    return relationshipMap[aspectType.toLowerCase()] || "dynamic";
  }

  private calculateTension(aspect: NativityAspect): number {
    const tensionScores: Record<string, number> = {
      conjunction: 50,
      sextile: 20,
      square: 80,
      trine: 10,
      opposition: 70,
      quincunx: 60,
    };

    const baseTension = tensionScores[aspect.aspectType.toLowerCase()] || 50;
    const orbInfluence = Math.max(0, 8 - aspect.orbDistance) * 5;

    return Math.min(100, baseTension + orbInfluence);
  }
}
