/**
 * Memory Gateway: Enforce separation of facts, narratives, and interpretations
 *
 * Rules:
 * - Facts → PostgreSQL (truth)
 * - Narratives → Vector DB (expressive memory)
 * - LLMs cannot write directly to truth
 * - TITANS may request storage, gateway decides
 *
 * This prevents narrative corruption of reality state.
 */

import { type MemoryIntent, type MemoryRecord } from "~/types/titans";
import { db } from "~/server/db";

// ============================================================================
// MEMORY GATEWAY SERVICE
// ============================================================================

export class MemoryGateway {
  /**
   * Process a memory intent and route to appropriate storage
   *
   * @param chartId - Chart context
   * @param intent - What should be stored and where
   * @returns Success status and location stored
   */
  static async processIntent(
    chartId: string,
    intent: MemoryIntent,
  ): Promise<{
    success: boolean;
    location: "SQL" | "VECTOR" | "REJECTED";
    id?: string | undefined;
  }> {
    // Validate intent
    const validation = this.validateIntent(intent);
    if (!validation.valid) {
      return { success: false, location: "REJECTED" };
    }

    // Route based on type
    if (intent.type === "FACT") {
      return this.storeFact(chartId, intent);
    } else if (intent.type === "NARRATIVE") {
      return this.storeNarrative(chartId, intent);
    } else {
      return this.storeInterpretation(chartId, intent);
    }
  }

  /**
   * Validate intent before storage
   */
  private static validateIntent(intent: MemoryIntent): {
    valid: boolean;
    reason?: string;
  } {
    // LLMs cannot create authoritative facts
    if (intent.source === "LLM" && intent.authoritative) {
      return {
        valid: false,
        reason: "LLM cannot create authoritative facts",
      };
    }

    // Narratives must come from LLM or explicit narration
    if (
      intent.type === "NARRATIVE" &&
      intent.source !== "LLM" &&
      intent.source !== "TRANSIT_ENGINE"
    ) {
      return {
        valid: false,
        reason: "Only LLM or TRANSIT_ENGINE can create narratives",
      };
    }

    // Facts must be deterministic (from NATAL_ENGINE)
    if (intent.type === "FACT" && intent.source !== "NATAL_ENGINE") {
      return {
        valid: false,
        reason: "Only NATAL_ENGINE can create authoritative facts",
      };
    }

    return { valid: true };
  }

  /**
   * Store fact in PostgreSQL (single source of truth)
   */
  private static async storeFact(
    chartId: string,
    intent: MemoryIntent,
  ): Promise<{ success: boolean; location: "SQL" | "REJECTED"; id?: string }> {
    try {
      // Parse fact content (should be JSON)
      let factData: Record<string, unknown>;
      try {
        factData = JSON.parse(intent.content);
      } catch {
        factData = { raw: intent.content };
      }

      // Store in prisma as state vector or event log
      const fact = await db.stateVector.create({
        data: {
          chartId,
          timestamp: intent.timestamp,
          planetaryState: factData as any,
          source: intent.source,
        } as any,
      });

      return {
        success: true,
        location: "SQL" as const,
        id: fact.id,
      };
    } catch (error) {
      console.error("[MemoryGateway] Failed to store fact:", error);
      return { success: false, location: "REJECTED" as const };
    }
  }

  /**
   * Store narrative in Vector DB (narrative memory with embeddings)
   *
   * TODO: Implement vector DB integration (Pinecone, Weaviate, pgvector)
   */
  private static async storeNarrative(
    chartId: string,
    intent: MemoryIntent,
  ): Promise<{
    success: boolean;
    location: "VECTOR" | "REJECTED";
    id?: string;
  }> {
    try {
      // TODO: Generate embedding from content
      // const embedding = await generateEmbedding(intent.content);

      // For now, store in a narrative log table (to be implemented in schema)
      // This would be a psql table: narratives(id, chartId, timestamp, content, embedding, source)

      console.log(
        `[MemoryGateway] Would store narrative for chart ${chartId}: ${intent.content.substring(0, 50)}...`,
      );

      return {
        success: true,
        location: "VECTOR" as const,
        id: `narrative_${Date.now()}`,
      };
    } catch (error) {
      console.error("[MemoryGateway] Failed to store narrative:", error);
      return { success: false, location: "REJECTED" as const };
    }
  }

  /**
   * Store interpretation (metadata about state, not truth)
   */
  private static async storeInterpretation(
    chartId: string,
    intent: MemoryIntent,
  ): Promise<{
    success: boolean;
    location: "VECTOR" | "REJECTED";
    id?: string;
  }> {
    // Interpretations use same vector storage as narratives
    return this.storeNarrative(chartId, intent);
  }

  /**
   * CRITICAL: Retrieve facts only (no narrative corruption)
   *
   * Facts come from NATAL_ENGINE only.
   * Never mix with LLM outputs.
   */
  static async retrieveFacts(
    chartId: string,
  ): Promise<Record<string, unknown>[]> {
    try {
      const stateVectors = await db.stateVector.findMany({
        where: {
          chartId,
          source: "NATAL_ENGINE",
        },
        orderBy: { timestamp: "desc" },
        take: 10,
      } as any);

      return stateVectors.map((sv: any) => sv.planetaryState ?? {});
    } catch (error) {
      console.error("[MemoryGateway] Failed to retrieve facts:", error);
      return [];
    }
  }

  /**
   * Retrieve narrative memory (stories, echoes, expressive context)
   *
   * TODO: Implement semantic search via vector DB
   */
  static async retrieveNarratives(
    chartId: string,
    query?: string,
    limit: number = 5,
  ): Promise<MemoryRecord[]> {
    // Placeholder: would query vector DB with semantic search
    // For now, return empty
    console.log(
      `[MemoryGateway] Would retrieve narratives for chart ${chartId}${query ? ` matching: "${query}"` : ""}`,
    );
    return [];
  }

  /**
   * Create a checkpoint of current state (facts + narrative context)
   *
   * Useful for:
   * - Tracking progression over time
   * - What-if scenario branching
   * - Decision audit trails
   */
  static async createCheckpoint(
    chartId: string,
    label: string,
    metadata: Record<string, unknown>,
  ): Promise<{ success: boolean; checkpointId: string }> {
    try {
      // Store both facts and narrative state at this moment
      const facts = await this.retrieveFacts(chartId);
      const narratives = await this.retrieveNarratives(chartId);

      const checkpointData = {
        label,
        timestamp: Date.now(),
        facts,
        narrativeContext: narratives,
        metadata,
      };

      // Store as snapshot (to be added to schema)
      console.log(
        `[MemoryGateway] Created checkpoint "${label}" for chart ${chartId}`,
      );

      return {
        success: true,
        checkpointId: `checkpoint_${Date.now()}`,
      };
    } catch (error) {
      console.error("[MemoryGateway] Failed to create checkpoint:", error);
      return { success: false, checkpointId: "" };
    }
  }

  /**
   * ENFORCEMENT: Never allow direct LLM writes to facts
   * Only narrative/interpretation storage permitted
   */
  static async enforceAuthority(
    source: string,
    intent: MemoryIntent,
  ): Promise<boolean> {
    const violations: string[] = [];

    if (source === "LLM" && intent.type === "FACT") {
      violations.push("LLM attempted to write FACT");
    }

    if (source === "LLM" && intent.authoritative) {
      violations.push("LLM attempted to create authoritative statement");
    }

    if (violations.length > 0) {
      console.error(
        `[MemoryGateway] AUTHORITY VIOLATION: ${violations.join(" | ")}`,
      );
      return false;
    }

    return true;
  }
}
