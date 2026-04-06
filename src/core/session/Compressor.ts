import { readFileSync } from "fs";
import { join } from "path";
import { Message, MessageRole } from "../../types/message.js";
import { DeepSeekClient } from "../api/DeepSeekClient.js";

export interface CompressionOptions {
  chunkSize: number;
  preserveRecentCount: number;
  maxTokensPerChunk: number;
}

export class Compressor {
  private client?: DeepSeekClient;
  private options: CompressionOptions;

  constructor(client?: DeepSeekClient, options?: Partial<CompressionOptions>) {
    this.client = client;
    this.options = {
      chunkSize: options?.chunkSize || 10,
      preserveRecentCount: options?.preserveRecentCount || 6,
      maxTokensPerChunk: options?.maxTokensPerChunk || 2000,
    };
  }

  async compress(messages: Message[]): Promise<Message[]> {
    if (messages.length <= this.options.chunkSize) {
      return messages;
    }

    const systemMessages = messages.filter((m) => m.role === MessageRole.System);
    const nonSystemMessages = messages.filter((m) => m.role !== MessageRole.System);

    if (nonSystemMessages.length <= this.options.preserveRecentCount) {
      return messages;
    }

    const recentMessages = nonSystemMessages.slice(-this.options.preserveRecentCount);
    const olderMessages = nonSystemMessages.slice(0, -this.options.preserveRecentCount);

    const compressedOlder = await this.compressChunks(olderMessages);

    return [...systemMessages, ...compressedOlder, ...recentMessages];
  }

  private async compressChunks(messages: Message[]): Promise<Message[]> {
    const chunks = this.chunkMessages(messages, this.options.chunkSize);
    const compressed: Message[] = [];

    for (const chunk of chunks) {
      const summary = await this.summarizeChunk(chunk);
      compressed.push(summary);
    }

    return compressed;
  }

  private chunkMessages(messages: Message[], size: number): Message[][] {
    const chunks: Message[][] = [];
    for (let i = 0; i < messages.length; i += size) {
      chunks.push(messages.slice(i, i + size));
    }
    return chunks;
  }

  private async summarizeChunk(chunk: Message[]): Promise<Message> {
    const conversationText = this.formatMessagesForSummary(chunk);
    const prompt = this.getSummaryPrompt(conversationText);

    try {
      if (!this.client) {
        return {
          id: `compressed-${Date.now()}-fallback`,
          role: MessageRole.System,
          content: `[Previous conversation - ${chunk.length} messages collapsed, no AI available]`,
          timestamp: Date.now(),
        };
      }

      const summaryText = await this.client.generateContent([
        {
          id: `summary-${Date.now()}`,
          role: MessageRole.User,
          content: prompt,
          timestamp: Date.now(),
        },
      ]);

      return {
        id: `compressed-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
        role: MessageRole.System,
        content: `[Previous conversation summary]\n${summaryText.trim()}`,
        timestamp: Date.now(),
      };
    } catch {
      return {
        id: `compressed-${Date.now()}-fallback`,
        role: MessageRole.System,
        content: `[Previous conversation - ${chunk.length} messages collapsed]`,
        timestamp: Date.now(),
      };
    }
  }

  private formatMessagesForSummary(messages: Message[]): string {
    return messages
      .map((m) => {
        const role = m.role === MessageRole.User ? "User" : m.role === MessageRole.Assistant ? "Assistant" : m.role;
        return `${role}: ${m.content}`;
      })
      .join("\n\n");
  }

  private getSummaryPrompt(conversation: string): string {
    try {
      const promptPath = join(process.cwd(), "builtin_prompts", "message_summary.md");
      return readFileSync(promptPath, "utf-8").replace("{{conversation}}", conversation);
    } catch {
      return `Summarize the following conversation concisely, preserving key facts, decisions, and important details:\n\n${conversation}`;
    }
  }

  estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  truncate(text: string, maxTokens: number): string {
    const maxChars = maxTokens * 4;
    if (text.length <= maxChars) return text;
    return text.slice(0, maxChars - 3) + "...";
  }
}
