import type {
  AstroWindow,
  FibonacciZone,
  LiquidityPool,
  MarketNarrativeEngineInput,
  MarketNarrativeState,
  MarketPhase,
  ParticipantControl,
} from "./marketNarrative.types";

const FIB_LEVELS = [0.382, 0.5, 0.618, 0.786] as const;

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function calculateMomentum(
  candles: MarketNarrativeEngineInput["candles"],
): number {
  if (candles.length < 10) return 0;
  const last = candles[candles.length - 1];
  const reference = candles[Math.max(0, candles.length - 10)];
  return (last.close - reference.close) / reference.close;
}

function calculateVolatility(
  candles: MarketNarrativeEngineInput["candles"],
): number {
  if (candles.length < 14) return 0;
  const recent = candles.slice(-14);
  const range =
    recent.reduce((acc, c) => acc + (c.high - c.low), 0) / recent.length;
  const basis = recent[recent.length - 1].close;
  return basis > 0 ? range / basis : 0;
}

function getAnchorRange(candles: MarketNarrativeEngineInput["candles"]): {
  high: number;
  low: number;
} {
  const sample = candles.slice(-80);
  const high = Math.max(...sample.map((c) => c.high));
  const low = Math.min(...sample.map((c) => c.low));
  return { high, low };
}

function buildFibZones(
  anchorHigh: number,
  anchorLow: number,
  price: number,
): FibonacciZone[] {
  const range = anchorHigh - anchorLow;
  if (range <= 0) return [];

  const levels = FIB_LEVELS.map((level, idx) => {
    const levelPrice = anchorHigh - range * level;
    const nextLevel =
      idx < FIB_LEVELS.length - 1
        ? anchorHigh - range * FIB_LEVELS[idx + 1]
        : anchorLow;

    const top = Math.max(levelPrice, nextLevel);
    const bottom = Math.min(levelPrice, nextLevel);

    return {
      name: `FIB_${level.toFixed(3)}`,
      high: round2(top),
      low: round2(bottom),
      isActive: price >= bottom && price <= top,
    };
  });

  return levels;
}

function detectLiquidityPools(
  candles: MarketNarrativeEngineInput["candles"],
  price: number,
): LiquidityPool[] {
  const sample = candles.slice(-50);
  if (sample.length < 10) return [];

  const highs = sample.slice(0, -1).map((c) => c.high);
  const lows = sample.slice(0, -1).map((c) => c.low);
  const resistance = Math.max(...highs);
  const support = Math.min(...lows);

  const avgRange =
    sample.reduce((acc, c) => acc + (c.high - c.low), 0) / sample.length;
  const resistanceHits = highs.filter(
    (h) => Math.abs(h - resistance) <= avgRange * 0.2,
  ).length;
  const supportHits = lows.filter(
    (l) => Math.abs(l - support) <= avgRange * 0.2,
  ).length;

  const buildPool = (
    label: string,
    side: "BUY_SIDE" | "SELL_SIDE",
    poolPrice: number,
    hits: number,
  ): LiquidityPool => {
    const distancePercent = Math.abs((poolPrice - price) / price) * 100;
    return {
      label,
      side,
      price: round2(poolPrice),
      strength: clamp01(hits / 6),
      distancePercent: round2(distancePercent),
    };
  };

  return [
    buildPool(
      "Buy-side liquidity above local highs",
      "BUY_SIDE",
      resistance,
      resistanceHits,
    ),
    buildPool(
      "Sell-side liquidity below local lows",
      "SELL_SIDE",
      support,
      supportHits,
    ),
  ].sort((a, b) => a.distancePercent - b.distancePercent);
}

function classifyParticipantControl(
  momentum: number,
  volatility: number,
  lastBodyRatio: number,
): ParticipantControl {
  if (volatility > 0.03 && Math.abs(momentum) < 0.004) return "WHIPSAW";
  if (momentum > 0.004 && lastBodyRatio > 0.45) return "INSTITUTIONAL_BUYERS";
  if (momentum < -0.004 && lastBodyRatio > 0.45) return "INSTITUTIONAL_SELLERS";
  return "BALANCED";
}

function classifyMarketPhase(
  momentum: number,
  volatility: number,
  price: number,
  anchorHigh: number,
  anchorLow: number,
): MarketPhase {
  const range = anchorHigh - anchorLow;
  const position = range > 0 ? (price - anchorLow) / range : 0.5;

  if (volatility > 0.035) return "EXPANSION";
  if (Math.abs(momentum) < 0.003) {
    if (position < 0.35) return "ACCUMULATION";
    if (position > 0.65) return "DISTRIBUTION";
    return "RANGE";
  }

  return momentum > 0 ? "MARKUP" : "MARKDOWN";
}

