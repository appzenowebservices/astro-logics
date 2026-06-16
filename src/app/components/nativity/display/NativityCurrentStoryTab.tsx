"use client";

import React, { useState, useEffect } from "react";
import { api } from "~/trpc/react";
import { Play, Loader, MapPin, Clock, Activity, RotateCcw } from "lucide-react";
import ScriptEmptyState from "../currentStory/ScriptEmptyState";
import { PlanetSceneDetail } from "../currentStory/PlanetSceneDetail";
import PlanetSceneButton from "../currentStory/PlanetSceneButton";

interface PlanetaryScene {
  id: string;
  createdAt: string;
  overallIntensity: number;
  themes?: string[];
  mainNarrative?: string;
  storyState?: string | Record<string, any>;
  scenes: PlanetaryScene[];
  // Include specific fields used by child components if needed
  behavioralPattern?: string;
  externalConflict?: string;
  dominantPressure?: string;
  relationshipEffect?: string;
  pressureDirection?: string;
  intensity: number;
}

interface CurrentStory {
  id: string;
  createdAt: string;
  overallIntensity: number;
  mainNarrative?: string;
  scenes: PlanetaryScene[];
}

interface CurrentStoryTabProps {
  nativityChartId: string;
  userLocation?: { latitude: number; longitude: number; timeZone?: string };
}

