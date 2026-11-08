"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { api } from "~/trpc/react";
import { NAV_GROUPS, type NavItem } from "./navigation";

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
  const me = api.user.me.useQuery();
  const isAdmin = me.data?.role === "ADMIN";

  // Desktop persistent collapse state toggle
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [closedGroups, setClosedGroups] = useState<Record<string, boolean>>({});

  const groups = useMemo(
    () =>
      NAV_GROUPS.map((group) => ({
        ...group,
        items: group.items.filter(
          (item) =>
            (!item.adminOnly || isAdmin) && (!item.userOnly || !isAdmin),
        ),
      })).filter((group) => group.items.length > 0),
    [isAdmin],
  );

  const isItemActive = (item: NavItem) => {
    if (item.href === pathname) return true;
    // Some destinations are siblings, not parents (e.g. /dashboard and
    // /dashboard/timeline), so they should not light up together.
    if (
      item.href === "/dashboard" ||
      item.href === "/admin" ||
      item.href === "/nativity"
    ) {
      return false;
    }
    return pathname.startsWith(`${item.href}/`);
  };

  const renderLink = (item: NavItem) => {
    const isActive = isItemActive(item);
    const Icon = item.icon;

    return (
      <Link
        key={item.id}
        href={item.href}
        onClick={() => setIsSidebarOpen(false)}
        title={isCollapsed ? item.label : item.description}
        className={`group relative flex w-full items-center rounded-xl border px-3.5 py-2.5 text-left transition-all duration-300 ${
          isCollapsed ? "justify-center gap-0" : "gap-3.5"
        } ${
          isActive
            ? "border-[var(--color-accent-orange)]/20 bg-gradient-to-r from-[var(--color-accent-orange)]/10 to-[var(--color-accent-glow)]/[0.02] text-white shadow-[0_4px_20px_rgba(209,122,56,0.05)]"
            : "border-transparent bg-transparent text-white/60 hover:bg-white/[0.02] hover:text-white"
        }`}
      >
        {isActive && (
          <div className="absolute top-2.5 bottom-2.5 left-0 w-0.5 rounded-r bg-[var(--color-accent-orange)] shadow-[0_0_8px_var(--color-accent-orange)]" />
        )}

        <span
          className={`shrink-0 transform transition-all duration-300 ${
            isActive
              ? "scale-105 text-[var(--color-accent-orange)] drop-shadow-[0_0_4px_rgba(209,122,56,0.4)] filter"
              : "text-white/40 group-hover:scale-102 group-hover:text-[var(--color-accent-glow)]"
          }`}
        >
          <Icon size={17} />
        </span>

        <span
          className={`overflow-hidden text-[13px] tracking-wide whitespace-nowrap transition-all duration-300 ${
            isCollapsed
              ? "pointer-events-none w-0 opacity-0"
              : "w-auto opacity-100"
          } ${isActive ? "font-semibold text-white" : "font-medium group-hover:text-white/90"}`}
        >
          {item.label}
        </span>

        {isActive && !isCollapsed && (
          <span className="relative ml-auto flex h-1 w-1">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-accent-orange)] opacity-75" />
            <span className="relative inline-flex h-1 w-1 rounded-full bg-[var(--color-accent-orange)]" />
          </span>
        )}

        {isCollapsed && (
          <div className="pointer-events-none invisible absolute left-[64px] z-50 rounded-md border border-white/10 bg-black/95 px-3 py-1.5 font-mono text-[11px] tracking-widest whitespace-nowrap text-white uppercase opacity-0 shadow-2xl transition-all duration-200 group-hover:visible group-hover:opacity-100">
            {item.label}
          </div>
        )}
      </Link>
    );
  };

  return (
    <aside
      className={`font-roboto-mono fixed inset-y-0 left-0 z-50 flex h-screen shrink-0 transform flex-col justify-between border-r border-white/[0.04] bg-[var(--color-primary-dark)] text-[var(--color-primary-light)] transition-all duration-500 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} ${isCollapsed ? "md:w-[68px]" : "md:w-[264px]"} w-[264px]`}
      style={{
        backgroundImage:
          "linear-gradient(180deg, rgba(10,25,47,0.4) 0%, rgba(0,0,0,0.5) 100%)",
      }}
    >
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="absolute top-9 -right-3 z-50 hidden h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-[var(--color-primary-dark)] text-white/50 shadow-md transition-transform duration-300 hover:scale-110 hover:text-white active:scale-95 md:flex"
      >
        {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* Identity Branding Header */}
      <div
        className={`flex shrink-0 flex-col items-center px-4 pt-7 pb-4 text-center transition-all duration-300 ${isCollapsed ? "pb-2" : ""}`}
      >
        <div className="group relative mb-1">
          <div
            className={`absolute inset-0 rounded-full bg-[var(--color-accent-glow)]/20 blur-[32px] transition-transform duration-700 ease-out ${isCollapsed ? "scale-75" : "scale-125 group-hover:scale-150"}`}
          />
          <div className="absolute inset-0 rounded-full bg-white/5 blur-[2px]" />
          <img
            src="/logo.png"
            alt="Kaalvanta Logo"
            className={`relative z-10 object-contain drop-shadow-[0_0_15px_rgba(255,152,0,0.3)] transition-all duration-300 ${
              isCollapsed ? "h-8 w-8" : "h-20 w-20"
            }`}
          />
        </div>

        <div
          className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${isCollapsed ? "h-0 opacity-0" : "h-auto opacity-100"}`}
        >
          <h1 className="mt-3 font-mono text-base font-black tracking-[0.25em] text-white uppercase">
            Kaalvanta
          </h1>
          <p className="mt-1 text-[10px] font-black tracking-[0.2em] text-[var(--color-ring-bronze)] uppercase opacity-85">
            Collective State Engine
          </p>
        </div>
      </div>

      {/* Interactive Navigation List Container */}
      <div className="custom-scrollbar flex-1 space-y-3 overflow-x-hidden overflow-y-auto px-3 py-1">
        {groups.map((group, index) => {
          const isGroupClosed = closedGroups[group.id] ?? false;
          const isSuperAdmin = group.id === "superadmin";

          return (
            <div key={group.id}>
              {index > 0 && (
                <div className="mx-2 mb-2 border-t border-white/[0.05]" />
              )}

              {!isCollapsed && (
                <button
                  type="button"
                  onClick={() =>
                    setClosedGroups((current) => ({
                      ...current,
                      [group.id]: !isGroupClosed,
                    }))
                  }
                  className={`mb-1 flex w-full items-center gap-2 px-3 py-1.5 text-left transition-colors ${
                    isSuperAdmin
                      ? "text-[var(--color-accent-orange)]/70 hover:text-[var(--color-accent-orange)]"
                      : "text-white/30 hover:text-white/55"
                  }`}
                >
                  {isSuperAdmin && <ShieldCheck size={11} />}
                  <span className="font-mono text-[10px] font-bold tracking-[0.24em] uppercase">
                    {group.label}
                  </span>
                  <ChevronDown
                    size={11}
                    className={`ml-auto transition-transform ${isGroupClosed ? "-rotate-90" : ""}`}
                  />
                </button>
              )}

              {!isGroupClosed && (
                <nav className="space-y-[2px]">
                  {group.items.map(renderLink)}
                </nav>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer System Identity Block */}
      <div
        className={`shrink-0 border-t border-white/[0.03] bg-black/15 transition-all duration-300 ${isCollapsed ? "p-2" : "p-3.5"}`}
      >
        <div
          className={`flex items-center rounded-xl border border-white/[0.02] bg-white/[0.01] transition-all duration-300 ${
            isCollapsed ? "justify-center p-1" : "justify-between px-2 py-1"
          }`}
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-[var(--color-primary-light)]/5 text-[12px] font-black text-[var(--color-accent-orange)]">
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

            <div
              className={`flex min-w-0 flex-col overflow-hidden whitespace-nowrap transition-all duration-300 ${
                isCollapsed
                  ? "pointer-events-none w-0 opacity-0"
                  : "w-auto opacity-100"
              }`}
            >
              <p className="max-w-[140px] truncate text-[12px] font-black tracking-wider text-white uppercase">
                {status === "loading"
                  ? "FETCHING CORE..."
                  : session?.user?.name
                    ? session.user.name
                    : "GUEST // OPERATOR"}
              </p>
              <span className="-mt-0.5 max-w-[140px] truncate text-[10px] font-black tracking-[0.15em] text-white/30 uppercase">
                {isAdmin
                  ? "SUPER ADMIN // FULL ACCESS"
                  : "LAGNA // UNCALIBRATED"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
