"use client";

import React, { useState } from "react";
import { Binary, Loader2, Search } from "lucide-react";
import { api } from "~/trpc/react";
import Layout from "../../components/Layout";

export default function SimilarStatesPage() {
  const [symbol, setSymbol] = useState("BTCUSD");
  const [submitted, setSubmitted] = useState("BTCUSD");

  const similarQuery = api.trading.findSimilarStates.useQuery({
    symbol: submitted,
    limit: 12,
  });

  const states = similarQuery.data?.data ?? [];

  return (
    <Layout>
      <div className="space-y-5 text-[var(--color-primary-dark)]">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-black/10 pb-4">
          <div>
            <p className="font-mono text-[10px] font-black tracking-[0.28em] text-[var(--color-accent-orange)] uppercase">
              Intelligence // state neighbours
            </p>
            <h1 className="font-poster mt-2 text-4xl leading-none uppercase">
              Similar states
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-medium opacity-55">
              Historical market-state snapshots for a symbol, ranked by recency
              until the embedding index is populated.
            </p>
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              setSubmitted(symbol.trim().toUpperCase() || "BTCUSD");
            }}
            className="flex items-center gap-2"
          >
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 opacity-35" />
              <input
                value={symbol}
                onChange={(event) => setSymbol(event.target.value)}
                placeholder="BTCUSD"
                className="w-44 rounded-xl border border-black/10 bg-white py-2 pr-3 pl-8 font-mono text-xs font-bold uppercase outline-none focus:border-[var(--color-accent-orange)]"
              />
            </div>
            <button
              type="submit"
              className="rounded-xl bg-[var(--color-primary-dark)] px-4 py-2 font-mono text-[10px] font-black tracking-[0.14em] text-white uppercase"
            >
              Scan
            </button>
          </form>
        </header>

        {similarQuery.isLoading ? (
          <div className="flex min-h-[320px] items-center justify-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--color-accent-orange)]" />
            <span className="font-mono text-[11px] font-black tracking-[0.18em] uppercase opacity-50">
              Comparing state memory…
            </span>
          </div>
        ) : states.length === 0 ? (
          <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-black/15 bg-white/50 text-center">
            <Binary className="h-9 w-9 text-[var(--color-accent-orange)]" />
            <h2 className="font-poster mt-3 text-2xl uppercase">
              No matching states
            </h2>
            <p className="mt-1 max-w-sm text-sm opacity-55">
              Run market inference and save a snapshot for {submitted}, then
              this view will compare it against past regimes.
            </p>
            <a
              href="/market"
              className="mt-5 rounded-full bg-[var(--color-primary-dark)] px-5 py-2.5 font-mono text-[10px] font-black tracking-[0.16em] text-white uppercase"
            >
              Open market terminal
            </a>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {states.map((state) => (
              <article
                key={state.id}
                className="rounded-2xl border border-black/10 bg-white/75 p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-sm font-black">
                    {state.symbol}
                  </span>
                  <span className="rounded-full bg-black/5 px-2 py-0.5 font-mono text-[10px] font-black uppercase">
                    {state.timeframe || "—"}
                  </span>
                </div>
                <p className="mt-1 font-mono text-[10px] opacity-40">
                  {new Date(state.timestamp * 1000).toLocaleString()}
                </p>

                <div className="mt-3 space-y-1.5">
                  <StateRow label="Trend" value={state.trendState} />
                  <StateRow label="Volatility" value={state.volatilityState} />
                  <StateRow label="Liquidity" value={state.liquidityState} />
                  <StateRow label="Astro" value={state.astroState} />
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-black/5 pt-2 font-mono text-[9px] tracking-[0.1em] uppercase opacity-45">
                  <span>{state.events.length} events</span>
                  <span>{state.signals.length} signals</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

function StateRow({ label, value }: { label: string; value: unknown }) {
  const summary =
    value && typeof value === "object"
      ? Object.entries(value as Record<string, unknown>)
          .filter(([, item]) => typeof item === "number")
          .slice(0, 2)
          .map(([key, item]) => `${key} ${Number(item).toFixed(2)}`)
          .join(" · ")
      : String(value ?? "—");

  return (
    <div className="flex items-center justify-between gap-2 text-[11px]">
      <span className="font-mono text-[10px] tracking-[0.08em] uppercase opacity-40">
        {label}
      </span>
      <span className="truncate font-semibold opacity-70">
        {summary || "—"}
      </span>
    </div>
  );
}
