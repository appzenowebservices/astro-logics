import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { getSwissEph } from "~/server/astro/swissEph";

// Constants
const ZODIAC_SIGNS = [
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

const PLANETS = {
  0: "SUN",
  1: "MOON",
  2: "MERCURY",
  3: "VENUS",
  4: "MARS",
  5: "JUPITER",
  6: "SATURN",
  7: "URANUS",
  8: "NEPTUNE",
  9: "PLUTO",
  10: "MEAN_NODE",
} as const;

const HOUSES = [
  "HOUSE_1",
  "HOUSE_2",
  "HOUSE_3",
  "HOUSE_4",
  "HOUSE_5",
  "HOUSE_6",
  "HOUSE_7",
  "HOUSE_8",
  "HOUSE_9",
  "HOUSE_10",
  "HOUSE_11",
  "HOUSE_12",
];

// Helper: Convert longitude to zodiac sign and degree
function getLongitudeData(longitude: number) {
  const normalizedLongitude = ((longitude % 360) + 360) % 360;
  const signIndex = Math.floor(normalizedLongitude / 30);
  const degree = normalizedLongitude % 30;

  return {
    sign: ZODIAC_SIGNS[signIndex],
    degree: Math.round(degree * 100) / 100,
    longitude: Math.round(normalizedLongitude * 100) / 100,
  };
}

// Helper: Map planet ID to enum
function mapPlanetIdToEnum(planetId: number): string {
  return PLANETS[planetId as keyof typeof PLANETS] || "SUN";
}

// Schema for mundane chart request
const MundaneChartInputSchema = z.object({
  dateTime: z.date(),
  latitude: z.number().min(-90).max(90).describe("Observer latitude"),
  longitude: z.number().min(-180).max(180).describe("Observer longitude"),
  timezone: z.string().default("UTC").describe("Timezone offset like +5:30"),
});

export type MundaneChartInput = z.infer<typeof MundaneChartInputSchema>;

interface PlanetaryPosition {
  planet: string;
  longitude: number;
  degree: number;
  sign: string;
  speed: number;
  isRetrograde: boolean;
}

interface HousePosition {
  house: string;
  longitude: number;
  degree: number;
  sign: string;
}

interface MundaneChartData {
  dateTime: string;
  location: {
    latitude: number;
    longitude: number;
    timezone: string;
  };
  planets: PlanetaryPosition[];
  houses: HousePosition[];
  ascendant: {
    longitude: number;
    degree: number;
    sign: string;
  };
  mc: {
    longitude: number;
    degree: number;
    sign: string;
  };
}
const SIGNS = [
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

function getSignIndex(sign: string): number {
  return SIGNS.indexOf(sign);
}
export const mundaneRouter = createTRPCRouter({
  /**
   * Calculate planetary positions for current/specified time and location
   * Sidereal (Vedic) coordinates
   */

  calculateChart: publicProcedure
    .input(MundaneChartInputSchema)
    .query(async ({ input }): Promise<MundaneChartData> => {
      const swe = await getSwissEph();

      try {
        // -------------------------
        // 1. Time → Julian Day
        // -------------------------
        const date = new Date(input.dateTime);

        const jd = swe.julday(
          date.getUTCFullYear(),
          date.getUTCMonth() + 1,
          date.getUTCDate(),
          date.getUTCHours() +
            date.getUTCMinutes() / 60 +
            date.getUTCSeconds() / 3600,
          swe.SE_GREG_CAL,
        );

        // -------------------------
        // 2. Set Sidereal Mode (MANDATORY)
        // -------------------------
        swe.set_sid_mode(swe.SE_SIDM_LAHIRI);

        const flags = swe.SEFLG_SIDEREAL;

        // -------------------------
        // 3. Ascendant (ONLY use houses_ex for this)
        // -------------------------
        const houseRes = swe.houses_ex(
          jd,
          flags,
          input.latitude,
          input.longitude,
          "P", // system irrelevant, only ASC needed
        );

        const ascLongitude = houseRes.ascmc[0];
        const mcLongitude = houseRes.ascmc[1];
        if (isNaN(ascLongitude) || isNaN(mcLongitude)) {
          throw new Error("Invalid ascendant or MC calculation");
        }
        const ascData = getLongitudeData(ascLongitude);
        const mcData = getLongitudeData(mcLongitude);

        const ascSignIndex = getSignIndex(ascData.sign);

        // -------------------------
        // 4. Planets (Sidereal)
        // -------------------------
        const planetsToCalc = [
          swe.SE_SUN,
          swe.SE_MOON,
          swe.SE_MERCURY,
          swe.SE_VENUS,
          swe.SE_MARS,
          swe.SE_JUPITER,
          swe.SE_SATURN,
          swe.SE_MEAN_NODE,
        ];

        const planets: PlanetaryPosition[] = planetsToCalc.map((planetId) => {
          const res = swe.calc_ut(jd, planetId, flags);
          if (isNaN(res[0])) {
            throw new Error(`Invalid calculation for planet ${planetId}`);
          }
          const longData = getLongitudeData(res[0]);

          const planetSignIndex = getSignIndex(longData.sign);

          // Whole Sign House Mapping
          const house = ((planetSignIndex - ascSignIndex + 12) % 12) + 1;

          return {
            planet: mapPlanetIdToEnum(planetId),
            longitude: longData.longitude,
            degree: longData.degree,
            sign: longData.sign,
            house,
            speed: Math.round(res[3] * 1000) / 1000,
            isRetrograde: res[3] < 0,
          };
        });

        // -------------------------
        // 5. Whole Sign Houses
        // -------------------------
        const houses: HousePosition[] = Array.from({ length: 12 }).map(
          (_, i) => {
            const signIndex = (ascSignIndex + i) % 12;
            const sign = SIGNS[signIndex];

            return {
              house: HOUSES[i],
              sign,
              longitude: signIndex * 30,
              degree: 0,
            };
          },
        );

        // -------------------------
        // 6. Return Clean Output
        // -------------------------

        return {
          dateTime: date.toISOString(),
          location: {
            latitude: input.latitude,
            longitude: input.longitude,
            timezone: input.timezone,
          },
          ascendant: ascData,
          mc: mcData,
          houses,
          planets,
        };
      } catch (error) {
        console.error("Vedic chart calculation error:", error);
        throw new Error(
          `Failed to calculate chart: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        );
      }
    }),
});
