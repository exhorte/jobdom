import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { testDatabaseUrl } from "./db";

// Prisma's CLI run with this Node, as docker/start.sh does: `yarn` isn't an
// executable on Windows (Corepack puts a .cmd shim there), so execFileSync
// can't start it.
const prismaCli = fileURLToPath(new URL("../../node_modules/prisma/build/index.js", import.meta.url));

/** Creates the test database if needed and applies all migrations, once per test run. */
export default function setup() {
  execFileSync(process.execPath, [prismaCli, "migrate", "deploy"], {
    env: { ...process.env, DATABASE_URL: testDatabaseUrl() },
    stdio: "pipe",
  });
}
