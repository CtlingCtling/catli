import { Message } from "../../types/message.js";
import { readJson, writeJson, ensureDir } from "../../utils/fs.js";
import { existsSync } from "fs";

export class HistoryManager {
  private historyPath: string;
  private messages: Message[] = [];

  constructor(historyPath: string) {
    this.historyPath = historyPath;
  }

  save(message: Message): void {
    this.messages.push(message);
    this.persist();
  }

  getHistory(): Message[] {
    return [...this.messages];
  }

  getRecent(n: number): Message[] {
    return this.messages.slice(-n);
  }

  clear(): void {
    this.messages = [];
    this.persist();
  }

  load(sessionId: string): void {
    const filePath = `${this.historyPath}/${sessionId}.json`;
    const data = readJson<{ messages: Message[] }>(filePath);
    if (data && data.messages) {
      this.messages = data.messages;
    } else {
      this.messages = [];
    }
  }

  saveSession(sessionId: string): void {
    ensureDir(this.historyPath);
    const filePath = `${this.historyPath}/${sessionId}.json`;
    writeJson(filePath, { messages: this.messages });
  }

  removeLastRound(): boolean {
    if (this.messages.length < 2) {
      return false;
    }

    let lastUserIndex = -1;
    for (let i = this.messages.length - 1; i >= 0; i--) {
      if (this.messages[i].role === "user") {
        lastUserIndex = i;
        break;
      }
    }

    if (lastUserIndex === -1) return false;

    this.messages = this.messages.slice(0, lastUserIndex);
    this.persist();
    return true;
  }

  private persist(): void {
    if (!existsSync(this.historyPath)) {
      ensureDir(this.historyPath);
    }
    const sessionFile = `${this.historyPath}/current.json`;
    writeJson(sessionFile, { messages: this.messages });
  }
}
