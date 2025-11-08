import Database from "better-sqlite3";
import path from "path";

// Initialize database connection
const dbPath = path.join(process.cwd(), "socket_events.db");
const db = new Database(dbPath);

// Enable foreign keys
db.pragma("foreign_keys = ON");

/**
 * Initialize database schema
 */
export function initializeDatabase() {
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

    // Create messages table
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

    // Create indexes for better query performance
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_connections_socket_id ON connections(socket_id);
      CREATE INDEX IF NOT EXISTS idx_connections_created_at ON connections(created_at);
      CREATE INDEX IF NOT EXISTS idx_messages_socket_id ON messages(socket_id);
      CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
    `);

    console.log("[DB] Database initialized successfully at:", dbPath);
  } catch (error) {
    console.error("[DB] Error initializing database:", error);
    throw error;
  }
}

/**
 * Add a connection record
 */
export function addConnection(socketId: string, platform: string = "unknown", userId?: string): number {
  try {
    const stmt = db.prepare(`
      INSERT INTO connections (socket_id, platform, user_id, status)
      VALUES (?, ?, ?, 'active')
    `);
    const result = stmt.run(socketId, platform, userId || null);
    return result.lastInsertRowid as number;
  } catch (error) {
    console.error("[DB] Error adding connection:", error);
    throw error;
  }
}

/**
 * Add a disconnection record (updates existing connection)
 */
export function addDisconnection(socketId: string): boolean {
  try {
    const stmt = db.prepare(`
      UPDATE connections
      SET disconnected_at = CURRENT_TIMESTAMP,
          status = 'disconnected',
          duration_ms = CAST((julianday('now') - julianday(connected_at)) * 24 * 60 * 60 * 1000 AS INTEGER)
      WHERE socket_id = ?
    `);
    const result = stmt.run(socketId);
    return result.changes > 0;
  } catch (error) {
    console.error("[DB] Error adding disconnection:", error);
    throw error;
  }
}

/**
 * Add a message to database
 */
export function addMessage(socketId: string, sender: string, messageText: string, platform: string = "web"): number {
  try {
    const stmt = db.prepare(`
      INSERT INTO messages (socket_id, sender, message_text, platform)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(socketId, sender, messageText, platform);
    return result.lastInsertRowid as number;
  } catch (error) {
    console.error("[DB] Error adding message:", error);
    throw error;
  }
}

/**
 * Get all active connections
 */
export function getConnections(limit: number = 100, offset: number = 0) {
  try {
    const stmt = db.prepare(`
      SELECT * FROM connections
      ORDER BY connected_at DESC
      LIMIT ? OFFSET ?
    `);
    return stmt.all(limit, offset) as any[];
  } catch (error) {
    console.error("[DB] Error getting connections:", error);
    throw error;
  }
}

/**
 * Get active connections count
 */
export function getActiveConnectionsCount(): number {
  try {
    const stmt = db.prepare(`SELECT COUNT(*) as count FROM connections WHERE status = 'active'`);
    const result = stmt.get() as { count: number };
    return result.count;
  } catch (error) {
    console.error("[DB] Error getting active connections count:", error);
    throw error;
  }
}

/**
 * Get all messages
 */
export function getMessages(limit: number = 100, offset: number = 0) {
  try {
    const stmt = db.prepare(`
      SELECT * FROM messages
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `);
    return stmt.all(limit, offset) as any[];
  } catch (error) {
    console.error("[DB] Error getting messages:", error);
    throw error;
  }
}

/**
 * Get messages by socket ID
 */
export function getMessagesBySocketId(socketId: string, limit: number = 50) {
  try {
    const stmt = db.prepare(`
      SELECT * FROM messages
      WHERE socket_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `);
    return stmt.all(socketId, limit) as any[];
  } catch (error) {
    console.error("[DB] Error getting messages by socket ID:", error);
    throw error;
  }
}

/**
 * Get messages by platform
 */
export function getMessagesByPlatform(platform: string, limit: number = 100) {
  try {
    const stmt = db.prepare(`
      SELECT * FROM messages
      WHERE platform = ?
      ORDER BY created_at DESC
      LIMIT ?
    `);
    return stmt.all(platform, limit) as any[];
  } catch (error) {
    console.error("[DB] Error getting messages by platform:", error);
    throw error;
  }
}

/**
 * Get connection by socket ID
 */
export function getConnectionBySocketId(socketId: string) {
  try {
    const stmt = db.prepare(`SELECT * FROM connections WHERE socket_id = ?`);
    return stmt.get(socketId) as any;
  } catch (error) {
    console.error("[DB] Error getting connection by socket ID:", error);
    throw error;
  }
}

/**
 * Get connection statistics
 */
export function getConnectionStats() {
  try {
    const stmt = db.prepare(`
      SELECT
        COUNT(*) as total_connections,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_connections,
        SUM(CASE WHEN status = 'disconnected' THEN 1 ELSE 0 END) as disconnected_connections,
        AVG(CASE WHEN duration_ms IS NOT NULL THEN duration_ms ELSE NULL END) as avg_session_duration_ms,
        MAX(duration_ms) as max_session_duration_ms
      FROM connections
    `);
    return stmt.get() as any;
  } catch (error) {
    console.error("[DB] Error getting connection stats:", error);
    throw error;
  }
}

/**
 * Get message statistics
 */
export function getMessageStats() {
  try {
    const stmt = db.prepare(`
      SELECT
        COUNT(*) as total_messages,
        COUNT(DISTINCT platform) as unique_platforms,
        COUNT(DISTINCT sender) as unique_senders
      FROM messages
    `);
    return stmt.get() as any;
  } catch (error) {
    console.error("[DB] Error getting message stats:", error);
    throw error;
  }
}

/**
 * Delete old records (cleanup)
 */
export function deleteOldRecords(daysOld: number = 30): { connections: number; messages: number } {
  try {
    const messagesStmt = db.prepare(`
      DELETE FROM messages
      WHERE created_at < datetime('now', ? || ' days')
    `);
    const messagesResult = messagesStmt.run(`-${daysOld}`);

    const connectionsStmt = db.prepare(`
      DELETE FROM connections
      WHERE connected_at < datetime('now', ? || ' days')
    `);
    const connectionsResult = connectionsStmt.run(`-${daysOld}`);

    return {
      connections: connectionsResult.changes,
      messages: messagesResult.changes,
    };
  } catch (error) {
    console.error("[DB] Error deleting old records:", error);
    throw error;
  }
}

/**
 * Close database connection
 */
export function closeDatabase() {
  try {
    db.close();
    console.log("[DB] Database connection closed");
  } catch (error) {
    console.error("[DB] Error closing database:", error);
  }
}

export default db;
