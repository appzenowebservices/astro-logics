import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";
import { getSwissEph } from "~/server/astro/swissEph";
import { TRPCError } from "@trpc/server";
// Assuming you have generated enums for ZodiacSign, Planet, etc.
// import { ZodiacSign, Planet } from "@prisma/client";

// --- Helper Functions (Updated for Enum compatibility) ---
// Adjust these based on how your ZodiacSign enum is structured
const SIGNS: string[] = [
  "ARIES",
  "TAURUS",
  "GEMINI",
  "CANCER",
  "LEO",
  "VIRGO",
  "LIBRA",
  "SCORPIO",
  "SAGITTARIUS",
  "CAPRICORN",
  "AQUARIUS",
  "PISCES",
];

function getSignData(longitude: number) {
  const index = Math.floor(longitude / 30);
  return {
    sign: SIGNS[index] as any, // Cast to ZodiacSign enum type
    degree: longitude % 30,
  };
}

// Maps SwissEph planet ID to your Prisma Planet Enum
function mapPlanetToEnum(planetId: number): string {
  // Example mapping - update based on your schema
  switch (planetId) {
    case 0:
      return "SUN";
    case 1:
      return "MOON";
    default:
      return "SUN"; // Placeholder
  }
}

// --- Router ---
export const astrologyRouter = createTRPCRouter({
  createBirthChart: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        birthDate: z.date(),
        // birthTimezone: z.string(), // Added to match schema
        // birthLocation: z.string(), // Added to match schema
        lat: z.number(),
        lon: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const swe = await getSwissEph();
      const userId = ctx.session.user.id;

      // 1. Calculate using swisseph-wasm
      const jd = swe.julday(
        input.birthDate.getUTCFullYear(),
        input.birthDate.getUTCMonth() + 1,
        input.birthDate.getUTCDate(),
        input.birthDate.getUTCHours() + input.birthDate.getUTCMinutes() / 60,
      );

      const flags = swe.SEFLG_SWIEPH | swe.SEFLG_SIDEREAL | swe.SEFLG_SPEED;

      // Calculate planets (example: Sun, Moon)
      const planetsToCalc = [
        swe.SE_SUN,
        swe.SE_MOON,
        swe.SE_MERCURY,
        swe.SE_VENUS,
        swe.SE_MARS,
        swe.SE_JUPITER,
        swe.SE_SATURN,
        swe.SE_URANUS,
        swe.SE_NEPTUNE,
        swe.SE_PLUTO,
        swe.SE_MEAN_NODE,
      ];
      const planetPositions = planetsToCalc.map((p) => {
        const res = swe.calc_ut(jd, p, flags);
        return {
          planetId: p,
          longitude: res[0],
          speed: res[3],
          isRetrograde: res[3] < 0,
        };
      });
      console.log("planetPositions====================", planetPositions);

      // Calculate Houses
      const houses = swe.houses_ex(jd, flags, input.lat, input.lon, "P");

      // 2. Persist to DB using Transaction
      try {
        return await db.$transaction(async (tx) => {
          // A. Create the main BirthChart record
          const chart = await tx.birthChart.create({
            data: {
              userId,
              chartName: input.name,
              birthDate: input.birthDate,
              birthLocation: input.birthLocation || "Unknown", // Default if not provided
              birthTimezone: input.birthTimezone || "UTC", // Default to UTC if not provided
              latitude: input.lat,
              longitude: input.lon,
              chartType: "NATAL",
              isCalculated: true,
              calculatedAt: new Date(),
            },
          });

          // B. Prepare and Create Planet Positions
          const planetData = planetPositions.map((p) => {
            const signData = getSignData(p.longitude);
            return {
              birthChartId: chart.id,
              planet: mapPlanetToEnum(p.planetId) as any, // Cast to Planet Enum
              zodiacSign: signData.sign,
              degree: signData.degree,
              speed: p.speed,
              isRetrograde: p.isRetrograde,
              // Calculate house position based on cusp data if needed
            };
          });

          await tx.planetPosition.createMany({
            data: planetData,
          });

          // C. Prepare and Create House Positions (Optional but recommended based on your schema)
          const houseData = houses.cusps
            .slice(1, 13)
            .map((cuspLongitude, index) => {
              const signData = getSignData(cuspLongitude);
              return {
                birthChartId: chart.id,
                house: `HOUSE_${index + 1}` as any, // Assuming House enum format
                zodiacSign: signData.sign,
                degree: signData.degree,
              };
            });

          // await tx.housePosition.createMany({
          //   data: houseData,
          // });

          return chart;
        });
      } catch (error) {
        console.error("Chart creation error:", error);
        // throw new TRPCError({
        //     code: "INTERNAL_SERVER_ERROR",
        //     message: "Failed to create birth chart in database."
        // });
      }
    }),
  getUserCharts: protectedProcedure.query(async ({ ctx }) => {
    // 1. Get user ID from session context
    const userId = ctx.session.user.id;

    // 2. Fetch charts from database for this user, ordered by newest
    try {
      const charts = await db.birthChart.findMany({
        where: {
          userId: userId,
        },
        orderBy: {
          createdAt: "desc",
        },
        // Select specific fields for the list view to be efficient
        select: {
          id: true,
          chartName: true,
          birthDate: true,
          birthLocation: true,
          createdAt: true,
        },
      });

      return charts;
    } catch (error) {
      console.error("Database error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch charts",
      });
    }
  }),
});
