import { createProvider } from "~/../llm/providers/provider";

export interface MarketInferenceInput {
  symbol: string;
  timeframe: string;
  trend: {
    trendSlope: number;
    trendStrength: number;
    structuralConsistency: number;
    confidence: number;
  };
  volatility: {
    normalizedATR: number;
    expansionScore: number;
    contractionScore: number;
    confidence: number;
  };
  compression: {
    compression: number;
    expansionRisk: number;
    directionalBias: number;
  };
  liquidity: {
    liquidityDensity: number;
    liquidityImbalance: number;
    liquidityAccessibility: number;
    buySideLiquidity: number;
    sellSideLiquidity: number;
    buySideSweepRisk: number;
    sellSideSweepRisk: number;
    confidence: number;
  };
  astro: {
    planetaryPressure: number;
    aspectTension: number;
    ingressProximity: number;
    retrogradeInfluence: number;
    speedDispersion: number;
    elementalImbalance: number;
    lunarPhase: number;
    confidence: number;
    dominantLatentAxes?: Array<{ axis: string; value: number }>;
    dominantTransitPlanets?: string[];
    narrative?: string;
  };
  recentEvents: Array<{
    type: string;
    strength?: number;
    confidence: number;
    narrative?: string;
  }>;
}

export interface MarketInferenceOutput {
  marketBias: "BULLISH" | "BEARISH" | "NEUTRAL";
  confidence: number;
  reasoning: string;
  suggestedAction: "BUY" | "SELL" | "WAIT";
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  keyFactors: string[];
}

function buildSystemPrompt(): string {
  return `You are a quant-algo-trader assistant. Your role is to analyze market state vectors and operator events to produce a structured trading inference.

You must output valid JSON only — no markdown, no explanations outside the JSON.

Input: Market state vector (trend, volatility, compression, liquidity, astro) + recent operator events.
Output schema:
{
  "marketBias": "BULLISH" | "BEARISH" | "NEUTRAL",
  "confidence": 0.0 to 1.0,
  "reasoning": "brief explanation of your analysis",
  "suggestedAction": "BUY" | "SELL" | "WAIT",
  "riskLevel": "LOW" | "MEDIUM" | "HIGH",
  "keyFactors": ["factor1", "factor2", ...]
}

Rules:
- confidence reflects how certain you are about the bias. 0.5+ is meaningful.
- suggestedAction BUY only if bullish with confidence > 0.55.
- suggestedAction SELL only if bearish with confidence > 0.55.
- Otherwise WAIT.
- riskLevel HIGH when confidence < 0.5 or volatility is elevated.
- Use astro data as a secondary signal — it modulates confidence up/down.
- keyFactors should list the 2-4 most important drivers.`;
}

