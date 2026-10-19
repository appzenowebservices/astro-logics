"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import Navbar from "./components/Navbar";
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Compass,
  Gauge,
  Landmark,
  Layers,
  LineChart,
  MessageSquare,
  Moon,
  Network,
  Orbit,
  Sparkles,
  Telescope,
  TrendingUpDown,
} from "lucide-react";

/* ────────────────────────────────────────────────────────────────────────────
   Deterministic starfield — arithmetic only, so SSR and client agree.
   ──────────────────────────────────────────────────────────────────────────── */
const STARS = Array.from({ length: 54 }, (_, i) => ({
  id: i,
  left: `${(i * 37) % 100}%`,
  top: `${(i * 61) % 100}%`,
  size: i % 5 === 0 ? 2.5 : i % 3 === 0 ? 2 : 1,
  slow: i % 2 === 0,
  delay: `${((i % 9) * 0.55).toFixed(2)}s`,
  opacity: 0.12 + ((i * 7) % 6) * 0.11,
}));

const MODULES = [
  "Cosmic Climate",
  "Planetary Parliament",
  "Tension Network",
  "State Evolution",
  "Narrative Engine",
  "Market Overlay",
  "Vector Explorer",
  "Operator Lab",
];

const FEATURES = [
  {
    icon: Gauge,
    index: "01",
    title: "Cosmic Climate",
    body: "One continuous index for the whole sky — planetary pressure, momentum and volatility resolved into a single reading, session after session.",
  },
  {
    icon: Landmark,
    index: "02",
    title: "Planetary Parliament",
    body: "Every body takes a seat. Watch coalitions form, arguments resolve, and verdicts set the tone of the day before you act on it.",
  },
  {
    icon: Network,
    index: "03",
    title: "Tension Network",
    body: "See which aspects are pulling hardest, where the fault lines are forming, and what is about to give under the pressure.",
  },
  {
    icon: LineChart,
    index: "04",
    title: "State Evolution",
    body: "A chart is not a snapshot. Track the configuration as a living trajectory and see where it is heading, not just where it is.",
  },
  {
    icon: MessageSquare,
    index: "05",
    title: "Narrative Engine",
    body: "The same signal, retold as a briefing you can act on. Plain language, no astrological jargon between you and the decision.",
  },
  {
    icon: TrendingUpDown,
    index: "06",
    title: "Market Overlay",
    body: "Project the celestial signal onto live instruments and read the moments where the sky and the market happen to agree.",
  },
];

const STEPS = [
  {
    step: "I",
    title: "Cast the chart",
    body: "Enter birth details, or pick a moment. The engine builds the sidereal chart and resolves every aspect between the bodies.",
  },
  {
    step: "II",
    title: "Resolve the state",
    body: "Positions collapse into one collective state — pressure, tension, momentum and confidence — scored and ready to query.",
  },
  {
    step: "III",
    title: "Read the signal",
    body: "Dashboards, a written narrative and the market overlay, all drawn from the exact same underlying state.",
  },
];

const STATS = [
  { value: "12", label: "Bodies tracked" },
  { value: "6", label: "Intelligence layers" },
  { value: "1", label: "Continuous signal" },
];

const CLIMATE_ROWS = [
  { planet: "Moon", sign: "Capricorn", value: 82, tone: "up" },
  { planet: "Mars", sign: "Pisces", value: 68, tone: "down" },
  { planet: "Venus", sign: "Pisces", value: 61, tone: "up" },
  { planet: "Jupiter", sign: "Gemini", value: 47, tone: "down" },
  { planet: "Saturn", sign: "Aquarius", value: 39, tone: "neutral" },
];

const MARKET_BARS = [34, 52, 41, 63, 48, 72, 58, 80, 66, 91, 74, 88, 96, 82];

/* ────────────────────────────────────────────────────────────────────────────
   Scroll reveal
   ──────────────────────────────────────────────────────────────────────────── */
function Reveal({
  children,
  delay = 0,
  y = 26,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-70px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[10px] font-black tracking-[0.4em] text-[var(--color-accent-orange)] uppercase">
      {children}
    </span>
  );
}

