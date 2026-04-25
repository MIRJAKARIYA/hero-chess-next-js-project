import { pusherServer } from "@/lib/pusher-server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { nanoid } from "nanoid";

export async function POST(req) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { challengerId } = await req.json();

  if (!challengerId) {
    return Response.json({ error: "Challenger ID required" }, { status: 400 });
  }

  const gameId = nanoid(10);

  // Notify the challenger that their challenge was accepted
  await pusherServer.trigger(`user-${challengerId}`, "challenge-accepted", {
    gameId,
    opponentName: session.user.name,
  });

  return Response.json({ success: true, gameId });
}
