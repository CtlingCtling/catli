import { Command } from "../CommandRegistry.js";
import { SessionManager } from "../../session/SessionManager.js";
import { output } from "../../../utils/logger.js";

export function createCompressCommand(sessionManager: SessionManager): Command {
  return {
    name: "compress",
    description: "Manually compress conversation history",
    execute: async (_args: string[]): Promise<boolean> => {
      const messages = sessionManager.getCurrentSession()?.messages;
      if (!messages || messages.length === 0) {
        output("No conversation to compress.");
        return true;
      }

      const originalCount = messages.length;
      const compressedMessages = await sessionManager.compress();

      if (compressedMessages.length < originalCount) {
        output(`Compressed ${originalCount} messages into ${compressedMessages.length} message(s).`);
      } else {
        output("No compression needed - conversation is within threshold.");
      }
      return true;
    },
  };
}
