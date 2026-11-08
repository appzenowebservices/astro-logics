"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useSkyChart } from "~/app/hooks/useSkyChart";

type Speaker = "saturn" | "ketu" | "both";

const SCRIPT: Array<{ who: Speaker; text: string }> = [
  { who: "saturn", text: "I brought the rules." },
  { who: "ketu", text: "I brought the exit." },
  { who: "saturn", text: "Discipline holds the ring." },
  { who: "ketu", text: "Attachment is the weight." },
  { who: "saturn", text: "Stay the course." },
  { who: "ketu", text: "Or leave the room." },
  { who: "both", text: "Balance — or bust." },
];

const NAMES: Record<Speaker, string> = {
  saturn: "Saturn",
  ketu: "Ketu",
  both: "Saturn × Ketu",
};

const EASE = [0.22, 1, 0.36, 1] as const;

export default function PlanetarySkit() {
  const [index, setIndex] = useState(0);
  const { data } = useSkyChart();

  useEffect(() => {
    const timer = setInterval(
      () => setIndex((current) => (current + 1) % SCRIPT.length),
      3200,
    );
    return () => clearInterval(timer);
  }, []);

  const line = SCRIPT[index] ?? SCRIPT[0]!;
  const moon = data?.planets.find((planet) => planet.planet === "MOON");
  const house = moon?.house ?? 1;
  const sign = moon?.sign ?? "ARIES";

  const saturnActive = line.who === "saturn" || line.who === "both";
  const ketuActive = line.who === "ketu" || line.who === "both";

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-[var(--color-primary-dark)] px-6">
      {/* Stage atmosphere */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_35%,rgba(164,196,217,0.14),transparent_65%)]" />
        <div className="absolute inset-0 opacity-[0.05] [background-image:radial-gradient(var(--color-primary-light)_1.4px,transparent_1.4px)] [background-size:22px_22px]" />
        <span className="absolute top-[18%] left-[12%] text-sm text-[var(--color-primary-light)]/25">
          ✦
        </span>
        <span className="absolute top-[26%] right-[15%] text-xs text-[var(--color-accent-orange)]/40">
          ✦
        </span>
        <span className="absolute bottom-[24%] left-[22%] text-xs text-[var(--color-primary-light)]/20">
          ✦
        </span>
      </div>

      {/* Scene header */}
      <div className="relative z-10 mb-6 flex items-center gap-3 font-mono text-[11px] font-black tracking-[0.3em] uppercase">
        <span className="text-[var(--color-accent-orange)]">Scene 02</span>
        <span className="h-px w-8 bg-[var(--color-primary-light)]/25" />
        <span className="text-[var(--color-primary-light)]/55">
          House {house} · {sign}
        </span>
      </div>

      {/* Dialogue */}
      <div className="relative z-10 mb-4 flex h-[92px] items-end justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="relative max-w-[22rem] rounded-2xl border-[3px] border-[var(--color-primary-dark)] bg-[var(--color-primary-light)] px-5 py-3 text-center shadow-[5px_5px_0_0_#081020] sm:max-w-md"
          >
            <p className="font-mono text-[10px] font-black tracking-[0.28em] text-[var(--color-accent-orange)] uppercase">
              {NAMES[line.who]}
            </p>
            <p className="mt-1 text-sm leading-snug font-black tracking-tight text-[var(--color-primary-dark)] sm:text-base">
              {line.text}
            </p>
            <span className="absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-r-[3px] border-b-[3px] border-[var(--color-primary-dark)] bg-[var(--color-primary-light)]" />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Characters */}
      <div className="relative z-10 flex items-end justify-center gap-10 sm:gap-20">
        <Character
          src="/saturn.png"
          alt="Saturn"
          width={408}
          height={612}
          active={saturnActive}
          dim={line.who === "ketu"}
          delay={0}
        />
        <Character
          src="/ketu.png"
          alt="Ketu"
          width={513}
          height={548}
          active={ketuActive}
          dim={line.who === "saturn"}
          delay={0.2}
        />
      </div>

      {/* Ground */}
      <div className="relative z-0 mt-1 h-4 w-[300px] rounded-full bg-black/35 blur-md sm:w-[420px]" />

      {/* Footnote */}
      <p className="relative z-10 mt-6 font-mono text-[10px] font-bold tracking-[0.26em] text-[var(--color-primary-light)]/30 uppercase">
        Live house read · the sky is the script
      </p>
    </div>
  );
}

function Character({
  src,
  alt,
  width,
  height,
  active,
  dim,
  delay,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  active: boolean;
  dim: boolean;
  delay: number;
}) {
  return (
    <motion.div
      animate={{
        y: active ? -10 : 0,
        scale: active ? 1.05 : 0.97,
        opacity: dim ? 0.45 : 1,
        rotate: active ? (delay ? -1.5 : 1.5) : 0,
      }}
      transition={{ duration: 0.45, delay, ease: EASE }}
      className="relative flex flex-col items-center"
    >
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className="h-[190px] w-auto object-contain drop-shadow-[0_18px_30px_rgba(0,0,0,0.45)] sm:h-[250px] lg:h-[300px]"
      />
      <span
        className={`mt-2 font-mono text-[10px] font-black tracking-[0.28em] uppercase ${
          active
            ? "text-[var(--color-accent-orange)]"
            : "text-[var(--color-primary-light)]/35"
        }`}
      >
        {alt}
      </span>
    </motion.div>
  );
}
