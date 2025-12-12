import { NextRequest, NextResponse } from "next/server";
import { verifySession, hashPassword, hasRole } from "@/lib/utils/auth";
import { getAllUsers, createUser, getUserByEmail, getUserByUsername } from "@/lib/db/models/users";

// GET all users (admin only)
export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("session_token")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const authResult = verifySession(sessionToken);

    if (!authResult.success || !hasRole(authResult.user!.role, "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const users = getAllUsers();

    // Remove password hashes from response
    const sanitizedUsers = users.map((user) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
      created_at: user.created_at,
      updated_at: user.updated_at,
    }));

    return NextResponse.json({ users: sanitizedUsers });
  } catch (error) {
    console.error("[API] Get users error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST create new user (admin only)
export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("session_token")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const authResult = verifySession(sessionToken);

    if (!authResult.success || !hasRole(authResult.user!.role, "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { username, email, password, role } = body;

    // Validation
    if (!username || !email || !password) {
      return NextResponse.json({ error: "Username, email, and password are required" }, { status: 400 });
    }

    if (role && role !== "admin" && role !== "client") {
      return NextResponse.json({ error: "Invalid role. Must be 'admin' or 'client'" }, { status: 400 });
    }

    // Check if user already exists
    if (getUserByEmail(email)) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 });
    }

    if (getUserByUsername(username)) {
      return NextResponse.json({ error: "User with this username already exists" }, { status: 409 });
    }

    // Hash password and create user
    const passwordHash = await hashPassword(password);
    const newUser = createUser(username, email, passwordHash, role || "client");

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        is_active: newUser.is_active,
        created_at: newUser.created_at,
      },
    });
  } catch (error) {
    console.error("[API] Create user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
