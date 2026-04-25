import { auth } from "@/lib/auth";
import { getUserStats } from "@/lib/db-actions";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stats = await getUserStats(session.user.id);
    
    return NextResponse.json(stats || { 
      matchesPlayed: 0, 
      wins: 0, 
      rating: 1200 
    });
  } catch (error) {
    console.error("Stats fetch error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
