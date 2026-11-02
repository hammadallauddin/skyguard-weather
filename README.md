# SkyGuard Weather

A Claude Code plugin that fetches real-time weather from [Open-Meteo](https://open-meteo.com) and flags unsafe conditions. It ships a `get_weather` MCP tool, a `/check-weather` command, a `skyguard-analyzer` skill, a `weather-investigator` subagent, and an audit hook.

## Install in Claude Code

```bash
claude plugin marketplace add hammadallauddin/skyguard-weather
claude plugin install skyguard-weather@skyguard
```

Or in one step on Claude Code 2.1.275 or later:

```
/plugin install skyguard-weather --marketplace hammadallauddin/skyguard-weather
```

Restart Claude Code, then run:

```
/check-weather Karachi
```

Requires Node.js 18 or later. The server is shipped prebuilt in `dist/`, so no `npm install` is needed.

To remove it: `claude plugin uninstall skyguard-weather`.

## What's included

| Component | Name | What it does |
|---|---|---|
| MCP tool | `get_weather` | Current temperature, humidity, rain and wind for a latitude/longitude |
| Command | `/check-weather <city>` | Resolves the city, calls `get_weather`, applies the safety rules |
| Skill | `skyguard-analyzer` | Turns readings into advisories and alerts |
| Agent | `weather-investigator` | Checks a location in its own context and returns 3 bullet points |
| Hook | `PreToolUse` on `get_weather` | Appends each call to `audit.log` in the plugin's data directory |

### `get_weather`

Input:

```json
{ "latitude": 24.8607, "longitude": 67.0011, "city_name": "Karachi" }
```

Output:

```json
{
  "city": "Karachi",
  "temperature_celsius": 25.1,
  "humidity_percent": 80,
  "rain_mm": 0,
  "wind_speed_kmh": 9.9,
  "timestamp": "2026-11-02T00:45"
}
```

`timestamp` is in the location's local time.

## Safety rules

| Condition | Label | Example recommendation |
|---|---|---|
| Rain > 0.0 mm | `[ADVISORY]` | Carry an umbrella, allow extra travel time |
| Wind > 30 km/h | `[WARNING]` | Secure loose items, take care on two wheels |
| Temperature > 38 °C | `[HEAT ALERT]` | Avoid the outdoors 12:00–16:00, stay hydrated |

## Data storage

Every reading is appended as one JSON line to `weather-log.jsonl`, and every tool call to `audit.log`, in the first of these directories that is set:

1. `SKYGUARD_DATA_DIR`
2. `CLAUDE_PLUGIN_DATA` (set by Claude Code for installed plugins)
3. `~/.skyguard`

Nothing is written to the project you're working in.

| Variable | Default | Description |
|---|---|---|
| `SKYGUARD_DATA_DIR` | see above | Where readings and the audit log are stored |
| `SKYGUARD_API_URL` | `https://api.open-meteo.com/v1/forecast` | Weather API endpoint |

## Command-line use

```bash
npm install
npm run build
npm run cli -- weather Karachi
npm run cli -- weather --lat 51.5074 --lon -0.1278 --city London
npm run cli -- weather --all      # 20 most recent readings
npm run cli -- config             # where readings are stored
```

The CLI resolves city names with the Open-Meteo geocoding API.

## Development

```bash
npm install
npm run build    # type-checks, then bundles src/ into dist/ with esbuild
npm run dev      # runs the MCP server from source
claude plugin validate .
```

`dist/` is committed because Claude Code runs the plugin straight from the repository without installing dependencies. Run `npm run build` and commit `dist/` whenever you change `src/`.

## License

MIT
