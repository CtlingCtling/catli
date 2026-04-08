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

  const allOptions: Array<{ label: string; value: string }> = [
    ...options,
    { label: CUSTOM_OPTION, value: "__custom__" },
  ];
  let selectedIndex = 0;
  isActive = true;

  const cleanup = (): void => {
    if (process.stdin.isTTY) {
      (process.stdin as any).setRawMode?.(false);
    }
    isActive = false;
    process.stdout.write("\n");
  };

  return new Promise((resolve) => {
    if (process.stdin.isTTY) {
      (process.stdin as any).setRawMode?.(true);
    }

    const render = (): void => {
      let display = `\r${question}\n\n`;
      for (let i = 0; i < allOptions.length; i++) {
        const marker = i === selectedIndex ? ">" : " ";
        const check = i === selectedIndex ? "[*]" : "[ ]";
        display += `${marker}${check} ${allOptions[i].label}\n`;
      }
      display += "\n↑↓ navigate, Enter confirm";
      process.stdout.write(display);
    };

    const clearRender = (): void => {
      const lines = allOptions.length + 4;
      process.stdout.write(`\r${" ".repeat(100)}\r`);
      for (let i = 0; i < lines; i++) {
        process.stdout.write("\x1b[1A\r");
        process.stdout.write(`\r${" ".repeat(100)}\r`);
      }
      process.stdout.write("\r");
    };

    render();

    const keyHandler = (_str: string, key: any): void => {
      if (key.name === "up") {
        selectedIndex = (selectedIndex - 1 + allOptions.length) % allOptions.length;
        clearRender();
        render();
      } else if (key.name === "down") {
        selectedIndex = (selectedIndex + 1) % allOptions.length;
        clearRender();
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
  process.stdout.write("\nPlease enter your answer: ");

  let input = "";
  process.stdin.resume();
  process.stdin.setEncoding("utf8");

  const dataHandler = (chunk: string): void => {
    input += chunk;
    if (input.includes("\n")) {
      process.stdin.removeListener("data", dataHandler);
      process.stdin.pause();
      const answer = input.replace(/\n$/, "").trim();
      resolve({
        selected: answer,
        isCustom: true,
      });
    }
  };

  process.stdin.on("data", dataHandler);
}
