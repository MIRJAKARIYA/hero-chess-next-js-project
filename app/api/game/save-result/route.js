import { auth } from "@/lib/auth";
import { saveGameResult } from "@/lib/db-actions";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { opponentName, result, type } = await req.json();
    
    await saveGameResult({
      userId: session.user.id,
      opponentName,
      result,
      type // 'computer' or 'online'
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Save result error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
