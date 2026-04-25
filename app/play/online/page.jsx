"use client";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Swords, Plus, Globe, Search, Lock } from "lucide-react";
import Link from "next/link";
import { nanoid } from "nanoid";

export default function OnlineLobbyPage() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const [activeGames, setActiveGames] = useState([
    { id: "game-1", creator: "Grandmaster_X", players: 1 },
    { id: "game-2", creator: "ChessMaster", players: 1 },
  ]);

  if (isPending) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  if (!session) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
        <div className="glass p-12 rounded-[40px] border border-white/10 text-center max-w-md shadow-2xl">
          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <Lock size={40} className="text-primary" />
          </div>
          <h1 className="text-3xl font-black mb-4">Login Required</h1>
          <p className="text-foreground/50 mb-10">You need to be logged in to play online and track your rating.</p>
          <div className="flex flex-col gap-4">
            <Link href="/login">
              <button className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20">
                Login Now
              </button>
            </Link>
            <Link href="/register">
              <button className="w-full py-4 glass border border-white/10 rounded-2xl font-bold">
                Create Account
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const createGame = () => {
    const gameId = nanoid(10);
    router.push(`/play/online/${gameId}`);
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-5xl mx-auto flex flex-col gap-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-5xl font-black mb-2 flex items-center gap-4">
              <Globe className="text-primary" size={40} /> Online Lobby
            </h1>
            <p className="text-foreground/50">Challenge players from around the world.</p>
          </div>
          <button 
            onClick={createGame}
            className="px-8 py-4 bg-primary text-white rounded-2xl font-bold flex items-center gap-2 shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
          >
            <Plus size={20} /> Create New Match
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="glass p-8 rounded-3xl border border-white/10">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Search className="text-accent" size={20} /> Open Matches
            </h3>
            <div className="space-y-4">
              {activeGames.map((game) => (
                <div key={game.id} className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/30 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold">
                      {game.creator[0]}
                    </div>
                    <div>
                      <p className="font-bold">{game.creator}</p>
                      <p className="text-xs text-foreground/40">{game.players}/2 players</p>
                    </div>
                  </div>
                  <Link href={`/play/online/${game.id}`}>
                    <button className="px-6 py-2 bg-white/10 hover:bg-primary hover:text-white rounded-xl text-sm font-bold transition-all">
                      Join
                    </button>
                  </Link>
                </div>
              ))}
            </div>
          </div>

          <div className="glass p-8 rounded-3xl border border-white/10 flex flex-col items-center justify-center text-center gap-6">
            <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center">
              <Swords size={32} className="text-accent" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Quick Match</h3>
              <p className="text-sm text-foreground/50 mb-6">Instantly find an opponent with a similar rating.</p>
              <button 
                onClick={createGame}
                className="px-8 py-3 border-2 border-accent text-accent hover:bg-accent hover:text-black rounded-xl font-bold transition-all"
              >
                Find Opponent
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
