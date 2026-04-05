import { readFileSync } from "fs";
import { Tool, ToolResult } from "../../../types/tool.js";

export const ReadFileTool: Tool = {
  name: "read_file",
  description: "Read the contents of a file from the filesystem",
  parameters: [
    {
      name: "filePath",
      description: "The path to the file to read",
      type: "string",
      required: true,
    },
  ],
  execute: async (params: Record<string, unknown>): Promise<ToolResult> => {
    try {
      const filePath = params.filePath as string;
      if (!filePath) {
        return { success: false, content: "", error: "filePath is required" };
      }

      const content = readFileSync(filePath, "utf-8");
      return { success: true, content };
    } catch (err) {
      const error = err as Error;
      return { success: false, content: "", error: error.message };
    }
  },
};
