// app/ClientChatUI.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
  reasoning?: string;
}

export default function ClientChatUI() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "", reasoning: "" },
    ]);

    try {
      const response = await fetch("/api/viz/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map(({ role, content }) => ({
            role,
            content,
          })),
        }),
      });

      if (!response.body) return;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          const chunkStr = decoder.decode(value, { stream: true });
          const lines = chunkStr.split("\n");

          for (const line of lines) {
            if (line.startsWith("__REASONING__:")) {
              const text = line.replace("__REASONING__:", "");
              setMessages((prev) => {
                const copy = [...prev];
                const last = copy[copy.length - 1];
                if (last) {
                  last.reasoning = (last.reasoning ?? "") + text;
                }
                return copy;
              });
            } else if (line.startsWith("__CONTENT__:")) {
              const text = line.replace("__CONTENT__:", "");
              setMessages((prev) => {
                const copy = [...prev];
                const last = copy[copy.length - 1];
                if (last) {
                  last.content = (last.content ?? "") + text;
                }
                return copy;
              });
            }
          }
        }
      }
    } catch (error) {
      console.error("Local processing proxy failure:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-[#0d0e12] font-sans text-slate-100">
      <header className="flex items-center justify-between border-b border-white/[0.05] bg-[#13151a] px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 animate-pulse rounded-full bg-emerald-50 bg-emerald-400" />
          <h1 className="text-sm font-semibold tracking-wide text-slate-200">
            NVIDIA PROXY ENGINES{" "}
            <span className="ml-2 font-mono text-xs text-emerald-400">
              [CORS Resolved Mode]
            </span>
          </h1>
        </div>
      </header>

      <div className="flex-1 space-y-6 overflow-y-auto p-6">
        {messages.length === 0 ? (
          <div className="mx-auto flex h-full max-w-md flex-col items-center justify-center space-y-2 text-center opacity-40">
            <p className="font-mono text-xs tracking-widest text-emerald-400">
              PROXY CONNECTION VALIDATED
            </p>
            <p className="text-xs text-slate-400">
              Your browser requests are securely tunneled through Node.js local
              layers to bypass CORS restrictions.
            </p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`mx-auto flex max-w-3xl flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
            >
              {msg.role === "user" ? (
                <div className="max-w-[85%] rounded-2xl border border-emerald-500/20 bg-emerald-600/20 px-4 py-2.5 text-sm text-emerald-200 shadow-sm">
                  {msg.content}
                </div>
              ) : (
                <div className="w-full space-y-3">
                  {msg.reasoning && (
                    <div className="max-w-full space-y-2 overflow-x-auto rounded-xl border border-white/[0.03] bg-[#171921] p-4 font-mono text-xs text-slate-400">
                      <div className="flex items-center gap-2 text-[10px] font-bold tracking-wider text-amber-500/80 uppercase">
                        <div className="h-1.5 w-1.5 animate-ping rounded-full bg-amber-500" />
                        Nemotron Thinking Process:
                      </div>
                      <div className="border-l border-amber-500/20 pl-3 leading-relaxed whitespace-pre-wrap">
                        {msg.reasoning}
                      </div>
                    </div>
                  )}

                  {msg.content && (
                    <div className="rounded-2xl border border-white/[0.02] bg-[#13151a] px-5 py-3.5 text-sm leading-relaxed whitespace-pre-wrap text-slate-200 shadow-sm">
                      {msg.content}
                    </div>
                  )}

                  {isLoading &&
                    !msg.content &&
                    !msg.reasoning &&
                    index === messages.length - 1 && (
                      <div className="flex items-center gap-2 pl-2 font-mono text-xs text-slate-500">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500/30 border-t-emerald-400" />
                        Handshaking local server context...
                      </div>
                    )}
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <footer className="border-t border-white/[0.05] bg-[#13151a] p-4">
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex max-w-3xl items-center gap-3 rounded-xl border border-white/[0.08] bg-[#0d0e12] px-4 py-2 transition-colors focus-within:border-emerald-500/50"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isLoading ? "Streaming from proxy..." : "Send a message..."
            }
            disabled={isLoading}
            className="flex-1 border-none bg-transparent text-sm text-slate-200 placeholder-slate-500 focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold tracking-wide text-slate-100 uppercase transition-all hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600"
          >
            Run
          </button>
        </form>
      </footer>
    </div>
  );
}
