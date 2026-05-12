import { betterAuth } from "better-auth";
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultPath = path.join(__dirname, "../../data/auth.db");
const filePath = process.env.AUTH_DB_PATH ?? defaultPath;
fs.mkdirSync(path.dirname(filePath), { recursive: true });

const sqlite = new Database(filePath);
sqlite.pragma("journal_mode = WAL");

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET ?? "local-dev-secret-minimum-32-characters-long",
  database: sqlite,
  emailAndPassword: { enabled: true },
  basePath: "/api/auth",
  trustedOrigins: [process.env.CLIENT_ORIGIN ?? "http://localhost:5173"],
});
