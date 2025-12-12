import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/lib/utils/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const result = await authenticateUser(email, password);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    // Set session cookie
    const response = NextResponse.json({
      success: true,
      user: result.user,
    });

    response.cookies.set("session_token", result.sessionToken!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[API] Login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
