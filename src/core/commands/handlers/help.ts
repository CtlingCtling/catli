import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { Command } from "../CommandRegistry.js";
import { ToolRegistry } from "../../tools/ToolRegistry.js";
import { output } from "../../../utils/logger.js";

function getHelpText(): string {
  const helpPath = join(process.cwd(), "builtin_prompts", "help.md");
  if (!existsSync(helpPath)) {
    throw new Error(`Help file not found: ${helpPath}`);
  }
  return readFileSync(helpPath, "utf-8");
}

export function createHelpCommand(toolRegistry: ToolRegistry): Command {
  return {
    name: "help",
    description: "Show available commands and tools",
    execute: async (): Promise<boolean> => {
      output(getHelpText());

      const tools = toolRegistry.list();
      if (tools.length > 0) {
        output("\nAvailable tools🛠️:");
        for (const tool of tools) {
          output(`  - ${tool.name}: ${tool.description}`);
        }
      }

      return true;
    },
  };
}
