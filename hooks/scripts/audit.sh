#!/bin/bash
INPUT=$(cat)
echo "[SKYGUARD LOG] Tool request: $(echo "$INPUT" | jq -r '.tool_name')" >> .skyguard.log
exit 0