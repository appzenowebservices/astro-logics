import type { McpToolDef } from "../registry.js";
import { hello } from "./hello.js";
import { getHistoryTool, getPriceTool, listSymbolsTool, getAccountTool } from "./market.js";
import { analyzeStateTool, scanWindowTool } from "./analysis.js";
import {
  placeOrderTool,
  closePositionTool,
  getPositionsTool,
  getOrdersTool,
  modifyOrderTool,
  cancelOrderTool,
  dealsHistoryTool,
} from "./trade.js";
import { getDefaultsTool, setDefaultsTool } from "./config.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const tools: Array<McpToolDef<any>> = [
  hello,
  getHistoryTool,
  getPriceTool,
  listSymbolsTool,
  getAccountTool,
  analyzeStateTool,
  scanWindowTool,
  placeOrderTool,
  closePositionTool,
  getPositionsTool,
  getOrdersTool,
  modifyOrderTool,
  cancelOrderTool,
  dealsHistoryTool,
  getDefaultsTool,
  setDefaultsTool,
];
