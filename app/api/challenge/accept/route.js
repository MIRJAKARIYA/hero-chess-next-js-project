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

    const { challengerId } = await req.json();

    const client = await clientPromise;
    const db = client.db();

    // Retrieve the pending challenge to get the authoritative gameId
    const challenge = await db.collection("pending_challenges").findOne({
      challengerId,
      targetUserId: session.user.id,
    });

    if (!challenge) {
      return NextResponse.json({ error: "Challenge not found or already expired" }, { status: 404 });
    }

    // Check expiry
    if (new Date() > new Date(challenge.expiresAt)) {
      await db.collection("pending_challenges").deleteOne({ _id: challenge._id });
      return NextResponse.json({ error: "Challenge has expired" }, { status: 410 });
    }

    const { gameId } = challenge;

    // Clean up the pending challenge
    await db.collection("pending_challenges").deleteOne({ _id: challenge._id });

    // Notify the challenger that their challenge was accepted — with the same gameId
    await pusherServer.trigger(`user-${challengerId}`, "challenge-accepted", {
      gameId,
      opponentName: session.user.name,
      opponentId: session.user.id,
    });

    return NextResponse.json({ success: true, gameId });
  } catch (error) {
    console.error("Accept error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
