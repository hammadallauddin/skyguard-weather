#!/usr/bin/env node

// src/weather.ts
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
var API_URL = process.env.SKYGUARD_API_URL ?? "https://api.open-meteo.com/v1/forecast";
function dataDir() {
  const candidates = [process.env.SKYGUARD_DATA_DIR, process.env.CLAUDE_PLUGIN_DATA];
  const dir = candidates.find((d) => d && !d.includes("${")) ?? join(homedir(), ".skyguard");
  mkdirSync(dir, { recursive: true });
  return dir;
}
var logFile = () => join(dataDir(), "weather-log.jsonl");
async function fetchWeather(latitude, longitude, city) {
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
  const reading = {
    city,
    temperature_celsius: cur.temperature_2m,
    humidity_percent: cur.relative_humidity_2m,
    rain_mm: cur.rain,
    wind_speed_kmh: cur.wind_speed_10m,
    timestamp: cur.time
  };
  appendFileSync(logFile(), JSON.stringify(reading) + "\n");
  return reading;
}
function recentReadings(limit = 20) {
  const file = logFile();
  if (!existsSync(file)) return [];
  return readFileSync(file, "utf8").split("\n").filter(Boolean).map((line) => JSON.parse(line)).slice(-limit).reverse();
}

// src/cli.ts
var USAGE = `SkyGuard Weather CLI

Usage:
  skyguard weather <city>                          Look up a city by name
  skyguard weather --lat <lat> --lon <lon> [--city <name>]
  skyguard weather --all                           Show the 20 most recent readings
  skyguard config                                  Show where readings are stored`;
async function geocode(name) {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", name);
  url.searchParams.set("count", "1");
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Geocoding API returned ${res.status}`);
  const hit = (await res.json()).results?.[0];
  if (!hit) throw new Error(`No location found for "${name}"`);
  return { latitude: hit.latitude, longitude: hit.longitude, name: hit.name };
}
async function cmdWeather(args) {
  if (args.includes("--all")) {
    for (const r of recentReadings()) {
      console.log(`${r.city}: ${r.temperature_celsius}\xB0C, humidity ${r.humidity_percent}%, rain ${r.rain_mm}mm, wind ${r.wind_speed_kmh}km/h (${r.timestamp})`);
    }
    return;
  }
  let lat, lon, city;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--lat") lat = parseFloat(args[++i]);
    else if (args[i] === "--lon") lon = parseFloat(args[++i]);
    else if (args[i] === "--city") city = args[++i];
    else if (!args[i].startsWith("-")) city = args[i];
  }
  if (lat === void 0 || lon === void 0) {
    if (!city) throw new Error(USAGE);
    const place = await geocode(city);
    ({ latitude: lat, longitude: lon } = place);
    city = place.name;
  }
  console.log(JSON.stringify(await fetchWeather(lat, lon, city ?? `${lat},${lon}`), null, 2));
}
var [cmd, ...rest] = process.argv.slice(2);
try {
  if (cmd === "weather" || cmd === "w") await cmdWeather(rest);
  else if (cmd === "config") console.log(`Readings are stored in ${dataDir()}/weather-log.jsonl
Override with SKYGUARD_DATA_DIR; set SKYGUARD_API_URL to use another Open-Meteo endpoint.`);
  else console.log(USAGE);
} catch (e) {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
}
