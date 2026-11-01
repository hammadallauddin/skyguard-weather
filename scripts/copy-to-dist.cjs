#!/usr/bin/env node
/*
 * Copy helper scripts needed at runtime to dist folder
 */

import { cpSync, mkdirSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, "..", "dist");

// Ensure dist directory exists
if (!existsSync(distDir)) {
    mkdirSync(distDir, { recursive: true });
}

// Copy scripts that need to be run from dist
const scriptsToCopy = [
    { src: join(__dirname, "..", "hooks", "scripts", "audit.sh"), dest: join(distDir, "hooks", "scripts", "audit.sh") }
];

for (const { src, dest } of scriptsToCopy) {
    if (existsSync(src)) {
        const destDir = dirname(dest);
        if (!existsSync(destDir)) {
            mkdirSync(destDir, { recursive: true });
        }
        cpSync(src, dest, { recursive: true });
        console.log(`Copied: ${dest}`);
    }
}

console.log("Build complete.");