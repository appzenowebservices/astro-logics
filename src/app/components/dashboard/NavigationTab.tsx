const tabs = [
  { id: "Trading", label: "Market Orbit" },
  { id: "Nativity", label: "Origin Chart" },
  { id: "Mundane", label: "Mundane Logs" },
];
import { Layers } from "lucide-react";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import NativityChart from "./tabs/NativityChart";
import MundaneChart from "./tabs/MundaneChart";
import TradingChart from "../trading/TradingChart";
export const NavigationTab = () => {
  // ==========================================================================================
  const [activeTab, setActiveTab] = useState("Nativity");
  const [asset, setAsset] = useState("BTCUSDT");
  console.log("activeTab", activeTab);
  // ==========================================================================================
  return (
    <>
      <div className="mb-3 flex h-12 items-center gap-6 px-4">
        <div className="mr-4 flex items-center text-[var(--color-ring-bronze)]">
          <Layers size={16} className="mr-2 opacity-50" />
          <span className="text-[10px] font-black tracking-widest uppercase">
            Modules
          </span>
        </div>

        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="group relative py-2"
          >
            <span
              className={`text-[10px] font-black tracking-[0.2em] uppercase transition-all duration-300 ${
                activeTab === tab.id
                  ? "text-[var(--color-primary-light)]"
                  : "text-[var(--color-ring-bronze)]/40 group-hover:text-[var(--color-accent-glow)]"
              }`}
            >
              {tab.label}
            </span>

            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTabUnderline"
                className="absolute right-0 -bottom-1 left-0 h-0.5 bg-[var(--color-accent-orange)]"
              />
            )}
          </button>
        ))}
        {/* Dynamic Asset Label in the light theme */}
        <div className="absolute top-6 right-8 z-20">
          <div className="flex items-center rounded-full bg-[var(--color-primary-dark)] px-4 py-1.5 text-[10px] font-black tracking-tighter text-[var(--color-primary-light)] shadow-lg">
            <span className="mr-2 h-1 w-1 animate-ping rounded-full bg-[var(--color-accent-orange)]" />
            {activeTab === "Trading" ? asset : activeTab.toUpperCase()}
          </div>
        </div>
      </div>
      <div className="relative z-10 h-full w-full text-[var(--color-primary-dark)]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "circOut" }}
            className="h-full w-full p-4"
          >
            {activeTab === "Trading" && <TradingChart />}
            {activeTab === "Nativity" && <NativityChart />}
            {activeTab === "Mundane" && <MundaneChart />}
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
};

// ==========================================================================================
// ==========================================================================================
