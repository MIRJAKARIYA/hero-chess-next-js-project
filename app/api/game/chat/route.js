import { pusherServer } from "@/lib/pusher-server";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { gameId, message, sender } = await req.json();

    await pusherServer.trigger(`game-${gameId}`, "chat", {
      message,
      sender,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