/* ========================================================================== */
export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[var(--color-primary-dark)] text-[var(--color-primary-light)] antialiased">
      <Navbar />

      {/* ══════════════════════════════════ HERO ═════════════════════════════ */}
      <section className="relative overflow-hidden">
        {/* Atmosphere */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_70%_-10%,rgba(164,196,217,0.16),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_10%_110%,rgba(209,122,56,0.12),transparent_60%)]" />
          <div className="absolute inset-0 opacity-[0.035] [background-image:linear-gradient(to_right,var(--color-primary-light)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-primary-light)_1px,transparent_1px)] [background-size:64px_64px]" />
          {STARS.map((s) => (
            <span
              key={s.id}
              className={`absolute rounded-full bg-[var(--color-primary-light)] ${s.slow ? "animate-twinkle-slow" : "animate-twinkle"}`}
              style={{
                left: s.left,
                top: s.top,
                width: s.size,
                height: s.size,
                opacity: s.opacity,
                animationDelay: s.delay,
              }}
            />
          ))}
          <div className="absolute top-[-8%] left-[-6%] rotate-12 opacity-[0.05]">
            <Orbit size={420} strokeWidth={0.5} />
          </div>
        </div>

        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-16 px-4 pt-16 pb-24 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8 lg:px-8 lg:pt-24 lg:pb-32">
          {/* Copy */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-center lg:text-left"
          >
            <div className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-[var(--color-primary-light)]/15 bg-[var(--color-primary-light)]/[0.04] px-4 py-2 backdrop-blur-sm">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-accent-orange)] opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--color-accent-orange)]" />
              </span>
              <span className="font-mono text-[10px] font-black tracking-[0.3em] text-[var(--color-primary-light)]/70 uppercase">
                Sidereal engine · Live session
              </span>
            </div>

            <h1 className="text-[3.25rem] leading-[0.92] font-black tracking-tighter sm:text-7xl lg:text-[5.25rem]">
              Read the sky
              <br />
              <span className="font-serif font-normal text-[var(--color-accent-orange)] italic">
                like a market.
              </span>
            </h1>

            <p className="mx-auto mt-8 max-w-xl text-base leading-relaxed font-medium text-[var(--color-primary-light)]/70 sm:text-lg lg:mx-0">
              Kaalvanta turns astrology into a collective state engine. Every
              planet, aspect and tension resolves into one continuous,
              queryable signal — then gets projected onto the instruments and
              decisions that actually move.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
              <Link
                href="/register"
                className="group flex w-full items-center justify-center gap-2.5 rounded-full bg-[var(--color-primary-light)] px-8 py-4 text-xs font-black tracking-[0.15em] text-[var(--color-primary-dark)] uppercase shadow-[0_0_40px_rgba(234,221,189,0.18)] transition-all hover:bg-[var(--color-accent-orange)] hover:text-white active:scale-[0.98] sm:w-auto"
              >
                Begin your chart
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                href="/login"
                className="group flex w-full items-center justify-center gap-2.5 rounded-full border border-[var(--color-primary-light)]/25 px-8 py-4 text-xs font-black tracking-[0.15em] text-[var(--color-primary-light)] uppercase transition-all hover:border-transparent hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary-dark)] sm:w-auto"
              >
                <Telescope className="h-4 w-4 text-[var(--color-accent-glow)] transition-transform group-hover:scale-110" />
                Explore the engine
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-14 grid max-w-lg grid-cols-3 gap-4 border-t border-[var(--color-primary-light)]/10 pt-7 lg:mx-0">
              {STATS.map((s) => (
                <div key={s.label} className="text-center lg:text-left">
                  <p className="font-mono text-3xl font-black tracking-tight text-[var(--color-primary-light)]">
                    {s.value}
                  </p>
                  <p className="mt-1 font-mono text-[9px] font-bold tracking-[0.2em] text-[var(--color-ring-bronze)]/80 uppercase">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Planet */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex items-center justify-center"
          >
            {/* Glow */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-[280px] w-[280px] animate-glow rounded-full bg-[radial-gradient(circle,var(--color-accent-glow)/35_0%,rgba(209,122,56,0.18)_45%,transparent_72%)] blur-3xl sm:h-[420px] sm:w-[420px]" />
            </div>

            {/* Orbit rings */}
            <div className="pointer-events-none absolute h-[320px] w-[320px] rounded-full border border-[var(--color-ring-bronze)]/20 sm:h-[460px] sm:w-[460px]" />
            <div className="pointer-events-none absolute h-[400px] w-[400px] animate-spin-slow rounded-full border border-dashed border-[var(--color-primary-light)]/10 sm:h-[560px] sm:w-[560px]">
              <span className="absolute top-0 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-[var(--color-accent-orange)] shadow-[0_0_12px_var(--color-accent-orange)]" />
            </div>

            <div className="animate-float relative">
              <Image
                src="/logo.png"
                alt="The Kaalvanta planetary emblem"
                width={620}
                height={326}
                priority
                className="relative h-auto w-[280px] select-none drop-shadow-[0_0_70px_rgba(234,221,189,0.28)] sm:w-[420px] lg:w-[520px]"
              />
            </div>

            {/* Floating readouts */}
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="absolute bottom-2 left-0 rounded-2xl border border-[var(--color-primary-light)]/12 bg-[var(--color-primary-dark)]/70 px-4 py-3 backdrop-blur-md sm:bottom-8 sm:left-2"
            >
              <p className="font-mono text-[9px] font-bold tracking-[0.2em] text-[var(--color-ring-bronze)] uppercase">
                Dominant signal
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-black tracking-tight">
                <Moon className="h-3.5 w-3.5 text-[var(--color-accent-glow)]" />
                Moon → Capricorn
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.85, duration: 0.5 }}
              className="absolute top-4 right-0 rounded-2xl border border-[var(--color-accent-orange)]/25 bg-[var(--color-accent-orange)]/10 px-4 py-3 backdrop-blur-md sm:top-10 sm:right-2"
            >
              <p className="font-mono text-[9px] font-bold tracking-[0.2em] text-[var(--color-accent-orange)] uppercase">
                Confidence
              </p>
              <p className="font-mono text-lg font-black tracking-tight text-[var(--color-primary-light)]">
                0.82
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════ MARQUEE ══════════════════════════════ */}
      <div className="relative flex overflow-hidden border-y border-[var(--color-ring-bronze)]/20 bg-[var(--color-primary-light)]/[0.02] py-5 [mask-image:linear-gradient(to_right,transparent,black_9%,black_91%,transparent)]">
        <div className="flex w-max animate-marquee items-center">
          {[...MODULES, ...MODULES].map((module, i) => (
            <span
              key={`${module}-${i}`}
              className="flex items-center gap-6 px-6 font-mono text-[11px] font-bold tracking-[0.32em] text-[var(--color-primary-light)]/45 uppercase"
            >
              {module}
              <Sparkles className="h-3 w-3 shrink-0 text-[var(--color-accent-orange)]/60" />
            </span>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════ ENGINE ══════════════════════════════ */}
      <section id="engine" className="relative scroll-mt-20 py-24 sm:py-32">
        <div className="pointer-events-none absolute top-1/4 right-[-4%] opacity-[0.04]" aria-hidden>
          <Orbit size={520} strokeWidth={0.5} />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal className="mx-auto mb-16 max-w-2xl text-center">
            <Eyebrow>The engine</Eyebrow>
            <h2 className="mt-5 text-4xl font-black tracking-tighter sm:text-5xl lg:text-6xl">
              Six layers, one{" "}
              <span className="font-serif font-normal text-[var(--color-accent-glow)] italic">
                state
              </span>
            </h2>
            <p className="mt-5 text-base leading-relaxed font-medium text-[var(--color-primary-light)]/60 sm:text-lg">
              Each module reads the same resolved configuration from a different
              angle. Nothing is bolted on — it all descends from one
              computation.
            </p>
          </Reveal>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <Reveal key={feature.title} delay={i * 0.06} className="h-full">
                  <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-[var(--color-primary-light)]/10 bg-[var(--color-primary-light)]/[0.03] p-7 transition-all duration-500 hover:-translate-y-1.5 hover:border-[var(--color-accent-orange)]/40 hover:bg-[var(--color-primary-light)]/[0.05]">
                    <div className="pointer-events-none absolute -top-20 -right-20 h-44 w-44 rounded-full bg-[var(--color-accent-glow)]/0 blur-3xl transition-colors duration-500 group-hover:bg-[var(--color-accent-glow)]/10" />

                    <div className="relative mb-6 flex items-center justify-between">
                      <span className="grid h-12 w-12 place-items-center rounded-2xl border border-[var(--color-ring-bronze)]/25 bg-[var(--color-primary-dark)] text-[var(--color-accent-orange)] transition-colors duration-500 group-hover:border-[var(--color-accent-orange)]/50">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="font-mono text-[11px] font-black tracking-[0.2em] text-[var(--color-primary-light)]/25">
                        {feature.index}
                      </span>
                    </div>

                    <h3 className="relative mb-3 text-lg font-black tracking-tight">
                      {feature.title}
                    </h3>
                    <p className="relative text-sm leading-relaxed font-medium text-[var(--color-primary-light)]/60">
                      {feature.body}
                    </p>

                    <span className="relative mt-6 inline-flex items-center gap-1.5 font-mono text-[10px] font-bold tracking-[0.2em] text-[var(--color-accent-orange)] uppercase opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                      Open module
                      <ArrowUpRight className="h-3 w-3" />
                    </span>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════ METHOD ══════════════════════════════ */}
      <section
        id="method"
        className="relative scroll-mt-20 overflow-hidden border-y border-[var(--color-primary-light)]/8 bg-[var(--color-primary-light)]/[0.02] py-24 sm:py-32"
      >
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-2 lg:gap-20 lg:px-8">
          {/* Steps */}
          <Reveal>
            <Eyebrow>The method</Eyebrow>
            <h2 className="mt-5 text-4xl font-black tracking-tighter sm:text-5xl">
              Three moves from{" "}
              <span className="font-serif font-normal text-[var(--color-accent-orange)] italic">
                birth
              </span>{" "}
              to signal
            </h2>

            <ol className="mt-10 space-y-8">
              {STEPS.map((step, i) => (
                <li key={step.step} className="relative flex gap-6">
                  <div className="flex flex-col items-center">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[var(--color-ring-bronze)]/35 bg-[var(--color-primary-dark)] font-mono text-xs font-black text-[var(--color-accent-orange)]">
                      {step.step}
                    </span>
                    {i < STEPS.length - 1 && (
                      <span className="mt-2 w-px flex-1 bg-gradient-to-b from-[var(--color-ring-bronze)]/40 to-transparent" />
                    )}
                  </div>
                  <div className="pb-1">
                    <h3 className="text-lg font-black tracking-tight">
                      {step.title}
                    </h3>
                    <p className="mt-2 max-w-md text-sm leading-relaxed font-medium text-[var(--color-primary-light)]/60">
                      {step.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </Reveal>

          {/* Mock reading panel */}
          <Reveal delay={0.12}>
            <div className="relative">
              <div className="pointer-events-none absolute -inset-6 rounded-[2.5rem] bg-[radial-gradient(circle_at_70%_20%,rgba(164,196,217,0.14),transparent_65%)] blur-2xl" />

              <div className="relative overflow-hidden rounded-[1.75rem] border border-[var(--color-primary-light)]/12 bg-[var(--color-primary-dark)]/80 shadow-2xl backdrop-blur-sm">
                {/* Panel header */}
                <div className="flex items-center justify-between border-b border-[var(--color-primary-light)]/10 px-6 py-4">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-[var(--color-accent-orange)]/12 text-[var(--color-accent-orange)]">
                      <BarChart3 className="h-3.5 w-3.5" />
                    </span>
                    <div>
                      <p className="font-mono text-[10px] font-black tracking-[0.22em] text-[var(--color-primary-light)] uppercase">
                        Cosmic Climate
                      </p>
                      <p className="font-mono text-[9px] tracking-[0.14em] text-[var(--color-ring-bronze)]/70 uppercase">
                        Session · 27 Apr 2026
                      </p>
                    </div>
                  </div>
                  <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                    <span className="font-mono text-[9px] font-black tracking-[0.18em] text-emerald-300 uppercase">
                      Live
                    </span>
                  </span>
                </div>

                {/* Rows */}
                <div className="space-y-4 px-6 py-6">
                  {CLIMATE_ROWS.map((row, i) => (
                    <div key={row.planet}>
                      <div className="mb-2 flex items-baseline justify-between">
                        <span className="text-xs font-bold tracking-wide">
                          {row.planet}
                          <span className="ml-2 font-mono text-[10px] font-medium tracking-[0.12em] text-[var(--color-primary-light)]/40 uppercase">
                            {row.sign}
                          </span>
                        </span>
                        <span className="font-mono text-xs font-black text-[var(--color-primary-light)]/80">
                          {row.value}
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-primary-light)]/8">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${row.value}%` }}
                          viewport={{ once: true }}
                          transition={{
                            duration: 0.9,
                            delay: 0.15 + i * 0.08,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                          className={`h-full rounded-full ${
                            row.tone === "up"
                              ? "bg-gradient-to-r from-[var(--color-accent-orange)] to-[var(--color-ring-bronze)]"
                              : row.tone === "down"
                                ? "bg-gradient-to-r from-[var(--color-accent-glow)]/80 to-[var(--color-accent-glow)]/40"
                                : "bg-[var(--color-primary-light)]/35"
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Panel footer */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-primary-light)]/10 bg-[var(--color-primary-light)]/[0.02] px-6 py-4">
                  <span className="font-mono text-[10px] font-bold tracking-[0.18em] text-[var(--color-ring-bronze)]/80 uppercase">
                    State · Balanced
                  </span>
                  <span className="font-mono text-[10px] font-bold tracking-[0.18em] text-[var(--color-accent-orange)] uppercase">
                    Tension 0.31
                  </span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═════════════════════════════ PARLIAMENT ════════════════════════════ */}
      <section id="parliament" className="relative scroll-mt-20 py-24 sm:py-32">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-2 lg:gap-20 lg:px-8">
          <Reveal className="order-2 lg:order-1">
            <div className="relative">
              <div className="pointer-events-none absolute -inset-5 rounded-[2.5rem] bg-[radial-gradient(circle_at_30%_70%,rgba(209,122,56,0.14),transparent_65%)] blur-2xl" />
              <div className="relative overflow-hidden rounded-[1.75rem] border border-[var(--color-ring-bronze)]/30 shadow-2xl">
                <Image
                  src="/scene.jpg"
                  alt="Two planetary characters in debate against a starfield"
                  width={1003}
                  height={635}
                  className="h-auto w-full object-cover"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--color-primary-dark)] via-transparent to-transparent opacity-80" />
                <div className="absolute bottom-0 left-0 p-6">
                  <p className="font-mono text-[10px] font-black tracking-[0.28em] text-[var(--color-primary-light)]/70 uppercase">
                    Session 214 · Open floor
                  </p>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1} className="order-1 lg:order-2">
            <Eyebrow>Planetary Parliament</Eyebrow>
            <h2 className="mt-5 text-4xl font-black tracking-tighter sm:text-5xl">
              Every planet has a{" "}
              <span className="font-serif font-normal text-[var(--color-accent-glow)] italic">
                vote
              </span>
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed font-medium text-[var(--color-primary-light)]/60">
              Instead of a flat list of placements, the engine seats each body
              as a delegate. They form blocs, argue their case and settle into a
              verdict — mirroring how a chart actually behaves in a life.
            </p>

            <ul className="mt-8 space-y-4">
              {[
                "Coalitions and oppositions surface automatically.",
                "Dissent is weighted and preserved, never averaged away.",
                "Verdicts feed straight back into the state index.",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-1.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border border-[var(--color-accent-orange)]/50">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent-orange)]" />
                  </span>
                  <span className="text-sm leading-relaxed font-medium text-[var(--color-primary-light)]/75">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════ MARKET ═══════════════════════════════ */}
      <section
        id="market"
        className="relative scroll-mt-20 overflow-hidden border-y border-[var(--color-primary-light)]/8 bg-[var(--color-primary-light)]/[0.02] py-24 sm:py-32"
      >
        <div className="pointer-events-none absolute bottom-[-12%] left-[-6%] -rotate-12 opacity-[0.04]" aria-hidden>
          <Orbit size={480} strokeWidth={0.5} />
        </div>

        <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-2 lg:gap-20 lg:px-8">
          <Reveal>
            <Eyebrow>Market Overlay</Eyebrow>
            <h2 className="mt-5 text-4xl font-black tracking-tighter sm:text-5xl">
              Where the sky and the{" "}
              <span className="font-serif font-normal text-[var(--color-accent-orange)] italic">
                tape
              </span>{" "}
              agree
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed font-medium text-[var(--color-primary-light)]/60">
              The overlay plots celestial pressure against live instrument data,
              so you can see the windows where both are leaning the same way —
              and, just as usefully, the windows where they are not.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="group flex items-center justify-center gap-2 rounded-full bg-[var(--color-accent-orange)] px-7 py-3.5 text-xs font-black tracking-[0.15em] text-white uppercase shadow-[0_0_40px_rgba(209,122,56,0.25)] transition-all hover:brightness-110 active:scale-[0.98]"
              >
                Open the overlay
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/market"
                className="flex items-center justify-center gap-2 rounded-full border border-[var(--color-primary-light)]/20 px-7 py-3.5 text-xs font-black tracking-[0.15em] text-[var(--color-primary-light)] uppercase transition-all hover:border-[var(--color-primary-light)]/50 sm:w-auto"
              >
                See a live board
              </Link>
            </div>
          </Reveal>

          {/* Mock chart */}
          <Reveal delay={0.12}>
            <div className="relative">
              <div className="pointer-events-none absolute -inset-6 rounded-[2.5rem] bg-[radial-gradient(circle_at_30%_30%,rgba(164,196,217,0.14),transparent_65%)] blur-2xl" />

              <div className="relative overflow-hidden rounded-[1.75rem] border border-[var(--color-primary-light)]/12 bg-[var(--color-primary-dark)]/80 p-6 shadow-2xl backdrop-blur-sm sm:p-7">
                <div className="mb-7 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-[var(--color-accent-glow)]/12 text-[var(--color-accent-glow)]">
                      <Layers className="h-3.5 w-3.5" />
                    </span>
                    <div>
                      <p className="font-mono text-[10px] font-black tracking-[0.22em] uppercase">
                        Sky ↔ Market
                      </p>
                      <p className="font-mono text-[9px] tracking-[0.14em] text-[var(--color-ring-bronze)]/70 uppercase">
                        Rolling correlation ρ 0.72
                      </p>
                    </div>
                  </div>
                  <Compass className="h-4 w-4 text-[var(--color-primary-light)]/25" />
                </div>

                <div className="flex h-40 items-end gap-1.5 sm:h-48 sm:gap-2">
                  {MARKET_BARS.map((height, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      whileInView={{ height: `${height}%` }}
                      viewport={{ once: true }}
                      transition={{
                        duration: 0.7,
                        delay: i * 0.045,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className={`flex-1 rounded-t-sm ${
                        i % 3 === 0
                          ? "bg-gradient-to-t from-[var(--color-accent-orange)]/25 to-[var(--color-accent-orange)]"
                          : "bg-gradient-to-t from-[var(--color-primary-light)]/12 to-[var(--color-primary-light)]/45"
                      }`}
                    />
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-[var(--color-primary-light)]/10 pt-4 font-mono text-[9px] font-bold tracking-[0.18em] text-[var(--color-primary-light)]/35 uppercase">
                  <span>T-14d</span>
                  <span className="text-[var(--color-accent-orange)]/80">
                    Alignment window
                  </span>
                  <span>Now</span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════ CTA ═════════════════════════════════ */}
      <section className="relative px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
        <Reveal className="mx-auto max-w-6xl">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-[var(--color-primary-light)] px-8 py-14 text-center shadow-2xl sm:px-16 sm:py-20 md:py-24">
            {/* Ring motifs */}
            <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full border border-[var(--color-primary-dark)]/10" aria-hidden />
            <div className="pointer-events-none absolute -right-12 -bottom-16 h-56 w-56 rounded-full border border-[var(--color-primary-dark)]/10" aria-hidden />
            <div className="pointer-events-none absolute -top-16 -left-16 h-52 w-52 rounded-full bg-[var(--color-accent-orange)]/10 blur-3xl" aria-hidden />

            <div className="relative">
              <span className="font-mono text-[10px] font-black tracking-[0.4em] text-[var(--color-accent-orange)] uppercase">
                Step one is free
              </span>

              <h2 className="mx-auto mt-6 max-w-3xl text-4xl leading-[0.95] font-black tracking-tighter text-[var(--color-primary-dark)] sm:text-6xl md:text-7xl">
                Ready to read the{" "}
                <span className="font-serif font-normal italic">sky</span>?
              </h2>

              <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed font-medium text-[var(--color-primary-dark)]/70 sm:text-lg">
                Cast your chart, resolve your state and start reading the signal
                in under a minute.
              </p>

              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/register"
                  className="group flex w-full items-center justify-center gap-2.5 rounded-full bg-[var(--color-primary-dark)] px-9 py-4 text-xs font-black tracking-[0.15em] text-[var(--color-primary-light)] uppercase shadow-xl transition-all hover:bg-[var(--color-accent-orange)] hover:text-white active:scale-[0.98] sm:w-auto"
                >
                  Create your account
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/login"
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-[var(--color-primary-dark)]/25 px-9 py-4 text-xs font-black tracking-[0.15em] text-[var(--color-primary-dark)] uppercase transition-all hover:border-[var(--color-primary-dark)]/60 sm:w-auto"
                >
                  I already have one
                </Link>
              </div>

              <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-mono text-[9px] font-bold tracking-[0.22em] text-[var(--color-primary-dark)]/45 uppercase">
                <span>No credit card</span>
                <span className="text-[var(--color-accent-orange)]/60">{"//"}</span>
                <span>Sidereal by default</span>
                <span className="text-[var(--color-accent-orange)]/60">{"//"}</span>
                <span>Your data stays yours</span>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ═════════════════════════════ FOOTER ════════════════════════════════ */}
      <footer className="border-t border-[var(--color-primary-light)]/10 bg-[var(--color-primary-light)]/[0.02]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
            {/* Tagline only — no brand mark or wordmark in the footer */}
            <div>
              <p className="max-w-xs text-sm leading-relaxed font-medium text-[var(--color-primary-light)]/50">
                A collective state engine for astrology — one resolved signal,
                read six ways.
              </p>
            </div>

            {/* Columns */}
            {[
              {
                title: "Engine",
                links: [
                  { label: "Cosmic Climate", href: "/climate" },
                  { label: "Parliament", href: "/parliament" },
                  { label: "State Evolution", href: "/dashboard" },
                ],
              },
              {
                title: "Workspace",
                links: [
                  { label: "Dashboard", href: "/dashboard" },
                  { label: "Market Overlay", href: "/market" },
                  { label: "Narrative", href: "/terminal/narrative" },
                ],
              },
              {
                title: "Account",
                links: [
                  { label: "Sign in", href: "/login" },
                  { label: "Register", href: "/register" },
                  { label: "Choose profile", href: "/profile-selection" },
                ],
              },
            ].map((column) => (
              <div key={column.title}>
                <h3 className="font-mono text-[10px] font-black tracking-[0.28em] text-[var(--color-ring-bronze)] uppercase">
                  {column.title}
                </h3>
                <ul className="mt-5 space-y-3">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm font-medium text-[var(--color-primary-light)]/55 transition-colors hover:text-[var(--color-accent-orange)]"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-[var(--color-primary-light)]/10 pt-7 sm:flex-row">
            <p className="font-mono text-[10px] font-bold tracking-[0.18em] text-[var(--color-primary-light)]/35 uppercase">
              © 2026 Kaalvanta · Collective State Engine
            </p>
            <p className="font-mono text-[10px] font-bold tracking-[0.18em] text-[var(--color-primary-light)]/25 uppercase">
              Sidereal · v1.1.1
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
