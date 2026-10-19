import { z } from "zod";
import type { McpToolDef } from "../registry.js";
import { bridge } from "../client/bridgeClient.js";
import { getDefaults, setDefaults, type TradingDefaults } from "../config.js";
import { assertTradingEnabled, assertVolumeWithinLimits } from "../risk.js";

export const placeOrderTool: McpToolDef<{
  symbol: z.ZodString;
  action: z.ZodEnum<["BUY", "SELL", "BUY_LIMIT", "BUY_STOP", "SELL_LIMIT", "SELL_STOP"]>;
  volume: z.ZodOptional<z.ZodNumber>;
  price: z.ZodOptional<z.ZodNumber>;
  sl: z.ZodOptional<z.ZodNumber>;
  tp: z.ZodOptional<z.ZodNumber>;
  magic: z.ZodOptional<z.ZodNumber>;
  comment: z.ZodOptional<z.ZodString>;
  deviation: z.ZodOptional<z.ZodNumber>;
  filling: z.ZodOptional<z.ZodEnum<["FOK", "IOC", "RETURN", "BOC"]>>;
}> = {
  name: "trade.place_order",
  description:
    "Place a market or pending order (BUY/SELL/BUY_LIMIT/BUY_STOP/SELL_LIMIT/SELL_STOP). Gated by TRADING_ENABLED and clamped by MAX_VOLUME. Omitted optional fields use config defaults.",
  inputSchema: {
    symbol: z.string().describe("MT5 symbol, e.g. EURUSD"),
    action: z.enum(["BUY", "SELL", "BUY_LIMIT", "BUY_STOP", "SELL_LIMIT", "SELL_STOP"]).describe("Order direction/type"),
    volume: z.number().positive().optional().describe("Lots (default from config)"),
    price: z.number().optional().describe("Required for pending orders; market orders use live price"),
    sl: z.number().optional().describe("Stop loss price"),
    tp: z.number().optional().describe("Take profit price"),
    magic: z.number().optional().describe("Magic number (default from config)"),
    comment: z.string().optional().describe("Order comment (default from config)"),
    deviation: z.number().optional().describe("Max deviation in points (default from config)"),
    filling: z.enum(["FOK", "IOC", "RETURN", "BOC"]).optional().describe("Order filling mode (default from config)"),
  },
  handler: async ({ symbol, action, volume, price, sl, tp, magic, comment, deviation, filling }) => {
    assertTradingEnabled();
    const d = getDefaults();
    const vol = assertVolumeWithinLimits(volume ?? d.volume);
    return bridge.placeOrder({
      symbol,
      action,
      volume: vol,
      ...(price !== undefined ? { price } : {}),
      ...(sl !== undefined ? { sl } : {}),
      ...(tp !== undefined ? { tp } : {}),
      magic: magic ?? d.magic,
      comment: comment ?? d.comment,
      deviation: deviation ?? d.deviation,
      filling: filling ?? d.filling,
    });
  },
};

export const closePositionTool: McpToolDef<{
  ticket: z.ZodNumber;
  volume: z.ZodOptional<z.ZodNumber>;
  deviation: z.ZodOptional<z.ZodNumber>;
}> = {
  name: "trade.close_position",
  description: "Close an open position by ticket (optionally a partial volume).",
  inputSchema: {
    ticket: z.number().int().describe("Position ticket from trade.get_positions"),
    volume: z.number().positive().optional().describe("Lots to close (defaults to full position)"),
    deviation: z.number().optional().describe("Max deviation in points"),
  },
  handler: async ({ ticket, volume, deviation }) => {
    assertTradingEnabled();
    return bridge.closePosition(ticket, {
      ...(volume !== undefined ? { volume } : {}),
      ...(deviation !== undefined ? { deviation } : {}),
    });
  },
};

export const getPositionsTool: McpToolDef<{ symbol: z.ZodOptional<z.ZodString> }> = {
  name: "trade.get_positions",
  description: "List open positions, optionally filtered by symbol.",
  inputSchema: {
    symbol: z.string().optional().describe("Filter by MT5 symbol"),
  },
  handler: async ({ symbol }) => {
    const data = await bridge.positions(symbol);
    return { count: data.length, positions: data };
  },
};

export const getOrdersTool: McpToolDef<{ symbol: z.ZodOptional<z.ZodString> }> = {
  name: "trade.get_orders",
  description: "List pending orders, optionally filtered by symbol.",
  inputSchema: {
    symbol: z.string().optional().describe("Filter by MT5 symbol"),
  },
  handler: async ({ symbol }) => {
    const data = await bridge.orders(symbol);
    return { count: data.length, orders: data };
  },
};

export const modifyOrderTool: McpToolDef<{
  ticket: z.ZodNumber;
  price: z.ZodOptional<z.ZodNumber>;
  sl: z.ZodOptional<z.ZodNumber>;
  tp: z.ZodOptional<z.ZodNumber>;
}> = {
  name: "trade.modify_order",
  description: "Modify a pending order's price / stop loss / take profit by ticket.",
  inputSchema: {
    ticket: z.number().int().describe("Pending order ticket from trade.get_orders"),
    price: z.number().optional().describe("New open price for the pending order"),
    sl: z.number().optional().describe("New stop loss"),
    tp: z.number().optional().describe("New take profit"),
  },
  handler: async ({ ticket, price, sl, tp }) => {
    assertTradingEnabled();
    return bridge.modifyOrder(ticket, {
      ...(price !== undefined ? { price } : {}),
      ...(sl !== undefined ? { sl } : {}),
      ...(tp !== undefined ? { tp } : {}),
    });
  },
};

export const cancelOrderTool: McpToolDef<{ ticket: z.ZodNumber }> = {
  name: "trade.cancel_order",
  description: "Cancel a pending order by ticket.",
  inputSchema: {
    ticket: z.number().int().describe("Pending order ticket from trade.get_orders"),
  },
  handler: async ({ ticket }) => {
    assertTradingEnabled();
    return bridge.cancelOrder(ticket);
  },
};

export const dealsHistoryTool: McpToolDef<{
  days: z.ZodOptional<z.ZodNumber>;
  symbol: z.ZodOptional<z.ZodString>;
}> = {
  name: "trade.get_history_deals",
  description: "List recent closed deals (filled orders), optionally filtered by symbol and lookback days.",
  inputSchema: {
    days: z.number().int().min(1).max(90).optional().describe("Lookback window in days (default 1)"),
    symbol: z.string().optional().describe("Filter by MT5 symbol"),
  },
  handler: async ({ days, symbol }) => {
    const data = await bridge.deals(days ?? 1, symbol);
    return { count: data.length, deals: data };
  },
};
