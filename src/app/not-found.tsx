"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowLeft, Orbit, Sparkles, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--color-primary-dark)] px-6 py-16 text-[var(--color-primary-light)] selection:bg-[var(--color-primary-light)] selection:text-[var(--color-primary-dark)]">
      {/* Moonlit cosmic decorations */}
      <div className="pointer-events-none absolute top-[-6%] left-[-4%] rotate-12 opacity-[0.06]">
        <Orbit size={400} strokeWidth={0.5} />
      </div>
      <div className="pointer-events-none absolute right-[-6%] bottom-[-10%] -rotate-12 opacity-[0.06]">
        <Orbit size={480} strokeWidth={0.5} />
      </div>
      <div className="animate-twinkle pointer-events-none absolute top-[10%] right-[12%] opacity-[0.45]">
        <Sparkles size={16} className="text-[var(--color-accent-orange)]" />
      </div>
      <div className="animate-twinkle-slow pointer-events-none absolute bottom-[16%] left-[8%] opacity-[0.4]">
        <Sparkles size={12} className="text-[var(--color-primary-light)]" />
      </div>
      <div className="animate-twinkle-slow absolute top-[28%] left-[16%] h-1 w-1 rounded-full bg-[var(--color-primary-light)]/30" />
      <div className="animate-twinkle absolute top-[62%] right-[20%] h-0.75 w-0.75 rounded-full bg-[var(--color-accent-orange)]/50" />
      <div className="animate-twinkle-slow absolute top-[18%] left-[38%] h-0.75 w-0.75 rounded-full bg-[var(--color-primary-light)]/20" />

      <div className="relative z-10 grid w-full max-w-5xl items-center gap-10 lg:grid-cols-2 lg:gap-6">
        {/* LEFT — Saturn Bathed in Moonlight */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative order-2 flex justify-center lg:order-1 lg:justify-end"
        >
          {/* Moonlit glow ring behind saturn */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-[340px] w-[340px] rounded-full bg-[radial-gradient(circle,_var(--color-primary-light)/30_0%,_var(--color-accent-glow)/25_40%,_transparent_70%)] opacity-45 blur-3xl" />
          </div>

          <div className="animate-float-saturn relative">
            <Image
              src="/saturn-removebg.png"
              alt="Saturn adrift in space"
              width={280}
              height={280}
              priority
              className="pointer-events-none relative drop-shadow-[0_0_60px_rgba(234,221,189,0.35)_0_0_30px_rgba(164,196,217,0.25)] select-none"
            />
            {/* Orbiting tag */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-[var(--color-primary-light)]/95 px-4 py-1.5 text-[9px] font-medium tracking-[0.2em] whitespace-nowrap text-[var(--color-primary-dark)] uppercase shadow-lg backdrop-blur-sm"
            >
              <span className="mr-1.5 inline-block h-1 w-1 animate-pulse rounded-full bg-[var(--color-accent-orange)]" />
              Off Orbit
            </motion.div>
          </div>
        </motion.div>

        {/* RIGHT — Content */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="order-1 text-center lg:order-2 lg:text-left"
        >
          {/* Eyebrow */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-primary-light)]/15 bg-[var(--color-primary-light)]/[0.04] px-4 py-2">
            <Compass size={14} className="text-[var(--color-accent-orange)]" />
            <span className="text-[10px] font-black tracking-[0.3em] text-[var(--color-primary-light)]/70 uppercase">
              Error 404 // Sector Unknown
            </span>
          </div>

          {/* 404 in moonlight */}
          <h1 className="mb-1 text-[5.5rem] leading-none font-black tracking-tighter text-[var(--color-primary-light)] sm:text-[7rem] lg:text-[8.5rem]">
            4
            <span className="font-serif text-[var(--color-accent-orange)] italic">
              0
            </span>
            4
          </h1>

          {/* Sub-heading */}
          <h2 className="mb-4 text-2xl font-semibold tracking-tight text-[var(--color-primary-light)]/90 sm:text-3xl lg:text-4xl">
            Lost in the{" "}
            <span className="font-serif font-medium italic">Cosmos</span>
          </h2>

          {/* Description */}
          <p className="mx-auto mb-8 max-w-md text-base leading-relaxed font-medium text-[var(--color-primary-light)]/75 sm:text-lg lg:mx-0">
            The coordinates you charted lead to empty space. This page has
            drifted beyond our orbit — or was never written into the stars.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
            <Link
              href="/"
              className="group flex items-center gap-2 rounded-full bg-[var(--color-primary-light)] px-6 py-3 text-xs font-semibold tracking-[0.1em] text-[var(--color-primary-dark)] uppercase shadow-lg transition-all hover:scale-[1.02] hover:bg-[var(--color-accent-orange)] hover:text-white"
            >
              <ArrowLeft
                size={14}
                className="transition-transform group-hover:-translate-x-0.5"
              />
              Return Home
            </Link>

            <Link
              href="/dashboard"
              className="group flex items-center gap-2 rounded-full border border-[var(--color-primary-light)]/25 px-6 py-3 text-xs font-semibold tracking-[0.1em] text-[var(--color-primary-light)] uppercase transition-all hover:border-transparent hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary-dark)]"
            >
              Enter Dashboard
              <Sparkles
                size={14}
                className="transition-transform group-hover:rotate-12"
              />
            </Link>
          </div>

          {/* Coordinates strip */}
          <div className="mt-10 flex flex-wrap justify-center gap-x-5 gap-y-2 border-t border-[var(--color-primary-light)]/10 pt-5 font-mono text-[9px] font-medium tracking-[0.2em] text-[var(--color-primary-light)]/35 uppercase lg:justify-start">
            <span>SEC-404</span>
            <span className="text-[var(--color-accent-orange)]/50">//</span>
            <span>ENGINE_ERR_NULL</span>
            <span className="text-[var(--color-accent-orange)]/50">//</span>
            <span>LAT 00.000 • LON ∞</span>
          </div>
        </motion.div>
      </div>

      {/* Local animations */}
      <style jsx global>{`
        @keyframes float-saturn {
          0%,
          100% {
            transform: translateY(0px) rotate(-1.5deg);
          }
          50% {
            transform: translateY(-14px) rotate(1.5deg);
          }
        }
        .animate-float-saturn {
          animation: float-saturn 8s ease-in-out infinite;
        }
        @keyframes twinkle {
          0%,
          100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.15);
          }
        }
        .animate-twinkle {
          animation: twinkle 3s ease-in-out infinite;
        }
        .animate-twinkle-slow {
          animation: twinkle 4.5s ease-in-out infinite;
        }
        h1,
        h2 {
          text-wrap: balance;
        }
      `}</style>
    </div>
  );
}
