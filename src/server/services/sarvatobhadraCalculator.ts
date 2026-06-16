import { getSwissEph } from "~/server/astro/swissEph";

/**
 * Sarvatobhadra Chakra - An 8x8 grid used in Jyotish for determining auspicious times
 * Based on Vara (day lord) and Nakshatra positions
 * Each cell has inherent strength/weakness
 */

export interface SarvatobhadraCell {
  row: number; // 0-7
  column: number; // 0-7
  varaDayLord: string; // Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn
  nakshatraIndex: number; // 0-26
  auspiciousnessScore: number; // 0-100
  planetInfluence: string;
  description: string;
}

export interface SarvatobhadraTimestepData {
  date: Date;
  activeCells: SarvatobhadraCell[];
  overallAuspiciousness: number; // 0-100
  dominantVara: string;
  dominantNakshatra: string;
  auspiciousHours: Array<{ hour: number; score: number }>;
  warningHours: Array<{ hour: number; reason: string }>;
  bestTimeWindow: { start: number; end: number; score: number } | null;
}

const VARAS = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];

const NAKSHATRAS = [
  "Ashwini",
  "Bharani",
  "Krittika",
  "Rohini",
  "Mrigashira",
  "Ardra",
  "Punarvasu",
  "Pushya",
  "Ashlesha",
  "Magha",
  "Purva Phalguni",
  "Uttara Phalguni",
  "Hasta",
  "Chitra",
  "Swati",
  "Visakha",
  "Anuradha",
  "Jyeshtha",
  "Mula",
  "Purva Ashadha",
  "Uttara Ashadha",
  "Shravana",
  "Dhanishtha",
  "Shatabhisha",
  "Purva Bhadrapada",
  "Uttara Bhadrapada",
  "Revati",
];

// Auspiciousness matrix for Sarvatobhadra Chakra
// Based on traditional Jyotish texts
// Row = Vara (0-6, then repeats), Column = Nakshatra group (0-7)
const AUSPICIOUSNESS_MATRIX: number[][] = [
  [85, 75, 65, 55, 45, 35, 25, 15], // Sun (Vara 0)
  [70, 80, 70, 60, 50, 40, 30, 20], // Moon (Vara 1)
  [55, 65, 75, 65, 55, 45, 35, 25], // Mars (Vara 2)
  [60, 70, 60, 70, 60, 50, 40, 30], // Mercury (Vara 3)
  [75, 75, 75, 65, 75, 65, 55, 45], // Jupiter (Vara 4)
  [65, 55, 65, 55, 65, 75, 65, 55], // Venus (Vara 5)
  [45, 35, 45, 35, 45, 55, 65, 55], // Saturn (Vara 6)
];

