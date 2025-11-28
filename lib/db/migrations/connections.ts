import type BetterSqlite3 from "better-sqlite3";

type Database = BetterSqlite3.Database;

export function up(db: Database) {
  try {
    // Create connections table
    db.exec(`
      CREATE TABLE IF NOT EXISTS connections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        socket_id TEXT UNIQUE NOT NULL,
        platform TEXT DEFAULT 'unknown',
        user_id TEXT,
        connected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        disconnected_at DATETIME,
        duration_ms INTEGER,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Indexes
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_connections_socket_id
        ON connections(socket_id);
      CREATE INDEX IF NOT EXISTS idx_connections_created_at
        ON connections(created_at);
    `);

    console.log("[DB] Connections migration applied");
  } catch (error) {
    console.error("[DB] Error in connections migration (up):", error);
    throw error;
  }
}

export function down(db: Database) {
  try {
    db.exec(`
      DROP INDEX IF EXISTS idx_connections_socket_id;
      DROP INDEX IF EXISTS idx_connections_created_at;
      DROP TABLE IF EXISTS connections;
    `);

    console.log("[DB] Connections migration rolled back");
  } catch (error) {
    console.error("[DB] Error in connections migration (down):", error);
    throw error;
  }
}
