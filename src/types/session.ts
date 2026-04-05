import { Message } from "./message.js";

export enum SessionStatus {
  Idle = "idle",
  Thinking = "thinking",
  Error = "error",
}

export interface SessionMetadata {
  id: string;
  createdAt: number;
  lastActiveAt: number;
  messageCount: number;
  model?: string;
}

export interface Session {
  id: string;
  metadata: SessionMetadata;
  messages: Message[];
  status: SessionStatus;
}
