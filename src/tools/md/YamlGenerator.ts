import { readFileSync } from "fs";
import { join } from "path";

export interface YamlMetadata {
  title?: string;
  date?: string;
  source?: string;
  summary?: string;
  tags?: string[];
}

export class YamlGenerator {
  static generate(metadata: YamlMetadata): string {
    const title = metadata.title || "Untitled";
    const date = metadata.date || new Date().toISOString().split("T")[0];
    const source = metadata.source || "";
    const summary = metadata.summary || "";
    const tags = metadata.tags?.join(", ") || "";

    const yaml = [
      "---",
      `title: "${title}"`,
      `date: "${date}"`,
      source ? `source: "${source}"` : "# source: \"\"",
      `summary: "${summary}"`,
      `tags: [${tags}]`,
      "---",
      "",
    ].join("\n");

    return yaml;
  }

  static parse(mdContent: string): YamlMetadata | null {
    const yamlMatch = mdContent.match(/^---\n([\s\S]*?)\n---/);
    if (!yamlMatch) {
      return null;
    }

    const yamlBlock = yamlMatch[1];
    const metadata: YamlMetadata = {};

    const titleMatch = yamlBlock.match(/title:\s*"?([^"\n]+)"?/);
    if (titleMatch) metadata.title = titleMatch[1].trim();

    const dateMatch = yamlBlock.match(/date:\s*"?([^"\n]+)"?/);
    if (dateMatch) metadata.date = dateMatch[1].trim();

    const sourceMatch = yamlBlock.match(/source:\s*"?([^"\n]+)"?/);
    if (sourceMatch) metadata.source = sourceMatch[1].trim();

    const summaryMatch = yamlBlock.match(/summary:\s*"?([^"\n]+)"?/);
    if (summaryMatch) metadata.summary = summaryMatch[1].trim();

    const tagsMatch = yamlBlock.match(/tags:\s*\[(.*?)\]/);
    if (tagsMatch) {
      metadata.tags = tagsMatch[1]
        .split(",")
        .map((t) => t.trim().replace(/"/g, ""))
        .filter((t) => t);
    }

    return metadata;
  }

  static merge(existing: YamlMetadata, updates: Partial<YamlMetadata>): YamlMetadata {
    return {
      ...existing,
      ...updates,
      tags: updates.tags || existing.tags,
    };
  }

  static addYamlToContent(content: string, metadata: YamlMetadata): string {
    const yaml = this.generate(metadata);
    return yaml + "\n" + content;
  }

  static getPrompt(): string {
    try {
      const promptPath = join(process.cwd(), "builtin_prompts", "yaml_header.md");
      return readFileSync(promptPath, "utf-8");
    } catch {
      return "Generate a YAML header with title, date, source, summary, and tags.";
    }
  }
}
