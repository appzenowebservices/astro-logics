import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerTools } from "./registry.js";
import { tools } from "./tools/index.js";

export interface McpServerConfig {
  name: string;
  version: string;
}

export function createMcpServer(config: McpServerConfig): McpServer {
  const server = new McpServer(
    { name: config.name, version: config.version },
    { capabilities: { tools: {} } },
  );
  registerTools(server, tools);
  return server;
}
