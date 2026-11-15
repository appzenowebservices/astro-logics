"use client";

import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Bot, Loader2, Orbit, Sparkles } from "lucide-react";
import { api } from "~/trpc/react";

const PlanetCharacter3D = dynamic(() => import("./PlanetCharacter3D"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <div className="flex items-center gap-2 text-[11px] font-bold tracking-[0.18em] text-[var(--color-primary-light)]/60 uppercase">
        <Loader2 size={14} className="animate-spin" />
        Waking 3D agent
      </div>
    </div>
  ),
});

interface PlanetProfile {
  planet: string;
  archetype: string;
  primaryTheme: string;
  psychologicalFunction: string;
  lifeDomain: string;
  currentExpression: string;
  strength?: number;
  visibility?: number;
  dignity: string;
  house: number;
  zodiacSign: string;
  isRetrograde: boolean;
  colorCode: string;
  challenges?: string[];
  potentials?: string[];
  relationships?: Array<{
    planet: string;
    relationshipType: string;
    description: string;
  }>;
}

interface Nativity3DAgentTabProps {
  nativityChartId: string;
}

function moodFor(profile: PlanetProfile) {
  const dignity = profile.dignity.toLowerCase();
  const strength = profile.strength ?? 0.5;

  if (dignity.includes("exalt")) return "radiant";
  if (dignity.includes("detriment")) return "chaotic";
  if (dignity.includes("fall")) return "contemplative";
  if (strength >= 0.75) return "passionate";
  if (strength <= 0.4) return "analytical";
  return "enigmatic";
}

function toPercent(value?: number) {
  const safe = value ?? 0;
  return safe <= 1 ? safe * 100 : safe;
}

function toUnit(value?: number) {
  const safe = value ?? 0.5;
  return Math.max(0.2, Math.min(1, safe <= 1 ? safe : safe / 100));
}

function Meter({ label, value }: { label: string; value: number }) {
  const safeValue = Math.max(0, Math.min(100, Math.round(value)));

  return (
    <div>
      <div className="flex items-center justify-between text-[10px] font-extrabold tracking-[0.14em] uppercase">
        <span className="text-[var(--color-primary-light)]/55">{label}</span>
        <span className="text-[var(--color-primary-light)]">{safeValue}%</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--color-primary-light)]/10">
        <div
          className="h-full rounded-full bg-[var(--color-accent-orange)]"
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-xl border border-[var(--color-ring-bronze)]/30 bg-[#22365d] p-3">
      <p className="text-[9px] font-extrabold tracking-[0.18em] text-[var(--color-primary-light)]/45 uppercase">
        {label}
      </p>
      <p className="mt-1.5 text-[12px] leading-snug font-bold text-[var(--color-primary-light)]">
        {value || "—"}
      </p>
    </div>
  );
}

