---
description: Show quick token usage statistics
---

Read the Claude stats from ~/.claude/stats-cache.json and display a summary including:

1. **Total token usage** - Input and output tokens combined
2. **By model breakdown** - Show usage for each model (Opus, Sonnet, Haiku)
3. **Cache efficiency** - Percentage of tokens served from cache
4. **Estimated cost** - Calculate cost using these rates per 1M tokens:
   - Opus: $15 input, $75 output
   - Sonnet: $3 input, $15 output
   - Haiku: $0.80 input, $4 output

Format the output in a clean, readable table format.
