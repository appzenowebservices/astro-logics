"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import ProfileSwitcher from "./profile/ProfileSwitcher";

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
          {/* 3. System Command Header Control Bar */}
          <header className="relative z-30 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-[var(--color-ring-bronze)]/25 bg-[var(--color-primary-dark)] px-3 sm:px-6">
            {/* Left Side: Current State Intelligence Session Info */}
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <div className="flex shrink-0 items-center gap-2 rounded-md border border-[var(--color-accent-orange)] bg-[var(--color-accent-orange)] px-2.5 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary-light)]" />
                <span className="text-[11px] font-extrabold tracking-[0.18em] text-white uppercase">
                  Live session
                </span>
              </div>
              <div className="hidden min-w-0 flex-col sm:flex">
                <span className="truncate text-sm font-black tracking-wider text-white uppercase">
                  STRUCTURED EXPANSION
                </span>
                <span className="mt-0.5 truncate text-[11px] font-bold tracking-[0.2em] text-[var(--color-primary-light)]/55 uppercase">
                  ENGINE ID // SEC-01
                </span>
              </div>
            </div>

            {/* Right Side: Active Profile Switcher + Telemetry Master Clock */}
            <div className="flex shrink-0 items-center gap-2 sm:gap-4">
              <ProfileSwitcher />

              <div className="hidden h-8 items-center gap-4 border-l border-[var(--color-ring-bronze)]/25 pl-4 md:flex">
                <div className="flex flex-col text-right">
                  <span className="text-sm font-black tracking-wide text-[var(--color-primary-light)] uppercase">
                    {new Date()
                      .toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "2-digit",
                      })
                      .toUpperCase()}
                  </span>
                  <div className="mt-0.5 flex items-center justify-end gap-1.5">
                    <span className="text-[12px] font-bold tracking-wider text-[var(--color-primary-light)]/60">
                      {time || "--:-- --"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </header>
          {/* 4. Secondary Frame Window Container (The High-Contrast Workspace) */}
          <main className="relative z-10 flex-1 overflow-hidden p-3 md:p-5">
            <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[20px] border border-[var(--color-ring-bronze)]/40 bg-[var(--color-primary-light)] text-[var(--color-primary-dark)] shadow-xl">
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
