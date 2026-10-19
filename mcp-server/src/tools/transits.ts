import { z } from "zod";
import type { McpToolDef } from "../registry.js";
import { TransitCalculator } from "~/server/services/transitCalculator";

const transitsInputSchema = {
  atDateTime: z.coerce
    .date()
    .describe("The moment to compute transits for, ISO 8601 timestamp, e.g. 2026-08-12T00:00:00Z"),
  latitude: z.number().min(-90).max(90).describe("Latitude, decimal degrees"),
  longitude: z.number().min(-180).max(180).describe("Longitude, decimal degrees"),
};

export const computeTransitsTool: McpToolDef<typeof transitsInputSchema> = {
  name: "compute_transits",
  description:
    "Compute live transit positions (sidereal) for a moment and location: planet longitudes, zodiac sign, degree, retrograde state and speed.",
  inputSchema: transitsInputSchema,
  handler: async ({ atDateTime, latitude, longitude }) => {
    const calculator = new TransitCalculator();
    const snapshot = await calculator.getTransitSnapshot(
      atDateTime,
      latitude,
      longitude,
    );
    return {
      date: snapshot.date.toISOString(),
      planets: snapshot.planets,
    };
  },
};
