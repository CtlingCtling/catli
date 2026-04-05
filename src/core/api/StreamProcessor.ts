import { StreamChunk } from "./types.js";
import { error } from "../../utils/logger.js";

export class StreamProcessor {
  async *process(stream: ReadableStream<Uint8Array>): AsyncGenerator<StreamChunk> {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let isFinished = false;

    try {
      while (!isFinished) {
        const { done, value } = await reader.read();

        if (done) {
          if (buffer.trim()) {
            const chunk = this.parseBuffer(buffer);
            if (chunk) yield chunk;
          }
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (data === "[DONE]") {
              isFinished = true;
              break;
            }

            const chunk = this.parseLine(data);
            if (chunk) {
              yield chunk;
              if (chunk.isFinished) {
                isFinished = true;
              }
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  private parseLine(data: string): StreamChunk | null {
    try {
      const parsed = JSON.parse(data);

      if (parsed.error) {
        error(`Stream error: ${parsed.error.message}`);
        return null;
      }

      const choice = parsed.choices?.[0];
      if (!choice) return null;

      const delta = choice.delta;
      const content = delta?.content || "";
      const isFinished = choice.finish_reason !== null && choice.finish_reason !== undefined;

      return {
        text: content,
        isFinished,
        toolCalls: this.extractToolCalls(choice),
      };
    } catch {
      return null;
    }
  }

  private parseBuffer(buffer: string): StreamChunk | null {
    return this.parseLine(buffer);
  }

  private extractToolCalls(choice: Record<string, unknown>): StreamChunk["toolCalls"] {
    const toolCalls = choice.tool_calls as Array<{
      id: string;
      function: { name: string; arguments: string };
    }> | undefined;

    if (!toolCalls || !Array.isArray(toolCalls)) return undefined;

    return toolCalls.map((tc) => ({
      id: tc.id,
      name: tc.function.name,
      arguments: tc.function.arguments,
    }));
  }
}
