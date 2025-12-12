import db from "../connection";
import crypto from "crypto";

export interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  role: "admin" | "client";
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface ApiKey {
  id: number;
  user_id: number;
  key_name: string;
  api_key: string;
  is_active: number;
  last_used_at: string | null;
  created_at: string;
  expires_at: string | null;
}

export interface Session {
  id: number;
  user_id: number;
  session_token: string;
  expires_at: string;
  created_at: string;
}

// User CRUD operations
export function createUser(username: string, email: string, passwordHash: string, role: "admin" | "client" = "client"): User {
  const stmt = db.prepare(`
    INSERT INTO users (username, email, password_hash, role)
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run(username, email, passwordHash, role);
  return getUserById(result.lastInsertRowid as number)!;
}

export function getUserById(id: number): User | null {
  const stmt = db.prepare("SELECT * FROM users WHERE id = ?");
  return stmt.get(id) as User | null;
}

export function getUserByEmail(email: string): User | null {
  const stmt = db.prepare("SELECT * FROM users WHERE email = ?");
  return stmt.get(email) as User | null;
}

export function getUserByUsername(username: string): User | null {
  const stmt = db.prepare("SELECT * FROM users WHERE username = ?");
  return stmt.get(username) as User | null;
}

export function getAllUsers(): User[] {
  const stmt = db.prepare("SELECT * FROM users ORDER BY created_at DESC");
  return stmt.all() as User[];
}

export function updateUser(id: number, updates: Partial<User>): boolean {
  const fields: string[] = [];
  const values: any[] = [];

  Object.entries(updates).forEach(([key, value]) => {
    if (key !== "id" && key !== "created_at") {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  });

  if (fields.length === 0) return false;

  fields.push("updated_at = CURRENT_TIMESTAMP");
  values.push(id);

  const stmt = db.prepare(`
    UPDATE users SET ${fields.join(", ")} WHERE id = ?
  `);
  const result = stmt.run(...values);
  return result.changes > 0;
}

export function deleteUser(id: number): boolean {
  const stmt = db.prepare("DELETE FROM users WHERE id = ?");
  const result = stmt.run(id);
  return result.changes > 0;
}

export function toggleUserActive(id: number): boolean {
  const stmt = db.prepare(`
    UPDATE users SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  const result = stmt.run(id);
  return result.changes > 0;
}

// API Key operations
export function generateApiKey(): string {
  return `sk_${crypto.randomBytes(32).toString("hex")}`;
}

export function createApiKey(userId: number, keyName: string, expiresAt?: string): ApiKey {
  const apiKey = generateApiKey();
  const stmt = db.prepare(`
    INSERT INTO api_keys (user_id, key_name, api_key, expires_at)
    VALUES (?, ?, ?, ?)
  `);
  const result = stmt.run(userId, keyName, apiKey, expiresAt || null);
  return getApiKeyById(result.lastInsertRowid as number)!;
}

export function getApiKeyById(id: number): ApiKey | null {
  const stmt = db.prepare("SELECT * FROM api_keys WHERE id = ?");
  return stmt.get(id) as ApiKey | null;
}

export function getApiKeyByKey(apiKey: string): ApiKey | null {
  const stmt = db.prepare(`
    SELECT * FROM api_keys 
    WHERE api_key = ? AND is_active = 1
    AND (expires_at IS NULL OR expires_at > datetime('now'))
  `);
  return stmt.get(apiKey) as ApiKey | null;
}

export function getApiKeysByUserId(userId: number): ApiKey[] {
  const stmt = db.prepare(`
    SELECT * FROM api_keys WHERE user_id = ? ORDER BY created_at DESC
  `);
  return stmt.all(userId) as ApiKey[];
}

export function updateApiKeyLastUsed(apiKey: string): boolean {
  const stmt = db.prepare(`
    UPDATE api_keys SET last_used_at = CURRENT_TIMESTAMP WHERE api_key = ?
  `);
  const result = stmt.run(apiKey);
  return result.changes > 0;
}

export function revokeApiKey(id: number): boolean {
  const stmt = db.prepare(`
    UPDATE api_keys SET is_active = 0 WHERE id = ?
  `);
  const result = stmt.run(id);
  return result.changes > 0;
}

export function deleteApiKey(id: number): boolean {
  const stmt = db.prepare("DELETE FROM api_keys WHERE id = ?");
  const result = stmt.run(id);
  return result.changes > 0;
}

// Session operations
export function createSession(userId: number, expiresInHours: number = 24): Session {
  const sessionToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString();

  const stmt = db.prepare(`
    INSERT INTO sessions (user_id, session_token, expires_at)
    VALUES (?, ?, ?)
  `);
  const result = stmt.run(userId, sessionToken, expiresAt);
  return getSessionById(result.lastInsertRowid as number)!;
}

export function getSessionById(id: number): Session | null {
  const stmt = db.prepare("SELECT * FROM sessions WHERE id = ?");
  return stmt.get(id) as Session | null;
}

export function getSessionByToken(token: string): Session | null {
  const stmt = db.prepare(`
    SELECT * FROM sessions 
    WHERE session_token = ? AND expires_at > datetime('now')
  `);
  return stmt.get(token) as Session | null;
}

export function deleteSession(token: string): boolean {
  const stmt = db.prepare("DELETE FROM sessions WHERE session_token = ?");
  const result = stmt.run(token);
  return result.changes > 0;
}

export function deleteExpiredSessions(): number {
  const stmt = db.prepare(`
    DELETE FROM sessions WHERE expires_at <= datetime('now')
  `);
  const result = stmt.run();
  return result.changes;
}

export function deleteUserSessions(userId: number): boolean {
  const stmt = db.prepare("DELETE FROM sessions WHERE user_id = ?");
  const result = stmt.run(userId);
  return result.changes > 0;
}