export default function NativityCurrentStoryTab({
  nativityChartId,
  userLocation: propUserLocation,
}: CurrentStoryTabProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRecalculatingScenes, setIsRecalculatingScenes] = useState(false);
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState(propUserLocation ?? null);

  useEffect(() => {
    if (propUserLocation) return;
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          setUserLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          }),
        null,
        { timeout: 10000 },
      );
    }
  }, [propUserLocation]);

  const { data: stories, refetch: refetchStories } =
    api.nativity.getCurrentStories.useQuery({ nativityChartId });

  const generateStoryMutation = api.nativity.generateCurrentStory.useMutation({
    onSuccess: () => {
      setIsGenerating(false);
      refetchStories();
    },
  });

  const generateMainNarrativeMutation =
    api.nativity.generateMainNarrative.useMutation({
      onSuccess: () => {
        setIsGenerating(false);
        refetchStories();
      },
    });

  const recalculateScenesMutation =
    api.nativity.recalculatePlanetaryScenes.useMutation({
      onSuccess: () => {
        setIsRecalculatingScenes(false);
        refetchStories();
      },
      onError: (error) => {
        console.error("Failed to recalculate scenes:", error);
        setIsRecalculatingScenes(false);
      },
    });

  const recalculateSingleSceneMutation =
    api.nativity.recalculateSingleScene.useMutation({
      onSuccess: () => {
        setIsRecalculatingScenes(false);
        refetchStories();
      },
      onError: (error) => {
        console.error("Failed to recalculate single scene:", error);
        setIsRecalculatingScenes(false);
      },
    });

  const handleGenerateTheme = async () => {
    if (!userLocation) return;
    setIsGenerating(true);
    await generateStoryMutation.mutateAsync({
      nativityChartId,
      userLatitude: userLocation.latitude,
      userLongitude: userLocation.longitude,
      userTimeZone: userLocation.timeZone,
    });
  };

  const handleGenerateScript = async () => {
    if (!currentStory) return;
    setIsGenerating(true);
    await generateMainNarrativeMutation.mutateAsync({
      currentStoryId: currentStory.id,
    });
    setIsGenerating(false);
  };

  const handleRecalculateScenes = async () => {
    if (!currentStory) return;
    setIsRecalculatingScenes(true);
    await recalculateScenesMutation.mutateAsync({
      currentStoryId: currentStory.id,
    });
  };

  const handleRecalculateSingleScene = async (sceneId: string) => {
    if (!currentStory) return;
    setIsRecalculatingScenes(true);
    await recalculateSingleSceneMutation.mutateAsync({
      currentStoryId: currentStory.id,
      sceneId,
    });
  };

  const currentStory =
    (stories?.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )[0] as CurrentStory | undefined) ?? undefined;

  useEffect(() => {
    if (currentStory?.scenes?.length) {
      setSelectedSceneId((prev) => prev ?? currentStory.scenes[0].id);
    }
  }, [currentStory]);

  const selectedScene =
    currentStory?.scenes.find((scene) => scene.id === selectedSceneId) ??
    currentStory?.scenes?.[0] ??
    null;

  return (
    <div className="flex h-screen min-h-screen flex-col overflow-hidden bg-[var(--color-primary-dark)] font-sans text-[var(--color-primary-light)] transition-colors duration-700 selection:bg-[var(--color-accent-orange)]/30">
      {/* CORE VIEWPORT */}
      <div className="relative flex flex-1 overflow-hidden">
        <main className="custom-scrollbar relative flex-1 overflow-y-auto bg-[var(--color-primary-dark)]">
          <div className="relative z-10 mx-auto max-w-6xl px-4 py-8 lg:px-8">
            {!currentStory ? (
              <div className="flex min-h-[60vh] items-center justify-center">
                <ScriptEmptyState
                  onGenerate={handleGenerateTheme}
                  isGenerating={isGenerating}
                  label="Initialize Celestial Narrative"
                />
              </div>
            ) : (
              <div className="space-y-6">
                {/* HORIZONTAL COMPACT BENTO SELECTION BAR */}
                <div className="flex flex-col justify-between gap-4 overflow-hidden rounded-2xl border border-[var(--color-ring-bronze)]/15 bg-white p-4 shadow-sm md:flex-row md:items-center">
                  <div className="flex shrink-0 items-center justify-between gap-4">
                    <div>
                      <h2 className="text-sm font-bold tracking-wider text-[var(--color-primary-dark)] uppercase">
                        Planetary Orbitals
                      </h2>
                      <p className="text-xs text-[var(--color-ring-bronze)]/70">
                        Select active celestial anchor
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleRecalculateScenes}
                      disabled={isRecalculatingScenes}
                      className="rounded-xl bg-[var(--color-primary-dark)] p-2 text-white transition-colors hover:bg-[var(--color-accent-orange)] disabled:opacity-30 md:hidden"
                    >
                      <RotateCcw
                        size={14}
                        className={isRecalculatingScenes ? "animate-spin" : ""}
                      />
                    </button>
                  </div>

                  {/* Horizontal Scroll Wrapper - Forced Row layout with smooth webkit masking */}
                  <div className="relative w-full min-w-0 flex-1 [mask-image:linear-gradient(to_right,white_85%,transparent_100%)]">
                    <div className="flex snap-x snap-mandatory scrollbar-none items-center gap-2 overflow-x-auto pt-0.5 pb-2">
                      {currentStory.scenes.map((scene) => (
                        <div key={scene.id} className="snap-as-needed shrink-0">
                          <PlanetSceneButton
                            scene={scene}
                            selected={scene.id === selectedSceneId}
                            onSelect={() => setSelectedSceneId(scene.id)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRecalculateScenes}
                    disabled={isRecalculatingScenes}
                    className="hidden shrink-0 rounded-xl bg-[var(--color-primary-dark)] p-2 text-white transition-colors hover:bg-[var(--color-accent-orange)] disabled:opacity-30 md:block"
                    title="Recalculate All Scenes"
                  >
                    <RotateCcw
                      size={14}
                      className={isRecalculatingScenes ? "animate-spin" : ""}
                    />
                  </button>
                </div>

                {/* ACTIVE SCENE DETAIL DISPLAY */}
                <div className="overflow-hidden rounded-2xl border border-[var(--color-ring-bronze)]/10 bg-white shadow-sm">
                  <PlanetSceneDetail
                    scene={selectedScene}
                    onRecalculate={handleRecalculateSingleScene}
                    isRecalculating={isRecalculatingScenes}
                  />
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
