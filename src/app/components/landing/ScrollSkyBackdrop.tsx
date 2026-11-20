"use client";

import { useEffect, useRef } from "react";

interface ScrollSkyBackdropProps {
  /** How many viewport heights of scrolling the dive takes. */
  travel?: number;
}

/**
 * Fixed landing backdrop: a 1600×6400 panorama that starts in deep space and
 * ends in the earth's atmosphere. Scrolling translates the panorama so the
 * page "descends" from the starfield into cloud-level sky.
 *
 * Performance notes:
 * - one layer, one transform, updated inside requestAnimationFrame
 * - no React state, so scrolling never re-renders the page
 * - honours prefers-reduced-motion by parking mid-descent
 */
export default function ScrollSkyBackdrop({
  travel = 1.35,
}: ScrollSkyBackdropProps) {
  const skyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sky = skyRef.current;
    if (!sky) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let frame = 0;

    const apply = () => {
      frame = 0;
      const viewport = window.innerHeight;
      const maxShift = Math.max(0, sky.offsetHeight - viewport);
      const scrollDistance = Math.max(1, viewport * travel);
      const progress = reducedMotion
        ? 0.55
        : Math.min(1, Math.max(0, window.scrollY / scrollDistance));

      sky.style.transform = `translate3d(0, ${-progress * maxShift}px, 0)`;
    };

    const schedule = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(apply);
    };

    apply();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [travel]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[var(--color-primary-dark)]"
    >
      {/* Panorama: space at the top, atmosphere at the bottom. */}
      <div
        ref={skyRef}
        className="absolute inset-x-0 top-0 h-[400vw] min-h-screen bg-[url('/scrollsky/scrollsky-1600.webp')] bg-[length:100%_auto] bg-top bg-no-repeat will-change-transform"
      />

      {/* Contrast scrims — dark at the top for cream type, lighter as the
          atmosphere arrives so the darker UI panels can float on the sky. */}
      <div className="absolute inset-0 bg-[var(--color-primary-dark)]/30" />
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-primary-dark)]/25 via-[var(--color-primary-dark)]/20 to-[var(--color-primary-dark)]/45" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_-10%,rgba(42,65,112,0.35),transparent)]" />
    </div>
  );
}
