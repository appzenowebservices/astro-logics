"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  TrendingUpDown,
  Home,
  Users,
  Network,
  LineChart,
  Zap,
  MessageSquare,
  TrendingUp,
  Compass,
  Binary,
  Radio,
  RefreshCw,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { useSession } from "next-auth/react";

const NAVIGATION_ITEMS = [
  {
    id: "dashboard",
    href: "/dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard size={18} />,
  },
  {
    id: "climate",
    href: "/climate",
    label: "Cosmic Climate",
    icon: <Home size={18} />,
  },
  {
    id: "parliament",
    href: "/parliament",
    label: "Planetary Parliament",
    icon: <Users size={18} />,
  },
  {
    id: "tension",
    href: "/tension",
    label: "Tension Network",
    icon: <Network size={18} />,
  },
  {
    id: "evolution",
    href: "/evolution",
    label: "State Evolution",
    icon: <LineChart size={18} />,
  },
  {
    id: "narrative",
    href: "/terminal/narrative",
    label: "Narrative Engine",
    icon: <MessageSquare size={18} />,
  },
  {
    id: "market",
    href: "/market",
    label: "Market Overlay",
    icon: <TrendingUpDown size={18} />,
  },
];

const POWER_USER_ITEMS = [
  {
    id: "vector",
    href: "/terminal/vector",
    label: "Vector Explorer",
    icon: <Compass size={18} />,
  },
  {
    id: "similar",
    href: "/terminal/similar",
    label: "Similar States",
    icon: <Binary size={18} />,
  },
  {
    id: "operator",
    href: "/terminal/operator",
    label: "Operator Lab",
    icon: <Radio size={18} />,
  },
];

interface SidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

