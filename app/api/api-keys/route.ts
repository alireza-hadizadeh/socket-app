import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/utils/auth";
import { getApiKeysByUserId, createApiKey } from "@/lib/db/models/users";

// GET user's API keys
export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("session_token")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const authResult = verifySession(sessionToken);

    if (!authResult.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const apiKeys = getApiKeysByUserId(authResult.user!.id);

    return NextResponse.json({ apiKeys });
  } catch (error) {
    console.error("[API] Get API keys error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST create new API key
export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("session_token")?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const authResult = verifySession(sessionToken);

    if (!authResult.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { keyName, expiresInDays } = body;

    if (!keyName) {
      return NextResponse.json({ error: "Key name is required" }, { status: 400 });
    }

    let expiresAt: string | undefined;
    if (expiresInDays && expiresInDays > 0) {
      expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString();
    }

    const apiKey = createApiKey(authResult.user!.id, keyName, expiresAt);

    return NextResponse.json({
      success: true,
      apiKey,
      message: "API key created successfully. Save it now - you won't see it again!",
    });
  } catch (error) {
    console.error("[API] Create API key error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
