// Chart layout and behavior configuration
export const CHART_CONFIG = {
  layout: {
    background: { color: "#ffffff" }, // Clean Bone White background
    textColor: "#64748b", // slate-500 for better readability
    fontSize: 11,
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  timeScale: {
    timeVisible: true,
    secondsVisible: false,
    rightOffset: 20, // More breathing room on the right
    borderColor: "#f1f5f9", // slate-100
  },
  priceScale: {
    borderColor: "#f1f5f9", // slate-100
  },
  grid: {
    vertLines: {
      color: "#f8fafc", // slate-50 (Near invisible)
      visible: true,
    },
    hLines: {
      color: "#f8fafc", // slate-50
      visible: true,
    },
  },
  crosshair: {
    vertLine: {
      color: "#6366f1", // indigo-500
      width: 1,
      style: 2, // Dashed
      labelBackgroundColor: "#1e293b", // slate-800
    },
    horzLine: {
      color: "#6366f1", // indigo-500
      width: 1,
      style: 2, // Dashed
      labelBackgroundColor: "#1e293b", // slate-800
    },
  },
  watermark: {
    visible: true,
    text: "REGISTRY LEDGER",
    fontSize: 48,
    color: "rgba(99, 102, 241, 0.03)", // Very faint Indigo
    horzAlign: "center",
    vertAlign: "center",
  },
} as const;

export const CANDLESTICK_CONFIG = {
  upColor: "#10b981", // emerald-500
  downColor: "#f43f5e", // rose-500
  borderVisible: true,
  borderColor: "#10b981", // emerald-500
  borderUpColor: "#10b981",
  borderDownColor: "#f43f5e",
  wickUpColor: "#10b981",
  wickDownColor: "#f43f5e",
} as const;
