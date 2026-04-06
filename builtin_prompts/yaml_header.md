# YAML Header Generation Prompt

Generate a YAML header for the following markdown document. The header should be minimal but informative.

## Output Format

```yaml
---
title: "<document title or filename>"
date: "<extraction date in YYYY-MM-DD format>"
source: "<original source if applicable>"
summary: "<2-3 sentence summary of the document content>"
tags: ["tag1", "tag2", "tag3"]
---
```

## Guidelines

- **title**: Use the filename or first H1 heading. Keep it concise.
- **date**: Use today's date since this is being extracted now.
- **source**: Leave empty if no source URL was provided.
- **summary**: Capture the main purpose and key points. Max 3 sentences.
- **tags**: Extract 3-5 relevant tags from the content. Use lowercase with underscores.

## Notes

- Do not include any additional YAML fields beyond what's shown above
- Keep the summary factual and informative, not promotional
- Tags should reflect the main topics, not every minor mention
