"use client";

import React, { useState } from "react";
import Link from "next/link";
import { api } from "~/trpc/react";
import Navbar from "../components/Navbar";
import { ArrowUpRight, Compass, Sparkles, TrendingUpDown } from "lucide-react";

type Kind = "TRADE_IDEA" | "ASTRO_READING";

const TABS: { id: Kind | "ALL"; label: string }[] = [
  { id: "ALL", label: "All signals" },
  { id: "TRADE_IDEA", label: "Trade ideas" },
  { id: "ASTRO_READING", label: "Astro readings" },
];

export default function IdeasPage() {
  const [kind, setKind] = useState<Kind | "ALL">("ALL");

  const { data, isLoading } = api.post.listPublic.useQuery({
    limit: 24,
    ...(kind === "ALL" ? {} : { kind }),
  });

  return (
    <div className="min-h-screen bg-[var(--color-primary-dark)] text-[var(--color-primary-light)]">
      <Navbar />

      <section className="relative overflow-hidden border-b border-[var(--color-primary-light)]/10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_70%_-20%,rgba(164,196,217,0.14),transparent_60%)]" />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <span className="font-mono text-[10px] font-black tracking-[0.4em] text-[var(--color-accent-orange)] uppercase">
            The feed
          </span>
          <h1 className="mt-5 text-4xl font-black tracking-tighter sm:text-5xl lg:text-6xl">
            Published{" "}
            <span className="font-serif font-normal text-[var(--color-accent-glow)] italic">
              ideas
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed font-medium text-[var(--color-primary-light)]/60">
            Trade ideas and astro readings, written from the same collective
            state engine that powers the dashboard.
          </p>

          <div className="mt-8 flex flex-wrap gap-2">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setKind(tab.id)}
                className={`rounded-full border px-4 py-2 font-mono text-[10px] font-bold tracking-[0.2em] uppercase transition-colors ${
                  kind === tab.id
                    ? "border-[var(--color-accent-orange)] bg-[var(--color-accent-orange)]/10 text-[var(--color-accent-orange)]"
                    : "border-[var(--color-primary-light)]/15 text-[var(--color-primary-light)]/50 hover:text-[var(--color-primary-light)]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        {isLoading && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-52 animate-pulse rounded-3xl border border-[var(--color-primary-light)]/10 bg-[var(--color-primary-light)]/[0.03]"
              />
            ))}
          </div>
        )}

        {!isLoading && data?.posts.length === 0 && (
          <div className="rounded-3xl border border-dashed border-[var(--color-ring-bronze)]/30 p-16 text-center">
            <Compass className="mx-auto mb-4 h-8 w-8 text-[var(--color-accent-orange)]" />
            <p className="font-mono text-xs font-bold tracking-[0.2em] text-[var(--color-primary-light)]/50 uppercase">
              Nothing published yet
            </p>
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data?.posts.map((post) => (
            <Link
              key={post.id}
              href={`/ideas/${post.slug}`}
              className="group flex h-full flex-col justify-between rounded-3xl border border-[var(--color-primary-light)]/10 bg-[var(--color-primary-light)]/[0.03] p-6 transition-all hover:-translate-y-1 hover:border-[var(--color-accent-orange)]/40"
            >
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-ring-bronze)]/30 px-2.5 py-1 font-mono text-[9px] font-black tracking-[0.18em] uppercase">
                    {post.kind === "TRADE_IDEA" ? (
                      <TrendingUpDown className="h-3 w-3 text-[var(--color-accent-orange)]" />
                    ) : (
                      <Sparkles className="h-3 w-3 text-[var(--color-accent-glow)]" />
                    )}
                    {post.kind === "TRADE_IDEA" ? "Trade" : "Astro"}
                  </span>
                  {post.symbol && (
                    <span className="font-mono text-[10px] font-bold tracking-[0.15em] text-[var(--color-accent-orange)]">
                      {post.symbol}
                    </span>
                  )}
                </div>

                <h2 className="text-lg leading-snug font-black tracking-tight">
                  {post.title}
                </h2>
                {post.excerpt && (
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed font-medium text-[var(--color-primary-light)]/55">
                    {post.excerpt}
                  </p>
                )}
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-[var(--color-primary-light)]/10 pt-4">
                <span className="font-mono text-[9px] font-bold tracking-[0.18em] text-[var(--color-ring-bronze)]/80 uppercase">
                  {post.author.name}
                </span>
                <ArrowUpRight className="h-4 w-4 text-[var(--color-accent-orange)] opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
