/**
 * Client-safe mirror of the 54 universal latent axes defined in
 * `src/server/services/astroOntology.ts`. Keep this list in sync when axes
 * are added or reordered; the array order is the canonical vector order.
 */
export const LATENT_AXES = [
  "valence",
  "arousal",
  "agency",
  "dominance",
  "coherence",
  "stability",
  "novelty",
  "volatility",
  "abstraction",
  "symbolic_density",
  "pattern_recognition",
  "analyticity",
  "intuition",
  "mental_speed",
  "focus",
  "diffusion",
  "past_orientation",
  "present_orientation",
  "future_orientation",
  "cyclicality",
  "urgency",
  "patience",
  "desire_intensity",
  "attachment",
  "avoidance",
  "expansion",
  "contraction",
  "ambition",
  "survival_drive",
  "sociality",
  "individuality",
  "collectivism",
  "relational_depth",
  "boundary_strength",
  "empathy",
  "dominance_social",
  "materiality",
  "spirituality",
  "sensory_density",
  "idealism",
  "pragmatism",
  "integration",
  "fragmentation",
  "entropy",
  "adaptability",
  "rigidity",
  "expressiveness",
  "repression",
  "reactivity",
  "responsiveness",
  "meaning_orientation",
  "identity_coherence",
  "transcendence",
  "ego_density",
] as const;

export const DERIVED_AXES = [
  "symbolicPressure",
  "tensionLevel",
  "integrationDifficulty",
  "manifestationStrength",
] as const;

export type LatentAxis = (typeof LATENT_AXES)[number];

export function vectorFromJson(value: unknown): Record<string, number> {
  if (Array.isArray(value)) {
    return value.reduce<Record<string, number>>((accumulator, item, index) => {
      const axis = LATENT_AXES[index];
      if (axis && typeof item === "number") accumulator[axis] = item;
      return accumulator;
    }, {});
  }

  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).reduce<
      Record<string, number>
    >((accumulator, [key, item]) => {
      if (typeof item === "number") accumulator[key] = item;
      return accumulator;
    }, {});
  }

  return {};
}

export function topAxes(
  vector: Record<string, number>,
  limit = 12,
): Array<{ axis: string; value: number }> {
  return Object.entries(vector)
    .filter(([, value]) => Number.isFinite(value))
    .map(([axis, value]) => ({ axis, value }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
    .slice(0, limit);
}
