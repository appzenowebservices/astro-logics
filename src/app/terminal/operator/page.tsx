"use client";

import React, { useState } from "react";
import {
  Activity,
  Database,
  Loader2,
  Radio,
  Signal,
  TerminalSquare,
} from "lucide-react";
import { api } from "~/trpc/react";
import Layout from "../../components/Layout";

export default function OperatorLabPage() {
  const [symbol, setSymbol] = useState("BTCUSD");
  const [submitted, setSubmitted] = useState("BTCUSD");
  const [timeframe, setTimeframe] = useState("");

  const history = api.trading.getStateHistory.useQuery({
    symbol: submitted,
    timeframe,
    limit: 20,
    offset: 0,
  });
  const signals = api.trading.getRecentSignals.useQuery({
    symbol: submitted,
    limit: 20,
  });
  const events = api.trading.getEventLog.useQuery({
    symbol: submitted,
    limit: 20,
  });

  const stateRows = history.data?.data ?? [];
  const signalRows = signals.data?.data ?? [];
  const eventRows = events.data?.data ?? [];

  return (
    <Layout>
      <div className="space-y-5 text-[var(--color-primary-dark)]">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-black/10 pb-4">
          <div>
            <p className="font-mono text-[10px] font-black tracking-[0.28em] text-[var(--color-accent-orange)] uppercase">
              Intelligence // persistence console
            </p>
            <h1 className="font-poster mt-2 text-4xl leading-none uppercase">
              Operator lab
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-medium opacity-55">
              Inspect persisted market states, generated trade signals, and the
              operator event log for a symbol.
            </p>
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              setSubmitted(symbol.trim().toUpperCase() || "BTCUSD");
            }}
            className="flex flex-wrap items-end gap-2"
          >
            <label className="flex flex-col gap-1">
              <span className="font-mono text-[9px] font-black tracking-[0.16em] uppercase opacity-40">
                Symbol
              </span>
              <input
                value={symbol}
                onChange={(event) => setSymbol(event.target.value)}
                className="w-32 rounded-xl border border-black/10 bg-white px-3 py-2 font-mono text-xs font-bold uppercase outline-none focus:border-[var(--color-accent-orange)]"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-mono text-[9px] font-black tracking-[0.16em] uppercase opacity-40">
                Timeframe
              </span>
              <input
                value={timeframe}
                onChange={(event) => setTimeframe(event.target.value)}
                placeholder="any"
                className="w-24 rounded-xl border border-black/10 bg-white px-3 py-2 font-mono text-xs font-bold uppercase outline-none focus:border-[var(--color-accent-orange)]"
              />
            </label>
            <button
              type="submit"
              className="rounded-xl bg-[var(--color-primary-dark)] px-4 py-2.5 font-mono text-[10px] font-black tracking-[0.14em] text-white uppercase"
            >
              Load
            </button>
          </form>
        </header>

        <div className="grid gap-4 xl:grid-cols-3">
          <Panel
            title="Persisted states"
            icon={<Database size={14} />}
            count={stateRows.length}
            loading={history.isLoading}
          >
            {stateRows.map((state) => (
              <Row
                key={state.id}
                title={state.symbol}
                subtitle={`${state.timeframe || "—"} · ${new Date(
                  state.timestamp * 1000,
                ).toLocaleString()}`}
                meta={`${state.events?.length ?? 0} events · ${state.signals?.length ?? 0} signals`}
              />
            ))}
          </Panel>

          <Panel
            title="Trade signals"
            icon={<Signal size={14} />}
            count={signalRows.length}
            loading={signals.isLoading}
          >
            {signalRows.map((signal) => (
              <Row
                key={signal.id}
                title={`${signal.snapshot?.symbol ?? "—"} · ${signal.marketBias}`}
                subtitle={`${Math.round((signal.confidence ?? 0) * 100)}% confidence · ${signal.riskLevel}`}
                meta={signal.suggestedAction}
              />
            ))}
          </Panel>

          <Panel
            title="Event log"
            icon={<Activity size={14} />}
            count={eventRows.length}
            loading={events.isLoading}
          >
            {eventRows.map((event) => (
              <Row
                key={event.id}
                title={event.eventType}
                subtitle={`${Math.round((event.confidence ?? 0) * 100)}% confidence`}
                meta={event.narrative}
              />
            ))}
          </Panel>
        </div>

        {!history.isLoading &&
          !signals.isLoading &&
          !events.isLoading &&
          stateRows.length === 0 &&
          signalRows.length === 0 &&
          eventRows.length === 0 && (
            <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-black/15 bg-white/50 text-center">
              <TerminalSquare className="h-8 w-8 text-[var(--color-accent-orange)]" />
              <p className="font-poster mt-2 text-xl uppercase">
                No persisted telemetry for {submitted}
              </p>
              <p className="mt-1 max-w-md text-sm opacity-55">
                Save a snapshot from the market terminal to seed the operator
                memory.
              </p>
              <a
                href="/market"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--color-primary-dark)] px-4 py-2 font-mono text-[10px] font-black tracking-[0.14em] text-white uppercase"
              >
                <Radio size={12} /> Market terminal
              </a>
            </div>
          )}
      </div>
    </Layout>
  );
}

function Panel({
  title,
  icon,
  count,
  loading,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  count: number;
  loading: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-black/10 bg-white/75">
      <div className="flex items-center gap-2 border-b border-black/8 px-4 py-3">
        <span className="text-[var(--color-accent-orange)]">{icon}</span>
        <h2 className="font-poster text-lg uppercase">{title}</h2>
        <span className="rounded-full bg-black/5 px-2 py-0.5 font-mono text-[9px] font-black">
          {count}
        </span>
      </div>
      <div className="custom-scrollbar max-h-[520px] divide-y divide-black/5 overflow-y-auto">
        {loading ? (
          <div className="flex items-center gap-2 px-4 py-5">
            <Loader2 className="h-4 w-4 animate-spin opacity-40" />
            <span className="font-mono text-[10px] tracking-[0.12em] uppercase opacity-40">
              Loading…
            </span>
          </div>
        ) : count === 0 ? (
          <p className="px-4 py-5 text-xs opacity-45">No records.</p>
        ) : (
          children
        )}
      </div>
    </section>
  );
}

function Row({
  title,
  subtitle,
  meta,
}: {
  title: string;
  subtitle: string;
  meta?: string;
}) {
  return (
    <div className="px-4 py-3">
      <p className="truncate font-mono text-[11px] font-black uppercase">
        {title}
      </p>
      <p className="truncate font-mono text-[10px] opacity-45">{subtitle}</p>
      {meta && (
        <p className="mt-0.5 line-clamp-2 text-[11px] opacity-55">{meta}</p>
      )}
    </div>
  );
}
