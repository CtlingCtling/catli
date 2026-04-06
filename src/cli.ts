import { ConfigManager } from "./config/ConfigManager.js";
import { DeepSeekClient } from "./core/api/DeepSeekClient.js";
import { SessionManager } from "./core/session/SessionManager.js";
import { createToolRegistry, ToolExecutor } from "./core/tools/index.js";
import { createCommandRegistry, SlashHandler } from "./core/commands/index.js";
import { MessageBuilder, MessageRole } from "./types/message.js";
import { output, error } from "./utils/logger.js";

const CONFIG_PATH = process.env.CATLI_CONFIG_PATH;
const configManager = new ConfigManager(CONFIG_PATH);
const config = configManager.getConfig();

if (!config.apiKey) {
  error("API key not found. Set DEEPSEEK_API_KEY environment variable or configure in ~/.catli.json");
  process.exit(1);
}

const apiClient = new DeepSeekClient(
  config.apiKey,
  config.baseUrl,
  config.model,
  config.maxTokens,
  config.temperature
);

const sessionManager = new SessionManager(config.historyPath, config.compressionThreshold);
sessionManager.createSession();

const toolRegistry = createToolRegistry();
const toolExecutor = new ToolExecutor(toolRegistry);
const commandRegistry = createCommandRegistry(toolRegistry, sessionManager, configManager);
const slashHandler = new SlashHandler(commandRegistry);

let innerMode = false;

export function setInnerMode(value: boolean): void {
  innerMode = value;
}

async function handleUserInput(input: string): Promise<void> {
  if (innerMode) {
    return;
  }

  const trimmed = input.trim();

  if (!trimmed) return;

  if (slashHandler.handle(trimmed)) {
    return;
  }

  sessionManager.setStatus("thinking" as any);

  const userMessage = new MessageBuilder()
    .setRole(MessageRole.User)
    .setContent(trimmed)
    .build();

  sessionManager.addMessage(userMessage);

  try {
    const messages = sessionManager.getMessages();
    const tools = toolRegistry.list();

    if (tools.length > 0) {
      const result = await apiClient.generateWithTools(messages, tools);

      if (result.toolCalls.length > 0) {
        const assistantWithTools = new MessageBuilder()
          .setRole(MessageRole.Assistant)
          .setContent(result.content)
          .setToolCalls(result.toolCalls.map((tc) => ({
            id: tc.id,
            name: tc.name,
            arguments: JSON.stringify(tc.arguments),
          })))
          .build();
        sessionManager.addMessage(assistantWithTools);

        output("[thinking] Processing tool calls...");

        const toolCallRequests = result.toolCalls.map((tc) => ({
          id: tc.id,
          name: tc.name,
          arguments: tc.arguments,
        }));

        const results = await toolExecutor.executeAll(toolCallRequests);

        for (const tcResult of results) {
          const toolMessage = new MessageBuilder()
            .setRole(MessageRole.Tool)
            .setContent(tcResult.result.content)
            .setToolCall(tcResult.id, toolCallRequests.find((t) => t.id === tcResult.id)?.name || "")
            .build();

          sessionManager.addMessage(toolMessage);
        }

        const currentSession = sessionManager.getCurrentSession();
        const updatedMessages = currentSession?.messages || [];
        const followUp = await apiClient.generateContent(updatedMessages);

        const assistantMessage = new MessageBuilder()
          .setRole(MessageRole.Assistant)
          .setContent(followUp)
          .build();

        sessionManager.addMessage(assistantMessage);
        output(followUp);
      } else {
        const assistantMessage = new MessageBuilder()
          .setRole(MessageRole.Assistant)
          .setContent(result.content)
          .build();

        sessionManager.addMessage(assistantMessage);
        output(result.content);
      }
    } else {
      let fullResponse = "";
      for await (const chunk of apiClient.generateContentStream(messages)) {
        fullResponse += chunk;
        output(chunk);
      }

      if (fullResponse) {
        const assistantMessage = new MessageBuilder()
          .setRole(MessageRole.Assistant)
          .setContent(fullResponse)
          .build();

        sessionManager.addMessage(assistantMessage);
      }
    }
  } catch (err) {
    const errMsg = err as Error;
    error(`Error: ${errMsg.message}`);
  }

  sessionManager.setStatus("idle" as any);
  sessionManager.saveSession();
}

async function main(): Promise<void> {
  output("CatLI - Cat CLI");
  output("Type /help for available commands\n");

  const readline = await import("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "catli> ",
  });

  rl.prompt();

  rl.on("line", async (line) => {
    if (innerMode) {
      rl.prompt();
      return;
    }
    await handleUserInput(line);
    rl.prompt();
  });

  rl.on("close", () => {
    output("Goodbye!");
    process.exit(0);
  });
}

main().catch((err) => {
  error(`Fatal error: ${err}`);
  process.exit(1);
});
