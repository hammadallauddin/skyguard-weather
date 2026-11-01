#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import sqlite3 from "sqlite3";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

const db = new sqlite3.Database("./weather.db");
db.run(`CREATE TABLE IF NOT EXISTS weather_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    city TEXT,
    temperature REAL,
    humidity REAL,
    rain REAL,
    wind_speed REAL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// CLI command handlers
async function cmdWeather(args: string[]) {
    if (args.length < 1) {
        console.log("Usage: skyguard weather <city>");
        console.log("       skyguard weather --lat 51.5 --lon -0.1 --city London");
        console.log("");
        console.log("Examples:");
        console.log("  skyguard weather Karachi");
        console.log("  skyguard weather --lat 51.5 --lon -0.1278 --city London");
        console.log("  skyguard weather --all");
        return;
    }

    let lat: number | undefined, lon: number | undefined, city: string | undefined;

    for (let i = 0; i < args.length; i++) {
        if (args[i] === "--lat" && args[i + 1]) {
            lat = parseFloat(args[++i]);
        } else if (args[i] === "--lon" && args[i + 1]) {
            lon = parseFloat(args[++i]);
        } else if (args[i] === "--city" && args[i + 1]) {
            city = args[++i];
        } else if (!args[i].startsWith("-")) {
            city = args[i];
        }
    }

    if (city === "--all") {
        return new Promise((resolve, reject) => {
            db.all(`SELECT city, temperature, humidity, rain, wind_speed, timestamp FROM weather_logs ORDER BY timestamp DESC LIMIT 20`, (err, rows) => {
                if (err) reject(err);
                else {
                    console.log("=== Recent Weather Logs ===");
                    rows.forEach((r: any) => {
                        console.log(`${r.city}: ${r.temperature}°C, Humidity ${r.humidity}%, Rain ${r.rain}mm, Wind ${r.wind_speed}km/h (${r.timestamp})`);
                    });
                    resolve(true);
                }
            });
        });
    }

    if (lat !== undefined && lon !== undefined && city) {
        console.log(`Fetching weather for ${city}...`);
        try {
            const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,rain,wind_speed_10m`);
            const data = await res.json();
            const cur = data.current;

            db.run(`INSERT INTO weather_logs (city, temperature, humidity, rain, wind_speed) VALUES (?, ?, ?, ?, ?)`, [city, cur.temperature_2m, cur.relative_humidity_2m, cur.rain, cur.wind_speed_10m]);

            console.log(JSON.stringify({
                city,
                temperature_celsius: cur.temperature_2m,
                humidity_percent: cur.relative_humidity_2m,
                rain_mm: cur.rain,
                wind_speed_kmh: cur.wind_speed_10m,
                timestamp: cur.time
            }, null, 2));
        } catch (e) {
            console.error("Error fetching weather:", e);
            process.exit(1);
        }
    } else {
        console.log("Usage: skyguard weather <city>");
        console.log("       skyguard weather --lat <lat> --lon <lon> --city <name>");
        console.log("       skyguard weather --all");
    }

// MCP Server
const server = new Server({ name: "skyguard-weather", version: "1.0.0" }, { capabilities: { tools: {} } });

server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
        {
            name: "get_weather",
            description: "Fetches current weather parameters for coordinates.",
            inputSchema: {
                type: "object",
                properties: { latitude: { type: "number" }, longitude: { type: "number" }, city_name: { type: "string" } },
                required: ["latitude", "longitude", "city_name"]
            }
        }
    ]
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
    if (req.params.name === "get_weather") {
        const { latitude, longitude, city_name } = req.params.arguments as any;
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,rain,wind_speed_10m`);
        const data = await res.json();
        const cur = data.current;

        db.run(`INSERT INTO weather_logs (city, temperature, humidity, rain, wind_speed) VALUES (?, ?, ?, ?, ?)`, [city_name, cur.temperature_2m, cur.relative_humidity_2m, cur.rain, cur.wind_speed_10m]);

        return { content: [{ type: "text", text: JSON.stringify({ city: city_name, temperature_celsius: cur.temperature_2m, humidity_percent: cur.relative_humidity_2m, rain_mm: cur.rain, wind_speed_kmh: cur.wind_speed_10m, timestamp: cur.time }, null, 2) }] };
    }
    throw new Error("Tool not found");
});

// Parse CLI args
const args = process.argv.slice(2);

if (args[0] === "weather" || args[0] === "w") {
    await cmdWeather(args.slice(1));
} else if (args[0] === "config") {
    console.log("SkyGuard Weather Configuration");
    console.log("============================");
    console.log("Environment variables:");
    console.log("  SKYGUARD_DB_PATH    - SQLite database path (default: ./weather.db)");
    console.log("  SKYGUARD_LOG_FILE   - Audit log file path (default: .skyguard.log)");
    console.log("  SKYGUARD_API_URL    - Weather API URL (default: https://api.open-meteo.com/v1/forecast)");
    console.log("");
    console.log("MCP config (for Claude Code):");
    console.log('  Add to your .mcp.json:');
    console.log('  {');
    console.log('    "mcpServers": {');
    console.log('      "skyguard-weather": {');
    console.log('        "command": "node",');
    console.log('        "args": ["${CLAUDE_PLUGIN_ROOT}/dist/mcp-server.js"]');
    console.log("      }");
    console.log("    }");
    console.log("  }");
} else if (args[0] === "init") {
    db.run(`CREATE TABLE IF NOT EXISTS weather_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        city TEXT,
        temperature REAL,
        humidity REAL,
        rain REAL,
        wind_speed REAL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    console.log("Database initialized: weather.db");
} else if (args[0] === "help" || args[0] === "-h" || args[0] === "--help") {
    console.log("SkyGuard Weather CLI");
    console.log("====================");
    console.log("");
    console.log("Commands:");
    console.log("  weather [options] <city>  Fetch weather for a city");
    console.log("  config                  Show configuration info");
    console.log("  init                    Initialize SQLite database");
    console.log("  --help, -h              Show this help message");
    console.log("");
    console.log("Quick Start:");
    console.log("  1. npm install");
    console.log("  2. npm run build");
    console.log("  3. npm run cli weather Karachi");
    console.log("  4. npm run cli weather -- --lat 51.5 --lon -0.1278 --city London");
} else {
    // Default: run MCP server
    console.log("Starting SkyGuard Weather MCP Server...");
    async function main() {
        await server.connect(new StdioServerTransport());
    }
    main().catch((error) => {
        console.error("Server error:", error);
        process.exit(1);
    });
}
}
