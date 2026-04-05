import { CommandRegistry } from "./CommandRegistry.js";
import { Command } from "./CommandRegistry.js";
import { output } from "../../utils/logger.js";
import { ToolRegistry } from "../tools/ToolRegistry.js";

export class SlashHandler {
  private registry: CommandRegistry;

  constructor(registry: CommandRegistry) {
    this.registry = registry;
  }

  handle(input: string): boolean {
    const trimmed = input.trim();

    if (!trimmed.startsWith("/")) {
      return false;
    }

    const { command, args } = this.parse(trimmed);
    const cmd = this.registry.get(command);

    if (!cmd) {
      output(`[error] Unknown command: /${command}`);
      return true;
    }

    cmd.execute(args).catch((err) => {
      output(`[error] Command error: ${err}`);
    });

    return true;
  }

  parse(input: string): { command: string; args: string[] } {
    const parts = input.slice(1).split(/\s+/);
    const command = parts[0] || "";
    const args = parts.slice(1);

    return { command, args };
  }

  execute(command: string, args: string[]): Promise<boolean> {
    const cmd = this.registry.get(command);
    if (!cmd) {
      return Promise.resolve(false);
    }
    return cmd.execute(args);
  }
}

export function createHelpCommand(toolRegistry: ToolRegistry): Command {
  return {
    name: "help",
    description: "Show available commands and tools",
    execute: async (_args: string[]): Promise<boolean> => {
      output("Available commands:");
      output("  /help - Show this help message");
      output("  /clear - Clear the conversation history");
      output("  /exit - Exit the CLI");
      output("  /tools - List available tools");

      const tools = toolRegistry.list();
      if (tools.length > 0) {
        output("\nAvailable tools:");
        for (const tool of tools) {
          output(`  - ${tool.name}: ${tool.description}`);
        }
      }

      return true;
    },
  };
}

export function createClearCommand(): Command {
  return {
    name: "clear",
    description: "Clear the conversation history",
    execute: async (_args: string[]): Promise<boolean> => {
      output("Conversation history cleared.");
      return true;
    },
  };
}

export function createExitCommand(): Command {
  return {
    name: "exit",
    description: "Exit the CLI",
    execute: async (_args: string[]): Promise<boolean> => {
      output("Goodbye!");
      setTimeout(() => process.exit(0), 100);
      return true;
    },
  };
}

export function createToolsCommand(toolRegistry: ToolRegistry): Command {
  return {
    name: "tools",
    description: "List available tools",
    execute: async (_args: string[]): Promise<boolean> => {
      const tools = toolRegistry.list();
      if (tools.length === 0) {
        output("No tools available.");
        return true;
      }

      output("Available tools:");
      for (const tool of tools) {
        output(`\n${tool.name}:`);
        output(`  Description: ${tool.description}`);
        output(`  Parameters:`);
        for (const param of tool.parameters) {
          const required = param.required ? "(required)" : "(optional)";
          output(`    - ${param.name} ${required}: ${param.description}`);
        }
      }

      return true;
    },
  };
}
