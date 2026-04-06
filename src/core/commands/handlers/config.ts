import { Command } from "../CommandRegistry.js";
import { ConfigManager } from "../../../config/ConfigManager.js";
import { output } from "../../../utils/logger.js";

export function createConfigCommand(_configManager: ConfigManager): Command {
  return {
    name: "config",
    description: "View and modify configuration (use /config command in CLI)",
    execute: async (): Promise<boolean> => {
      output("Use /config command directly in CLI to enter config mode.");
      return true;
    },
  };
}
