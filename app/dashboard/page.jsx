"use client";
import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Swords, History, Settings, LogOut, Plus, Search, Check, X, Bell } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { pusherClient } from "@/lib/pusher-client";
import { toast } from "sonner";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function DashboardPage() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();
  const [stats, setStats] = useState({ matchesPlayed: 0, wins: 0, rating: 1200 });
  const [activePlayers, setActivePlayers] = useState([]);
  const [incomingChallenge, setIncomingChallenge] = useState(null);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
    } else if (session) {
      fetchStats();
      fetchActivePlayers();

      // Subscribe to personal channel for challenges
      const channel = pusherClient.subscribe(`user-${session.user.id}`);
      
      channel.bind("challenge", (data) => {
        setIncomingChallenge(data);
        toast.info("New Challenge!", {
          description: `${data.challenger.name} has challenged you to a match!`,
          duration: 10000,
        });
      });

      channel.bind("challenge-accepted", (data) => {
        toast.success("Challenge Accepted!", {
          description: `${data.opponentName} accepted! Redirecting to game...`,
        });
        setTimeout(() => {
          router.push(`/play/online/${data.gameId}`);
        }, 1500);
      });

      return () => {
        pusherClient.unsubscribe(`user-${session.user.id}`);
      };
    }
  }, [session, isPending, router]);

  const fetchActivePlayers = async () => {
    try {
      const res = await fetch("/api/users/active");
      const data = await res.json();
      if (!data.error) setActivePlayers(data.filter(u => u.id !== session?.user?.id));
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

  const sendChallenge = async (opponentId) => {
    toast.promise(
      fetch("/api/challenge/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opponentId }),
      }),
      {
        loading: "Sending challenge...",
        success: "Challenge sent!",
        error: "Failed to send challenge",
      }
    );
  };

  const acceptChallenge = async () => {
    if (!incomingChallenge) return;
    
    try {
      const res = await fetch("/api/challenge/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengerId: incomingChallenge.challenger.id }),
      });
      const data = await res.json();
      if (data.success) {
        router.push(`/play/online/${data.gameId}`);
      }
    } catch (e) {
      toast.error("Failed to accept challenge");
    } finally {
      setIncomingChallenge(null);
    }
  };

  if (isPending || !session) return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-7xl mx-auto flex flex-col gap-12">
        {/* Challenge Notification Overlay */}
        <AnimatePresence>
          {incomingChallenge && (
            <motion.div 
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-4"
            >
              <div className="glass p-6 rounded-[32px] border border-primary/30 shadow-[0_0_50px_rgba(157,80,187,0.3)] flex flex-col gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center animate-pulse">
                    <Bell className="text-primary" size={28} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black">Match Invitation</h3>
                    <p className="text-sm text-foreground/60"><span className="text-primary font-bold">{incomingChallenge.challenger.name}</span> wants to play!</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={acceptChallenge}
                    className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    <Check size={20} /> Accept
                  </button>
                  <button 
                    onClick={() => setIncomingChallenge(null)}
                    className="flex-1 py-4 glass border border-white/10 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-red-500/10 hover:text-red-500 transition-all"
                  >
                    <X size={20} /> Decline
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-5xl font-black mb-2 tracking-tight">Grandmaster <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">{session.user.name}</span></h1>
            <p className="text-foreground/50">Your current rating is <span className="text-accent font-bold">{stats.rating}</span>. Ready to climb higher?</p>
          </motion.div>
          <div className="flex gap-4">
            <Link href="/play/online">
              <button className="px-8 py-4 bg-primary text-white rounded-2xl font-bold flex items-center gap-2 shadow-xl shadow-primary/20 hover:scale-105 transition-transform">
                <Plus size={20} /> New Online Game
              </button>
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Stats Column */}
          <div className="lg:col-span-1 space-y-8">
            <div className="glass p-8 rounded-[40px] border border-white/10 bg-gradient-to-b from-white/5 to-transparent">
              <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
                <div className="p-2 bg-accent/20 rounded-xl"><Trophy className="text-accent" size={20} /></div>
                Career Stats
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <StatCard label="Matches" value={stats.matchesPlayed || 0} />
                <StatCard label="Wins" value={stats.wins || 0} />
                <StatCard label="Rating" value={stats.rating || 1200} />
                <StatCard label="Win Rate" value={stats.matchesPlayed > 0 ? `${Math.round((stats.wins / stats.matchesPlayed) * 100)}%` : "0%"} />
              </div>
            </div>

            <div className="glass p-8 rounded-[40px] border border-white/10">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-xl"><History className="text-primary" size={20} /></div>
                History
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
            <div className="glass p-8 rounded-[40px] border border-white/10 min-h-[600px] flex flex-col">
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-3xl font-black flex items-center gap-4">
                  <div className="p-3 bg-primary/20 rounded-2xl"><Swords className="text-primary" size={28} /></div>
                  Battle Arena
                </h3>
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/30 group-focus-within:text-primary transition-colors" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search contenders..."
                    className="bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-6 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all w-64"
                  />
                </div>
              </div>

              <div className="flex-1 space-y-4">
                {activePlayers.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-foreground/20">
                    <Search size={64} className="mb-4 opacity-10" />
                    <p className="text-xl font-bold">No other players online</p>
                    <p className="text-sm">Wait for others to join the arena</p>
                  </div>
                )}
                {activePlayers.map((player) => (
                  <motion.div 
                    key={player.id}
                    whileHover={{ x: 10, backgroundColor: "rgba(255,255,255,0.05)" }}
                    className="flex items-center justify-between p-6 rounded-[32px] bg-white/2 border border-white/5 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center font-bold text-2xl shadow-lg relative">
                        {player.name[0]}
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-4 border-[#0a0a0a] rounded-full" />
                      </div>
                      <div>
                        <p className="font-bold text-xl">{player.name}</p>
                        <div className="flex items-center gap-3 text-xs text-foreground/40 mt-1">
                          <span className="flex items-center gap-1 font-bold text-accent"><Trophy size={12} /> {player.rating}</span>
                          <span>•</span>
                          <span>{player.status}</span>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => sendChallenge(player.id)}
                      disabled={player.status !== "Online"}
                      className="px-8 py-3 bg-white text-black hover:bg-primary hover:text-white text-sm font-black rounded-2xl disabled:opacity-10 disabled:cursor-not-allowed shadow-xl transition-all uppercase tracking-widest"
                    >
                      Challenge
                    </button>
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
    <div className="p-6 rounded-3xl bg-white/5 border border-white/5 hover:border-primary/20 transition-colors group">
      <p className="text-xs font-bold text-foreground/30 uppercase tracking-widest mb-2 group-hover:text-primary transition-colors">{label}</p>
      <p className="text-3xl font-black">{value}</p>
    </div>
  );
}

function RecentGame({ opponent, result, date }) {
  return (
    <div className="flex items-center justify-between p-5 rounded-3xl bg-white/2 border border-white/5 hover:border-white/10 transition-all">
      <div className="flex items-center gap-4">
        <div className={cn("w-2 h-2 rounded-full", result === "Won" ? "bg-green-500" : "bg-red-500")} />
        <div>
          <p className="font-bold">{opponent}</p>
          <p className="text-[10px] text-foreground/40 uppercase font-black">{date}</p>
        </div>
      </div>
      <span className={cn("px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter", result === "Won" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500")}>
        {result}
      </span>
    </div>
  );
}

