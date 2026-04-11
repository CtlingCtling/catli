import { Config } from "../types/index.js";

export const defaultConfig: Config = {
  model: "deepseek-chat",
  apiKey: "",
  baseUrl: "https://api.deepseek.com",
  maxTokens: 4096,
  temperature: 0.7,
  compressTokenThreshold: 6000,
  compressPreserveRecent: 2000,
  compressMaxChunkTokens: 1500,
  streaming: false,
};
