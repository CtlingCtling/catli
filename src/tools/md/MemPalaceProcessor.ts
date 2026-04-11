import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync, renameSync, realpathSync } from "fs";
import { join, basename, extname } from "path";
import { homedir } from "os";
import { spawn } from "child_process";
import { output } from "../../utils/logger.js";
import { YamlGenerator, YamlMetadata, Category } from "./YamlGenerator.js";
import { MemPalaceLoader } from "../../core/prompts/MemPalaceLoader.js";

export interface MemPalaceOptions {
  inputDir: string;
  recursive?: boolean;
}

export interface ProcessedFile {
  path: string;
  filename: string;
  category?: Category;
  subject?: string;
  judge?: string;
  error?: string;
}

export class MemPalaceProcessor {
  static async process(options: MemPalaceOptions): Promise<ProcessedFile[]> {
    const results: ProcessedFile[] = [];
    const memPalaceDir = join(homedir(), ".catli", "memPalace");
    const inputDir = realpathSync(options.inputDir);

    this.ensureDirectories(memPalaceDir);

    const files = this.findMarkdownFiles(inputDir, options.recursive || false);
    output(`Found ${files.length} markdown file(s) in ${inputDir}`);

    for (const file of files) {
      const result = await this.processFile(file, memPalaceDir);
      results.push(result);

      if (result.error) {
        output(`[error] ${basename(file)}: ${result.error}`);
      } else {
        output(`Processed: ${result.filename} -> ${result.category}/${result.subject}`);
      }
    }

    return results;
  }

  private static async processFile(filePath: string, memPalaceDir: string): Promise<ProcessedFile> {
    try {
      const content = readFileSync(filePath, "utf-8");
      const filename = basename(filePath);

      const { category, subject, judge } = await this.analyzeContent(content, filename);

      const metadata: YamlMetadata = {
        title: filename.replace(/\.md$/, ""),
        date: new Date().toISOString().split("T")[0],
        category,
        subject,
        tags: [category],
      };

      const yamlHeader = YamlGenerator.generate(metadata);
      const judgeSection = `## JUDGE\n${judge}\n---`;
      const processedContent = yamlHeader + "\n" + judgeSection + "\n\n" + content;

      const targetDir = join(memPalaceDir, category);
      if (!existsSync(targetDir)) {
        mkdirSync(targetDir, { recursive: true });
      }

      const targetPath = join(targetDir, filename);

      renameSync(filePath, targetPath);
      writeFileSync(targetPath, processedContent, "utf-8");

      return {
        path: targetPath,
        filename,
        category,
        subject,
        judge,
      };
    } catch (err) {
      const error = err as Error;
      return {
        path: filePath,
        filename: basename(filePath),
        error: error.message,
      };
    }
  }

  private static async analyzeContent(
    content: string,
    filename: string
  ): Promise<{ category: Category; subject: string; judge: string }> {
    const { category, subject, judgePrompt } = await this.classifyAndGeneratePrompt(content, filename);
    const judge = await this.callKitten(judgePrompt);

    return { category, subject, judge: judge.trim() };
  }

  private static async classifyAndGeneratePrompt(
    content: string,
    filename: string
  ): Promise<{ category: Category; subject: string; judgePrompt: string }> {
    const classificationPrompt = `你是 MemPalace 记忆宫殿系统的分类器。根据以下内容，判断它属于哪个类别并提取 subject。

## 分类标准

**knowledge（知识）**：系统化的学习笔记，有科目归属
- 特征：概念、公式、定理、代码、流程、学习笔记
- subject 格式：科目名称（如"计算机科学"、"量子力学"）

**insight（观点）**：对特定事物的看法和分析
- 特征：评论、分析、评价、比较、看法
- subject 格式：被评论的事物（如"电影《黑客帝国》"、"AI发展现状"）

**personality（人格）**：关于用户自身的思考和反思
- 特征：自我反省、内心独白、价值观探索
- subject 格式：反思的主题（如"关于完美主义"、"对沟通的反思"）

## 内容
标题：${filename}
正文：${content.slice(0, 2000)}

## 输出格式
直接输出以下格式，不要多余解释：
CATEGORY: knowledge|insight|personality
SUBJECT: 一句话概括主题`;

    const result = await this.callKitten(classificationPrompt);
    const lines = result.split("\n");

    let category: Category = "insight";
    let subject = filename.replace(/\.md$/, "");

    for (const line of lines) {
      if (line.startsWith("CATEGORY:")) {
        const cat = line.replace("CATEGORY:", "").trim().toLowerCase();
        if (cat === "knowledge" || cat === "insight" || cat === "personality") {
          category = cat;
        }
      }
      if (line.startsWith("SUBJECT:")) {
        subject = line.replace("SUBJECT:", "").trim();
      }
    }

    const judgePrompt = MemPalaceLoader.getJudgePrompt(category, content);

    return { category, subject, judgePrompt };
  }

  private static async callKitten(prompt: string): Promise<string> {
    return new Promise((resolve) => {
      const child = spawn("npx", ["tsx", "src/kitten.ts", prompt], {
        cwd: process.cwd(),
        env: process.env,
      });

      let stdout = "";
      let stderr = "";

      child.stdout?.on("data", (data) => {
        stdout += data.toString();
      });

      child.stderr?.on("data", (data) => {
        stderr += data.toString();
      });

      child.on("close", (code) => {
        if (code === 0) {
          resolve(stdout.trim());
        } else {
          resolve(`[Error: kitten exited with code ${code}] ${stderr.trim()}`);
        }
      });

      child.on("error", (err) => {
        resolve(`[Error: ${err.message}]`);
      });
    });
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
      output(`[error] Cannot read directory ${dir}: ${(err as Error).message}`);
    }

    return files;
  }

  private static ensureDirectories(memPalaceDir: string): void {
    const dirs = ["knowledge", "insight", "personality"];
    for (const dir of dirs) {
      const path = join(memPalaceDir, dir);
      if (!existsSync(path)) {
        mkdirSync(path, { recursive: true });
        output(`Created directory: ${dir}`);
      }
    }
  }
}