function buildAstroWindows(input: MarketNarrativeEngineInput): AstroWindow[] {
  if (!input.astroChart?.planets?.length) return [];

  const windows = input.astroChart.planets
    .map((planet) => {
      const distanceToIngress =
        planet.speed >= 0 ? 30 - planet.degree : planet.degree;
      const speed = Math.max(Math.abs(planet.speed), 0.01);
      const etaDays = distanceToIngress / speed;
      const etaHours = etaDays * 24;

      let significance: AstroWindow["significance"] = "LOW";
      if (etaHours <= 12) significance = "HIGH";
      else if (etaHours <= 48) significance = "MEDIUM";

      return {
        event: `${planet.planet} sign ingress from ${planet.sign}`,
        planet: planet.planet,
        etaHours: round2(etaHours),
        significance,
      };
    })
    .filter((w) => w.etaHours <= 96)
    .sort((a, b) => a.etaHours - b.etaHours)
    .slice(0, 4);

  return windows;
}

function deriveProbableMove(
  control: ParticipantControl,
  phase: MarketPhase,
  liquidity: LiquidityPool[],
  activeFibZone: FibonacciZone | undefined,
  momentum: number,
): MarketNarrativeState["probableNextMove"] {
  const nearestLiquidity = liquidity[0];
  const rationaleParts: string[] = [];

  let direction: "UP" | "DOWN" | "SIDEWAYS" = "SIDEWAYS";
  let confidence = 0.52;

  if (control === "INSTITUTIONAL_BUYERS") {
    direction = "UP";
    confidence += 0.16;
    rationaleParts.push(
      "buyers retain initiative via positive momentum structure",
    );
  } else if (control === "INSTITUTIONAL_SELLERS") {
    direction = "DOWN";
    confidence += 0.16;
    rationaleParts.push(
      "sellers retain initiative via negative momentum structure",
    );
  }

  if (phase === "EXPANSION") {
    confidence += 0.08;
    rationaleParts.push("volatility expansion favors continuation");
  }

  if (activeFibZone) {
    rationaleParts.push(
      `price is interacting with ${activeFibZone.name} value zone`,
    );
  }

  if (nearestLiquidity) {
    rationaleParts.push(`nearest liquidity sits at ${nearestLiquidity.price}`);
    if (direction === "SIDEWAYS") {
      direction = nearestLiquidity.side === "BUY_SIDE" ? "UP" : "DOWN";
      confidence += 0.06;
    }
  }

  confidence += Math.min(Math.abs(momentum) * 8, 0.1);

  return {
    direction,
    confidence: round2(clamp01(confidence)),
    rationale: rationaleParts.join("; "),
  };
}

export function buildMarketNarrativeState(
  input: MarketNarrativeEngineInput,
): MarketNarrativeState | null {
  if (!input.candles.length) return null;

  const last = input.candles[input.candles.length - 1];
  const anchor = getAnchorRange(input.candles);
  const momentum = calculateMomentum(input.candles);
  const volatility = calculateVolatility(input.candles);
  const bodyRatio =
    last.high - last.low > 0
      ? Math.abs(last.close - last.open) / (last.high - last.low)
      : 0;

  const liquidityMap = detectLiquidityPools(input.candles, last.close);
  const fibZones = buildFibZones(anchor.high, anchor.low, last.close);
  const activeFibZone = fibZones.find((zone) => zone.isActive);

  const participantsControl = classifyParticipantControl(
    momentum,
    volatility,
    bodyRatio,
  );
  const marketPhase = classifyMarketPhase(
    momentum,
    volatility,
    last.close,
    anchor.high,
    anchor.low,
  );
  const astroWindows = buildAstroWindows(input);
  const probableNextMove = deriveProbableMove(
    participantsControl,
    marketPhase,
    liquidityMap,
    activeFibZone,
    momentum,
  );

  const story = [
    `${input.asset} on ${input.timeframe} is in ${marketPhase} with ${participantsControl.replaceAll("_", " ").toLowerCase()} in control.`,
    liquidityMap.length
      ? `Liquidity focus: ${liquidityMap[0].label} near ${liquidityMap[0].price}.`
      : "Liquidity map is still forming.",
    activeFibZone
      ? `${activeFibZone.name} is active and defines current value acceptance.`
      : "Price is between major Fibonacci zones.",
    astroWindows.length
      ? `Nearest astro clock: ${astroWindows[0].event} in ~${astroWindows[0].etaHours}h.`
      : "No high-proximity astro trigger in next 96h.",
    `Most probable next move: ${probableNextMove.direction} (${Math.round(probableNextMove.confidence * 100)}% confidence).`,
  ].join(" ");

  return {
    asset: input.asset,
    timeframe: input.timeframe,
    timestamp: new Date().toISOString(),
    participantsControl,
    marketPhase,
    liquidityMap,
    valueZones: {
      anchorHigh: round2(anchor.high),
      anchorLow: round2(anchor.low),
      fibZones,
    },
    astroWindows,
    probableNextMove,
    story,
    diagnostics: {
      trendScore: round2(momentum),
      volatilityScore: round2(volatility),
      momentumScore: round2(bodyRatio),
      sampleSize: input.candles.length,
    },
  };
}
