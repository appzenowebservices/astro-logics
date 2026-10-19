import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/** Read a key from the environment, falling back to the app's .env file. */
export function appEnv(key: string): string | undefined {
  if (process.env[key]) return process.env[key];

  try {
    const raw = readFileSync(resolve(process.cwd(), ".env"), "utf8").replace(
      /^\uFEFF/,
      "",
    );
    const m = raw.match(new RegExp(`^${key}=(.*)$`, "m"));
    return m ? m[1]?.trim().replace(/^["']|["']$/g, "") : undefined;
  } catch {
    return undefined;
  }
}
