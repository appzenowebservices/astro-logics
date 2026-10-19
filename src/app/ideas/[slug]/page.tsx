"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "~/trpc/react";
import Navbar from "../../components/Navbar";
import { ArrowLeft, Lock, Sparkles, TrendingUpDown } from "lucide-react";

export default function IdeaPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";

  const { data: post, isLoading, error } = api.post.getBySlug.useQuery(
    { slug },
    { enabled: Boolean(slug) },
  );

  return (
    <div className="min-h-screen bg-[var(--color-primary-dark)] text-[var(--color-primary-light)]">
      <Navbar />

      <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
        <Link
          href="/ideas"
          className="group mb-10 inline-flex items-center gap-2 font-mono text-[10px] font-bold tracking-[0.2em] text-[var(--color-primary-light)]/50 uppercase transition-colors hover:text-[var(--color-accent-orange)]"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
          All ideas
        </Link>

        {isLoading && (
          <div className="space-y-4">
            <div className="h-4 w-24 animate-pulse rounded bg-[var(--color-primary-light)]/10" />
            <div className="h-12 w-3/4 animate-pulse rounded bg-[var(--color-primary-light)]/10" />
            <div className="h-64 animate-pulse rounded-2xl bg-[var(--color-primary-light)]/[0.04]" />
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-dashed border-[var(--color-ring-bronze)]/30 p-12 text-center">
            <p className="font-mono text-xs font-bold tracking-[0.2em] uppercase opacity-60">
              {error.message}
            </p>
          </div>
        )}

        {post && (
          <>
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-ring-bronze)]/30 px-3 py-1 font-mono text-[9px] font-black tracking-[0.18em] uppercase">
                {post.kind === "TRADE_IDEA" ? (
                  <TrendingUpDown className="h-3 w-3 text-[var(--color-accent-orange)]" />
                ) : (
                  <Sparkles className="h-3 w-3 text-[var(--color-accent-glow)]" />
                )}
                {post.kind === "TRADE_IDEA" ? "Trade idea" : "Astro reading"}
              </span>
              {post.symbol && (
                <span className="font-mono text-[10px] font-bold tracking-[0.15em] text-[var(--color-accent-orange)]">
                  {post.symbol}
                </span>
              )}
              <span className="font-mono text-[9px] font-bold tracking-[0.18em] text-[var(--color-ring-bronze)]/70 uppercase">
                {post.author.name}
              </span>
            </div>

            <h1 className="text-4xl leading-[1.05] font-black tracking-tighter sm:text-5xl">
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="mt-5 text-lg leading-relaxed font-medium text-[var(--color-primary-light)]/60">
                {post.excerpt}
              </p>
            )}

            <div className="mt-10 h-px w-full bg-[var(--color-primary-light)]/10" />

            {post.locked ? (
              <div className="relative mt-10 overflow-hidden rounded-3xl border border-[var(--color-accent-orange)]/25 bg-[var(--color-accent-orange)]/[0.06] p-8 text-center sm:p-12">
                <Lock className="mx-auto mb-4 h-7 w-7 text-[var(--color-accent-orange)]" />
                <h2 className="text-xl font-black tracking-tight">
                  This reading is for members
                </h2>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed font-medium text-[var(--color-primary-light)]/60">
                  {post.visibility === "PREMIUM"
                    ? "Upgrade to the Astronomer plan to read premium trade ideas."
                    : "Sign in with an active account to read the full analysis."}
                </p>
                <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                  <Link
                    href="/register"
                    className="rounded-full bg-[var(--color-primary-light)] px-6 py-3 font-mono text-[10px] font-black tracking-[0.18em] text-[var(--color-primary-dark)] uppercase transition-colors hover:bg-[var(--color-accent-orange)] hover:text-white"
                  >
                    Get access
                  </Link>
                  <Link
                    href="/login"
                    className="rounded-full border border-[var(--color-primary-light)]/25 px-6 py-3 font-mono text-[10px] font-black tracking-[0.18em] uppercase transition-colors hover:border-[var(--color-primary-light)]/60"
                  >
                    Sign in
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mt-10 whitespace-pre-wrap text-base leading-[1.85] font-medium text-[var(--color-primary-light)]/80">
                {post.body}
              </div>
            )}
          </>
        )}
      </article>
    </div>
  );
}
