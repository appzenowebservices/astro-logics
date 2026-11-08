"use client";

import React, { useMemo, useState } from "react";
import { Compass, Loader2, Sparkles } from "lucide-react";
import { api } from "~/trpc/react";
import Layout from "../../components/Layout";
import ChartPicker, {
  useNativitySelection,
} from "../../components/nativity/ChartPicker";
import { DERIVED_AXES, topAxes, vectorFromJson } from "~/lib/latentAxes";

export default function VectorExplorerPage() {
  const { chartId, setChartId, charts } = useNativitySelection();
  const profilesQuery = api.nativity.getPlanetaryProfiles.useQuery(
    { nativityChartId: chartId },
    { enabled: Boolean(chartId) },
  );
  const [selectedPlanet, setSelectedPlanet] = useState<string>("");

  const profiles = profilesQuery.data?.planetaryProfiles ?? [];

  const enriched = useMemo(
    () =>
      profiles.map((profile) => {
        const finalState = vectorFromJson(profile.finalState);
        const latent = vectorFromJson(profile.latentVector);
        const vector = Object.keys(finalState).length > 0 ? finalState : latent;
        return { ...profile, vector };
      }),
    [profiles],
  );

  const activePlanet =
    enriched.find((profile) => profile.planet === selectedPlanet) ??
    enriched[0];

  const aggregate = useMemo(() => {
    const totals: Record<string, { sum: number; count: number }> = {};
    for (const profile of enriched) {
      for (const [axis, value] of Object.entries(profile.vector)) {
        const entry = totals[axis] ?? { sum: 0, count: 0 };
        entry.sum += value;
        entry.count += 1;
        totals[axis] = entry;
      }
    }
    return Object.fromEntries(
      Object.entries(totals).map(([axis, entry]) => [
        axis,
        Number((entry.sum / entry.count).toFixed(4)),
      ]),
    );
  }, [enriched]);

  const activeAxes = topAxes(activePlanet?.vector ?? {}, 16);
  const aggregateAxes = topAxes(aggregate, 12);

  return (
    <Layout>
      <div className="space-y-5 text-[var(--color-primary-dark)]">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-black/10 pb-4">
          <div>
            <p className="font-mono text-[10px] font-black tracking-[0.28em] text-[var(--color-accent-orange)] uppercase">
              Intelligence // latent manifold
            </p>
            <h1 className="font-poster mt-2 text-4xl leading-none uppercase">
              Vector explorer
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-medium opacity-55">
              Per-planet 54-axis state vectors, derived metrics, and the
              chart-level aggregate that downstream agents consume.
            </p>
          </div>
          <ChartPicker chartId={chartId} onChange={setChartId} />
        </header>

        {charts.length === 0 ? (
          <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-black/15 bg-white/50 text-center">
            <Compass className="h-9 w-9 text-[var(--color-accent-orange)]" />
            <h2 className="font-poster mt-3 text-2xl uppercase">
              No vectors stored
            </h2>
            <p className="mt-1 max-w-sm text-sm opacity-55">
              Create a nativity chart to synthesize latent personality vectors.
            </p>
          </div>
        ) : profilesQuery.isLoading ? (
          <div className="flex min-h-[320px] items-center justify-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--color-accent-orange)]" />
            <span className="font-mono text-[11px] font-black tracking-[0.18em] uppercase opacity-50">
              Reading latent profiles…
            </span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Metric label="Planets" value={enriched.length} />
              <Metric
                label="Axes / planet"
                value={activeAxes.length ? 54 : 0}
              />
              <Metric
                label="Aggregate axes"
                value={Object.keys(aggregate).length}
              />
              <Metric
                label="Top planet"
                value={
                  [...enriched].sort(
                    (a, b) =>
                      (b.vector.manifestationStrength ?? 0) -
                      (a.vector.manifestationStrength ?? 0),
                  )[0]?.planet ?? "—"
                }
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
              <aside className="rounded-2xl border border-black/10 bg-white/75 p-3">
                <p className="px-1 pb-2 font-mono text-[10px] font-black tracking-[0.18em] uppercase opacity-45">
                  Planetary kernels
                </p>
                <div className="space-y-1">
                  {enriched.map((profile) => (
                    <button
                      key={profile.id}
                      type="button"
                      onClick={() => setSelectedPlanet(profile.planet)}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition ${
                        activePlanet?.id === profile.id
                          ? "bg-[var(--color-primary-dark)] text-white"
                          : "bg-white/60 hover:bg-black/5"
                      }`}
                    >
                      <span className="font-mono text-[11px] font-black uppercase">
                        {profile.planet}
                      </span>
                      <span className="font-mono text-[10px] opacity-60">
                        {profile.vector.manifestationStrength !== undefined
                          ? profile.vector.manifestationStrength.toFixed(2)
                          : "—"}
                      </span>
                    </button>
                  ))}
                </div>
              </aside>

              <div className="space-y-4">
                <section className="rounded-2xl border border-black/10 bg-white/75 p-4">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-mono text-[10px] font-black tracking-[0.18em] uppercase opacity-45">
                        Selected kernel
                      </p>
                      <h2 className="font-poster text-2xl uppercase">
                        {activePlanet?.planet ?? "—"}
                      </h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {DERIVED_AXES.map((axis) => (
                        <span
                          key={axis}
                          className="rounded-full bg-[var(--color-accent-orange)]/10 px-2.5 py-1 font-mono text-[9px] font-black uppercase"
                        >
                          {axis}{" "}
                          {activePlanet?.vector[axis] !== undefined
                            ? activePlanet.vector[axis].toFixed(2)
                            : "—"}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-2 md:grid-cols-2">
                    {activeAxes.map((axis) => (
                      <Bar
                        key={axis.axis}
                        axis={axis.axis}
                        value={axis.value}
                      />
                    ))}
                  </div>
                </section>

                <section className="rounded-2xl border border-black/10 bg-white/75 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Sparkles
                      size={14}
                      className="text-[var(--color-accent-orange)]"
                    />
                    <p className="font-mono text-[10px] font-black tracking-[0.18em] uppercase opacity-50">
                      Chart aggregate · dominant axes
                    </p>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    {aggregateAxes.map((axis) => (
                      <Bar
                        key={axis.axis}
                        axis={axis.axis}
                        value={axis.value}
                      />
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

function Bar({ axis, value }: { axis: string; value: number }) {
  return (
    <div className="rounded-xl border border-black/5 bg-white/70 px-3 py-2">
      <div className="flex items-center justify-between font-mono text-[10px] font-bold uppercase">
        <span className="truncate">{axis}</span>
        <span className="opacity-45">{value.toFixed(3)}</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-black/5">
        <div
          className={`h-full rounded-full ${
            value >= 0 ? "bg-[var(--color-accent-orange)]" : "bg-slate-500"
          }`}
          style={{ width: `${Math.min(100, Math.abs(value) * 100)}%` }}
        />
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white/75 p-4">
      <p className="font-poster text-3xl leading-none">{value}</p>
      <p className="mt-1.5 font-mono text-[10px] font-black tracking-[0.16em] uppercase opacity-45">
        {label}
      </p>
    </div>
  );
}
