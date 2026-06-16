"use client";
import React, { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Heart,
  AlertCircle,
  Lightbulb,
  Zap,
} from "lucide-react";
import type {
  PlanetPersonality,
  PlanetRelationship,
} from "~/server/services/planetaryPersonality";

interface NativityPlanetsTabProps {
  planets: PlanetPersonality[];
}

export default function NativityPlanetsTab({
  planets,
}: NativityPlanetsTabProps) {
  const [expandedPlanet, setExpandedPlanet] = useState<string | null>(null);
  const [selectedRelationship, setSelectedRelationship] = useState<{
    planet: string;
    relationship: PlanetRelationship;
  } | null>(null);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#0F0D0C] p-6">
      {/* Header */}
      <div className="mb-6">
        <h3 className="mb-2 text-lg font-bold text-[#E29626]">
          Your Planetary Cast
        </h3>
        <p className="text-xs text-stone-400">
          Meet your inner characters - each planet represents an archetype
          within you
        </p>
      </div>

      {/* Planets List */}
      <div className="flex-1 space-y-3 overflow-y-auto">
        {planets.map((planet) => (
          <div key={planet.planet} className="space-y-2">
            {/* Planet Card Header */}
            <button
              onClick={() =>
                setExpandedPlanet(
                  expandedPlanet === planet.planet ? null : planet.planet,
                )
              }
              className="w-full rounded-lg border border-[#2D241E] bg-[#1A1714] p-4 text-left transition-colors hover:border-[#E29626]"
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="flex flex-1 items-center gap-3">
                  {/* Planet Icon/Color */}
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ backgroundColor: planet.colorCode }}
                  >
                    {planet.planet.substring(0, 2)}
                  </div>

                  <div className="flex-1">
                    <h4 className="font-bold text-stone-100">
                      {planet.planet}
                    </h4>
                    <p className="text-xs text-stone-400">{planet.archetype}</p>
                  </div>
                </div>

                {/* Strength Indicator */}
                <div className="mr-2 flex items-center gap-2">
                  <div className="h-2 w-24 overflow-hidden rounded-full bg-[#2D241E]">
                    <div
                      className="h-full bg-[#E29626] transition-all"
                      style={{ width: `${planet.strength * 100}%` }}
                    />
                  </div>
                  <span className="w-8 text-xs font-bold text-[#E29626]">
                    {Math.round(planet.strength * 100)}%
                  </span>
                </div>

                {/* Expand Icon */}
                {expandedPlanet === planet.planet ? (
                  <ChevronUp size={18} className="text-[#E29626]" />
                ) : (
                  <ChevronDown size={18} className="text-stone-500" />
                )}
              </div>

              {/* Quick Info Row */}
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span
                  className="rounded bg-[#2D241E] px-2 py-1 text-stone-300"
                  style={{
                    borderLeft: `3px solid ${planet.colorCode}`,
                  }}
                >
                  {planet.zodiacSign} in House {planet.house}
                </span>
                <span className="text-stone-400">
                  {planet.currentExpression}
                </span>
                {planet.isRetrograde && (
                  <span className="rounded bg-red-900/30 px-2 py-1 text-xs font-semibold text-red-300">
                    ℜ Retrograde
                  </span>
                )}
              </div>
            </button>

            {/* Expanded Details */}
            {expandedPlanet === planet.planet && (
              <div className="overflow-hidden rounded-lg border border-[#2D241E] bg-[#0D0B0A]">
                {/* Core Theme */}
                <div className="border-b border-[#2D241E] p-4">
                  <p className="mb-2 text-sm font-semibold text-[#E29626]">
                    {planet.primaryTheme}
                  </p>
                  <p className="text-xs leading-relaxed text-stone-300">
                    <span className="font-semibold">Function:</span>{" "}
                    {planet.psychologicalFunction}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-stone-300">
                    <span className="font-semibold">Life Domain:</span>{" "}
                    {planet.lifeDomain}
                  </p>
                </div>

                {/* Relationships Section */}
                {planet.relationships.length > 0 && (
                  <div className="border-b border-[#2D241E] p-4">
                    <h5 className="mb-3 flex items-center gap-2 text-xs font-bold text-[#E29626]">
                      <Heart size={14} />
                      Relationships in Your Chart
                    </h5>
                    <div className="space-y-2">
                      {planet.relationships.map((rel, idx) => (
                        <button
                          key={idx}
                          onClick={() =>
                            setSelectedRelationship({
                              planet: planet.planet,
                              relationship: rel,
                            })
                          }
                          className="w-full rounded bg-[#1A1714] p-2 text-left transition-colors hover:bg-[#2D241E]"
                        >
                          <div className="mb-1 flex items-center gap-2">
                            <span className="text-lg">{rel.icon}</span>
                            <span className="text-xs font-semibold text-stone-200">
                              {rel.planet}
                            </span>
                            <span
                              className={`rounded px-2 py-1 text-xs ${getRelationshipBadgeColor(rel.relationshipType)}`}
                            >
                              {rel.relationshipType}
                            </span>
                            <span className="text-xs text-stone-500">
                              {rel.aspectType}
                            </span>
                          </div>
                          <p className="ml-6 text-xs text-stone-400">
                            {rel.description}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Challenges & Potentials */}
                <div className="space-y-3 p-4">
                  {planet.challenges.length > 0 && (
                    <div>
                      <h5 className="mb-2 flex items-center gap-2 text-xs font-bold text-red-400">
                        <AlertCircle size={14} />
                        Growth Edges
                      </h5>
                      <ul className="space-y-1">
                        {planet.challenges.map((challenge, idx) => (
                          <li
                            key={idx}
                            className="flex gap-2 text-xs leading-relaxed text-stone-300"
                          >
                            <span className="mt-1 text-red-400">→</span>
                            <span>{challenge}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {planet.potentials.length > 0 && (
                    <div>
                      <h5 className="mb-2 flex items-center gap-2 text-xs font-bold text-green-400">
                        <Lightbulb size={14} />
                        Your Gifts
                      </h5>
                      <ul className="space-y-1">
                        {planet.potentials.map((potential, idx) => (
                          <li
                            key={idx}
                            className="flex gap-2 text-xs leading-relaxed text-stone-300"
                          >
                            <span className="mt-1 text-green-400">✓</span>
                            <span>{potential}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Therapeutic Guidance */}
                <div className="border-t border-[#2D241E] bg-[#1A1714] p-4">
                  <h5 className="mb-2 flex items-center gap-2 text-xs font-bold text-[#E29626]">
                    <Zap size={14} />
                    Your Path Forward
                  </h5>
                  <p className="text-xs leading-relaxed text-stone-300 italic">
                    "{planet.therapeuticGuidance}"
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Relationship Detail Modal */}
      {selectedRelationship && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedRelationship(null)}
        >
          <div
            className="w-full max-w-sm rounded-lg border border-[#2D241E] bg-[#1A1714] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 text-lg font-bold text-[#E29626]">
              {selectedRelationship.planet} ♥{" "}
              {selectedRelationship.relationship.planet}
            </h3>
            <div className="space-y-3">
              <div>
                <p className="mb-1 text-xs font-semibold text-stone-400">
                  Relationship Type
                </p>
                <p
                  className={`text-sm font-bold ${getRelationshipColor(selectedRelationship.relationship.relationshipType)}`}
                >
                  {selectedRelationship.relationship.relationshipType
                    .charAt(0)
                    .toUpperCase() +
                    selectedRelationship.relationship.relationshipType.slice(1)}
                </p>
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold text-stone-400">
                  Aspect
                </p>
                <p className="text-sm text-stone-300">
                  {selectedRelationship.relationship.aspectType} (
                  {selectedRelationship.relationship.orb.toFixed(1)}°)
                </p>
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold text-stone-400">
                  Meaning
                </p>
                <p className="text-sm text-stone-300">
                  {selectedRelationship.relationship.description}
                </p>
              </div>
              <div className="border-t border-[#2D241E] pt-2">
                <p className="mb-2 text-xs font-semibold text-stone-400">
                  Therapeutic Perspective
                </p>
                <p className="text-sm text-stone-200 italic">
                  "{selectedRelationship.relationship.therapeuticMeaning}"
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedRelationship(null)}
              className="mt-6 w-full rounded bg-[#E29626] px-4 py-2 font-bold text-[#0F0D0C] transition-colors hover:bg-[#D9851F]"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function getRelationshipBadgeColor(type: string): string {
  const colors: Record<string, string> = {
    ally: "bg-green-900/30 text-green-300",
    neutral: "bg-blue-900/30 text-blue-300",
    challenger: "bg-orange-900/30 text-orange-300",
    teacher: "bg-purple-900/30 text-purple-300",
  };
  return colors[type] || "bg-stone-900/30 text-stone-300";
}

function getRelationshipColor(type: string): string {
  const colors: Record<string, string> = {
    ally: "text-green-400",
    neutral: "text-blue-400",
    challenger: "text-orange-400",
    teacher: "text-purple-400",
  };
  return colors[type] || "text-stone-400";
}
