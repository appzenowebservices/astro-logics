"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  Loader2,
  MapPin,
  Orbit,
  Plus,
  Search,
  Settings2,
} from "lucide-react";
import {
  useActiveProfile,
  type NativityProfile,
} from "./ActiveProfileProvider";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function formatBirthDate(chart: NativityProfile) {
  const date = new Date(chart.birthDateTime);
  if (Number.isNaN(date.getTime())) return "Unknown date";

  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      ...(chart.timezone ? { timeZone: chart.timezone } : {}),
    }).format(date);
  } catch {
    return dateFormatter.format(date);
  }
}

function profileInitial(chart: NativityProfile | null) {
  return chart?.name?.trim().charAt(0).toUpperCase() || "K";
}

function ProfileAvatar({
  chart,
  size = "sm",
  tone = "cream",
}: {
  chart: NativityProfile | null;
  size?: "sm" | "md";
  tone?: "cream" | "blue";
}) {
  return (
    <span
      className={`relative grid shrink-0 place-items-center overflow-hidden rounded-full border ${
        size === "sm" ? "h-8 w-8" : "h-10 w-10"
      } ${
        tone === "blue"
          ? "border-[var(--color-ring-bronze)]/60 bg-[var(--color-primary-dark)] text-[var(--color-primary-light)]"
          : "border-[var(--color-ring-bronze)]/70 bg-[var(--color-primary-light)] text-[var(--color-primary-dark)]"
      }`}
    >
      <span className="relative font-sans text-[12px] font-black">
        {profileInitial(chart)}
      </span>
    </span>
  );
}

