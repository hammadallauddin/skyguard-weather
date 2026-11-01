import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { fetchWeather } from "./weather.js";

const server = new Server({ name: "skyguard-weather", version: "1.1.0" }, { capabilities: { tools: {} } });

server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
        {
            name: "get_weather",
            description: "Fetches current temperature (°C), humidity (%), rain (mm) and wind speed (km/h) for a location.",
            inputSchema: {
                type: "object",
                properties: {
                    latitude: { type: "number", description: "Latitude in decimal degrees" },
                    longitude: { type: "number", description: "Longitude in decimal degrees" },
                    city_name: { type: "string", description: "Name of the place, used as a label" },
                },
                required: ["latitude", "longitude", "city_name"],
            },
        },
    ],
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
    if (req.params.name !== "get_weather") throw new Error(`Unknown tool: ${req.params.name}`);
    const { latitude, longitude, city_name } = (req.params.arguments ?? {}) as Record<string, unknown>;
    try {
        const reading = await fetchWeather(Number(latitude), Number(longitude), String(city_name ?? "Unknown"));
        return { content: [{ type: "text", text: JSON.stringify(reading, null, 2) }] };
    } catch (e) {
        return { isError: true, content: [{ type: "text", text: e instanceof Error ? e.message : String(e) }] };
    }
});

await server.connect(new StdioServerTransport());
