import { readFileSync, writeFileSync } from "fs";
import { Tool, ToolResult } from "../../../types/tool.js";

export const ReplaceTextTool: Tool = {
  name: "replace_text",
  description: "Replace text in a file",
  parameters: [
    {
      name: "filePath",
      description: "The path to the file",
      type: "string",
      required: true,
    },
    {
      name: "oldText",
      description: "The text to find and replace",
      type: "string",
      required: true,
    },
    {
      name: "newText",
      description: "The replacement text",
      type: "string",
      required: true,
    },
  ],
  execute: async (params: Record<string, unknown>): Promise<ToolResult> => {
    try {
      const filePath = params.filePath as string;
      const oldText = params.oldText as string;
      const newText = params.newText as string;

      if (!filePath) {
        return { success: false, content: "", error: "filePath is required" };
      }
      if (!oldText) {
        return { success: false, content: "", error: "oldText is required" };
      }
      if (!newText) {
        return { success: false, content: "", error: "newText is required" };
      }

      const content = readFileSync(filePath, "utf-8");

      if (!content.includes(oldText)) {
        return { success: false, content: "", error: `Text not found: ${oldText}` };
      }

      const lines = content.split("\n");
      let matchLineIndex = -1;
      const matchLines: string[] = oldText.split("\n");

      for (let i = 0; i < lines.length; i++) {
        const lineCheck = lines.slice(i, i + matchLines.length).join("\n");
        if (lineCheck === oldText) {
          matchLineIndex = i;
          break;
        }
      }

      if (matchLineIndex === -1) {
        return { success: false, content: "", error: `Text not found: ${oldText}` };
      }

      const newContent = content.replace(oldText, newText);
      writeFileSync(filePath, newContent, "utf-8");

      const diffLines: string[] = [];
      for (let i = 0; i < matchLines.length; i++) {
        const ln = matchLineIndex + i + 1;
        diffLines.push(`${ln} - ${matchLines[i]}`);
      }
      const newLines = newText.split("\n");
      for (let i = 0; i < newLines.length; i++) {
        const ln = matchLineIndex + i + 1;
        diffLines.push(`${ln} + ${newLines[i]}`);
      }

      return { success: true, content: diffLines.join("\n") };
    } catch (err) {
      const error = err as Error;
      return { success: false, content: "", error: error.message };
    }
  },
};
