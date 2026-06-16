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
    aspects: Array<{
      planet: string;
      aspectType: string;
      orb: number;
    }>;
  }>;
}

interface StoryGeneratorOptions {
  baseUrl?: string;
  model?: string;
  apiKey?: string;
  useLocal?: boolean;
  timeoutMs?: number; // Timeout in milliseconds, defaults to dynamic calculation
  maxContextTokens?: number; // For timeout calculation, defaults to 1M
  contextLimit?: number; // Model context window for token budgeting
}

export class StoryGenerator {
  private baseUrl: string;
  private model: string;
  private apiKey: string;
  private useLocal: boolean;
  private timeoutMs: number;
  private maxContextTokens: number;
  private contextLimit: number;

  constructor(options: StoryGeneratorOptions = {}) {
    this.baseUrl = options.baseUrl || "http://localhost:8000";
    this.model = options.model || "llama-3.2-1b";
    this.apiKey =
      options.apiKey ||
      process.env.LLAMA_CPP_API_KEY ||
      process.env.LOCAL_LLM_API_KEY ||
      "dummy";
    // INFERENCE SPEED NOTES:
    // Current: Qwen2.5-14B (medium speed - good quality/speed tradeoff)
    // Faster:  Qwen2.5-7B (2x faster than 14B)
    // Fastest: Qwen2.5-3B (3x faster than 14B, still good quality)
    // Note: NOT a "thinking" model - regular instruct model
    // Optimizations: max_tokens=600, temperature=0.6, top_p=0.9 for faster generation
    // Default: min 60s, but scale based on context size
    this.maxContextTokens = options.maxContextTokens || 1_000_000;
    this.timeoutMs = options.timeoutMs || this.calculateDynamicTimeout();
    this.useLocal =
      options.useLocal === true || process.env.USE_LOCAL_LLM === "true";
    this.contextLimit =
      options.contextLimit ||
      Number(process.env.LLM_CONTEXT_WINDOW) ||
      (this.useLocal ? 8192 : 65536);
  }

  /**
   * Calculate dynamic timeout based on context size.
   * Larger context windows need more processing time for thinking.
   * Qwen and similar large models need 5-10 minutes for complex tasks.
   */
  private calculateDynamicTimeout(): number {
    const baseTimeoutMs = 60_000; // 60 seconds minimum

    // For very large context models (500K+), increase timeout significantly
    if (this.maxContextTokens >= 500_000) {
      // 5-10 minutes for massive context windows
      return Math.max(
        300_000,
        this.maxContextTokens > 1_000_000 ? 600_000 : 300_000,
      );
    }

    if (this.maxContextTokens >= 100_000) {
      // 3-5 minutes for large context
      return 180_000;
    }

    // Standard models: 60-90 seconds
    return baseTimeoutMs;
  }

  private buildCompactNatalProfile(context: NativityContext): string {
    // Create a compact summary of natal data (token-efficient)
    const topPlanets = context.planetaryProfiles
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 5)
      .map((p) => `${p.planet}(${p.primaryDomain}):${p.strength.toFixed(1)}`)
      .join(", ");

    const keyPlanets = context.planets
      .slice(0, 7)
      .map((p) => `${p.planet}-${p.houseSign}`)
      .join(", ");

