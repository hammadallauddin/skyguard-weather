import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { fetchWeather, geocodeCity } from "./weather.js";

const server = new Server({ name: "skyguard-weather", version: "1.2.0" }, { capabilities: { tools: {} } });

server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
        {
            name: "get_weather",
            description:
                "Fetches current temperature (°C), humidity (%), rain (mm) and wind speed (km/h) " +
                "for a city name or explicit coordinates. When latitude and longitude are omitted, " +
                "the city name is geocoded first.",
            inputSchema: {
                type: "object",
                properties: {
                    city_name: { type: "string", description: "Name of the place to look up" },
                    latitude: {
                        type: "number",
                        description: "Latitude in decimal degrees. Optional when city_name is provided.",
                    },
                    longitude: {
                        type: "number",
                        description: "Longitude in decimal degrees. Optional when city_name is provided.",
                    },
                },
                required: ["city_name"],
            },
        },
    ],
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
    if (req.params.name !== "get_weather") throw new Error(`Unknown tool: ${req.params.name}`);

    const { latitude, longitude, city_name } = (req.params.arguments ?? {}) as Record<string, unknown>;

    try {
        const cityName = typeof city_name === "string" ? city_name.trim() : "";
        if (!cityName) throw new Error("city_name is required");

        let resolvedLatitude: number;
        let resolvedLongitude: number;
        let resolvedCity = cityName;

        if (latitude !== undefined || longitude !== undefined) {
            if (typeof latitude !== "number" || typeof longitude !== "number") {
                throw new Error("latitude and longitude must both be numbers");
            }
            resolvedLatitude = latitude;
            resolvedLongitude = longitude;
        } else {
            const place = await geocodeCity(cityName);
            resolvedLatitude = place.latitude;
            resolvedLongitude = place.longitude;
            resolvedCity = place.city;
        }

        const reading = await fetchWeather(resolvedLatitude, resolvedLongitude, resolvedCity);
        return { content: [{ type: "text", text: JSON.stringify(reading, null, 2) }] };
    } catch (e) {
        return { isError: true, content: [{ type: "text", text: e instanceof Error ? e.message : String(e) }] };
    }
});

await server.connect(new StdioServerTransport());