export default function ProfileSwitcher() {
  const {
    charts,
    activeChart,
    activeChartId,
    setActiveChartId,
    isLoading,
    isAuthenticated,
  } = useActiveProfile();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const filteredCharts = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return charts;
    return charts.filter((chart) =>
      `${chart.name} ${chart.locationName ?? ""}`
        .toLowerCase()
        .includes(needle),
    );
  }, [charts, query]);

  if (!isAuthenticated) return null;

  const selectChart = (id: string) => {
    setActiveChartId(id);
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Select nativity profile"
        title={activeChart?.name ?? "Select nativity profile"}
        className={`group flex h-10 items-center gap-2.5 rounded-full border py-1 pr-2.5 pl-1 transition-colors duration-200 ${
          open
            ? "border-[var(--color-accent-orange)] bg-[var(--color-primary-dark)]"
            : "border-[var(--color-ring-bronze)]/60 bg-[var(--color-primary-dark)] hover:border-[var(--color-ring-bronze)]"
        }`}
      >
        <ProfileAvatar chart={activeChart} />

        <span className="hidden min-w-0 flex-col items-start leading-none sm:flex">
          <span className="font-sans text-[9px] font-bold tracking-[0.24em] text-[var(--color-primary-light)]/65 uppercase">
            Active nativity
          </span>
          <span className="mt-1 max-w-[150px] truncate font-sans text-[13px] font-black tracking-[0.04em] text-[var(--color-primary-light)] uppercase">
            {isLoading && !activeChart
              ? "Syncing profiles"
              : (activeChart?.name ?? "Select profile")}
          </span>
        </span>

        {isLoading && !activeChart ? (
          <Loader2
            size={12}
            className="animate-spin text-[var(--color-primary-light)]/50"
          />
        ) : (
          <ChevronDown
            size={13}
            className={`text-[var(--color-primary-light)]/50 transition-transform duration-200 ${
              open
                ? "rotate-180 text-[var(--color-accent-orange)]"
                : "group-hover:text-[var(--color-primary-light)]"
            }`}
          />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            role="listbox"
            aria-label="Nativity profiles"
            className="absolute top-[calc(100%+12px)] right-0 z-[80] w-[23rem] max-w-[calc(100vw-1.5rem)] origin-top-right overflow-hidden rounded-2xl border border-[var(--color-ring-bronze)] bg-[var(--color-primary-dark)] text-[var(--color-primary-light)] shadow-xl"
          >
            <div className="h-[3px] w-full bg-[var(--color-accent-orange)]" />

            <div className="relative flex items-start justify-between gap-3 px-4 pt-4 pb-3">
              <div>
                <p className="font-sans text-[10px] font-bold tracking-[0.28em] text-[var(--color-primary-light)]/65 uppercase">
                  Profile selection
                </p>
                <p className="mt-1 font-sans text-base font-black tracking-tight text-[var(--color-primary-light)] uppercase">
                  {charts.length}{" "}
                  {charts.length === 1 ? "nativity" : "nativities"}
                </p>
              </div>
              <span className="grid h-8 w-8 place-items-center rounded-full border border-[var(--color-ring-bronze)]/40 text-[var(--color-ring-bronze)]">
                <Orbit size={15} />
              </span>
            </div>

            {charts.length > 4 && (
              <div className="relative px-3 pb-2">
                <div className="flex items-center gap-2 rounded-xl border border-[var(--color-ring-bronze)]/40 bg-[#22365d] px-2.5 py-2">
                  <Search
                    size={12}
                    className="shrink-0 text-[var(--color-primary-light)]/40"
                  />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Find a nativity…"
                    className="min-w-0 flex-1 bg-transparent font-sans text-[12px] font-bold text-[var(--color-primary-light)] placeholder:text-[var(--color-primary-light)]/50 focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div className="custom-scrollbar relative max-h-[min(52vh,340px)] overflow-y-auto p-2">
              {isLoading ? (
                <div className="flex items-center justify-center gap-2 px-4 py-10 font-sans text-[11px] font-bold tracking-[0.18em] text-[var(--color-primary-light)]/65 uppercase">
                  <Loader2 size={13} className="animate-spin" />
                  Loading profiles
                </div>
              ) : filteredCharts.length === 0 ? (
                <div className="flex flex-col items-center px-5 py-9 text-center">
                  <span className="grid h-11 w-11 place-items-center rounded-full border border-[var(--color-ring-bronze)]/40">
                    <Orbit
                      size={18}
                      className="text-[var(--color-ring-bronze)]"
                    />
                  </span>
                  <p className="mt-3 font-sans text-[13px] font-black tracking-wide text-[var(--color-primary-light)] uppercase">
                    {charts.length === 0
                      ? "No nativities yet"
                      : "No profile matches"}
                  </p>
                  <p className="mt-1 max-w-[16rem] font-sans text-[12px] font-semibold leading-relaxed text-[var(--color-primary-light)]/60">
                    {charts.length === 0
                      ? "Create your first chart to activate the engine."
                      : "Try another name or location."}
                  </p>
                  {charts.length === 0 && (
                    <Link
                      href="/nativity"
                      onClick={() => setOpen(false)}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-accent-orange)] px-4 py-2.5 font-sans text-[10px] font-bold tracking-[0.16em] text-white uppercase"
                    >
                      <Plus size={11} />
                      New chart
                    </Link>
                  )}
                </div>
              ) : (
                filteredCharts.map((chart) => {
                  const isActive = chart.id === activeChartId;
                  return (
                    <button
                      key={chart.id}
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      onClick={() => selectChart(chart.id)}
                      className={`group/row relative flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors duration-200 ${
                        isActive
                          ? "bg-[var(--color-primary-light)] text-[var(--color-primary-dark)]"
                          : "text-[var(--color-primary-light)] hover:bg-[#35507f]"
                      }`}
                    >
                      {isActive && (
                        <span className="absolute top-3 bottom-3 left-0 w-[3px] rounded-full bg-[var(--color-accent-orange)]" />
                      )}

                      <ProfileAvatar
                        chart={chart}
                        size="md"
                        tone={isActive ? "blue" : "cream"}
                      />

                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate font-sans text-[14px] font-black tracking-[0.04em] uppercase">
                            {chart.name}
                          </span>
                          {isActive && (
                            <span className="shrink-0 rounded-full bg-[var(--color-accent-orange)] px-2 py-0.5 font-sans text-[9px] font-bold tracking-[0.14em] text-white uppercase">
                              Active
                            </span>
                          )}
                        </span>
                        <span
                          className={`mt-1.5 flex items-center gap-1.5 truncate font-sans text-[10px] font-bold tracking-[0.1em] uppercase ${
                            isActive
                              ? "text-[var(--color-primary-dark)]/65"
                              : "text-[var(--color-primary-light)]/60"
                          }`}
                        >
                          <CalendarDays size={10} className="shrink-0" />
                          <span className="truncate">
                            {formatBirthDate(chart)}
                          </span>
                          <span
                            className={`h-1 w-1 shrink-0 rounded-full ${
                              isActive
                                ? "bg-[var(--color-primary-dark)]/35"
                                : "bg-[var(--color-primary-light)]/35"
                            }`}
                          />
                          <MapPin size={10} className="shrink-0" />
                          <span className="truncate">
                            {chart.locationName || "Unknown"}
                          </span>
                        </span>
                      </span>

                      <span
                        className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border transition-colors ${
                          isActive
                            ? "border-[var(--color-primary-dark)]/20 bg-[var(--color-primary-dark)] text-[var(--color-primary-light)]"
                            : "border-[var(--color-primary-light)]/20 text-[var(--color-primary-light)]/40 group-hover/row:text-[var(--color-primary-light)]"
                        }`}
                      >
                        {isActive ? (
                          <Check size={12} />
                        ) : (
                          <ChevronRight size={12} />
                        )}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            <div className="grid grid-cols-2 gap-1.5 border-t border-[var(--color-ring-bronze)]/30 bg-[#22365d] p-2">
              <Link
                href="/profile-selection"
                onClick={() => setOpen(false)}
                className="group/footer flex items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 font-sans text-[10px] font-bold tracking-[0.16em] text-[var(--color-primary-light)]/80 uppercase transition-colors hover:bg-[#2e466f] hover:text-[var(--color-primary-light)]"
              >
                <Settings2 size={12} />
                Manage
              </Link>
              <Link
                href="/nativity"
                onClick={() => setOpen(false)}
                className="group/footer flex items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 font-sans text-[10px] font-bold tracking-[0.16em] text-[var(--color-accent-glow)] uppercase transition-colors hover:bg-[#2e466f] hover:text-[var(--color-primary-light)]"
              >
                <Plus size={12} />
                New chart
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
