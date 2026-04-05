import { CommandRegistry } from "./CommandRegistry.js";
import {
  SlashHandler,
  createHelpCommand,
  createClearCommand,
  createExitCommand,
  createToolsCommand,
} from "./SlashHandler.js";
import { ToolRegistry } from "../tools/ToolRegistry.js";

export function createCommandRegistry(toolRegistry: ToolRegistry): CommandRegistry {
  const registry = new CommandRegistry();

  registry.register(createHelpCommand(toolRegistry));
  registry.register(createClearCommand());
  registry.register(createExitCommand());
  registry.register(createToolsCommand(toolRegistry));

  return registry;
}

export { CommandRegistry, SlashHandler };
