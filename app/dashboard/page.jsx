"use client";
import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { motion } from "framer-motion";
import { Trophy, Swords, History, Settings, LogOut, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const [stats, setStats] = useState({ matchesPlayed: 0, wins: 0, rating: 1200 });
  const [activePlayers, setActivePlayers] = useState([]);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
    } else if (session) {
      fetchStats();
      fetchActivePlayers();
    }
  }, [session, isPending, router]);

  const fetchActivePlayers = async () => {
    try {
      const res = await fetch("/api/users/active");
      const data = await res.json();
      if (!data.error) setActivePlayers(data);
    } catch (e) {
      console.error("Failed to fetch players", e);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/user/stats");
      const data = await res.json();
      if (!data.error) setStats(data);
    } catch (e) {
      console.error("Failed to fetch stats", e);
    }
  };

  if (isPending || !session) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-7xl mx-auto flex flex-col gap-12">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-black mb-2">Grandmaster <span className="text-primary">{session.user.name}</span></h1>
            <p className="text-foreground/50">Welcome back to the arena. Ready for a match?</p>
          </div>
          <div className="flex gap-4">
            <button onClick={handleLogout} className="px-6 py-3 glass rounded-2xl font-bold flex items-center gap-2 hover:bg-red-500/10 hover:text-red-500 transition-colors">
              <LogOut size={18} /> Logout
            </button>
            <Link href="/play/online/new">
              <button className="px-8 py-3 bg-primary text-white rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20">
                <Plus size={18} /> New Online Game
              </button>
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Stats Column */}
          <div className="lg:col-span-1 space-y-8">
            <div className="glass p-8 rounded-3xl border border-white/10">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Trophy className="text-accent" size={20} /> Performance
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <StatCard label="Matches" value={stats.matchesPlayed || 0} />
                <StatCard label="Wins" value={stats.wins || 0} />
                <StatCard label="Rating" value={stats.rating || 1200} />
                <StatCard label="Win Rate" value={stats.matchesPlayed > 0 ? `${Math.round((stats.wins / stats.matchesPlayed) * 100)}%` : "0%"} />
              </div>
            </div>

            <div className="glass p-8 rounded-3xl border border-white/10">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <History className="text-primary" size={20} /> Recent Games
              </h3>
              <div className="space-y-4">
                <RecentGame opponent="Stockfish Level 4" result="Won" date="2h ago" />
                <RecentGame opponent="Grandmaster_99" result="Lost" date="1d ago" />
                <RecentGame opponent="ChessNinja" result="Won" date="2d ago" />
              </div>
            </div>
          </div>

          {/* Lobby Column */}
          <div className="lg:col-span-2 space-y-8">
            <div className="glass p-8 rounded-3xl border border-white/10 min-h-[500px] flex flex-col">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black flex items-center gap-3">
                  <Swords className="text-primary" size={28} /> Online Lobby
                </h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30" size={16} />
                  <input 
                    type="text" 
                    placeholder="Search players..."
                    className="bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                </div>
              </div>

              <div className="flex-1 space-y-4">
                {activePlayers.map((player) => (
                  <motion.div 
                    key={player.id}
                    whileHover={{ x: 10 }}
                    className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/30 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center font-bold text-xl">
                        {player.name[0]}
                      </div>
                      <div>
                        <p className="font-bold">{player.name}</p>
                        <p className="text-xs text-foreground/40">Rating: {player.rating}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className={player.status === "Online" ? "text-green-500 text-sm font-medium" : "text-yellow-500 text-sm font-medium"}>
                        {player.status}
                      </span>
                      <button 
                        disabled={player.status !== "Online"}
                        className="px-6 py-2 bg-primary text-white text-sm font-bold rounded-xl disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-primary/10"
                      >
                        Challenge
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
      <p className="text-xs font-bold text-foreground/30 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-black">{value}</p>
    </div>
  );
}

function RecentGame({ opponent, result, date }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
      <div>
        <p className="font-bold">{opponent}</p>
        <p className="text-xs text-foreground/40">{date}</p>
      </div>
      <span className={result === "Won" ? "text-green-500 font-bold" : "text-red-500 font-bold"}>
        {result}
      </span>
    </div>
  );
}
