import { Config } from "../types/index.js";

export const defaultConfig: Config = {
  model: "deepseek-chat",
  apiKey: "",
  baseUrl: "https://api.deepseek.com",
  historyPath: "./sessions",
  compressionThreshold: 100,
  maxTokens: 4096,
  temperature: 0.7,
};
