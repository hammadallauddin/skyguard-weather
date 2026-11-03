import { parseWeatherArgs } from "./args.js";
import { dataDir, fetchWeather, geocodeCity, recentReadings } from "./weather.js";

const USAGE = `SkyGuard Weather CLI

Usage:
  skyguard weather <city>                          Look up a city by name
  skyguard weather --lat <lat> --lon <lon> [--city <name>]
  skyguard weather --all                           Show the 20 most recent readings
  skyguard config                                  Show where readings are stored`;

async function cmdWeather(args: string[]): Promise<void> {
    const parsed = parseWeatherArgs(args);

    if (parsed.all) {
        const readings = recentReadings();
        if (readings.length === 0) {
            console.log("No readings logged yet.");
            return;
        }
        for (const r of readings) {
            console.log(
                `${r.city}: ${r.temperature_celsius}°C, humidity ${r.humidity_percent}%, ` +
                `rain ${r.rain_mm}mm, wind ${r.wind_speed_kmh}km/h (${r.timestamp})`
            );
        }
        return;
    }

    let latitude = parsed.latitude;
    let longitude = parsed.longitude;
    let city = parsed.city;

    if (latitude === undefined || longitude === undefined) {
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

const [cmd, ...rest] = process.argv.slice(2);
try {
    if (cmd === "weather" || cmd === "w") await cmdWeather(rest);
    else if (cmd === "config") {
        console.log(
            `Readings are stored in ${dataDir()}/weather-log.jsonl\n` +
            `Override with SKYGUARD_DATA_DIR; set SKYGUARD_API_URL to use another Open-Meteo endpoint.`
        );
    } else console.log(USAGE);
} catch (e) {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
}