export default function Sidebar({
  isSidebarOpen,
  setIsSidebarOpen,
}: SidebarProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  // Desktop persistent collapse state toggle
  const [isCollapsed, setIsCollapsed] = useState<boolean>(true);

  const renderLink = (item: (typeof NAVIGATION_ITEMS)[0]) => {
    const isActive = pathname === item.href;

    return (
      <Link
        key={item.id}
        href={item.href}
        onClick={() => setIsSidebarOpen(false)}
        className={`group relative flex w-full items-center rounded-xl border px-4 py-2.5 text-left transition-all duration-300 ${
          isCollapsed ? "justify-center gap-0" : "gap-4"
        } ${
          isActive
            ? "border-[var(--color-accent-orange)]/20 bg-gradient-to-r from-[var(--color-accent-orange)]/10 to-[var(--color-accent-glow)]/[0.02] text-white shadow-[0_4px_20px_rgba(209,122,56,0.05)]"
            : "border-transparent bg-transparent text-white/60 hover:bg-white/[0.02] hover:text-white"
        }`}
      >
        {/* Active Structural Left Accent Border Line */}
        {isActive && (
          <div className="absolute top-2.5 bottom-2.5 left-0 w-0.5 rounded-r bg-[var(--color-accent-orange)] shadow-[0_0_8px_var(--color-accent-orange)]" />
        )}

        {/* Dynamic Icon Theme Swapping */}
        <span
          className={`shrink-0 transform transition-all duration-300 ${
            isActive
              ? "scale-105 text-[var(--color-accent-orange)] drop-shadow-[0_0_4px_rgba(209,122,56,0.4)] filter"
              : "text-white/40 group-hover:scale-102 group-hover:text-[var(--color-accent-glow)]"
          }`}
        >
          {item.icon}
        </span>

        {/* Typography with visibility toggle */}
        <span
          className={`overflow-hidden text-[13px] tracking-wide whitespace-nowrap transition-all duration-300 ${
            isCollapsed
              ? "pointer-events-none w-0 opacity-0"
              : "w-auto opacity-100"
          } ${isActive ? "font-semibold text-white" : "font-medium group-hover:text-white/90"}`}
        >
          {item.label}
        </span>

        {/* Minimal Right System Anchor Dot Indicator */}
        {isActive && !isCollapsed && (
          <span className="relative ml-auto flex h-1 w-1">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-accent-orange)] opacity-75"></span>
            <span className="relative inline-flex h-1 w-1 rounded-full bg-[var(--color-accent-orange)]"></span>
          </span>
        )}

        {/* Micro Hover Tooltip Panel strictly when collapsed */}
        {isCollapsed && (
          <div className="pointer-events-none invisible absolute left-[76px] z-50 rounded-md border border-white/10 bg-black/95 px-3 py-1.5 font-mono text-[10px] tracking-widest whitespace-nowrap text-white uppercase opacity-0 shadow-2xl transition-all duration-200 group-hover:visible group-hover:opacity-100">
            {item.label}
          </div>
        )}
      </Link>
    );
  };

  return (
    <aside
      className={`font-roboto-mono fixed inset-y-0 left-0 z-50 flex h-screen shrink-0 transform flex-col justify-between border-r border-white/[0.04] bg-[var(--color-primary-dark)] text-[var(--color-primary-light)] transition-all duration-500 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} ${isCollapsed ? "md:w-[68px]" : "md:w-[260px]"} w-[260px]`}
      style={{
        backgroundImage:
          "linear-gradient(180deg, rgba(10,25,47,0.4) 0%, rgba(0,0,0,0.5) 100%)",
      }}
    >
      {/* Desktop persistent collapsible toggle button trigger handle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute top-9 -right-3 z-50 hidden h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-[var(--color-primary-dark)] text-white/50 shadow-md transition-transform duration-300 hover:scale-110 hover:text-white active:scale-95 md:flex"
      >
        {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* Identity Branding Header */}
      <div
        className={`flex shrink-0 flex-col items-center px-4 pt-8 pb-5 text-center transition-all duration-300 ${isCollapsed ? "pb-2" : ""}`}
      >
        <div className="group relative mb-2">
          {/* LUNAR GLOW: Layered shadows for a soft atmospheric bloom */}
          <div
            className={`absolute inset-0 rounded-full bg-[var(--color-accent-glow)]/20 blur-[32px] transition-transform duration-700 ease-out ${isCollapsed ? "scale-75" : "scale-125 group-hover:scale-150"}`}
          />
          <div className="absolute inset-0 rounded-full bg-white/5 blur-[2px]" />

          <img
            src="/logo.png"
            alt="Kaalvanta Logo"
            className={`relative z-10 object-contain drop-shadow-[0_0_15px_rgba(255,152,0,0.3)] transition-all duration-300 ${
              isCollapsed ? "h-8 w-8" : "h-24 w-24"
            }`}
          />
        </div>

        <div
          className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${isCollapsed ? "h-0 opacity-0" : "h-auto opacity-100"}`}
        >
          <h1 className="mt-4 font-mono text-base font-black tracking-[0.25em] text-white uppercase">
            Kaalvanta
          </h1>
          <p className="mt-1.5 text-[9px] font-black tracking-[0.2em] text-[var(--color-ring-bronze)] uppercase opacity-85">
            Collective State Engine
          </p>
        </div>
      </div>

      {/* Interactive Navigation List Container */}
      <div className="custom-scrollbar flex-1 space-y-6 overflow-x-hidden overflow-y-auto px-3.5 py-2">
        <nav className="space-y-[3px]">{NAVIGATION_ITEMS.map(renderLink)}</nav>

        {/* Clean System Grid Divider */}
        <div className="mx-3 border-t border-white/[0.05]" />

        <div>
          <h3
            className={`mb-2 px-4 font-mono text-[9px] font-bold tracking-[0.25em] text-white/30 uppercase transition-opacity duration-300 ${
              isCollapsed ? "mb-0 h-0 overflow-hidden opacity-0" : "opacity-100"
            }`}
          >
            Power User
          </h3>
          <nav className="space-y-[3px]">
            {POWER_USER_ITEMS.map(renderLink)}
          </nav>
        </div>
      </div>

      {/* Footer System Identity Block */}
      <div
        className={`shrink-0 border-t border-white/[0.03] bg-black/15 transition-all duration-300 ${isCollapsed ? "p-2" : "p-4"}`}
      >
        <div
          className={`flex items-center rounded-xl border border-white/[0.02] bg-white/[0.01] transition-all duration-300 ${
            isCollapsed ? "justify-center p-1" : "justify-between px-2 py-1"
          }`}
        >
          <div className="flex items-center gap-3">
            {/* Dynamic Avatar Node */}
            <div className="relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-[var(--color-primary-light)]/5 text-[10px] font-black text-[var(--color-accent-orange)]">
              {status === "loading" ? (
                <RefreshCw size={12} className="animate-spin text-white/30" />
              ) : session?.user?.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || "User Profile"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>
                  {session?.user?.name
                    ? session.user.name.charAt(0).toUpperCase()
                    : "G"}
                </span>
              )}

              {/* Status System Tracker Orb */}
              <span
                className={`absolute -right-0.5 -bottom-0.5 h-2 w-2 rounded-full border border-[var(--color-primary-dark)] shadow-[0_0_6px_rgba(52,211,153,0.6)] ${
                  status === "loading"
                    ? "bg-amber-400"
                    : session
                      ? "bg-emerald-400"
                      : "bg-rose-500"
                }`}
              />
            </div>

            {/* Identity Strings Grid (hidden dynamically when collapsed) */}
            <div
              className={`flex flex-col overflow-hidden whitespace-nowrap transition-all duration-300 ${
                isCollapsed
                  ? "pointer-events-none w-0 opacity-0"
                  : "w-auto opacity-100"
              }`}
            >
              <p className="max-w-[130px] truncate text-[11px] font-black tracking-wider text-white uppercase">
                {status === "loading"
                  ? "FETCHING CORE..."
                  : session?.user?.name
                    ? session.user.name
                    : "GUEST // OPERATOR"}
              </p>
              <span className="-mt-0.5 text-[9px] font-black tracking-[0.15em] text-white/30 uppercase">
                {session?.user?.lagna
                  ? `${session.user.lagna} LAGNA`
                  : "LAGNA // UNCALIBRATED"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
