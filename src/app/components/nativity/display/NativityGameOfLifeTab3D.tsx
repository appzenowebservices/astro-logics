"use client";
import React from "react";
import dynamic from "next/dynamic";

const CanvasScene = dynamic(() => import("./NativityGameOfLifeTab3DScene"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-1 items-center justify-center overflow-hidden rounded border border-[#2D241E] bg-[#0a0a0a]">
      <div className="text-[#E29626]">Loading 3D scene...</div>
    </div>
  ),
});

interface PlanetEntity {
  id: string;
  planet: string;
  position: [number, number, number];
  energy: number;
  mood: string;
  color: string;
  personality: string;
  lastMessage: string;
  isActive: boolean;
}

interface GameScene3DProps {
  planets: PlanetEntity[];
  selectedPlanet: PlanetEntity | null;
  onSelectPlanet: (planet: PlanetEntity) => void;
}

export default function GameScene3D({
  planets,
  selectedPlanet,
  onSelectPlanet,
}: GameScene3DProps) {
  return (
    <CanvasScene
      planets={planets}
      selectedPlanet={selectedPlanet}
      onSelectPlanet={onSelectPlanet}
    />
  );
}
