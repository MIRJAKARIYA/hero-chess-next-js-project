"use client";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Swords, Plus, Globe, Search, Lock, Link as LinkIcon, Share2, Zap, Trophy } from "lucide-react";
import Link from "next/link";
import { nanoid } from "nanoid";

export default function OnlineLobbyPage() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const [activeGames, setActiveGames] = useState([
    { id: "game-1", creator: "Grandmaster_X", players: 1, rating: 1540 },
    { id: "game-2", creator: "ChessMaster", players: 1, rating: 1200 },
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
      <div className="max-w-6xl mx-auto flex flex-col gap-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-5xl font-black mb-2 flex items-center gap-4"
            >
              <div className="p-3 bg-primary/20 rounded-2xl"><Globe className="text-primary" size={32} /></div>
              Online Lobby
            </motion.h1>
            <p className="text-foreground/50 text-lg">Join the global arena and test your skills.</p>
          </div>
          <button 
            onClick={createGame}
            className="px-8 py-5 bg-primary text-white rounded-2xl font-black flex items-center gap-3 shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all group"
          >
            <Plus size={24} className="group-hover:rotate-90 transition-transform" /> 
            Host New Match
          </button>
        </div>

        {/* Info Cards / Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <InfoCard 
            icon={<Zap className="text-accent" />} 
            title="Instant Play" 
            desc="Host a game and share the URL with anyone to play immediately."
          />
          <InfoCard 
            icon={<Share2 className="text-primary" />} 
            title="Invite Friends" 
            desc="Copy the game ID or send the direct link to challenge a friend."
          />
          <InfoCard 
            icon={<Trophy className="text-secondary" />} 
            title="Ranked Matches" 
            desc="Win games to climb the global leaderboard and earn prestige."
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mt-4">
          {/* Active Games List */}
          <div className="lg:col-span-2 glass p-8 rounded-[40px] border border-white/10 flex flex-col min-h-[500px]">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black flex items-center gap-3">
                <Search className="text-primary" size={24} /> Open Matches
                <span className="text-xs bg-primary/20 text-primary px-3 py-1 rounded-full">{activeGames.length} Available</span>
              </h3>
            </div>
            
            <div className="space-y-4 flex-1">
              {activeGames.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-foreground/20">
                  <Search size={48} className="mb-4 opacity-10" />
                  <p className="text-lg font-bold">No open matches found</p>
                  <p>Be the first to host one!</p>
                </div>
              )}
              {activeGames.map((game) => (
                <motion.div 
                  key={game.id} 
                  whileHover={{ x: 10 }}
                  className="flex items-center justify-between p-6 rounded-3xl bg-white/2 border border-white/5 hover:border-primary/30 transition-all group"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center font-bold text-xl shadow-lg">
                      {game.creator[0]}
                    </div>
                    <div>
                      <p className="font-bold text-lg group-hover:text-primary transition-colors">{game.creator}</p>
                      <div className="flex items-center gap-3 text-xs text-foreground/40 mt-1">
                        <span className="font-bold text-accent tracking-widest uppercase">Rating: {game.rating}</span>
                        <span>•</span>
                        <span>{game.players}/2 Players</span>
                      </div>
                    </div>
                  </div>
                  <Link href={`/play/online/${game.id}`}>
                    <button className="px-8 py-3 bg-white/5 hover:bg-primary text-white rounded-2xl text-sm font-black transition-all border border-white/10 hover:border-primary shadow-xl">
                      JOIN MATCH
                    </button>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Side Panel / Quick Action */}
          <div className="glass p-8 rounded-[40px] border border-white/10 flex flex-col gap-8 bg-gradient-to-b from-primary/5 to-transparent">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-accent/20 rounded-2xl flex items-center justify-center">
                <Swords size={32} className="text-accent" />
              </div>
              <h3 className="text-2xl font-black">Quick Challenge</h3>
              <p className="text-sm text-foreground/50 leading-relaxed">
                Enter a game ID manually if a friend shared one with you.
              </p>
            </div>
            
            <div className="space-y-3">
              <input 
                type="text" 
                placeholder="Game ID (e.g. xYz123)"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
              />
              <button className="w-full py-4 bg-accent text-black rounded-2xl font-black text-sm shadow-xl shadow-accent/10 hover:scale-[1.02] active:scale-[0.98] transition-all">
                JOIN VIA ID
              </button>
            </div>

            <div className="mt-auto p-6 rounded-3xl bg-white/5 border border-white/5 text-center">
              <p className="text-[10px] font-black uppercase text-foreground/30 tracking-[0.2em] mb-2">Pro Tip</p>
              <p className="text-xs text-foreground/60 italic">
                "Control the center of the board to dominate your opponent."
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon, title, desc }) {
  return (
    <div className="glass p-8 rounded-[32px] border border-white/10 flex flex-col gap-4 hover:bg-white/5 transition-colors group">
      <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div>
        <h4 className="font-bold text-lg mb-1">{title}</h4>
        <p className="text-sm text-foreground/50 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
