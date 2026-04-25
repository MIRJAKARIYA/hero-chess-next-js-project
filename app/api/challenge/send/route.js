import { pusherServer } from "@/lib/pusher-server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(req) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { opponentId } = await req.json();

  if (!opponentId) {
    return Response.json({ error: "Opponent ID required" }, { status: 400 });
  }

  // Trigger challenge notification for the opponent
  await pusherServer.trigger(`user-${opponentId}`, "challenge", {
    challenger: {
      id: session.user.id,
      name: session.user.name,
    },
    challengeId: `challenge-${Date.now()}`,
  });

  return Response.json({ success: true });
}
