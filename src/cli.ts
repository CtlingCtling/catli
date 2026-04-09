import { ConfigManager } from "./config/ConfigManager.js";
import { DeepSeekClient } from "./core/api/DeepSeekClient.js";
import { runStreamingMode } from "./core/api/StreamingHandler.js";
import { SessionManager } from "./core/session/SessionManager.js";
import { createToolRegistry, ToolExecutor } from "./core/tools/index.js";
import { createCommandRegistry, SlashHandler } from "./core/commands/index.js";
import { MessageBuilder, MessageRole } from "./types/message.js";
import { output, error } from "./utils/logger.js";

const DEBUG = process.argv.includes("--debug") || process.argv.includes("-d");

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

const sessionManager = new SessionManager(
  config.historyPath,
  apiClient,
  {
    tokenThreshold: config.compressTokenThreshold,
    preserveRecentTokens: config.compressPreserveRecent,
    maxTokensPerChunk: config.compressMaxChunkTokens,
  }
);
sessionManager.createSession();

const toolRegistry = createToolRegistry();
const toolExecutor = new ToolExecutor(toolRegistry);
const commandRegistry = createCommandRegistry(toolRegistry, sessionManager, configManager);
const slashHandler = new SlashHandler(commandRegistry);

type CliMode = "normal" | "config" | "kitten";
let currentMode: CliMode = "normal";

function setPrompt(rl: any, mode: CliMode): void {
  switch (mode) {
    case "config":
      rl.setPrompt("confi> ");
      break;
    case "kitten":
      rl.setPrompt("kitty> ");
      break;
    default:
      rl.setPrompt("catli> ");
  }
}

function enterMode(rl: any, mode: CliMode): void {
  currentMode = mode;
  setPrompt(rl, mode);
  rl.prompt();
}

function exitMode(rl: any): void {
  currentMode = "normal";
  setPrompt(rl, "normal");
  output("Exiting config mode.");
  rl.prompt();
}

function handleConfigInput(rl: any, input: string): void {
  const trimmed = input.trim();

  if (trimmed === "e" || trimmed === "exit") {
    exitMode(rl);
    return;
  }

  if (!trimmed) {
    exitMode(rl);
    return;
  }

  if (!trimmed.includes("=")) {
    const cfg = configManager.getConfig();
    if (trimmed === "model") {
      output(`  model: ${cfg.model}`);
    } else if (trimmed === "maxTokens") {
      output(`  maxTokens: ${cfg.maxTokens}`);
    } else if (trimmed === "temperature") {
      output(`  temperature: ${cfg.temperature}`);
    } else if (trimmed === "compressTokenThreshold") {
      output(`  compressTokenThreshold: ${cfg.compressTokenThreshold}`);
    } else if (trimmed === "compressPreserveRecent") {
      output(`  compressPreserveRecent: ${cfg.compressPreserveRecent}`);
    } else if (trimmed === "compressMaxChunkTokens") {
      output(`  compressMaxChunkTokens: ${cfg.compressMaxChunkTokens}`);
    } else if (trimmed === "historyPath") {
      output(`  historyPath: ${cfg.historyPath}`);
    } else {
      output(`Unknown config key: ${trimmed}`);
    }
    rl.prompt();
    return;
  }

  const [key, ...valueParts] = trimmed.split("=");
  const value = valueParts.join("=").trim();
  const keyTrimmed = key.trim();

  if (!value) {
    output("Usage: <key>=<value>");
    rl.prompt();
    return;
  }

  if (keyTrimmed === "model") {
    configManager.set("model", value);
    output(`Updated: model = ${value}`);
  } else if (keyTrimmed === "maxTokens") {
    const num = parseInt(value, 10);
    if (isNaN(num)) {
      output("maxTokens must be a number");
    } else {
      configManager.set("maxTokens", num);
      output(`Updated: maxTokens = ${num}`);
    }
  } else if (keyTrimmed === "temperature") {
    const num = parseFloat(value);
    if (isNaN(num)) {
      output("temperature must be a number");
    } else {
      configManager.set("temperature", num);
      output(`Updated: temperature = ${num}`);
    }
  } else if (keyTrimmed === "compressTokenThreshold") {
    const num = parseInt(value, 10);
    if (isNaN(num)) {
      output("compressTokenThreshold must be a number");
    } else {
      configManager.set("compressTokenThreshold", num);
      output(`Updated: compressTokenThreshold = ${num}`);
    }
  } else if (keyTrimmed === "compressPreserveRecent") {
    const num = parseInt(value, 10);
    if (isNaN(num)) {
      output("compressPreserveRecent must be a number");
    } else {
      configManager.set("compressPreserveRecent", num);
      output(`Updated: compressPreserveRecent = ${num}`);
    }
  } else if (keyTrimmed === "compressMaxChunkTokens") {
    const num = parseInt(value, 10);
    if (isNaN(num)) {
      output("compressMaxChunkTokens must be a number");
    } else {
      configManager.set("compressMaxChunkTokens", num);
      output(`Updated: compressMaxChunkTokens = ${num}`);
    }
  } else if (keyTrimmed === "historyPath") {
    configManager.set("historyPath", value);
    output(`Updated: historyPath = ${value}`);
  } else if (keyTrimmed === "streaming") {
    const boolVal = value === "true";
    configManager.set("streaming", boolVal);
    output(`Updated: streaming = ${boolVal}`);
  } else {
    output(`Unknown config key: ${keyTrimmed}`);
  }
  rl.prompt();
}

