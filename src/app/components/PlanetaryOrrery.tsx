"use client";

import React, { useState } from "react";
import { useSkyChart } from "~/app/hooks/useSkyChart";

const W = 520;
const H = 368;
const CX = W / 2;
const CY = 208;
const EARTH_R = 70;
const ORBIT_RX = 230;
const ORBIT_RY = 112;
const ORBIT_TILT = -8;

type PlanetMeta = {
  glyph: string;
  label: string;
  color: string;
  size: number;
  jitter: number;
};

const PLANETS: Record<string, PlanetMeta> = {
  MOON: { glyph: "☽", label: "Moon", color: "#e8dcc0", size: 24, jitter: -10 },
  MERCURY: { glyph: "☿", label: "Mercury", color: "#c59b7d", size: 19, jitter: 6 },
  VENUS: { glyph: "♀", label: "Venus", color: "#dd8a68", size: 21, jitter: -4 },
  SUN: { glyph: "☉", label: "Sun", color: "#f0b13c", size: 32, jitter: 10 },
  MARS: { glyph: "♂", label: "Mars", color: "#cf4f37", size: 22, jitter: 2 },
  JUPITER: { glyph: "♃", label: "Jupiter", color: "#e0a33c", size: 28, jitter: 14 },
  SATURN: { glyph: "♄", label: "Saturn", color: "#e6d8b8", size: 26, jitter: -6 },
  MEAN_NODE: { glyph: "☊", label: "Rahu", color: "#7fa8d0", size: 18, jitter: 8 },
};

const SIGN_GLYPHS = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];

const SIGN_ABBR: Record<string, string> = {
  ARIES: "ARI",
  TAURUS: "TAU",
  GEMINI: "GEM",
  CANCER: "CAN",
  LEO: "LEO",
  VIRGO: "VIR",
  LIBRA: "LIB",
  SCORPIO: "SCO",
  SAGITTARIUS: "SAG",
  CAPRICORN: "CAP",
  AQUARIUS: "AQU",
  PISCES: "PIS",
};

/** Longitude → point on the tilted orbit ellipse (0° Aries at the top). */
function orbitPoint(longitude: number, jitter = 0) {
  const a = ((-longitude - 90) * Math.PI) / 180;
  const rx = ORBIT_RX + jitter;
  const ry = ORBIT_RY + jitter * 0.5;
  const ex = rx * Math.cos(a);
  const ey = ry * Math.sin(a);
  const rot = (ORBIT_TILT * Math.PI) / 180;
  return {
    x: CX + ex * Math.cos(rot) - ey * Math.sin(rot),
    y: CY + ex * Math.sin(rot) + ey * Math.cos(rot),
  };
}

const CREAM = "#eaddbd";

