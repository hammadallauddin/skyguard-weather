# SkyGuard Weather

A real-time weather monitoring and safety alert system for Claude Code. Fetch weather data, log observations, and get safety alerts with simple commands.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Build and setup
npm run build

# 3. Use it immediately
npm run cli weather Karachi
npm run cli weather -- --lat 51.5 --lon -0.1278 --city London
```

That's it! You're ready to check weather from your terminal.

---

## Installation

### As a Claude Code Plugin (Recommended)

```bash
# Publish to GitHub first (see README for details)
claude plugin install github:hammadallauddin/skyguard-weather
```

### Direct CLI Installation

```bash
npm install
npm run build
npx skyguard weather Karachi
```

---

## Commands

| Command | Description |
|---------|-------------|
| `skyguard weather <city>` | Check weather for any city |
| `skyguard weather --lat 51.5 --lon -0.1278` | Check by coordinates |
| `skyguard weather --all` | View recent logs |
| `skyguard init` | Initialize database |
| `skyguard config` | Show configuration |

---

## Usage Examples

### Check Weather for a City

```bash
npm run cli weather Karachi
```

**Output:**
```json
{
  "city": "Karachi",
  "temperature_celsius": 32.5,
  "humidity_percent": 68,
  "rain_mm": 0.0,
  "wind_speed_kmh": 22.1,
  "timestamp": "2026-11-01T12:00:00"
}
```

### Use Coordinates

```bash
npm run cli weather -- --lat 51.5 --lon -0.1278 --city London
```

### View Recent Logs

```bash
npm run cli weather -- --all
```

### Initialize Database

```bash
npm run cli init
```

---

## MCP Server (For Claude Code)

Once installed as a plugin, the `get_weather` tool is available in Claude Code:

```
User: Check weather in Karachi
Assistant: ← Calls get_weather tool → Returns weather data + safety assessment
```

### MCP Configuration

For Claude Code users, add to `.mcp.json`:

```json
{
    "mcpServers": {
        "skyguard-weather": {
            "command": "node",
            "args": ["${CLAUDE_PLUGIN_ROOT}/dist/mcp-server.js"]
        }
    }
}
```

---

## Safety Evaluation Rules

| Condition | Severity | Label |
|-----------|----------|-------|
| Rain > 0.0 mm | Advisory | `[ADVISORY]` |
| Wind > 30 km/h | Warning | `[WARNING]` |
| Temperature > 38°C | Alert | `[HEAT ALERT]` |

**Example:** Karachi (41.2°C) → `[HEAT ALERT]` - Stay hydrated, avoid outdoor activities during peak hours.

---

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SKYGUARD_DB_PATH` | `./weather.db` | SQLite database location |
| `SKYGUARD_LOG_FILE` | `.skyguard.log` | Audit log location |
| `SKYGUARD_API_URL` | `https://api.open-meteo.com/v1/forecast` | Weather API URL |

### MCP Configuration

```json
{
    "mcpServers": {
        "skyguard-weather": {
            "command": "node",
            "args": ["${CLAUDE_PLUGIN_ROOT}/dist/mcp-server.js"]
        }
    }
}
```

---

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
├── scripts/                   # Utility scripts
│   ├── setup-plugin.cjs              # Plugin publishing script
│   └── copy-to-dist.cjs            # Build helper
├── skills/                    # Skill definitions
│   └── skyguard-analyzer/         # Weather risk evaluation skill
│       └── SKILL.md                # Risk categorization rules
├── src/                       # TypeScript source
│   ├── cli.ts                      # Command line interface
│   └── mcp-server.ts               # MCP server implementation
├── dist/                      # Compiled output (generated)
├── .mcp.json                  # MCP server configuration
├── .claude-plugin/            # Claude plugin metadata
│   └── plugin.json
├── README.md
└── package.json
```

---

## Data Storage

Weather observations are stored in `weather.db` (SQLite):

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

Query with:
```bash
sqlite3 weather.db "SELECT * FROM weather_logs;"
```

---

## Development

### Building

```bash
npm run build
```

### Running

```bash
npm run dev      # Development mode
npm run start    # Production mode
npm run cli      # CLI mode
```

---

## License

MIT
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



## Plugin Installation

This project can be installed as a Claude Code plugin! You can install it either:

### Option 1: From GitHub (Recommended)

1. **Create a GitHub repository** and push this project to it (e.g., `github:hammadallauddin/skyguard-weather`)

2. **Install the plugin** in Claude Code:
   ```bash
   claude plugin install github:hammadallauddin/skyguard-weather
   ```

3. **Restart Claude Code** to activate the plugin

### Option 2: Local Development Installation

For local development, you can install directly from your filesystem:

```bash
# Replace with your local path
claude plugin install ./skyguard-weather
```

### Verifying Installation

After installation, verify the plugin is active:

```bash
claude plugin list
```

You should see `skyguard-weather` in the list.

### Available Commands After Installation

Once installed, you can use:

```bash
# Check weather for any city
/check-weather Karachi
/check-weather London
/check-weather Tokyo

# The get_weather MCP tool is available
# The weather-investigator agent can be used for detailed checks
```

### Uninstalling

```bash
claude plugin uninstall skyguard-weather
```

## Setup from Scratch

If you want to publish this project to GitHub yourself:

1. Create a new repository on GitHub named `skyguard-weather`
2. Initialize git locally (already done in this project)
3. Push to GitHub:
   ```bash
   git remote add origin https://github.com/hammadallauddin/skyguard-weather.git
   git branch -M main
   git push -u origin main
   ```
4. Install in Claude Code:
   ```bash
   claude plugin install github:hammadallauddin/skyguard-weather
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


