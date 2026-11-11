"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useSession } from "next-auth/react";
import { api } from "~/trpc/react";
import type { RouterOutputs } from "~/trpc/react";

export type NativityProfile = RouterOutputs["nativity"]["getCharts"][number];

const STORAGE_KEY = "kaalvanta.activeNativityChartId";
const EMPTY_CHARTS: NativityProfile[] = [];

interface ActiveProfileContextValue {
  charts: NativityProfile[];
  activeChartId: string;
  activeChart: NativityProfile | null;
  setActiveChartId: (id: string) => void;
  isLoading: boolean;
  isFetching: boolean;
  isAuthenticated: boolean;
  refetchCharts: () => void;
}

const ActiveProfileContext = createContext<ActiveProfileContextValue | null>(
  null,
);

function readStoredChartId() {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

/**
 * Owns the one profile the whole dashboard is looking at. The selection is
 * persisted in localStorage so it survives navigation and reloads, and every
 * screen that reads `getCharts` can follow the same active nativity.
 */
export function ActiveProfileProvider({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";

  const chartsQuery = api.nativity.getCharts.useQuery(undefined, {
    enabled: isAuthenticated,
    staleTime: 15_000,
  });

  const charts = chartsQuery.data ?? EMPTY_CHARTS;
  const [activeChartId, setActiveChartIdState] = useState(readStoredChartId);

  // Drop a stale stored id (deleted chart / different account) and fall back
  // to the newest chart as soon as the list is available.
  useEffect(() => {
    if (!charts.length) {
      if (!chartsQuery.isLoading) setActiveChartIdState("");
      return;
    }

    setActiveChartIdState((current) => {
      const stored = readStoredChartId();
      const valid = [current, stored].find(
        (id) => id && charts.some((chart) => chart.id === id),
      );
      return valid ?? charts[0]!.id;
    });
  }, [charts, chartsQuery.isLoading]);

  // Persist the resolved selection. Auto-selecting the first chart also lands
  // in localStorage, so the dropdown and the standalone profile page agree.
  useEffect(() => {
    if (!activeChartId) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, activeChartId);
    } catch {
      // Storage can be unavailable in private modes; selection still works
      // for the current session.
    }
  }, [activeChartId]);

  // Keep two open tabs in sync.
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && event.newValue) {
        setActiveChartIdState(event.newValue);
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") setActiveChartIdState("");
  }, [status]);

  const setActiveChartId = useCallback((id: string) => {
    setActiveChartIdState(id);
  }, []);

  const activeChart = useMemo(
    () => charts.find((chart) => chart.id === activeChartId) ?? null,
    [activeChartId, charts],
  );

  const { refetch: refetchChartsQuery } = chartsQuery;

  const refetchCharts = useCallback(() => {
    void refetchChartsQuery();
  }, [refetchChartsQuery]);

  const value = useMemo<ActiveProfileContextValue>(
    () => ({
      charts,
      activeChartId,
      activeChart,
      setActiveChartId,
      isLoading: chartsQuery.isLoading || status === "loading",
      isFetching: chartsQuery.isFetching,
      isAuthenticated,
      refetchCharts,
    }),
    [
      activeChart,
      activeChartId,
      charts,
      chartsQuery.isFetching,
      chartsQuery.isLoading,
      isAuthenticated,
      refetchCharts,
      setActiveChartId,
      status,
    ],
  );

  return (
    <ActiveProfileContext.Provider value={value}>
      {children}
    </ActiveProfileContext.Provider>
  );
}

export function useActiveProfile() {
  const context = useContext(ActiveProfileContext);
  if (!context) {
    throw new Error(
      "useActiveProfile must be used inside <ActiveProfileProvider>.",
    );
  }
  return context;
}
