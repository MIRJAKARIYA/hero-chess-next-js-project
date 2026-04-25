import clientPromise from "./mongodb";

export async function saveGameResult(userId, opponentName, result) {
  const client = await clientPromise;
  const db = client.db();
  
  await db.collection("matches").insertOne({
    userId,
    opponentName,
    result, // 'Won', 'Lost', 'Draw'
    timestamp: new Date(),
  });

  // Update user stats
  const update = { $inc: { matchesPlayed: 1 } };
  if (result === "Won") update.$inc.wins = 1;
  
  await db.collection("user").updateOne(
    { id: userId },
    update
  );
}

export async function getUserStats(userId) {
  const client = await clientPromise;
  const db = client.db();
  const user = await db.collection("user").findOne({ id: userId });
  return user;
}
