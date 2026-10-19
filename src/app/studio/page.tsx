"use client";

import React, { useState } from "react";
import Link from "next/link";
import { api } from "~/trpc/react";
import Navbar from "../components/Navbar";
import { Archive, Check, Loader2, PenLine, Trash2 } from "lucide-react";

type Kind = "TRADE_IDEA" | "ASTRO_READING";
type Visibility = "PUBLIC" | "MEMBERS" | "PREMIUM";

const EMPTY = {
  kind: "ASTRO_READING" as Kind,
  title: "",
  excerpt: "",
  body: "",
  visibility: "MEMBERS" as Visibility,
  symbol: "",
};

export default function StudioPage() {
  const utils = api.useUtils();
  const [form, setForm] = useState(EMPTY);

  const me = api.user.me.useQuery();
  const mine = api.post.mine.useQuery(undefined, {
    enabled: me.data?.role === "ADMIN" || me.data?.role === "ANALYST",
  });

  const create = api.post.create.useMutation({
    onSuccess: async () => {
      setForm(EMPTY);
      await utils.post.mine.invalidate();
    },
  });

  const publish = api.post.publish.useMutation({
    onSuccess: () => utils.post.mine.invalidate(),
  });
  const archive = api.post.archive.useMutation({
    onSuccess: () => utils.post.mine.invalidate(),
  });
  const remove = api.post.remove.useMutation({
    onSuccess: () => utils.post.mine.invalidate(),
  });

  const isAnalyst = me.data?.role === "ADMIN" || me.data?.role === "ANALYST";

  const set = (field: keyof typeof EMPTY, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="min-h-screen bg-[var(--color-primary-light)] text-[var(--color-primary-dark)]">
      <Navbar />

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4 border-b border-[var(--color-ring-bronze)]/40 pb-6">
          <div>
            <p className="font-mono text-[10px] font-black tracking-[0.35em] text-[var(--color-accent-orange)] uppercase">
              Analyst studio
            </p>
            <h1 className="mt-3 text-4xl font-black tracking-tighter">
              Publish an{" "}
              <span className="font-serif font-normal italic">idea</span>
            </h1>
          </div>
          <Link
            href="/ideas"
            className="font-mono text-[10px] font-bold tracking-[0.2em] uppercase underline underline-offset-4"
          >
            View public feed
          </Link>
        </div>

        {!me.isLoading && !isAnalyst && (
          <div className="rounded-3xl border-2 border-dashed border-[var(--color-ring-bronze)]/50 p-14 text-center">
            <PenLine className="mx-auto mb-4 h-8 w-8 text-[var(--color-accent-orange)]" />
            <h2 className="text-xl font-black tracking-tight">
              Analyst access required
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed font-medium opacity-70">
              Publishing is limited to accounts with the ANALYST or ADMIN role.
              Ask an admin to upgrade your account.
            </p>
          </div>
        )}

        {isAnalyst && (
          <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
            {/* Composer */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                create.mutate({
                  kind: form.kind,
                  title: form.title,
                  excerpt: form.excerpt || undefined,
                  body: form.body,
                  visibility: form.visibility,
                  symbol: form.symbol || undefined,
                });
              }}
              className="space-y-5 rounded-3xl border border-[var(--color-ring-bronze)]/40 bg-white/60 p-6 shadow-sm sm:p-8"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block font-mono text-[9px] font-black tracking-[0.2em] uppercase opacity-60">
                    Kind
                  </span>
                  <select
                    value={form.kind}
                    onChange={(e) => set("kind", e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-ring-bronze)]/40 bg-white px-3 py-2.5 text-sm font-medium"
                  >
                    <option value="ASTRO_READING">Astro reading</option>
                    <option value="TRADE_IDEA">Trade idea</option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1.5 block font-mono text-[9px] font-black tracking-[0.2em] uppercase opacity-60">
                    Visibility
                  </span>
                  <select
                    value={form.visibility}
                    onChange={(e) => set("visibility", e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-ring-bronze)]/40 bg-white px-3 py-2.5 text-sm font-medium"
                  >
                    <option value="PUBLIC">Public</option>
                    <option value="MEMBERS">Members</option>
                    <option value="PREMIUM">Premium</option>
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="mb-1.5 block font-mono text-[9px] font-black tracking-[0.2em] uppercase opacity-60">
                  Title
                </span>
                <input
                  required
                  minLength={3}
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="The Moon squares Saturn — tighten the stops"
                  className="w-full rounded-xl border border-[var(--color-ring-bronze)]/40 bg-white px-3 py-2.5 text-sm font-medium"
                />
              </label>

              {form.kind === "TRADE_IDEA" && (
                <label className="block">
                  <span className="mb-1.5 block font-mono text-[9px] font-black tracking-[0.2em] uppercase opacity-60">
                    Symbol
                  </span>
                  <input
                    value={form.symbol}
                    onChange={(e) => set("symbol", e.target.value.toUpperCase())}
                    placeholder="XAUUSD"
                    className="w-full rounded-xl border border-[var(--color-ring-bronze)]/40 bg-white px-3 py-2.5 font-mono text-sm font-medium"
                  />
                </label>
              )}

              <label className="block">
                <span className="mb-1.5 block font-mono text-[9px] font-black tracking-[0.2em] uppercase opacity-60">
                  Excerpt
                </span>
                <input
                  value={form.excerpt}
                  onChange={(e) => set("excerpt", e.target.value)}
                  placeholder="One line shown in the feed"
                  className="w-full rounded-xl border border-[var(--color-ring-bronze)]/40 bg-white px-3 py-2.5 text-sm font-medium"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block font-mono text-[9px] font-black tracking-[0.2em] uppercase opacity-60">
                  Body
                </span>
                <textarea
                  required
                  rows={10}
                  value={form.body}
                  onChange={(e) => set("body", e.target.value)}
                  placeholder="Plain language. No jargon."
                  className="w-full resize-y rounded-xl border border-[var(--color-ring-bronze)]/40 bg-white px-3 py-2.5 text-sm leading-relaxed font-medium"
                />
              </label>

              <button
                type="submit"
                disabled={create.isPending}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary-dark)] px-6 py-3 font-mono text-[10px] font-black tracking-[0.18em] text-[var(--color-primary-light)] uppercase transition-colors hover:bg-[var(--color-accent-orange)] hover:text-white disabled:opacity-50"
              >
                {create.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <PenLine className="h-3.5 w-3.5" />
                )}
                Save draft
              </button>

              {create.error && (
                <p className="text-xs font-bold text-red-600">
                  {create.error.message}
                </p>
              )}
            </form>

            {/* Drafts */}
            <div className="space-y-3">
              <h2 className="font-mono text-[10px] font-black tracking-[0.25em] uppercase opacity-60">
                Your posts
              </h2>

              {mine.isLoading && (
                <p className="text-xs font-medium opacity-50">Loading…</p>
              )}

              {mine.data?.length === 0 && (
                <p className="rounded-2xl border border-dashed border-[var(--color-ring-bronze)]/40 p-6 text-xs font-medium opacity-50">
                  No posts yet.
                </p>
              )}

              {mine.data?.map((post) => (
                <div
                  key={post.id}
                  className="rounded-2xl border border-[var(--color-ring-bronze)]/40 bg-white/60 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black tracking-tight">
                        {post.title}
                      </p>
                      <p className="mt-1 font-mono text-[9px] font-bold tracking-[0.16em] uppercase opacity-50">
                        {post.status} · {post.visibility}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      {post.status !== "PUBLISHED" && (
                        <button
                          onClick={() => publish.mutate({ id: post.id })}
                          title="Publish"
                          className="rounded-lg border border-[var(--color-ring-bronze)]/40 p-1.5 text-emerald-700 transition-colors hover:border-emerald-600"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {post.status === "PUBLISHED" && (
                        <button
                          onClick={() => archive.mutate({ id: post.id })}
                          title="Archive"
                          className="rounded-lg border border-[var(--color-ring-bronze)]/40 p-1.5 transition-colors hover:border-[var(--color-accent-orange)]"
                        >
                          <Archive className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => remove.mutate({ id: post.id })}
                        title="Delete"
                        className="rounded-lg border border-[var(--color-ring-bronze)]/40 p-1.5 text-red-600 transition-colors hover:border-red-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
