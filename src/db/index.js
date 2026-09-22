// Opens (and, on first run, creates) the SQLite database file using
// Node's built-in `node:sqlite` module - no native binary download or
// external database server required. On every boot we also run
// schema.sql, whose CREATE TABLE IF NOT EXISTS statements make this safe
// to run repeatedly (a lightweight stand-in for a migration tool).
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const rawUrl = process.env.DATABASE_URL || "file:./data/dev.db";
const relativePath = rawUrl.startsWith("file:") ? rawUrl.slice(5) : rawUrl;
const dbPath = path.isAbsolute(relativePath) ? relativePath : path.join(process.cwd(), relativePath);

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new DatabaseSync(dbPath);
db.exec("PRAGMA foreign_keys = ON;");

const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf-8");
db.exec(schema);

export default db;
