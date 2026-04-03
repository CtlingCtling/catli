import { Config } from '../types/index.js';
import { homedir } from 'os';
import { join } from 'path';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';

export class ConfigManager {
  private configDir: string;
  private configPath: string;

  constructor() {
    this.configDir = join(homedir(), '.catli');
    this.configPath = join(this.configDir, 'settings.json');
  }

  private ensureConfigDir(): void {
    if (!existsSync(this.configDir)) {
      mkdirSync(this.configDir, { recursive: true });
    }
  }

  getDefaultConfig(): Config {
    return {
      model: 'deepseek-chat',
      baseUrl: 'https://api.deepseek.com',
      temperature: 0.7,
      maxTokens: 4096
    };
  }

  load(): Config {
    this.ensureConfigDir();
    
    if (!existsSync(this.configPath)) {
      // 文件不存在，只返回默认配置，不保存
      return this.getDefaultConfig();
    }

    try {
      const content = readFileSync(this.configPath, 'utf-8');
      const config = JSON.parse(content);
      
      // 合并默认配置，确保所有字段存在
      return { ...this.getDefaultConfig(), ...config };
    } catch (error) {
      console.error('Failed to load config:', error);
      return this.getDefaultConfig();
    }
  }

  save(config: Partial<Config>): void {
    this.ensureConfigDir();
    
    try {
      const currentConfig = this.load();
      const newConfig = { ...currentConfig, ...config };
      writeFileSync(this.configPath, JSON.stringify(newConfig, null, 2), 'utf-8');
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  }

  getApiKey(): string | undefined {
    const config = this.load();
    return config.apiKey;
  }

  setApiKey(apiKey: string): void {
    this.save({ apiKey });
  }
}