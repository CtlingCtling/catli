import { readFileSync } from "fs";
import { join } from "path";
import { Command } from "../CommandRegistry.js";
import { ToolRegistry } from "../../tools/ToolRegistry.js";
import { output } from "../../../utils/logger.js";

function getHelpText(): string {
  try {
    const helpPath = join(process.cwd(), "builtin_prompts", "help.md");
    return readFileSync(helpPath, "utf-8");
  } catch {
    return "\nAvailable commands#️⃣:\n  /help - 🙋Show this help message\n  /clear - 🧹Clear the conversation history\n  /reverse <n> - 🔙Remove the last n rounds of conversation\n  /compress - 🗜️Manually compress conversation history\n  /token - 💰Show current token count\n  /batchmd <dir> [-r] - 📝Batch process markdown files into MemPalace\n  /config - ⚙️View and modify configuration\n  /kitten - 🐈Configure kitten AI settings\n  /tools - 🛠️List available tools\n  /todolist - ☑️Show TODO list\n  /exit - 🛫Exit the CLI";
  }
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