function handleKittenInput(rl: any, input: string): void {
  const trimmed = input.trim();

  if (trimmed === "e" || trimmed === "exit") {
    currentMode = "normal";
    setPrompt(rl, "normal");
    output("Exiting kitten config mode.");
    rl.prompt();
    return;
  }

  if (!trimmed) {
    currentMode = "normal";
    setPrompt(rl, "normal");
    output("Exiting kitten config mode.");
    rl.prompt();
    return;
  }

  if (!trimmed.includes("=")) {
    output(`Unknown config key: ${trimmed}`);
    rl.prompt();
    return;
  }

  const [key, ...valueParts] = trimmed.split("=");
  const value = valueParts.join("=").trim();
  const keyTrimmed = key.trim();

  if (!value) {
    output("Usage: <key>=<value>");
    rl.prompt();
    return;
  }

  output(`Kitten config updated: ${keyTrimmed} = ${value}`);
  rl.prompt();
}

async function handleUserInput(input: string): Promise<void> {
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
    output("");

    try {
    const messages = await sessionManager.getMessages();
    const tools = toolRegistry.list();

    if (tools.length > 0) {
      const cfg = configManager.getConfig();
      if (cfg.streaming) {
        await runStreamingMode(messages, tools, sessionManager, apiClient, toolExecutor);
      } else {
        let result = await apiClient.generateWithTools(messages, tools);

      if (DEBUG) {
        output("[DEBUG] Initial generateWithTools result:");
        output(JSON.stringify(result, null, 2));
        output("[DEBUG] Messages before tool loop:");
        output(JSON.stringify(messages, null, 2));
      }

      if (result.reasoningContent) {
        output("[thinking process]");
        output(result.reasoningContent);
        output("[eot]");
        output("");
      }

      while (result.toolCalls.length > 0) {
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

        const toolCallRequests = result.toolCalls.map((tc) => ({
          id: tc.id,
          name: tc.name,
          arguments: tc.arguments,
        }));

        const results = await toolExecutor.executeAll(toolCallRequests);

        for (const tcResult of results) {
          const toolName = toolCallRequests.find((t) => t.id === tcResult.id)?.name || "";
          const toolContent = tcResult.result.content || "";

          if (toolName === "bash_tool" && toolContent) {
            const lines = toolContent.split("\n");
            output(`[${toolName}]`);
            for (const line of lines) {
              output(`> ${line}`);
            }
            output("[called]");
          } else if (toolName === "run_bash" && toolContent) {
            const lines = toolContent.split("\n");
            output(`[run_bash]`);
            for (const line of lines) {
              output(`> ${line}`);
            }
            output("[called]");
          } else {
            output(`[${toolName}]`);
            if (toolContent) {
              output(toolContent);
            } else if (tcResult.result.error) {
              output(`Error: ${tcResult.result.error}`);
            } else {
              output("(done)");
            }
            output("[called]");
          }

          const toolMessage = new MessageBuilder()
            .setRole(MessageRole.Tool)
            .setContent(tcResult.result.content)
            .setToolCall(tcResult.id, toolName)
            .build();

          sessionManager.addMessage(toolMessage);
        }

        if (DEBUG) {
          const currentSession = sessionManager.getCurrentSession();
          output("[DEBUG] Tool results:");
          output(JSON.stringify(results, null, 2));
          output("[DEBUG] Messages after tool execution:");
          output(JSON.stringify(currentSession?.messages, null, 2));
        }

        const currentSession = sessionManager.getCurrentSession();
        const updatedMessages = currentSession?.messages || [];
        result = await apiClient.generateWithTools(updatedMessages, tools);

        if (result.reasoningContent) {
          output("[thinking process]");
          output(result.reasoningContent);
          output("[eot]");
          output("");
        }

        if (DEBUG) {
          output("[DEBUG] Next generateWithTools result:");
          output(JSON.stringify(result, null, 2));
        }
      }

      const assistantMessage = new MessageBuilder()
        .setRole(MessageRole.Assistant)
        .setContent(result.content)
        .build();

      sessionManager.addMessage(assistantMessage);
      output(result.content);
      output("");
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
        output("");
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

  rl.on("line", async (line: string) => {
    if (currentMode === "config") {
      handleConfigInput(rl, line);
      return;
    }

    if (currentMode === "kitten") {
      handleKittenInput(rl, line);
      return;
    }

    const trimmed = line.trim();

    if (!trimmed) {
      rl.prompt();
      return;
    }

    if (trimmed === "/config") {
      const cfg = configManager.getConfig();
      output("Current configuration:");
      output(`  model: ${cfg.model}`);
      output(`  maxTokens: ${cfg.maxTokens}`);
      output(`  temperature: ${cfg.temperature}`);
      output(`  compressTokenThreshold: ${cfg.compressTokenThreshold}`);
      output(`  compressPreserveRecent: ${cfg.compressPreserveRecent}`);
      output(`  compressMaxChunkTokens: ${cfg.compressMaxChunkTokens}`);
      output(`  historyPath: ${cfg.historyPath}`);
      output(`  streaming: ${cfg.streaming}`);
      output("");
      output("Enter key=value to set, key to view, e to exit.");
      enterMode(rl, "config");
      return;
    }

    if (trimmed === "/kitten") {
      output("Kitten configuration:");
      output("  apiKeyEnv: DEEPSEEK_API_KEY");
      output("  baseUrl: https://api.deepseek.com");
      output("  model: deepseek-chat");
      output("");
      output("Enter key=value to set, e to exit.");
      enterMode(rl, "kitten");
      return;
    }

    if (slashHandler.handle(trimmed)) {
      rl.prompt();
      return;
    }

    await handleUserInput(trimmed);
    rl.prompt();
  });

  rl.on("close", () => {
    output("Goodbye!");
    process.exit(0);
  });

  rl.prompt();
}

main().catch((err) => {
  error(`Fatal error: ${err}`);
  process.exit(1);
});
