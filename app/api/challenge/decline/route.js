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

    // Look up and delete the pending challenge
    const challenge = await db.collection("pending_challenges").findOneAndDelete({
      challengerId,
      targetUserId: session.user.id,
    });

    // Notify the challenger that their challenge was declined
    if (challenge) {
      await pusherServer.trigger(`user-${challengerId}`, "challenge-declined", {
        declinedBy: session.user.name,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Decline error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
