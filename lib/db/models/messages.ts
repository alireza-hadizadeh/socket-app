import db from "../connection";

export interface MessageRow {
  id: number;
  socket_id: string;
  sender: string;
  message_text: string;
  platform: string;
  created_at: string;
}

/**
 * Add a message
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
 * Get all messages
 */
export function getMessages(limit: number = 100, offset: number = 0): MessageRow[] {
  try {
    const stmt = db.prepare(`
      SELECT * FROM messages
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `);
    return stmt.all(limit, offset) as MessageRow[];
  } catch (error) {
    console.error("[DB] Error getting messages:", error);
    throw error;
  }
}

/**
 * Get messages by socket ID
 */
export function getMessagesBySocketId(socketId: string, limit: number = 50): MessageRow[] {
  try {
    const stmt = db.prepare(`
      SELECT * FROM messages
      WHERE socket_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `);
    return stmt.all(socketId, limit) as MessageRow[];
  } catch (error) {
    console.error("[DB] Error getting messages by socket ID:", error);
    throw error;
  }
}

/**
 * Get messages by platform
 */
export function getMessagesByPlatform(platform: string, limit: number = 100): MessageRow[] {
  try {
    const stmt = db.prepare(`
      SELECT * FROM messages
      WHERE platform = ?
      ORDER BY created_at DESC
      LIMIT ?
    `);
    return stmt.all(platform, limit) as MessageRow[];
  } catch (error) {
    console.error("[DB] Error getting messages by platform:", error);
    throw error;
  }
}

/**
 * Message statistics
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
