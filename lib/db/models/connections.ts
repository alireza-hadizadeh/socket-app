import db from "../connection";

// Types are optional, but recommended
export interface ConnectionRow {
  id: number;
  socket_id: string;
  platform: string | null;
  user_id: string | null;
  connected_at: string;
  disconnected_at: string | null;
  duration_ms: number | null;
  status: string;
  created_at: string;
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
 * Mark a connection as disconnected
 */
export function addDisconnection(socketId: string): boolean {
  try {
    const stmt = db.prepare(`
      UPDATE connections
      SET disconnected_at = CURRENT_TIMESTAMP,
          status = 'disconnected',
          duration_ms = CAST(
            (julianday('now') - julianday(connected_at)) * 24 * 60 * 60 * 1000
            AS INTEGER
          )
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
 * Get all connections (most recent first)
 */
export function getConnections(limit: number = 100, offset: number = 0): ConnectionRow[] {
  try {
    const stmt = db.prepare(`
      SELECT * FROM connections
      ORDER BY connected_at DESC
      LIMIT ? OFFSET ?
    `);
    return stmt.all(limit, offset) as ConnectionRow[];
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
 * Get a single connection by socket ID
 */
export function getConnectionBySocketId(socketId: string): ConnectionRow | undefined {
  try {
    const stmt = db.prepare(`SELECT * FROM connections WHERE socket_id = ?`);
    return stmt.get(socketId) as ConnectionRow | undefined;
  } catch (error) {
    console.error("[DB] Error getting connection by socket ID:", error);
    throw error;
  }
}

/**
 * Connection statistics
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
 * Update a connection with user info
 */
export function updateConnectionUser(socketId: string, userId: string, platform?: string): boolean {
  try {
    const stmt = db.prepare(`
      UPDATE connections
      SET 
        user_id = ?,
        platform = COALESCE(?, platform)
      WHERE socket_id = ?
    `);

    const result = stmt.run(userId, platform || null, socketId);
    return result.changes > 0;
  } catch (error) {
    console.error("[DB] Error updating connection user:", error);
    throw error;
  }
}
