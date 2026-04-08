import { readFileSync, existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { output } from "../../../utils/logger.js";

interface TodoStore {
  [title: string]: boolean;
}

function loadTodos(): TodoStore {
  const filePath = join(homedir(), ".catli", "todos.json");
  try {
    if (existsSync(filePath)) {
      return JSON.parse(readFileSync(filePath, "utf-8"));
    }
  } catch {
  }
  return {};
}

export function createTodolistCommand() {
  return {
    name: "todolist",
    description: "Show all TODO items",
    execute: async (): Promise<boolean> => {
      const todos = loadTodos();
      const entries = Object.entries(todos);

      if (entries.length === 0) {
        output("No TODOs found.");
        return true;
      }

      output("TODO List:");
      for (const [title, completed] of entries) {
        const status = completed ? "[x]" : "[ ]";
        output(`  ${status} ${title}`);
      }
      output(`\nTotal: ${entries.length} items`);
      return true;
    },
  };
}