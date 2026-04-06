import { Command } from "../CommandRegistry.js";
import { output } from "../../../utils/logger.js";
import { KittenConfigManager } from "../../kitten/KittenConfig.js";
import { setInnerMode } from "../../../cli.js";
import * as readline from "readline";

export function createKittenCommand(): Command {
  return {
    name: "kitten",
    description: "Configure kitten AI settings",
    execute: async (): Promise<boolean> => {
      const manager = KittenConfigManager.getInstance();
      const config = manager.getConfig();

      output("Kitten configuration:");
      output(`  baseUrl: ${config.baseUrl}`);
      output(`  model: ${config.model}`);
      output(`  apiKeyEnv: ${config.apiKeyEnv}`);
      output("");
      output("Enter key=value to set, key to view, e to exit.");

      setInnerMode(true);

      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      const ask = (): Promise<string> => {
        return new Promise((resolve) => {
          rl.question("kitty> ", (answer) => {
            resolve(answer.trim());
          });
        });
      };

      try {
        while (true) {
          const input = await ask();

          if (input === "e" || input === "exit") {
            output("Exiting kitten config mode.");
            break;
          }

          if (!input) {
            output("Exiting kitten config mode.");
            break;
          }

          if (!input.includes("=")) {
            if (input === "baseUrl") {
              output(`  baseUrl: ${config.baseUrl}`);
            } else if (input === "model") {
              output(`  model: ${config.model}`);
            } else if (input === "apiKeyEnv") {
              output(`  apiKeyEnv: ${config.apiKeyEnv}`);
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

          if (keyTrimmed === "baseUrl") {
            manager.setConfig({ baseUrl: value });
            config.baseUrl = value;
            output(`Updated: baseUrl = ${value}`);
          } else if (keyTrimmed === "model") {
            manager.setConfig({ model: value });
            config.model = value;
            output(`Updated: model = ${value}`);
          } else if (keyTrimmed === "apiKeyEnv") {
            manager.setConfig({ apiKeyEnv: value });
            config.apiKeyEnv = value;
            output(`Updated: apiKeyEnv = ${value}`);
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
