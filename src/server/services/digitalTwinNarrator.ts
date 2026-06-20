import { createProvider } from "../../../llm/providers/provider";
import chalk from "chalk";

export interface MarketEvent {
  type: string;
  strength: number;
  confidence: number;
  narrative: string;
  time: number;
  astroContext?: any;
}

export interface AstroState {
  planetaryPressure?: number;
  aspectTension?: number;
  ingressProximity?: number;
  retrogradeInfluence?: number;
  speedDispersion?: number;
  elementalImbalance?: number;
  lunarPhase?: number;
  confidence?: number;
  dominantTransitPlanets?: string[];
  dominantLatentAxes?: Array<{ axis: string; value: number }>;
  narrative?: string;
}

export interface MarketNarrativeInput {
  symbol: string;
  timeframe: string;
  events: MarketEvent[];
  astroState: AstroState | null | undefined;
  marketContext?: {
    priceRange: { min: number; max: number };
    direction: "up" | "down" | "sideways";
    volatility: number;
  };
}

export interface MarketNarrative {
  digitalTwinVoice: string;
  marketPersonality: string;
  transitInfluences: string[];
  behavioralReading: string;
  tradingImplication: string;
  confidence: number;
  timestamp: number;
}

export async function generateMarketNarrative(
  input: MarketNarrativeInput,
): Promise<MarketNarrative> {
  const llm = createProvider({ provider: "openrouter" });

  const eventsSummary = input.events
    .slice(0, 10)
    .map((e) => `${e.type}: strength=${e.strength?.toFixed(2) ?? 0.5}, narrative="${e.narrative ?? ""}"`)
    .join("\n");

  const astroSummary = input.astroState
    ? `Dominant planets: ${input.astroState.dominantTransitPlanets?.join(", ") || "none"}
  Latent axes: ${input.astroState.dominantLatentAxes?.map((a) => `${a.axis}: ${a.value?.toFixed(2) ?? 0}`).join(", ") || "balanced"}
  Astro narrative: ${input.astroState.narrative || "neutral"}
  Pressure: ${(input.astroState.planetaryPressure ?? 0.5).toFixed(2)}, Aspect tension: ${(input.astroState.aspectTension ?? 0.3).toFixed(2)}`
    : "No astro state available";

  const prompt = `
You are a market astrologer - interpreting financial markets as living entities with astrological personalities.

SYMBOL: ${input.symbol}
TIMEFRAME: ${input.timeframe}

MARKET EVENTS (last 10):
${eventsSummary}

ASTROLOGICAL STATE:
${astroSummary}

MARKET CONTEXT:
${JSON.stringify(input.marketContext || {})}

TASK: Generate a narrative describing what this market is "thinking and feeling" right now. 
Think of ${input.symbol} as a living entity with its own personality, shaped by its natal astrological chart (created at asset birth).
Current transiting planets represent life experiences the market is going through.

Generate the following fields as JSON:

1. digitalTwinVoice: A first-person narrative from the market's perspective ("I am feeling...", "I am pushing...", "I want to...")
2. marketPersonality: The asset's astrological personality type based on its natal chart
3. transitInfluences: Array of active transit influences affecting the market
4. behavioralReading: What the market is actually doing based on the events
5. tradingImplication: What a trader should watch for based on this reading
6. confidence: Confidence score 0-1 based on clarity of the reading

Style: Grounded, practical, human behavioral dynamics - NOT cosmic, spiritual, or mystical language.
Focus on observable market behavior and how astrological pressures manifest as price action.

Return ONLY valid JSON.
`;

  try {
    const response = await llm.generate({
      system: 'You are a market astrologer expert. Output ONLY valid JSON with the required fields. No markdown, no comments.',
      user: prompt,
    });

    let text = response.text.trim();
    text = text.replace(/^```json?\s*\n?/, "").replace(/\n?\s*```$/, "");

    const parsed = JSON.parse(text);
    return {
      digitalTwinVoice: parsed.digitalTwinVoice || "The market is stable with minor fluctuations.",
      marketPersonality: parsed.marketPersonality || "Balanced and methodical",
      transitInfluences: parsed.transitInfluences || [],
      behavioralReading: parsed.behavioralReading || "Price action shows consolidation.",
      tradingImplication: parsed.tradingImplication || "Watch for breakout confirmation.",
      confidence: parsed.confidence ?? 0.7,
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error(chalk.red("[NARRATOR] Failed to generate narrative:"), error);
    return {
      digitalTwinVoice: "Market conditions are evolving with mixed signals.",
      marketPersonality: "Adaptive and responsive",
      transitInfluences: ["Mercury direct", "Venus steady"],
      behavioralReading: "Events show alternating bullish and bearish pressure.",
      tradingImplication: "Wait for clearer directional confirmation.",
      confidence: 0.5,
      timestamp: Date.now(),
    };
  }
}

export async function generateNarrativesBatch(
  symbol: string,
  timeframe: string,
  windowEvents: Map<number, MarketEvent[]>,
  astroEvolution: AstroState[],
): Promise<Map<number, MarketNarrative>> {
  const narratives = new Map<number, MarketNarrative>();

  for (const [timestamp, events] of windowEvents.entries()) {
    const astroState = astroEvolution.find(
      (a, i) => i < astroEvolution.length && astroEvolution[i].confidence > 0,
    );

    const narrative = await generateMarketNarrative({
      symbol,
      timeframe,
      events,
      astroState,
    });

    narratives.set(timestamp, narrative);
  }

  return narratives;
}