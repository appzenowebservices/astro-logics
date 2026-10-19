#!/usr/bin/env node
/**
 * db-audit — read-only database snapshot for manual E2E testing.
 *
 * Usage:
 *   node scripts/db-audit.mjs                # collection counts
 *   node scripts/db-audit.mjs --shapes       # + isVerified field shapes
 *   node scripts/db-audit.mjs --json         # machine-readable output
 *
 * Prints only counts and field names — never documents or secrets.
 * Uses the mongodb driver (not Prisma) so it works even when the Prisma
 * engine is unhappy with TLS/Atlas.
 */
import { readFileSync } from "node:fs";
import { setServers } from "node:dns";
import { MongoClient } from "mongodb";

setServers(["8.8.8.8", "1.1.1.1"]);

function loadEnv(key, path = ".env") {
  try {
    const env = readFileSync(path, "utf8").replace(/^\uFEFF/, "");
    const m = env.match(new RegExp(`^${key}=(.*)$`, "m"));
    return m ? m[1].trim().replace(/^["']|["']$/g, "") : null;
  } catch {
    return null;
  }
}

const dbUrl = process.env.DATABASE_URL ?? loadEnv("DATABASE_URL");
if (!dbUrl) {
  console.error("DATABASE_URL is not set (env or .env).");
  process.exit(1);
}

try {
  const u = new URL(dbUrl);
  console.log(`db: ${u.host}${u.pathname}`); // host + db name only
} catch {
  console.log("db: (unparseable DATABASE_URL)");
}

const withShapes = process.argv.includes("--shapes");
const asJson = process.argv.includes("--json");

const client = new MongoClient(dbUrl, { family: 4 });

try {
  await client.connect();
  const db = client.db();

  const names = (await db.listCollections().toArray())
    .map((c) => c.name)
    .sort((a, b) => a.localeCompare(b));

  const counts = {};
  for (const name of names) counts[name] = await db.collection(name).countDocuments();

  let shapes = null;
  if (withShapes) {
    shapes = {};
    for (const model of ["User", "Vendor", "DeliveryPartner", "AreaManager"]) {
      if (!names.includes(model)) continue;
      const first = await db.collection(model).findOne({});
      const v = first?.isVerified;
      shapes[model] = {
        rows: counts[model],
        isVerified:
          v === undefined
            ? "missing"
            : v === null
              ? "null"
              : typeof v === "boolean"
                ? "boolean"
                : typeof v === "object"
                  ? `{email:${typeof v.email},mobile:${typeof v.mobile}}`
                  : typeof v,
      };
    }
  }

  if (asJson) {
    console.log(JSON.stringify({ counts, shapes }, null, 2));
  } else {
    const nonEmpty = names.filter((n) => counts[n] > 0);
    console.log(`\ncollections: ${names.length}, non-empty: ${nonEmpty.length}\n`);
    for (const name of names) {
      console.log(`${counts[name] > 0 ? "*" : "-"} ${String(counts[name]).padStart(6)}  ${name}`);
    }
    if (shapes) {
      console.log("\nisVerified shape:");
      for (const [model, info] of Object.entries(shapes)) {
        console.log(`  ${model}: rows=${info.rows} isVerified=${info.isVerified}`);
      }
    }
  }
} catch (error) {
  console.error(`\nAudit failed: ${error instanceof Error ? error.message : error}`);
  process.exit(1);
} finally {
  await client.close();
}
