/**
 * LLM Constraint Enforcer: Ensure LLM outputs respect TITAN state boundaries
 *
 * Rules:
 * - LLMs receive PersonalityState + LlmConstraints
 * - Outputs are validated against constraints
 * - Forbidden topics are filtered
 * - Required qualifiers are injected
 * - Memory writes are gated through MemoryGateway
 */

import {
  type PersonalityState,
  type LlmConstraints,
  type MemoryIntent,
} from "~/types/titans";
import { MemoryGateway } from "./memoryGateway";

// ============================================================================
// LLM CONSTRAINT ENFORCER
// ============================================================================

export interface LlmDialogueRequest {
  chartId: string;
  planet: string;
  personalityState: PersonalityState;
  constraints: LlmConstraints;
  userPrompt: string;
  model: "ollama" | "gemini" | "claude";
}

export interface LlmDialogueResponse {
  text: string; // Constrained dialogue
  memoryIntent: MemoryIntent; // What to store
  warnings: string[]; // Constraint violations found
  approved: boolean; // Is this safe to use?
}

export class LlmConstraintEnforcer {
  /**
   * Validate LLM output against TITAN constraints
   *
   * This is the gatekeeper between LLM and user-facing content.
   */
  static async validateDialogue(
    response: string,
    request: LlmDialogueRequest,
  ): Promise<LlmDialogueResponse> {
    const warnings: string[] = [];
    let approved = true;

    // Check for forbidden topics
    const forbiddenViolations = this.checkForbiddenTopics(
      response,
      request.constraints.forbiddenTopics,
    );
    if (forbiddenViolations.length > 0) {
      warnings.push(
        `Forbidden topics detected: ${forbiddenViolations.join(", ")}`,
      );
      approved = false;
    }

    // Check for required qualifiers
    const qualifierViolations = this.checkRequiredQualifiers(
      response,
      request.constraints.requiredQualifiers,
    );
    if (qualifierViolations && qualifierViolations.length < 2) {
      warnings.push(
        `Missing required qualifiers for this state. Expected use of: ${request.constraints.requiredQualifiers.join(", ")}`,
      );
      // Don't fail approval for missing qualifiers, but warn
    }

    // Create memory intent (narrative, not fact)
    const memoryIntent: MemoryIntent = {
      type: "NARRATIVE",
      content: response,
      source: "LLM",
      authoritative: false, // LLMs never create facts
      timestamp: Date.now(),
    };

    // Validate memory authority
    const authorityOk = await MemoryGateway.enforceAuthority(
      "LLM",
      memoryIntent,
    );
    if (!authorityOk) {
      warnings.push(
        "Memory authority violation: LLM attempted unauthorized write",
      );
      approved = false;
    }

    return {
      text: approved ? response : this.sanitizeDialogue(response, request),
      memoryIntent,
      warnings,
      approved,
    };
  }

  /**
   * Inject constraints into the LLM prompt (pre-generation)
   *
   * This shapes what the LLM generates before it runs.
   */
  static buildConstrainedPrompt(
    userPrompt: string,
    request: LlmDialogueRequest,
  ): string {
    const { planet, constraints, personalityState } = request;

    const systemPrompt = `
You are channeling the voice of ${planet}, a planetary intelligence in the natal chart.

## Planetary State (Facts)
- Energy Level: ${personalityState.emotionalVector.intensity}/100
- Clarity: ${personalityState.emotionalVector.focus}/100
- Volatility: ${personalityState.emotionalVector.volatility}/100

## Temperament Flags
${constraints.temperamentFlags.map((f) => `- ${f}`).join("\n")}

## What You CANNOT Say
${constraints.forbiddenTopics.map((t) => `- NO ${t}`).join("\n")}

## How You MUST Speak
${constraints.requiredQualifiers.map((q) => `- Use "${q}" when uncertain`).join("\n")}

## Tone Guidance
- Assertiveness: ${(constraints.toneGuidance.aggression * 100).toFixed(0)}%
- Compassion: ${(constraints.toneGuidance.compassion * 100).toFixed(0)}%
- Clarity: ${(constraints.toneGuidance.clarity * 100).toFixed(0)}%
- Mystery: ${(constraints.toneGuidance.mystery * 100).toFixed(0)}%

## Critical Rule
You are describing a pattern or tendency, not declaring truth.
You are offering perspective, not prediction.
You are naming what is human about this planetary influence, not controlling it.

Now, respond to the user's question:
${userPrompt}
`;

    return systemPrompt;
  }

  /**
   * Check if response violates forbidden topics
   */
  private static checkForbiddenTopics(
    response: string,
    forbiddenTopics: string[],
  ): string[] {
    const violations: string[] = [];
    const lowerResponse = response.toLowerCase();

    for (const topic of forbiddenTopics) {
      if (lowerResponse.includes(topic.toLowerCase())) {
        violations.push(topic);
      }
    }

    return violations;
  }

  /**
   * Check if response includes required qualifiers
   */
  private static checkRequiredQualifiers(
    response: string,
    requiredQualifiers: string[],
  ): string[] {
    const found: string[] = [];
    const lowerResponse = response.toLowerCase();

    for (const qualifier of requiredQualifiers) {
      if (lowerResponse.includes(qualifier.toLowerCase())) {
        found.push(qualifier);
      }
    }

    return found;
  }

  /**
   * Sanitize dialogue that violates constraints
   *
   * Removes forbidden content and injects qualifiers.
   */
  private static sanitizeDialogue(
    response: string,
    request: LlmDialogueRequest,
  ): string {
    let sanitized = response;
    const { constraints } = request;

    // Remove forbidden topics
    for (const topic of constraints.forbiddenTopics) {
      const regex = new RegExp(topic, "gi");
      sanitized = sanitized.replace(regex, "[REDACTED]");
    }

    // Inject required qualifiers if missing
    const missingQualifiers = constraints.requiredQualifiers.filter(
      (q) => !sanitized.toLowerCase().includes(q.toLowerCase()),
    );

    if (missingQualifiers.length > 0) {
      const qualifier = missingQualifiers[0];
      sanitized = `${qualifier}, ${sanitized.toLowerCase()}`;
    }

    return sanitized;
  }

  /**
   * Build system prompt for dialogue generation
   */
  static systemPrompt(request: LlmDialogueRequest): string {
    return this.buildConstrainedPrompt(request.userPrompt, request);
  }

  /**
   * Log constraint enforcement action
   */
  static async logEnforcement(
    chartId: string,
    planet: string,
    action: "approved" | "sanitized" | "rejected",
    reason?: string,
  ): Promise<void> {
    console.log(
      `[LlmConstraintEnforcer] ${planet} dialogue ${action} for chart ${chartId}${
        reason ? `: ${reason}` : ""
      }`,
    );
    // TODO: Store audit log in database
  }
}
