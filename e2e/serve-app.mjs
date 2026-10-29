// Starts the app for an end-to-end run (see playwright.config.ts): the
// migrations, the static files the standalone server doesn't copy itself, then
// the server, as in the production image. Plain Node, so it runs the same on
// Windows, where a spawned shell has neither `yarn` nor `cp`.
import { execFileSync } from "node:child_process";
import { cpSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = path.resolve(import.meta.dirname, "..");
const standalone = path.join(root, ".next", "standalone");

execFileSync(process.execPath, [path.join(root, "node_modules", "prisma", "build", "index.js"), "migrate", "deploy"], {
  cwd: root,
  stdio: "inherit",
});
cpSync(path.join(root, "public"), path.join(standalone, "public"), { recursive: true });
cpSync(path.join(root, ".next", "static"), path.join(standalone, ".next", "static"), { recursive: true });

await import(pathToFileURL(path.join(standalone, "server.js")).href);
