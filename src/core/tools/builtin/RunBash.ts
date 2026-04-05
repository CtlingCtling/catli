import { exec } from "child_process";
import { promisify } from "util";
import { Tool, ToolResult } from "../../../types/tool.js";

const execAsync = promisify(exec);

export const RunBashTool: Tool = {
  name: "run_bash",
  description: "Execute a bash command and return its output",
  parameters: [
    {
      name: "command",
      description: "The bash command to execute",
      type: "string",
      required: true,
    },
  ],
  execute: async (params: Record<string, unknown>): Promise<ToolResult> => {
    try {
      const command = params.command as string;
      if (!command) {
        return { success: false, content: "", error: "command is required" };
      }

      const { stdout, stderr } = await execAsync(command, { timeout: 30000 });
      const output = stderr ? `stdout: ${stdout}\nstderr: ${stderr}` : stdout;
      return { success: true, content: output };
    } catch (err) {
      const error = err as Error;
      return { success: false, content: "", error: error.message };
    }
  },
};
