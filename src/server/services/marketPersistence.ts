import prisma from "../../../prisma-client/client";

interface EngineDataInput {
  symbol: string;
  timeframe: string;
  timestamp: number;
  trend: any;
  volatility: any;
  compression: any;
  liquidity: any;
  astro: any;
  marketAssetProfileId?: string;
  events: Array<{
    type: string;
    strength: number;
    confidence: number;
    narrative: string;
    metadata?: any;
  }>;
}

export async function saveStateSnapshot(
  input: EngineDataInput,
  userId?: string,
) {
  const snapshot = await prisma.marketStateSnapshot.create({
    data: {
      symbol: input.symbol,
      timeframe: input.timeframe,
      timestamp: input.timestamp,
      trendState: input.trend,
      volatilityState: input.volatility,
      compressionState: input.compression,
      liquidityState: input.liquidity,
      astroState: input.astro,
      marketAssetProfileId: input.marketAssetProfileId ?? null,
      userId: userId ?? null,
      events: {
        create: input.events.map((e) => ({
          eventType: e.type,
          strength: e.strength ?? 0.5,
          confidence: e.confidence ?? 0.5,
          narrative: e.narrative ?? "",
          metadata: e.metadata ?? {},
        })),
      },
    },
    include: {
      events: true,
    },
  });

  return snapshot;
}

export async function getStateHistory(
  symbol: string,
  timeframe: string,
  limit = 100,
  offset = 0,
) {
  return prisma.marketStateSnapshot.findMany({
    where: { symbol, timeframe },
    orderBy: { timestamp: "desc" },
    take: limit,
    skip: offset,
    include: {
      events: true,
      signals: true,
    },
  });
}

export async function getStateById(id: string) {
  return prisma.marketStateSnapshot.findUnique({
    where: { id },
    include: { events: true, signals: true },
  });
}

export async function saveTradeSignal(
  snapshotId: string,
  signal: {
    marketBias: string;
    confidence: number;
    reasoning: string;
    suggestedAction: string;
    riskLevel: string;
    keyFactors: string[];
  },
  userId?: string,
) {
  return prisma.tradeSignal.create({
    data: {
      snapshotId,
      marketBias: signal.marketBias,
      confidence: signal.confidence,
      reasoning: signal.reasoning,
      suggestedAction: signal.suggestedAction,
      riskLevel: signal.riskLevel,
      keyFactors: signal.keyFactors,
      userId: userId ?? null,
    },
  });
}

export async function getRecentSignals(symbol: string, limit = 20) {
  return prisma.tradeSignal.findMany({
    where: {
      snapshot: { symbol },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { snapshot: true },
  });
}

export async function getEventLog(
  symbol: string,
  eventType?: string,
  limit = 50,
) {
  const where: any = { snapshot: { symbol } };
  if (eventType) where.eventType = eventType;

  return prisma.operatorEventLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { snapshot: true },
  });
}

export async function findSimilarStates(
  symbol: string,
  threshold = 0.85,
  limit = 10,
) {
  return prisma.marketStateSnapshot.findMany({
    where: {
      symbol,
      // embedding-based filtering would go here with a vector DB.
      // For now, return recent states by the same symbol.
    },
    orderBy: { timestamp: "desc" },
    take: limit,
    include: { events: true, signals: true },
  });
}
