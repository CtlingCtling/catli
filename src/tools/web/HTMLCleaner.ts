export class HTMLCleaner {
  private static readonly BLOCK_TAGS = [
    "nav", "header", "footer", "aside", "script",
    "style", "noscript", "iframe", "form", "button",
  ];

  static clean(html: string): string {
    let text = html;

    text = this.removeComments(text);
    text = this.removeBlockElements(text);
    text = this.normalizeWhitespace(text);

    return text.trim();
  }

  private static removeComments(html: string): string {
    return html.replace(/<!--[\s\S]*?-->/g, "");
  }

  private static removeBlockElements(html: string): string {
    let result = html;

    result = result.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
    result = result.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
    result = result.replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, "");

    for (const tag of this.BLOCK_TAGS) {
      const regex = new RegExp(`<${tag}[\\s\\S]*?<\\/${tag}>`, "gi");
      result = result.replace(regex, "\n");
    }

    return result;
  }

  private static extractTextBetweenTags(html: string): string {
    const parts: string[] = [];

    const tagRegex = /<(\/?)(\w+)[^>]*>/g;
    let lastIndex = 0;
    let match;

    while ((match = tagRegex.exec(html)) !== null) {
      const before = html.slice(lastIndex, match.index);
      if (before.trim()) {
        parts.push(before);
      }
      lastIndex = match.index + match[0].length;
    }

    const remaining = html.slice(lastIndex);
    if (remaining.trim()) {
      parts.push(remaining);
    }

    return parts.join(" ");
  }

  private static normalizeWhitespace(text: string): string {
    return text
      .replace(/[\r\n]+/g, "\n")
      .replace(/[ \t]+/g, " ")
      .replace(/\n\s*\n/g, "\n\n")
      .replace(/^\s+|\s+$/g, "");
  }

  static extractMainContent(html: string): string {
    let result = this.clean(html);

    const articleMatch = result.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    if (articleMatch) {
      result = articleMatch[1];
    }

    const mainMatch = result.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
    if (mainMatch) {
      result = mainMatch[1];
    }

    const contentDiv = result.match(/<div[^>]*(?:class|id)=["'][^"']*(?:content|article|post|entry)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
    if (contentDiv) {
      result = contentDiv[1];
    }

    result = this.extractTextBetweenTags(result);
    result = this.normalizeWhitespace(result);

    return result.trim();
  }

  static async cleanWithAI(html: string, _prompt?: string): Promise<string> {
    const cleaned = this.extractMainContent(html);
    const truncated = cleaned.slice(0, 5000);

    return truncated;
  }
}
