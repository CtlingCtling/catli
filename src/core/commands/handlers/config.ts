import { Command } from "../CommandRegistry.js";
import { ConfigManager } from "../../../config/ConfigManager.js";
import { output } from "../../../utils/logger.js";
import { setInnerMode } from "../../../cli.js";
import * as readline from "readline";

export function createConfigCommand(configManager: ConfigManager): Command {
  return {
    name: "config",
    description: "View and modify configuration",
    execute: async (): Promise<boolean> => {
      const config = configManager.getConfig();

      output("Current configuration:");
      output(`  model: ${config.model}`);
      output(`  maxTokens: ${config.maxTokens}`);
      output(`  temperature: ${config.temperature}`);
      output(`  compressionThreshold: ${config.compressionThreshold}`);
      output(`  historyPath: ${config.historyPath}`);
      output("");
      output("Enter key=value to set, key to view, e to exit.");

      setInnerMode(true);

      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      const ask = (): Promise<string> => {
        return new Promise((resolve) => {
          rl.question("confi> ", (answer) => {
            resolve(answer.trim());
          });
        });
      };

      try {
        while (true) {
          const input = await ask();

          if (input === "e" || input === "exit") {
            output("Exiting config mode.");
            break;
          }

          if (!input) {
            output("Exiting config mode.");
            break;
          }

          if (!input.includes("=")) {
            if (input === "model") {
              output(`  model: ${config.model}`);
            } else if (input === "maxTokens") {
              output(`  maxTokens: ${config.maxTokens}`);
            } else if (input === "temperature") {
              output(`  temperature: ${config.temperature}`);
            } else if (input === "compressionThreshold") {
              output(`  compressionThreshold: ${config.compressionThreshold}`);
            } else if (input === "historyPath") {
              output(`  historyPath: ${config.historyPath}`);
            } else {
              output(`Unknown config key: ${input}`);
            }
            continue;
          }

          const [key, ...valueParts] = input.split("=");
          const value = valueParts.join("=").trim();
          const keyTrimmed = key.trim();

          if (!value) {
            output("Usage: <key>=<value>");
            continue;
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
          } else if (keyTrimmed === "compressionThreshold") {
            const num = parseInt(value, 10);
            if (isNaN(num)) {
              output("compressionThreshold must be a number");
            } else {
              configManager.set("compressionThreshold", num);
              output(`Updated: compressionThreshold = ${num}`);
            }
          } else if (keyTrimmed === "historyPath") {
            configManager.set("historyPath", value);
            output(`Updated: historyPath = ${value}`);
          } else {
            output(`Unknown config key: ${keyTrimmed}`);
          }
        }
      } finally {
        rl.close();
        setInnerMode(false);
      }

      return true;
    },
  };
}
