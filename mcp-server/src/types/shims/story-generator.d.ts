export interface NativityContext {
  planets: Array<{
    planet: string;
    longitude: number;
    latitude?: number | null;
    speed: number;
    direction: string;
    houseCusp: number;
    houseSign: string;
  }>;
  aspects: Array<{
    planet1: string;
    planet2: string;
    aspectType: string;
    orbDistance: number;
    isApplying: boolean;
    exactnessScore: number;
  }>;
  planetaryProfiles: Array<{
    planet: string;
    primaryDomain: string;
    secondaryDomain?: string | null;
    strength: number;
    dignity: string;
  }>;
  transitingPlanets?: Array<{
    planet: string;
    longitude: number;
    aspects: Array<{ planet: string; aspectType: string; orb: number }>;
  }>;
}

interface StoryGeneratorOptions {
  baseUrl?: string;
  model?: string;
  apiKey?: string;
  useLocal?: boolean;
  timeoutMs?: number;
  maxContextTokens?: number;
  contextLimit?: number;
}

declare class StoryGenerator {
  constructor(options?: StoryGeneratorOptions);
  generateStory(context: NativityContext, userPrompt?: string): Promise<string>;
}

export { StoryGenerator };
export type { StoryGeneratorOptions };
