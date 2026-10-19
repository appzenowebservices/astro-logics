import { spawn, type ChildProcess } from "node:child_process";
import net from "node:net";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * Lifecycle manager for the Python MT5 bridge.
 *
 * If MT5_BRIDGE_URL is set, the server uses that external bridge and spawns
 * nothing. Otherwise it spawns bridge/env/Scripts/python.exe -m uvicorn (the
 * mock app when MT5_BRIDGE_MOCK=true), waits for /health, and kills the child
 * when the host process exits.
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, "..", "..");
const bridgeDir = path.join(projectRoot, "bridge");

let urlPromise: Promise<string> | null = null;

function findFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, "127.0.0.1", () => {
      const port = (srv.address() as net.AddressInfo).port;
      srv.close(() => resolve(port));
    });
    srv.on("error", reject);
  });
}

function pythonPath(): string {
  const candidates = [
    path.join(bridgeDir, "env", "Scripts", "python.exe"),
    path.join(bridgeDir, "env", "bin", "python"),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return "python";
}

async function waitForHealth(url: string, timeoutMs = 20_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${url}/health`);
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`MT5 bridge did not become healthy at ${url} within ${timeoutMs}ms`);
}

async function spawnBridge(): Promise<string> {
  const port = await findFreePort();
  const mock = process.env.MT5_BRIDGE_MOCK === "true";
  const appName = mock ? "bridge_mock" : "bridge";
  const python = pythonPath();
  const args = [
    "-m",
    "uvicorn",
    `${appName}:app`,
    "--host",
    "127.0.0.1",
    "--port",
    String(port),
    "--app-dir",
    bridgeDir,
  ];

  console.error(`[bridge] spawning ${python} ${args.join(" ")}`);
  const child: ChildProcess = spawn(python, args, {
    cwd: projectRoot,
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout?.on("data", (d) => process.stderr.write(`[bridge] ${d}`));
  child.stderr?.on("data", (d) => process.stderr.write(`[bridge] ${d}`));
  child.on("exit", (code) => {
    console.error(`[bridge] exited with code ${code}`);
  });
  

  process.on("exit", () => {
    if (!child.killed) child.kill();
  });

  const url = `http://127.0.0.1:${port}`;
  await waitForHealth(url);
  console.error(`[bridge] ready at ${url} (mock=${mock})`);
  return url;
}

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

export function getBridgeUrl(): Promise<string> {
  if (!urlPromise) {
    const external = process.env.MT5_BRIDGE_URL;
    urlPromise = external ? Promise.resolve(stripTrailingSlash(external)) : spawnBridge();
  }
  return urlPromise;
}
