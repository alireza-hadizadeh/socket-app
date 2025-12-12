import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/utils/auth";

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("session_token")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const result = verifySession(sessionToken);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user: result.user,
    });
  } catch (error) {
    console.error("[API] Get current user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
