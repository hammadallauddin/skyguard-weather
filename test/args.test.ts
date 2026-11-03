import assert from "node:assert/strict";
import { test } from "node:test";
import { parseWeatherArgs } from "../src/args.js";

test("parses a city name", () => {
    assert.deepEqual(parseWeatherArgs(["Karachi"]), { all: false, city: "Karachi" });
});

test("parses coordinates and a city label", () => {
    assert.deepEqual(parseWeatherArgs(["--lat", "51.5", "--lon", "-0.1278", "--city", "London"]), {
        all: false,
        latitude: 51.5,
        longitude: -0.1278,
        city: "London",
    });
});

test("parses --all", () => {
    assert.deepEqual(parseWeatherArgs(["--all"]), { all: true });
});

test("rejects a half coordinate pair", () => {
    assert.throws(() => parseWeatherArgs(["--lat", "51.5"]), /both --lat and --lon/);
});

test("rejects a non-numeric coordinate", () => {
    assert.throws(() => parseWeatherArgs(["--lat", "north", "--lon", "0"]), /--lat must be a number/);
});

test("rejects unknown options", () => {
    assert.throws(() => parseWeatherArgs(["--bogus"]), /Unknown option/);
});

test("rejects --all combined with a city", () => {
    assert.throws(() => parseWeatherArgs(["--all", "Karachi"]), /--all cannot be combined/);
});
