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
      
      // 合并默认配置，确保所有字段存在，但不包含apiKey（从环境变量读取）
      const { apiKey, ...fileConfig } = config;
      return { ...this.getDefaultConfig(), ...fileConfig };
    } catch (error) {
      console.error('Failed to load config:', error);
      return this.getDefaultConfig();
    }
  }

  save(config: Partial<Config>): void {
    this.ensureConfigDir();
    
    try {
      const currentConfig = this.load();
      // 保存时排除apiKey字段
      const { apiKey, ...configToSave } = config;
      const newConfig = { ...currentConfig, ...configToSave };
      writeFileSync(this.configPath, JSON.stringify(newConfig, null, 2), 'utf-8');
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  }

  getApiKey(): string | undefined {
    // 优先从环境变量读取
    if (process.env.DEEPSEEK_API_KEY) {
      return process.env.DEEPSEEK_API_KEY;
    }
    
    // 其次从配置文件读取（向后兼容）
    const config = this.load();
    return config.apiKey;
  }

  hasApiKey(): boolean {
    return !!this.getApiKey();
  }
}