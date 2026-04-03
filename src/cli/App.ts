import blessed from 'blessed';
import { ConfigManager } from '../core/ConfigManager.js';
import { ModelService } from '../services/ModelService.js';
import { SessionStore } from '../core/SessionStore.js';

export class App {
  private screen: blessed.Widgets.Screen;
  private inputBox: blessed.Widgets.TextboxElement;
  private outputBox: blessed.Widgets.BoxElement;
  private statusBar: blessed.Widgets.BoxElement;
  
  private configManager: ConfigManager;
  private modelService: ModelService;
  private sessionStore: SessionStore;

  constructor(configManager: ConfigManager, modelService: ModelService, sessionStore: SessionStore) {
    this.configManager = configManager;
    this.modelService = modelService;
    this.sessionStore = sessionStore;

    // 创建屏幕
    this.screen = blessed.screen({
      smartCSR: true,
      title: 'CATLI - 简约开发助手',
      cursor: {
        artificial: true,
        shape: 'line',
        blink: true,
        color: 'white'
      }
    });

    // 输出区域（对话历史）
    this.outputBox = blessed.box({
      top: 0,
      left: 0,
      width: '100%',
      height: '90%',
      scrollable: true,
      alwaysScroll: true,
      scrollbar: {
        ch: ' ',
        track: {
          bg: 'gray'
        },
        style: {
          bg: 'white'
        }
      },
      keys: true,
      mouse: true,
      border: {
        type: 'line'
      },
      style: {
        fg: 'white',
        bg: 'black',
        border: {
          fg: 'gray'
        }
      }
    });

    // 输入区域
    this.inputBox = blessed.textbox({
      bottom: 2,
      left: 0,
      width: '100%',
      height: 3,
      inputOnFocus: true,
      border: {
        type: 'line'
      },
      style: {
        fg: 'white',
        bg: 'black',
        border: {
          fg: 'blue'
        },
        focus: {
          border: {
            fg: 'cyan'
          }
        }
      }
    });

    // 状态栏
    this.statusBar = blessed.box({
      bottom: 0,
      left: 0,
      width: '100%',
      height: 2,
      border: {
        type: 'line'
      },
      style: {
        fg: 'white',
        bg: 'blue',
        border: {
          fg: 'blue'
        }
      }
    });

    // 添加到屏幕
    this.screen.append(this.outputBox);
    this.screen.append(this.inputBox);
    this.screen.append(this.statusBar);

    // 绑定事件
    this.inputBox.on('submit', this.onSubmit.bind(this));
    this.screen.key(['escape', 'q', 'C-c'], () => process.exit(0));
    this.screen.key(['up', 'down'], this.onScroll.bind(this));

    // 初始状态
    this.updateStatusBar();
    this.welcomeMessage();
  }

  private welcomeMessage(): void {
    this.addOutput('CATLI', 'system');
    this.addOutput('简约开发助手 v0.1.0', 'system');
    this.addOutput('输入 /help 查看帮助，输入 /config 查看配置', 'system');
    this.addOutput('按 Ctrl+C 或输入 /exit 退出', 'system');
    this.addOutput('', 'system');
    
    if (!this.modelService.isConfigured()) {
      this.addOutput('警告: DeepSeek API密钥未配置。使用 /config 命令设置。', 'system');
    }
  }

  private async onSubmit(value: string): Promise<void> {
    this.inputBox.clearValue();
    this.inputBox.focus();
    this.screen.render();

    if (!value.trim()) return;

    // 处理命令
    if (value.startsWith('/')) {
      await this.handleCommand(value);
      return;
    }

    // 用户输入
    this.addOutput(value, 'user');
    this.sessionStore.addMessage('user', value);

    // AI响应
    await this.streamAIResponse();
  }

  private async handleCommand(command: string): Promise<void> {
    const parts = command.split(' ');
    const cmd = parts[0].toLowerCase();

    switch (cmd) {
      case '/help':
        this.showHelp();
        break;
      case '/config':
        this.showConfig();
        break;
      case '/clear':
        this.clearConversation();
        break;
      case '/exit':
        process.exit(0);
        break;
      default:
        this.addOutput(`未知命令: ${cmd}。使用 /help 查看可用命令。`, 'system');
    }
  }

