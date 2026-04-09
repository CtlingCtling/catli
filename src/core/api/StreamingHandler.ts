import { DeepSeekClient } from "./DeepSeekClient.js";
import { MessageBuilder, MessageRole } from "../../types/message.js";
import { output } from "../../utils/logger.js";
import { SessionManager } from "../session/SessionManager.js";
import { ToolExecutor } from "../tools/index.js";

export async function runStreamingMode(
  messages: Awaited<ReturnType<SessionManager["getMessages"]>>,
  tools: any[],
  sessionManager: SessionManager,
  apiClient: DeepSeekClient,
  toolExecutor: ToolExecutor
): Promise<void> {
  for await (const chunk of apiClient.generateWithToolsStream(messages, tools)) {
    if (chunk.reasoningContent) {
      output("[thinking process]");
      output(chunk.reasoningContent);
    }

    if (chunk.isComplete) {
      output("[eot]");
      output("");

      if (chunk.toolCalls.length > 0) {
        const assistantWithTools = new MessageBuilder()
          .setRole(MessageRole.Assistant)
          .setContent(chunk.content)
          .setToolCalls(chunk.toolCalls.map((tc) => ({
            id: tc.id,
            name: tc.name,
            arguments: JSON.stringify(tc.arguments),
          })))
          .build();
        sessionManager.addMessage(assistantWithTools);

        const toolCallRequests = chunk.toolCalls.map((tc) => ({
          id: tc.id,
          name: tc.name,
          arguments: tc.arguments,
        }));

        const results = await toolExecutor.executeAll(toolCallRequests);

        for (const tcResult of results) {
          const toolName = toolCallRequests.find((t) => t.id === tcResult.id)?.name || "";
          const toolContent = tcResult.result.content || "";

          output(`[${toolName}]`);
          if (toolContent) {
            output(toolContent);
          } else if (tcResult.result.error) {
            output(`Error: ${tcResult.result.error}`);
          } else {
            output("(done)");
          }
          output("[called]");

          const toolMessage = new MessageBuilder()
            .setRole(MessageRole.Tool)
            .setContent(tcResult.result.content)
            .setToolCall(tcResult.id, toolName)
            .build();

          sessionManager.addMessage(toolMessage);
        }
      } else {
        const assistantMessage = new MessageBuilder()
          .setRole(MessageRole.Assistant)
          .setContent(chunk.content)
          .build();
        sessionManager.addMessage(assistantMessage);
        output(chunk.content);
        output("");
      }
    }
  }
}
