import { dataDir, fetchWeather, recentReadings } from "./weather.js";

const USAGE = `SkyGuard Weather CLI

Usage:
  skyguard weather <city>                          Look up a city by name
  skyguard weather --lat <lat> --lon <lon> [--city <name>]
  skyguard weather --all                           Show the 20 most recent readings
  skyguard config                                  Show where readings are stored`;

async function geocode(name: string): Promise<{ latitude: number; longitude: number; name: string }> {
    const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
    url.searchParams.set("name", name);
    url.searchParams.set("count", "1");
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Geocoding API returned ${res.status}`);
    const hit = (await res.json()).results?.[0];
    if (!hit) throw new Error(`No location found for "${name}"`);
    return { latitude: hit.latitude, longitude: hit.longitude, name: hit.name };
}

async function cmdWeather(args: string[]) {
    if (args.includes("--all")) {
        for (const r of recentReadings()) {
            console.log(`${r.city}: ${r.temperature_celsius}°C, humidity ${r.humidity_percent}%, rain ${r.rain_mm}mm, wind ${r.wind_speed_kmh}km/h (${r.timestamp})`);
        }
        return;
    }

    let lat: number | undefined, lon: number | undefined, city: string | undefined;
    for (let i = 0; i < args.length; i++) {
        if (args[i] === "--lat") lat = parseFloat(args[++i]);
        else if (args[i] === "--lon") lon = parseFloat(args[++i]);
        else if (args[i] === "--city") city = args[++i];
        else if (!args[i].startsWith("-")) city = args[i];
    }

    if (lat === undefined || lon === undefined) {
        if (!city) throw new Error(USAGE);
        const place = await geocode(city);
        ({ latitude: lat, longitude: lon } = place);
        city = place.name;
    }
    console.log(JSON.stringify(await fetchWeather(lat, lon, city ?? `${lat},${lon}`), null, 2));
}

const [cmd, ...rest] = process.argv.slice(2);
try {
    if (cmd === "weather" || cmd === "w") await cmdWeather(rest);
    else if (cmd === "config") console.log(`Readings are stored in ${dataDir()}/weather-log.jsonl\nOverride with SKYGUARD_DATA_DIR; set SKYGUARD_API_URL to use another Open-Meteo endpoint.`);
    else console.log(USAGE);
} catch (e) {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
}
