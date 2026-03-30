#!/bin/bash
# Fires after every Write/Edit to a .ts/.tsx file
if echo "$CLAUDE_TOOL_INPUT" | grep -qE '\.(ts|tsx)'; then
  echo "Running type check..."
  npx tsc --noEmit --pretty 2>&1 | tail -20
fi
exit 0