export default function PlanetaryOrrery() {
  const [hovered, setHovered] = useState<string | null>(null);
  const { data } = useSkyChart();

  const planets = data?.planets ?? [];
  const active = hovered ? planets.find((p) => p.planet === hovered) : null;

  return (
    <div className="relative mx-auto w-full max-w-[620px]">
      {/* Halo */}
      <div className="pointer-events-none absolute -inset-8 z-0">
        <div className="h-full w-full animate-glow rounded-[3rem] bg-[radial-gradient(circle,var(--color-accent-glow)/20_0%,transparent_70%)] blur-2xl" />
      </div>

      <div className="relative z-10 -rotate-1 border-[3px] border-[var(--color-primary-light)]/80 bg-[#0d1a30] text-[var(--color-primary-light)] shadow-[10px_10px_0_0_#081020]">
        {/* Sketch solar system */}
        <div className="relative px-2 py-2">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="h-auto w-full overflow-visible select-none"
            role="img"
            aria-label="Sketched sidereal solar system with Earth at the centre"
          >
            <defs>
              <clipPath id="orrery-earth-clip">
                <circle cx={CX} cy={CY + 18} r={EARTH_R} />
              </clipPath>
              <filter id="orrery-rough">
                <feTurbulence
                  type="fractalNoise"
                  baseFrequency="0.012 0.02"
                  numOctaves="2"
                  seed="7"
                  result="noise"
                />
                <feDisplacementMap
                  in="SourceGraphic"
                  in2="noise"
                  scale="4"
                  xChannelSelector="R"
                  yChannelSelector="G"
                />
              </filter>
            </defs>

            {/* Zodiac tick ring */}
            {SIGN_GLYPHS.map((glyph, index) => {
              const p = orbitPoint(index * 30 + 15, 34);
              return (
                <text
                  key={glyph}
                  x={p.x}
                  y={p.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="11"
                  fill={CREAM}
                  opacity={0.16}
                >
                  {glyph}
                </text>
              );
            })}

            {/* Orbit */}
            <ellipse
              cx={CX}
              cy={CY}
              rx={ORBIT_RX}
              ry={ORBIT_RY}
              fill="none"
              stroke={CREAM}
              strokeWidth="1.4"
              opacity={0.55}
              transform={`rotate(${ORBIT_TILT} ${CX} ${CY})`}
              filter="url(#orrery-rough)"
            />

            {/* Ecliptic dashed line */}
            <line
              x1={26}
              y1={206}
              x2={W - 26}
              y2={178}
              stroke={CREAM}
              strokeWidth="1"
              strokeDasharray="2 8"
              opacity={0.18}
            />

            {/* Stars */}
            {[
              [64, 70],
              [430, 58],
              [478, 250],
              [92, 286],
              [300, 44],
              [38, 170],
            ].map(([x, y], index) => (
              <text
                key={`star-${index}`}
                x={x}
                y={y}
                fontSize={index % 2 ? 9 : 12}
                fill={CREAM}
                opacity={0.22}
              >
                ✦
              </text>
            ))}

            {/* Earth */}
            <g>
              <circle
                cx={CX}
                cy={CY + 18}
                r={EARTH_R + 8}
                fill="#2f74b3"
                opacity={0.16}
              />
              <image
                href="/earth.png"
                x={CX - EARTH_R}
                y={CY + 18 - EARTH_R}
                width={EARTH_R * 2}
                height={EARTH_R * 2}
                clipPath="url(#orrery-earth-clip)"
                preserveAspectRatio="xMidYMid slice"
              />
              <circle
                cx={CX}
                cy={CY + 18}
                r={EARTH_R}
                fill="none"
                stroke={CREAM}
                strokeWidth="1.4"
                opacity={0.45}
              />
              <text
                x={CX}
                y={CY + 18 + EARTH_R + 18}
                textAnchor="middle"
                fontSize="10"
                fontWeight="900"
                letterSpacing="3"
                style={{ fontFamily: "var(--font-poster-face), Impact, sans-serif" }}
                fill={CREAM}
                opacity={0.85}
              >
                EARTH
              </text>
            </g>

            {/* 12 whole-sign houses, anchored to the ascendant */}
            {data?.houses?.map((house) => {
              const index = Number(house.house.replace("HOUSE_", ""));
              const isAsc = index === 1;
              const cusp = orbitPoint(house.longitude, 0);
              const mid = orbitPoint((house.longitude + 15) % 360, -48);
              const next = orbitPoint((house.longitude + 30) % 360, 0);

              return (
                <g key={house.house}>
                  {isAsc && (
                    <path
                      d={`M${CX},${CY + 18} L${cusp.x},${cusp.y} L${mid.x},${mid.y} L${next.x},${next.y} Z`}
                      fill="var(--color-accent-orange)"
                      opacity={0.08}
                    />
                  )}
                  <line
                    x1={CX}
                    y1={CY + 18}
                    x2={cusp.x}
                    y2={cusp.y}
                    stroke={isAsc ? "var(--color-accent-orange)" : CREAM}
                    strokeWidth={isAsc ? 1.5 : 0.8}
                    opacity={isAsc ? 0.55 : 0.14}
                  />
                  <text
                    x={mid.x}
                    y={mid.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="9"
                    fontWeight="900"
                    style={{ fontFamily: "var(--font-mono), monospace" }}
                    fill={isAsc ? "var(--color-accent-orange)" : CREAM}
                    opacity={isAsc ? 0.95 : 0.35}
                  >
                    {index}
                  </text>
                </g>
              );
            })}

            {/* Ascendant flag */}
            {data?.ascendant && (() => {
              const p = orbitPoint(data.ascendant.longitude, 8);
              return (
                <text
                  x={p.x}
                  y={p.y - 9}
                  textAnchor="middle"
                  fontSize="8"
                  fontWeight="900"
                  letterSpacing="1"
                  style={{ fontFamily: "var(--font-mono), monospace" }}
                  fill="var(--color-accent-orange)"
                  opacity={0.9}
                >
                  ASC
                </text>
              );
            })()}

            {/* Planets */}
            {planets.map((planet) => {
              const meta = PLANETS[planet.planet];
              if (!meta) return null;

              const { x, y } = orbitPoint(planet.longitude, meta.jitter);
              const isHovered = hovered === planet.planet;

              return (
                <g
                  key={planet.planet}
                  tabIndex={0}
                  role="button"
                  aria-label={`${meta.label} at ${planet.degree}° ${planet.sign}`}
                  onMouseEnter={() => setHovered(planet.planet)}
                  onMouseLeave={() => setHovered(null)}
                  onFocus={() => setHovered(planet.planet)}
                  onBlur={() => setHovered(null)}
                  className="cursor-pointer outline-none"
                >
                  {isHovered && (
                    <line
                      x1={CX}
                      y1={CY + 18}
                      x2={x}
                      y2={y}
                      stroke={CREAM}
                      strokeWidth="1"
                      strokeDasharray="3 4"
                      opacity={0.3}
                    />
                  )}

                  {/* Saturn ring */}
                  {planet.planet === "SATURN" && (
                    <ellipse
                      cx={x}
                      cy={y}
                      rx={meta.size * 0.82}
                      ry={meta.size * 0.3}
                      fill="none"
                      stroke={meta.color}
                      strokeWidth="1.6"
                      opacity={0.85}
                      transform={`rotate(-22 ${x} ${y})`}
                    />
                  )}

                  {/* Sun glow */}
                  {planet.planet === "SUN" && (
                    <circle cx={x} cy={y} r={meta.size * 0.9} fill={meta.color} opacity={0.16} />
                  )}

                  <text
                    x={x}
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={isHovered ? meta.size * 1.18 : meta.size}
                    fontWeight="900"
                    fill={meta.color}
                    style={{
                      fontFamily: "Georgia, 'Times New Roman', serif",
                      transition: "font-size 140ms ease",
                    }}
                  >
                    {meta.glyph}
                  </text>

                  <text
                    x={x}
                    y={y + meta.size * 0.72 + 9}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="900"
                    letterSpacing="0.4"
                    style={{ fontFamily: "var(--font-mono), monospace" }}
                    fill={CREAM}
                    opacity={isHovered ? 0.95 : 0.6}
                  >
                    {planet.degree.toFixed(1)}° {SIGN_ABBR[planet.sign] ?? planet.sign}
                    {planet.isRetrograde ? " ℞" : ""}
                  </text>
                </g>
              );
            })}

            {/* Tooltip */}
            {active && (() => {
              const meta = PLANETS[active.planet];
              if (!meta) return null;
              const { x, y } = orbitPoint(active.longitude, meta.jitter);
              const width = 150;
              const tx = Math.min(Math.max(x - width / 2, 4), W - width - 4);
              const ty = y > 150 ? y - 84 : y + 34;

              return (
                <g pointerEvents="none">
                  <rect x={tx + 3} y={ty + 3} width={width} height={58} fill="#081020" />
                  <rect
                    x={tx}
                    y={ty}
                    width={width}
                    height={58}
                    fill="#f4ead2"
                    stroke="#0d1a30"
                    strokeWidth="2.5"
                  />
                  <text
                    x={tx + 10}
                    y={ty + 18}
                    fontSize="11"
                    fontWeight="900"
                    letterSpacing="1"
                    fill="#0d1a30"
                  >
                    {meta.label.toUpperCase()}
                  </text>
                  <text
                    x={tx + 10}
                    y={ty + 33}
                    fontSize="11"
                    fontWeight="900"
                    style={{ fontFamily: "var(--font-mono), monospace" }}
                    fill="#0d1a30"
                  >
                    {active.degree.toFixed(2)}° {SIGN_ABBR[active.sign] ?? active.sign}
                  </text>
                  <text
                    x={tx + 10}
                    y={ty + 46}
                    fontSize="9"
                    fontWeight="700"
                    style={{ fontFamily: "var(--font-mono), monospace" }}
                    fill="#0d1a30"
                    opacity={0.6}
                  >
                    house {active.house}
                    {active.isRetrograde ? " · retrograde" : ""}
                  </text>
                </g>
              );
            })()}
          </svg>
        </div>
      </div>
    </div>
  );
}
