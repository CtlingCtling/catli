import { DeepSeekClient } from "./DeepSeekClient.js";
import { MessageBuilder, MessageRole } from "../../types/message.js";
import { output } from "../../utils/logger.js";
import { SessionManager } from "../session/SessionManager.js";
import { ToolExecutor } from "../tools/index.js";

export interface InteractiveToolRequest {
  toolId: string;
  toolName: string;
  question: string;
  options?: Array<{ label: string; value: string }>;
}

export interface StreamingHandlerCallbacks {
  onInteractiveTool?: (request: InteractiveToolRequest) => Promise<{ selected: string }>;
}

export async function runStreamingMode(
  messages: Awaited<ReturnType<SessionManager["getMessages"]>>,
  tools: any[],
  sessionManager: SessionManager,
  apiClient: DeepSeekClient,
  toolExecutor: ToolExecutor,
  callbacks?: StreamingHandlerCallbacks
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
          output("\n[🧠thinking process]\n");
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
          output("\n[💡eot]\n");
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

          const interactiveToolCalls = toolCallRequests.filter(
            (tc) => tc.name === "question" && callbacks?.onInteractiveTool
          );
          const nonInteractiveToolCalls = toolCallRequests.filter(
            (tc) => tc.name !== "question"
          );

          if (nonInteractiveToolCalls.length > 0) {
            const results = await toolExecutor.executeAll(nonInteractiveToolCalls);

            for (let i = 0; i < results.length; i++) {
              const tcResult = results[i];
              const tcRequest = nonInteractiveToolCalls[i];
              const toolName = tcRequest.name;
              const toolContent = tcResult.result.content || "";

              if (toolName === "run_bash" && toolContent) {
                const lines = toolContent.split("\n");
                output(`[🛠️${toolName}]`);
                for (const line of lines) {
                  output(`#️⃣> ${line}`);
                }
                output("[✅called]");
              } else {
                output(`[🛠️${toolName}]`);
                if (toolContent) {
                  output(toolContent);
                } else if (tcResult.result.error) {
                  output(`[❌error]: ${tcResult.result.error}`);
                } else {
                  output("[✅done]");
                }
                output("[✅called]");
              }

              const toolMessage = new MessageBuilder()
                .setRole(MessageRole.Tool)
                .setContent(toolContent)
                .setToolCall(tcResult.id, toolName)
                .build();

              sessionManager.addMessage(toolMessage);
            }
          }

          for (const tc of interactiveToolCalls) {
            const args = tc.arguments as { question?: string; options?: Array<{ label: string; value: string }> };
            const question = args.question || "";
            const options = args.options || [];

            output(`[🛠️${tc.name}]`);
            output(question);
            if (options.length > 0) {
              for (let i = 0; i < options.length; i++) {
                output(`  ${i + 1}. ${options[i].label}`);
              }
            }

            const answer = await callbacks!.onInteractiveTool!({
              toolId: tc.id,
              toolName: tc.name,
              question,
              options,
            });

            const toolContent = `User selected: ${answer.selected}`;
            output(toolContent);
            output("[✅called]");

            const toolMessage = new MessageBuilder()
              .setRole(MessageRole.Tool)
              .setContent(toolContent)
              .setToolCall(tc.id, tc.name)
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
