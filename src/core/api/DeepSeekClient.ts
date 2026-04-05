import { Message } from "../../types/message.js";
import { Tool } from "../../types/tool.js";
import { DeepSeekRequest, ToolDefinition } from "./types.js";
import { StreamProcessor } from "./StreamProcessor.js";

interface DeepSeekMessageResponse {
  role: string;
  content: string;
  tool_calls?: Array<{
    id: string;
    function: {
      name: string;
      arguments: string;
    };
  }>;
}

interface DeepSeekChoiceResponse {
  message: DeepSeekMessageResponse;
  finish_reason: string;
}

interface DeepSeekAPIResponse {
  id: string;
  model: string;
  choices: DeepSeekChoiceResponse[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class DeepSeekClient {
  private apiKey: string;
  private baseUrl: string;
  private model: string;
  private maxTokens: number;
  private temperature: number;

  constructor(apiKey: string, baseUrl: string, model: string, maxTokens: number, temperature: number) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.model = model;
    this.maxTokens = maxTokens;
    this.temperature = temperature;
  }

  async generateContent(messages: Message[]): Promise<string> {
    const request = this.buildRequest(messages);

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`DeepSeek API error: ${response.status} - ${error}`);
    }

    const data = (await response.json()) as DeepSeekAPIResponse;
    return data.choices[0]?.message?.content || "";
  }

  async *generateContentStream(
    messages: Message[],
    onChunk?: (chunk: string) => void
  ): AsyncGenerator<string> {
    const request = this.buildRequest(messages, true);
    const processor = new StreamProcessor();

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`DeepSeek API error: ${response.status} - ${error}`);
    }

    if (!response.body) {
      throw new Error("Response body is null");
    }

    for await (const chunk of processor.process(response.body)) {
      if (onChunk) {
        onChunk(chunk.text);
      }
      yield chunk.text;
    }
  }

  async generateWithTools(messages: Message[], tools: Tool[]): Promise<{
    content: string;
    toolCalls: Array<{ id: string; name: string; arguments: Record<string, unknown> }>;
  }> {
    const request = this.buildRequest(messages, false, tools);

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`DeepSeek API error: ${response.status} - ${error}`);
    }

    const data = (await response.json()) as DeepSeekAPIResponse;
    const message = data.choices[0]?.message;

    const toolCalls = (message?.tool_calls || []).map((tc) => ({
      id: tc.id,
      name: tc.function.name,
      arguments: JSON.parse(tc.function.arguments || "{}"),
    }));

    return {
      content: message?.content || "",
      toolCalls,
    };
  }

  private buildRequest(messages: Message[], stream = false, tools?: Tool[]): DeepSeekRequest {
    const requestMessages: Array<Record<string, unknown>> = messages.map((m) => {
      const msg: Record<string, unknown> = {
        role: m.role,
        content: m.content,
      };
      if (m.role === "tool" && m.toolCallId) {
        msg.tool_call_id = m.toolCallId;
      }
      if (m.role === "assistant" && m.toolCalls && m.toolCalls.length > 0) {
        msg.tool_calls = m.toolCalls.map((tc) => ({
          id: tc.id,
          type: "function",
          function: {
            name: tc.name,
            arguments: tc.arguments,
          },
        }));
      }
      return msg;
    });

    const request: DeepSeekRequest = {
      model: this.model,
      messages: requestMessages as DeepSeekRequest["messages"],
      temperature: this.temperature,
      max_tokens: this.maxTokens,
      stream,
    };

    if (tools && tools.length > 0) {
      request.tools = tools.map(this.toolToDefinition);
    }

    return request;
  }

  private toolToDefinition(tool: Tool): ToolDefinition {
    return {
      type: "function",
      function: {
        name: tool.name,
        description: tool.description,
        parameters: {
          type: "object",
          properties: tool.parameters.reduce((acc, param) => {
            acc[param.name] = {
              type: param.type,
              description: param.description,
            };
            return acc;
          }, {} as Record<string, { type: string; description: string }>),
          required: tool.parameters.filter((p) => p.required).map((p) => p.name),
        },
      },
    };
  }
}