  private showHelp(): void {
    this.addOutput('可用命令:', 'system');
    this.addOutput('  /help     显示帮助信息', 'system');
    this.addOutput('  /config   显示当前配置', 'system');
    this.addOutput('  /clear    清空当前对话', 'system');
    this.addOutput('  /exit     退出程序', 'system');
    this.addOutput('', 'system');
  }

  private showConfig(): void {
    const config = this.configManager.load();
    const apiKey = config.apiKey 
      ? `${config.apiKey.substring(0, 8)}...` 
      : '未设置';
    
    this.addOutput('当前配置:', 'system');
    this.addOutput(`  模型: ${config.model}`, 'system');
    this.addOutput(`  API密钥: ${apiKey}`, 'system');
    this.addOutput(`  温度: ${config.temperature}`, 'system');
    this.addOutput(`  最大token: ${config.maxTokens}`, 'system');
    this.addOutput('', 'system');
  }

  private clearConversation(): void {
    this.sessionStore.clearSession();
    this.outputBox.setContent('');
    this.addOutput('对话已清空', 'system');
  }

  private async streamAIResponse(): Promise<void> {
    const messages = this.sessionStore.getMessages();
    
    // 准备流式响应
    const stream = this.modelService.streamChat(messages);
    
    let fullResponse = '';
    let currentLine = '';

    this.addOutput('', 'assistant');

    for await (const chunk of stream) {
      if (chunk.error) {
        this.addOutput(`错误: ${chunk.content}`, 'system');
        break;
      }

      if (chunk.content) {
        fullResponse += chunk.content;
        
        // 逐字符显示，模拟流式效果
        for (const char of chunk.content) {
          currentLine += char;
          
          // 换行处理
          if (char === '\n') {
            this.addOutput(currentLine, 'assistant', true);
            currentLine = '';
          }
        }
        
        // 更新当前行
        if (currentLine) {
          this.addOutput(currentLine, 'assistant', true);
        }
        
        this.screen.render();
      }

      if (chunk.done) {
        if (currentLine) {
          this.addOutput('', 'assistant');
        }
        
        // 保存完整响应到会话
        if (fullResponse) {
          this.sessionStore.addMessage('assistant', fullResponse);
        }
        
        this.updateStatusBar();
        break;
      }
    }
  }

  private addOutput(content: string, type: 'user' | 'assistant' | 'system', append = false): void {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = type === 'user' ? '{cyan-fg}你{/}' :
                  type === 'assistant' ? '{green-fg}AI{/}' :
                  '{yellow-fg}系统{/}';
    
    const line = `${prefix} [${timestamp}]: ${content}`;
    
    if (append) {
      // 追加到最后一行的末尾
      const currentContent = this.outputBox.getContent();
      const lines = currentContent.split('\n');
      lines[lines.length - 1] = line;
      this.outputBox.setContent(lines.join('\n'));
    } else {
      this.outputBox.pushLine(line);
    }
    
    this.outputBox.scrollTo(Infinity);
    this.screen.render();
  }

  private updateStatusBar(): void {
    const config = this.configManager.load();
    const tokenCount = this.sessionStore.getTokenCount();
    const model = config.model;
    const apiConfigured = this.modelService.isConfigured() ? '✓' : '✗';
    
    const status = `模型: ${model} | Token: ${tokenCount} | API: ${apiConfigured} | 按 Esc 退出`;
    this.statusBar.setContent(status);
    this.screen.render();
  }

  private onScroll(key: string): void {
    const step = key === 'up' ? -1 : 1;
    this.outputBox.scroll(step);
    this.screen.render();
  }

  async run(): Promise<void> {
    // 创建初始会话
    this.sessionStore.createSession(process.cwd());
    
    // 聚焦输入框
    this.inputBox.focus();
    this.screen.render();
    
    // 检查API配置
    if (!this.modelService.isConfigured()) {
      this.addOutput('提示: 使用 /config 命令设置DeepSeek API密钥', 'system');
    }
  }
}