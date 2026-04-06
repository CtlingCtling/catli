export interface Config {
  model: string;
  apiKey: string;
  baseUrl: string;
  historyPath: string;
  maxTokens: number;
  temperature: number;
  compressTokenThreshold: number;
  compressPreserveRecent: number;
  compressMaxChunkTokens: number;
}

export interface ConfigSource {
  env?: boolean;
  file?: boolean;
  default?: boolean;
}

export interface ConfigEntry<T> {
  value: T;
  source: ConfigSource;
}
