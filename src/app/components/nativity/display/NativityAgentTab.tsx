"use client";

import React, { useState, useRef, useEffect } from "react";
import { api } from "~/trpc/react";
import {
  Send,
  Loader2,
  Bot,
  User,
  Trash2,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  XCircle,
  Zap,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  plan?: {
    goal: string;
    steps: Array<{
      id: string;
      description: string;
      tool?: string;
      completed: boolean;
      inputs?: Record<string, unknown>;
    }>;
  };
  executionResults?: Array<{
    stepId: string;
    tool?: string | null;
    output: any;
  }>;
}

interface NativityAgentTabProps {
  nativityChartId: string;
}

export default function NativityAgentTab({
  nativityChartId,
}: NativityAgentTabProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "system",
      content:
        "👋 Hello! I'm your personal astrology AI agent. I can help you understand your natal chart, interpret planetary positions, explore your TITANS personality system, and answer questions about your astrological profile. What would you like to know?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string>(
    `session-${nativityChartId}-${Date.now()}`,
  );
  const [lastRunId, setLastRunId] = useState<string | null>(null);
  const [showExecutionPlane, setShowExecutionPlane] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Execute agent mutation
  const executeAgent = api.agents.runAgent.useMutation({
    onSuccess: (data) => {
      // Track the run ID for execution plane
      if (data.runId) {
        setLastRunId(data.runId);
        setShowExecutionPlane(true);
      }

      // Add assistant response
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.answer || "Task completed.",
        timestamp: new Date(),
        plan: data.plan,
        executionResults: data.executionResults,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    },
    onError: (error) => {
      // Add error message
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "system",
        content: `❌ Error: ${error.message}. Make sure the agent-runtime server is running on port 3001.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    },
  });
  console.log("executeAgent___", executeAgent);
  // Fetch trace for execution plane
  const runTraceQuery = api.agents.getRunTrace.useQuery(
    { runId: lastRunId! },
    { enabled: !!lastRunId },
  );

  console.log("runTraceQuery", runTraceQuery);
  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || executeAgent.isPending) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // Execute agent
    await executeAgent.mutateAsync({
      message: input,
      nativityChartId,
      sessionId,
      context: {
        chartId: nativityChartId,
      },
    });
  };

  const handleClearSession = () => {
    const newSessionId = `session-${nativityChartId}-${Date.now()}`;
    setSessionId(newSessionId);
    setMessages([
      {
        id: "welcome-new",
        role: "system",
        content: "🔄 Session cleared. Starting fresh! How can I help you?",
        timestamp: new Date(),
      },
    ]);
  };

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt);
  };

  const quickPrompts = [
    "where are my planets?",
    "show me my planetary positions",
    "what's in my natal chart?",
    "analyze my planet placements",
  ];

  return (
    <div className="flex h-full flex-col bg-[#14110F]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#2D241E] bg-[#1A1614] p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-gradient-to-br from-[#E29626] to-[#C17817] p-2">
            <Bot className="h-5 w-5 text-[#0F0D0C]" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-stone-100">
              AI Agent Assistant
            </h2>
            <p className="text-xs text-stone-500">
              Powered by LangChain & TITANS
            </p>
          </div>
        </div>
        <button
          onClick={handleClearSession}
          className="flex items-center gap-2 rounded px-3 py-1.5 text-xs font-semibold text-stone-400 transition-all hover:bg-[#2D241E] hover:text-[#E29626]"
          title="Clear conversation"
        >
          <Trash2 className="h-4 w-4" />
          Clear
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
          >
            {/* Avatar */}
            <div
              className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                message.role === "user"
                  ? "bg-[#E29626]"
                  : message.role === "system"
                    ? "bg-[#2D241E]"
                    : "bg-gradient-to-br from-purple-600 to-blue-600"
              }`}
            >
              {message.role === "user" ? (
                <User className="h-4 w-4 text-[#0F0D0C]" />
              ) : message.role === "system" ? (
                <Sparkles className="h-4 w-4 text-stone-400" />
              ) : (
                <Bot className="h-4 w-4 text-white" />
              )}
            </div>

            {/* Message Content */}
            <div
              className={`max-w-[80%] flex-1 ${
                message.role === "user" ? "text-right" : ""
              }`}
            >
              <div
                className={`inline-block rounded-lg p-3 ${
                  message.role === "user"
                    ? "bg-[#E29626] text-[#0F0D0C]"
                    : message.role === "system"
                      ? "bg-[#2D241E] text-stone-400"
                      : "border border-[#2D241E] bg-[#1A1614] text-stone-200"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                {/* Execution Plan */}
                {message.plan && (
                  <div className="mt-3 border-t border-[#2D241E] pt-3">
                    <p className="mb-2 text-xs font-bold text-stone-400">
                      <Zap className="mr-1 inline h-3 w-3" />
                      Execution Plan: {message.plan.goal}
                    </p>
                    <div className="space-y-1">
                      {message.plan.steps.map((step) => (
                        <div
                          key={step.id}
                          className="flex items-start gap-2 text-xs text-stone-500"
                        >
                          {step.completed ? (
                            <CheckCircle2 className="mt-0.5 h-3 w-3 flex-shrink-0 text-green-500" />
                          ) : (
                            <div className="mt-0.5 h-3 w-3 flex-shrink-0 rounded-full border border-stone-600" />
                          )}
                          <span>{step.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Execution Results */}
                {message.executionResults &&
                  message.executionResults.length > 0 && (
                    <div className="mt-3 border-t border-[#2D241E] pt-3">
                      <p className="mb-2 text-xs font-bold text-stone-400">
                        Results:
                      </p>
                      <div className="space-y-2">
                        {message.executionResults.map((result, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-2 text-xs"
                          >
                            {result.success ? (
                              <CheckCircle2 className="mt-0.5 h-3 w-3 flex-shrink-0 text-green-500" />
                            ) : (
                              <XCircle className="mt-0.5 h-3 w-3 flex-shrink-0 text-red-500" />
                            )}
                            <span className="text-stone-500">
                              {result.success
                                ? typeof result.result === "string"
                                  ? result.result
                                  : "Success"
                                : result.error || "Failed"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>

              <p className="mt-1 px-1 text-xs text-stone-600">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {executeAgent.isPending && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-blue-600">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1">
              <div className="inline-block rounded-lg border border-[#2D241E] bg-[#1A1614] p-3">
                <div className="flex items-center gap-2 text-sm text-stone-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts */}
      {messages.length === 1 && (
        <div className="px-4 pb-3">
          <p className="mb-2 text-xs text-stone-500">Quick prompts:</p>
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickPrompt(prompt)}
                className="rounded-full border border-[#2D241E] bg-[#1A1614] px-3 py-1.5 text-xs font-medium text-stone-400 transition-all hover:bg-[#2D241E] hover:text-[#E29626]"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Execution Plane */}
      {showExecutionPlane && lastRunId && (
        <div className="max-h-64 overflow-y-auto border-t border-[#2D241E] bg-[#1A1614] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="flex items-center gap-2 text-xs font-bold text-stone-300">
              <Zap className="h-3 w-3" />
              Execution Plane
            </h4>
            <button
              onClick={() => setShowExecutionPlane(false)}
              className="text-xs text-stone-600 hover:text-stone-400"
            >
              ✕
            </button>
          </div>

          {runTraceQuery.isLoading ? (
            <p className="text-xs text-stone-500">Loading trace events...</p>
          ) : runTraceQuery.data && (runTraceQuery.data as any[]).length > 0 ? (
            <div className="space-y-2">
              {(runTraceQuery.data as any[]).map((event, idx) => (
                <div
                  key={idx}
                  className="rounded border border-[#2D241E] bg-[#0F0D0C] p-2 text-[10px]"
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-mono text-stone-400">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="font-semibold text-[#E29626]">
                      {event.type}
                    </span>
                  </div>
                  {event.nodeId && (
                    <div className="mb-1 text-stone-600">
                      Node: {event.nodeId}
                    </div>
                  )}
                  {event.payload && Object.keys(event.payload).length > 0 && (
                    <details className="mt-1">
                      <summary className="cursor-pointer text-stone-500 hover:text-stone-400">
                        Details
                      </summary>
                      <pre className="mt-1 max-h-32 overflow-x-auto rounded bg-[#14110F] p-1 text-[9px] text-stone-400">
                        {JSON.stringify(event.payload, null, 1)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-stone-600">No trace events yet</p>
          )}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-[#2D241E] bg-[#1A1614] p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything about your chart..."
            disabled={executeAgent.isPending}
            className="flex-1 rounded-lg border border-[#2D241E] bg-[#14110F] px-4 py-2.5 text-sm text-stone-200 placeholder-stone-600 transition-colors focus:border-[#E29626] focus:outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || executeAgent.isPending}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#E29626] to-[#C17817] px-4 py-2.5 font-semibold text-[#0F0D0C] transition-all hover:from-[#C17817] hover:to-[#E29626] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {executeAgent.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </form>
        <p className="mt-2 text-center text-xs text-stone-600">
          Powered by agent-runtime • Make sure server is running on port 3001
        </p>
      </div>
    </div>
  );
}
