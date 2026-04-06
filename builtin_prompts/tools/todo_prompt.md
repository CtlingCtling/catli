# Todo Tool Usage Guidelines

Use the todo tool when you need to:
- Break down complex tasks into actionable items
- Track multi-step workflows that span multiple conversations
- Help users manage priorities by creating TODO items for them

## Tool Behavior

The todo tool creates persistent items stored at `~/.catli/todos.json`. Items persist across sessions.

Available operations:
- **Create**: Create a new TODO item with a descriptive title
- **Complete**: Mark a TODO as done
- **List**: View all active TODOs
- **Remove**: Delete a TODO item

## When to Use

✅ Good uses:
- "Help me remember to review this PR later"
- "Create a TODO for the refactoring steps we discussed"
- "Add a reminder to test the login flow"

❌ Avoid:
- Using as a general note-taking tool (use notes instead)
- Creating TODOs for trivial, single-step tasks
- Creating too many TODOs (keep it manageable, under 10 active items)

## Tips

- Be specific with TODO titles so they're easily identifiable later
- Use the list operation to see existing TODOs before creating a new one
- TODOs auto-save and persist across restarts
