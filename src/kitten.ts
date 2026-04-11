import OpenAI from "openai";
import { readFileSync } from "fs";
import { KittenConfigManager } from "./core/kitten/KittenConfig.js";

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("Usage: kitten <prompt>  or  echo <text> | kitten <prompt>");
    process.exit(1);
  }

  const prompt = args.join(" ");
  let input = "";

  if (!process.stdin.isTTY) {
    try {
      input = readFileSync("/dev/stdin", "utf-8").trim();
    } catch {
    }
  }

  const fullPrompt = input ? `${prompt}\n\nInput:\n${input}` : prompt;

  const manager = new KittenConfigManager();
  const config = manager.getConfig();
  const apiKey = manager.getApiKey();

  if (!apiKey) {
    console.error("Sleepy kitty fall asleep. [No API key found]");
    process.exit(1);
  }

  const client = new OpenAI({
    baseURL: config.baseUrl,
    apiKey: apiKey,
  });

  try {
    const response = await client.chat.completions.create({
      model: config.model,
      messages: [{ role: "user", content: fullPrompt }],
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content || "";
    console.log(content);
  } catch (err) {
    const error = err as Error;
    console.error(`Sleepy kitty fall asleep. [${error.message}]`);
    process.exit(1);
  }
}

main();
