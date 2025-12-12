import { NextRequest, NextResponse } from "next/server";
import { logout } from "@/lib/utils/auth";

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("session_token")?.value;

    if (sessionToken) {
      logout(sessionToken);
    }

    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });

    response.cookies.delete("session_token");

    return response;
  } catch (error) {
    console.error("[API] Logout error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
