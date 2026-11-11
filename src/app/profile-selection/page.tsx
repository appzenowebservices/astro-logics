"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  Clock3,
  Compass,
  MapPin,
  Orbit,
  Plus,
  RefreshCw,
} from "lucide-react";
import { useActiveProfile } from "~/app/components/profile/ActiveProfileProvider";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

function formatDate(value: Date | string, timeZone?: string | null) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";

  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      ...(timeZone ? { timeZone } : {}),
    }).format(date);
  } catch {
    return dateFormatter.format(date);
  }
}

function formatTime(value: Date | string, timeZone?: string | null) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  try {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
      ...(timeZone ? { timeZone } : {}),
    }).format(date);
  } catch {
    return timeFormatter.format(date);
  }
}

function formatCoordinate(value: number, positive: string, negative: string) {
  return `${Math.abs(value).toFixed(2)}°${value >= 0 ? positive : negative}`;
}

function initialFor(name?: string | null) {
  return name?.trim().charAt(0).toUpperCase() || "K";
}

export default function ProfileSelectionPage() {
  const router = useRouter();
  const {
    charts,
    activeChart,
    activeChartId,
    setActiveChartId,
    isLoading,
    isFetching,
    isAuthenticated,
    refetchCharts,
  } = useActiveProfile();

  const selected = activeChart ?? charts[0] ?? null;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--color-primary-light)] p-5 text-[var(--color-primary-dark)] sm:p-8 lg:p-12">
      <div className="relative mx-auto max-w-6xl">
        <header className="flex flex-wrap items-end justify-between gap-5 border-b border-[var(--color-ring-bronze)]/60 pb-6">
          <div>
            <p className="font-sans text-[10px] font-extrabold tracking-[0.24em] text-[var(--color-accent-orange)] uppercase">
              System entry // profile matrix
            </p>
            <h1 className="font-poster mt-2 text-4xl leading-none uppercase sm:text-5xl">
              Select nativity
            </h1>
            <p className="mt-3 max-w-xl text-sm font-semibold opacity-65">
              The active profile drives every vector, timeline, and narrative
              surface in the dashboard.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={refetchCharts}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--color-ring-bronze)]/50 bg-white px-4 py-2.5 font-sans text-[10px] font-extrabold tracking-[0.14em] uppercase transition-colors hover:border-[var(--color-accent-orange)]"
            >
              <RefreshCw
                size={12}
                className={isFetching ? "animate-spin" : ""}
              />
              Refresh
            </button>
            <Link
              href="/nativity"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary-dark)] px-4 py-2.5 font-sans text-[10px] font-extrabold tracking-[0.14em] text-[var(--color-primary-light)] uppercase transition-colors hover:bg-[var(--color-accent-orange)] hover:text-white"
            >
              <Plus size={12} />
              New chart
            </Link>
          </div>
        </header>

        {!isAuthenticated ? (
          <StatePanel
            title="Session required"
            body="Sign in to load your nativity profiles."
            action={{ href: "/login", label: "Sign in" }}
          />
        ) : isLoading && !selected ? (
          <div className="mt-6 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="h-[420px] animate-pulse rounded-[28px] bg-[var(--color-primary-dark)]/15" />
            <div className="h-[420px] animate-pulse rounded-[28px] border border-[var(--color-ring-bronze)]/40 bg-white" />
          </div>
        ) : !selected ? (
          <StatePanel
            title="No nativities yet"
            body="Create a birth chart first, then it will appear here as a selectable profile."
            action={{ href: "/nativity", label: "Create a chart" }}
          />
        ) : (
          <div className="mt-6 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <motion.section
              key={selected.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex min-h-[420px] flex-col justify-between overflow-hidden rounded-[28px] bg-[var(--color-primary-dark)] p-6 text-[var(--color-primary-light)] shadow-md sm:p-9"
            >
              <div className="pointer-events-none absolute -right-24 -bottom-24 h-80 w-80 rounded-full border border-[var(--color-ring-bronze)]/25" />
              <div className="pointer-events-none absolute -right-10 -bottom-10 h-56 w-56 rounded-full border border-[var(--color-accent-glow)]/15" />

              <div className="relative z-10">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-accent-glow)] bg-[var(--color-accent-glow)] px-3 py-1.5 font-sans text-[9px] font-extrabold tracking-[0.18em] text-[var(--color-primary-dark)] uppercase">
                    <Orbit size={11} />
                    Active collective
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-accent-orange)] bg-[var(--color-accent-orange)] px-2.5 py-1 font-sans text-[8px] font-extrabold tracking-[0.14em] text-white uppercase">
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    Live
                  </span>
                </div>

                <h2 className="mt-8 max-w-[15ch] text-5xl leading-none font-black tracking-tighter text-white italic sm:text-6xl">
                  {selected.name}
                </h2>
                <p className="mt-4 max-w-lg font-sans text-[10px] font-extrabold tracking-[0.2em] text-[var(--color-accent-glow)] uppercase">
                  {selected.coordinateSystem ?? "Sidereal"} //{" "}
                  {selected.locationName ?? "Unknown location"}
                </p>
                {selected.description ? (
                  <p className="mt-4 max-w-xl text-sm leading-relaxed font-medium text-[var(--color-primary-light)]/70">
                    {selected.description}
                  </p>
                ) : null}
              </div>

              <div className="relative z-10 mt-10 grid grid-cols-2 gap-2 sm:grid-cols-3">
                <Metric
                  icon={<CalendarDays size={13} />}
                  label="Birth epoch"
                  value={formatDate(selected.birthDateTime, selected.timezone)}
                />
                <Metric
                  icon={<Clock3 size={13} />}
                  label="Birth time"
                  value={formatTime(selected.birthDateTime, selected.timezone)}
                />
                <Metric
                  icon={<MapPin size={13} />}
                  label="Coordinates"
                  value={`${formatCoordinate(selected.latitude, "N", "S")} / ${formatCoordinate(selected.longitude, "E", "W")}`}
                />
              </div>

              <div className="relative z-10 mt-8 flex flex-wrap items-center gap-3 border-t border-[var(--color-ring-bronze)]/25 pt-6">
                <button
                  type="button"
                  onClick={() => router.push("/dashboard")}
                  className="group inline-flex items-center gap-2 rounded-full bg-[var(--color-primary-light)] px-5 py-3 font-sans text-[10px] font-extrabold tracking-[0.16em] text-[var(--color-primary-dark)] uppercase transition-colors hover:bg-[var(--color-accent-orange)] hover:text-white"
                >
                  Enter dashboard
                  <ArrowRight
                    size={13}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </button>
                <Link
                  href="/nativity"
                  className="group inline-flex items-center gap-1.5 font-sans text-[10px] font-extrabold tracking-[0.16em] text-[var(--color-primary-light)]/60 uppercase transition-colors hover:text-[var(--color-primary-light)]"
                >
                  Open archive
                  <ArrowUpRight
                    size={13}
                    className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </Link>
              </div>
            </motion.section>

            <section className="rounded-[28px] border border-[var(--color-ring-bronze)]/40 bg-white p-3 shadow-sm">
              <div className="flex items-center justify-between px-3 pt-3 pb-3">
                <div>
                  <p className="font-sans text-[9px] font-extrabold tracking-[0.22em] text-[var(--color-accent-orange)] uppercase">
                    Profile matrix
                  </p>
                  <p className="mt-1 text-sm font-black uppercase">
                    {charts.length}{" "}
                    {charts.length === 1 ? "nativity" : "nativities"}
                  </p>
                </div>
                <span className="grid h-9 w-9 place-items-center rounded-full border border-[var(--color-ring-bronze)]/40 bg-[var(--color-primary-light)]">
                  <Orbit
                    size={16}
                    className="text-[var(--color-accent-orange)]"
                  />
                </span>
              </div>

              <div className="custom-scrollbar max-h-[520px] space-y-2 overflow-y-auto p-1">
                {charts.map((chart) => {
                  const isActive = chart.id === activeChartId;
                  return (
                    <button
                      key={chart.id}
                      type="button"
                      onClick={() => setActiveChartId(chart.id)}
                      className={`group relative flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-all duration-300 ${
                        isActive
                          ? "border-[var(--color-primary-dark)] bg-[var(--color-primary-dark)] text-[var(--color-primary-light)] shadow-sm"
                          : "border-[var(--color-ring-bronze)]/35 bg-white hover:border-[var(--color-accent-orange)]"
                      }`}
                    >
                      <span
                        className={`relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full border ${
                          isActive
                            ? "border-[var(--color-accent-orange)] bg-[var(--color-accent-orange)]"
                            : "border-[var(--color-ring-bronze)]/50 bg-[var(--color-primary-light)]"
                        }`}
                      >
                        <span
                          className={`font-sans text-[12px] font-black ${
                            isActive
                              ? "text-white"
                              : "text-[var(--color-primary-dark)]"
                          }`}
                        >
                          {initialFor(chart.name)}
                        </span>
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-[13px] font-black tracking-[0.04em] uppercase">
                            {chart.name}
                          </span>
                          {isActive && (
                            <span className="shrink-0 rounded-full bg-[var(--color-accent-orange)] px-2 py-0.5 font-sans text-[8px] font-extrabold tracking-[0.12em] text-white uppercase">
                              Active
                            </span>
                          )}
                        </span>
                        <span
                          className={`mt-1.5 flex items-center gap-1.5 truncate font-sans text-[10px] font-bold tracking-[0.08em] uppercase ${
                            isActive
                              ? "text-[var(--color-primary-light)]/60"
                              : "text-[var(--color-primary-dark)]/60"
                          }`}
                        >
                          <CalendarDays size={10} className="shrink-0" />
                          <span className="truncate">
                            {formatDate(chart.birthDateTime, chart.timezone)}
                          </span>
                          <span className="h-1 w-1 shrink-0 rounded-full bg-current opacity-30" />
                          <MapPin size={10} className="shrink-0" />
                          <span className="truncate">
                            {chart.locationName ?? "Unknown"}
                          </span>
                        </span>
                      </span>

                      <span
                        className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border transition-colors ${
                          isActive
                            ? "border-[var(--color-accent-orange)] bg-[var(--color-accent-orange)] text-white"
                            : "border-[var(--color-primary-dark)]/15 text-[var(--color-primary-dark)]/40 group-hover:border-[var(--color-accent-orange)] group-hover:text-[var(--color-accent-orange)]"
                        }`}
                      >
                        {isActive ? (
                          <Check size={13} />
                        ) : (
                          <ArrowUpRight size={13} />
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-2 flex items-center gap-2 rounded-2xl border border-dashed border-[var(--color-ring-bronze)]/60 bg-[var(--color-primary-light)]/60 px-3 py-3">
                <Compass
                  size={14}
                  className="shrink-0 text-[var(--color-accent-orange)]"
                />
                <p className="text-[11px] leading-tight font-semibold opacity-65">
                  Selecting a profile updates the top navigation switcher and
                  every profile-aware module.
                </p>
              </div>
            </section>
          </div>
        )}

        <footer className="mt-10 flex flex-wrap items-center justify-between gap-2 font-sans text-[9px] font-extrabold tracking-[0.22em] uppercase opacity-50">
          <p>Engine ID // SEC-01</p>
          <p>
            Validated matrix //{" "}
            {selected ? selected.id.slice(-8).toUpperCase() : "—"}
          </p>
        </footer>
      </div>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--color-ring-bronze)]/30 bg-[#22365d] px-3 py-2.5">
      <span className="flex items-center gap-1.5 font-sans text-[8px] font-extrabold tracking-[0.14em] text-[var(--color-primary-light)]/60 uppercase">
        {icon}
        {label}
      </span>
      <span className="mt-1.5 block truncate font-sans text-[12px] font-bold tracking-wide text-[var(--color-primary-light)]">
        {value}
      </span>
    </div>
  );
}

function StatePanel({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action: { href: string; label: string };
}) {
  return (
    <div className="mt-6 flex min-h-[420px] flex-col items-center justify-center rounded-[28px] border border-dashed border-[var(--color-ring-bronze)]/70 bg-white px-6 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-full border border-[var(--color-ring-bronze)]/50 bg-[var(--color-primary-light)]">
        <Orbit size={24} className="text-[var(--color-accent-orange)]" />
      </span>
      <h2 className="font-poster mt-4 text-3xl uppercase">{title}</h2>
      <p className="mt-2 max-w-sm text-sm font-semibold opacity-65">{body}</p>
      <Link
        href={action.href}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--color-primary-dark)] px-5 py-3 font-sans text-[10px] font-extrabold tracking-[0.16em] text-[var(--color-primary-light)] uppercase transition-colors hover:bg-[var(--color-accent-orange)] hover:text-white"
      >
        {action.label}
        <ArrowRight size={13} />
      </Link>
    </div>
  );
}
