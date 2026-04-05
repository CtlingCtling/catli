import { Tool, ToolResult } from "../../../types/tool.js";
import { output } from "../../../utils/logger.js";

export const QuestionTool: Tool = {
  name: "question",
  description: "Ask a question to the user and wait for their response",
  parameters: [
    {
      name: "question",
      description: "The question to ask the user",
      type: "string",
      required: true,
    },
  ],
  execute: async (params: Record<string, unknown>): Promise<ToolResult> => {
    try {
      const question = params.question as string;
      if (!question) {
        return { success: false, content: "", error: "question is required" };
      }

      output(`[Question] ${question}`);

      return {
        success: true,
        content: "Question asked. User will respond in the next input.",
      };
    } catch (err) {
      const error = err as Error;
      return { success: false, content: "", error: error.message };
    }
  },
};
