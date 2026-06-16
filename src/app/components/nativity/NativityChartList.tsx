"use client";
import React from "react";
import {
  Trash2,
  Eye,
  Loader,
  AlertCircle,
  Calendar,
  MapPin,
  Globe,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";

interface Chart {
  id: string;
  name: string;
  description?: string | null;
  birthDateTime: Date;
  locationName?: string | null;
  latitude: number;
  longitude: number;
  coordinateSystem: string;
  createdAt: Date;
}

interface NativityChartListProps {
  charts: Chart[];
  isLoading: boolean;
  isError: boolean;
  onSelectChart: (chart: { id: string; name: string }) => void;
  onDeleteChart: (chartId: string) => void;
}

export default function NativityChartList({
  charts,
  isLoading,
  isError,
  onSelectChart,
  onDeleteChart,
}: NativityChartListProps) {
  if (isLoading)
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader
          className="animate-spin text-[var(--color-accent-orange)]"
          size={32}
        />
      </div>
    );
  if (isError)
    return (
      <div className="w-full p-8 text-center font-bold text-red-600">
        Failed to load archives.
      </div>
    );
  if (charts.length === 0)
    return (
      <div className="w-full p-12 text-center text-slate-400 italic">
        No records found.
      </div>
    );

  return (
    <div className="h-full w-full overflow-y-auto bg-slate-50 p-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {charts.map((chart, index) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            key={chart.id}
            className="group rounded-lg border-2 border-slate-200 bg-white p-6 transition-all hover:border-[var(--color-accent-orange)]"
          >
            {/* Header */}
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h3 className="text-xl font-black tracking-tight text-[var(--color-primary-dark)] uppercase">
                  {chart.name}
                </h3>
                <p className="mt-1 text-xs font-bold text-slate-500 uppercase">
                  {chart.description || "No description"}
                </p>
              </div>
              <button
                onClick={() => onDeleteChart(chart.id)}
                className="text-slate-300 transition-colors hover:text-red-500"
              >
                <Trash2 size={18} />
              </button>
            </div>

            {/* Data Grid */}
            <div className="mb-6 space-y-3">
              {[
                {
                  icon: Calendar,
                  label: "Date",
                  val: new Date(chart.birthDateTime).toLocaleDateString(),
                },
                {
                  icon: MapPin,
                  label: "Location",
                  val: chart.locationName || "Unmarked",
                },
                { icon: Globe, label: "System", val: chart.coordinateSystem },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex justify-between border-b border-slate-100 pb-2 text-xs font-bold uppercase"
                >
                  <span className="flex items-center gap-2 text-slate-400">
                    <item.icon size={14} /> {item.label}
                  </span>
                  <span className="text-[var(--color-primary-dark)]">
                    {item.val}
                  </span>
                </div>
              ))}
            </div>

            {/* Footer Action */}
            <button
              onClick={() => onSelectChart({ id: chart.id, name: chart.name })}
              className="w-full bg-[var(--color-primary-dark)] py-3 text-xs font-black tracking-[0.2em] text-white uppercase transition-all hover:bg-[var(--color-accent-orange)] hover:text-[var(--color-primary-dark)]"
            >
              Open Chart
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
