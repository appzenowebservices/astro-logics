/**
 * Planet Entity System Type Definitions
 * Central location for all types used in the planet entity system
 */

/**
 * Personality trait extracted from LLM response
 */
export type PersonalityTrait = string;

/**
 * Mood states derived from text analysis
 */
export type PlanetMood =
  | "radiant"
  | "contemplative"
  | "passionate"
  | "gentle"
  | "chaotic"
  | "analytical"
  | "enigmatic";

/**
 * Core personality data
 */
export interface PlanetPersonality {
  mood: PlanetMood;
  traits: PersonalityTrait[];
  color: string; // Hex color code
  energy: number; // 0-1 scale
}

/**
 * Complete planet entity state
 */
export interface PlanetEntity {
  planet: string;
  personality: PlanetPersonality;
  avatar: string; // Raw LLM response
  summonedAt?: Date;
  isActive?: boolean;
}

/**
 * Props for PlanetCharacter3D component
 */
export interface PlanetCharacter3DProps {
  planet: string;
  personality: PlanetPersonality;
  isActive: boolean;
}

/**
 * Props for PlanetEntityDisplay component
 */
export interface PlanetEntityDisplayProps {
  planet: string;
  personality: PlanetPersonality;
  avatar: string;
}

/**
 * Props for PlanetEntitySystemGuide component
 */
export interface PlanetEntitySystemGuideProps {
  isOpen?: boolean;
  onClose?: () => void;
}

/**
 * The response from the LLM avatar generation
 */
export interface AvatarResponse {
  avatar: string; // The generated personality narrative
}

/**
 * Configuration for personality parsing
 */
export interface PersonalityParsingConfig {
  maxTraits: number;
  minWordLength: number;
  energyLengthWeight: number;
  energyExclamationWeight: number;
  energyQuestionWeight: number;
}

/**
 * Configuration for 3D animations
 */
export interface AnimationConfig {
  idleFloatSpeed: number;
  idleFloatHeight: number;
  hoverScaleAmount: number;
  hoverScaleLerp: number;
  autoRotateSpeed: number;
  rotationIntensity: number;
}

/**
 * Configuration for visuals
 */
export interface VisualsConfig {
  primaryRingScale: (energy: number) => number;
  primaryRingOpacity: number;
  secondaryRingScale: (energy: number) => number;
  secondaryRingOpacity: number;
  metalness: number;
  roughness: number;
  ambientIntensity: number;
  directionalIntensity: number;
  pointLightDistance: number;
}

/**
 * Configuration for camera
 */
export interface CameraConfig {
  fov: number;
  defaultPosition: [number, number, number];
  autoRotate: boolean;
  enableZoom: boolean;
  enablePan: boolean;
}

/**
 * Complete system configuration
 */
export interface EntityConfig {
  ANIMATION: AnimationConfig;
  VISUALS: VisualsConfig;
  CAMERA: CameraConfig;
  TEXT: Record<string, string>;
  ENERGY_THRESHOLDS: {
    low: number;
    medium: number;
    high: number;
  };
  PARSING: PersonalityParsingConfig;
  MOOD_ICONS: Record<PlanetMood, string>;
  MOOD_GRADIENTS: Record<PlanetMood, string>;
  CANVAS: {
    height: string;
    heightLoading: string;
    heightInactive: string;
  };
}

/**
 * Hook return type for usePlanetEntities
 */
export interface UsePlanetEntitiesReturn {
  entities: Record<string, PlanetEntity>;
  addEntity: (planet: string, avatar: string) => void;
  activateEntity: (planet: string) => void;
  deactivateEntity: (planet: string) => void;
  getEntity: (planet: string) => PlanetEntity | undefined;
  getAllEntities: () => PlanetEntity[];
}

/**
 * API request type for getting planet data
 */
export interface GetNativityPlanetsRequest {
  nativityChartId: string;
}

/**
 * API response type for getting planet data
 */
export interface GetNativityPlanetsResponse {
  planets: Array<{
    planet: string;
    [key: string]: any;
  }>;
}

/**
 * API request type for generating avatar
 */
export interface GeneratePlanetAvatarRequest {
  nativityChartId: string;
  planet: string;
}

/**
 * API response type for generating avatar
 */
export interface GeneratePlanetAvatarResponse {
  avatar: string;
}
