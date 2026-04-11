export interface KittenConfig {
  baseUrl: string;
  model: string;
  apiKeyEnv: string;
}

export class KittenConfigManager {
  config: KittenConfig = {
    baseUrl: process.env.KITTEN_BASE_URL || "https://api.deepseek.com",
    model: process.env.KITTEN_MODEL || "deepseek-chat",
    apiKeyEnv: process.env.KITTEN_API_KEY_ENV || "DEEPSEEK_API_KEY",
  };

  getConfig(): KittenConfig {
    return { ...this.config };
  }

  setConfig(partial: Partial<KittenConfig>): void {
    this.config = { ...this.config, ...partial };
  }

  getApiKey(): string | undefined {
    return process.env[this.config.apiKeyEnv];
  }
}