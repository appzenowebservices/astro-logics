"use client";

import { useEffect, useState } from "react";
import { api } from "~/trpc/react";

/**
 * Shared sky state: the current moment plus the observer's real position.
 * Geocoding is browser-only and silently falls back to London when denied.
 */
export function useSkyChart() {
  const [now, setNow] = useState(() => new Date());
  const [coords, setCoords] = useState({ latitude: 51.5, longitude: -0.12 });

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) =>
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      () => undefined,
      { timeout: 8000, maximumAge: 600_000 },
    );
  }, []);

  const query = api.mundane.calculateChart.useQuery(
    {
      dateTime: now,
      latitude: coords.latitude,
      longitude: coords.longitude,
      timezone: "UTC",
    },
    { refetchOnWindowFocus: false, staleTime: 30_000 },
  );

  return { ...query, now, coords };
}
