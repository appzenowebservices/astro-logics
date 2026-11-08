import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { readFile } from "node:fs/promises";
import { dirname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const publicRoot = normalize(join(here, "public"));
const vadRoot = normalize(join(publicRoot, "vad"));

const VAD_MIME = {
  ".mjs": "text/javascript",
  ".js": "text/javascript",
  ".wasm": "application/wasm",
  ".onnx": "application/octet-stream",
};

// onnxruntime-web dynamically import()s its wasm glue (*.mjs) at runtime. In
// dev, Vite's transform middleware 500s such requests for files under /public
// ("should not be imported from source code"), killing the VAD. Serve /vad/
// straight off disk before Vite's transforms so the raw Emscripten glue loads.
function vadStaticPlugin() {
  return {
    name: "vad-static-assets",
    configureServer(server) {
      server.middlewares.use("/vad", async (req, res, next) => {
        try {
          // Express strips the "/vad" mount prefix, leaving rel="/file".
          const rel = decodeURIComponent((req.url || "").split("?")[0]);
          const file = normalize(join(vadRoot, rel));
          if (!file.startsWith(vadRoot)) return next();
          const data = await readFile(file);
          const ext = file.slice(file.lastIndexOf(".")).toLowerCase();
          res.statusCode = 200;
          res.setHeader("Content-Type", VAD_MIME[ext] || "application/octet-stream");
          res.end(data);
        } catch (err) {
          next(err);
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const paperclipPort = parseInt(env.PAPERCLIP_PORT || "3100", 10);
  const hermesPort = parseInt(env.HERMES_PORT || "8765", 10);
  // Kaalvanta is the astrological control plane for the planet layer.
  const kaalvantaPort = parseInt(env.KAALVANTA_PORT || "8888", 10);

  return {
    plugins: [react(), vadStaticPlugin()],
    root: ".",
    resolve: {
      // transformers.js (STT) and kokoro-js (TTS) each bring their own nested
      // onnxruntime-web builds (1.26.0-dev / 1.22.0-dev). The 1.26.0-dev build
      // fails to create a session for whisper's blockwise-int8 ONNX files
      // (TransposeDQWeightsForMatMulNBits: missing scale). Dedupe to the root
      // 1.27.0 build, which handles them (and is already the build the VAD uses).
      dedupe: ["onnxruntime-web"],
    },
    build: {
      outDir: "dist",
      emptyOutDir: true,
    },
    // The landing route lazy-loads Remotion; pre-bundle it so a first visit
    // doesn't trigger a mid-session dependency re-optimize.
    optimizeDeps: {
      include: ["remotion", "@remotion/player"],
    },
    server: {
      port: 3000,
      proxy: {
        "/api": {
          target: `http://localhost:${paperclipPort}`,
          changeOrigin: true,
          ws: true,
        },
        "/hermes": {
          target: `http://localhost:${hermesPort}`,
          changeOrigin: true,
          ws: true,
          rewrite: (path) => path.replace(/^\/hermes/, ""),
        },
        // Live sidereal chart (planets + houses) from Kaalvanta.
        "/kaalvanta": {
          target: `http://localhost:${kaalvantaPort}`,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/kaalvanta/, ""),
        },
      },
    },
  };
});
