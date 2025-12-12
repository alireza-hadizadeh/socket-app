import * as bcrypt from "bcryptjs";
import { getUserByEmail, getUserById, createSession, getSessionByToken, deleteSession } from "../db/models/users";

export interface AuthResult {
  success: boolean;
  user?: {
    id: number;
    username: string;
    email: string;
    role: "admin" | "client";
  };
  sessionToken?: string;
  error?: string;
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Authenticate a user with email and password
 */
export async function authenticateUser(email: string, password: string): Promise<AuthResult> {
  try {
    const user = getUserByEmail(email);

    if (!user) {
      return {
        success: false,
        error: "Invalid email or password",
      };
    }

    if (!user.is_active) {
      return {
        success: false,
        error: "Account is inactive",
      };
    }

    const isValidPassword = await verifyPassword(password, user.password_hash);

    if (!isValidPassword) {
      return {
        success: false,
        error: "Invalid email or password",
      };
    }

    // Create session
    const session = createSession(user.id, 24); // 24 hours

    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      sessionToken: session.session_token,
    };
  } catch (error) {
    console.error("[AUTH] Error authenticating user:", error);
    return {
      success: false,
      error: "Authentication failed",
    };
  }
}

/**
 * Verify a session token and return user info
 */
export function verifySession(sessionToken: string): AuthResult {
  try {
    const session = getSessionByToken(sessionToken);

    if (!session) {
      return {
        success: false,
        error: "Invalid or expired session",
      };
    }

    const user = getUserById(session.user_id);

    if (!user || !user.is_active) {
      return {
        success: false,
        error: "User not found or inactive",
      };
    }

    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };
  } catch (error) {
    console.error("[AUTH] Error verifying session:", error);
    return {
      success: false,
      error: "Session verification failed",
    };
  }
}

/**
 * Logout a user by deleting their session
 */
export function logout(sessionToken: string): boolean {
  return deleteSession(sessionToken);
}

/**
 * Check if user has required role
 */
export function hasRole(userRole: string, requiredRole: "admin" | "client"): boolean {
  if (requiredRole === "client") {
    return userRole === "admin" || userRole === "client";
  }
  return userRole === requiredRole;
}
