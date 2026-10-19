import { z } from "zod";
import { TRPCError } from "@trpc/server";
import chalk from "chalk";
import axios from "axios";
import { protectedProcedure, createTRPCRouter } from "~/server/api/trpc";
import { db } from "~/server/db";
import { inferMarketState } from "~/server/services/marketInference";
import {
  saveStateSnapshot,
  getStateHistory,
  getStateById,
  saveTradeSignal,
  getRecentSignals,
  getEventLog,
  findSimilarStates,
} from "~/server/services/marketPersistence";
import {
  getMarketAssetProfiles,
  getOrCreateMarketAssetProfile,
  getAssetTransitAstroState,
  getAssetSessionAstroBrief,
} from "~/server/services/marketAstroService";
import type { MarketInferenceInput } from "~/server/services/marketInference";

const EventSchema = z.object({
  type: z.string(),
  strength: z.number().optional(),
  confidence: z.number(),
  narrative: z.string().optional(),
});



const MarketInferenceInputSchema: z.ZodType<MarketInferenceInput> = z.object({
  symbol: z.string(),
  timeframe: z.string(),
  trend: z.object({
    trendSlope: z.number(),
    trendStrength: z.number(),
    structuralConsistency: z.number(),
    confidence: z.number(),
  }),
  volatility: z.object({
    normalizedATR: z.number(),
    expansionScore: z.number(),
    contractionScore: z.number(),
    confidence: z.number(),
  }),
  compression: z.object({
    compression: z.number(),
    expansionRisk: z.number(),
    directionalBias: z.number(),
  }),
  liquidity: z.object({
    liquidityDensity: z.number(),
    liquidityImbalance: z.number(),
    liquidityAccessibility: z.number(),
    buySideLiquidity: z.number(),
    sellSideLiquidity: z.number(),
    buySideSweepRisk: z.number(),
    sellSideSweepRisk: z.number(),
    confidence: z.number(),
  }),
  astro: z.object({
    planetaryPressure: z.number(),
    aspectTension: z.number(),
    ingressProximity: z.number(),
    retrogradeInfluence: z.number(),
    speedDispersion: z.number(),
    elementalImbalance: z.number(),
    lunarPhase: z.number(),
    confidence: z.number(),
  }),
  recentEvents: z.array(EventSchema),
});

const MarketAssetProfileSchema = z.object({
  symbol: z.string().min(1),
  label: z.string().optional(),
  category: z.string().optional(),
  exchange: z.string().optional(),
  birthDateTime: z.date().optional(),
  timezone: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  locationName: z.string().optional(),
  coordinateSystem: z.enum(["SIDEREAL", "TROPICAL"]).optional(),
});

const AssetAstroStateSchema = z.object({
  symbol: z.string(),
  timestamp: z.number().optional(),
});

const AssetSessionBriefSchema = z.object({
  symbol: z.string(),
  timeframe: z.string().optional(),
  from: z.date().optional(),
  to: z.date().optional(),
  steps: z.number().min(3).max(12).default(8),
});