function buildUserPrompt(input: MarketInferenceInput): string {
  const {
    symbol,
    timeframe,
    trend,
    volatility,
    compression,
    liquidity,
    astro,
    recentEvents,
  } = input;

  const stateLines = [
    `Asset: ${symbol} (${timeframe})`,
    "",
    "--- TREND ---",
    `  Slope: ${trend.trendSlope.toFixed(3)}`,
    `  Strength: ${trend.trendStrength.toFixed(3)}`,
    `  Consistency: ${trend.structuralConsistency.toFixed(3)}`,
    `  Confidence: ${trend.confidence.toFixed(3)}`,
    "",
    "--- VOLATILITY ---",
    `  Normalized ATR: ${volatility.normalizedATR.toFixed(3)}`,
    `  Expansion: ${volatility.expansionScore.toFixed(3)}`,
    `  Contraction: ${volatility.contractionScore.toFixed(3)}`,
    `  Confidence: ${volatility.confidence.toFixed(3)}`,
    "",
    "--- COMPRESSION ---",
    `  Compression: ${compression.compression.toFixed(3)}`,
    `  Expansion Risk: ${compression.expansionRisk.toFixed(3)}`,
    `  Directional Bias: ${compression.directionalBias.toFixed(3)}`,
    "",
    "--- LIQUIDITY ---",
    `  Density: ${liquidity.liquidityDensity.toFixed(3)}`,
    `  Imbalance: ${liquidity.liquidityImbalance.toFixed(3)}`,
    `  Accessibility: ${liquidity.liquidityAccessibility.toFixed(3)}`,
    `  Buy-side: ${liquidity.buySideLiquidity.toFixed(3)}`,
    `  Sell-side: ${liquidity.sellSideLiquidity.toFixed(3)}`,
    `  Buy Sweep Risk: ${liquidity.buySideSweepRisk.toFixed(3)}`,
    `  Sell Sweep Risk: ${liquidity.sellSideSweepRisk.toFixed(3)}`,
    "",
    "--- ASTRO ---",
    `  Planetary Pressure: ${astro.planetaryPressure.toFixed(3)}`,
    `  Aspect Tension: ${astro.aspectTension.toFixed(3)}`,
    `  Ingress Proximity: ${astro.ingressProximity.toFixed(3)}`,
    `  Retrograde Influence: ${astro.retrogradeInfluence.toFixed(3)}`,
    `  Speed Dispersion: ${astro.speedDispersion.toFixed(3)}`,
    `  Elemental Imbalance: ${astro.elementalImbalance.toFixed(3)}`,
    `  Lunar Phase: ${astro.lunarPhase.toFixed(3)}`,
    `  Astro Confidence: ${astro.confidence.toFixed(3)}`,
    "dominantLatentAxes" in astro && Array.isArray(astro.dominantLatentAxes)
      ? `  Dominant Latent Axes: ${astro.dominantLatentAxes.map((axis: { axis: string; value: number }) => `${axis.axis}=${axis.value.toFixed(3)}`).join(", ")}`
      : "",
    "dominantTransitPlanets" in astro &&
    Array.isArray(astro.dominantTransitPlanets)
      ? `  Dominant Transit Planets: ${astro.dominantTransitPlanets.join(", ")}`
      : "",
    "narrative" in astro && typeof astro.narrative === "string"
      ? `  Astro Narrative: ${astro.narrative}`
      : "",
  ];

  const eventLines =
    recentEvents.length > 0
      ? [
          "",
          "--- RECENT OPERATOR EVENTS ---",
          ...recentEvents
            .slice(-10)
            .map(
              (e) =>
                `  [${e.type}] str=${(e.strength ?? 0.5).toFixed(2)} conf=${e.confidence.toFixed(2)} — ${e.narrative ?? ""}`,
            ),
        ]
      : ["", "--- RECENT OPERATOR EVENTS ---", "  (none)"];

  return [...stateLines, ...eventLines].join("\n");
}

export async function inferMarketState(
  input: MarketInferenceInput,
): Promise<MarketInferenceOutput> {
  const provider = createProvider({
    temperature: 0.3,
    maxTokens: 1024,
    model: process.env.OPENROUTER_MODEL || "nex-agi/nex-n2-pro:free",
  });

  const system = buildSystemPrompt();
  const user = buildUserPrompt(input);

  const response = await provider.generate({
    system,
    user,
    json: true,
  });

  try {
    const parsed = JSON.parse(response.text) as MarketInferenceOutput;

    return {
      marketBias: ["BULLISH", "BEARISH", "NEUTRAL"].includes(parsed.marketBias)
        ? parsed.marketBias
        : "NEUTRAL",
      confidence: Math.max(0, Math.min(1, parsed.confidence ?? 0.5)),
      reasoning: parsed.reasoning ?? "",
      suggestedAction: ["BUY", "SELL", "WAIT"].includes(parsed.suggestedAction)
        ? parsed.suggestedAction
        : "WAIT",
      riskLevel: ["LOW", "MEDIUM", "HIGH"].includes(parsed.riskLevel)
        ? parsed.riskLevel
        : "MEDIUM",
      keyFactors: Array.isArray(parsed.keyFactors)
        ? parsed.keyFactors.slice(0, 6)
        : [],
    };
  } catch {
    return {
      marketBias: "NEUTRAL",
      confidence: 0,
      reasoning: "Failed to parse LLM response.",
      suggestedAction: "WAIT",
      riskLevel: "HIGH",
      keyFactors: ["LLM response parse failure"],
    };
  }
}
