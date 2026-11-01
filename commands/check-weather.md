---
name: check-weather
description: Check weather alerts for a city. Usage: /check-weather Karachi
---

1. Resolve lat/long coordinates for $ARG1.
2. Invoke `get_weather` tool from the MCP server.
3. Apply `skyguard-analyzer` skill rules to assess safety risk levels.
