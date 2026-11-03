---
description: Check weather alerts for a city. Usage: /check-weather Karachi
argument-hint: <city>
---

Check the weather for: $ARGUMENTS

1. Call the `get_weather` tool from the skyguard-weather MCP server with `city_name` set to the city above. Coordinates are optional; the server geocodes the city when they are omitted.
2. Apply the `skyguard-analyzer` skill rules to the result and report the risk level.
