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
            ? "border-[var(--color-ring-bronze)]/40 bg-[var(--color-primary-light)] text-[var(--color-primary-dark)]"
            : "border-transparent bg-transparent text-[var(--color-primary-light)]/65 hover:bg-[var(--color-primary-dark)]/60 hover:text-[var(--color-primary-light)]"
        }`}
      >
        {isActive && (
          <div className="absolute top-2.5 bottom-2.5 left-0 w-[3px] rounded-r bg-[var(--color-accent-orange)]" />
        )}

        <span
          className={`shrink-0 transform transition-all duration-300 ${
            isActive
              ? "scale-105 text-[var(--color-accent-orange)]"
              : "text-[var(--color-primary-light)]/45 group-hover:scale-105 group-hover:text-[var(--color-accent-glow)]"
          }`}
        >
          <Icon size={17} />
        </span>

        <span
          className={`overflow-hidden text-[13px] tracking-wide whitespace-nowrap transition-all duration-300 ${
            isCollapsed
              ? "pointer-events-none w-0 opacity-0"
              : "w-auto opacity-100"
          } ${isActive ? "font-extrabold" : "font-semibold group-hover:text-[var(--color-primary-light)]"}`}
        >
          {item.label}
        </span>

        {isActive && !isCollapsed && (
          <span className="relative ml-auto flex h-1.5 w-1.5">
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--color-accent-orange)]" />
          </span>
        )}

        {isCollapsed && (
          <div className="pointer-events-none invisible absolute left-[64px] z-50 rounded-md border border-[var(--color-ring-bronze)]/40 bg-[var(--color-primary-dark)] px-3 py-1.5 font-sans text-[11px] font-bold tracking-widest whitespace-nowrap text-[var(--color-primary-light)] uppercase opacity-0 shadow-lg transition-all duration-200 group-hover:visible group-hover:opacity-100">
            {item.label}
          </div>
        )}
      </Link>
    );
  };

  return (
    <aside
      className={`font-sans fixed inset-y-0 left-0 z-50 flex h-screen shrink-0 transform flex-col justify-between border-r border-[var(--color-ring-bronze)]/20 bg-[var(--color-primary-dark)] text-[var(--color-primary-light)] transition-all duration-500 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} ${isCollapsed ? "md:w-[68px]" : "md:w-[264px]"} w-[264px]`}
    >
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        className={`absolute top-9 -right-3 z-50 hidden h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-[var(--color-ring-bronze)]/40 bg-[var(--color-primary-dark)] text-[var(--color-primary-light)]/60 shadow-md transition-transform duration-300 hover:scale-110 hover:text-[var(--color-primary-light)] active:scale-95 md:flex`}
      >
        {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* Identity Branding Header */}
      <div
        className={`flex shrink-0 flex-col items-center px-4 pt-7 pb-4 text-center transition-all duration-300 ${isCollapsed ? "pb-2" : ""}`}
      >
        <div className="group relative mb-1">
          <img
            src="/logo.png"
            alt="Kaalvanta Logo"
            className={`relative z-10 object-contain transition-all duration-300 ${
              isCollapsed ? "h-8 w-8" : "h-20 w-20"
            }`}
          />
        </div>

        <div
          className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${isCollapsed ? "h-0 opacity-0" : "h-auto opacity-100"}`}
        >
          <h1 className="mt-3 font-sans text-base font-black tracking-[0.2em] text-white uppercase">
            Kaalvanta
          </h1>
          <p className="mt-1 font-sans text-[10px] font-extrabold tracking-[0.18em] text-[var(--color-ring-bronze)] uppercase">
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
                      ? "text-[var(--color-accent-orange)]/80 hover:text-[var(--color-accent-orange)]"
                      : "text-[var(--color-primary-light)]/40 hover:text-[var(--color-primary-light)]/70"
                  }`}
                >
                  {isSuperAdmin && <ShieldCheck size={11} />}
                  <span className="font-sans text-[10px] font-extrabold tracking-[0.22em] uppercase">
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
        className={`shrink-0 border-t border-[var(--color-ring-bronze)]/20 bg-[var(--color-primary-dark)] transition-all duration-300 ${isCollapsed ? "p-2" : "p-3.5"}`}
      >
        <div
          className={`flex items-center rounded-xl border border-[var(--color-ring-bronze)]/25 bg-[var(--color-primary-dark)] transition-all duration-300 ${
            isCollapsed ? "justify-center p-1" : "justify-between px-2 py-1"
          }`}
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[var(--color-ring-bronze)]/30 bg-[var(--color-primary-dark)] text-[12px] font-black text-[var(--color-accent-orange)]">
              {status === "loading" ? (
                <RefreshCw size={12} className="animate-spin text-[var(--color-primary-light)]/50" />
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
                className={`absolute -right-0.5 -bottom-0.5 h-2 w-2 rounded-full border border-[var(--color-primary-dark)] ${
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
              <p className="max-w-[140px] truncate text-[12px] font-black tracking-wider text-[var(--color-primary-light)] uppercase">
                {status === "loading"
                  ? "FETCHING CORE..."
                  : session?.user?.name
                    ? session.user.name
                    : "GUEST // OPERATOR"}
              </p>
              <span className="-mt-0.5 max-w-[140px] truncate text-[10px] font-bold tracking-[0.15em] text-[var(--color-primary-light)]/50 uppercase">
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
