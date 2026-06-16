import assert from "assert";
import {
  buildComicPrompt,
  buildMultiCharacterPanel,
  type PromptInput,
} from "./promptCompiler";

const sampleInput: PromptInput = {
  planet: "MARS",
  phase: "a sudden escalation in momentum",
  aspect: "square to Saturn with pressured tension",
  colorPalette: ["brick red", "smoke grey", "muted gold"],
  dominantMood: "tense determination",
  plotTwist: "an unexpected ally appears in the midst of conflict",
  setting: "a stormy astral theatre",
};

const expectedComicPrompt = `Style: Cinematic astrology graphic novel. Use dramatic, crisp illustration with textured shadows, saturated contrast, and a grounded palette. Keep the text minimal, direct, and literal. No speculative metaphor outside the supplied state.
Subject: MARS, Martian drive and conflict. Scene role: assertion and motivation.
Setting: a stormy astral theatre.
Phase: a sudden escalation in momentum.
Mood: tense determination.
Aspect: square to Saturn with pressured tension.
Plot twist: an unexpected ally appears in the midst of conflict.
Palette: brick red, smoke grey, muted gold.
Visual direction: cinematic framing, strong contrast, expressive gesture, and clear atmospheric lighting. Maintain literal fidelity to the listed planet, phase, aspect, mood, and twist.`;

assert.strictEqual(buildComicPrompt(sampleInput), expectedComicPrompt);

const companionInput: PromptInput = {
  planet: "VENUS",
  phase: "a subtle shift toward harmony",
  aspect: "sextile to Mercury with gentle flow",
  colorPalette: ["soft rose", "ivory", "warm bronze"],
  dominantMood: "calm coherence",
  plotTwist: "a quiet compromise reshapes the exchange",
  setting: "an intimate lunar corridor",
};

const expectedPanelPrompt = `Style: Cinematic astrology graphic novel. Use dramatic, crisp illustration with textured shadows, saturated contrast, and a grounded palette. Keep the text minimal, direct, and literal. No speculative metaphor outside the supplied state.
Panel type: two-character panel with direct contrast.
Primary subject: MARS, Martian drive and conflict. Secondary subject: VENUS, Venusian harmony and value.
Primary setting: a stormy astral theatre. Secondary setting: an intimate lunar corridor.
Primary phase: a sudden escalation in momentum. Secondary phase: a subtle shift toward harmony.
Primary mood: tense determination. Secondary mood: calm coherence.
Primary aspect: square to Saturn with pressured tension. Secondary aspect: sextile to Mercury with gentle flow.
Primary twist: an unexpected ally appears in the midst of conflict. Secondary twist: a quiet compromise reshapes the exchange.
Shared palette: brick red, smoke grey, muted gold, soft rose, ivory, warm bronze.
Visual direction: split composition, bold silhouettes, controlled light, and emotionally grounded expressions. Keep the description literal and tied to each character input.`;

assert.strictEqual(
  buildMultiCharacterPanel(sampleInput, companionInput),
  expectedPanelPrompt,
);

console.log("promptCompiler snapshot tests passed");
