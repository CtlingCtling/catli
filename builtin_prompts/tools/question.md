# Question Tool Usage Guidelines

Use the question tool when you need explicit user input to proceed. This pauses the AI's execution and waits for the user to respond.

## Tool Behavior

When you call the question tool:
1. The user's input becomes the context for the next AI response
2. The AI waits for the next user message before continuing
3. The user's response is appended to the conversation history

## When to Use

✅ Good uses:
- Clarifying ambiguous requests: "Which file should I modify?"
- Confirming actions before destructive operations: "Delete this file?"
- Getting user preferences: "Should I use TypeScript or JavaScript?"
- Disambiguating intent: "Do you want me to continue with the refactor?"

❌ Avoid:
- Rhetorical questions (answerable from context)
- Questions the AI could reasonably infer from conversation
- Multiple rapid questions (group related questions together)
- Using for things the AI could decide autonomously

## Best Practices

- Ask one clear question at a time
- Provide context in the question itself so the user knows what's being asked
- If multiple clarifications are needed, ask them sequentially
- Use yes/no questions when possible for quick responses

## Examples

✅ Good: "Which file should I modify - app.js or main.ts?"
✅ Good: "Confirm: delete all .log files in /tmp? Reply yes to proceed."
❌ Bad: "Do you want me to do this? And should I also do that? What about..."

## Response Handling

The user's response appears as the next user message in the conversation. Append it to your context and proceed accordingly.
