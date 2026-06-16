export const ASSETS = [
  { symbol: "BTCUSDT", name: "Bitcoin", icon: "₿" },
  { symbol: "ETHUSDT", name: "Ethereum", icon: "Ξ" },
  { symbol: "BNBUSDT", name: "Binance Coin", icon: "Ⓑ" },
  { symbol: "ADAUSDT", name: "Cardano", icon: "∅" },
  { symbol: "XRPUSDT", name: "Ripple", icon: "✕" },
  { symbol: "DOGEUSDT", name: "Dogecoin", icon: "Ð" },
  { symbol: "GBPUSDT", name: "British Pound", icon: "£" },
] as const;

export const TIMEFRAMES = [
  { value: "1m", label: "1m" },
  { value: "5m", label: "5m" },
  { value: "15m", label: "15m" },
  { value: "1h", label: "1h" },
  { value: "4h", label: "4h" },
  { value: "1d", label: "1d" },
  { value: "1w", label: "1w" },
  { value: "1M", label: "1M" },
] as const;

export const KLINES_LIMIT: Record<string, number> = {
  "1m": 300,
  "5m": 288,
  "15m": 288,
  "1h": 168,
  "4h": 180,
  "1d": 150,
  "1w": 156,
  "1M": 60,
} as const;
