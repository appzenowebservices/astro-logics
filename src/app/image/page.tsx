"use client";
import React from "react";

export default function GPTImageMiniGenerator() {
  const [prompt, setPrompt] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [imageUrl, setImageUrl] = React.useState("");
  const [error, setError] = React.useState("");

  const generateImage = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError("");
    setImageUrl("");

    try {
      // Load Puter dynamically because apparently modern web apps
      // enjoy summoning scripts at runtime like tiny digital necromancers.
      if (!window.puter) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://js.puter.com/v2/";
          script.async = true;

          script.onload = resolve;
          script.onerror = reject;

          document.body.appendChild(script);
        });
      }

      const img = await window.puter.ai.txt2img(prompt, {
        model: "gpt-image-1-mini",
        quality: "low",
      });

      setImageUrl(img.src);
    } catch (err) {
      console.error(err);
      setError("Failed to generate image.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-6 text-white">
      <div className="w-full max-w-3xl space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
        <div>
          <h1 className="text-3xl font-bold">GPT Image 1 Mini Generator</h1>
          <p className="mt-2 text-white/60">
            Type prompt. Receive pixels. Humanity completed the cave painting
            arc.
          </p>
        </div>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your image..."
          className="h-40 w-full resize-none rounded-2xl border border-white/10 bg-black/40 p-4 outline-none"
        />

        <button
          onClick={generateImage}
          disabled={loading}
          className="rounded-2xl bg-white px-6 py-3 font-semibold text-black disabled:opacity-50"
        >
          {loading ? "Generating..." : "Generate Image"}
        </button>

        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
            {error}
          </div>
        )}

        {imageUrl && (
          <div className="space-y-4">
            <img
              src={imageUrl}
              alt="Generated"
              className="w-full rounded-3xl border border-white/10"
            />

            <a
              href={imageUrl}
              download
              className="inline-block rounded-2xl border border-white/10 bg-white/10 px-5 py-3 transition hover:bg-white/20"
            >
              Download Image
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
