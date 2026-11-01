import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import sqlite3 from "sqlite3";

const db = new sqlite3.Database("./weather.db");
db.run(`CREATE TABLE IF NOT EXISTS weather_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, city TEXT, temperature REAL, humidity REAL, rain REAL, wind_speed REAL, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)`);

const server = new Server({ name: "skyguard-weather", version: "1.0.0" }, { capabilities: { tools: {} } });

server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [{
        name: "get_weather",
        description: "Fetches current weather parameters for coordinates.",
        inputSchema: {
            type: "object",
            properties: { latitude: { type: "number" }, longitude: { type: "number" }, city_name: { type: "string" } },
            required: ["latitude", "longitude", "city_name"]
        }
    }]
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

async function main() { await server.connect(new StdioServerTransport()); }
main();