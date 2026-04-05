export interface ToolParameter {
  name: string;
  description: string;
  type: "string" | "number" | "boolean" | "object";
  required: boolean;
  default?: unknown;
}

export interface Tool {
  name: string;
  description: string;
  parameters: ToolParameter[];
  execute: (params: Record<string, unknown>) => Promise<ToolResult>;
}

export interface ToolCallRequest {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolCallResponse {
  id: string;
  result: ToolResult;
  error?: string;
}

export interface ToolResult {
  success: boolean;
  content: string;
  error?: string;
}
