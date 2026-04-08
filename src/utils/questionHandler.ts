import * as readline from "readline";
import { output } from "./logger.js";

export interface QuestionOption {
  label: string;
  value: string;
}

export interface QuestionResult {
  selected: string;
  isCustom: boolean;
}

const CUSTOM_OPTION = "Enter your own answer.";

let isActive = false;

export async function askQuestion(
  question: string,
  options: QuestionOption[]
): Promise<QuestionResult> {
  if (isActive) {
    return { selected: "", isCustom: false };
  }

  const allOptions = [...options, { label: CUSTOM_OPTION, value: "__custom__" }];
  let selectedIndex = 0;
  isActive = true;

  return new Promise((resolve) => {
    readline.emitKeypressEvents(process.stdin);

    if (process.stdin.isTTY) {
      (process.stdin as any).setRawMode?.(true);
    }

    function render() {
      readline.cursorTo(process.stdout, 0);
      readline.moveCursor(process.stdout, 0, -allOptions.length);
      readline.clearScreenDown(process.stdout);

      output(question);
      output("");
      for (let i = 0; i < allOptions.length; i++) {
        const marker = i === selectedIndex ? ">" : " ";
        const check = i === selectedIndex ? "[*]" : "[ ]";
        output(`${marker}${check} ${allOptions[i].label}`);
      }
      output("");
      output("↑↓ navigate, Enter confirm");
    }

    function cleanup() {
      readline.cursorTo(process.stdout, 0);
      readline.moveCursor(process.stdout, 0, allOptions.length - selectedIndex + 2);
      readline.clearScreenDown(process.stdout);
      if (process.stdin.isTTY) {
        (process.stdin as any).setRawMode?.(false);
      }
      isActive = false;
    }

    render();

    const keyHandler = (_str: string, key: readline.Key) => {
      if (key.name === "up") {
        selectedIndex = (selectedIndex - 1 + allOptions.length) % allOptions.length;
        render();
      } else if (key.name === "down") {
        selectedIndex = (selectedIndex + 1) % allOptions.length;
        render();
      } else if (key.name === "return") {
        process.stdin.removeListener("keypress", keyHandler);
        cleanup();
        if (allOptions[selectedIndex].value === "__custom__") {
          promptCustomInput(resolve);
        } else {
          resolve({
            selected: allOptions[selectedIndex].value,
            isCustom: false,
          });
        }
      }
    };

    process.stdin.on("keypress", keyHandler);
  });
}

function promptCustomInput(resolve: (result: QuestionResult) => void): void {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });

  rl.question("", (answer) => {
    rl.close();
    resolve({
      selected: answer.trim(),
      isCustom: true,
    });
  });
}
