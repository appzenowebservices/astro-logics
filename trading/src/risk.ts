import { maxVolume, tradingEnabled } from "./config.js";

/**
 * Risk guards for order-mutating tools.
 *
 * TRADING_ENABLED is the master gate (default off - keep it off unless you
 * intend live/demo order execution). MAX_VOLUME clamps per-order lot size.
 * These throw, and the registry wraps the throw into an isError MCP result.
 */
export function assertTradingEnabled(): void {
  if (!tradingEnabled) {
    throw new Error(
      "Trading is disabled (TRADING_ENABLED is not 'true'). " +
        "Set TRADING_ENABLED=true in .env only when you intend order execution on this account.",
    );
  }
}

export function assertVolumeWithinLimits(volume: number): number {
  if (!Number.isFinite(volume) || volume <= 0) {
    throw new Error(`Invalid volume: ${volume}. Volume must be a positive number of lots.`);
  }
  if (volume > maxVolume) {
    throw new Error(
      `Volume ${volume} exceeds the configured MAX_VOLUME clamp (${maxVolume}). Refusing to place order.`,
    );
  }
  return volume;
}
