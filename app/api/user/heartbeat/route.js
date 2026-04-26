import { auth } from "@/lib/auth";
import { updateUserStatus } from "@/lib/db-actions";
import { pusherServer } from "@/lib/pusher-server";
import { getActiveUsers } from "@/lib/db-actions";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { status } = await req.json();
    await updateUserStatus(session.user.id, status || "Online");

    // Broadcast updated presence list to the lobby channel so all connected
    // players get an instant update without polling
    const activeUsers = await getActiveUsers(null); // include everyone for broadcast
    await pusherServer.trigger("lobby", "presence", { users: activeUsers });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Heartbeat error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
