"use client";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Plus, ChevronLeft, Star } from "lucide-react";
import { api } from "~/trpc/react";
import { motion, AnimatePresence } from "framer-motion";
import NativityChartList from "../nativity/NativityChartList";
import NativityChartViewer from "../nativity/NativityChartViewer";

type ViewMode = "list" | "view";

interface SelectedChart {
  id: string;
  name: string;
}

export default function NativityChart() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedChart, setSelectedChart] = useState<SelectedChart | null>(
    null,
  );
  const handledDeepLink = useRef(false);

  const chartsQuery = api.nativity.getCharts.useQuery();

  const deleteChart = api.nativity.deleteChart.useMutation({
    onSuccess: () => {
      chartsQuery.refetch();
      setViewMode("list");
      setSelectedChart(null);
    },
  });

  const handleSelectChart = (chart: SelectedChart) => {
    setSelectedChart(chart);
    setViewMode("view");
  };

  // `/nativity?chart=<id>` (returned by the unified create intake) opens the
  // matching chart once the archive has loaded.
  useEffect(() => {
    if (handledDeepLink.current) return;

    const chartId = new URLSearchParams(window.location.search).get("chart");
    if (!chartId) {
      handledDeepLink.current = true;
      return;
    }

    const chart = chartsQuery.data?.find((entry) => entry.id === chartId);
    if (!chart) return;

    handledDeepLink.current = true;
    setSelectedChart({ id: chart.id, name: chart.name });
    setViewMode("view");
  }, [chartsQuery.data]);

  const handleDeleteChart = async (chartId: string) => {
    if (confirm("Are you sure you want to delete this chart?")) {
      await deleteChart.mutateAsync({ id: chartId });
    }
  };

  const handleBack = () => {
    setViewMode("list");
    setSelectedChart(null);
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[var(--color-primary-dark)]">
      {/* Cinematic Header: Saturnine Theme */}
      <div className="relative z-20 flex items-center justify-between border-b border-[var(--color-ring-bronze)]/25 bg-[var(--color-primary-dark)] p-6">
        <div className="flex items-center gap-4">
          <div className="rounded-lg border border-[var(--color-accent-orange)]/20 bg-[var(--color-accent-orange)]/10 p-2">
            <Star size={16} className="text-[var(--color-accent-orange)]" />
          </div>
          <div className="flex flex-col">
            <span className="text-[12px] font-black tracking-[0.3em] text-[var(--color-ring-bronze)] uppercase">
              {viewMode === "list" ? "Archive" : "Navigation"}
            </span>
            <h2 className="text-sm font-black tracking-tighter text-[var(--color-primary-light)] uppercase">
              {viewMode === "list" && "Nativity Charts"}
              {viewMode === "view" &&
                `${selectedChart?.name || "Chart Explorer"}`}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {viewMode === "list" ? (
            <Link
              href="/nativity/create?return=/nativity"
              className="flex items-center gap-2 rounded-full bg-[var(--color-accent-orange)] px-5 py-2 text-[12px] font-black tracking-widest text-white uppercase transition-all hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary-dark)] active:scale-95"
            >
              <Plus size={14} strokeWidth={3} />
              Add Chart
            </Link>
          ) : (
            <button
              onClick={handleBack}
              className="flex items-center gap-2 rounded-full border border-[var(--color-ring-bronze)]/20 px-4 py-2 text-[12px] font-black tracking-widest text-[var(--color-ring-bronze)] uppercase transition-colors hover:text-[var(--color-primary-light)]"
            >
              <ChevronLeft size={14} strokeWidth={3} />
              Back
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area: Reintroducing Moon Background */}
      <div className="relative flex-1 overflow-hidden bg-[var(--color-primary-dark)] p-2 md:p-4">
        <motion.div
          layout
          className="relative h-full w-full overflow-hidden rounded-[28px] border border-[var(--color-ring-bronze)]/40 bg-[var(--color-primary-light)] shadow-sm"
        >
          <div className="custom-scrollbar relative z-10 h-full w-full overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={viewMode}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4, ease: "circOut" }}
                className="h-full"
              >
                {viewMode === "list" && (
                  <div className="p-8">
                    <NativityChartList
                      charts={chartsQuery.data || []}
                      isLoading={chartsQuery.isLoading}
                      isError={chartsQuery.isError}
                      onSelectChart={handleSelectChart}
                      onDeleteChart={handleDeleteChart}
                    />
                  </div>
                )}

                {viewMode === "view" && selectedChart && (
                  <div className="h-full">
                    <NativityChartViewer
                      chartId={selectedChart.id}
                      onDelete={() => handleDeleteChart(selectedChart.id)}
                    />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--color-ring-bronze);
          border-radius: 10px;
          opacity: 0.3;
        }
      `}</style>
    </div>
  );
}
