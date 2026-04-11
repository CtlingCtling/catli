export interface Config {
  model: string;
  apiKey: string;
  baseUrl: string;
  maxTokens: number;
  temperature: number;
  compressTokenThreshold: number;
  compressPreserveRecent: number;
  compressMaxChunkTokens: number;
  streaming: boolean;
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
