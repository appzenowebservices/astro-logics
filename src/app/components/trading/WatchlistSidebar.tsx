import { Plus } from "lucide-react";

const AVAILABLE_ASSETS = [
  { symbol: "GBPUSD", label: "GBP / USD", category: "Forex", exchange: "ICE" },
  { symbol: "EURUSD", label: "EUR / USD", category: "Forex", exchange: "ICE" },
  {
    symbol: "BTCUSD",
    label: "BTC / USD",
    category: "Crypto",
    exchange: "COINBASE",
  },
  { symbol: "AUDUSD", label: "AUD / USD", category: "Forex", exchange: "ICE" },
];

export default function WatchlistSidebar({
  activeSymbol,
  onAssetSelect,
  livePrice,
  currentHistoryClose,
}: {
  activeSymbol: string;
  onAssetSelect: (asset: (typeof AVAILABLE_ASSETS)[number]) => void;
  livePrice?: number;
  currentHistoryClose: number;
}) {
  return (
    <div className="z-20 hidden h-full w-56 flex-col border-l border-[rgba(42,65,112,0.12)] bg-[var(--color-primary-light)] md:flex">
      <div className="flex items-center justify-between border-b border-[rgba(42,65,112,0.12)] p-4">
        <span className="text-xs font-bold tracking-[0.2em] text-[var(--color-primary-dark)] uppercase">
          Watchlist
        </span>

        <Plus className="h-4 w-4 cursor-pointer text-[var(--color-primary-dark)]/60 transition hover:text-[var(--color-primary-dark)]" />
      </div>

      <div className="flex-1 overflow-y-auto">
        {AVAILABLE_ASSETS.map((asset) => {
          const isActive = asset.symbol === activeSymbol;
          const isForex = asset.category === "Forex";

          return (
            <div
              key={asset.symbol}
              onClick={() => onAssetSelect(asset)}
              className={`cursor-pointer border-b border-[rgba(42,65,112,0.06)] p-4 transition-all ${
                isActive
                  ? "border-l-4 border-[var(--color-accent-orange)] bg-white/40"
                  : "hover:bg-white/25"
              } `}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-sm font-semibold ${
                    isActive
                      ? "text-[var(--color-primary-dark)]"
                      : "text-[var(--color-primary-dark)]/80"
                  }`}
                >
                  {asset.symbol}
                </span>

                <span className="text-[10px] tracking-wider text-[var(--color-primary-dark)]/50 uppercase">
                  {asset.exchange}
                </span>
              </div>

              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-[var(--color-primary-dark)]/60">
                  {asset.label}
                </span>

                <span
                  className={`font-mono text-sm font-semibold ${
                    isActive
                      ? "text-[var(--color-accent-orange)]"
                      : "text-[var(--color-primary-dark)]/70"
                  }`}
                >
                  {isActive
                    ? (livePrice ?? currentHistoryClose).toFixed(
                        isForex ? 5 : 2,
                      )
                    : "—"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
