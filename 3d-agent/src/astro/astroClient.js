// src/astro/astroClient.js
//
// Thin client for Kaalvanta's public sidereal chart procedure:
//   mundane.calculateChart({ dateTime, latitude, longitude, timezone })
// The request is proxied through Vite (/kaalvanta) so the browser never hits
// a cross-origin wall. Payload shape follows tRPC v11 + SuperJSON.

import { GRAHA, GRAHA_ORDER, SIGNS } from "./planetMeta";

const BASE = import.meta.env.VITE_KAALVANTA_BASE || "/kaalvanta";

const signalDegrees = (longitude) => ((longitude % 360) + 360) % 360;

const angularDistance = (a, b) => {
  const diff = Math.abs(signalDegrees(a) - signalDegrees(b));
  return diff > 180 ? 360 - diff : diff;
};

const signOf = (longitude) => SIGNS[Math.floor(signalDegrees(longitude) / 30)];

/** Live chart for the current moment and observer position. */
export async function fetchLiveChart({ latitude, longitude }) {
  const input = {
    0: {
      json: {
        dateTime: new Date().toISOString(),
        latitude,
        longitude,
        timezone: "UTC",
      },
      meta: { values: { dateTime: ["Date"] }, v: 1 },
    },
  };

  const url = `${BASE}/api/trpc/mundane.calculateChart?batch=1&input=${encodeURIComponent(
    JSON.stringify(input),
  )}`;

  const response = await fetch(url, {
    headers: { accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Kaalvanta responded ${response.status}`);
  }

  const payload = await response.json();
  const entry = Array.isArray(payload) ? payload[0] : payload;
  const chart = entry?.result?.data?.json;

  if (!chart?.planets?.length) {
    throw new Error("Kaalvanta returned an empty chart");
  }

  return chart;
}

/**
 * Turn a Kaalvanta chart into the graha list the 3D layer renders.
 * Derives Ketu (opposite the mean node) and a simple condition state.
 */
export function buildGrahas(chart) {
  const sun = chart.planets.find((p) => p.planet === "SUN");
  const byKey = new Map();

  for (const planet of chart.planets) {
    const key = planet.planet === "MEAN_NODE" ? "RAHU" : planet.planet;
    const meta = GRAHA[key];
    if (!meta) continue;

    const combust =
      key !== "SUN" && sun
        ? angularDistance(planet.longitude, sun.longitude) <= 8
        : false;

    byKey.set(key, {
      key,
      ...meta,
      longitude: planet.longitude,
      degree: planet.degree,
      sign: planet.sign,
      house: planet.house ?? null,
      speed: planet.speed,
      isRetrograde: Boolean(planet.isRetrograde),
      combust,
      condition: planet.isRetrograde
        ? "retrograde"
        : combust
          ? "combust"
          : "direct",
    });
  }

  const rahu = byKey.get("RAHU");
  if (rahu) {
    const longitude = signalDegrees(rahu.longitude + 180);
    const ketuMeta = GRAHA.KETU;
    byKey.set("KETU", {
      key: "KETU",
      ...ketuMeta,
      longitude,
      degree: longitude % 30,
      sign: signOf(longitude),
      house: rahu.house ? ((rahu.house + 5) % 12) + 1 : null,
      speed: rahu.speed,
      isRetrograde: rahu.isRetrograde,
      combust: false,
      condition: rahu.isRetrograde ? "retrograde" : "direct",
    });
  }

  return GRAHA_ORDER.filter((key) => byKey.has(key)).map((key) =>
    byKey.get(key),
  );
}

/** Compact human label: 12.4° LEO · H5 */
export function grahaPositionLabel(graha) {
  const degree = graha.degree?.toFixed?.(1) ?? graha.degree;
  return `${degree}° ${graha.sign} · H${graha.house ?? "?"}`;
}
