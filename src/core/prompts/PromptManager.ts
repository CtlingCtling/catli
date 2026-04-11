import { readFileSync, existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";

export class PromptManager {
  private mindPath: string;

  constructor() {
    this.mindPath = join(homedir(), ".catli", "prompts", "MIND.md");
  }

  getMindPrompt(): string | null {
    if (existsSync(this.mindPath)) {
      return readFileSync(this.mindPath, "utf-8");
    }
    return null;
  }

  getPromptPath(): string {
    return this.mindPath;
  }
}