import { Message, MessageCompressor } from "../../types/message.js";

export class Compressor {
  private compressor: MessageCompressor;

  constructor() {
    this.compressor = new MessageCompressor();
  }

  compress(messages: Message[], threshold: number): Message[] {
    const totalLength = messages.reduce((sum, m) => sum + m.content.length, 0);

    if (totalLength < threshold * 100) {
      return messages;
    }

    return this.compressor.compress(messages, threshold);
  }

  extractImportant(messages: Message[]): Message[] {
    return this.compressor.extractImportantMessages(messages);
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
