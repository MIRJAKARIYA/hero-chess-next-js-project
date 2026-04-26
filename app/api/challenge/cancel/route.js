import { pusherServer } from "@/lib/pusher-server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

/**
 * Called by the challenger when they want to cancel a sent challenge
 * (e.g. navigating away, or manually cancelling).
 */
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

    // Remove the pending challenge
    const challenge = await db.collection("pending_challenges").findOneAndDelete({
      challengerId: session.user.id,
      targetUserId,
    });

    // If the challenge existed, notify the target that it was cancelled
    if (challenge && targetUserId) {
      await pusherServer.trigger(`user-${targetUserId}`, "challenge-cancelled", {
        challengerName: session.user.name,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cancel error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
