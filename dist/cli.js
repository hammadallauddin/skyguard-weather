#!/usr/bin/env node

// src/args.ts
function parseWeatherArgs(args) {
  const parsed = { all: false };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--all") {
      parsed.all = true;
      continue;
    }
    if (arg === "--lat" || arg === "--lon" || arg === "--city") {
      const value = args[i + 1];
      if (value === void 0) {
        throw new Error(`${arg} requires a value`);
      }
      i++;
      if (arg === "--lat") {
        const latitude = Number(value);
        if (!Number.isFinite(latitude)) {
          throw new Error(`--lat must be a number, got "${value}"`);
        }
        parsed.latitude = latitude;
      } else if (arg === "--lon") {
        const longitude = Number(value);
        if (!Number.isFinite(longitude)) {
          throw new Error(`--lon must be a number, got "${value}"`);
        }
        parsed.longitude = longitude;
      } else {
        if (!value.trim()) {
          throw new Error("--city must not be empty");
        }
        parsed.city = value;
      }
      continue;
    }
    if (arg.startsWith("-")) {
      throw new Error(`Unknown option: ${arg}`);
    }
    parsed.city = arg;
  }
  if (parsed.all && (parsed.city !== void 0 || parsed.latitude !== void 0 || parsed.longitude !== void 0)) {
    throw new Error("--all cannot be combined with a city or coordinates");
  }
  if (parsed.latitude === void 0 !== (parsed.longitude === void 0)) {
    throw new Error("Provide both --lat and --lon");
  }
  return parsed;
}

// src/weather.ts
import { appendFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
var API_URL = process.env.SKYGUARD_API_URL ?? "https://api.open-meteo.com/v1/forecast";
var GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
function dataDir() {
  const candidates = [process.env.SKYGUARD_DATA_DIR, process.env.CLAUDE_PLUGIN_DATA];
  const dir = candidates.find((d) => d && !d.includes("${")) ?? join(homedir(), ".skyguard");
  mkdirSync(dir, { recursive: true });
  return dir;
}
var logFile = () => join(dataDir(), "weather-log.jsonl");
async function geocodeCity(name) {
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
async function cmdWeather(args) {
  const parsed = parseWeatherArgs(args);
  if (parsed.all) {
    const readings = recentReadings();
    if (readings.length === 0) {
      console.log("No readings logged yet.");
      return;
    }
    for (const r of readings) {
      console.log(
        `${r.city}: ${r.temperature_celsius}\xB0C, humidity ${r.humidity_percent}%, rain ${r.rain_mm}mm, wind ${r.wind_speed_kmh}km/h (${r.timestamp})`
      );
    }
    return;
  }
  let latitude = parsed.latitude;
  let longitude = parsed.longitude;
  let city = parsed.city;
  if (latitude === void 0 || longitude === void 0) {
    if (!city) throw new Error(USAGE);
    const place = await geocodeCity(city);
    latitude = place.latitude;
    longitude = place.longitude;
    city = place.city;
  }
  console.log(
    JSON.stringify(
      await fetchWeather(latitude, longitude, city ?? `${latitude},${longitude}`),
      null,
      2
    )
  );
}
var [cmd, ...rest] = process.argv.slice(2);
try {
  if (cmd === "weather" || cmd === "w") await cmdWeather(rest);
  else if (cmd === "config") {
    console.log(
      `Readings are stored in ${dataDir()}/weather-log.jsonl
Override with SKYGUARD_DATA_DIR; set SKYGUARD_API_URL to use another Open-Meteo endpoint.`
    );
  } else console.log(USAGE);
} catch (e) {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
}
