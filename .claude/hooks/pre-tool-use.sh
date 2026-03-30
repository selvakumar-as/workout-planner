#!/bin/bash
# Fires before every Write/Edit tool call

# Block reads of settings.json that could expose the GitHub token
if echo "$CLAUDE_TOOL_INPUT" | grep -q "settings.json"; then
  echo "BLOCK: Reading settings.json is not allowed (may contain sensitive tokens)." >&2
  exit 1
fi

if echo "$CLAUDE_TOOL_INPUT" | grep -q ": any"; then
  echo "BLOCK: Found ': any' in proposed write. Use proper typing." >&2
  exit 1
fi

exit 0