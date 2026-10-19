import { z } from "zod";
import type { McpToolDef } from "../registry.js";

const foundersChartInputSchema = {
  foundingDateTime: z.coerce
    .date()
    .describe("Company founding moment as an ISO 8601 timestamp"),
  latitude: z.number().min(-90).max(90).describe("Founding location latitude"),
  longitude: z.number().min(-180).max(180).describe("Founding location longitude"),
  companyName: z.string().optional().describe("Company name for the reading"),
  coordinateSystem: z
    .enum(["SIDEREAL", "TROPICAL"])
    .optional()
    .describe("Zodiac system (default SIDEREAL)"),
};

const AXIS_LABELS: Record<string, string> = {
  valence: "emotional tone",
  arousal: "activation energy",
  agency: "action orientation",
  dominance: "assertiveness",
  coherence: "systematic thinking",
  stability: "emotional grounding",
  novelty: "openness to new experience",
  volatility: "emotional flux",
  abstraction: "conceptual thinking",
  symbolic_density: "symbolic richness",
  pattern_recognition: "pattern sensitivity",
  analyticity: "analytical mode",
  intuition: "intuitive perception",
  mental_speed: "cognitive tempo",
  focus: "attention concentration",
  diffusion: "awareness spread",
  past_orientation: "retrospective pull",
  present_orientation: "immediacy",
  future_orientation: "forward-looking",
  cyclicality: "rhythmic awareness",
  urgency: "time pressure",
  patience: "endurance",
  desire_intensity: "drive strength",
  attachment: "bonding tendency",
  avoidance: "withdrawal pattern",
  expansion: "growth impulse",
  contraction: "consolidation impulse",
  ambition: "achievement drive",
  survival_drive: "self-preservation",
  sociality: "social engagement",
  individuality: "autonomy",
  collectivism: "group orientation",
  relational_depth: "bonding depth",
  boundary_strength: "ego boundaries",
  empathy: "resonance capacity",
  dominance_social: "social authority",
  materiality: "material focus",
  spirituality: "transcendence orientation",
  sensory_density: "sensory engagement",
  idealism: "vision orientation",
  pragmatism: "practical grounding",
  integration: "wholeness",
  fragmentation: "dispersion",
  entropy: "dissolution tendency",
  adaptability: "flexibility",
  rigidity: "structure attachment",
  expressiveness: "outward flow",
  repression: "inward containment",
  reactivity: "impulse speed",
  responsiveness: "reception openness",
  meaning_orientation: "purpose seeking",
  identity_coherence: "self-continuity",
  transcendence: "beyond-self orientation",
  ego_density: "self-reference weight",
};

function describeAxisValue(axis: string, value: number): string {
  const abs = Math.abs(value);
  const label = AXIS_LABELS[axis] ?? axis;
  const strength =
    abs > 0.6 ? "strong" : abs > 0.3 ? "moderate" : abs > 0.1 ? "mild" : "neutral";
  const direction = value > 0.05 ? "elevated" : value < -0.05 ? "reduced" : "balanced";
  return `${label}: ${strength} ${direction} (${value.toFixed(3)})`;
}

export const computeFoundersChartTool: McpToolDef<
  typeof foundersChartInputSchema
> = {
  name: "compute_founders_chart",
  description:
    "Compute the founding chart for a company or organization. Takes the founding moment and location, computes the full natal chart with52-axis personality vectors, and returns an aggregated 'soul' profile with dominant axes and interpretive text. Use this when creating a company's identity or when hiring founding agents.",
  inputSchema: foundersChartInputSchema,
  handler: async ({
    foundingDateTime,
    latitude,
    longitude,
    companyName,
    coordinateSystem,
  }) => {
    // Dynamic import to avoid circular dependencies
    const { computePersonalityVectorsTool } = await import("./personality.js");

    const result = await computePersonalityVectorsTool.handler({
      birthDateTime: foundingDateTime,
      latitude,
      longitude,
      coordinateSystem,
    });

    const parsed = typeof result === "string" ? JSON.parse(result) : result;

    const dominant = parsed.dominantAxes as Array<{
      axis: string;
      value: number;
      label: string;
    }>;

    const agg = parsed.aggregate as Record<string, number>;

    const personalityTraits = dominant
      .slice(0, 6)
      .map((d) => {
        const val = agg[d.axis] ?? d.value;
        const abs = Math.abs(val);
        const strength = abs > 0.6 ? "very" : abs > 0.3 ? "moderately" : "slightly";
        const quality = val > 0 ? "high" : "low";
        return `${d.label}: ${strength} ${quality}`;
      })
      .join(", ");

    const emotionalTone = agg.valence ?? 0;
    const energyLevel = agg.arousal ?? 0;
    const actionStyle = agg.agency ?? 0;
    const thinkingStyle = agg.coherence ?? 0;

    const toneDesc =
      emotionalTone > 0.3
        ? "warm and optimistic"
        : emotionalTone < -0.3
          ? "serious and intense"
          : "balanced and measured";
    const energyDesc =
      energyLevel > 0.4
        ? "high-energy and dynamic"
        : energyLevel < 0.2
          ? "calm and deliberate"
          : "steady and adaptive";
    const actionDesc =
      actionStyle > 0.5
        ? "proactive and autonomous"
        : actionStyle < 0.2
          ? "reflective and consultative"
          : "situationally responsive";
    const thinkingDesc =
      thinkingStyle > 0.5
        ? "systematic and organized"
        : thinkingStyle < 0.2
          ? "intuitive and creative"
          : "flexibly analytical";

    const reading = [
      `## ${companyName ? companyName + " " : ""}Founding Chart`,
      "",
      `**Emotional Tone:** ${toneDesc} (valence: ${(agg.valence ?? 0).toFixed(3)})`,
      `**Energy Level:** ${energyDesc} (arousal: ${(agg.arousal ?? 0).toFixed(3)})`,
      `**Action Style:** ${actionDesc} (agency: ${(agg.agency ?? 0).toFixed(3)})`,
      `**Thinking Style:** ${thinkingDesc} (coherence: ${(agg.coherence ?? 0).toFixed(3)})`,
      "",
      "### Dominant Axes",
      ...dominant.map((d) => `- ${describeAxisValue(d.axis, agg[d.axis] ?? d.value)}`),
      "",
      "### Derived Metrics",
      `- Symbolic Pressure: ${parsed.derivedMetrics.symbolicPressure.toFixed(3)} (creative tension)`,
      `- Tension Level: ${parsed.derivedMetrics.tensionLevel.toFixed(3)} (aspect-driven friction)`,
      `- Integration Difficulty: ${parsed.derivedMetrics.integrationDifficulty.toFixed(3)} (challenge of wholeness)`,
      `- Manifestation Strength: ${parsed.derivedMetrics.manifestationStrength.toFixed(3)} (capacity to actualize)`,
      "",
      "### Aggregate Vector",
      ...Object.entries(agg)
        .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
        .slice(0, 10)
        .map(([axis, val]) => `- ${AXIS_LABELS[axis] ?? axis}: ${val.toFixed(4)}`),
    ].join("\n");

    return {
      companyName: companyName ?? "Unknown",
      foundingDateTime: parsed.birthDateTime,
      coordinateSystem: parsed.coordinateSystem,
      latitude: parsed.latitude,
      longitude: parsed.longitude,
      aggregate: parsed.aggregate,
      dominantAxes: parsed.dominantAxes,
      derivedMetrics: parsed.derivedMetrics,
      perPlanet: parsed.perPlanet,
      reading,
    };
  },
};
