"use client";
import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Search, Sword, Shield, Zap, Info, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function OnlineLobbyPage() {
  const { data: session } = authClient.useSession();
  const [activeUsers, setActiveUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [challengingId, setChallengingId] = useState(null);

  const fetchActiveUsers = async () => {
    try {
      const res = await fetch("/api/users/active");
      const data = await res.json();
      setActiveUsers(data);
    } catch (e) {
      console.error("Failed to fetch active users", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveUsers();
    const interval = setInterval(fetchActiveUsers, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const handleChallenge = async (userId) => {
    if (!session) {
      toast.error("Please login to challenge players!");
      return;
    }
    
    setChallengingId(userId);
    try {
      const res = await fetch("/api/challenge/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: userId }),
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success("Challenge sent!", {
          description: "Waiting for player to respond...",
        });
      } else {
        toast.error(data.error || "Failed to send challenge");
      }
    } catch (e) {
      toast.error("An error occurred");
    } finally {
      setChallengingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex p-4 rounded-3xl bg-primary/10 text-primary mb-4"
          >
            <Users size={40} />
          </motion.div>
          <h1 className="text-6xl font-black tracking-tighter">BATTLE ARENA</h1>
          <p className="text-xl text-foreground/50 max-w-2xl mx-auto font-medium">
            The world's elite chess players are gathered here. Choose your opponent and prove your strategic dominance.
          </p>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass p-6 rounded-[32px] border border-white/10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500">
              <Zap size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground/40 uppercase tracking-widest">Active Now</p>
              <h3 className="text-2xl font-black">{activeUsers.length} Players</h3>
            </div>
          </div>
          <div className="glass p-6 rounded-[32px] border border-white/10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Shield size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground/40 uppercase tracking-widest">Global Rank</p>
              <h3 className="text-2xl font-black">Elite Division</h3>
            </div>
          </div>
          <div className="glass p-6 rounded-[32px] border border-white/10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500">
              <Sword size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground/40 uppercase tracking-widest">Matches Live</p>
              <h3 className="text-2xl font-black">24 Ongoing</h3>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-foreground/20" />
            <input 
              type="text" 
              placeholder="Search grandmasters by name or ID..."
              className="w-full bg-white/5 border border-white/10 rounded-[32px] py-6 pl-16 pr-8 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
            />
          </div>
        </div>

        {/* Players Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-4">
            <h2 className="text-2xl font-black flex items-center gap-3">
              <Info className="text-primary" /> Available Challengers
            </h2>
          </div>

          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-4 glass rounded-[48px] border border-white/5">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="font-bold text-foreground/40 animate-pulse uppercase tracking-[0.2em] text-xs">Scanning the Globe...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {activeUsers.length > 0 ? (
                  activeUsers.map((user, i) => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="glass p-8 rounded-[48px] border border-white/10 hover:border-primary/30 transition-all group relative overflow-hidden"
                    >
                      <div className="flex items-start justify-between mb-8">
                        <div className="relative">
                          <div className="w-20 h-20 rounded-[28px] bg-secondary flex items-center justify-center text-3xl font-black border-4 border-white/5 shadow-2xl">
                            {user.name?.[0]}
                          </div>
                          <div className={cn(
                            "absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-background",
                            user.status === "Playing" ? "bg-amber-500" : "bg-green-500"
                          )} />
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-foreground/30 uppercase tracking-[0.2em] mb-1">Status</p>
                          <span className={cn(
                            "text-xs font-black px-4 py-2 rounded-full uppercase tracking-widest",
                            user.status === "Playing" ? "bg-amber-500/10 text-amber-500" : "bg-green-500/10 text-green-500"
                          )}>
                            {user.status || "Online"}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-4 mb-8">
                        <div>
                          <h3 className="text-2xl font-black tracking-tight">{user.name}</h3>
                          <p className="text-sm text-foreground/40 font-bold uppercase tracking-widest mt-1">
                            Grandmaster Candidate
                          </p>
                        </div>
                        <div className="flex items-center gap-6">
                          <div>
                            <p className="text-[10px] font-black text-foreground/20 uppercase tracking-widest mb-1">Rating</p>
                            <p className="text-xl font-black text-primary">{user.rating || 1200}</p>
                          </div>
                          <div className="w-px h-8 bg-white/10" />
                          <div>
                            <p className="text-[10px] font-black text-foreground/20 uppercase tracking-widest mb-1">Matches</p>
                            <p className="text-xl font-black">Real-time</p>
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={() => handleChallenge(user.id)}
                        disabled={challengingId === user.id || user.status === "Playing"}
                        className={cn(
                          "w-full py-5 rounded-[32px] font-black text-sm uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3",
                          user.status === "Playing" 
                            ? "bg-white/5 text-foreground/20 cursor-not-allowed" 
                            : "bg-primary text-white shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
                        )}
                      >
                        {challengingId === user.id ? (
                          <Loader2 className="animate-spin" size={18} />
                        ) : (
                          <>Challenge <Sword size={18} /></>
                        )}
                      </button>

                      <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-[0.02] transition-opacity pointer-events-none">
                        <Sword size={120} />
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="col-span-full py-20 text-center glass rounded-[48px] border border-white/5 space-y-6">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                      <Users className="text-foreground/20" size={40} />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-black">Lone Warrior</h3>
                      <p className="text-foreground/40 max-w-xs mx-auto">
                        No other grandmasters are currently online. Invite a friend or play against the AI!
                      </p>
                    </div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
