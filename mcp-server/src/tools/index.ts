import type { McpToolDef } from "../registry.js";
import { hello } from "./hello.js";
import { computeNatalChartTool } from "./natal.js";
import { computeTransitsTool } from "./transits.js";
import { generateReadingTool } from "./reading.js";
import { computePersonalityVectorsTool } from "./personality.js";
import { computeFoundersChartTool } from "./founders.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const tools: Array<McpToolDef<any>> = [
  hello,
  computeNatalChartTool,
  computeTransitsTool,
  generateReadingTool,
  computePersonalityVectorsTool,
  computeFoundersChartTool,
];