## Examples

### Example 1: Basic Weather Check with get_weather Tool

**Input:**
```json
{
    "latitude": 25.2048,
    "longitude": 55.2708,
    "city_name": "Dubai"
}
```

**Output:**
```json
{
  "city": "Dubai",
  "temperature_celsius": 36.2,
  "humidity_percent": 45,
  "rain_mm": 0.0,
  "wind_speed_kmh": 18.5,
  "timestamp": "2026-11-01T14:30:00"
}
```

**Safety Assessment:**
- Rain: 0.0 mm → No advisory (no precipitation)
- Wind: 18.5 km/h → No warning (below 30 km/h threshold)
- Temperature: 36.2°C → No heat alert (below 38°C threshold)

**Result:** Safe to travel. Normal weather conditions.

---

### Example 2: Checking Heat Alert Conditions

**Input:**
```json
{
    "latitude": 30.0444,
    "longitude": 31.2357,
    "city_name": "Cairo"
}
```

**Output:**
```json
{
  "city": "Cairo",
  "temperature_celsius": 40.1,
  "humidity_percent": 22,
  "rain_mm": 0.0,
  "wind_speed_kmh": 12.0,
  "timestamp": "2026-11-01T12:00:00"
}
```

**Safety Assessment:**
- Rain: 0.0 mm → No advisory
- Wind: 12.0 km/h → No warning
- Temperature: 40.1°C → **Heat Alert** (above 38°C threshold)

**Result:** [HEAT ALERT] Extreme heat warning. Recommend:
- Avoid outdoor activities during peak hours (12:00-16:00)
- Stay hydrated
- Check on vulnerable populations

---

### Example 3: Rain Advisory Conditions

**Input:**
```json
{
    "latitude": 40.7128,
    "longitude": -74.0060,
    "city_name": "New York"
}
```

**Output:**
```json
{
  "city": "New York",
  "temperature_celsius": 15.3,
  "humidity_percent": 85,
  "rain_mm": 5.2,
  "wind_speed_kmh": 25.1,
  "timestamp": "2026-11-01T13:00:00"
}
```

**Safety Assessment:**
- Rain: 5.2 mm → **Advisory** (above 0.0 mm threshold)
- Wind: 25.1 km/h → No warning
- Temperature: 15.3°C → No heat alert

**Result:** [ADVISORY] Rain expected. Recommend:
- Carry umbrella
- Expect slippery roads
- Allow extra travel time

---

### Example 4: Wind Warning Conditions

**Input:**
```json
{
    "latitude": 55.9533,
    "longitude": -3.1883,
    "city_name": "Edinburgh"
}
```

**Output:**
```json
{
  "city": "Edinburgh",
  "temperature_celsius": 8.7,
  "humidity_percent": 78,
  "rain_mm": 0.3,
  "wind_speed_kmh": 42.5,
  "timestamp": "2026-11-01T14:00:00"
}
```

**Safety Assessment:**
- Rain: 0.3 mm → Advisory
- Wind: 42.5 km/h → **Warning** (above 30 km/h threshold)
- Temperature: 8.7°C → No heat alert

**Result:** [WARNING] Strong winds. Recommend:
- Secure loose outdoor items
- Exercise caution cycling or Motorbiking
- Be aware of flying debris

---

### Example 5: Using the /check-weather Command

```bash
# Check weather for any city
/check-weather Karachi

# Example output (conceptual):
# ==========================================
# WEATHER CHECK: Karachi, Pakistan
# ==========================================
# Temperature: 32.5°C
# Humidity: 68%
# Rain: 0.0 mm
# Wind: 22.1 km/h
#
# [ADVISORY] Rain detected in nearby areas
# [OK] Conditions acceptable for outdoor activities
# ==========================================
```

---

### Example 6: Using the weather-investigator Agent

When Claude needs a detailed weather safety assessment for a specific location:

```
User: "Check if it's safe to hike in the mountains near Shimla for tomorrow"

Claude: (invokes weather-investigator agent)
         → Fetches current weather at Shimla coordinates
         → Analyzes conditions
         → Returns safety assessment

Agent Output:
"⚠️ Weather Safety Assessment for Shimla Mountains

- Temperature: 14.2°C, Wind: 35.8 km/h → [WARNING] Gusty conditions
- Rain: 2.1 mm → [ADVISORY] Possible rain
- Recommendation: Use trekking poles, avoid exposed ridges during high winds"
```

---

### Example 7: Querying Historical Weather Data

```bash
# Query the SQLite database for recent logs
sqlite3 weather.db "SELECT city, temperature, wind_speed, timestamp FROM weather_logs ORDER BY timestamp DESC LIMIT 5;"

# Example output:
# city     | temperature | wind_speed | timestamp
# -------- | ----------- | ---------- | -------------------
# Karachi  | 32.5        | 22.1       | 2026-11-01 12:00:00
# Lahore   | 30.1        | 15.3       | 2026-11-01 11:00:00
# Islamabad| 28.4        | 12.7       | 2026-11-01 10:00:00
```

---

### Example 8: Complete Workflow - Multi-City Comparison

```bash
# Check multiple cities
/check-weather Karachi
/check-weather Lahore
/check-weather Islamabad
```

Compare conditions and identify which city need should be prioritized for planning:

```
■ comparison:
- Karachi: 32.5°C, Wind 22 km/h → [ADVISORY] Rain nearby
- Lahore: 30.1°C, Wind 15 km/h → Safe
- Islamabad: 28.4°C, Wind 12 km/h → Optimal conditions
```

---

## License

MIT

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
