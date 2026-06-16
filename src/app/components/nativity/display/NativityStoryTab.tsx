"use client";
import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Loader,
  Copy,
  Volume2,
  Download,
  Zap,
  TrendingUp,
} from "lucide-react";
import { api } from "~/trpc/react";
import {
  buildComicPrompt,
  buildMultiCharacterPanel,
  buildComedySketchPrompt,
  generateComedyVariationElements,
  type PromptInput,
} from "~/lib/promptCompiler";

interface StoryTabProps {
  nativityChartId: string;
}

interface PlanetaryScene {
  id: string;
  planet: string;
  natalLongitude: number;
  currentLongitude: number;
  movementDegrees: number;
  theme: string;
  plotTwist: string;
  intensity: number;
  activeAspects: string[];
}

interface RashoffScene {
  id: string;
  planetPOV: string;
  narrative: string;
  actionSequence: string;
  lightingDesc: string;
  atmosphereDesc: string;
  colorPalette: string[];
  relationships: string[];
}

interface CurrentStory {
  id: string;
  transitDate: string | Date;
  mainNarrative: string;
  overallIntensity: number;
  themes: string[];
  scenes: PlanetaryScene[];
  theatreScenes: RashoffScene[];
}

export default function NativityStoryTab({ nativityChartId }: StoryTabProps) {
  const [currentStory, setCurrentStory] = useState<CurrentStory | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedPlanet, setSelectedPlanet] = useState<string | null>(null);
  const [selectedTheatreId, setSelectedTheatreId] = useState<string | null>(
    null,
  );
  const [comedySketchPrompt, setComedySketchPrompt] = useState<string>("");
  const [comedyVariations, setComedyVariations] = useState<ReturnType<
    typeof generateComedyVariationElements
  > | null>(null);

  const { data: stories, isLoading } = api.nativity.getCurrentStories.useQuery(
    { nativityChartId },
    { enabled: !!nativityChartId },
  );

  useEffect(() => {
    if (stories && stories.length > 0) {
      const story = stories[0] as any;
      setCurrentStory(story as CurrentStory);
      setSelectedPlanet(story.scenes?.[0]?.planet ?? null);
      setSelectedTheatreId(story.theatreScenes?.[0]?.id ?? null);
    }
  }, [stories]);

  useEffect(() => {
    // Generate comedy sketch prompt when scene changes
    if (currentStory && selectedPlanet) {
      const selectedScene =
        currentStory.scenes.find(
          (s: PlanetaryScene) => s.planet === selectedPlanet,
        ) || currentStory.scenes[0];
      const selectedTheatreScene =
        currentStory.theatreScenes?.find(
          (scene) => scene.id === selectedTheatreId,
        ) || currentStory.theatreScenes?.[0];
      const promptInput = createPromptInput(
        selectedScene,
        selectedTheatreScene,
      );

      const variations = generateComedyVariationElements();
      const comedyPrompt = buildComedySketchPrompt(promptInput, variations);

      setComedyVariations(variations);
      setComedySketchPrompt(comedyPrompt);
    }
  }, [selectedPlanet, selectedTheatreId, currentStory]);

  const handleNarrate = () => {
    const textToSpeak = currentStory?.mainNarrative || "";
    if (!textToSpeak || !window.speechSynthesis) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = 0.95;
      utterance.pitch = 1;
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const handleCopyStory = () => {
    const textToCopy = currentStory?.mainNarrative || "";
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadStory = () => {
    const element = document.createElement("a");
    const text = currentStory?.mainNarrative || "";
    const file = new Blob([text], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = "astrological-story.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const formatPosition = (longitude: number) => {
    const zodiacSigns = [
      "♈",
      "♉",
      "♊",
      "♋",
      "♌",
      "♍",
      "♎",
      "♏",
      "♐",
      "♑",
      "♒",
      "♓",
    ];
    const sign = Math.floor(longitude / 30);
    const degree = longitude % 30;
    return `${zodiacSigns[sign]} ${degree.toFixed(1)}°`;
  };

  const parseAspects = (
    aspectStrings: string[],
  ): Array<{ aspectType: string; orb: number }> => {
    try {
      return aspectStrings.map((str) => JSON.parse(str));
    } catch {
      return [];
    }
  };

  const createPromptInput = (
    scene: PlanetaryScene,
    theatre?: RashoffScene,
  ): PromptInput => {
    const aspectText = parseAspects(scene.activeAspects)
      .map((aspect) => aspect.aspectType)
      .join(", ");

    return {
      planet: scene.planet.toUpperCase() as PromptInput["planet"],
      phase: scene.theme || "transitional moment",
      aspect: aspectText || "dynamic alignment",
      colorPalette: theatre?.colorPalette ?? [
        "muted amber",
        "charcoal",
        "soft gold",
      ],
      dominantMood: scene.theme || "charged atmosphere",
      plotTwist: scene.plotTwist || "an unexpected turn shifts the scene",
      setting:
        theatre?.atmosphereDesc ||
        theatre?.lightingDesc ||
        "an atmospheric cosmic stage",
    };
  };

  const getIntensityColor = (intensity: number) => {
    if (intensity >= 80) return "from-red-600 to-orange-500";
    if (intensity >= 60) return "from-orange-500 to-yellow-500";
    if (intensity >= 40) return "from-yellow-500 to-emerald-500";
    return "from-emerald-500 to-blue-500";
  };

  if (isLoading || !stories) {
    return (
      <div className="flex h-full items-center justify-center bg-[#0F0D0C] p-6">
        <div className="text-center">
          <Loader
            size={32}
            className="mx-auto mb-4 animate-spin text-[#E29626]"
          />
          <p className="text-sm text-stone-400">Loading transit data...</p>
        </div>
      </div>
    );
  }

  if (!currentStory?.scenes || currentStory.scenes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-[#0F0D0C] p-6">
        <div className="text-center">
          <MessageSquare size={32} className="mx-auto mb-4 text-stone-600" />
          <p className="text-sm text-stone-400">
            No transit data available. Generate a current story to see planetary
            scenes.
          </p>
        </div>
      </div>
    );
  }

  const selectedScene =
    currentStory.scenes.find(
      (s: PlanetaryScene) => s.planet === selectedPlanet,
    ) || currentStory.scenes[0];
  const selectedTheatreScene =
    currentStory.theatreScenes?.find(
      (scene) => scene.id === selectedTheatreId,
    ) || currentStory.theatreScenes?.[0];
  const selectedPromptInput = createPromptInput(
    selectedScene,
    selectedTheatreScene,
  );
  const companionScene =
    currentStory.scenes.find((scene) => scene.id !== selectedScene.id) ||
    selectedScene;
  const companionPromptInput = createPromptInput(
    companionScene,
    selectedTheatreScene,
  );
  const promptPreview = buildComicPrompt(selectedPromptInput);
  const panelPromptPreview = buildMultiCharacterPanel(
    selectedPromptInput,
    companionPromptInput,
  );

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-[#0F0D0C] p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="mb-2 flex items-center gap-2 text-lg font-bold text-[#E29626]">
            <MessageSquare size={20} />
            Astrological Transit Story
          </h3>
          <p className="text-xs text-stone-400">
            Generated for{" "}
            {currentStory.transitDate
              ? new Date(currentStory.transitDate).toLocaleDateString()
              : "today"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[#1A1714] px-2 py-1 text-[10px] tracking-[0.25em] text-stone-500 uppercase">
            Intensity {Math.round(currentStory.overallIntensity)}%
          </span>
          {currentStory.themes?.slice(0, 4).map((theme) => (
            <span
              key={theme}
              className="rounded-full bg-[#2D241E] px-2 py-1 text-[10px] text-stone-300"
            >
              {theme}
            </span>
          ))}
        </div>
      </div>

      <div className="mb-6 rounded border border-[#2D241E] bg-[#1A1714] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h4 className="mb-2 text-sm font-semibold text-[#eaddbd]">
              Main Narrative
            </h4>
            <div className="max-h-48 overflow-y-auto text-xs leading-relaxed whitespace-pre-wrap text-stone-200">
              {currentStory.mainNarrative}
            </div>
          </div>
          <div className="flex gap-2 sm:w-1/3">
            <button
              onClick={handleNarrate}
              className={`flex flex-1 items-center justify-center gap-2 rounded px-3 py-2 text-xs font-bold transition-colors ${
                isSpeaking
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-[#2D241E] text-[#E29626] hover:bg-[#3D3220]"
              }`}
            >
              <Volume2 size={14} />
              {isSpeaking ? "Stop" : "Narrate"}
            </button>
            <button
              onClick={handleCopyStory}
              className="flex flex-1 items-center justify-center gap-2 rounded bg-[#2D241E] px-3 py-2 text-xs font-bold text-[#E29626] transition-colors hover:bg-[#3D3220]"
            >
              <Copy size={14} />
              {copied ? "Copied!" : "Copy"}
            </button>
            <button
              onClick={handleDownloadStory}
              className="flex flex-1 items-center justify-center gap-2 rounded bg-[#2D241E] px-3 py-2 text-xs font-bold text-[#E29626] transition-colors hover:bg-[#3D3220]"
            >
              <Download size={14} />
              Download
            </button>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h4 className="mb-3 text-sm font-semibold text-[#E29626]">
          Planetary Scenes
        </h4>
        <div className="mb-4 flex gap-2 overflow-x-auto pb-3">
          {currentStory.scenes.map((scene) => (
            <button
              key={scene.id}
              onClick={() => setSelectedPlanet(scene.planet)}
              className={`rounded px-3 py-2 text-xs font-bold whitespace-nowrap transition-all ${
                selectedPlanet === scene.planet
                  ? "bg-[#E29626] text-[#0F0D0C]"
                  : "bg-[#2D241E] text-[#E29626] hover:bg-[#3D3220]"
              }`}
            >
              <div className="flex items-center gap-1">
                <Zap size={12} />
                {scene.planet}
              </div>
              <div className="text-[10px] opacity-75">
                {Math.round(scene.intensity)}%
              </div>
            </button>
          ))}
        </div>

        <div className="rounded border border-[#2D241E] bg-[#1A1714] p-4">
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded bg-[#0F0D0C] p-3">
              <p className="mb-1 text-[11px] text-stone-400">Natal</p>
              <p className="text-sm font-semibold text-stone-100">
                {formatPosition(selectedScene.natalLongitude)}
              </p>
            </div>
            <div className="rounded bg-[#0F0D0C] p-3">
              <p className="mb-1 text-[11px] text-stone-400">Transit</p>
              <p className="text-sm font-semibold text-stone-100">
                {formatPosition(selectedScene.currentLongitude)}
              </p>
            </div>
          </div>

          <div className="mb-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <TrendingUp
                size={14}
                className={
                  selectedScene.movementDegrees > 0
                    ? "text-emerald-500"
                    : "text-red-500"
                }
              />
              <span
                className={`text-xs font-semibold ${selectedScene.movementDegrees > 0 ? "text-emerald-500" : "text-red-500"}`}
              >
                {selectedScene.movementDegrees > 0 ? "+" : ""}
                {selectedScene.movementDegrees.toFixed(2)}°
              </span>
            </div>
            <p className="text-xs text-stone-400">
              Intensity: {Math.round(selectedScene.intensity)}%
            </p>
          </div>

          <div className="mb-4">
            <div className="h-2 overflow-hidden rounded-full bg-[#0F0D0C]">
              <div
                className={`h-full bg-gradient-to-r ${getIntensityColor(selectedScene.intensity)}`}
                style={{ width: `${selectedScene.intensity}%` }}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="mb-1 text-[11px] tracking-[0.2em] text-stone-400 uppercase">
                Theme
              </p>
              <p className="text-sm text-stone-200 italic">
                {selectedScene.theme}
              </p>
            </div>
            <div>
              <p className="mb-1 text-[11px] tracking-[0.2em] text-stone-400 uppercase">
                Plot Twist
              </p>
              <p className="text-sm text-stone-200 italic">
                {selectedScene.plotTwist}
              </p>
            </div>
            {selectedScene.activeAspects?.length > 0 && (
              <div>
                <p className="mb-2 text-[11px] tracking-[0.2em] text-stone-400 uppercase">
                  Active Aspects
                </p>
                <div className="grid gap-2">
                  {parseAspects(selectedScene.activeAspects).map(
                    (aspect, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded bg-[#0F0D0C] p-2 text-[11px] text-stone-300"
                      >
                        <span className="capitalize">{aspect.aspectType}</span>
                        <span className="text-stone-500">
                          {aspect.orb.toFixed(1)}°
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {currentStory.theatreScenes?.length > 0 && (
        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between gap-4">
            <h4 className="text-sm font-semibold text-[#E29626]">
              Rashoff Theatre
            </h4>
            <div className="flex gap-2 overflow-x-auto">
              {currentStory.theatreScenes.map((scene) => (
                <button
                  key={scene.id}
                  onClick={() => setSelectedTheatreId(scene.id)}
                  className={`rounded px-3 py-2 text-[11px] font-semibold whitespace-nowrap ${
                    selectedTheatreId === scene.id
                      ? "bg-[#E29626] text-[#0F0D0C]"
                      : "bg-[#2D241E] text-[#E29626] hover:bg-[#3D3220]"
                  }`}
                >
                  {scene.planetPOV}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded border border-[#2D241E] bg-[#1A1714] p-4">
            <div className="mb-4 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="mb-1 text-[11px] tracking-[0.2em] text-stone-400 uppercase">
                  Atmosphere
                </p>
                <p className="text-sm leading-relaxed text-stone-200">
                  {selectedTheatreScene?.atmosphereDesc ||
                    "A charged environment is unfolding."}
                </p>
              </div>
              <div>
                <p className="mb-1 text-[11px] tracking-[0.2em] text-stone-400 uppercase">
                  Lighting
                </p>
                <p className="text-sm leading-relaxed text-stone-200">
                  {selectedTheatreScene?.lightingDesc ||
                    "Light shifts in and out of focus."}
                </p>
              </div>
            </div>

            <div className="mb-4">
              <p className="mb-2 text-[11px] tracking-[0.2em] text-stone-400 uppercase">
                Action Sequence
              </p>
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-stone-200">
                {selectedTheatreScene?.actionSequence}
              </p>
            </div>

            <div className="mb-4">
              <p className="mb-2 text-[11px] tracking-[0.2em] text-stone-400 uppercase">
                Narrative
              </p>
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-stone-200">
                {selectedTheatreScene?.narrative}
              </p>
            </div>

            {selectedTheatreScene?.relationships?.length > 0 && (
              <div className="mb-4">
                <p className="mb-2 text-[11px] tracking-[0.2em] text-stone-400 uppercase">
                  Relationships
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedTheatreScene.relationships.map((rel, idx) => (
                    <span
                      key={idx}
                      className="rounded-full bg-[#0F0D0C] px-2 py-1 text-[11px] text-stone-300"
                    >
                      {rel}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedTheatreScene?.colorPalette?.length > 0 && (
              <div>
                <p className="mb-2 text-[11px] tracking-[0.2em] text-stone-400 uppercase">
                  Color Palette
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedTheatreScene.colorPalette.map((color, idx) => (
                    <span
                      key={idx}
                      className="rounded-full bg-[#0F0D0C] px-2 py-1 text-[11px] text-stone-300"
                    >
                      {color}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mb-6 rounded border border-[#2D241E] bg-[#1A1714] p-4">
        <h4 className="mb-3 text-sm font-semibold text-[#E29626]">
          Prompt Preview
        </h4>
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-[11px] tracking-[0.2em] text-stone-400 uppercase">
              Comic Prompt
            </p>
            <pre className="overflow-x-auto rounded bg-[#0F0D0C] p-3 text-xs leading-relaxed whitespace-pre-wrap text-stone-200">
              {promptPreview}
            </pre>
          </div>
          <div>
            <p className="mb-2 text-[11px] tracking-[0.2em] text-stone-400 uppercase">
              Multi-character Panel Prompt
            </p>
            <pre className="overflow-x-auto rounded bg-[#0F0D0C] p-3 text-xs leading-relaxed whitespace-pre-wrap text-stone-200">
              {panelPromptPreview}
            </pre>
          </div>
        </div>
      </div>

      <div className="mb-6 rounded border border-[#2D241E] bg-[#1A1714] p-4">
        <h4 className="mb-3 text-sm font-semibold text-[#E29626]">
          Comedy Sketch Script Generator
        </h4>
        <div className="space-y-4">
          {comedyVariations && (
            <div className="mb-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded bg-[#0F0D0C] p-3">
                <p className="mb-1 text-[11px] tracking-[0.2em] text-stone-400 uppercase">
                  Authority
                </p>
                <p className="text-sm font-semibold text-[#E29626]">
                  {comedyVariations.authority}
                </p>
              </div>
              <div className="rounded bg-[#0F0D0C] p-3">
                <p className="mb-1 text-[11px] tracking-[0.2em] text-stone-400 uppercase">
                  Instigator
                </p>
                <p className="text-sm font-semibold text-stone-100">
                  {comedyVariations.instigator}
                </p>
              </div>
              <div className="rounded bg-[#0F0D0C] p-3">
                <p className="mb-1 text-[11px] tracking-[0.2em] text-stone-400 uppercase">
                  Setting
                </p>
                <p className="text-sm font-semibold text-stone-100">
                  {comedyVariations.setting}
                </p>
              </div>
              <div className="rounded bg-[#0F0D0C] p-3">
                <p className="mb-1 text-[11px] tracking-[0.2em] text-stone-400 uppercase">
                  Central Obsession
                </p>
                <p className="text-sm font-semibold text-stone-100">
                  {comedyVariations.obsession}
                </p>
              </div>
              <div className="rounded bg-[#0F0D0C] p-3">
                <p className="mb-1 text-[11px] tracking-[0.2em] text-stone-400 uppercase">
                  Escalator
                </p>
                <p className="text-sm font-semibold text-stone-100">
                  {comedyVariations.escalator}
                </p>
              </div>
              <div className="rounded bg-[#0F0D0C] p-3">
                <p className="mb-1 text-[11px] tracking-[0.2em] text-stone-400 uppercase">
                  Wildcard
                </p>
                <p className="text-sm font-semibold text-stone-100">
                  {comedyVariations.wildcard}
                </p>
              </div>
            </div>
          )}
          <div>
            <p className="mb-2 text-[11px] tracking-[0.2em] text-stone-400 uppercase">
              Comedy Sketch System Prompt
            </p>
            <pre className="max-h-80 overflow-x-auto rounded bg-[#0F0D0C] p-3 text-xs leading-relaxed whitespace-pre-wrap text-stone-200">
              {comedySketchPrompt}
            </pre>
          </div>
        </div>
      </div>

      {currentStory.scenes.length > 1 && (
        <div>
          <h4 className="mb-3 text-sm font-semibold text-[#E29626]">
            Scene Preview
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {currentStory.scenes.map((scene) => (
              <button
                key={scene.id}
                onClick={() => setSelectedPlanet(scene.planet)}
                className="rounded border border-[#2D241E] bg-[#1A1714] p-3 text-left transition-colors hover:border-[#E29626]"
              >
                <p className="mb-2 text-xs font-semibold text-[#E29626]">
                  {scene.planet}
                </p>
                <p className="mb-2 line-clamp-2 text-xs leading-tight text-stone-300">
                  {scene.theme}
                </p>
                <div className="h-1 w-full overflow-hidden rounded-full bg-[#0F0D0C]">
                  <div
                    className={`h-full bg-gradient-to-r ${getIntensityColor(scene.intensity)}`}
                    style={{ width: `${scene.intensity}%` }}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
