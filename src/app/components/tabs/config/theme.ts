// Theme and color configuration
export const CHART_THEME = {
  background: "#0F0D0C",
  textColor: "#9CA3AF",
  candles: {
    up: "#34D399",
    down: "#EF4444",
  },
  grid: {
    vertical: "#1F1F1F",
    horizontal: "#1F1F1F",
  },
} as const;

export const TAILWIND_THEME = {
  bg: {
    primary: "bg-[#0F0D0C]",
    secondary: "bg-[#14110F]",
    tertiary: "bg-[#1F1A17]",
  },
  border: {
    primary: "border-[#2D241E]",
  },
  text: {
    primary: "text-stone-100",
    secondary: "text-stone-300",
    muted: "text-stone-500",
    accent: "text-[#E29626]",
  },
  accent: "#E29626",
} as const;
