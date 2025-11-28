import Database from "better-sqlite3";
import path from "path";

// Path to SQLite file
const dbPath = path.join(process.cwd(), "socket_events.db");

// Create singleton DB connection
const db = new Database(dbPath);

// Enable foreign keys
db.pragma("foreign_keys = ON");

console.log("[DB] Using database at:", dbPath);

export { db, dbPath };
export default db;
