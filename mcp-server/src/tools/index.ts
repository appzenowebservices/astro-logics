import type { McpToolDef } from "../registry.js";
import type { z } from "zod";
import { hello } from "./hello.js";

/**
 * The tool list for this project.
 *
 * To add a domain tool:
 *   1. create src/tools/<tool>.ts exporting an McpToolDef (see hello.ts)
 *   2. import it here and add it to the array
 * That is the whole integration surface - domain services (db, apis, engines)
 * are imported inside each tool's handler.
 */
export const tools: Array<McpToolDef<z.ZodRawShape>> = [
  hello,
];
