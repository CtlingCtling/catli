#!/usr/bin/env node

import { Command } from 'commander';
import { renderApp } from './App.js';
import { ModelService } from '../services/ModelService.js';
import { SessionStore } from '../core/SessionStore.js';
import { ConfigManager } from '../core/ConfigManager.js';
import pkg from '../../package.json' with { type: 'json' };
const { version } = pkg;

const program = new Command();

program
  .name('catli')
  .description('CATLI - 简约开发助手')
  .version(version)
  .option('--exec <prompt>', '执行单次任务后退出')
  .option('--session <id>', '加载指定会话')
  .option('--config <path>', '指定配置文件路径')
  .option('--json', '输出JSON格式（仅命令模式）')
  .option('--version', '显示版本信息')
  .option('--help', '显示帮助信息');

program.parse();

const options = program.opts();

async function main() {
  const configManager = new ConfigManager();
  const sessionStore = new SessionStore();
  const modelService = new ModelService();

  // 三种运行模式
  if (options.exec) {
    // 单次执行模式
    await runSingleExecution(options.exec, modelService, sessionStore);
  } else if (program.args.length > 0 && program.args[0].startsWith('/')) {
    // 命令模式
    await runCommandMode(program.args[0], configManager, sessionStore);
  } else {
    // 交互模式
    await runInteractiveMode(configManager, modelService, sessionStore);
  }
}

async function runSingleExecution(prompt: string, modelService: ModelService, sessionStore: SessionStore) {
  console.log(`执行任务: ${prompt}\n`);
  
  sessionStore.createSession(process.cwd());
  sessionStore.addMessage('user', prompt);
  
  const messages = sessionStore.getMessages();
  const response = await modelService.sendMessage(messages);
  
  console.log(response);
  process.exit(0);
}

async function runCommandMode(command: string, configManager: ConfigManager, _sessionStore: SessionStore) {
  // 第一阶段只实现/help命令
  if (command === '/help') {
    showHelp();
  } else if (command === '/config') {
    const config = configManager.load();
    console.log('当前配置:');
    console.log(JSON.stringify(config, null, 2));
  } else {
    console.log(`未知命令: ${command}`);
    console.log('使用 /help 查看可用命令');
  }
  process.exit(0);
}

async function runInteractiveMode(configManager: ConfigManager, modelService: ModelService, sessionStore: SessionStore) {
  await renderApp({ configManager, modelService, sessionStore });
}

function showHelp() {
  console.log('CATLI - 简约开发助手');
  console.log('使用方法:');
  console.log('  catli                    # 交互模式');
  console.log('  catli --exec "任务"      # 单次执行模式');
  console.log('  catli /help              # 命令模式');
  console.log('');
  console.log('可用命令:');
  console.log('  /help     显示帮助信息');
  console.log('  /config   显示当前配置');
  console.log('');
  console.log('配置目录: ~/.catli/settings.json');
}

main().catch(error => {
  console.error('程序错误:', error);
  process.exit(1);
});