export enum MessageRole {
  System = "system",
  User = "user",
  Assistant = "assistant",
  Tool = "tool",
}

export interface ToolCallInfo {
  id: string;
  name: string;
  arguments: string;
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  toolCallId?: string;
  toolName?: string;
  toolCalls?: ToolCallInfo[];
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export class MessageBuilder {
  private id: string = generateId();
  private role!: MessageRole;
  private content: string = "";
  private timestamp: number = Date.now();
  private toolCallId?: string;
  private toolName?: string;
  private toolCalls?: ToolCallInfo[];

  setRole(role: MessageRole): this {
    this.role = role;
    return this;
  }

  setContent(content: string): this {
    this.content = content;
    return this;
  }

  setToolCall(id: string, name: string): this {
    this.toolCallId = id;
    this.toolName = name;
    return this;
  }

  setToolCalls(toolCalls: ToolCallInfo[]): this {
    this.toolCalls = toolCalls;
    return this;
  }

  build(): Message {
    if (!this.role || this.content === undefined) {
      throw new Error("Message role and content are required");
    }
    return {
      id: this.id,
      role: this.role,
      content: this.content,
      timestamp: this.timestamp,
      toolCallId: this.toolCallId,
      toolName: this.toolName,
      toolCalls: this.toolCalls,
    };
  }
}

export class MessageCompressor {
  compress(messages: Message[], _maxTokens: number): Message[] {
    if (messages.length <= 2) return messages;

    const result: Message[] = [];
    const systemMessages = messages.filter((m) => m.role === MessageRole.System);
    const recentMessages = messages.slice(-6);

    result.push(...systemMessages);
    result.push(...recentMessages);

    return result;
  }

  extractImportantMessages(messages: Message[]): Message[] {
    return messages.filter((m) => {
      if (m.role === MessageRole.System) return true;
      if (m.content.length > 50) return true;
      return false;
    });
  }
}
