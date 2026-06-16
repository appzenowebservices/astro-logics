"use client";
import React from "react";

interface PlanetData {
  id: string;
  planet: string;
  longitude: number;
  latitude?: number | null;
  speed: number;
  acceleration?: number | null;
  direction: string;
  houseCusp: number;
  houseDegree: number;
  houseSign: string;
}

interface NativityPlanetaryTableProps {
  planets: PlanetData[];
}

const PLANET_SYMBOLS: Record<string, string> = {
  SUN: "☉",
  MOON: "☽",
  MERCURY: "☿",
  VENUS: "♀",
  MARS: "♂",
  JUPITER: "♃",
  SATURN: "♄",
  URANUS: "♅",
  NEPTUNE: "♆",
  PLUTO: "♇",
  MEAN_NODE: "☊",
};

const ZODIAC_SIGNS = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
];

const getZodiacSign = (longitude: number) => {
  const normalized = ((longitude % 360) + 360) % 360;
  const signIndex = Math.floor(normalized / 30);
  return ZODIAC_SIGNS[signIndex] || "Unknown";
};

const getDegreesInSign = (longitude: number) => {
  const normalized = ((longitude % 360) + 360) % 360;
  return (normalized % 30).toFixed(2);
};

const HOUSE_NAMES: Record<number, string> = {
  1: "1st House (Ascendant)",
  2: "2nd House",
  3: "3rd House",
  4: "4th House (IC)",
  5: "5th House",
  6: "6th House",
  7: "7th House (Descendant)",
  8: "8th House",
  9: "9th House",
  10: "10th House (Midheaven)",
  11: "11th House",
  12: "12th House",
};

const isAngularHouse = (house: number) => [1, 4, 7, 10].includes(house);

export default function NativityPlanetaryTable({
  planets,
}: NativityPlanetaryTableProps) {
  const sortedPlanets = [...planets].sort((a, b) => {
    const planetOrder = [
      "SUN",
      "MOON",
      "MERCURY",
      "VENUS",
      "MARS",
      "JUPITER",
      "SATURN",
      "URANUS",
      "NEPTUNE",
      "PLUTO",
      "MEAN_NODE",
    ];
    return planetOrder.indexOf(a.planet) - planetOrder.indexOf(b.planet);
  });

  return (
    <div className="h-full w-full overflow-y-auto">
      <table className="w-full border-collapse">
        <thead className="sticky top-0 border-b border-[#2D241E] bg-[#14110F]">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-bold text-stone-400">
              Planet
            </th>
            <th className="px-4 py-2 text-right text-xs font-bold text-stone-400">
              Longitude
            </th>
            <th className="px-4 py-2 text-left text-xs font-bold text-stone-400">
              Sign
            </th>
            <th className="px-4 py-2 text-right text-xs font-bold text-stone-400">
              Speed
            </th>
            <th className="px-4 py-2 text-center text-xs font-bold text-stone-400">
              Direction
            </th>
            <th className="px-4 py-2 text-left text-xs font-bold text-stone-400">
              House Position
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedPlanets.map((planet) => (
            <tr
              key={planet.id}
              className="border-b border-[#2D241E] transition-colors hover:bg-[#1A1714]"
            >
              <td className="px-4 py-3 text-sm font-semibold">
                <span className="text-lg text-[#E29626]">
                  {PLANET_SYMBOLS[planet.planet] || planet.planet[0]}
                </span>
                <span className="ml-2 text-white">{planet.planet}</span>
              </td>
              <td className="px-4 py-3 text-right font-mono text-sm text-white">
                {planet.longitude.toFixed(2)}°
              </td>
              <td className="px-4 py-3 text-sm text-stone-300">
                {getZodiacSign(planet.longitude)}{" "}
                {getDegreesInSign(planet.longitude)}°
              </td>
              <td className="px-4 py-3 text-right font-mono text-sm text-stone-300">
                {planet.speed > 0 ? "+" : ""}
                {planet.speed.toFixed(2)}°/day
              </td>
              <td className="px-4 py-3 text-center text-sm">
                {planet.direction === "RETROGRADE" ? (
                  <span className="font-bold text-red-500">℞</span>
                ) : (
                  <span className="font-bold text-green-500">D</span>
                )}
              </td>
              <td
                className={`px-4 py-3 text-sm font-semibold transition-colors ${
                  isAngularHouse(planet.houseCusp)
                    ? "border-l-2 border-[#E29626] bg-[#2D241E] text-[#E29626]"
                    : "text-white"
                }`}
              >
                <div className="text-base font-bold">
                  {HOUSE_NAMES[planet.houseCusp] || `House ${planet.houseCusp}`}
                </div>
                <div className="mt-1 text-xs text-stone-400">
                  {planet.houseCusp}° {planet.houseSign}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
