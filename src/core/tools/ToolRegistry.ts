import { Tool, ToolCallRequest, ToolCallResponse } from "../../types/tool.js";

export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  register(tool: Tool): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool ${tool.name} is already registered`);
    }
    this.tools.set(tool.name, tool);
  }

  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  list(): Tool[] {
    return Array.from(this.tools.values());
  }

  has(name: string): boolean {
    return this.tools.has(name);
  }

  getToolNames(): string[] {
    return Array.from(this.tools.keys());
  }
}

export class ToolExecutor {
  private registry: ToolRegistry;

  constructor(registry: ToolRegistry) {
    this.registry = registry;
  }

  async execute(toolCall: ToolCallRequest): Promise<ToolCallResponse> {
    const tool = this.registry.get(toolCall.name);

    if (!tool) {
      return {
        id: toolCall.id,
        result: { success: false, content: "", error: `Tool ${toolCall.name} not found` },
        error: `Tool ${toolCall.name} not found`,
      };
    }

    try {
      const result = await tool.execute(toolCall.arguments);
      return { id: toolCall.id, result };
    } catch (err) {
      const error = err as Error;
      return {
        id: toolCall.id,
        result: { success: false, content: "", error: error.message },
        error: error.message,
      };
    }
  }

  async executeAll(toolCalls: ToolCallRequest[]): Promise<ToolCallResponse[]> {
    return Promise.all(toolCalls.map((tc) => this.execute(tc)));
  }

  validateParameters(tool: Tool, params: Record<string, unknown>): { valid: boolean; error?: string } {
    for (const param of tool.parameters) {
      if (param.required && !(param.name in params)) {
        return { valid: false, error: `Missing required parameter: ${param.name}` };
      }
    }
    return { valid: true };
  }
}
