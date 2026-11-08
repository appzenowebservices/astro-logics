// Vendor runtime binaries from node_modules into public/ so the voice loop
// starts without touching a CDN. Runs before dev and build; the generated
// binaries are gitignored (versions track package.json).
import { copyFileSync, mkdirSync, existsSync, realpathSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const nm = (pkg) => realpathSync(join(root, "node_modules", pkg));

const out = join(root, "public", "vad");
mkdirSync(out, { recursive: true });

const files = [
  [join(nm("@ricky0123/vad-web"), "dist"), "silero_vad_v5.onnx"],
  [join(nm("@ricky0123/vad-web"), "dist"), "vad.worklet.bundle.min.js"],
  // The VAD runs on the plain CPU wasm backend — only the threaded-simd pair is loaded.
  [join(nm("onnxruntime-web"), "dist"), "ort-wasm-simd-threaded.mjs"],
  [join(nm("onnxruntime-web"), "dist"), "ort-wasm-simd-threaded.wasm"],
];

for (const [dir, name] of files) {
  const src = join(dir, name);
  if (!existsSync(src)) {
    console.error(`copy-runtime-assets: missing ${src}`);
    process.exit(1);
  }
  copyFileSync(src, join(out, name));
}
console.log(`copy-runtime-assets: vendored ${files.length} files → public/vad/`);
