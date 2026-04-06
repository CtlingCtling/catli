import { Command } from "../CommandRegistry.js";
import { output } from "../../../utils/logger.js";

export function createKittenCommand(): Command {
  return {
    name: "kitten",
    description: "Configure kitten AI settings (use /kitten command in CLI)",
    execute: async (): Promise<boolean> => {
      output("Use /kitten command directly in CLI to enter kitten config mode.");
      return true;
    },
  };
}
