import { DeepSeekClient } from "./DeepSeekClient.js";
import { MessageBuilder, MessageRole } from "../../types/message.js";
import { output } from "../../utils/logger.js";
import { SessionManager } from "../session/SessionManager.js";
import { ToolExecutor } from "../tools/index.js";

export interface QuestionRequest {
  type: "question";
  toolId: string;
  toolName: string;
  question: string;
  options: Array<{ label: string; value: string }>;
}

export interface QuestionAnswerCallback {
  (request: QuestionRequest): Promise<string>;
}

export type StreamingChunk =
  | QuestionRequest
  | { type: "tool_result" }
  | { type: "complete" };

export async function* runStreamingMode(
  messages: Awaited<ReturnType<SessionManager["getMessages"]>>,
  tools: any[],
  sessionManager: SessionManager,
  apiClient: DeepSeekClient,
  toolExecutor: ToolExecutor,
  onQuestionAnswer?: QuestionAnswerCallback
): AsyncGenerator<StreamingChunk> {
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

          const questionToolCalls = toolCallRequests.filter((tc) => tc.name === "question");
          const nonQuestionToolCalls = toolCallRequests.filter((tc) => tc.name !== "question");

          if (nonQuestionToolCalls.length > 0) {
            const results = await toolExecutor.executeAll(nonQuestionToolCalls);

            for (let i = 0; i < results.length; i++) {
              const tcResult = results[i];
              const tcRequest = nonQuestionToolCalls[i];
              const toolName = tcRequest.name;
              let toolContent = tcResult.result.content || "";

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

          if (questionToolCalls.length > 0) {
            for (const tc of questionToolCalls) {
              let options: Array<{ label: string; value: string }> = [];
              const rawOptions = tc.arguments.options;

              if (Array.isArray(rawOptions)) {
                options = rawOptions.map((opt: unknown) => {
                  if (typeof opt === "string") {
                    return { label: opt, value: opt };
                  }
                  if (typeof opt === "object" && opt !== null) {
                    const obj = opt as Record<string, unknown>;
                    return { label: String(obj.label ?? obj.value ?? ""), value: String(obj.value ?? obj.label ?? "") };
                  }
                  return { label: String(opt), value: String(opt) };
                });
              }

              const question = String(tc.arguments.question || "");

              output(`[🛠️${tc.name}]`);
              output(question);
              if (options.length > 0) {
                for (let i = 0; i < options.length; i++) {
                  output(`  > ${options[i].label}`);
                }
              }

              if (onQuestionAnswer) {
                const answer = await onQuestionAnswer({
                  type: "question",
                  toolId: tc.id,
                  toolName: tc.name,
                  question,
                  options,
                });

                const toolContent = `User selected: ${answer}`;
                output(toolContent);
                output("[✅called]");

                const toolMessage = new MessageBuilder()
                  .setRole(MessageRole.Tool)
                  .setContent(toolContent)
                  .setToolCall(tc.id, tc.name)
                  .build();

                sessionManager.addMessage(toolMessage);
              } else {
                yield {
                  type: "question",
                  toolId: tc.id,
                  toolName: tc.name,
                  question,
                  options,
                };
              }
            }
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
