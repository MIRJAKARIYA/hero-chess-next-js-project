import { auth } from "@/lib/auth";
import { saveGameResult } from "@/lib/db-actions";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher-server";

export async function POST(req) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { gameId, opponentName, type } = await req.json();

    // The user who calls this forfeited the game, so they lost.
    await saveGameResult({
      userId: session.user.id,
      opponentName,
      result: "Lost",
      type: type || "online"
    });

    // Notify the other player so they can claim their win
    await pusherServer.trigger(`game-${gameId}`, "player-forfeited", {
      userId: session.user.id,
      name: session.user.name,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Forfeit game error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
