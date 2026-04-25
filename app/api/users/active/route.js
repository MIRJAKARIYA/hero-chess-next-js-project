import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    
    // In a real app, you'd filter by 'lastSeen' or 'isOnline'
    const users = await db.collection("user").find({}).limit(10).toArray();
    
    const formattedUsers = users.map(u => ({
      id: u.id || u._id,
      name: u.name,
      rating: u.rating || 1200,
      status: "Online" // Dummy status for now
    }));

    return NextResponse.json(formattedUsers);
  } catch (error) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
