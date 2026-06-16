/**
 * Personality Projector: Translate TITAN outputs → Human perception
 *
 * This service converts DomainInterpretation[] into PersonalityState,
 * bridging logic and perception without hallucination.
 *
 * It is the ONLY layer that can feed UI and LLMs.
 */

import {
  type DomainInterpretation,
  type PersonalityState,
  type LlmConstraints,
  type PlanetName,
} from "~/types/titans";

// ============================================================================
// COLOR PALETTE DEFINITIONS
// ============================================================================

const planetColorMap: Record<PlanetName, string[]> = {
  SUN: ["#FFD700", "#FFA500", "#FF8C00"],
  MOON: ["#E0E0E0", "#B0B0B0", "#808080"],
  MERCURY: ["#87CEEB", "#4169E1", "#0047AB"],
  VENUS: ["#FFB6C1", "#FF69B4", "#FF1493"],
  MARS: ["#DC143C", "#B22222", "#8B0000"],
  JUPITER: ["#DAA520", "#CD853F", "#8B4513"],
  SATURN: ["#696969", "#556B2F", "#2F4F4F"],
  URANUS: ["#00CED1", "#20B2AA", "#008B8B"],
  NEPTUNE: ["#4169E1", "#6495ED", "#7B68EE"],
  PLUTO: ["#2F4F4F", "#1C1C1C", "#4B0082"],
  MEAN_NODE: ["#FF6347", "#FF4500", "#FF8C00"],
  TRUE_NODE: ["#FF6347", "#FF4500", "#FF8C00"],
};

// ============================================================================
// PERSONALITY PROJECTOR SERVICE
// ============================================================================

export class PersonalityProjector {
  /**
   * Project TITAN interpretations into a unified PersonalityState
   */
  static project(
    chartId: string,
    timestamp: number,
    titanInterpretations: DomainInterpretation[],
  ): PersonalityState {
    // Sort by authority score (descending)
    const sorted = [...titanInterpretations].sort(
      (a, b) => b.authorityScore - a.authorityScore,
    );

    // Top 3 TITANs are dominant
    const dominantTitans = sorted.slice(0, 3).map((ti) => ({
      planet: ti.planet,
      authorityScore: ti.authorityScore,
    }));

    // Aggregate emotional vector
    const emotionalVector = this.aggregateEmotionalVector(titanInterpretations);

    // Aggregate behavioral biases
    const behavioralBiases =
      this.aggregateBehavioralBiases(titanInterpretations);

    // Expression profile (how to manifest this state)
    const expressionProfile =
      this.calculateExpressionProfile(titanInterpretations);

    // Visual influences (posture, gaze, animation)
    const visualInfluences =
      this.calculateVisualInfluences(titanInterpretations);

    return {
      chartId,
      timestamp,
      dominantTitans,
      emotionalVector,
      behavioralBiases,
      expressionProfile,
      visualInfluences,
    };
  }

  /**
   * Calculate aggregate emotional vector
   */
  private static aggregateEmotionalVector(
    interpretations: DomainInterpretation[],
  ): PersonalityState["emotionalVector"] {
    const avgIntensity =
      interpretations.reduce((sum, ti) => sum + ti.energyLevel, 0) /
      interpretations.length;

    const volatility =
      interpretations.reduce((sum, ti) => sum + ti.tension, 0) /
      interpretations.length;

    const focus =
      interpretations.reduce((sum, ti) => sum + ti.clarity, 0) /
      interpretations.length;

    return {
      intensity: Math.min(100, avgIntensity),
      volatility: Math.min(100, volatility),
      focus: Math.min(100, focus),
    };
  }

  /**
   * Aggregate behavioral biases across all TITANs
   */
  private static aggregateBehavioralBiases(
    interpretations: DomainInterpretation[],
  ): string[] {
    const biasSet = new Set<string>();
    const biasFrequency = new Map<string, number>();

    for (const ti of interpretations) {
      for (const bias of ti.decisionBiases) {
        biasFrequency.set(bias, (biasFrequency.get(bias) ?? 0) + 1);
      }
    }

    // Include biases that appear in at least 2 TITANs or dominant TITANs
    const sorted = [...interpretations].sort(
      (a, b) => b.authorityScore - a.authorityScore,
    );
    const dominantPlanets = new Set(sorted.slice(0, 3).map((ti) => ti.planet));

    for (const [bias, count] of biasFrequency.entries()) {
      if (
        count >= 2 ||
        sorted.some(
          (ti) =>
            dominantPlanets.has(ti.planet) && ti.decisionBiases.includes(bias),
        )
      ) {
        biasSet.add(bias);
      }
    }

    return Array.from(biasSet);
  }

  /**
   * Calculate how this state should be expressed (motion, tempo, colors)
   */
  private static calculateExpressionProfile(
    interpretations: DomainInterpretation[],
  ): PersonalityState["expressionProfile"] {
    const avgEnergy =
      interpretations.reduce((sum, ti) => sum + ti.energyLevel, 0) /
      interpretations.length;

    const avgTension =
      interpretations.reduce((sum, ti) => sum + ti.tension, 0) /
      interpretations.length;

    // Motion style based on tension
    let motionStyle: "sharp" | "fluid" | "restrained";
    if (avgTension > 70) {
      motionStyle = "sharp";
    } else if (avgTension < 30) {
      motionStyle = "fluid";
    } else {
      motionStyle = "restrained";
    }

    // Tempo based on energy
    const tempo = Math.min(1, avgEnergy / 100);

    // Color palette from dominant TITANs
    const sorted = [...interpretations].sort(
      (a, b) => b.authorityScore - a.authorityScore,
    );
    const colorPalette = sorted
      .slice(0, 3)
      .flatMap((ti) => planetColorMap[ti.planet] ?? [])
      .slice(0, 9);

    return {
      motionStyle,
      tempo,
      colorPalette,
    };
  }

