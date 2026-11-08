"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Loader2, Sparkles } from "lucide-react";
import { api } from "~/trpc/react";
import Layout from "../../components/Layout";

const stripMarkdown = (value?: string | null) =>
  (value ?? "").replace(/\*\*[^*]+\*\*/g, "");

export default function NarrativeEnginePage() {
  const storyQuery = api.nativity.getLatestStory.useQuery();
  const story = storyQuery.data;

  return (
    <Layout>
      <div className="space-y-5 text-[var(--color-primary-dark)]">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-black/10 pb-4">
          <div>
            <p className="font-mono text-[10px] font-black tracking-[0.28em] text-[var(--color-accent-orange)] uppercase">
              Intelligence // compiled narrative
            </p>
            <h1 className="font-poster mt-2 text-4xl leading-none uppercase">
              Narrative engine
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-medium opacity-55">
              The latest transit run, its scene cast, and the synthesized main
              narrative.
            </p>
          </div>
          {story && (
            <Link
              href={`/dashboard/current-story/${story.id}`}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary-dark)] px-4 py-2 font-mono text-[10px] font-black tracking-[0.14em] text-white uppercase"
            >
              Open full stage <ArrowRight size={13} />
            </Link>
          )}
        </header>

        {storyQuery.isLoading ? (
          <div className="flex min-h-[320px] items-center justify-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--color-accent-orange)]" />
            <span className="font-mono text-[11px] font-black tracking-[0.18em] uppercase opacity-50">
              Loading story stream…
            </span>
          </div>
        ) : !story ? (
          <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-black/15 bg-white/50 text-center">
            <BookOpen className="h-9 w-9 text-[var(--color-accent-orange)]" />
            <h2 className="font-poster mt-3 text-2xl uppercase">
              No compiled story
            </h2>
            <p className="mt-1 max-w-sm text-sm opacity-55">
              Generate a current story from a nativity chart to populate the
              narrative engine.
            </p>
            <Link
              href="/nativity"
              className="mt-5 rounded-full bg-[var(--color-primary-dark)] px-5 py-2.5 font-mono text-[10px] font-black tracking-[0.16em] text-white uppercase"
            >
              Open nativity archive
            </Link>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-accent-orange)]/15 px-3 py-1 font-mono text-[10px] font-black tracking-[0.14em] text-[var(--color-accent-orange)] uppercase">
                <Sparkles size={11} /> {story.nativityChart?.name ?? "Transit"}
              </span>
              <span className="rounded-full bg-black/5 px-3 py-1 font-mono text-[10px] font-black uppercase">
                Intensity {story.overallIntensity ?? "—"}
              </span>
              <span className="rounded-full bg-black/5 px-3 py-1 font-mono text-[10px] font-black uppercase">
                {story.scenes.length} scenes
              </span>
              {story.themes.slice(0, 2).map((theme) => (
                <span
                  key={theme}
                  className="max-w-[260px] truncate rounded-full bg-black/5 px-3 py-1 text-[11px] font-semibold"
                >
                  {theme}
                </span>
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
              <article className="rounded-2xl border border-black/10 bg-white/75 p-6">
                <p className="font-mono text-[10px] font-black tracking-[0.22em] uppercase opacity-40">
                  Main narrative
                </p>
                <div className="mt-3 font-serif text-lg leading-relaxed whitespace-pre-wrap italic opacity-90">
                  {stripMarkdown(story.mainNarrative) ||
                    "No narrative has been compiled for this run yet."}
                </div>
              </article>

              <aside className="space-y-3 rounded-2xl border border-black/10 bg-white/75 p-4">
                <p className="font-mono text-[10px] font-black tracking-[0.2em] uppercase opacity-45">
                  Scene cast
                </p>
                {story.scenes.map((scene) => (
                  <div
                    key={scene.id}
                    className="rounded-xl border border-black/5 bg-white/70 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] font-black uppercase">
                        {scene.planet}
                      </span>
                      <span className="font-mono text-[10px] opacity-45">
                        {Math.round(scene.intensity)}%
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-[11px] opacity-55">
                      {scene.storyFunction || scene.dominantPressure || "—"}
                    </p>
                  </div>
                ))}
              </aside>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
