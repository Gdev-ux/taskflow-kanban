#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import pg from "pg";

const { Client } = pg;
const __dirname = dirname(fileURLToPath(import.meta.url));
const sqlPath = resolve(__dirname, "..", "db", "seed.sql");

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Add it to your .env or export it before running `pnpm seed`.");
  process.exit(1);
}

const sql = readFileSync(sqlPath, "utf8");
const client = new Client({ connectionString: process.env.DATABASE_URL });

try {
  await client.connect();
  console.log("Connected. Seeding database...");
  await client.query(sql);
  console.log("Seed complete.");
} catch (err) {
  console.error("Seed failed:", err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