    return `NATAL: [${topPlanets}] | POSITIONS: [${keyPlanets}]`;
  }

  private buildCompactTransitInfo(context: NativityContext): string {
    // Create a compact summary of current transits
    if (!context.transitingPlanets || context.transitingPlanets.length === 0) {
      return "TRANSITS: None";
    }

    const topTransits = context.transitingPlanets
      .slice(0, 3)
      .map((p) => `${p.planet}(${p.aspects.length} aspects)`)
      .join(", ");

    const strongAspects = context.aspects
      .filter((a) => a.exactnessScore > 0.8)
      .slice(0, 3)
      .map((a) => `${a.planet1}-${a.planet2}(${a.aspectType})`)
      .join(", ");

    return `TRANSITS: [${topTransits}] | KEY_ASPECTS: [${strongAspects}]`;
  }

  private buildDirectorPrompt(
    context: NativityContext,
    useCompact: boolean = false,
  ): string {
    if (useCompact) {
      // Compact version for chunking scenarios (70% smaller)
      return `[SCRIPT ARCHITECT - COMPACT MODE]
${this.buildCompactNatalProfile(context)}
${this.buildCompactTransitInfo(context)}
[TASK] Generate 3-4 punchy, cynical life-script scenes based on current transits.
[STYLE] High-velocity, corporate-cynical, agentic. Roast the user's specific personality glitches.
[FORMAT]
SCENE| [Trigger: Which transit hits which natal point]
CHARACTER| [Planet acting as antagonist]
DIALOGUE| [Max 8 words - stinging observation]
BEAT| [Cynical action or workaround]
[OUTPUT] Generate scenes now.`;
    }

    // Full version (original)
    const planetsDesc = context.planets
      .map(
        (p) =>
          `${p.planet} in ${p.houseSign} (H${p.houseCusp}): Speed ${p.speed.toFixed(2)}`,
      )
      .join(", ");

    const dominantPlanet =
      context.planetaryProfiles.length > 0
        ? context.planetaryProfiles.reduce((prev, current) =>
            prev.strength > current.strength ? prev : current,
          )
        : { planet: "Unknown", primaryDomain: "General" };

    return `[SYSTEM: HIGH-VELOCITY SCRIPT ARCHITECT]
[SETTING: THE ASTROLOGICS VIRTUAL COMMAND CENTER]
[ROLE:  - The cynical, hyper-intelligent Script Supervisor for the User's life.]

[USER_DATA_CORE: NATAL DNA]
${JSON.stringify(context.planets)}
${JSON.stringify(context.planetaryProfiles)}
// Context: This is the user's hard-coded personality, limitations, and potential.

[MUNDANE_CONTEXT: LIVE TRANSITS & FRICTION]
${JSON.stringify(context.transitingPlanets)}
${JSON.stringify(context.aspects)}
// Context: This is the external pressure currently hitting the User's Natal DNA.

[TASK]
Generate a multi-scene "Life-Script" for the Astrologics Paid Portal. 
Translate the mathematical friction between the Natal DNA and Live Transits into a series of short, punchy comic-panel-ready skits.

[DIRECTOR'S RULES]
1. STYLE: High-velocity, corporate-cynical, and "Agentic." 
2. CHARACTER LENS: Treat planets as "System Processes." (e.g., If Natal Mars is squared by Transiting Saturn, call it a "Hardware Conflict" or "Throttled Execution").
3. NO FLUFF: No "healing," "light," or "growth." Use the user's data to ROAST their specific personality glitches.
4. PERSONALIZATION: Use the user's Natal Profile to make the dialogue hyper-specific. (e.g., If they have a Moon in Capricorn, mock their "emotional ROI").

[STRICT PARSABLE OUTPUT FORMAT]
TITLE| [Cynical Title for this Cosmic Patch]
SETTING| [A specific 'Department' in the User's life: e.g., 'The Ego-Buffer Suite']
AGENTIC_STATE| [Based on Overall Intensity: SYSTEM_CRITICAL, LOW_BATTERY, IDLE, or OVERCLOCKING]

[START_SCENE]
SCENE_TRIGGER| [Which Transit is hitting which Natal point? e.g., Transit-Saturn Conjunct Natal-Sun]
CHARACTER| [The Planet acting as the 'Antagonist' for this scene]
DIALOGUE| [Max 10 words. Stinging observation about the user's current behavior vs their data.]
BEAT| [Cynical Action: e.g., "Deleting your 5-year plan," "Sipping cold coffee while the screen glitches"]
DIALOGUE| [A follow-up 'Workaround' that is technically accurate but emotionally cold.]
[END_SCENE]

(Generate 6-8 distinct scenes based on the top transit intensities)

[FINAL_SYSTEM_REPORT]
LOG_ACTION| [e.g., "Redirected all creative energy to your tax returns"]
REASON| [Technical justification based on the specific Aspect triggering right now]

[EXECUTE SCRIPT NOW]`;
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  async generateStory(
    context: NativityContext,
    userPrompt?: string,
  ): Promise<string> {
    const userMessage =
      userPrompt || " is dealing with cosmic chaos. Write the script.";
    const systemPrompt = this.buildDirectorPrompt(context, false);
    const promptTokens =
      this.estimateTokens(systemPrompt) + this.estimateTokens(userMessage);

    if (this.contextLimit && promptTokens > this.contextLimit) {
      console.log(
        "[STORY_GENERATOR_DEBUG] Full prompt exceeds configured context limit. Using compact prompt first.",
      );
      console.log(
        `[STORY_GENERATOR_DEBUG] Prompt estimate: ${promptTokens} tokens; context limit: ${this.contextLimit}`,
      );
      const compactPrompt = this.buildDirectorPrompt(context, true);
      try {
        return await this.generateWithLocalLLM(compactPrompt, userMessage);
      } catch (error) {
        console.log(
          "[STORY_GENERATOR_DEBUG] Compact prompt also failed, falling back to chunked generation",
        );
        return await this.generateWithChunking(context, userMessage);
      }
    }

    try {
      // First attempt: Try with full prompt
      console.log("[STORY_GENERATOR_DEBUG] Attempt 1: Full prompt mode");
      return await this.generateWithLocalLLM(systemPrompt, userMessage);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("Context size has been exceeded")
      ) {
        console.log(
          "[STORY_GENERATOR_DEBUG] Attempt 2: Falling back to compact prompt mode",
        );
        try {
          const compactPrompt = this.buildDirectorPrompt(context, true);
          return await this.generateWithLocalLLM(compactPrompt, userMessage);
        } catch (compactError) {
          console.log(
            "[STORY_GENERATOR_DEBUG] Attempt 3: Falling back to multi-phase chunked generation",
          );
          return await this.generateWithChunking(context, userMessage);
        }
      }
      throw error;
    }
  }

  private async generateWithChunking(
    context: NativityContext,
    userMessage: string,
  ): Promise<string> {
    console.log("[STORY_GENERATOR_DEBUG] === CHUNKED GENERATION STRATEGY ===");
    console.log(
      "[STORY_GENERATOR_DEBUG] Processing nativity chart in 3 phases...\n",
    );

    const phases = [
      {
        name: "PHASE 1: Natal Personality Profile",
        prompt: this.buildPhaseOnePrompt(context),
      },
      {
        name: "PHASE 2: Current Transit Impacts",
        prompt: this.buildPhaseTwoPrompt(context),
        context: `Considering the personality profile from Phase 1`,
      },
      {
        name: "PHASE 3: Integrated Life Script",
        prompt: this.buildPhaseThreePrompt(context),
        context: `Synthesizing profiles from Phase 1 and 2`,
      },
    ];

    const results: string[] = [];

    for (const phase of phases) {
      console.log(`[STORY_GENERATOR_DEBUG] ${phase.name}`);
      try {
        const fullPrompt = phase.context
          ? `${phase.context}\n\n${phase.prompt}`
          : phase.prompt;
        const result = await this.generateWithLocalLLM(fullPrompt, userMessage);
        results.push(result);
        console.log(`[STORY_GENERATOR_DEBUG] ✓ ${phase.name} completed\n`);
      } catch (error) {
        console.error(`[STORY_GENERATOR_DEBUG] ✗ ${phase.name} failed:`, error);
        results.push(`[${phase.name} - FAILED]`);
      }
    }

    // Combine results
    const combinedScript = `${results[0]}\n\n---\n\n${results[1]}\n\n---\n\n${results[2]}`;
    console.log("[STORY_GENERATOR_DEBUG] ✓ Chunked generation completed");
    return combinedScript;
  }

  private buildPhaseOnePrompt(context: NativityContext): string {
    const profile = this.buildCompactNatalProfile(context);
    return `[PHASE 1: PERSONALITY PROFILE - FAST MODE]
${profile}
Generate 1-2 short punchy sentences about core drive & shadow.
Max 150 chars total. Be cynical.`;
  }

  private buildPhaseTwoPrompt(context: NativityContext): string {
    const transits = this.buildCompactTransitInfo(context);
    return `[PHASE 2: CURRENT PRESSURES - FAST MODE]
${transits}
1-2 sentence description of current situations.
Cynical, corporate tone. Max 150 chars.`;
  }

  private buildPhaseThreePrompt(context: NativityContext): string {
    const profile = this.buildCompactNatalProfile(context);
    const transits = this.buildCompactTransitInfo(context);
    return `[PHASE 3: LIFE SCRIPT SCENES - FAST MODE]
${profile} + ${transits}
Generate 3-4 SHORT scenes only (format: SCENE|CHARACTER|DIALOGUE|).
Each line max 40 chars. Max 200 chars total.`;
  }

  private async generateWithLocalLLM(
    systemPrompt: string,
    userMessage: string,
  ): Promise<string> {
    let timeout: NodeJS.Timeout | null = null;
    let adaptiveTimeout = this.timeoutMs; // Declare outside try block so it's accessible in catch

    try {
      // Log context length analysis upfront
      const systemTokens = Math.ceil(systemPrompt.length / 4);
      const userTokens = Math.ceil(userMessage.length / 4);
      const totalInputTokens = systemTokens + userTokens;
      const estimatedMaxOutput = 1500;
      // const totalEstimatedTokens = totalInputTokens + estimatedMaxOutput;

      // Use optimized max_tokens for faster inference
      const optimizedMaxTokens = 600;
      const totalEstimatedTokens = totalInputTokens + optimizedMaxTokens;

      console.log("[STORY_GENERATOR_DEBUG] Context Length Analysis:");
      console.log(
        `  System Prompt: ${systemPrompt.length} chars (~${systemTokens} tokens)`,
      );
      console.log(
        `  User Message: ${userMessage.length} chars (~${userTokens} tokens)`,
      );
      console.log(
        `  Total Input: ${systemPrompt.length + userMessage.length} chars (~${totalInputTokens} tokens)`,
      );
      console.log(
        `  Est. Max Output: ${optimizedMaxTokens} tokens (optimized for speed)`,
      );
      console.log(`  Total Est. Tokens: ${totalEstimatedTokens} tokens`);
      console.log(`  Using: LOCAL LLM`);
      console.log(`  Model: ${this.model}`);

      const controller = new AbortController();
      // Calculate adaptive timeout based on estimated token count
      adaptiveTimeout = this.timeoutMs;
      if (totalEstimatedTokens > 100_000) {
        // Add extra time for very large contexts: +1ms per 100 tokens over 100k
        const extraTokens = totalEstimatedTokens - 100_000;
        adaptiveTimeout += Math.ceil((extraTokens / 100) * 1000);
      }
      console.log(
        `[STORY_GENERATOR_DEBUG] Timeout set to ${adaptiveTimeout}ms (${Math.round(adaptiveTimeout / 1000)}s)`,
      );
      timeout = setTimeout(() => controller.abort(), adaptiveTimeout);

      const endpointBase = this.baseUrl.replace(/\/$/, "");
      const requestUrl = endpointBase.endsWith("/v1")
        ? `${endpointBase}/chat/completions`
        : `${endpointBase}/v1/chat/completions`;

      console.log(
        `[STORY_GENERATOR_DEBUG] Sending request to local LLM at ${requestUrl}`,
      );

      // Optimize for faster inference on large models like Qwen2.5-14B
      // Reduced tokens: 1500 → 600 (faster generation, sufficient quality)
      // Reduced temperature: 0.8 → 0.6 (less variance = faster)
      // Added top_p: 0.9 (nucleus sampling for speed)
      const requestBody = {
        model: this.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: 0.6,
        top_p: 0.9,
        max_tokens: 600,
        stream: false,
      };

      console.log(
        `[STORY_GENERATOR_DEBUG] Request size: ${JSON.stringify(requestBody).length} bytes`,
      );

      const response = await fetch(requestUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        let errorBody = "";
        try {
          errorBody = await response.text();
        } catch {
          errorBody = "Could not read response body";
        }

        console.error("[STORY_GENERATOR_ERROR] Local LLM Error Details:");
        console.error(`  Status: ${response.status} ${response.statusText}`);
        console.error(`  Response Body: ${errorBody}`);

        let isContextError = false;
        try {
          const errorJson = JSON.parse(errorBody);
          const message = String(errorJson.error?.message || "").toLowerCase();
          const type = String(errorJson.error?.type || "").toLowerCase();
          if (
            message.includes("context") ||
            message.includes("available context size") ||
            type.includes("exceed_context_size") ||
            type.includes("context_size")
          ) {
            isContextError = true;
            console.error("  ERROR TYPE: CONTEXT LENGTH OVERFLOW");
            console.error(
              "  ACTION REQUIRED: Reduce prompt size or increase model context window",
            );
            console.error(
              `  System Prompt Size: ${systemPrompt.length} chars (~${Math.ceil(systemPrompt.length / 4)} tokens)`,
            );
            console.error(
              `  User Message Size: ${userMessage.length} chars (~${Math.ceil(userMessage.length / 4)} tokens)`,
            );
            console.error(
              `  Combined: ${systemPrompt.length + userMessage.length} chars (~${Math.ceil((systemPrompt.length + userMessage.length) / 4)} tokens)`,
            );
          }
        } catch {}

        const errorMsg = isContextError
          ? `Context size has been exceeded. System: ${Math.ceil(systemPrompt.length / 4)} tokens, User: ${Math.ceil(userMessage.length / 4)} tokens`
          : `Local LLM Server Error ${response.status}: ${response.statusText}\nBody: ${errorBody}\nURL: ${requestUrl}`;

        throw new Error(errorMsg);
      }

      const data = await response.json();

      if (!data.choices?.[0]?.message) {
        throw new Error(
          `Invalid response format from local LLM. Expected choices[0].message.content, got: ${JSON.stringify(data)}`,
        );
      }

      const generatedContent = data.choices[0].message.content;
      console.log(
        `[STORY_GENERATOR_DEBUG] ✓ Local LLM generation successful (${generatedContent.length} chars)`,
      );

      return generatedContent;
    } catch (error) {
      if (timeout) clearTimeout(timeout);

      if (error instanceof TypeError && error.message.includes("fetch")) {
        console.error(
          "[STORY_GENERATOR_ERROR] Connection failed - llama-server not running",
        );
        throw new Error(
          `Failed to connect to local LLM at http://localhost:8000. Make sure llama-server is running. Original error: ${error.message}`,
        );
      }
      if (error instanceof Error && error.name === "AbortError") {
        const timeoutSeconds = Math.round(adaptiveTimeout / 1000);
        const timeoutMinutes = Math.round(adaptiveTimeout / 60000);
        console.error(
          `[STORY_GENERATOR_ERROR] Request timeout after ${timeoutSeconds} seconds (${timeoutMinutes} min)`,
        );
        throw new Error(
          `Local LLM request timed out after ${timeoutSeconds}s. Model: ${this.model}. Context tokens estimate was ${Math.round(adaptiveTimeout / 1000)}. Consider increasing LLM_TIMEOUT_MS environment variable for large context models.`,
        );
      }
      console.error("[STORY_GENERATOR_ERROR] Unexpected error:", error);
      throw error;
    }
  }

  private async generateWithGemini(
    systemPrompt: string,
    userMessage: string,
  ): Promise<string> {
    try {
      const apiKey = process.env.GOOGLE_GENERATIVE_AI_KEY;
      if (!apiKey) {
        throw new Error(
          "Missing GOOGLE_GENERATIVE_AI_KEY environment variable. Set it in your .env file to use Gemini API",
        );
      }

      console.log("[STORY_GENERATOR_DEBUG] Sending request to Gemini API");

      const systemPromptLength = systemPrompt.length;
      const userMessageLength = userMessage.length;
      console.log(
        `[STORY_GENERATOR_DEBUG] Gemini request size: system=${systemPromptLength}, user=${userMessageLength} chars`,
      );

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000); // 60 second timeout for cloud API

      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify({
            system_instruction: { parts: { text: systemPrompt } },
            contents: { parts: { text: userMessage } },
            generationConfig: { temperature: 0.8, maxOutputTokens: 1500 },
          }),
          signal: controller.signal,
        },
      );

      clearTimeout(timeout);

      if (!response.ok) {
        let errorBody = "";
        try {
          errorBody = await response.text();
        } catch {
          errorBody = "Could not read response body";
        }
        throw new Error(
          `Gemini API Error ${response.status}: ${response.statusText}\nBody: ${errorBody}`,
        );
      }

      const data = await response.json();

      if (!data.candidates?.[0]?.content) {
        throw new Error(
          `Invalid response format from Gemini API. Expected candidates[0].content.parts[0].text, got: ${JSON.stringify(data)}`,
        );
      }

      if (!data.candidates[0].content.parts?.[0]) {
        throw new Error(
          `Gemini API returned no content in parts. Response: ${JSON.stringify(data)}`,
        );
      }

      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Gemini API request timed out after 60 seconds");
      }
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error(
          `Network error connecting to Gemini API. Check your internet connection. Original error: ${error.message}`,
        );
      }
      throw error;
    }
  }
}
