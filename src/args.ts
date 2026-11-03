export interface ParsedWeatherArgs {
    all: boolean;
    latitude?: number;
    longitude?: number;
    city?: string;
}

export function parseWeatherArgs(args: string[]): ParsedWeatherArgs {
    const parsed: ParsedWeatherArgs = { all: false };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        if (arg === "--all") {
            parsed.all = true;
            continue;
        }

        if (arg === "--lat" || arg === "--lon" || arg === "--city") {
            const value = args[i + 1];
            if (value === undefined) {
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

    if (parsed.all && (parsed.city !== undefined || parsed.latitude !== undefined || parsed.longitude !== undefined)) {
        throw new Error("--all cannot be combined with a city or coordinates");
    }

    if ((parsed.latitude === undefined) !== (parsed.longitude === undefined)) {
        throw new Error("Provide both --lat and --lon");
    }

    return parsed;
}
