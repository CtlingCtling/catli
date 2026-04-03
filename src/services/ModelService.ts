import OpenAI from 'openai';
import { ConfigManager } from '../core/ConfigManager.js';
import { StreamResponse } from '../types/index.js';

export class ModelService {
  private configManager: ConfigManager;
  private openai: OpenAI | null = null;

  constructor() {
    this.configManager = new ConfigManager();
    this.initializeOpenAI();
  }

  private initializeOpenAI(): void {
    const config = this.configManager.load();
    const apiKey = this.configManager.getApiKey();

    if (!apiKey) {
      console.warn('DeepSeek API key not configured. Set DEEPSEEK_API_KEY environment variable.');
      return;
    }

    this.openai = new OpenAI({
      apiKey,
      baseURL: config.baseUrl
    });
  }

  async *streamChat(messages: { role: string; content: string }[]): AsyncGenerator<StreamResponse> {
    if (!this.openai) {
      yield { content: 'Error: API key not configured. Please set DEEPSEEK_API_KEY environment variable.', done: true, error: 'NO_API_KEY' };
      return;
    }

    const config = this.configManager.load();

    try {
      const stream = await this.openai.chat.completions.create({
        model: config.model,
        messages: messages.map(msg => ({
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content
        })),
        temperature: config.temperature,
        max_tokens: config.maxTokens,
        stream: true
      });

      let fullContent = '';
      
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        fullContent += content;
        
        yield {
          content,
          done: false
        };
      }

      yield {
        content: '',
        done: true
      };

    } catch (error) {
      console.error('API Error:', error);
      yield {
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        done: true,
        error: 'API_ERROR'
      };
    }
  }

  async sendMessage(messages: { role: string; content: string }[]): Promise<string> {
    if (!this.openai) {
      return 'Error: API key not configured. Please set DEEPSEEK_API_KEY environment variable.';
    }

    const config = this.configManager.load();

    try {
      const response = await this.openai.chat.completions.create({
        model: config.model,
        messages: messages.map(msg => ({
          role: msg.role as 'user' | 'assistant' | 'system',
          content: msg.content
        })),
        temperature: config.temperature,
        max_tokens: config.maxTokens,
        stream: false
      });

      return response.choices[0]?.message?.content || 'No response';
    } catch (error) {
      console.error('API Error:', error);
      return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }

  isConfigured(): boolean {
    return this.configManager.hasApiKey();
  }
}