// PreToolUse hook: records each get_weather call in the plugin's data directory.
import { appendFileSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

let input = "";
for await (const chunk of process.stdin) input += chunk;

try {
    const { tool_name, tool_input } = JSON.parse(input);
    const dir = process.env.SKYGUARD_DATA_DIR || process.env.CLAUDE_PLUGIN_DATA || join(homedir(), ".skyguard");
    mkdirSync(dir, { recursive: true });
    appendFileSync(join(dir, "audit.log"), `${new Date().toISOString()} ${tool_name} ${JSON.stringify(tool_input)}\n`);
} catch {
    // Auditing must never block the tool call.
}
process.exit(0);
