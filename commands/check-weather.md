---
description: Check weather alerts for a city. Usage: /check-weather Karachi
argument-hint: <city>
---

Check the weather for: $ARGUMENTS

1. Work out the latitude and longitude of that city.
2. Call the `get_weather` tool from the skyguard-weather MCP server with those coordinates and the city name.
3. Apply the `skyguard-analyzer` skill rules to the result and report the risk level.
