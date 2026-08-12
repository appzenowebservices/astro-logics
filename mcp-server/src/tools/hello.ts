import { z } from "zod";
import type { McpToolDef } from "../registry.js";

export const hello: McpToolDef<{ name?: z.ZodOptional<z.ZodString> }> = {
  name: "hello",
  description:
    "Ping this MCP server and return its identity. Use this to verify connectivity before relying on domain tools.",
  inputSchema: {
    name: z.string().optional().describe("Your name, if you want a greeting."),
  },
  handler: async ({ name }) => ({
    server: process.env.SERVER_NAME ?? "myproject",
    message: `Hello${name ? `, ${name}` : ""}! MCP server is up and reachable.`,
    now: new Date().toISOString(),
  }),
};
