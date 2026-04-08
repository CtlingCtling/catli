import { Command } from "../CommandRegistry.js";
import { SessionManager } from "../../session/SessionManager.js";
import { output } from "../../../utils/logger.js";

export function createReverseCommand(sessionManager: SessionManager): Command {
  return {
    name: "reverse",
    description: "Remove the last N rounds of conversation",
    execute: async (args: string[]): Promise<boolean> => {
      const n = parseInt(args[0] || "1", 10);

      if (isNaN(n) || n < 1) {
        output("Usage: /reverse <number> - number must be a positive integer");
        return true;
      }

      const success = sessionManager.reverse(n);
      if (success) {
        output(`Removed last ${n} round(s) of conversation.`);
      } else {
        output("Failed to reverse conversation - not enough messages.");
      }
      return true;
    },
  };
}

export function createClearCommand(sessionManager: SessionManager): Command {
  return {
    name: "clear",
    description: "Clear the conversation history and screen",
    execute: async (_args: string[]): Promise<boolean> => {
      process.stdout.write("\x1b[2J\x1b[H");
      sessionManager.createSession();
      output("Conversation history cleared.");
      return true;
    },
  };
}
