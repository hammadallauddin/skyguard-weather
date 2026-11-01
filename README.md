# SkyGuard Weather

A Model Context Protocol (MCP) server that monitors real-time weather conditions and alerts on severe environmental conditions. It provides a `get_weather` tool for fetching weather data, logs all observations to SQLite, and includes an agent, skill, command, and hooks system for safety analysis.

## Features

- **Weather Data Fetching**: Retrieves current weather (temperature, humidity, rain, wind speed) from Open-Meteo API
- **Data Logging**: Stores all weather observations in a local SQLite database (`weather.db`)
- **Safety Analysis**: Categorizes weather conditions into alerts and advisories based on defined thresholds
- **MCP Integration**: Works with Claude Code as an MCP server
- **Audit Hooks**: Logs all `get_weather` tool invocations for monitoring
- **Agent System**: Dedicated subagent for weather safety checks with clean context isolation

## Directory Structure

```
skyguard-weather/
├── agents/                    # Agent definitions
│   └── weather-investigator.md     # Weather safety checking subagent
├── commands/                  # User commands
│   └── check-weather.md           # City-based weather check command
├── hooks/                     # PreToolUse hooks
│   ├── hooks.json                  # Hook configuration
│   └── scripts/
│       └── audit.sh                # Tool call audit script
├── skills/                    # Skill definitions
│   └── skyguard-analyzer/         # Weather risk evaluation skill
│       └── SKILL.md                # Risk categorization rules
├── src/                       # TypeScript source
│   └── mcp-server.ts             # MCP server implementation
├── .mcp.json                  # MCP server configuration
├── .claude-plugin/            # Claude plugin metadata
│   └── plugin.json
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## Prerequisites

- Node.js 18+ 
- npm

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd skyguard-weather
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the TypeScript project:
   ```bash
   npm run build
   ```

## Configuration

### MCP Server Configuration

Add the following to your MCP configuration file (`.mcp.json` or Claude Code's MCP config):

```json
{
    "mcpServers": {
        "skyguard-weather": {
            "command": "node",
            "args": [
                "${CLAUDE_PLUGIN_ROOT}/dist/mcp-server.js"
            ]
        }
    }
}
```

### Claude Plugin Configuration

The plugin is configured in `.claude-plugin/plugin.json` and requires no additional setup.

## Usage

### Using the MCP Server

The MCP server exposes one tool:

**`get_weather`** - Fetches current weather parameters for coordinates

**Input:**
```json
{
    "latitude": 51.5074,
    "longitude": -0.1278,
    "city_name": "London"
}
```

**Output:**
```json
{
    "city": "London",
    "temperature_celsius": 18.5,
    "humidity_percent": 65,
    "rain_mm": 0.0,
    "wind_speed_kmh": 12.3,
    "timestamp": "2026-11-01T12:00:00"
}
```

### Using the `/check-weather` Command

```bash
/check-weather Karachi
```

This command:
1. Resolves coordinates for the given city
2. Invokes the `get_weather` tool
3. Applies SkyGuard analyzer skill rules to assess safety risk levels

### Agent Usage

The `weather-investigator` agent can be invoked to check weather safety at target coordinates and summarize hazards in 3 bullet points.

## Safety Evaluation Rules

The skyguard-analyzer skill categorizes weather conditions:

| Condition | Severity | Label |
|-----------|----------|-------|
| Rain > 0.0 mm | Advisory | [ADVISORY] |
| Wind > 30 km/h | Warning | [WARNING] |
| Temperature > 38°C | Alert | [HEAT ALERT] |

Findings are formatted with clear headers and operational recommendations.

## Data Storage

Weather observations are stored in `weather.db` (SQLite) with the following schema:

```sql
CREATE TABLE weather_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    city TEXT,
    temperature REAL,
    humidity REAL,
    rain REAL,
    wind_speed REAL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Hooks

A PreToolUse hook logs all `get_weather` tool invocations to `.skyguard.log`:

```bash
[SKYGUARD LOG] Tool request: get_weather
```

## Development

### Building

```bash
npm run build
```

### Running

```bash
npm start
```

### Testing

```bash
npm test
```

## License

MIT
