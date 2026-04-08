import { CommandRegistry } from "./CommandRegistry.js";
import { createHelpCommand } from "./handlers/help.js";
import { createToolsCommand } from "./handlers/tools.js";
import { createExitCommand } from "./handlers/exit.js";
import { createReverseCommand, createClearCommand } from "./handlers/reverse.js";
import { createConfigCommand } from "./handlers/config.js";
import { createKittenCommand } from "./handlers/kitten.js";
import { createCompressCommand } from "./handlers/compress.js";
import { createTokenCommand } from "./handlers/token.js";
import { createBatchmdCommand } from "./handlers/batchmd.js";
import { createTodolistCommand } from "./handlers/todolist.js";
import { ToolRegistry } from "../tools/ToolRegistry.js";
import { SessionManager } from "../session/SessionManager.js";
import { ConfigManager } from "../../config/ConfigManager.js";

export function createCommandRegistry(
  toolRegistry: ToolRegistry,
  sessionManager: SessionManager,
  configManager: ConfigManager
): CommandRegistry {
  const registry = new CommandRegistry();

  registry.register(createHelpCommand(toolRegistry));
  registry.register(createClearCommand(sessionManager));
  registry.register(createReverseCommand(sessionManager));
  registry.register(createExitCommand());
  registry.register(createToolsCommand(toolRegistry));
  registry.register(createConfigCommand(configManager));
  registry.register(createKittenCommand());
  registry.register(createCompressCommand(sessionManager));
  registry.register(createTokenCommand(sessionManager));
  registry.register(createBatchmdCommand());
  registry.register(createTodolistCommand());

  return registry;
}

export { CommandRegistry } from "./CommandRegistry.js";
export { SlashHandler } from "./SlashHandler.js";
