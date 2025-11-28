import db from "./connection";
import { up as upConnections, down as downConnections } from "./migrations/connections";
import { up as upMessages, down as downMessages } from "./migrations/messages";

import { addConnection, addDisconnection, getConnections, getActiveConnectionsCount, getConnectionBySocketId, getConnectionStats, updateConnectionUser } from "./models/connections";

import { addMessage, getMessages, getMessagesBySocketId, getMessagesByPlatform, getMessageStats } from "./models/messages";

/**
 * Initialize database schema (run migrations)
 */
export function initializeDatabase() {
  try {
    upConnections(db);
    upMessages(db);
    console.log("[DB] Database initialized successfully");
  } catch (error) {
    console.error("[DB] Error initializing database:", error);
    throw error;
  }
}

/**
 * Optional: simple reset helper using down() then up()
 * (not used by your scripts right now, but nice to have)
 */
export function resetDatabase() {
  try {
    downMessages(db);
    downConnections(db);
    initializeDatabase();
  } catch (error) {
    console.error("[DB] Error resetting database:", error);
    throw error;
  }
}

/**
 * Cleanup old records from both tables
 */
export function deleteOldRecords(daysOld: number = 30): {
  connections: number;
  messages: number;
} {
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

// === Re-export model functions for backward compatibility ===

export { addConnection, addDisconnection, addMessage, getConnections, getActiveConnectionsCount, getConnectionBySocketId, getConnectionStats, updateConnectionUser, getMessages, getMessagesBySocketId, getMessagesByPlatform, getMessageStats };

export default db;
