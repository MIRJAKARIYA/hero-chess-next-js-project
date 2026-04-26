"use client";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { motion } from "framer-motion";
import { Trophy, Target, Sword, History, TrendingUp, User, ArrowRight } from "lucide-react";
import Link from "next/link";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function DashboardPage() {
  const { data: session } = authClient.useSession();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/user/stats");
        const data = await res.json();
        setStats(data);
      } catch (e) {
        console.error("Failed to fetch stats", e);
      } finally {
        setLoading(false);
      }
    };
    if (session) fetchStats();
  }, [session]);

  const statCards = [
    { label: "Current Rating", value: stats?.rating || 1200, icon: Trophy, color: "text-yellow-500", bg: "bg-yellow-500/10" },
    { label: "Matches Played", value: stats?.matchesPlayed || 0, icon: Target, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Total Wins", value: stats?.wins || 0, icon: Sword, color: "text-green-500", bg: "bg-green-500/10" },
    { 
      label: "Win Rate", 
      value: stats?.matchesPlayed > 0 ? `${Math.round((stats.wins / stats.matchesPlayed) * 100)}%` : "0%", 
      icon: TrendingUp, 
      color: "text-purple-500", 
      bg: "bg-purple-500/10" 
    },
  ];

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-[32px] bg-secondary flex items-center justify-center text-4xl font-black border-4 border-white/5 shadow-2xl">
              {session?.user?.name?.[0] || "U"}
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tight mb-2">Welcome Back, {session?.user?.name?.split(" ")[0]}!</h1>
              <p className="text-foreground/50 flex items-center gap-2 font-medium">
                <span className="w-2 h-2 rounded-full bg-green-500" /> Professional Hero Chess Player
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <Link href="/play/online">
              <button className="px-8 py-4 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                Play Online
              </button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass p-8 rounded-[40px] border border-white/10 hover:border-white/20 transition-all group relative overflow-hidden"
            >
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110", stat.bg)}>
                <stat.icon className={stat.color} size={28} />
              </div>
              <p className="text-sm font-bold text-foreground/40 uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className="text-4xl font-black tracking-tighter">{stat.value}</h3>
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <stat.icon size={80} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Career History */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between px-4">
              <h2 className="text-2xl font-black flex items-center gap-3">
                <History className="text-primary" /> Career History
              </h2>
            </div>
            
            <div className="glass rounded-[48px] border border-white/10 overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="p-8 text-xs font-black text-foreground/30 uppercase tracking-[0.2em]">Opponent</th>
                      <th className="p-8 text-xs font-black text-foreground/30 uppercase tracking-[0.2em]">Game Type</th>
                      <th className="p-8 text-xs font-black text-foreground/30 uppercase tracking-[0.2em]">Result</th>
                      <th className="p-8 text-xs font-black text-foreground/30 uppercase tracking-[0.2em]">Rating</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {stats?.recentMatches?.length > 0 ? (
                      stats.recentMatches.map((match, i) => (
                        <tr key={i} className="hover:bg-white/5 transition-colors">
                          <td className="p-8">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center font-bold text-sm">
                                {match.opponentName?.[0]}
                              </div>
                              <span className="font-bold">{match.opponentName}</span>
                            </div>
                          </td>
                          <td className="p-8">
                            <span className="text-xs font-black px-4 py-2 bg-white/5 rounded-full uppercase tracking-widest">
                              {match.type}
                            </span>
                          </td>
                          <td className="p-8">
                            <span className={cn(
                              "text-xs font-black px-4 py-2 rounded-full uppercase tracking-widest",
                              match.result === "Won" ? "bg-green-500/10 text-green-500" : 
                              match.result === "Lost" ? "bg-red-500/10 text-red-500" : "bg-yellow-500/10 text-yellow-500"
                            )}>
                              {match.result}
                            </span>
                          </td>
                          <td className="p-8 font-black text-lg">
                            <span className={match.ratingChange >= 0 ? "text-green-500" : "text-red-500"}>
                              {match.ratingChange >= 0 ? "+" : ""}{match.ratingChange}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="p-12 text-center text-foreground/20 font-bold italic">
                          No matches played yet. Start your journey today!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-black px-4 flex items-center gap-3">
              <User className="text-secondary" /> Player Profile
            </h2>
            <div className="glass p-8 rounded-[48px] border border-white/10 space-y-8 bg-gradient-to-b from-white/5 to-transparent">
              <div className="text-center space-y-4">
                <div className="w-32 h-32 rounded-full bg-secondary mx-auto border-8 border-white/5 shadow-2xl flex items-center justify-center text-5xl font-black">
                  {session?.user?.name?.[0]}
                </div>
                <div>
                  <h3 className="text-2xl font-black">{session?.user?.name}</h3>
                  <p className="text-foreground/40 text-sm">{session?.user?.email}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-white/5 rounded-3xl border border-white/5">
                  <span className="text-sm font-bold text-foreground/40">Member Since</span>
                  <span className="font-bold">{new Date(session?.user?.createdAt || Date.now()).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-white/5 rounded-3xl border border-white/5">
                  <span className="text-sm font-bold text-foreground/40">Account Status</span>
                  <span className="text-green-500 font-bold">Verified</span>
                </div>
              </div>

              <button className="w-full py-5 glass border border-white/10 rounded-[32px] font-black text-sm uppercase tracking-[0.2em] hover:bg-white/10 transition-all flex items-center justify-center gap-3">
                Edit Profile <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
