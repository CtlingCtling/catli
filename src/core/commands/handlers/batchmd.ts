import { Command } from "../CommandRegistry.js";
import { MDProcessor, ProcessedFile } from "../../../tools/md/MDProcessor.js";
import { output, error } from "../../../utils/logger.js";
import { existsSync } from "fs";

export function createBatchmdCommand(): Command {
  return {
    name: "batchmd",
    description: "Batch process markdown files in a directory",
    execute: async (args: string[]): Promise<boolean> => {
      if (args.length === 0) {
        output("Usage: /batchmd <directory> [-o <outputDir>]");
        return true;
      }

      const inputDir = args[0];
      let outputDir: string | undefined;

      const oIndex = args.indexOf("-o");
      if (oIndex !== -1 && args[oIndex + 1]) {
        outputDir = args[oIndex + 1];
      }

      if (!existsSync(inputDir)) {
        error(`Directory not found: ${inputDir}`);
        return true;
      }

      output(`Batch processing markdown files in: ${inputDir}`);
      if (outputDir) {
        output(`Output directory: ${outputDir}`);
      }

      const results = MDProcessor.processDirectory({
        inputDir,
        outputDir,
        recursive: true,
      });

      const success = results.filter((r: ProcessedFile) => !r.error).length;
      const failed = results.filter((r: ProcessedFile) => r.error).length;

      output(`\nProcessed: ${success} file(s), Failed: ${failed} file(s)`);
      return true;
    },
  };
}
