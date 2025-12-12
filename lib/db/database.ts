import db from "./connection";
import { up as upConnections, down as downConnections } from "./migrations/connections";
import { up as upMessages, down as downMessages } from "./migrations/messages";
import { up as upUsers, down as downUsers } from "./migrations/users";

import { addConnection, addDisconnection, getConnections, getActiveConnectionsCount, getConnectionBySocketId, getConnectionStats, updateConnectionUser } from "./models/connections";

import { addMessage, getMessages, getMessagesBySocketId, getMessagesByPlatform, getMessageStats } from "./models/messages";

import { createUser, getUserById, getUserByEmail, getUserByUsername, getAllUsers, updateUser, deleteUser, toggleUserActive, createApiKey, getApiKeyById, getApiKeyByKey, getApiKeysByUserId, updateApiKeyLastUsed, revokeApiKey, deleteApiKey, createSession, getSessionById, getSessionByToken, deleteSession, deleteExpiredSessions, deleteUserSessions } from "./models/users";

/**
 * Initialize database schema (run migrations)
 */
export function initializeDatabase() {
  try {
    upConnections(db);
    upMessages(db);
    upUsers(db);

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
    downUsers(db);
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

// === Re-export model functions ===

// Connections
export { addConnection, addDisconnection, getConnections, getActiveConnectionsCount, getConnectionBySocketId, getConnectionStats, updateConnectionUser };

// Messages
export { addMessage, getMessages, getMessagesBySocketId, getMessagesByPlatform, getMessageStats };

// Users & Auth
export { createUser, getUserById, getUserByEmail, getUserByUsername, getAllUsers, updateUser, deleteUser, toggleUserActive, createApiKey, getApiKeyById, getApiKeyByKey, getApiKeysByUserId, updateApiKeyLastUsed, revokeApiKey, deleteApiKey, createSession, getSessionById, getSessionByToken, deleteSession, deleteExpiredSessions, deleteUserSessions };

export default db;
