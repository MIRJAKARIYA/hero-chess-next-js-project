import clientPromise from "./mongodb";

export async function updateUserStatus(userId, status) {
  const client = await clientPromise;
  const db = client.db();
  await db.collection("user").updateOne(
    { id: userId },
    { $set: { status, lastSeen: new Date() } }
  );
}

export async function getActiveUsers(excludeUserId) {
  const client = await clientPromise;
  const db = client.db();
  const oneMinuteAgo = new Date(Date.now() - 60000);
  
  return await db.collection("user")
    .find({
      id: { $ne: excludeUserId },
      lastSeen: { $gt: oneMinuteAgo }
    })
    .project({ id: 1, name: 1, image: 1, status: 1, rating: 1 })
    .toArray();
}

export async function getUserStats(userId) {
  const client = await clientPromise;
  const db = client.db();
  const user = await db.collection("user").findOne({ id: userId });
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
    { id: userId },
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
