import { readFileSync, readdirSync, writeFileSync } from "fs";
import { join, basename, extname } from "path";
import { output } from "../../utils/logger.js";
import { YamlGenerator, YamlMetadata } from "./YamlGenerator.js";

export interface ProcessOptions {
  inputDir: string;
  outputDir?: string;
  recursive?: boolean;
  includeSubdirs?: boolean;
  summaryMode?: "brief" | "detailed";
}

export interface ProcessedFile {
  path: string;
  filename: string;
  content: string;
  metadata?: YamlMetadata;
  summary?: string;
  error?: string;
}

export class MDProcessor {
  static processFile(filePath: string): ProcessedFile {
    try {
      const content = readFileSync(filePath, "utf-8");
      const filename = basename(filePath);
      const existingYaml = YamlGenerator.parse(content);

      let processedContent = content;
      if (!existingYaml) {
        const metadata: YamlMetadata = {
          title: filename.replace(/\.md$/, ""),
          date: new Date().toISOString().split("T")[0],
          source: "",
          summary: "",
          tags: [],
        };
        processedContent = YamlGenerator.addYamlToContent(content, metadata);
      }

      return {
        path: filePath,
        filename,
        content: processedContent,
        metadata: existingYaml || this.extractBasicMetadata(content, filename),
      };
    } catch (err) {
      const error = err as Error;
      return {
        path: filePath,
        filename: basename(filePath),
        content: "",
        error: error.message,
      };
    }
  }

  static processDirectory(options: ProcessOptions): ProcessedFile[] {
    const results: ProcessedFile[] = [];

    try {
      const files = this.findMarkdownFiles(options.inputDir, options.recursive || false);

      output(`Found ${files.length} markdown file(s) in ${options.inputDir}`);

      for (const file of files) {
        const result = this.processFile(file);
        results.push(result);

        if (result.error) {
          output(`[error] ${result.filename}: ${result.error}`);
        } else {
          output(`Processed: ${result.filename}`);
        }
      }

      if (options.outputDir && results.length > 0) {
        this.saveResults(results, options.outputDir);
      }
    } catch (err) {
      const error = err as Error;
      output(`[error] Failed to process directory: ${error.message}`);
    }

    return results;
  }

  private static findMarkdownFiles(dir: string, recursive: boolean): string[] {
    const files: string[] = [];

    try {
      const entries = readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dir, entry.name);

        if (entry.isDirectory() && recursive) {
          files.push(...this.findMarkdownFiles(fullPath, true));
        } else if (entry.isFile() && extname(entry.name).toLowerCase() === ".md") {
          files.push(fullPath);
        }
      }
    } catch (err) {
      const error = err as Error;
      output(`[error] Cannot read directory ${dir}: ${error.message}`);
    }

    return files;
  }

  private static extractBasicMetadata(content: string, filename: string): YamlMetadata {
    const h1Match = content.match(/^#\s+(.+)$/m);
    const title = h1Match ? h1Match[1].trim() : filename.replace(/\.md$/, "");

    return {
      title,
      date: new Date().toISOString().split("T")[0],
      source: "",
      summary: "",
      tags: [],
    };
  }

  private static saveResults(results: ProcessedFile[], outputDir: string): void {
    for (const result of results) {
      if (!result.error) {
        const outputPath = join(outputDir, result.filename);
        writeFileSync(outputPath, result.content, "utf-8");
        output(`Saved: ${outputPath}`);
      }
    }
  }
}
