"use client";

import React, { useState } from "react";
import {
  Globe2,
  Zap,
  Compass,
  User,
  MessageSquare,
  Theater,
  Gamepad2,
  Users,
  CalendarDays,
  Bot,
  LayoutGrid,
  Sparkles,
  ScrollText,
  Menu,
  X,
  Orbit,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "~/trpc/react";

// Tab components (keep imports as they were)
import NativityTimelineTab from "./NativityTimelineTab";
import NativityPlanetsTab from "./NativityPlanetsTab";
import NativityAspectsTable from "./NativityAspectsTable";
import NativityGeometryView from "./NativityGeometryView";
import NativityProfilesView from "./NativityProfilesView";
import NativityStoryTab from "./NativityStoryTab";
import NativityCurrentStoryTab from "./NativityCurrentStoryTab";
import NativityMeetPlanetsTab from "./NativityMeetPlanetsTab";
// import NativityGameOfLifeTab from './NativityGameOfLifeTab';
import NativityCharacterTab from "./NativityCharacterTab";
import NativityAgentTab from "./NativityAgentTab"; // ... other imports

const TAB_GROUPS = [
  // {
  //   group: "Identity",
  //   items: [
  //     { id: 'character', label: 'Character', icon: <User size={14} /> },
  //     { id: 'agent', label: 'Astro Agent', icon: <Bot size={14} /> },
  //     { id: 'profiles', label: 'Profiles', icon: <Sparkles size={14} /> },
  //   ]
  // },
  {
    group: "Narrative",
    items: [
      // { id: 'story', label: 'The Story', icon: <ScrollText size={14} /> },
      { id: "current", label: "Today’s Stage", icon: <Theater size={14} /> },
      // { id: 'timeline', label: 'Timeline', icon: <CalendarDays size={14} /> },
    ],
  },
  // {
  //   group: "Mechanics",
  //   items: [
  //     { id: 'planets', label: 'Planets', icon: <Globe2 size={14} /> },
  //     { id: 'aspects', label: 'Aspects', icon: <Zap size={14} /> },
  //     { id: 'geometry', label: 'Geometry', icon: <Compass size={14} /> },
  //   ]
  // },
  {
    group: "Play",
    items: [
      { id: "meet", label: "Meet Cast", icon: <Users size={14} /> },
      // { id: 'game', label: 'Game of Life', icon: <Gamepad2 size={14} /> },
    ],
  },
];

export default function NativityChartDisplay({
  chartId,
  planets,
  aspects,
  angularDistances,
  planetaryProfiles,
}: any) {
  const [activeTab, setActiveTab] = useState("current");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { data: planetsData } = api.nativity.getNativityPlanets.useQuery(
    { nativityChartId: chartId },
    { enabled: activeTab === "planets" },
  );

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[var(--color-primary-dark)] md:flex-row">
      {/* Sidebar: The Saturnine Command Deck */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 transform flex-col border-r border-[var(--color-ring-bronze)]/10 bg-black/40 backdrop-blur-xl transition-transform duration-500 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} `}
      >
        <div className="p-8">
          <div className="flex items-center gap-3">
            <div className="rounded-lg border border-[var(--color-accent-orange)]/20 bg-[var(--color-accent-orange)]/10 p-2">
              <Orbit size={18} className="text-[var(--color-accent-orange)]" />
            </div>
            <h1 className="text-[10px] font-black tracking-[0.4em] text-[var(--color-primary-light)] uppercase">
              Systems
            </h1>
          </div>
        </div>

        <nav className="custom-scrollbar flex-1 overflow-y-auto px-4 pb-6">
          {TAB_GROUPS.map((group, idx) => (
            <div key={group.group} className={idx !== 0 ? "mt-10" : ""}>
              <h3 className="mb-4 px-4 text-[9px] font-black tracking-[0.3em] text-[var(--color-ring-bronze)] uppercase opacity-50">
                {group.group}
              </h3>
              <div className="space-y-1">
                {group.items.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setIsSidebarOpen(false);
                      }}
                      className={`group flex w-full items-center gap-3 rounded-xl px-4 py-2.5 transition-all duration-300 ${
                        isActive
                          ? "border border-[var(--color-accent-glow)]/20 bg-[var(--color-accent-glow)]/10 text-[var(--color-accent-glow)]"
                          : "text-[var(--color-ring-bronze)]/60 hover:bg-white/5 hover:text-[var(--color-primary-light)]"
                      }`}
                    >
                      <span
                        className={`${isActive ? "text-[var(--color-accent-orange)]" : "opacity-40 transition-opacity group-hover:opacity-100"}`}
                      >
                        {tab.icon}
                      </span>
                      <span className="text-[10px] font-black tracking-widest uppercase">
                        {tab.label}
                      </span>
                      {isActive && (
                        <motion.div
                          layoutId="navDot"
                          className="ml-auto h-1 w-1 rounded-full bg-[var(--color-accent-orange)] shadow-[0_0_8px_var(--color-accent-orange)]"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Vessel ID Footer */}
        <div className="border-t border-[var(--color-ring-bronze)]/10 p-6">
          <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-ring-bronze)]/20 bg-[var(--color-primary-dark)] text-[10px] font-black text-[var(--color-accent-orange)]">
              {chartId.substring(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[8px] font-black tracking-tighter text-[var(--color-ring-bronze)] uppercase">
                Manifest ID
              </p>
              <p className="truncate font-mono text-[9px] text-[var(--color-primary-light)]/40">
                {chartId}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Viewport: The Lunar Surface */}
      <main className="relative flex-1 bg-[var(--color-primary-dark)] p-2 md:p-4">
        {/* Backdrop Glow */}
        <div className="pointer-events-none absolute top-0 right-0 h-1/2 w-1/2 rounded-full bg-[var(--color-accent-glow)]/5 blur-[120px]" />

        <motion.div
          layout
          className="relative h-full w-full overflow-hidden rounded-[32px] border border-white/20 bg-[var(--color-primary-light)] shadow-2xl"
        >
          {/* Subtle noise and light texture */}
          <div className="pointer-events-none absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-multiply" />

          <div className="custom-scrollbar relative z-10 h-full w-full overflow-y-auto p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.4, ease: [0.19, 1, 0.22, 1] }}
                className="h-full w-full"
              >
                {/* Tab content rendering logic remains the same */}
                {/* {activeTab === 'timeline' && <NativityTimelineTab nativityChartId={chartId} />}
                {activeTab === 'character' && <NativityCharacterTab nativityChartId={chartId} />}
                {activeTab === 'agent' && <NativityAgentTab nativityChartId={chartId} />}
                {activeTab === 'planets' && planetsData && <NativityPlanetsTab planets={planetsData.planets} />}
                {activeTab === 'game' && <NativityGameOfLifeTab nativityChartId={chartId} />}
                {activeTab === 'aspects' && <NativityAspectsTable aspects={aspects} />}
                {activeTab === 'geometry' && <NativityGeometryView distances={angularDistances} />}
                {activeTab === 'profiles' && <NativityProfilesView profiles={planetaryProfiles} planets={planets} />}
                {activeTab === 'story' && <NativityStoryTab nativityChartId={chartId} />} */}
                {activeTab === "meet" && (
                  <NativityMeetPlanetsTab nativityChartId={chartId} />
                )}
                {activeTab === "current" && (
                  <NativityCurrentStoryTab nativityChartId={chartId} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </main>

      {/* Mobile Sidebar Trigger (Floating) */}
      <button
        onClick={() => setIsSidebarOpen(true)}
        className="fixed right-6 bottom-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-accent-orange)] text-[var(--color-primary-dark)] shadow-xl md:hidden"
      >
        <Menu size={20} />
      </button>
    </div>
  );
}
