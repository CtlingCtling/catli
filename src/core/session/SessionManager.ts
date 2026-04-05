import { Message } from "../../types/message.js";
import { Session, SessionStatus } from "../../types/session.js";
import { HistoryManager } from "./HistoryManager.js";
import { Compressor } from "./Compressor.js";
import { debug as logDebug } from "../../utils/logger.js";

function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export class SessionManager {
  private currentSession: Session | null = null;
  private historyManager: HistoryManager;
  private compressor: Compressor;
  private compressionThreshold: number;

  constructor(historyPath: string, compressionThreshold: number) {
    this.compressionThreshold = compressionThreshold;
    this.historyManager = new HistoryManager(historyPath);
    this.compressor = new Compressor();
  }

  createSession(): Session {
    const session: Session = {
      id: generateSessionId(),
      metadata: {
        id: generateSessionId(),
        createdAt: Date.now(),
        lastActiveAt: Date.now(),
        messageCount: 0,
      },
      messages: [],
      status: SessionStatus.Idle,
    };

    this.currentSession = session;
    this.historyManager.clear();
    logDebug(`Created new session: ${session.id}`);
    return session;
  }

  loadSession(id: string): Session | null {
    this.historyManager.load(id);

    const messages = this.historyManager.getHistory();
    const session: Session = {
      id,
      metadata: {
        id,
        createdAt: messages[0]?.timestamp || Date.now(),
        lastActiveAt: Date.now(),
        messageCount: messages.length,
      },
      messages,
      status: SessionStatus.Idle,
    };

    this.currentSession = session;
    logDebug(`Loaded session: ${id}`);
    return session;
  }

  saveSession(): void {
    if (!this.currentSession) return;
    this.historyManager.saveSession(this.currentSession.id);
    logDebug(`Saved session: ${this.currentSession.id}`);
  }

  getCurrentSession(): Session | null {
    return this.currentSession;
  }

  addMessage(message: Message): void {
    if (!this.currentSession) {
      this.createSession();
    }

    if (this.currentSession) {
      this.currentSession.messages.push(message);
      this.currentSession.metadata.lastActiveAt = Date.now();
      this.currentSession.metadata.messageCount = this.currentSession.messages.length;
      this.historyManager.save(message);
    }
  }

  getMessages(): Message[] {
    if (!this.currentSession) return [];

    const messages = this.currentSession.messages;
    return this.compressor.compress(messages, this.compressionThreshold);
  }

  setStatus(status: SessionStatus): void {
    if (this.currentSession) {
      this.currentSession.status = status;
    }
  }

  reverse(): boolean {
    const success = this.historyManager.removeLastRound();
    if (success && this.currentSession) {
      this.currentSession.messages = this.historyManager.getHistory();
      this.currentSession.metadata.messageCount = this.currentSession.messages.length;
    }
    return success;
  }
}
