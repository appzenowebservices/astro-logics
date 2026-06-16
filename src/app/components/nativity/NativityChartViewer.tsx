"use client";
import React from "react";
import { Loader, AlertCircle, Trash2 } from "lucide-react";
import { api } from "~/trpc/react";
import NativityChartDisplay from "./display/NativityChartDisplay";

interface NativityChartViewerProps {
  chartId: string;
  onDelete: () => void;
}

export default function NativityChartViewer({
  chartId,
  onDelete,
}: NativityChartViewerProps) {
  const chartQuery = api.nativity.getChartById.useQuery({ id: chartId });

  if (chartQuery.isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-stone-500">
          <Loader size={24} className="animate-spin text-[#E29626]" />
          <span className="text-xs">Loading chart...</span>
        </div>
      </div>
    );
  }

  if (chartQuery.isError) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-red-500/70">
          <AlertCircle size={24} />
          <span className="text-xs">Failed to load chart</span>
        </div>
      </div>
    );
  }

  if (!chartQuery.data) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="text-sm text-stone-500">Chart not found</div>
      </div>
    );
  }

  const chart = chartQuery.data;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-white">
      {/* Chart Display */}
      <div className="flex-1 overflow-hidden">
        <NativityChartDisplay
          chartId={chartId}
          planets={
            chart.ephemerisData?.planets?.map((p) => ({
              id: p.id,
              planet: p.planet,
              longitude: p.longitude,
              latitude: p.latitude,
              speed: p.speed,
              acceleration: p.acceleration,
              direction: p.direction,
              houseCusp: p.houseCusp || 1,
              houseDegree: p.houseDegree || 0,
              houseSign: p.houseSign || "ARIES",
            })) || []
          }
          aspects={chart.aspects || []}
          angularDistances={chart.geometryIndex?.angularDistances || []}
          planetaryProfiles={
            chart.planetaryProfiles?.map((p) => ({
              id: p.id,
              planet: p.planet,
              dignityType: p.dignity || "Neutral",
              strength: p.strength,
              primaryDomain: p.primaryDomain || "Unknown",
              secondaryDomain: p.secondaryDomain,
              visibility: p.visibility,
              saturationLevel: p.saturationLevel,
            })) || []
          }
        />
      </div>
    </div>
  );
}
