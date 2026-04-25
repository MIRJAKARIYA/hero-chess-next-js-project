import { pusherServer } from "@/lib/pusher-server";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { gameId, move, fen } = await req.json();

    if (!gameId || !move) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    await pusherServer.trigger(`game-${gameId}`, "move", {
      move,
      fen,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Pusher error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
