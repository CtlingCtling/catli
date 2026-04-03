import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
void React;
import { Box, Text, useInput, useApp, Spacer } from 'ink';
import { ConfigManager } from '../core/ConfigManager.js';
import { ModelService } from '../services/ModelService.js';
import { SessionStore } from '../core/SessionStore.js';
import type { Message } from '../types/index.js';

interface AppProps {
  configManager: ConfigManager;
  modelService: ModelService;
  sessionStore: SessionStore;
}

export function App({ configManager, modelService, sessionStore }: AppProps) {
  const { exit } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('Ready');

  // 加载初始会话
  useEffect(() => {
    sessionStore.createSession(process.cwd());
    const sessionMessages = sessionStore.getMessages();
    setMessages(sessionMessages);
    updateStatus();

    // 添加欢迎消息
    if (sessionMessages.length === 0) {
      const welcomeMsg = {
        role: 'system' as const,
        content: 'CATLI - Simple Dev Assistant v0.1.0\nType /help for help, /config to view configuration\nPress Esc to exit',
        timestamp: new Date()
      };
      setMessages([welcomeMsg]);
    }

    // 检查API配置
    if (!modelService.isConfigured()) {
      const warningMsg = {
        role: 'system' as const,
        content: 'Warning: DeepSeek API key not configured. Set DEEPSEEK_API_KEY environment variable or use /config command.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, warningMsg]);
    }
  }, []);

  const updateStatus = () => {
    const config = configManager.load();
    const tokenCount = sessionStore.getTokenCount();
    const apiConfigured = modelService.isConfigured() ? 'Y' : 'N';
    setStatus(`Model: ${config.model} | Token: ${tokenCount} | API: ${apiConfigured}`);
  };

  const handleSubmit = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userInput = input.trim();

    // 处理命令
    if (userInput.startsWith('/')) {
      const parts = userInput.split(' ');
      const command = parts[0].toLowerCase();
      setInput('');
      
      switch (command) {
        case '/help':
          setMessages(prev => [...prev, {
            role: 'system',
            content: 'Available commands:\n  /help     Show help\n  /config   Show configuration\n  /clear    Clear conversation\n  /exit     Exit program',
            timestamp: new Date()
          }]);
          return;
        case '/config':
          const config = configManager.load();
          const apiKey = configManager.getApiKey();
          let apiKeyDisplay = 'not set';
          if (apiKey) {
            apiKeyDisplay = process.env.DEEPSEEK_API_KEY ? 
              `${apiKey.substring(0, 8)}... (from env)` :
              `${apiKey.substring(0, 8)}... (from config)`;
          }
          setMessages(prev => [...prev, {
            role: 'system',
            content: `Current configuration:\n  Model: ${config.model}\n  API Key: ${apiKeyDisplay}\n  Temperature: ${config.temperature}\n  Max tokens: ${config.maxTokens}\n  Base URL: ${config.baseUrl}`,
            timestamp: new Date()
          }]);
          return;
        case '/clear':
          sessionStore.clearSession();
          setMessages([]);
          setMessages(prev => [...prev, { role: 'system', content: 'Conversation cleared', timestamp: new Date() }]);
          return;
        case '/exit':
          exit();
          return;
        default:
          setMessages(prev => [...prev, {
            role: 'system',
            content: `Unknown command: ${command}. Use /help for help.`,
            timestamp: new Date()
          }]);
          return;
      }
    }
    setInput('');
    setIsLoading(true);
    setStatus('Thinking...');

    // 添加用户消息
    sessionStore.addMessage('user', userInput);
    const userMessage: Message = { role: 'user', content: userInput, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);

    try {
      const stream = modelService.streamChat(sessionStore.getMessages());
      let fullResponse = '';
      let assistantMessage: Message = { role: 'assistant', content: '', timestamp: new Date() };

      for await (const chunk of stream) {
        if (chunk.error) {
          setStatus(`Error: ${chunk.content}`);
          break;
        }

        if (chunk.content) {
          fullResponse += chunk.content;
          assistantMessage.content = fullResponse;
          // 更新最后一条消息
          setMessages(prev => {
            const newMessages = [...prev];
            const lastIndex = newMessages.length - 1;
            if (lastIndex >= 0 && newMessages[lastIndex].role === 'assistant') {
              newMessages[lastIndex] = { ...assistantMessage };
            } else {
              newMessages.push({ ...assistantMessage });
            }
            return newMessages;
          });
        }

        if (chunk.done) {
          sessionStore.addMessage('assistant', fullResponse);
          setIsLoading(false);
          updateStatus();
          break;
        }
      }
    } catch (error) {
      setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsLoading(false);
    }
  }, [input, isLoading, modelService, sessionStore]);

  // 处理键盘输入
  useInput((input, key) => {
    if (key.escape) {
      exit();
    } else if (key.return) {
      handleSubmit();
    } else if (key.backspace || key.delete) {
      setInput(prev => prev.slice(0, -1));
    } else if (input && !key.ctrl && !key.meta) {
      setInput(prev => prev + input);
    }
  });

  // 渲染消息
  const renderMessage = (msg: Message, index: number) => {
    const timestamp = msg.timestamp ? msg.timestamp.toLocaleTimeString() : new Date().toLocaleTimeString();
    const prefix = msg.role === 'user' ? 'You' : msg.role === 'assistant' ? 'AI' : 'System';
    const color = msg.role === 'user' ? 'cyan' : msg.role === 'assistant' ? 'green' : 'yellow';
    
    return (
      <Box key={index} flexDirection="column" marginBottom={1}>
        <Text color={color}>
          {prefix} [{timestamp}]: {msg.content}
        </Text>
      </Box>
    );
  };



  // 检测命令
  useEffect(() => {
    if (input.startsWith('/')) {
      // 命令模式，不发送到AI
      return;
    }
  }, [input]);

  return (
    <Box flexDirection="column" height="100%">
      {/* 消息区域 */}
      <Box flexDirection="column" flexGrow={1} overflowY="hidden">
        {messages.map((msg, i) => renderMessage(msg, i))}
        {isLoading && (
          <Text color="gray">AI is thinking...</Text>
        )}
      </Box>

      {/* 状态栏 */}
      <Box borderStyle="single" borderColor="gray" paddingX={1}>
        <Text color="white">{status}</Text>
        <Spacer />
        <Text color="gray">Press Esc to exit</Text>
      </Box>

      {/* 输入区域 */}
      <Box borderStyle="single" borderColor="blue" paddingX={1}>
        <Text color="white">&gt; </Text>
        <Text color="white">{input}</Text>
        <Text color="gray" inverse>_</Text>
      </Box>
    </Box>
  );
}

// 渲染函数
export async function renderApp(props: AppProps) {
  const { render } = await import('ink');
  return render(<App {...props} />);
}