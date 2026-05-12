import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as schema from "./schema.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultPath = path.join(__dirname, "../../data/app.db");
const filePath = process.env.APP_DB_PATH ?? defaultPath;
fs.mkdirSync(path.dirname(filePath), { recursive: true });

const sqlite = new Database(filePath);
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite, { schema });
export { sqlite };
