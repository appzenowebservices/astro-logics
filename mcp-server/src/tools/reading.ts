import { z } from "zod";
import type { McpToolDef } from "../registry.js";
import {
  StoryGenerator,
  type NativityContext,
} from "~/server/services/storyGenerator";

const chartSchema = z.object({
  planets: z
    .array(
      z.object({
        planet: z.string(),
        longitude: z.number(),
        latitude: z.number().nullable().optional(),
        speed: z.number(),
        direction: z.string(),
        houseCusp: z.number(),
        houseSign: z.string(),
      }),
    )
    .describe("The planets array from compute_natal_chart"),
  aspects: z
    .array(
      z.object({
        planet1: z.string(),
        planet2: z.string(),
        aspectType: z.string(),
        orbDistance: z.number(),
        isApplying: z.boolean(),
        exactnessScore: z.number(),
      }),
    )
    .describe("The aspects array from compute_natal_chart"),
  planetaryProfiles: z
    .array(
      z.object({
        planet: z.string(),
        primaryDomain: z.string().optional(),
        secondaryDomain: z.string().nullable().optional(),
        strength: z.number(),
        dignity: z.string().optional(),
      }),
    )
    .describe("The planetaryProfiles array from compute_natal_chart"),
});

function buildNativityContext(chart: z.infer<typeof chartSchema>): NativityContext {
  return {
    planets: chart.planets.map((p) => ({
      planet: p.planet,
      longitude: p.longitude,
      latitude: p.latitude ?? null,
      speed: p.speed,
      direction: p.direction,
      houseCusp: p.houseCusp,
      houseSign: p.houseSign,
    })),
    aspects: chart.aspects.map((a) => ({
      planet1: a.planet1,
      planet2: a.planet2,
      aspectType: a.aspectType,
      orbDistance: a.orbDistance,
      isApplying: a.isApplying,
      exactnessScore: a.exactnessScore,
    })),
    planetaryProfiles: chart.planetaryProfiles.map((p) => ({
      planet: p.planet,
      primaryDomain: p.primaryDomain ?? "",
      secondaryDomain: p.secondaryDomain ?? null,
      strength: p.strength,
      dignity: p.dignity ?? "Neutral",
    })),
  };
}

const readingInputSchema = {
  chart: chartSchema.describe(
    "The chart object returned by compute_natal_chart. Pass it back as-is.",
  ),
  prompt: z
    .string()
    .optional()
    .describe(
      "Optional focus for the reading, e.g. 'career', 'relationships', 'what is the dominant pressure right now'",
    ),
};

export const generateReadingTool: McpToolDef<typeof readingInputSchema> = {
  name: "generate_reading",
  description:
    "Generate a final astrology reading from a natal chart (as returned by compute_natal_chart). The LLM interpretation runs server-side and returns finished prose.",
  inputSchema: readingInputSchema,
  handler: async ({ chart, prompt }) => {
    const context = buildNativityContext(chart);
    const generator = new StoryGenerator({
      useLocal: process.env.USE_LOCAL_LLM === "true",
      baseUrl: process.env.LLAMA_CPP_URL || "http://localhost:8000",
      model: process.env.LLAMA_CPP_MODEL || "local-gguf-model",
      timeoutMs: process.env.LLM_TIMEOUT_MS
        ? Number(process.env.LLM_TIMEOUT_MS)
        : undefined,
      maxContextTokens: process.env.LLM_MAX_CONTEXT
        ? Number(process.env.LLM_MAX_CONTEXT)
        : 1_000_000,
    });
    const reading = await generator.generateStory(context, prompt);
    return { reading };
  },
};
