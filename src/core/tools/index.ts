import { ToolRegistry, ToolExecutor } from "./ToolRegistry.js";
import { ReadFileTool } from "./builtin/ReadFile.js";
import { WriteFileTool } from "./builtin/WriteFile.js";
import { RunBashTool } from "./builtin/RunBash.js";
import { QuestionTool } from "./builtin/Question.js";
import { Tool } from "../../types/tool.js";

export function createToolRegistry(): ToolRegistry {
  const registry = new ToolRegistry();

  const builtinTools: Tool[] = [
    ReadFileTool,
    WriteFileTool,
    RunBashTool,
    QuestionTool,
  ];

  for (const tool of builtinTools) {
    registry.register(tool);
  }

  return registry;
}

export { ToolRegistry, ToolExecutor };
