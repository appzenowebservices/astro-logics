"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";

type Tab = "generate" | "vision" | "live";

const API_KEY = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || "";

export default function VizPage() {
  const [activeTab, setActiveTab] = useState<Tab>("generate");

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100">
      <div className="mx-auto max-w-6xl p-4 pb-8 sm:p-6">
        {/* Header */}
        <header className="mb-4 border-b border-slate-800 pb-4 sm:mb-6">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Astro VIZ
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Generate / Analyze / Live Vision
          </p>
        </header>

        {/* Tabs - scrollable on mobile */}
        <div className="mb-6 flex w-fit gap-1 overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/80 p-1">
          {(["generate", "vision", "live"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap capitalize transition sm:px-5 ${
                activeTab === tab
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab === "live" ? "🔴 Live" : tab}
            </button>
          ))}
        </div>

        {activeTab === "generate" && <GeneratePanel />}
        {activeTab === "vision" && <VisionPanel />}
        {activeTab === "live" && <LivePanel />}
      </div>
    </div>
  );
}

/* ═══════════════════ GENERATE ═══════════════════ */

function GeneratePanel() {
  const [prompt, setPrompt] = useState(
    "A sleek ceramic coffee mug sitting on a marble table, soft morning side-light, cinematic depth of field",
  );
  const [reasoning, setReasoning] = useState("high");
  const [size, setSize] = useState("1K");
  const [bgMode, setBgMode] = useState("original");
  const [bgHex, setBgHex] = useState("#ffffff");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generateImage = async () => {
    if (!API_KEY) {
      setError(
        "API key not configured. Add NEXT_PUBLIC_OPENROUTER_API_KEY to .env",
      );
      return;
    }
    setLoading(true);
    setError("");
    setImageUrl("");
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
          "HTTP-Referer": window.location.origin || "http://localhost:3000",
          "X-Title": "Astro VIZ",
        },
        body: JSON.stringify({
          model: "sourceful/riverflow-v2.5-pro:free",
          modalities: ["image"],
          messages: [{ role: "user", content: prompt }],
          image_config: {
            size,
            background_mode: bgMode,
            ...(bgMode === "solid" && { background_hex_color: bgHex }),
            reasoning,
          },
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error?.message || `API Error: ${res.status}`);
      }
      const data = await res.json();
      const msg = data?.choices?.[0]?.message;
      if (msg?.images?.[0]?.imageUrl?.url) {
        setImageUrl(msg.images[0].imageUrl.url);
        return;
      }
      if (Array.isArray(msg?.content)) {
        const img = msg.content.find((p) => p.type === "image_url");
        if (img?.image_url?.url) {
          setImageUrl(img.image_url.url);
          return;
        }
      }
      if (
        typeof msg?.content === "string" &&
        msg.content.startsWith("data:image")
      ) {
        setImageUrl(msg.content);
        return;
      }
      throw new Error("No image assets found.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="space-y-5 rounded-xl border border-slate-800 bg-slate-900/60 p-5 lg:col-span-5">
        <div>
          <label className="mb-2 block text-xs font-semibold tracking-wider text-slate-400 uppercase">
            Prompt
          </label>
          <textarea
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full resize-none rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200 placeholder-slate-600 transition focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-semibold tracking-wider text-slate-400 uppercase">
              Reasoning
            </label>
            <div className="grid grid-cols-4 gap-2 rounded-lg border border-slate-800 bg-slate-950 p-1 text-xs">
              {["low", "medium", "high", "xhigh"].map((l) => (
                <button
                  key={l}
                  onClick={() => setReasoning(l)}
                  className={`rounded-md py-1.5 font-medium capitalize transition ${reasoning === l ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold tracking-wider text-slate-400 uppercase">
              Resolution
            </label>
            <div className="grid grid-cols-3 gap-2 rounded-lg border border-slate-800 bg-slate-950 p-1 text-xs">
              {["1K", "2K", "4K"].map((r) => (
                <button
                  key={r}
                  onClick={() => setSize(r)}
                  className={`rounded-md py-1.5 font-medium transition ${size === r ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>
        <button
          onClick={generateImage}
          disabled={loading}
          className={`w-full rounded-lg px-4 py-3 text-sm font-semibold text-white transition ${loading ? "cursor-not-allowed bg-slate-700 text-slate-400" : "bg-indigo-600 hover:bg-indigo-500"}`}
        >
          {loading ? "Generating..." : "Generate"}
        </button>
        {error && (
          <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-400">
            <span className="font-bold">Error:</span> {error}
          </div>
        )}
      </div>
      <div className="flex h-[500px] flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-950 sm:h-[600px] lg:col-span-7">
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/40 px-4 py-3 text-xs text-slate-400">
          <span className="font-mono">Canvas</span>
          <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[10px]">
            {size}
          </span>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] p-4 sm:p-8">
          {imageUrl ? (
            <div className="group relative max-h-full max-w-full overflow-hidden rounded border border-slate-800 bg-slate-900 shadow-2xl">
              <img
                src={imageUrl}
                alt="Output"
                className="mx-auto max-h-[400px] object-contain sm:max-h-[480px]"
              />
              <a
                href={imageUrl}
                download="riverflow-output.png"
                className="absolute right-3 bottom-3 rounded border border-slate-700 bg-slate-900/90 px-3 py-1.5 text-xs font-medium text-white opacity-0 transition group-hover:opacity-100 hover:bg-slate-900"
              >
                Save
              </a>
            </div>
          ) : loading ? (
            <div className="space-y-3 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
              <p className="text-sm text-slate-400">Generating...</p>
            </div>
          ) : (
            <div className="text-center">
              <svg
                className="mx-auto mb-3 h-10 w-10 text-slate-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 002-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-sm text-slate-500">
                Enter a prompt and generate
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════ VISION ═══════════════════ */

function VisionPanel() {
  const [inputMode, setInputMode] = useState<"upload" | "url">("upload");
  const [imageUrl, setImageUrl] = useState("");
  const [imageData, setImageData] = useState<string | null>(null);
  const [prompt, setPrompt] = useState(
    "Describe this image in detail. What objects, people, text, and scene elements do you see?",
  );
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    const r = new FileReader();
    r.onload = () => {
      setImageData(r.result as string);
      setImageUrl("");
    };
    r.readAsDataURL(f);
  };

  const analyzeImage = async () => {
    if (!API_KEY) {
      setError("API key not configured.");
      return;
    }
    if (!imageData && !imageUrl) {
      setError("Upload an image or provide a URL.");
      return;
    }
    setLoading(true);
    setError("");
    setAnalysis("");
    const content: any[] = [];
    if (inputMode === "upload" && imageData)
      content.push({ type: "image_url", image_url: { url: imageData } });
    else if (inputMode === "url" && imageUrl)
      content.push({ type: "image_url", image_url: { url: imageUrl } });
    content.push({ type: "text", text: prompt });
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
          "HTTP-Referer":
            window.location.origin || "http://192.168.29.194:3000",
          "X-Title": "Astro VIZ - Vision",
        },
        body: JSON.stringify({
          model: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
          messages: [{ role: "user", content }],
          max_tokens: 2048,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d?.error?.message || `API Error: ${res.status}`);
      }
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content;
      if (text) setAnalysis(text);
      else throw new Error("No response.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const previewUrl = inputMode === "upload" ? imageData : imageUrl;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="space-y-5 rounded-xl border border-slate-800 bg-slate-900/60 p-5 lg:col-span-5">
        <div className="flex gap-1 rounded-lg border border-slate-800 bg-slate-950 p-1 text-xs">
          {(["upload", "url"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setInputMode(m)}
              className={`flex-1 rounded-md py-1.5 font-medium capitalize transition ${inputMode === m ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"}`}
            >
              {m === "upload" ? "Upload" : "URL"}
            </button>
          ))}
        </div>
        {inputMode === "upload" ? (
          <div
            onClick={() => fileRef.current?.click()}
            className="group cursor-pointer rounded-xl border-2 border-dashed border-slate-700 p-6 text-center transition hover:border-indigo-500/50 sm:p-8"
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={(e) =>
                e.target.files?.[0] && handleFile(e.target.files[0])
              }
              className="hidden"
            />
            {imageData ? (
              <img
                src={imageData}
                alt="Preview"
                className="mx-auto max-h-40 rounded-lg object-contain"
              />
            ) : (
              <div className="space-y-2">
                <svg
                  className="mx-auto h-8 w-8 text-slate-600 transition group-hover:text-indigo-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 002-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-sm text-slate-500">Upload image</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <label className="mb-2 block text-xs font-semibold tracking-wider text-slate-400 uppercase">
              Image URL
            </label>
            <input
              type="url"
              placeholder="https://..."
              value={imageUrl}
              onChange={(e) => {
                setImageUrl(e.target.value);
                setImageData(null);
              }}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 transition focus:border-indigo-500 focus:outline-none"
            />
            {imageUrl && (
              <img
                src={imageUrl}
                alt="Preview"
                className="mx-auto mt-2 max-h-40 rounded-lg object-contain"
                onError={(e) =>
                  ((e.target as HTMLImageElement).style.display = "none")
                }
              />
            )}
          </div>
        )}
        <div>
          <label className="mb-2 block text-xs font-semibold tracking-wider text-slate-400 uppercase">
            Analysis Prompt
          </label>
          <textarea
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full resize-none rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200 transition focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <button
          onClick={analyzeImage}
          disabled={loading || (!imageData && !imageUrl)}
          className={`w-full rounded-lg px-4 py-3 text-sm font-semibold text-white transition ${loading || (!imageData && !imageUrl) ? "cursor-not-allowed bg-slate-700 text-slate-400" : "bg-indigo-600 hover:bg-indigo-500"}`}
        >
          {loading ? "Analyzing..." : "Analyze"}
        </button>
        {error && (
          <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-400">
            <span className="font-bold">Error:</span> {error}
          </div>
        )}
      </div>
      <div className="flex h-[500px] flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-950 sm:h-[600px] lg:col-span-7">
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/40 px-4 py-3 text-xs text-slate-400">
          <span className="font-mono">Analysis</span>
          {previewUrl && (
            <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-[10px]">
              Loaded
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col overflow-y-auto p-4 sm:p-6">
          {previewUrl && (
            <div className="mb-4 max-h-52 overflow-hidden rounded-lg border border-slate-800 bg-slate-900">
              <img
                src={previewUrl}
                alt="Target"
                className="max-h-52 w-full object-contain"
              />
            </div>
          )}
          {loading && (
            <div className="mb-4 flex items-center gap-3 text-sm text-slate-400">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />{" "}
              Analyzing...
            </div>
          )}
          {analysis && (
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 text-sm leading-relaxed whitespace-pre-wrap text-slate-200">
              {analysis}
            </div>
          )}
          {!previewUrl && !loading && !analysis && (
            <div className="flex flex-1 items-center justify-center text-sm text-slate-500">
              Upload an image and analyze
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════ LIVE CAMERA ═══════════════════ */

function LivePanel() {
  const [active, setActive] = useState(false);
  const [interval, setIntervalMs] = useState(5000);
  const [status, setStatus] = useState<
    "idle" | "starting" | "running" | "error"
  >("idle");
  const [logs, setLogs] = useState<{ frame: number; text: string }[]>([]);
  const [error, setError] = useState("");
  const [sysPrompt, setSysPrompt] = useState(
    "You are a live camera assistant. Describe what you see in this frame briefly and naturally, as if you are looking through a camera. Mention objects, people, text, lighting, and any notable details. Keep it concise (2-3 sentences).",
  );

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameCount = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sending = useRef(false);

  const stopCamera = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setActive(false);
    setStatus("idle");
  }, []);

  const captureAndAnalyze = useCallback(async () => {
    if (!canvasRef.current || !videoRef.current || sending.current) return;
    sending.current = true;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      sending.current = false;
      return;
    }

    // Resize frame to 640x480 for speed
    const w = 640,
      h = 480;
    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(video, 0, 0, w, h);
    const base64 = canvas.toDataURL("image/jpeg", 0.7);

    frameCount.current += 1;
    const fn = frameCount.current;

    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
          "HTTP-Referer":
            window.location.origin || "http://192.168.29.194:3000",
          "X-Title": "Astro VIZ - Live",
        },
        body: JSON.stringify({
          model: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
          messages: [
            { role: "system", content: sysPrompt },
            {
              role: "user",
              content: [
                { type: "image_url", image_url: { url: base64 } },
                { type: "text", text: "What do you see in this camera frame?" },
              ],
            },
          ],
          max_tokens: 256,
        }),
      });
      if (!res.ok) {
        sending.current = false;
        return;
      }
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content;
      if (text) {
        setLogs((prev) => [...prev.slice(-99), { frame: fn, text }]);
      }
    } catch {
      // silent — keep the loop running
    }
    sending.current = false;
  }, [sysPrompt]);

  const startCamera = async () => {
    if (!API_KEY) {
      setError("API key not configured.");
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setError(
        "Camera requires HTTPS. On mobile, use a tunnel like ngrok or access via localhost. URL: " +
          window.location.protocol +
          "//" +
          window.location.host,
      );
      return;
    }

    setError("");
    setLogs([]);
    frameCount.current = 0;
    setStatus("starting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;

      await new Promise<void>((resolve) => {
        if (!videoRef.current) {
          resolve();
          return;
        }
        videoRef.current.onloadedmetadata = () => resolve();
      });

      setActive(true);
      setStatus("running");

      intervalRef.current = setInterval(captureAndAnalyze, interval);
      setTimeout(captureAndAnalyze, 500);
    } catch (err: any) {
      setStatus("error");
      setError(err.message || "Camera access denied or unavailable.");
    }
  };

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = setInterval(captureAndAnalyze, interval);
    }
  }, [interval, captureAndAnalyze]);

  // Cleanup on unmount
  useEffect(() => () => stopCamera(), [stopCamera]);

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      {/* Camera / Controls */}
      <div className="w-full space-y-4 lg:w-1/2">
        {/* Camera view */}
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
          {active ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-600">
              <div className="space-y-3 text-center">
                <svg
                  className="mx-auto h-12 w-12"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-sm">Camera off</p>
              </div>
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />

          {/* Status badge */}
          {status === "running" && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-xs backdrop-blur">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
              LIVE
              <span className="text-slate-400">
                | Frame #{frameCount.current}
              </span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          {!active ? (
            <button
              onClick={startCamera}
              disabled={status === "starting"}
              className="w-full rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-500 disabled:bg-slate-700 disabled:text-slate-400"
            >
              {status === "starting"
                ? "Starting Camera..."
                : "🔴 Start Live Vision"}
            </button>
          ) : (
            <button
              onClick={stopCamera}
              className="w-full rounded-lg bg-slate-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-600/80"
            >
              ⏹ Stop
            </button>
          )}

          {/* Capture interval */}
          <div>
            <label className="mb-2 block text-xs font-semibold tracking-wider text-slate-400 uppercase">
              Capture Interval
            </label>
            <div className="grid grid-cols-3 gap-2 rounded-lg border border-slate-800 bg-slate-950 p-1 text-xs">
              {[
                { v: 3000, l: "3s" },
                { v: 5000, l: "5s" },
                { v: 10000, l: "10s" },
              ].map((item) => (
                <button
                  key={item.v}
                  onClick={() => setIntervalMs(item.v)}
                  className={`rounded-md py-1.5 font-medium transition ${interval === item.v ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"}`}
                >
                  {item.l}
                </button>
              ))}
            </div>
          </div>

          {/* System prompt */}
          <div>
            <label className="mb-2 block text-xs font-semibold tracking-wider text-slate-400 uppercase">
              AI System Prompt
            </label>
            <textarea
              rows={2}
              value={sysPrompt}
              onChange={(e) => setSysPrompt(e.target.value)}
              className="w-full resize-none rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-200 transition focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-400">
            <span className="font-bold">Error:</span> {error}
          </div>
        )}
      </div>

      {/* Analysis feed */}
      <div className="flex h-[500px] w-full flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-950 lg:w-1/2">
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/40 px-4 py-3 text-xs text-slate-400">
          <span className="font-mono">Live Feed</span>
          <span className="text-slate-500">{logs.length} frames</span>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto p-3">
          {!active && logs.length === 0 && (
            <div className="flex h-full items-center justify-center text-sm text-slate-600">
              Start the camera to see live analysis
            </div>
          )}
          {active && logs.length === 0 && (
            <div className="flex items-center gap-2 p-4 text-sm text-slate-400">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
              Waiting for first frame...
            </div>
          )}
          {logs
            .slice()
            .reverse()
            .map((log) => (
              <div
                key={log.frame}
                className="rounded-lg border border-slate-800/50 bg-slate-900/50 p-3"
              >
                <div className="mb-1 flex items-center gap-2">
                  <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
                    #{log.frame}
                  </span>
                  <span className="text-[10px] text-slate-600">Live</span>
                </div>
                <p className="text-sm leading-relaxed text-slate-200">
                  {log.text}
                </p>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
