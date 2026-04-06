
import { HTMLCleaner } from "./HTMLCleaner.js";

export interface FetchResult {
  url: string;
  title?: string;
  content: string;
  cleaned: string;
}

export class WebFetch {
  static async fetch(url: string): Promise<FetchResult> {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; CatLI/1.0)",
          "Accept": "text/html,application/xhtml+xml",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      const title = this.extractTitle(html);
      const cleaned = HTMLCleaner.extractMainContent(html);

      return {
        url,
        title,
        content: html,
        cleaned,
      };
    } catch (err) {
      const error = err as Error;
      throw new Error(`WebFetch failed: ${error.message}`);
    }
  }

  static async fetchAndClean(url: string): Promise<FetchResult> {
    const result = await this.fetch(url);
    result.cleaned = HTMLCleaner.clean(result.content);
    return result;
  }

  private static extractTitle(html: string): string | undefined {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      return titleMatch[1].replace(/\s+/g, " ").trim();
    }
    return undefined;
  }
}
