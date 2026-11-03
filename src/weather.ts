import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const API_URL = process.env.SKYGUARD_API_URL ?? "https://api.open-meteo.com/v1/forecast";
const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";

export interface Coordinates {
    latitude: number;
    longitude: number;
    city: string;
}

export interface WeatherReading {
    city: string;
    temperature_celsius: number;
    humidity_percent: number;
    rain_mm: number;
    wind_speed_kmh: number;
    timestamp: string;
}

/** Where readings are stored: SKYGUARD_DATA_DIR, then the plugin's data dir, then ~/.skyguard. */
export function dataDir(): string {
    const candidates = [process.env.SKYGUARD_DATA_DIR, process.env.CLAUDE_PLUGIN_DATA];
    const dir = candidates.find((d) => d && !d.includes("${")) ?? join(homedir(), ".skyguard");
    mkdirSync(dir, { recursive: true });
    return dir;
}

const logFile = () => join(dataDir(), "weather-log.jsonl");

export async function geocodeCity(name: string): Promise<Coordinates> {
    const city = name.trim();
    if (!city) throw new Error("city name must not be empty");

    const url = new URL(GEOCODING_URL);
    url.searchParams.set("name", city);
    url.searchParams.set("count", "1");
    url.searchParams.set("language", "en");
    url.searchParams.set("format", "json");

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Geocoding API returned ${res.status}`);
    const hit = (await res.json()).results?.[0];
    if (!hit) throw new Error(`No location found for "${name}"`);

    return { latitude: hit.latitude, longitude: hit.longitude, city: hit.name };
}

export async function fetchWeather(latitude: number, longitude: number, city: string): Promise<WeatherReading> {
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) throw new Error(`Invalid latitude: ${latitude}`);
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) throw new Error(`Invalid longitude: ${longitude}`);

    const url = new URL(API_URL);
    url.searchParams.set("latitude", String(latitude));
    url.searchParams.set("longitude", String(longitude));
    url.searchParams.set("current", "temperature_2m,relative_humidity_2m,rain,wind_speed_10m");
    url.searchParams.set("timezone", "auto");

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Weather API returned ${res.status}: ${await res.text()}`);
    const cur = (await res.json()).current;
    if (!cur) throw new Error("Weather API response had no current conditions");

    const reading: WeatherReading = {
        city,
        temperature_celsius: cur.temperature_2m,
        humidity_percent: cur.relative_humidity_2m,
        rain_mm: cur.rain,
        wind_speed_kmh: cur.wind_speed_10m,
        timestamp: cur.time,
    };
    appendFileSync(logFile(), JSON.stringify(reading) + "\n");
    return reading;
}

export function recentReadings(limit = 20): WeatherReading[] {
    const file = logFile();
    if (!existsSync(file)) return [];
    return readFileSync(file, "utf8")
        .split("\n")
        .filter(Boolean)
        .map((line) => JSON.parse(line) as WeatherReading)
        .slice(-limit)
        .reverse();
}
