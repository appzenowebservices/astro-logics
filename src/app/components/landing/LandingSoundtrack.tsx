"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Music2, Volume2, VolumeX } from "lucide-react";

const SOURCE = "/audio/music/as-above-so-below_v01.mp3";
const STORAGE_KEY = "kaalvanta.landingSound";
const TARGET_VOLUME = 0.38;

/**
 * Landing soundtrack — "As Above, So Below" (66 s, 66 BPM).
 *
 * Browsers refuse unmuted autoplay, so the track starts on the first user
 * gesture, fades in gently, and loops. The toggle persists the listener's
 * choice across visits.
 */
export default function LandingSoundtrack() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeRef = useRef<number | null>(null);
  const wantedRef = useRef(true);
  const playingRef = useRef(false);

  const [playing, setPlaying] = useState(false);
  const [wanted, setWanted] = useState(true);
  const [ready, setReady] = useState(false);

  const fadeTo = useCallback((target: number, duration = 900) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (fadeRef.current) window.cancelAnimationFrame(fadeRef.current);

    const from = audio.volume;
    const started = performance.now();

    const step = (now: number) => {
      const progress = Math.min(1, (now - started) / duration);
      audio.volume = from + (target - from) * progress;
      if (progress < 1) {
        fadeRef.current = window.requestAnimationFrame(step);
      } else {
        fadeRef.current = null;
      }
    };

    fadeRef.current = window.requestAnimationFrame(step);
  }, []);

  const start = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return false;

    try {
      await audio.play();
      fadeTo(TARGET_VOLUME);
      playingRef.current = true;
      setPlaying(true);
      return true;
    } catch {
      // Autoplay blocked — the next gesture retries.
      return false;
    }
  }, [fadeTo]);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    fadeTo(0, 500);
    window.setTimeout(() => {
      audio.pause();
      playingRef.current = false;
      setPlaying(false);
    }, 520);
  }, [fadeTo]);

  useEffect(() => {
    const audio = new Audio(SOURCE);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 0;
    audioRef.current = audio;

    const stored =
      typeof window === "undefined"
        ? null
        : window.localStorage.getItem(STORAGE_KEY);
    const shouldPlay = stored !== "off";
    wantedRef.current = shouldPlay;
    setWanted(shouldPlay);

    const markReady = () => setReady(true);
    audio.addEventListener("canplaythrough", markReady, { once: true });

    const unlock = () => {
      if (!wantedRef.current || playingRef.current) return;
      void start();
    };

    // Try immediately (works when the browser allows it) and again on the
    // first gesture (the reliable path everywhere else).
    if (shouldPlay) void start();
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    window.addEventListener("touchstart", unlock, { passive: true });

    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      window.removeEventListener("touchstart", unlock);
      audio.removeEventListener("canplaythrough", markReady);
      if (fadeRef.current) window.cancelAnimationFrame(fadeRef.current);
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, [start]);

  const toggle = () => {
    const next = !wantedRef.current;

    if (!next) {
      wantedRef.current = false;
      setWanted(false);
      window.localStorage.setItem(STORAGE_KEY, "off");
      stop();
      return;
    }

    wantedRef.current = true;
    setWanted(true);
    window.localStorage.setItem(STORAGE_KEY, "on");
    void start();
  };

  const label = playing
    ? "As Above, So Below"
    : wanted
      ? "Tap for sound"
      : "Sound off";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={playing}
      aria-label={
        playing ? "Pause landing soundtrack" : "Play landing soundtrack"
      }
      className="group fixed bottom-4 left-4 z-40 flex items-center gap-2.5 rounded-full border border-[var(--color-ring-bronze)]/40 bg-[var(--color-primary-dark)]/95 px-3 py-2 text-left text-[var(--color-primary-light)] shadow-lg transition-colors hover:border-[var(--color-accent-orange)] sm:gap-3 sm:px-3.5"
    >
      <span
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-full transition-colors ${
          playing
            ? "bg-[var(--color-accent-orange)] text-white"
            : "bg-[#22365d] text-[var(--color-primary-light)]/70"
        }`}
      >
        {playing ? <Volume2 size={15} /> : <VolumeX size={15} />}
      </span>

      <span className="flex min-w-0 flex-col leading-tight">
        <span className="font-mono text-[8px] font-bold tracking-[0.22em] text-[var(--color-ring-bronze)]/80 uppercase">
          Soundtrack {ready ? "" : "· loading"}
        </span>
        <span className="truncate text-[11px] font-bold text-[var(--color-primary-light)]/85">
          {label}
        </span>
      </span>

      <span className="ml-1 flex h-4 items-end gap-[3px]" aria-hidden="true">
        {[0, 1, 2].map((bar) => (
          <span
            key={bar}
            className={`w-[2px] rounded-full transition-all duration-300 ${
              playing
                ? "bg-[var(--color-accent-orange)]"
                : "bg-[var(--color-primary-light)]/25"
            }`}
            style={{
              height: playing ? (bar === 1 ? "14px" : "9px") : "4px",
              animation: playing
                ? `landing-sound-bar 900ms ease-in-out ${bar * 140}ms infinite alternate`
                : undefined,
            }}
          />
        ))}
      </span>

      <Music2
        size={12}
        className="hidden text-[var(--color-primary-light)]/35 sm:block"
      />

      <style jsx global>{`
        @keyframes landing-sound-bar {
          from {
            height: 4px;
            opacity: 0.55;
          }
          to {
            height: 14px;
            opacity: 1;
          }
        }
      `}</style>
    </button>
  );
}
