import { auth } from "@/lib/auth";
import { getActiveUsers } from "@/lib/db-actions";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const activeUsers = await getActiveUsers(session?.user?.id);
    return NextResponse.json(activeUsers);
  } catch (error) {
    console.error("Active users fetch error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