export default function Nativity3DAgentTab({
  nativityChartId,
}: Nativity3DAgentTabProps) {
  const [selectedPlanet, setSelectedPlanet] = useState<string | null>(null);

  const planetsQuery = api.nativity.getNativityPlanets.useQuery(
    { nativityChartId },
    { enabled: Boolean(nativityChartId) },
  );

  const planets = useMemo(
    () => (planetsQuery.data?.planets ?? []) as unknown as PlanetProfile[],
    [planetsQuery.data?.planets],
  );

  const activePlanet = useMemo(
    () =>
      planets.find((planet) => planet.planet === selectedPlanet) ?? planets[0],
    [planets, selectedPlanet],
  );

  useEffect(() => {
    if (!selectedPlanet && planets[0]) {
      setSelectedPlanet(planets[0].planet);
    }
  }, [planets, selectedPlanet]);

  const personality = useMemo(() => {
    if (!activePlanet) return null;

    return {
      mood: moodFor(activePlanet),
      traits: [
        activePlanet.archetype,
        activePlanet.zodiacSign,
        activePlanet.dignity,
      ].filter(Boolean),
      color: activePlanet.colorCode || "#E29626",
      energy: toUnit(activePlanet.strength),
    };
  }, [activePlanet]);

  if (planetsQuery.isLoading) {
    return (
      <div className="flex h-full min-h-[420px] items-center justify-center bg-[var(--color-primary-dark)]">
        <div className="flex items-center gap-3 text-[11px] font-bold tracking-[0.18em] text-[var(--color-primary-light)]/60 uppercase">
          <Loader2 size={16} className="animate-spin" />
          Loading planetary cast
        </div>
      </div>
    );
  }

  if (planetsQuery.error) {
    return (
      <div className="flex h-full min-h-[420px] flex-col items-center justify-center gap-3 bg-[var(--color-primary-dark)] px-6 text-center">
        <Bot size={28} className="text-[var(--color-accent-orange)]" />
        <p className="text-sm font-bold text-[var(--color-primary-light)]">
          The 3D agent could not load this chart.
        </p>
        <p className="max-w-sm text-xs font-medium text-[var(--color-primary-light)]/55">
          {planetsQuery.error.message}
        </p>
      </div>
    );
  }

  if (!activePlanet || !personality) {
    return (
      <div className="flex h-full min-h-[420px] flex-col items-center justify-center gap-3 bg-[var(--color-primary-dark)] px-6 text-center">
        <Orbit size={28} className="text-[var(--color-accent-orange)]" />
        <p className="text-sm font-bold text-[var(--color-primary-light)]">
          No planetary personalities are available for this chart yet.
        </p>
        <p className="max-w-sm text-xs font-medium text-[var(--color-primary-light)]/55">
          Recalculate the nativity chart, then return to summon the 3D cast.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-[560px] flex-col gap-4 bg-[var(--color-primary-dark)] p-3 text-[var(--color-primary-light)] sm:p-5">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-ring-bronze)]/25 pb-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--color-accent-orange)] text-white">
            <Bot size={19} />
          </span>
          <div>
            <p className="flex items-center gap-1.5 text-[9px] font-extrabold tracking-[0.22em] text-[var(--color-accent-orange)] uppercase">
              <Sparkles size={10} /> Live planetary avatar
            </p>
            <h2 className="text-xl font-black tracking-tight uppercase sm:text-2xl">
              3D Agent
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-[var(--color-ring-bronze)]/40 bg-[#22365d] px-3 py-1.5 text-[10px] font-extrabold tracking-[0.14em] uppercase">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent-orange)]" />
          WebGL active
        </div>
      </header>

      <div className="grid flex-1 gap-4 xl:grid-cols-[minmax(0,1fr)_21rem]">
        <section className="flex min-h-[430px] flex-col overflow-hidden rounded-2xl border border-[var(--color-ring-bronze)]/30 bg-[#0f1b31]">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-ring-bronze)]/25 bg-[#22365d] px-4 py-3">
            <div>
              <p className="text-[9px] font-extrabold tracking-[0.2em] text-[var(--color-primary-light)]/50 uppercase">
                Active agent
              </p>
              <p className="text-sm font-black tracking-[0.08em] uppercase">
                {activePlanet.planet}
              </p>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.12em] text-[var(--color-primary-light)]/60 uppercase">
              <span>{activePlanet.zodiacSign}</span>
              <span className="h-1 w-1 rounded-full bg-current opacity-40" />
              <span>House {activePlanet.house}</span>
              {activePlanet.isRetrograde && (
                <>
                  <span className="h-1 w-1 rounded-full bg-current opacity-40" />
                  <span className="text-[var(--color-accent-orange)]">
                    Retrograde
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="relative flex-1 p-3 sm:p-5">
            <div className="pointer-events-none absolute inset-6 rounded-full border border-[var(--color-ring-bronze)]/15" />
            <div className="pointer-events-none absolute inset-12 rounded-full border border-[var(--color-ring-bronze)]/10" />
            <div className="relative h-[340px] w-full sm:h-[430px]">
              <PlanetCharacter3D
                planet={activePlanet.planet}
                personality={personality}
                isActive
                height="100%"
              />
            </div>
          </div>

          <div className="border-t border-[var(--color-ring-bronze)]/25 bg-[#0b1424] p-3">
            <p className="mb-2 text-[9px] font-extrabold tracking-[0.2em] text-[var(--color-primary-light)]/45 uppercase">
              Select agent
            </p>
            <div className="custom-scrollbar flex gap-2 overflow-x-auto pb-1">
              {planets.map((planet) => {
                const isActive = planet.planet === activePlanet.planet;

                return (
                  <button
                    key={planet.planet}
                    type="button"
                    onClick={() => setSelectedPlanet(planet.planet)}
                    className={`shrink-0 rounded-lg border px-3 py-2 text-[10px] font-extrabold tracking-[0.12em] uppercase transition-colors ${
                      isActive
                        ? "border-[var(--color-accent-orange)] bg-[var(--color-accent-orange)] text-white"
                        : "border-[var(--color-ring-bronze)]/30 bg-[#22365d] text-[var(--color-primary-light)]/60 hover:border-[var(--color-accent-orange)] hover:text-[var(--color-primary-light)]"
                    }`}
                  >
                    {planet.planet}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <aside className="space-y-3">
          <div className="rounded-2xl border border-[var(--color-ring-bronze)]/30 bg-[#22365d] p-4">
            <p className="text-[9px] font-extrabold tracking-[0.2em] text-[var(--color-accent-orange)] uppercase">
              {activePlanet.archetype}
            </p>
            <p className="mt-1 text-lg leading-tight font-black">
              {activePlanet.primaryTheme}
            </p>
            <p className="mt-2 text-xs leading-relaxed font-medium text-[var(--color-primary-light)]/65">
              {activePlanet.currentExpression}
            </p>

            <div className="mt-4 space-y-3">
              <Meter
                label="Strength"
                value={toPercent(activePlanet.strength)}
              />
              <Meter
                label="Visibility"
                value={toPercent(activePlanet.visibility)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <InfoCard
              label="Function"
              value={activePlanet.psychologicalFunction}
            />
            <InfoCard label="Life domain" value={activePlanet.lifeDomain} />
            <InfoCard label="Dignity" value={activePlanet.dignity} />
            <InfoCard
              label="Placement"
              value={`${activePlanet.zodiacSign} · ${activePlanet.house}`}
            />
          </div>

          <div className="rounded-2xl border border-[var(--color-ring-bronze)]/30 bg-[#22365d] p-4">
            <p className="text-[9px] font-extrabold tracking-[0.2em] text-[var(--color-primary-light)]/45 uppercase">
              Active dynamics
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(activePlanet.challenges ?? []).slice(0, 2).map((challenge) => (
                <span
                  key={challenge}
                  className="rounded-full border border-[var(--color-accent-orange)]/40 bg-[var(--color-accent-orange)]/10 px-2.5 py-1 text-[9px] font-bold text-[var(--color-accent-orange)]"
                >
                  {challenge}
                </span>
              ))}
              {(activePlanet.potentials ?? []).slice(0, 2).map((potential) => (
                <span
                  key={potential}
                  className="rounded-full border border-[var(--color-accent-glow)]/30 bg-[var(--color-accent-glow)]/10 px-2.5 py-1 text-[9px] font-bold text-[var(--color-accent-glow)]"
                >
                  {potential}
                </span>
              ))}
            </div>
          </div>

          {(activePlanet.relationships ?? []).length > 0 && (
            <div className="rounded-2xl border border-[var(--color-ring-bronze)]/30 bg-[#22365d] p-4">
              <p className="text-[9px] font-extrabold tracking-[0.2em] text-[var(--color-primary-light)]/45 uppercase">
                Relationships
              </p>
              <div className="mt-3 space-y-2">
                {(activePlanet.relationships ?? [])
                  .slice(0, 3)
                  .map((relationship) => (
                    <div
                      key={`${relationship.planet}-${relationship.relationshipType}`}
                      className="flex items-center justify-between gap-2 border-b border-[var(--color-ring-bronze)]/15 pb-2 last:border-0 last:pb-0"
                    >
                      <span className="text-[11px] font-bold">
                        {relationship.planet}
                      </span>
                      <span className="text-[9px] font-extrabold tracking-[0.1em] text-[var(--color-primary-light)]/50 uppercase">
                        {relationship.relationshipType}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
