// src/astro/astroStore.js
//
// Live sidereal snapshot for the planet layer. Polls Kaalvanta once a minute
// (the same cadence as the Kaalvanta hero orrery) and exposes a tiny external
// store so both the 3D layer and the HUD stay in sync.

import { useSyncExternalStore } from "react";
import { buildGrahas, fetchLiveChart } from "./astroClient";

const DEFAULT_COORDS = { latitude: 28.6139, longitude: 77.209 };
const REFRESH_MS = 60_000;

let state = {
  active: true,
  connected: false,
  loading: false,
  error: null,
  chart: null,
  grahas: [],
  coords: DEFAULT_COORDS,
  selected: null,
  updatedAt: null,
};

const listeners = new Set();
const emit = () => {
  for (const listener of listeners) listener();
};

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getSnapshot = () => state;

function setState(patch) {
  state = { ...state, ...patch };
  emit();
}

export function useAstro() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

let timer = null;
let started = false;
let inflight = false;

async function refresh() {
  if (inflight) return;
  inflight = true;
  setState({ loading: true });

  try {
    const chart = await fetchLiveChart(state.coords);
    setState({
      chart,
      grahas: buildGrahas(chart),
      connected: true,
      error: null,
      loading: false,
      updatedAt: Date.now(),
    });
  } catch (error) {
    setState({
      connected: false,
      loading: false,
      error: error?.message ?? "Chart unavailable",
    });
  } finally {
    inflight = false;
  }
}

function locate() {
  if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      setState({
        coords: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        },
      });
      void refresh();
    },
    () => undefined,
    { timeout: 8000, maximumAge: 600_000 },
  );
}

export function startAstro() {
  if (started) return;
  started = true;
  locate();
  void refresh();
  timer = setInterval(() => void refresh(), REFRESH_MS);
}

export function stopAstro() {
  if (timer) clearInterval(timer);
  timer = null;
  started = false;
}

export const astroActions = {
  refresh,
  select(key) {
    setState({ selected: state.selected === key ? null : key });
  },
  clear() {
    setState({ selected: null });
  },
  toggleActive() {
    setState({ active: !state.active });
  },
};
