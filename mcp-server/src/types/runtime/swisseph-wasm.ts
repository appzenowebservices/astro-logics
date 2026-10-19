// Runtime shim for swisseph-wasm.
//
// The package ships an import-only exports map (no "default" condition), which
// breaks tsx's CJS-based resolution of static imports ("No exports main
// defined"). Direct file-path require() bypasses the exports map entirely and
// returns the constructable class synchronously (Node 22+ supports
// require(ESM) for synchronous modules). tsconfig.json maps "swisseph-wasm" to
// this file; the parent project's swissEph.ts is unaffected inside Next.
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const pkgRoot = path.dirname(require.resolve("swisseph-wasm/package.json"));
const entry = path.join(pkgRoot, "src", "swisseph.js");

// eslint-disable-next-line @typescript-eslint/no-require-imports
const namespace = require(entry) as { default?: unknown };

// require(ESM) returns the module namespace; the class is the default export.
export default (namespace.default ?? namespace);