export const tradeRouter = createTRPCRouter({
  // ==========================================
  // FETCH MT5 HISTORICAL DATA PIPELINE
  // ==========================================
  getHistory: protectedProcedure
    .input(
      z.object({
        symbol: z.string(),
        timeframe: z.string().default("M15"),
        count: z.number().default(12000),
      }),
    )
    .query(async ({ ctx, input }) => {
      const user = await db.user.findUnique({
        where: { id: ctx.session.user.id },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      try {
        // Hits the new historical endpoint on your Python FastAPI backend
        const response = await axios.get(
          `http://127.0.0.1:8000/history/${input.symbol}`,
          {
            params: {
              timeframe: input.timeframe,
              count: input.count,
            },
          },
        );

        // Standardize returning the explicit nested data array matching python payload structure
        return {
          success: true,
          data: response.data.data,
        };
      } catch (error) {
        console.error(`MT5 Bridge History Error for ${input.symbol}:`, error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch MT5 history pipeline data",
        });
      }
    }),

  // ==========================================
  // FETCH MT5 LIVE TICK STREAM
  // ==========================================
  getPrice: protectedProcedure
    .input(
      z.object({
        symbol: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const user = await db.user.findUnique({
        where: { id: ctx.session.user.id },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      try {
        const response = await axios.get(
          `http://127.0.0.1:8000/price/${input.symbol}`,
        );

        // Standardize returning the data block cleanly matching python updates payload
        return {
          success: true,
          data: response.data.data,
        };
      } catch (error) {
        console.error(`MT5 Bridge Tick Error for ${input.symbol}:`, error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch MT5 price",
        });
      }
    }),

  // ==========================================
  // MARKET ASSET ASTRO PROFILES
  // ==========================================
  getAssetProfiles: protectedProcedure.query(async () => {
    const profiles = await getMarketAssetProfiles();
    return { success: true, data: profiles };
  }),

  createOrUpdateAssetProfile: protectedProcedure
    .input(MarketAssetProfileSchema)
    .mutation(async ({ input }) => {
      const profile = await getOrCreateMarketAssetProfile(input);
      return { success: true, data: profile };
    }),

  getAssetAstroState: protectedProcedure
    .input(AssetAstroStateSchema)
    .query(async ({ input }) => {
      const profile = await getOrCreateMarketAssetProfile({
        symbol: input.symbol,
      });
      if (!profile) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Market asset profile not found",
        });
      }

      const state = await getAssetTransitAstroState(
        profile,
        input.timestamp ?? Date.now(),
      );

      return { success: true, data: state };
    }),

  getAssetSessionBrief: protectedProcedure
    .input(AssetSessionBriefSchema)
    .query(async ({ input }) => {
      const brief = await getAssetSessionAstroBrief(input);
      return { success: true, data: brief };
    }),

  // ==========================================
  // LLM INFERENCE ON MARKET STATE
  // ==========================================
  marketInfer: protectedProcedure
    .input(MarketInferenceInputSchema)
    .mutation(async ({ input }) => {
      try {
        const result = await inferMarketState(input);
        return { success: true, data: result };
      } catch (error) {
        console.error("Market inference error:", error);
        return {
          success: true,
          data: {
            marketBias: "NEUTRAL" as const,
            confidence: 0,
            reasoning: "Inference engine unavailable.",
            suggestedAction: "WAIT" as const,
            riskLevel: "HIGH" as const,
            keyFactors: ["Inference engine error"],
          },
        };
      }
    }),

  // ==========================================
  // SAVE STATE SNAPSHOT
  // ==========================================
  saveSnapshot: protectedProcedure
    .input(
      z.object({
        symbol: z.string(),
        timeframe: z.string(),
        timestamp: z.number(),
        trend: z.any(),
        volatility: z.any(),
        compression: z.any(),
        liquidity: z.any(),
        astro: z.any(),
        marketAssetProfileId: z.string().optional(),
        events: z.array(
          z.object({
            type: z.string(),
            strength: z.number(),
            confidence: z.number(),
            narrative: z.string(),
            metadata: z.any().optional(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const snapshot = await saveStateSnapshot(
        {
          symbol: input.symbol,
          timeframe: input.timeframe,
          timestamp: input.timestamp,
          trend: input.trend,
          volatility: input.volatility,
          compression: input.compression,
          liquidity: input.liquidity,
          astro: input.astro,
          marketAssetProfileId: input.marketAssetProfileId,
          events: input.events,
        },
        ctx.session.user.id,
      );
      return { success: true, data: { id: snapshot.id } };
    }),

  // ==========================================
  // GET STATE HISTORY
  // ==========================================
  getStateHistory: protectedProcedure
    .input(
      z.object({
        symbol: z.string(),
        timeframe: z.string().default(""),
        limit: z.number().default(50),
        offset: z.number().default(0),
      }),
    )
    .query(async ({ input }) => {
      const snapshots = await getStateHistory(
        input.symbol,
        input.timeframe,
        input.limit,
        input.offset,
      );
      return { success: true, data: snapshots };
    }),

  // ==========================================
  // GET STATE BY ID
  // ==========================================
  getStateById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const snapshot = await getStateById(input.id);
      return { success: true, data: snapshot };
    }),

  // ==========================================
  // SAVE TRADE SIGNAL
  // ==========================================
  saveSignal: protectedProcedure
    .input(
      z.object({
        snapshotId: z.string(),
        marketBias: z.string(),
        confidence: z.number(),
        reasoning: z.string(),
        suggestedAction: z.string(),
        riskLevel: z.string(),
        keyFactors: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const signal = await saveTradeSignal(
        input.snapshotId,
        {
          marketBias: input.marketBias,
          confidence: input.confidence,
          reasoning: input.reasoning,
          suggestedAction: input.suggestedAction,
          riskLevel: input.riskLevel,
          keyFactors: input.keyFactors,
        },
        ctx.session.user.id,
      );
      return { success: true, data: { id: signal.id } };
    }),

  // ==========================================
  // GET RECENT SIGNALS
  // ==========================================
  getRecentSignals: protectedProcedure
    .input(
      z.object({
        symbol: z.string(),
        limit: z.number().default(20),
      }),
    )
    .query(async ({ input }) => {
      const signals = await getRecentSignals(input.symbol, input.limit);
      return { success: true, data: signals };
    }),

  // ==========================================
  // GET EVENT LOG
  // ==========================================
  getEventLog: protectedProcedure
    .input(
      z.object({
        symbol: z.string(),
        eventType: z.string().optional(),
        limit: z.number().default(50),
      }),
    )
    .query(async ({ input }) => {
      const events = await getEventLog(
        input.symbol,
        input.eventType,
        input.limit,
      );
      return { success: true, data: events };
    }),

  // ==========================================
  // FIND SIMILAR STATES
  // ==========================================
  findSimilarStates: protectedProcedure
    .input(
      z.object({
        symbol: z.string(),
        limit: z.number().default(10),
      }),
    )
    .query(async ({ input }) => {
      const snapshots = await findSimilarStates(
        input.symbol,
        0.85,
        input.limit,
      );
      return { success: true, data: snapshots };
    }),

  // ==========================================
  // SCAN WINDOW - Extract events on selected time window
  // ==========================================
  scanWindow: protectedProcedure
    .input(
      z.object({
        symbol: z.string(),
        history: z.array(
          z.object({
            time: z.number(),
            open: z.number(),
            high: z.number(),
            low: z.number(),
            close: z.number(),
          }),
        ),
        timeframe: z.string(),
        windowStart: z.string().optional(),
        windowEnd: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { MarketStateEngine } =
        await import("../../../../trading/engine/MarketStateEngine");

      const windowStartTs = input.windowStart
        ? Math.floor(new Date(input.windowStart).getTime() / 1000)
        : undefined;
      const windowEndTs = input.windowEnd
        ? Math.floor(new Date(input.windowEnd).getTime() / 1000)
        : undefined;

      const engine = new MarketStateEngine();

      const historyMapped = input.history.map((c) => ({
        time: c.time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));

      let profile: any = null;
      let astroEvolution: any[] = [];

      try {
        profile = await getOrCreateMarketAssetProfile({ symbol: input.symbol });
        if (profile) {
          const timestamps = historyMapped.map((c) => c.time * 1000);
          const from = Math.min(...timestamps);
          const to = Math.max(...timestamps);
          const astroBrief = await getAssetSessionAstroBrief({
            symbol: input.symbol,
            from: new Date(from),
            to: new Date(to),
            steps: Math.min(historyMapped.length, 10),
          });
          astroEvolution = astroBrief.evolution;
        }
      } catch (error) {
        console.error(chalk.red("[ASTRO] Failed to load market profile:"), error);
      }

      console.log(
        chalk.cyan.bold("\n[SCAN WINDOW] Extracting events from history..."),
      );
      console.log(chalk.gray(`  History entries: ${input.history.length}`));
      console.log(chalk.gray(`  Timeframe: ${input.timeframe}`));
      console.log(chalk.gray(`  Symbol: ${input.symbol}`));
      if (windowStartTs && windowEndTs) {
        console.log(
          chalk.gray(
            `  Window: ${new Date(windowStartTs * 1000).toISOString()} - ${new Date(windowEndTs * 1000).toISOString()}`,
          ),
        );
      }

      const allEvents: any[] = [];
      const astroStates: any[] = [];
      console.log(
        chalk.blue(
          `  Processing ${historyMapped.length} candles sequentially...`,
        ),
      );
      historyMapped.forEach((candle, index) => {
        const candleTimestamp = candle.time * 1000;
        let astroState: any = null;

        const matchingAstro = astroEvolution.find(
          (a) => Math.abs(a.timestamp - candleTimestamp) < 3600000,
        );
        if (matchingAstro) {
          astroState = {
            planetaryPressure: matchingAstro.astroState?.planetaryPressure,
            aspectTension: matchingAstro.astroState?.aspectTension,
            confidence: matchingAstro.astroState?.confidence,
            dominantTransitPlanets: matchingAstro.astroState?.dominantTransitPlanets,
          };
        }

        const result = engine.extract([candle], astroState);
        result.events.forEach((e) => {
          allEvents.push({
            type: e.type,
            strength: e.strength ?? 0.5,
            confidence: e.confidence ?? 0.5,
            narrative: e.narrative ?? "",
            time: e.time,
          });
        });
        astroStates.push({ time: candle.time, astroState: astroState || {} });

        if (
          index === 0 ||
          index === historyMapped.length - 1 ||
          (index + 1) % 50 === 0
        ) {
          console.log(
            chalk.gray(
              `    Processed ${index + 1}/${historyMapped.length} candles, events so far: ${allEvents.length}`,
            ),
          );
        }
      });
      console.log(
        chalk.blue(
          `  Total events from sequential processing: ${allEvents.length}`,
        ),
      );

      let events = allEvents;

      if (windowStartTs && windowEndTs) {
        events = events.filter(
          (e) => e.time >= windowStartTs && e.time <= windowEndTs,
        );
      }

      const byType: Record<string, number> = {};
      events.forEach((e: any) => {
        byType[e.type] = (byType[e.type] || 0) + 1;
      });

      console.log(chalk.green.bold("\n[SCAN WINDOW] Results:"));
      console.log(chalk.green(`  Total events extracted: ${events.length}`));
      console.log(chalk.yellow(`  Events by type:`));
      Object.entries(byType).forEach(([type, count]) => {
        console.log(chalk.yellow(`    - ${type}: ${count}`));
      });

      return {
        success: true,
        data: {
          events,
          summary: {
            totalEvents: events.length,
            byType,
          },
          astroEvolution,
        },
      };
    }),

  // ==========================================
  // DIGITAL TWIN NARRATIVE
  // ==========================================
  generateMarketNarrative: protectedProcedure
    .input(
      z.object({
        symbol: z.string(),
        timeframe: z.string(),
        events: z.array(
          z.object({
            type: z.string(),
            strength: z.number(),
            confidence: z.number(),
            narrative: z.string(),
            time: z.number(),
          }),
        ),
        astroSummary: z
          .object({
            planetaryPressure: z.number().optional(),
            aspectTension: z.number().optional(),
            confidence: z.number().optional(),
            dominantTransitPlanets: z.array(z.string()).optional(),
          })
          .optional(),
        marketContext: z
          .object({
            priceRange: z
              .object({ min: z.number(), max: z.number() })
              .optional(),
            direction: z.enum(["up", "down", "sideways"]).optional(),
            volatility: z.number().optional(),
          })
          .optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { generateMarketNarrative } = await import(
        "~/server/services/digitalTwinNarrator"
      );

      const narrative = await generateMarketNarrative({
        symbol: input.symbol,
        timeframe: input.timeframe,
        events: input.events,
        astroState: input.astroSummary,
        marketContext: input.marketContext,
      });

      return { success: true, data: narrative };
    }),

  // ==========================================
  // CHART DRAWINGS
  // ==========================================
  saveChartDrawing: protectedProcedure
    .input(
      z.object({
        symbol: z.string(),
        timeframe: z.string(),
        drawingType: z.string(),
        drawingId: z.string(),
        anchors: z.any(),
        style: z.any().optional(),
        options: z.any().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const drawing = await db.chartDrawing.create({
        data: {
          symbol: input.symbol,
          timeframe: input.timeframe,
          drawingType: input.drawingType,
          drawingId: input.drawingId,
          anchors: input.anchors,
          style: input.style ?? {},
          options: input.options ?? {},
          userId: ctx.session.user.id,
        },
      });
      return { success: true, id: drawing.id };
    }),

  getChartDrawings: protectedProcedure
    .input(z.object({ symbol: z.string(), timeframe: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const drawings = await db.chartDrawing.findMany({
        where: {
          symbol: input.symbol,
          ...(input.timeframe && { timeframe: input.timeframe }),
        },
        orderBy: { createdAt: "desc" },
      });
      return { success: true, data: drawings };
    }),

  deleteChartDrawing: protectedProcedure
    .input(z.object({ drawingId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await db.chartDrawing.deleteMany({
        where: { drawingId: input.drawingId },
      });
      return { success: true };
    }),
});
