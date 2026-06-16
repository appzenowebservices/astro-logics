"use client";
import React, { useState, useRef, useEffect } from "react";
import { api } from "~/trpc/react";
import type { PlanetContext } from "./PlanetPersonalityBuilder";

interface Message {
  role: "user" | "planet";
  content: string;
  timestamp: Date;
}

interface PlanetPersonalityChatProps {
  planet: string;
  context: PlanetContext;
  isActive: boolean;
}

export default function PlanetPersonalityChat({
  planet,
  context,
  isActive,
}: PlanetPersonalityChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatMutation = api.nativity.chatWithPlanet.useMutation();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initial greeting from planet
  useEffect(() => {
    if (isActive && !initialized && messages.length === 0) {
      initializePlanetConversation();
    }
  }, [isActive, initialized]);

  const initializePlanetConversation = () => {
    setInitialized(true);
    setIsLoading(true);

    chatMutation.mutate(
      {
        chartContext: JSON.stringify(context),
        userMessage: "greet",
      },
      {
        onSuccess: (response) => {
          setMessages([
            {
              role: "planet",
              content: response.message,
              timestamp: new Date(),
            },
          ]);
          setIsLoading(false);
        },
        onError: () => {
          setIsLoading(false);
        },
      },
    );
  };

  const handleSend = () => {
    if (!input.trim() || isLoading) return;

    // Add user message
    const userMsg: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    // Get planet response
    chatMutation.mutate(
      {
        chartContext: JSON.stringify(context),
        userMessage: input,
        conversationHistory: messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      },
      {
        onSuccess: (response) => {
          setMessages((prev) => [
            ...prev,
            {
              role: "planet",
              content: response.message,
              timestamp: new Date(),
            },
          ]);
          setIsLoading(false);
        },
        onError: () => {
          setIsLoading(false);
        },
      },
    );
  };

  return (
    <div className="flex h-full flex-col rounded border border-[#2D241E] bg-gradient-to-b from-[#1A1815] to-[#0F0D0C]">
      {/* Header */}
      <div className="border-b border-[#3D3530] bg-gradient-to-r from-[#2D241E] to-[#1A1815] p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-bold tracking-widest text-[#E29626] uppercase">
              {context.planet}
            </h3>
            <p className="mt-1 text-xs text-stone-400">
              {context.zodiacSign} in {context.houseCusp}° House
              {context.isRetrograde && " • ℞"}
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs text-stone-500">
              {Math.abs(context.speed).toFixed(2)}°/day
            </div>
          </div>
        </div>
      </div>

      {/* Quick Context Tags */}
      {context.aspectsWithOthers.length > 0 && (
        <div className="border-b border-[#2D241E] px-4 pt-3 pb-2">
          <p className="mb-2 text-xs text-stone-500">Aspects:</p>
          <div className="flex flex-wrap gap-2">
            {context.aspectsWithOthers.slice(0, 4).map((aspect) => (
              <span
                key={aspect.planet}
                className="rounded border border-[#3D3530] bg-[#2D241E] px-2 py-1 text-xs text-[#E29626]"
                title={`${aspect?.aspectType} (orb: ${aspect?.orb?.toFixed(2)}°)`}
              >
                {aspect.aspectType[0]} {aspect.planet}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Messages Container */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && !isLoading && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-stone-500">
                Begin your dialogue with {context.planet}...
              </p>
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-xs rounded-lg px-4 py-2 lg:max-w-md xl:max-w-lg ${
                msg.role === "user"
                  ? "bg-[#E29626] text-black"
                  : "border border-[#3D3530] bg-[#2D241E] text-stone-200"
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {msg.content}
              </p>
              <p className="mt-1 text-xs opacity-60">
                {msg.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="rounded-lg border border-[#3D3530] bg-[#2D241E] px-4 py-2 text-stone-400">
              <p className="text-sm">
                <span className="inline-block animate-pulse">
                  Listening to the stars
                </span>
                <span className="ml-1 inline-block animate-bounce">.</span>
              </p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-[#2D241E] bg-[#0F0D0C] p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder={`Ask ${context.planet}...`}
            className="flex-1 rounded border border-[#3D3530] bg-[#2D241E] px-3 py-2 text-sm text-stone-200 placeholder-stone-600 transition-colors focus:border-[#E29626] focus:outline-none"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="rounded bg-[#E29626] px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-[#D17F1F] disabled:cursor-not-allowed disabled:bg-stone-700"
          >
            {isLoading ? "..." : "Send"}
          </button>
        </div>
        <p className="mt-2 text-xs text-stone-600">Shift+Enter for new line</p>
      </div>
    </div>
  );
}
