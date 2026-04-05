import { writeFileSync } from "fs";
import { Tool, ToolResult } from "../../../types/tool.js";
import { ensureDir } from "../../../utils/fs.js";

export const WriteFileTool: Tool = {
  name: "write_file",
  description: "Write content to a file, creating it if it doesn't exist",
  parameters: [
    {
      name: "filePath",
      description: "The path to the file to write",
      type: "string",
      required: true,
    },
    {
      name: "content",
      description: "The content to write to the file",
      type: "string",
      required: true,
    },
  ],
  execute: async (params: Record<string, unknown>): Promise<ToolResult> => {
    try {
      const filePath = params.filePath as string;
      const content = params.content as string;

      if (!filePath) {
        return { success: false, content: "", error: "filePath is required" };
      }
      if (content === undefined) {
        return { success: false, content: "", error: "content is required" };
      }

      ensureDir(filePath);
      writeFileSync(filePath, content, "utf-8");
      return { success: true, content: `File written successfully: ${filePath}` };
    } catch (err) {
      const error = err as Error;
      return { success: false, content: "", error: error.message };
    }
  },
};
