import { Session, Message } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';

export class SessionStore {
  private currentSession: Session | null = null;

  createSession(projectPath?: string, model = 'deepseek-chat'): Session {
    const now = new Date();
    this.currentSession = {
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
      messages: [],
      metadata: {
        projectPath,
        model
      }
    };
    return this.currentSession;
  }

  getCurrentSession(): Session | null {
    return this.currentSession;
  }

  addMessage(role: Message['role'], content: string): void {
    if (!this.currentSession) {
      this.createSession();
    }

    const message: Message = {
      role,
      content,
      timestamp: new Date()
    };

    this.currentSession!.messages.push(message);
    this.currentSession!.updatedAt = new Date();
  }

  clearSession(): void {
    if (this.currentSession) {
      this.currentSession.messages = [];
      this.currentSession.updatedAt = new Date();
    }
  }

  getMessages(): Message[] {
    return this.currentSession?.messages || [];
  }

  getTokenCount(): number {
    // 简单估算：4个字符大约1个token
    const totalChars = this.getMessages()
      .map(m => m.content.length)
      .reduce((sum, len) => sum + len, 0);
    
    return Math.ceil(totalChars / 4);
  }
}