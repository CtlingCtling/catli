# CATLI - 简约开发助手

基于ClaudeCode深度定制，专注于开发助手的简约实现。

## 架构特点

1. **放弃React依赖**：使用轻量CLI库（blessed）+ 纯文本混合方案
2. **深度复用ClaudeCode工具系统**：复制核心工具实现
3. **12个核心命令**：深度实现，不追求插件化扩展
4. **你的特色功能集成**：MIND.md思考中枢、knowledge知识库、kitten内部模块
5. **三阶段开发**：流式对话核心 → 工具系统集成 → 特色功能完善

## 第一阶段：流式对话核心（当前进度）

### 已完成
- ✅ 项目初始化（TypeScript配置、目录结构）
- ✅ 配置管理系统（`ConfigManager`）
- ✅ 会话管理系统（`SessionStore`）
- ✅ DeepSeek流式API客户端（`ModelService`）
- ✅ CLI框架和三种运行模式（交互、单次、命令）
- ✅ 交互式界面（blessed库）

### 使用方法

#### 安装依赖
```bash
cd /path/to/catli
npm install
```

#### 配置API密钥
```bash
# 启动交互模式，使用/config命令
catli
# 然后在界面中输入 /config
```

或者直接编辑配置文件：
```bash
# 编辑 ~/.catli/settings.json
{
  "apiKey": "your-deepseek-api-key",
  "model": "deepseek-chat",
  "baseUrl": "https://api.deepseek.com",
  "temperature": 0.7,
  "maxTokens": 4096
}
```

#### 三种运行模式
1. **交互模式**（默认）：
   ```bash
   catli
   ```

2. **单次执行模式**：
   ```bash
   catli --exec "帮我分析项目结构"
   ```

3. **命令模式**：
   ```bash
   catli /help
   catli /config
   ```

### 交互模式快捷键
- `Enter`：提交输入
- `Esc` 或 `q`：退出程序
- `Ctrl+C`：强制退出
- 上下箭头：滚动对话历史

## 开发计划

### 第一阶段：流式对话核心（3-4天）✅ 完成
- 分析DeepSeek流式API，实现流式对话函数
- 设计轻量CLI架构（blessed库），三种运行模式
- 集成流式响应显示，基础会话管理

### 第二阶段：工具系统集成（4-5天）
- 复制ClaudeCode的Tool.ts，实现工具构建系统
- 实现2-3个核心工具（FileRead, Bash, Grep）
- 集成工具调用机制，实现AI工具使用
- 实现.catli/目录结构完整配置

### 第三阶段：特色功能完善（5-6天）
- 实现所有12个命令
- 完成知识管理系统（/knowledge, /mind, /refine）
- 实现kitten子agent（简单CLI调用）
- 完整测试和文档

## 项目结构
```
catli/
├── src/
│   ├── cli/          # CLI框架
│   ├── core/         # 核心框架
│   ├── services/     # 服务层
│   ├── utils/        # 工具函数
│   └── types/        # 类型定义
├── .catli/           # 用户配置目录
│   └── settings.json # 配置文件
├── package.json
└── tsconfig.json
```

## 技术栈
- **语言**: TypeScript
- **CLI框架**: blessed + commander
- **AI集成**: OpenAI SDK（兼容DeepSeek API）
- **构建工具**: tsc + tsx

## 许可证
MIT