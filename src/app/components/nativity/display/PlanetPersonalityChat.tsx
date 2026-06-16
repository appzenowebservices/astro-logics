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

  // Reset or initialize conversation when active planet context changes
  useEffect(() => {
    if (isActive) {
      setMessages([]);
      setInitialized(false);
      setInput("");
    }
  }, [planet]);

  // Initial greeting from planet
  useEffect(() => {
    if (isActive && !initialized && messages.length === 0) {
      initializePlanetConversation();
    }
  }, [isActive, initialized, planet]);

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

    const userMsg: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    const currentInput = input;
    setInput("");
    setIsLoading(true);

    chatMutation.mutate(
      {
        chartContext: JSON.stringify(context),
        userMessage: currentInput,
        conversationHistory: [...messages, userMsg].map((m) => ({
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
          // Restore input text if request fails so user doesn't lose it
          setInput(currentInput);
        },
      },
    );
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-(--color-primary-light)/10 bg-black/10">
      {/* Header telemetry area */}
      <div className="flex-shrink-0 border-b border-(--color-primary-light)/10 bg-gradient-to-r from-black/40 to-transparent p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xs font-black tracking-widest text-(--color-accent-orange) uppercase">
              {context.planet}
            </h3>
            <p className="mt-1 text-xs font-medium text-(--color-primary-light) opacity-90">
              {context.zodiacSign}{" "}
              <span className="text-(--color-ring-bronze)/80">in</span>{" "}
              {context.houseCusp}° House
              {context.isRetrograde && (
                <span
                  className="ml-1 text-(--color-accent-orange)"
                  title="Retrograde"
                >
                  ℞
                </span>
              )}
            </p>
          </div>
          <div className="text-right">
            <div className="rounded border border-(--color-primary-light)/5 bg-black/30 px-2 py-0.5 font-mono text-[10px] tracking-wider text-(--color-accent-glow)">
              {Math.abs(context.speed).toFixed(2)}°/d
            </div>
          </div>
        </div>
      </div>

      {/* Quick Context Aspects */}
      {context.aspectsWithOthers && context.aspectsWithOthers.length > 0 && (
        <div className="flex-shrink-0 border-b border-(--color-primary-light)/10 bg-black/10 px-4 py-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[10px] font-bold tracking-wider text-(--color-primary-light)/40 uppercase">
              Aspects:
            </span>
            {context.aspectsWithOthers.slice(0, 4).map((aspect, idx) => (
              <span
                key={`${aspect.planet}-${idx}`}
                className="rounded border border-(--color-primary-light)/10 bg-black/30 px-2 py-0.5 text-[10px] font-semibold text-(--color-primary-light)/90 transition-colors hover:border-(--color-accent-glow)/30"
                title={`${aspect?.aspectType} (orb: ${aspect?.orb?.toFixed(2)}°)`}
              >
                {aspect.aspectType[0]} {aspect.planet}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Messages Container */}
      <div className="custom-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && !isLoading && (
          <div className="flex h-full items-center justify-center p-4 text-center">
            <p className="max-w-[200px] text-xs leading-relaxed text-(--color-primary-light)/40">
              Establishing celestial channel. Begin your dialogue with{" "}
              {context.planet}...
            </p>
          </div>
        )}

        {messages.map((msg, idx) => {
          const isUser = msg.role === "user";
          return (
            <div
              key={idx}
              className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap shadow-md ${
                  isUser
                    ? "rounded-tr-sm bg-(--color-accent-orange) font-medium text-(--bg-main)"
                    : "rounded-tl-sm border border-(--color-primary-light)/10 bg-black/40 text-(--color-primary-light)"
                }`}
              >
                <p>{msg.content}</p>
                <span
                  className={`mt-1 block text-right font-mono text-[9px] opacity-50 ${isUser ? "text-(--bg-main)" : "text-(--color-accent-glow)"}`}
                >
                  {msg.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-tl-sm border border-(--color-primary-light)/5 bg-black/20 px-4 py-2.5 text-(--color-accent-glow) shadow-sm">
              <div className="flex items-center gap-1.5 text-xs font-medium tracking-wide">
                <span className="inline-block animate-pulse">
                  Reading alignments
                </span>
                <span className="ml-0.5 flex gap-0.5">
                  <span className="animate-bounce font-bold delay-0">.</span>
                  <span className="animate-bounce font-bold delay-150">.</span>
                  <span className="animate-bounce font-bold delay-300">.</span>
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Action Panel */}
      <div className="flex-shrink-0 border-t border-(--color-primary-light)/10 bg-black/20 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder={`Address the energy of ${context.planet}...`}
            className="flex-1 rounded-xl border border-(--color-primary-light)/10 bg-black/40 px-4 py-2.5 text-xs text-(--color-primary-light) placeholder-(--color-primary-light)/30 transition-all focus:border-(--color-accent-glow) focus:ring-1 focus:ring-(--color-accent-glow)/30 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="rounded-xl bg-(--color-accent-orange) px-4 text-xs font-bold tracking-wider text-(--bg-main) uppercase shadow-md transition-all hover:brightness-110 active:scale-98 disabled:cursor-not-allowed disabled:bg-white/5 disabled:text-(--color-primary-light)/20"
          >
            {isLoading ? "..." : "Send"}
          </button>
        </div>
        <div className="mt-2 flex justify-between px-1 text-[10px] font-medium text-(--color-primary-light)/30">
          <span>Shift + Enter for break</span>
          <span>✦ Connected</span>
        </div>
      </div>
    </div>
  );
}
