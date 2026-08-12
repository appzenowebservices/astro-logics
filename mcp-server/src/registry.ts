import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { z } from "zod";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

export type ToolArgs<TInput extends z.ZodRawShape> = z.objectOutputType<TInput, z.ZodTypeAny>;

/**
 * A tool definition is the entire per-project surface of this scaffold.
 * Each tool lives in its own file under src/tools/ and exports one of these.
 */
export interface McpToolDef<TInput extends z.ZodRawShape> {
  name: string;
  description: string;
  inputSchema: TInput;
  handler: (args: ToolArgs<TInput>) => unknown | Promise<unknown>;
}

export function textResult(data: unknown): CallToolResult {
  const text = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  return { content: [{ type: "text", text }] };
}

export function errorResult(error: unknown): CallToolResult {
  const message = error instanceof Error ? error.message : String(error);
  return { content: [{ type: "text", text: `ERROR: ${message}` }], isError: true };
}

/**
 * Wires every tool into the MCP server with zod validation (handled by the
 * SDK) and a uniform error wrapper so a throwing handler never kills the
 * session.
 */
export function registerTools(server: McpServer, tools: Array<McpToolDef<z.ZodRawShape>>): void {
  for (const tool of tools) {
    server.registerTool(
      tool.name,
      {
        title: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      },
      async (args) => {
        try {
          return textResult(await tool.handler(args));
        } catch (error) {
          return errorResult(error);
        }
      },
    );
  }
}
