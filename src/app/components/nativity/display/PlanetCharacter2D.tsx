"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";

export type CharacterMood = "neutral" | "happy" | "sad" | "shocked" | "sleepy";
export type PlanetName =
  | "SUN"
  | "MOON"
  | "MERCURY"
  | "VENUS"
  | "MARS"
  | "JUPITER"
  | "SATURN"
  | "URANUS"
  | "NEPTUNE"
  | "PLUTO"
  | "MEAN_NODE"
  | "TRUE_NODE";

export interface CharacterConfig {
  bodyColor?: string;
  auraColor?: string;
  bobSpeed?: number;
  bobIntensity?: number;
  rotationSpeed?: number;
  auraPulseSpeed?: number;
  eyeColor?: string;
  mood?: CharacterMood;
}

interface PlanetCharacterProps {
  config?: CharacterConfig;
  planet?: PlanetName;
  mood?: CharacterMood;
  className?: string;
  height?: string;
}

export default function PlanetCharacter2D({
  config = {},
  planet = "SUN",
  mood: moodProp = "neutral",
  className = "",
  height = "h-40",
}: PlanetCharacterProps) {
  const {
    bodyColor = "#FFD700",
    auraColor = "#FFA500",
    bobSpeed = 2,
    bobIntensity = 0.15,
    rotationSpeed = 0.2,
    auraPulseSpeed = 1.5,
    eyeColor = "#2D241E",
    mood: moodFromConfig = moodProp,
  } = config;

  const mood = moodFromConfig || moodProp;

  const bodyRef = useRef<SVGGElement>(null);
  const headRef = useRef<SVGGElement>(null);
  const mouthRef = useRef<SVGPathElement>(null);
  const leftEyeRef = useRef<SVGGElement>(null);
  const rightEyeRef = useRef<SVGGElement>(null);
  const leftBrowRef = useRef<SVGPathElement>(null);
  const rightBrowRef = useRef<SVGPathElement>(null);
  const blushRef = useRef<SVGGElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);
  const auraRef = useRef<SVGCircleElement>(null);

  // ─── Parametric Math ───

  // Quadratic Bezier for Mouth (Smile/Frown)
  const getMouthPath = (curve: number, width: number = 15) => {
    const baseY = 130;
    const startX = 100 - width;
    const endX = 100 + width;
    const controlY = baseY + curve;
    return `M ${startX} ${baseY} Q 100 ${controlY} ${endX} ${baseY}`;
  };

  // Brow Paths (centered around 0,0 for SVG groups)
  const getBrowPath = (tilt: number, curve: number = 0) => {
    // curve > 0 = sad/worried, curve < 0 = angry
    return `M -8 ${tilt + curve} Q 0 ${tilt - curve} 8 ${tilt + curve}`;
  };

  // ─── Animations driven by personality ───
  useEffect(() => {
    // Ambient Float & Shadow pulse
    gsap.to(bodyRef.current, {
      y: -10 * bobIntensity,
      duration: bobSpeed,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });

    gsap.to(shadowRef.current, {
      scale: 0.8,
      opacity: 0.1,
      duration: bobSpeed,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });

    // Aura pulse
    if (auraRef.current) {
      gsap.to(auraRef.current, {
        opacity: [0.2, 0.5, 0.2],
        r: [75, 85, 75],
        duration: auraPulseSpeed,
        repeat: -1,
        ease: "sine.inOut",
      });
    }

    // Gentle rotation
    gsap.to(bodyRef.current, {
      rotation: rotationSpeed * 10,
      transformOrigin: "center center",
      duration: 6 / rotationSpeed,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });
  }, [bobSpeed, bobIntensity, auraPulseSpeed, rotationSpeed]);

  // ─── Mood Engine ───
  useEffect(() => {
    const tl = gsap.timeline({
      defaults: { duration: 0.5, ease: "elastic.out(1, 0.5)" },
    });

    // Reset base positions
    tl.to(headRef.current, { y: 0, rotation: 0, scale: 1 }, 0);
    tl.to(leftEyeRef.current, { scaleY: 1 }, 0);
    tl.to(rightEyeRef.current, { scaleY: 1 }, 0);

    if (mood === "happy") {
      tl.to(
        mouthRef.current,
        { attr: { d: getMouthPath(15, 18) }, strokeWidth: 4 },
        0,
      );
      tl.to([leftEyeRef.current, rightEyeRef.current], { scaleY: 0.8 }, 0); // Squinty eyes
      tl.to(leftBrowRef.current, { attr: { d: getBrowPath(-5, 2) } }, 0);
      tl.to(rightBrowRef.current, { attr: { d: getBrowPath(-5, 2) } }, 0);
      tl.to(blushRef.current, { opacity: 0.6, scale: 1 }, 0);
    } else if (mood === "sad") {
      tl.to(
        mouthRef.current,
        { attr: { d: getMouthPath(-8, 12) }, strokeWidth: 3 },
        0,
      );
      tl.to(leftBrowRef.current, { attr: { d: getBrowPath(5, 4) } }, 0);
      tl.to(rightBrowRef.current, { attr: { d: getBrowPath(5, 4) } }, 0);
      tl.to(blushRef.current, { opacity: 0 }, 0);
    } else if (mood === "shocked") {
      tl.to(
        mouthRef.current,
        { attr: { d: getMouthPath(20, 8) }, strokeWidth: 5 },
        0,
      );
      tl.to([leftEyeRef.current, rightEyeRef.current], { scale: 1.3 }, 0);
      tl.to(leftBrowRef.current, { attr: { d: getBrowPath(-15, 0) } }, 0);
      tl.to(rightBrowRef.current, { attr: { d: getBrowPath(-15, 0) } }, 0);
      tl.to(blushRef.current, { opacity: 0 }, 0);
    } else if (mood === "sleepy") {
      tl.to(
        mouthRef.current,
        { attr: { d: getMouthPath(3, 10) }, strokeWidth: 2 },
        0,
      );
      tl.to([leftEyeRef.current, rightEyeRef.current], { scaleY: 0.1 }, 0);
      tl.to(leftBrowRef.current, { attr: { d: getBrowPath(0, 0) } }, 0);
      tl.to(rightBrowRef.current, { attr: { d: getBrowPath(0, 0) } }, 0);
      tl.to(blushRef.current, { opacity: 0.2 }, 0);
    } else {
      // Neutral
      tl.to(
        mouthRef.current,
        { attr: { d: getMouthPath(2, 14) }, strokeWidth: 3 },
        0,
      );
      tl.to(leftBrowRef.current, { attr: { d: getBrowPath(0, 0) } }, 0);
      tl.to(rightBrowRef.current, { attr: { d: getBrowPath(0, 0) } }, 0);
      tl.to(blushRef.current, { opacity: 0.3, scale: 0.8 }, 0);
    }
  }, [mood]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const { left, top, width, height } =
      e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - left) / width - 0.5;
    const y = (e.clientY - top) / height - 0.5;
    gsap.to(headRef.current, {
      x: x * 15,
      y: y * 10,
      duration: 0.4,
      ease: "power2.out",
    });
  };

  return (
    <div
      className={`relative flex flex-col items-center justify-center ${className}`}
      onMouseMove={handleMouseMove}
    >
      <svg
        viewBox="0 0 200 200"
        className={`w-full ${height} overflow-visible drop-shadow-lg`}
      >
        {/* Aura glow */}
        <circle
          ref={auraRef}
          cx="100"
          cy="110"
          r="75"
          fill="none"
          stroke={auraColor}
          strokeWidth="2"
          opacity="0.3"
          style={{ filter: `drop-shadow(0 0 10px ${auraColor})` }}
        />

        <g ref={bodyRef}>
          {/* Main Body */}
          <circle
            cx="100"
            cy="110"
            r="60"
            fill={bodyColor}
            style={{ filter: `drop-shadow(0 4px 8px ${bodyColor}40)` }}
          />

          <g ref={headRef}>
            {/* Blush */}
            <g ref={blushRef} opacity="0.3">
              <circle cx="70" cy="115" r="7" fill="white" fillOpacity="0.4" />
              <circle cx="130" cy="115" r="7" fill="white" fillOpacity="0.4" />
            </g>

            {/* Eyes */}
            <g ref={leftEyeRef} transform="translate(80, 100)">
              <ellipse cx="0" cy="0" rx="6" ry="8" fill="white" />
              <circle cx="0" cy="0" r="3" fill={eyeColor} />
            </g>
            <g ref={rightEyeRef} transform="translate(120, 100)">
              <ellipse cx="0" cy="0" rx="6" ry="8" fill="white" />
              <circle cx="0" cy="0" r="3" fill={eyeColor} />
            </g>

            {/* Brows */}
            <path
              ref={leftBrowRef}
              transform="translate(80, 85)"
              d={getBrowPath(0)}
              fill="none"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              ref={rightBrowRef}
              transform="translate(120, 85)"
              d={getBrowPath(0)}
              fill="none"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* Mouth */}
            <path
              ref={mouthRef}
              d={getMouthPath(0)}
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
          </g>
        </g>
      </svg>

      {/* Shadow */}
      <div
        ref={shadowRef}
        className="mt-[-20px] h-4 w-20 rounded-[100%] bg-black/10 blur-sm"
      />
    </div>
  );
}
