import React from "react";
import { Loader2, RefreshCw, BarChart3, Activity } from "lucide-react";

const StoryStatePanel = ({
  storyState,
  isRefreshing,
  onRefresh,
}: {
  storyState?: string;
  isRefreshing: boolean;
  onRefresh: () => void;
}) => {
  const parseStoryState = (state?: string) => {
    if (!state) return null;
    try {
      return JSON.parse(state);
    } catch {
      return { summary: state };
    }
  };

  const stateData = parseStoryState(storyState);

  return (
    <div className="flex min-h-[400px] flex-col justify-between rounded-[2rem] border border-[var(--color-ring-bronze)]/30 bg-[var(--bg-main)] p-6 shadow-xl transition-colors duration-500">
      <div className="mb-4">
        <div className="mb-6 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-[var(--color-accent-orange)]" />
            <p className="text-[10px] font-black tracking-[0.4em] text-[var(--text-muted)] uppercase">
              Story State
            </p>
          </div>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 rounded-xl bg-[var(--color-primary-dark)] px-4 py-2 text-[10px] font-black tracking-widest text-[var(--color-primary-light)] uppercase shadow-md transition-all hover:bg-[var(--color-accent-orange)] hover:text-white disabled:opacity-50"
          >
            {isRefreshing ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <>
                <RefreshCw size={12} />
                <span>Sync</span>
              </>
            )}
          </button>
        </div>

        {stateData ? (
          <div className="space-y-4 text-[11px]">
            {stateData.summary ? (
              <div className="rounded-2xl border border-[var(--color-ring-bronze)]/20 bg-[var(--color-primary-light)] p-4 text-[var(--color-primary-dark)] shadow-inner">
                <p className="font-serif text-sm leading-relaxed italic">
                  "{stateData.summary}"
                </p>
              </div>
            ) : (
              <>
                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      label: "Dominant Pressure",
                      value: stateData.dominantPressure,
                    },
                    {
                      label: "Emotional Climate",
                      value: stateData.emotionalClimate,
                    },
                    {
                      label: "Active Life Arena",
                      value: stateData.activeLifeArena,
                    },
                    {
                      label: "Stability Index",
                      value: `${stateData.stabilityIndex || 0}%`,
                    },
                  ].map((metric, i) => (
                    <div
                      key={i}
                      className="rounded-2xl border border-[var(--color-ring-bronze)]/10 bg-[var(--color-primary-light)] p-3"
                    >
                      <p className="mb-1 text-[9px] font-bold tracking-widest text-[var(--text-muted)] uppercase">
                        {metric.label}
                      </p>
                      <p className="font-black tracking-tighter text-[var(--color-primary-dark)] uppercase">
                        {metric.value || "N/A"}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Technical Insights */}
                <div className="rounded-2xl border border-white/5 bg-[var(--color-primary-dark)] p-4 text-[var(--color-primary-light)] shadow-lg">
                  <div className="mb-3 flex items-center gap-2">
                    <BarChart3
                      size={12}
                      className="text-[var(--color-accent-glow)]"
                    />
                    <p className="text-[9px] font-black tracking-[0.2em] uppercase">
                      Key Insights
                    </p>
                  </div>
                  <div className="space-y-2 font-mono text-[10px] opacity-90">
                    <p className="flex justify-between border-b border-white/5 pb-1">
                      <span className="uppercase opacity-60">
                        Behavioral Momentum:
                      </span>
                      <span className="font-bold text-[var(--color-accent-glow)]">
                        {stateData.behavioralMomentum || "N/A"}
                      </span>
                    </p>
                    <p className="flex justify-between border-b border-white/5 pb-1">
                      <span className="uppercase opacity-60">
                        Narrative Phase:
                      </span>
                      <span className="font-bold text-[var(--color-accent-glow)]">
                        {stateData.narrativePhase || "N/A"}
                      </span>
                    </p>
                    <p className="flex justify-between border-b border-white/5 pb-1">
                      <span className="uppercase opacity-60">
                        Breakthrough Potential:
                      </span>
                      <span className="font-bold text-[var(--color-accent-orange)]">
                        {stateData.breakthroughPotential || "N/A"}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Tags Section */}
                {stateData.pressureClusters?.length > 0 && (
                  <div className="px-1 pt-2">
                    <p className="mb-3 text-[9px] font-black tracking-[0.3em] text-[var(--text-muted)] uppercase">
                      Pressure Clusters
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {stateData.pressureClusters
                        .slice(0, 3)
                        .map((cluster: string, idx: number) => (
                          <span
                            key={idx}
                            className="rounded-lg border border-[var(--color-accent-glow)]/30 bg-[var(--color-accent-glow)]/20 px-3 py-1 text-[9px] font-black tracking-widest text-[var(--color-primary-dark)] uppercase"
                          >
                            {cluster}
                          </span>
                        ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-[var(--color-ring-bronze)]/30 bg-[var(--color-primary-light)] p-8 text-center text-[11px] font-black text-[var(--text-muted)]">
            <div className="h-[1px] w-10 bg-[var(--color-accent-orange)] opacity-50" />
            <p className="tracking-[0.2em] uppercase">
              Void: Awaiting State Synchronization
            </p>
            <div className="h-[1px] w-10 bg-[var(--color-accent-orange)] opacity-50" />
          </div>
        )}
      </div>
    </div>
  );
};

export default StoryStatePanel;