  /**
   * Calculate visual constraints (posture, gaze, idle animation)
   */
  private static calculateVisualInfluences(
    interpretations: DomainInterpretation[],
  ): PersonalityState["visualInfluences"] {
    const avgEnergy =
      interpretations.reduce((sum, ti) => sum + ti.energyLevel, 0) /
      interpretations.length;

    const avgAgency =
      interpretations.reduce((sum, ti) => sum + ti.agency, 0) /
      interpretations.length;

    const hasRetrograde = interpretations.some((ti) =>
      ti.constraintFlags.includes("retrograde"),
    );

    // Posture based on energy
    let posture: "upright" | "tilted" | "bent" | "prostrate";
    if (avgEnergy > 80) {
      posture = "upright";
    } else if (avgEnergy > 50) {
      posture = "tilted";
    } else if (avgEnergy > 25) {
      posture = "bent";
    } else {
      posture = "prostrate";
    }

    // Gaze direction based on agency and retrograde
    let gazeDirection: "forward" | "skyward" | "inward" | "downward";
    if (hasRetrograde) {
      gazeDirection = "inward";
    } else if (avgAgency > 75) {
      gazeDirection = "forward";
    } else if (avgAgency > 50) {
      gazeDirection = "skyward";
    } else {
      gazeDirection = "downward";
    }

    // Idle animation style based on tension
    const avgTension =
      interpretations.reduce((sum, ti) => sum + ti.tension, 0) /
      interpretations.length;

    let idleAnimationStyle: "steady" | "fidgeting" | "restless" | "still";
    if (avgTension > 75) {
      idleAnimationStyle = "restless";
    } else if (avgTension > 50) {
      idleAnimationStyle = "fidgeting";
    } else if (avgTension < 25) {
      idleAnimationStyle = "still";
    } else {
      idleAnimationStyle = "steady";
    }

    return {
      posture,
      gazeDirection,
      idleAnimationStyle,
    };
  }

  /**
   * Derive LLM constraints from TITAN interpretations
   *
   * Limits what an LLM can say and how to say it based on planetary state.
   */
  static deriveLlmConstraints(
    interpretation: DomainInterpretation,
  ): LlmConstraints {
    const temperamentFlags = this.extractTemperamentFlags(interpretation);
    const forbiddenTopics = this.extractForbiddenTopics(interpretation);
    const requiredQualifiers = this.extractRequiredQualifiers(interpretation);
    const toneGuidance = this.calculateToneGuidance(interpretation);

    return {
      planet: interpretation.planet,
      domain: interpretation.domain,
      temperamentFlags,
      forbiddenTopics,
      requiredQualifiers,
      toneGuidance,
    };
  }

  /**
   * Extract temperament flags from interpretation
   */
  private static extractTemperamentFlags(
    interpretation: DomainInterpretation,
  ): string[] {
    const flags: string[] = [];

    if (interpretation.energyLevel > 80) {
      flags.push("assertive", "confident");
    } else if (interpretation.energyLevel < 30) {
      flags.push("reserved", "cautious");
    }

    if (interpretation.tension > 70) {
      flags.push("defensive", "reactive");
    }

    if (interpretation.agency > 75) {
      flags.push("proactive", "autonomous");
    }

    if (interpretation.constraintFlags.includes("retrograde")) {
      flags.push("introspective", "reflective");
    }

    return flags;
  }

  /**
   * What topics can the LLM NOT discuss
   */
  private static extractForbiddenTopics(
    interpretation: DomainInterpretation,
  ): string[] {
    const forbidden: string[] = ["prediction", "certainty", "control"];

    // Saturn = authority on limits, not predictions
    if (interpretation.planet === "SATURN") {
      forbidden.push("promises", "guarantees");
    }

    // Debilitated planets should avoid confident claims
    if (interpretation.constraintFlags.includes("debilitated")) {
      forbidden.push("expertise", "authority");
    }

    return forbidden;
  }

  /**
   * Qualifiers the LLM MUST use (hedging language)
   */
  private static extractRequiredQualifiers(
    interpretation: DomainInterpretation,
  ): string[] {
    const qualifiers: string[] = [];

    if (interpretation.tension > 60) {
      qualifiers.push("perhaps", "possibly", "may");
    }

    if (interpretation.clarity < 50) {
      qualifiers.push("unclear", "suggests", "tends");
    }

    if (interpretation.constraintFlags.includes("retrograde")) {
      qualifiers.push("internally", "subconsciously", "in reflection");
    }

    return qualifiers;
  }

  /**
   * Tone guidance for LLM (aggression, compassion, clarity, mystery)
   */
  private static calculateToneGuidance(
    interpretation: DomainInterpretation,
  ): LlmConstraints["toneGuidance"] {
    const marsTitan = interpretation.planet === "MARS";
    const moonTitan = interpretation.planet === "MOON";
    const saturnTitan = interpretation.planet === "SATURN";

    return {
      aggression: marsTitan
        ? Math.min(interpretation.energyLevel / 100, 1)
        : 0.2,
      compassion: moonTitan ? 0.8 : saturnTitan ? 0.3 : 0.5,
      clarity: interpretation.clarity / 100,
      mystery: 1 - interpretation.clarity / 100,
    };
  }
}
