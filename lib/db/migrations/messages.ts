import type BetterSqlite3 from "better-sqlite3";

type Database = BetterSqlite3.Database;

export function up(db: Database) {
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        socket_id TEXT NOT NULL,
        sender TEXT NOT NULL,
        message_text TEXT NOT NULL,
        platform TEXT DEFAULT 'web',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (socket_id) REFERENCES connections(socket_id)
      )
    `);

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_messages_socket_id
        ON messages(socket_id);
      CREATE INDEX IF NOT EXISTS idx_messages_created_at
        ON messages(created_at);
    `);

    console.log("[DB] Messages migration applied");
  } catch (error) {
    console.error("[DB] Error in messages migration (up):", error);
    throw error;
  }
}

export function down(db: Database) {
  try {
    db.exec(`
      DROP INDEX IF EXISTS idx_messages_socket_id;
      DROP INDEX IF EXISTS idx_messages_created_at;
      DROP TABLE IF EXISTS messages;
    `);

    console.log("[DB] Messages migration rolled back");
  } catch (error) {
    console.error("[DB] Error in messages migration (down):", error);
    throw error;
  }
}
