"use client";

import React from "react";
import Link from "next/link";
import Navbar from "./components/Navbar";
import HeroSkyScene from "./components/landing/HeroSkyScene";
import LandingSoundtrack from "./components/landing/LandingSoundtrack";

/**
 * Landing shell.
 *
 * Intentionally empty stage: the 3D / 2.5D home page mounts inside the
 * <section> below. Only the ScrollSky backdrop, the header and the footer
 * survive here so the scene has a clean canvas.
 */
export default function HomePage() {
  return (
    <div className="relative isolate min-h-screen overflow-x-clip bg-[var(--color-primary-dark)] text-[var(--color-primary-light)] antialiased">
      <HeroSkyScene />
      <LandingSoundtrack />
      <Navbar />

      <main className="relative z-10">
        <section
          aria-label="Kaalvanta experience stage"
          data-scene="home"
          className="relative h-[200vh] min-h-[900px]"
        >
          {/* 3D / 2.5D scene mounts here. */}
        </section>
      </main>

      <footer className="relative z-10 border-t border-[var(--color-primary-light)]/10 bg-[var(--color-primary-dark)]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div>
              <p className="max-w-xs text-sm leading-relaxed font-medium text-[var(--color-primary-light)]/60">
                A collective state engine for astrology — one resolved signal,
                read six ways.
              </p>
            </div>

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
                <h3 className="font-mono text-[12px] font-black tracking-[0.28em] text-[var(--color-ring-bronze)] uppercase">
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
            <p className="font-mono text-[12px] font-bold tracking-[0.18em] text-[var(--color-primary-light)]/35 uppercase">
              © 2026 Kaalvanta · Collective State Engine
            </p>
            <p className="font-mono text-[12px] font-bold tracking-[0.18em] text-[var(--color-primary-light)]/25 uppercase">
              Sidereal · v1.1.1
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
