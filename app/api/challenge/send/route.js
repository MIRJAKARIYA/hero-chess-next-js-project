import { pusherServer } from "@/lib/pusher-server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { nanoid } from "nanoid";
import { ObjectId } from "mongodb";

export async function POST(req) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { targetUserId } = await req.json();

    const client = await clientPromise;
    const db = client.db();

    // Check if target is available
    const targetUser = await db.collection("user").findOne({ _id: new ObjectId(targetUserId) });
    if (targetUser?.status === "Playing") {
      return NextResponse.json({ error: "Player is currently in a game" }, { status: 400 });
    }

    // Check if there's already a pending challenge from this challenger to this target
    const existingChallenge = await db.collection("pending_challenges").findOne({
      challengerId: session.user.id,
      targetUserId,
    });
    if (existingChallenge) {
      return NextResponse.json({ error: "Challenge already sent" }, { status: 400 });
    }

    // Generate one authoritative gameId and persist the pending challenge
    const gameId = nanoid();
    const expiresAt = new Date(Date.now() + 30 * 1000); // 30-second TTL

    await db.collection("pending_challenges").insertOne({
      challengerId: session.user.id,
      challengerName: session.user.name,
      targetUserId,
      gameId,
      expiresAt,
      createdAt: new Date(),
    });

    // Trigger pusher notification to target user (include gameId)
    await pusherServer.trigger(`user-${targetUserId}`, "challenge", {
      challenger: {
        id: session.user.id,
        name: session.user.name,
      },
      gameId,
      expiresAt: expiresAt.toISOString(),
    });

    return NextResponse.json({ success: true, gameId });
  } catch (error) {
    console.error("Challenge error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
