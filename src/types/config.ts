export interface Config {
  model: string;
  apiKey: string;
  baseUrl: string;
  historyPath: string;
  compressionThreshold: number;
  maxTokens: number;
  temperature: number;
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
