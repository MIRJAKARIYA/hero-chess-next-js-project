import { pusherServer } from "@/lib/pusher-server";
import clientPromise from "@/lib/mongodb";

export async function POST(req) {
  const { gameId, userId, userName } = await req.json();

  const client = await clientPromise;
  const db = client.db();

  // Find or create game
  let game = await db.collection("online_games").findOne({ gameId });

  if (!game) {
    // Create game, first player is White
    game = {
      gameId,
      white: { id: userId, name: userName },
      black: null,
      createdAt: new Date(),
    };
    await db.collection("online_games").insertOne(game);
    return Response.json({ color: "w" });
  } else {
    // Game exists
    if (game.white.id === userId) return Response.json({ color: "w", opponent: game.black });
    if (game.black && game.black.id === userId) return Response.json({ color: "b", opponent: game.white });
    
    if (!game.black) {
      // Second player is Black
      await db.collection("online_games").updateOne(
        { gameId },
        { $set: { black: { id: userId, name: userName } } }
      );
      
      // Notify white that black has joined
      await pusherServer.trigger(`game-${gameId}`, "player-joined", {
        opponent: { id: userId, name: userName },
        color: "b"
      });
      
      return Response.json({ color: "b", opponent: game.white });
    }
    
    // Spectator
    return Response.json({ color: "spectator", opponent: game.white });
  }
}
