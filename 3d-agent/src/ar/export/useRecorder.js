// Export layer: records what the user sees. The camera <video> and the WebGL
// canvas are composited into one 2D canvas (cover-fit, mirror-aware) and fed to
// MediaRecorder. The file downloads automatically on stop.

import { useCallback, useEffect, useRef, useState } from "react";

const MIME_CANDIDATES = [
  "video/mp4;codecs=avc1.42E01E",
  "video/webm;codecs=vp9",
  "video/webm;codecs=vp8",
  "video/webm",
  "video/mp4",
];

function pickMime() {
  if (typeof MediaRecorder === "undefined" || !MediaRecorder.isTypeSupported) return "";
  return MIME_CANDIDATES.find((mime) => MediaRecorder.isTypeSupported(mime)) ?? "";
}

function drawCover(ctx, source, sw, sh, dw, dh) {
  const scale = Math.max(dw / sw, dh / sh);
  const w = sw * scale;
  const h = sh * scale;
  ctx.drawImage(source, (dw - w) / 2, (dh - h) / 2, w, h);
}

export function useRecorder({ videoRef, glRef, isMirrored }) {
  const supported =
    typeof window !== "undefined" &&
    typeof MediaRecorder !== "undefined" &&
    typeof HTMLCanvasElement !== "undefined" &&
    typeof HTMLCanvasElement.prototype.captureStream === "function";

  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [lastExport, setLastExport] = useState(null);

  const mixRef = useRef(null);
  const rafRef = useRef(0);
  const recRef = useRef(null);
  const timerRef = useRef(0);
  const startedAtRef = useRef(0);

  const stop = useCallback(() => {
    if (recRef.current && recRef.current.state !== "inactive") recRef.current.stop();
  }, []);

  const start = useCallback(() => {
    if (!supported || recRef.current) return;
    const glCanvas = glRef.current;
    if (!glCanvas) return;

    const width = Math.round((glCanvas.clientWidth || glCanvas.width || 720) / 2) * 2;
    const height = Math.round((glCanvas.clientHeight || glCanvas.height || 1280) / 2) * 2;
    const mix = mixRef.current ?? (mixRef.current = document.createElement("canvas"));
    mix.width = width;
    mix.height = height;
    const ctx = mix.getContext("2d");

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      const video = videoRef.current;
      ctx.save();
      if (isMirrored()) {
        ctx.translate(mix.width, 0);
        ctx.scale(-1, 1);
      }
      if (video && video.readyState >= 2 && video.videoWidth) {
        drawCover(ctx, video, video.videoWidth, video.videoHeight, mix.width, mix.height);
      } else {
        ctx.fillStyle = "#070b14";
        ctx.fillRect(0, 0, mix.width, mix.height);
      }
      ctx.restore();
      ctx.drawImage(glCanvas, 0, 0, mix.width, mix.height);
    };
    draw();

    const stream = mix.captureStream(30);
    const mimeType = pickMime();
    const recorder = new MediaRecorder(stream, {
      ...(mimeType ? { mimeType } : {}),
      videoBitsPerSecond: 8_000_000,
    });
    const chunks = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size) chunks.push(event.data);
    };

    recorder.onstop = () => {
      cancelAnimationFrame(rafRef.current);
      clearInterval(timerRef.current);
      stream.getTracks().forEach((track) => track.stop());

      const type = recorder.mimeType || mimeType || "video/webm";
      const ext = type.includes("mp4") ? "mp4" : "webm";
      const blob = new Blob(chunks, { type });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `mithuna-ar-${Date.now()}.${ext}`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30_000);

      recRef.current = null;
      setRecording(false);
      setElapsed(0);
      setLastExport({ ext, at: Date.now() });
    };

    recorder.start(1000);
    recRef.current = recorder;
    startedAtRef.current = performance.now();
    setRecording(true);
    timerRef.current = setInterval(
      () => setElapsed((performance.now() - startedAtRef.current) / 1000),
      250
    );
  }, [supported, videoRef, glRef, isMirrored]);

  useEffect(
    () => () => {
      cancelAnimationFrame(rafRef.current);
      clearInterval(timerRef.current);
      if (recRef.current && recRef.current.state !== "inactive") recRef.current.stop();
    },
    []
  );

  return { supported, recording, elapsed, lastExport, start, stop };
}
