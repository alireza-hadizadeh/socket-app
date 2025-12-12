import type BetterSqlite3 from "better-sqlite3";

type Database = BetterSqlite3.Database;

export function up(db: Database) {
  try {
    // Create users table
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin', 'client')) DEFAULT 'client',
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create api_keys table for client socket connections
    db.exec(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        key_name TEXT NOT NULL,
        api_key TEXT UNIQUE NOT NULL,
        is_active INTEGER DEFAULT 1,
        last_used_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create sessions table for web authentication
    db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        session_token TEXT UNIQUE NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Indexes
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
      CREATE INDEX IF NOT EXISTS idx_api_keys_api_key ON api_keys(api_key);
      CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);
    `);

    // Create default admin user (password: admin123 - change this!)

    console.log("[DB] Users/Auth migration applied");
  } catch (error) {
    console.error("[DB] Error in users migration (up):", error);
    throw error;
  }
}

export function down(db: Database) {
  try {
    db.exec(`
      DROP INDEX IF EXISTS idx_users_email;
      DROP INDEX IF EXISTS idx_users_username;
      DROP INDEX IF EXISTS idx_users_role;
      DROP INDEX IF EXISTS idx_api_keys_user_id;
      DROP INDEX IF EXISTS idx_api_keys_api_key;
      DROP INDEX IF EXISTS idx_sessions_user_id;
      DROP INDEX IF EXISTS idx_sessions_token;
      DROP TABLE IF EXISTS sessions;
      DROP TABLE IF EXISTS api_keys;
      DROP TABLE IF EXISTS users;
    `);

    console.log("[DB] Users/Auth migration rolled back");
  } catch (error) {
    console.error("[DB] Error in users migration (down):", error);
    throw error;
  }
}
