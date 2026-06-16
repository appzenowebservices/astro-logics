import { useState, useCallback } from "react";
import { parsePersonality, type PlanetPersonality } from "./personalityParser";

export interface PlanetEntityState {
  planet: string;
  personality: PlanetPersonality;
  avatar: string;
  summonedAt: Date;
  isActive: boolean;
}

export function usePlanetEntities() {
  const [entities, setEntities] = useState<Record<string, PlanetEntityState>>(
    {},
  );

  const addEntity = useCallback((planet: string, avatar: string) => {
    const personality = parsePersonality(avatar, planet);

    setEntities((prev) => ({
      ...prev,
      [planet]: {
        planet,
        personality,
        avatar,
        summonedAt: new Date(),
        isActive: true,
      },
    }));
  }, []);

  const activateEntity = useCallback((planet: string) => {
    setEntities((prev) => ({
      ...prev,
      [planet]: {
        ...prev[planet],
        isActive: true,
      },
    }));
  }, []);

  const deactivateEntity = useCallback((planet: string) => {
    setEntities((prev) => ({
      ...prev,
      [planet]: {
        ...prev[planet],
        isActive: false,
      },
    }));
  }, []);

  const getEntity = useCallback(
    (planet: string) => entities[planet],
    [entities],
  );

  const getAllEntities = useCallback(() => Object.values(entities), [entities]);

  return {
    entities,
    addEntity,
    activateEntity,
    deactivateEntity,
    getEntity,
    getAllEntities,
  };
}