export class SarvatobhadraCalculator {
  /**
   * Calculate Sarvatobhadra Chakra for a given date and location
   */
  async calculateSarvatobhadraForDate(
    date: Date,
    latitude: number,
    longitude: number,
    natalLongitude?: number, // Native chart reference
  ): Promise<SarvatobhadraTimestepData> {
    // Get planetary positions
    const swe = await getSwissEph();
    const jd = swe.julday(
      date.getUTCFullYear(),
      date.getUTCMonth() + 1,
      date.getUTCDate(),
      date.getUTCHours() +
        date.getUTCMinutes() / 60 +
        date.getUTCSeconds() / 3600,
    );

    const flags = swe.SEFLG_SWIEPH | swe.SEFLG_SIDEREAL | swe.SEFLG_SPEED;

    // Calculate day of week (Vara)
    const dayOfWeek = date.getDay();
    const vara = VARAS[dayOfWeek];
    const varaIndex = dayOfWeek;

    // Calculate Moon position for Nakshatra
    const moonRes = swe.calc(jd, swe.SE_MOON, flags);
    const moonLong = moonRes.longitude;
    const nakshatraIndex = Math.floor(moonLong / (360 / 27)) % 27;
    const nakshatra = NAKSHATRAS[nakshatraIndex];

    // Calculate all significant planet positions
    const planetIndices = [
      swe.SE_SUN,
      swe.SE_MOON,
      swe.SE_MARS,
      swe.SE_MERCURY,
      swe.SE_JUPITER,
      swe.SE_VENUS,
      swe.SE_SATURN,
    ];
    const planetNames = [
      "Sun",
      "Moon",
      "Mars",
      "Mercury",
      "Jupiter",
      "Venus",
      "Saturn",
    ];

    const planetPositions = planetIndices.map((p, idx) => {
      const res = swe.calc(jd, p, flags);
      return {
        name: planetNames[idx],
        longitude: res.longitude,
      };
    });

    // Determine active cells
    const activeCells: SarvatobhadraCell[] = [];
    let totalScore = 0;

    // Cell calculation: based on Vara and Nakshatra divisions
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const cellVaraIndex = (varaIndex + i) % 7;
        const nakshatraGroup = j;

        const baseScore = AUSPICIOUSNESS_MATRIX[cellVaraIndex][nakshatraGroup];

        // Modify score based on planet conjunctions/aspects
        let planetInfluence = "none";
        let scoreModifier = 0;

        for (const planet of planetPositions) {
          const cellLongitude =
            (nakshatraGroup * (360 / 8) + (i * 360) / 56) % 360;
          const diff = Math.abs(planet.longitude - cellLongitude);
          const minDiff = Math.min(diff, 360 - diff);

          if (minDiff < 5) {
            // Planet influence within 5 degrees
            planetInfluence = planet.name;
            scoreModifier =
              planet.name === "Jupiter"
                ? 15
                : planet.name === "Saturn"
                  ? -20
                  : 0;
          }
        }

        const finalScore = Math.max(
          0,
          Math.min(100, baseScore + scoreModifier),
        );

        activeCells.push({
          row: i,
          column: j,
          varaDayLord: VARAS[cellVaraIndex],
          nakshatraIndex: (nakshatraIndex + nakshatraGroup) % 27,
          auspiciousnessScore: finalScore,
          planetInfluence,
          description: this.describeCell(VARAS[cellVaraIndex], nakshatraGroup),
        });

        totalScore += finalScore;
      }
    }

    const overallAuspiciousness = Math.round(
      totalScore / (activeCells.length || 1),
    );

    // Calculate auspicious hours
    const auspiciousHours = this.calculateAuspiciousHours(activeCells);
    const warningHours = this.calculateWarningHours(activeCells);
    const bestTimeWindow = this.findBestTimeWindow(auspiciousHours);

    return {
      date,
      activeCells,
      overallAuspiciousness,
      dominantVara: vara,
      dominantNakshatra: nakshatra,
      auspiciousHours,
      warningHours,
      bestTimeWindow,
    };
  }

  /**
   * Calculate Sarvatobhadra timeline for a date range
   */
  async calculateSarvatobhadraTimeline(
    startDate: Date,
    endDate: Date,
    latitude: number,
    longitude: number,
    natalLongitude?: number,
  ): Promise<SarvatobhadraTimestepData[]> {
    const timeline: SarvatobhadraTimestepData[] = [];
    const maxDays = 366;
    const days: Date[] = [];

    for (
      let dt = new Date(startDate);
      dt <= endDate && days.length < maxDays;
      dt.setDate(dt.getDate() + 1)
    ) {
      days.push(new Date(dt));
    }

    for (const day of days) {
      const data = await this.calculateSarvatobhadraForDate(
        day,
        latitude,
        longitude,
        natalLongitude,
      );
      timeline.push(data);
    }

    return timeline;
  }

  /**
   * Private helper: Calculate auspicious hours for a day
   */
  private calculateAuspiciousHours(
    cells: SarvatobhadraCell[],
  ): Array<{ hour: number; score: number }> {
    const hourScores: number[] = new Array(24).fill(0);

    for (const cell of cells) {
      const hour = (cell.row * 3 + cell.column) % 24;
      hourScores[hour] = Math.max(hourScores[hour], cell.auspiciousnessScore);
    }

    return hourScores
      .map((score, hour) => ({ hour, score }))
      .filter((h) => h.score > 50);
  }

  /**
   * Calculate warning hours
   */
  private calculateWarningHours(
    cells: SarvatobhadraCell[],
  ): Array<{ hour: number; reason: string }> {
    const warnings: Array<{ hour: number; reason: string }> = [];

    for (const cell of cells) {
      if (cell.auspiciousnessScore < 40) {
        const hour = (cell.row * 3 + cell.column) % 24;
        warnings.push({
          hour,
          reason: `${cell.varaDayLord}-${NAKSHATRAS[cell.nakshatraIndex]} conjunction unfavorable`,
        });
      }
    }

    return [...new Map(warnings.map((w) => [w.hour, w])).values()];
  }

  /**
   * Find best time window
   */
  private findBestTimeWindow(
    auspiciousHours: Array<{ hour: number; score: number }>,
  ): { start: number; end: number; score: number } | null {
    if (auspiciousHours.length === 0) return null;

    const bestWindow = {
      start: auspiciousHours[0].hour,
      end: auspiciousHours[0].hour,
      score: auspiciousHours[0].score,
    };
    const currentStart = auspiciousHours[0].hour;
    let totalScore = auspiciousHours[0].score;
    let count = 1;

    for (let i = 1; i < auspiciousHours.length; i++) {
      if (
        auspiciousHours[i].hour === bestWindow.end + 1 ||
        auspiciousHours[i].hour === bestWindow.end
      ) {
        bestWindow.end = auspiciousHours[i].hour;
        totalScore += auspiciousHours[i].score;
        count++;
      }
    }

    bestWindow.score = Math.round(totalScore / count);
    return bestWindow;
  }

  /**
   * Describe cell auspiciousness
   */
  private describeCell(vara: string, nakshatraGroup: number): string {
    const groups = [
      "Initiation",
      "Continuation",
      "Completion",
      "Rest",
      "Conflict",
      "Resolution",
      "Integration",
      "Renewal",
    ];
    return `${vara}'s ${groups[nakshatraGroup]}`;
  }
}
