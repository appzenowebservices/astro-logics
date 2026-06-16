import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { Groq } from "groq-sdk";
// import { ChatAnthropic } from '@langchain/anthropic';
import {
  BaseMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";
import chalk from "chalk";

export interface LLMConfig {
  provider: "openai" | "anthropic" | "local" | "ollama" | "groq" | "openrouter"; // Added 'openrouter'
  model?: string;
  embeddingModel?: string;
  temperature?: number;
  maxTokens?: number;
  apiKey?: string;
  baseUrl?: string;
}

export interface LLMGenerateInput {
  system?: string;
  user: string;
  json?: boolean;
}

export interface LLMStreamChunk {
  textDelta: string;
}

export interface LLMProvider {
  generate(input: LLMGenerateInput): Promise<{ text: string }>;
  stream(input: LLMGenerateInput): AsyncIterable<LLMStreamChunk>;
  embed(input: string[]): Promise<number[][]>;
}

// Update your default config - read from environment variables with fallbacks
const DEFAULT_CONFIGS: Record<string, LLMConfig> = {
  local: {
    provider: "local",
    model: process.env.LLAMA_CPP_MODEL || "model",
    baseUrl: process.env.LLAMA_CPP_URL || "http://localhost:8000",
    temperature: 0.7,
    maxTokens: 4096,
  },
  ollamaCloud: {
    provider: "ollama",
    model: process.env.OLLAMA_MODEL || "glm-5:cloud",
    baseUrl: process.env.OLLAMA_URL || "http://localhost:11434/v1",
    temperature: 0.7,
    maxTokens: 4096,
  },
  groq: {
    provider: "groq",
    model: "llama-3.1-8b-instant",
    apiKey: process.env.GROQ_API_KEY,
    temperature: 0.7,
    maxTokens: 4096,
  },
  openrouter: {
    provider: "openrouter",
    model: process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-lite-001",
    baseUrl: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
    temperature: 0.3,
    maxTokens: 4096,
  },
  openai: {
    provider: "openai",
    model: "gpt-3.5-turbo",
    apiKey: process.env.OPENAI_API_KEY,
    temperature: 0.7,
    maxTokens: 4096,
  },
  anthropic: {
    provider: "anthropic",
    model: "claude-3-sonnet-20240229",
    apiKey: process.env.ANTHROPIC_API_KEY,
    temperature: 0.7,
    maxTokens: 4096,
  },
};

class LocalLlamaProvider implements LLMProvider {
  private chat: ChatOpenAI;
  private embeddings: OpenAIEmbeddings;
  private baseUrl: string;

  constructor(config: LLMConfig) {
    this.baseUrl = config.baseUrl || "http://localhost:8000";
    // console.log(this)
    // console.log(chalk.bgRed('\n...................  config.baseUrl: ' + this + ' ..................'))

    // Use a dummy API key since llama.cpp doesn't require authentication

    this.chat = new ChatOpenAI({
      modelName: config.model || "Llama-3.2-1B-Instruct",
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens ?? 4096,
      configuration: {
        baseURL: this.baseUrl,
        apiKey: "dummy",
      },
    });
    // console.log(this.chat)
    // console.log(chalk.bgGreenBright('\n...................  this.chat ..................',this.chat))

    this.embeddings = new OpenAIEmbeddings({
      modelName: config.embeddingModel || "local-embeddings",
      configuration: {
        baseURL: this.baseUrl,
        apiKey: "dummy",
      },
    });
  }

  async generate(input: LLMGenerateInput): Promise<{ text: string }> {
    try {
      // console.log(input)

      const messages: BaseMessage[] = [];
      if (input.system) messages.push(new SystemMessage(input.system));
      messages.push(new HumanMessage(input.user));
      const response = await this.chat.invoke(messages);
      return { text: response.content.toString() };
    } catch (error: any) {
      // If local provider fails, provide a fallback response
      console.log(
        chalk.bgRedBright(
          "\n...................  Local LLM failed  ..................",
          error,
        ),
      );

      throw error;
    }
  }

  async *stream(input: LLMGenerateInput): AsyncIterable<LLMStreamChunk> {
    const messages: BaseMessage[] = [];
    if (input.system) messages.push(new SystemMessage(input.system));
    messages.push(new HumanMessage(input.user));
    const stream = await this.chat.stream(messages);
    for await (const chunk of stream) {
      yield { textDelta: chunk.content?.toString() || "" };
    }
  }

  async embed(input: string[]): Promise<number[][]> {
    try {
      const embeddings = await this.embeddings.embedDocuments(input);
      return embeddings;
    } catch (error) {
      console.warn(
        "Embedding failed with local provider, returning dummy embeddings",
      );
      return input.map(() => new Array(384).fill(0));
    }
  }
}

class OpenAIProvider implements LLMProvider {
  private chat: ChatOpenAI;
  private embeddings: OpenAIEmbeddings;

  constructor(config: LLMConfig) {
    this.chat = new ChatOpenAI({
      modelName: config.model || "gpt-3.5-turbo",
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens ?? 4096,
      openAIApiKey: config.apiKey,
    });
    this.embeddings = new OpenAIEmbeddings({
      modelName: config.embeddingModel || "text-embedding-ada-002",
      openAIApiKey: config.apiKey,
    });
  }

  async generate(input: LLMGenerateInput): Promise<{ text: string }> {
    const messages: BaseMessage[] = [];
    if (input.system) messages.push(new SystemMessage(input.system));
    messages.push(new HumanMessage(input.user));
    const response = await this.chat.invoke(messages);
    return { text: response.content.toString() };
  }

  async *stream(input: LLMGenerateInput): AsyncIterable<LLMStreamChunk> {
    const messages: BaseMessage[] = [];
    if (input.system) messages.push(new SystemMessage(input.system));
    messages.push(new HumanMessage(input.user));
    const stream = await this.chat.stream(messages);
    for await (const chunk of stream) {
      yield { textDelta: chunk.content?.toString() || "" };
    }
  }

  async embed(input: string[]): Promise<number[][]> {
    const embeddings = await this.embeddings.embedDocuments(input);
    return embeddings;
  }
}

class OpenRouterProvider implements LLMProvider {
  private chat: ChatOpenAI;
  private embeddings: OpenAIEmbeddings;

  constructor(config: LLMConfig) {
    this.chat = new ChatOpenAI({
      modelName: config.model || "nex-agi/nex-n2-pro:free",
      temperature: config.temperature ?? 0.3,
      maxTokens: config.maxTokens ?? 4096,
      configuration: {
        baseURL: config.baseUrl || "https://openrouter.ai/api/v1",
        apiKey: config.apiKey,
      },
    });
    this.embeddings = new OpenAIEmbeddings({
      modelName: config.embeddingModel || "text-embedding-3-small",
      configuration: {
        baseURL: config.baseUrl || "https://openrouter.ai/api/v1",
        apiKey: config.apiKey,
      },
    });
  }

  async generate(input: LLMGenerateInput): Promise<{ text: string }> {
    const messages: BaseMessage[] = [];
    if (input.system) messages.push(new SystemMessage(input.system));
    messages.push(new HumanMessage(input.user));
    const response = await this.chat.invoke(messages);
    return { text: response.content.toString() };
  }

  async *stream(input: LLMGenerateInput): AsyncIterable<LLMStreamChunk> {
    const messages: BaseMessage[] = [];
    if (input.system) messages.push(new SystemMessage(input.system));
    messages.push(new HumanMessage(input.user));
    const stream = await this.chat.stream(messages);
    for await (const chunk of stream) {
      yield { textDelta: chunk.content?.toString() || "" };
    }
  }

  async embed(input: string[]): Promise<number[][]> {
    const embeddings = await this.embeddings.embedDocuments(input);
    return embeddings;
  }
}

class GroqProvider implements LLMProvider {
  private groq: Groq;
  private model: string;
  private temperature: number;
  private maxTokens: number;

  constructor(config: LLMConfig) {
    this.groq = new Groq({
      apiKey: config.apiKey || process.env.GROQ_API_KEY,
    });
    this.model = config.model || "mixtral-8x7b-32768";
    this.temperature = config.temperature ?? 0.7;
    this.maxTokens = config.maxTokens ?? 4096;
  }

  async generate(input: LLMGenerateInput): Promise<{ text: string }> {
    const messages: Array<{
      role: "system" | "user" | "assistant";
      content: string;
    }> = [];
    if (input.system) messages.push({ role: "system", content: input.system });
    messages.push({ role: "user", content: input.user });

    const response = await this.groq.chat.completions.create({
      messages: messages,
      model: this.model,
      temperature: this.temperature,
      max_completion_tokens: this.maxTokens,
      stream: false,
    });

    const text = response.choices[0]?.message?.content || "";
    return { text };
  }

  async *stream(input: LLMGenerateInput): AsyncIterable<LLMStreamChunk> {
    const messages: Array<{
      role: "system" | "user" | "assistant";
      content: string;
    }> = [];
    if (input.system) messages.push({ role: "system", content: input.system });
    messages.push({ role: "user", content: input.user });

    const stream = await this.groq.chat.completions.create({
      messages: messages,
      model: this.model,
      temperature: this.temperature,
      max_completion_tokens: this.maxTokens,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        yield { textDelta: content };
      }
    }
  }

  async embed(_input: string[]): Promise<number[][]> {
    // Groq doesn't have embeddings API, return dummy embeddings
    console.warn(
      "Embedding not supported for Groq provider, returning dummy embeddings",
    );
    return _input.map(() => new Array(1536).fill(0));
  }
}

// class AnthropicProvider implements LLMProvider {
//   private chat: ChatAnthropic;

//   constructor(config: LLMConfig) {
//     this.chat = new ChatAnthropic({
//       modelName: config.model || 'claude-3-sonnet-20240229',
//       temperature: config.temperature ?? 0.7,
//       maxTokens: config.maxTokens ?? 4096,
//       anthropicApiKey: config.apiKey,
//     });
//   }

//   async generate(input: LLMGenerateInput): Promise<{ text: string }> {
//     const messages: BaseMessage[] = [];
//     if (input.system) messages.push(new SystemMessage(input.system));
//     messages.push(new HumanMessage(input.user));
//     const response = await this.chat.invoke(messages);
//     return { text: response.content.toString() };
//   }

//   async *stream(input: LLMGenerateInput): AsyncIterable<LLMStreamChunk> {
//     const messages: BaseMessage[] = [];
//     if (input.system) messages.push(new SystemMessage(input.system));
//     messages.push(new HumanMessage(input.user));
//     const stream = await this.chat.stream(messages);
//     for await (const chunk of stream) {
//       yield { textDelta: chunk.content?.toString() || '' };
//     }
//   }

//   async embed(_input: string[]): Promise<number[][]> {
//     // Anthropic doesn't have embeddings, use OpenAI or another
//     throw new Error('Embeddings not supported for Anthropic provider.');
//   }
// }

export function createProvider(config?: Partial<LLMConfig>): LLMProvider {
  const providerName = config?.provider || "openrouter"; // Default to openrouter
  const defaultConfig = DEFAULT_CONFIGS[providerName];
  const finalConfig: LLMConfig = {
    ...defaultConfig,
    ...config,
    provider: providerName,
  };

  switch (finalConfig.provider) {
    case "local":
      return new LocalLlamaProvider(finalConfig);
    case "openai":
      return new OpenAIProvider(finalConfig);
    case "groq":
      return new GroqProvider(finalConfig);
    // case 'anthropic':
    //   return new AnthropicProvider(finalConfig);
    case "ollama":
      return new LocalLlamaProvider(finalConfig);
    case "openrouter":
      return new OpenRouterProvider(finalConfig);
    default:
      throw new Error(`Unsupported LLM provider: ${finalConfig.provider}`);
  }
}

export function createProviderSet() {
  return {
    planner: () => createProvider(),
    executor: () => createProvider(),
    embedder: () => createProvider(),
  };
}
