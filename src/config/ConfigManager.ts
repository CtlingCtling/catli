import { readFileSync, writeFileSync, existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { Config, ConfigEntry, ConfigSource } from "../types/index.js";
import { defaultConfig } from "./defaultConfig.js";
import { warn as logWarn, error as logError } from "../utils/logger.js";

export class ConfigManager {
  private config: Config;
  private configPath: string;

  constructor(configPath?: string) {
    this.config = { ...defaultConfig };
    this.configPath = configPath || join(homedir(), ".catli", "config.json");
    this.load();
  }

  private load(): void {
    if (existsSync(this.configPath)) {
      try {
        const data = readFileSync(this.configPath, "utf-8");
        const fileConfig = JSON.parse(data);
        this.config = { ...defaultConfig, ...fileConfig };
      } catch {
        logWarn(`Failed to load config from ${this.configPath}, using defaults`);
      }
    }

    if (process.env.DEEPSEEK_API_KEY) {
      this.config.apiKey = process.env.DEEPSEEK_API_KEY;
    }
  }

  save(): void {
    try {
      const dir = this.configPath.substring(0, this.configPath.lastIndexOf("/"));
      if (!existsSync(dir)) {
        require("fs").mkdirSync(dir, { recursive: true });
      }
      writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
    } catch (err) {
      logError(`Failed to save config: ${err}`);
    }
  }

  get<K extends keyof Config>(key: K): ConfigEntry<Config[K]> {
    let source: ConfigSource = { default: true };

    if (process.env[key === "apiKey" ? "DEEPSEEK_API_KEY" : ""]) {
      source = { env: true };
    } else if (existsSync(this.configPath)) {
      source = { file: true };
    }

    return { value: this.config[key], source };
  }

  set<K extends keyof Config>(key: K, value: Config[K]): void {
    this.config[key] = value;
    this.save();
  }

  getApiKey(): string {
    return this.config.apiKey;
  }

  getConfig(): Config {
    return { ...this.config };
  }
}
