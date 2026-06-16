"use client";

import React, { useMemo } from "react";

interface TimeSeriesDataPoint {
  date: string;
  auspiciousness: number;
  vara: string;
  nakshatra: string;
  avgCellScore: number;
}

export default function SarvatobhadraTimeSeries({
  data,
}: {
  data?: TimeSeriesDataPoint[];
}) {
  const chartWidth = 900;
  const chartHeight = 300;
  const padding = { top: 30, right: 30, bottom: 40, left: 50 };

  const chartArea = {
    width: chartWidth - padding.left - padding.right,
    height: chartHeight - padding.top - padding.bottom,
  };

  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data.map((point) => ({
      ...point,
      date: new Date(point.date),
    }));
  }, [data]);

  const stats = useMemo(() => {
    if (processedData.length === 0) return { min: 0, max: 100, avg: 0 };

    const scores = processedData.map((d) => d.auspiciousness);
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

    return { min, max, avg };
  }, [processedData]);

  const scaleY = (value: number) => {
    const range = stats.max - stats.min || 100;
    const normalized = (value - stats.min) / range;
    return padding.top + chartArea.height - normalized * chartArea.height;
  };

  const scaleX = (index: number) => {
    return (
      padding.left + (index / (processedData.length - 1 || 1)) * chartArea.width
    );
  };

  const generatePath = () => {
    if (processedData.length < 2) return "";

    return processedData
      .map((d, idx) => {
        const x = scaleX(idx);
        const y = scaleY(d.auspiciousness);
        return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  };

  const generateAreas = () => {
    if (processedData.length < 2) return "";

    const points = processedData
      .map((d, idx) => {
        const x = scaleX(idx);
        const y = scaleY(d.auspiciousness);
        return `${x},${y}`;
      })
      .join(" ");

    const lastX = scaleX(processedData.length - 1);
    const bottomRight = `${lastX},${padding.top + chartArea.height}`;
    const firstX = scaleX(0);
    const bottomLeft = `${firstX},${padding.top + chartArea.height}`;

    return `M ${points} L ${bottomRight} L ${bottomLeft} Z`;
  };

  return (
    <div className="w-full rounded-xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="mb-6">
        <h3 className="mb-4 text-lg font-semibold text-white">
          Auspiciousness Timeline
        </h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="rounded-lg border border-white/10 bg-white/5 p-3">
            <p className="text-xs text-white/60">Highest Score</p>
            <p className="text-xl font-bold text-green-400">{stats.max}</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-3">
            <p className="text-xs text-white/60">Average Score</p>
            <p className="text-xl font-bold text-blue-400">{stats.avg}</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-3">
            <p className="text-xs text-white/60">Lowest Score</p>
            <p className="text-xl font-bold text-red-400">{stats.min}</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-3">
            <p className="text-xs text-white/60">Data Points</p>
            <p className="text-xl font-bold text-white">
              {processedData.length}
            </p>
          </div>
        </div>
      </div>

      {/* Financial-style chart */}
      <div className="overflow-x-auto rounded-lg bg-slate-950/50 p-4">
        <svg width={chartWidth} height={chartHeight} className="min-w-full">
          {/* Background grid */}
          <defs>
            <pattern
              id="gridPattern"
              width="50"
              height="30"
              patternUnits="userSpaceOnUse"
            >
              <path
                d={`M 50 0 L 0 0 0 30`}
                fill="none"
                stroke="#334155"
                strokeWidth="0.5"
              />
            </pattern>
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
          </defs>

          <rect
            x={padding.left}
            y={padding.top}
            width={chartArea.width}
            height={chartArea.height}
            fill="url(#gridPattern)"
          />

          {/* Y-axis labels */}
          {[0, 25, 50, 75, 100].map((val) => (
            <g key={`y-label-${val}`}>
              <line
                x1={padding.left - 5}
                y1={scaleY(val)}
                x2={padding.left}
                y2={scaleY(val)}
                stroke="#64748b"
                strokeWidth="1"
              />
              <text
                x={padding.left - 10}
                y={scaleY(val) + 4}
                textAnchor="end"
                fill="#94a3b8"
                fontSize="11"
              >
                {val}
              </text>
            </g>
          ))}

          {/* X-axis */}
          <line
            x1={padding.left}
            y1={padding.top + chartArea.height}
            x2={padding.left + chartArea.width}
            y2={padding.top + chartArea.height}
            stroke="#64748b"
            strokeWidth="1"
          />

          {/* Y-axis */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={padding.top + chartArea.height}
            stroke="#64748b"
            strokeWidth="1"
          />

          {/* Area under curve */}
          <path d={generateAreas()} fill="url(#areaGradient)" />

          {/* Main line */}
          <path
            d={generatePath()}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {processedData.map((d, idx) => {
            const x = scaleX(idx);
            const y = scaleY(d.auspiciousness);
            const isHigh = d.auspiciousness >= stats.max * 0.8;

            return (
              <circle
                key={`point-${idx}`}
                cx={x}
                cy={y}
                r={isHigh ? 4 : 2}
                fill={isHigh ? "#10b981" : "#3b82f6"}
                stroke="white"
                strokeWidth="1"
                opacity="0.8"
              />
            );
          })}

          {/* X-axis date labels (sample) */}
          {processedData.length > 0 &&
            [
              0,
              Math.floor(processedData.length / 4),
              Math.floor((processedData.length * 2) / 4),
              Math.floor((processedData.length * 3) / 4),
              processedData.length - 1,
            ]
              .filter((v) => v >= 0 && v < processedData.length)
              .map((idx) => (
                <text
                  key={`x-label-${idx}`}
                  x={scaleX(idx)}
                  y={padding.top + chartArea.height + 20}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="10"
                >
                  {processedData[idx].date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </text>
              ))}

          {/* Y-axis label */}
          <text
            x={-(padding.top + chartArea.height / 2)}
            y={15}
            textAnchor="middle"
            fill="#94a3b8"
            fontSize="11"
            transform="rotate(-90)"
          >
            Auspiciousness Score
          </text>
        </svg>
      </div>

      {/* Detailed table below chart */}
      {processedData.length > 0 && (
        <div className="mt-6">
          <h4 className="mb-3 text-sm font-semibold text-white">
            Timeline Details
          </h4>
          <div className="max-h-40 overflow-y-auto">
            <table className="w-full text-xs text-white/70">
              <thead className="sticky top-0 border-b border-white/10 bg-slate-900">
                <tr>
                  <th className="p-2 text-left">Date</th>
                  <th className="p-2 text-center">Score</th>
                  <th className="p-2 text-center">Vara</th>
                  <th className="p-2 text-left">Nakshatra</th>
                </tr>
              </thead>
              <tbody>
                {processedData.slice(0, 10).map((d, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-white/5 hover:bg-white/5"
                  >
                    <td className="p-2">
                      {d.date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="p-2 text-center">
                      <span
                        className={`font-bold ${d.auspiciousness >= 70 ? "text-green-400" : d.auspiciousness >= 50 ? "text-blue-400" : "text-red-400"}`}
                      >
                        {d.auspiciousness}
                      </span>
                    </td>
                    <td className="p-2 text-center">
                      {d.vara.substring(0, 3)}
                    </td>
                    <td className="truncate p-2">{d.nakshatra}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
