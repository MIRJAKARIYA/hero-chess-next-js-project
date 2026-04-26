import clientPromise from "./mongodb";
import { ObjectId } from "mongodb";

export async function updateUserStatus(userId, status) {
  const client = await clientPromise;
  const db = client.db();
  await db.collection("user").updateOne(
    { _id: new ObjectId(userId) },
    { $set: { status, lastSeen: new Date() } },
    { upsert: false } // never create phantom users; Better Auth creates the doc
  );
}

export async function getActiveUsers(excludeUserId) {
  const client = await clientPromise;
  const db = client.db();
  // 90s window — gives 3× the 30s heartbeat interval as headroom
  const ninetySecondsAgo = new Date(Date.now() - 90000);

  const query = {
    lastSeen: { $gt: ninetySecondsAgo },
  };
  // Only exclude if we actually have a userId to exclude
  if (excludeUserId) {
    query._id = { $ne: new ObjectId(excludeUserId) };
  }

  const users = await db.collection("user")
    .find(query)
    .project({ _id: 1, name: 1, image: 1, status: 1, rating: 1 })
    .toArray();
    
  return users.map(u => ({
    id: u._id.toString(),
    name: u.name,
    image: u.image,
    status: u.status,
    rating: u.rating
  }));
}

export async function getUserStats(userId) {
  const client = await clientPromise;
  const db = client.db();
  const user = await db.collection("user").findOne({ _id: new ObjectId(userId) });
  const recentMatches = await db.collection("matches")
    .find({ userId })
    .sort({ timestamp: -1 })
    .limit(10)
    .toArray();

  return {
    rating: user?.rating || 1200,
    matchesPlayed: user?.matchesPlayed || 0,
    wins: user?.wins || 0,
    recentMatches
  };
}

export async function saveGameResult({ userId, opponentName, result, type }) {
  const client = await clientPromise;
  const db = client.db();
  
  const ratingChange = result === "Won" ? 20 : (result === "Lost" ? -15 : 0);
  
  // Update user stats
  await db.collection("user").updateOne(
    { _id: new ObjectId(userId) },
    { 
      $inc: { 
        matchesPlayed: 1, 
        wins: result === "Won" ? 1 : 0,
        rating: ratingChange
      } 
    }
  );

  // Record match
  await db.collection("matches").insertOne({
    userId,
    opponentName,
    result,
    type,
    ratingChange,
    timestamp: new Date()
  });
}
