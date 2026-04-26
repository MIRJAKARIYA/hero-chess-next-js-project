import { pusherServer } from "@/lib/pusher-server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function POST(req) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { targetUserId } = await req.json();

    // Check if target is available
    const client = await clientPromise;
    const db = client.db();
    const targetUser = await db.collection("user").findOne({ id: targetUserId });
    
    if (targetUser?.status === "Playing") {
      return NextResponse.json({ error: "Player is currently in a game" }, { status: 400 });
    }

    // Trigger pusher notification to target user
    await pusherServer.trigger(`user-${targetUserId}`, "challenge", {
      challenger: {
        id: session.user.id,
        name: session.user.name,
      },
      gameId: `game-${Math.random().toString(36).substring(7)}`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Challenge error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
