"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [time, setTime] = useState("");

  useEffect(() => {
    // Helper to format time
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
      );
    };

    // Update immediately on mount
    updateTime();

    // Set interval to update every minute (or change to 1000 for seconds)
    const timer = setInterval(updateTime, 60000);

    return () => clearInterval(timer);
  }, []);
  return (
    <>
      <div className="flex h-screen min-h-screen w-screen overflow-hidden bg-[var(--color-primary-dark)] font-sans text-[var(--color-primary-light)] selection:bg-[var(--color-accent-orange)] selection:text-white">
        {/* 1. Persistent Left Navigation Column */}
        <Sidebar
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />

        {/* 2. Main Terminal Content Area Wrapper */}
        <div className="relative flex h-full min-w-0 flex-1 flex-col">
          {/* Ambient Top-Right Backdrop Atmosphere Glow Layer */}
          <div className="pointer-events-none absolute top-0 right-0 z-0 h-[400px] w-[500px] rounded-full bg-[var(--color-accent-glow)]/5 blur-[130px]" />

          {/* 3. System Command Header Control Bar */}
          <header className="relative z-10 flex h-16 shrink-0 items-center justify-between border-b border-white/[0.04] bg-black/10 px-6 backdrop-blur-md">
            {/* Left Side: Current State Intelligence Session Info */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-md border border-[var(--color-accent-orange)]/20 bg-[var(--color-accent-orange)]/10 px-2.5 py-1">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--color-accent-orange)] shadow-[0_0_8px_var(--color-accent-orange)]" />
                <span className="text-[10px] font-black tracking-widest text-[var(--color-accent-orange)] uppercase">
                  LIVE SESSION
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-black tracking-wider text-white uppercase">
                  STRUCTURED EXPANSION
                </span>
                <span className="mt-0.5 text-[9px] font-black tracking-[0.2em] text-white/30 uppercase">
                  ENGINE ID // SEC-01
                </span>
              </div>
            </div>

            {/* Right Side: High-Density Telemetry Master Clock */}
            <div className="flex h-8 items-center gap-4 border-l border-white/[0.06] pl-4">
              <div className="flex flex-col text-right">
                <span className="text-sm font-black tracking-wide text-white uppercase">
                  {new Date()
                    .toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "2-digit",
                    })
                    .toUpperCase()}
                </span>
                <div className="mt-0.5 flex items-center justify-end gap-1.5">
                  <span className="text-[10px] font-black tracking-wider text-white/50">
                    {time || "--:-- --"}
                  </span>
                </div>
              </div>
            </div>
          </header>
          {/* 4. Secondary Frame Window Container (The High-Contrast Workspace) */}
          <main className="relative z-10 flex-1 overflow-hidden p-3 md:p-5">
            <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[24px] border border-white/20 bg-[var(--color-primary-light)] text-[var(--color-primary-dark)] shadow-2xl">
              {/* Fine systemic matte texture canvas layer */}
              <div className="pointer-events-none absolute inset-0 z-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-multiply" />

              {/* Dynamic Content Frame Port - Page Components Render Right Here */}
              <div className="custom-scrollbar relative z-10 h-full w-full flex-1 overflow-y-auto p-6">
                {children}
              </div>
            </div>
          </main>
        </div>

        {/* Floating System Menu Toggle Button for Mobile Responsive Breaks */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="fixed right-6 bottom-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-accent-orange)] text-white shadow-2xl transition-transform active:scale-95 md:hidden"
        >
          <span className="font-mono text-xs font-bold">MENU</span>
        </button>
      </div>
    </>
  );
}
