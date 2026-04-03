export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface Session {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  messages: Message[];
  metadata: {
    projectPath?: string;
    model: string;
  };
}

export interface Config {
  apiKey?: string;
  model: string;
  baseUrl: string;
  temperature: number;
  maxTokens: number;
}

export interface StreamResponse {
  content: string;
  done: boolean;
  error?: string;
}

export interface CLIArgs {
  exec?: string;
  session?: string;
  config?: string;
  json?: boolean;
  version?: boolean;
  help?: boolean;
}

export type RunMode = 'interactive' | 'single' | 'command';