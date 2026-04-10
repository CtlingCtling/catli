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
  let currentMessages = [...messages];
  let isComplete = false;
  let contentBuffer = "";
  let thinkingDisplayed = false;
  let thinkingEnded = false;
  let pendingToolCalls: Array<{ id: string; name: string; arguments: Record<string, unknown> }> = [];

  while (!isComplete) {
    let hasToolCalls = false;

    for await (const chunk of apiClient.generateWithToolsStream(currentMessages, tools)) {
      if (chunk.reasoningContent) {
        if (!thinkingDisplayed) {
          output("\n[thinking process]\n");
          thinkingDisplayed = true;
        }
        process.stdout.write(chunk.reasoningContent);
      }

      if (chunk.content) {
        contentBuffer += chunk.content;
        process.stdout.write(chunk.content);
      }

      if (chunk.toolCalls.length > 0) {
        pendingToolCalls = chunk.toolCalls;
      }

      if (chunk.isComplete) {
        if (thinkingDisplayed && !thinkingEnded) {
          thinkingEnded = true;
          output("[eot]\n");
        }

        if (contentBuffer) {
          process.stdout.write(contentBuffer);
          contentBuffer = "";
        }

        output("");

        if (pendingToolCalls.length > 0) {
          hasToolCalls = true;
          thinkingDisplayed = false;
          thinkingEnded = false;

          const assistantWithTools = new MessageBuilder()
            .setRole(MessageRole.Assistant)
            .setContent("")
            .setToolCalls(pendingToolCalls.map((tc) => ({
              id: tc.id,
              name: tc.name,
              arguments: JSON.stringify(tc.arguments),
            })))
            .build();
          sessionManager.addMessage(assistantWithTools);

          const toolCallRequests = pendingToolCalls.map((tc) => ({
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
              .setContent(tcResult.result.content || tcResult.result.error || "")
              .setToolCall(tcResult.id, toolName)
              .build();

            sessionManager.addMessage(toolMessage);
          }

          pendingToolCalls = [];

          const currentSession = sessionManager.getCurrentSession();
          currentMessages = currentSession?.messages || [];
        } else {
          isComplete = true;
        }
      }
    }

    if (!hasToolCalls && !isComplete) {
      isComplete = true;
    }
  }
}
