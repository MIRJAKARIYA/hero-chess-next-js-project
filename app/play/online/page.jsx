"use client";
import { useState, useEffect, useCallback } from "react";
import { authClient } from "@/lib/auth-client";
import { pusherClient } from "@/lib/pusher-client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Search, Sword, Shield, Zap, Info, Loader2, Clock, CheckCircle2, XCircle,
} from "lucide-react";
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
  const [searchQuery, setSearchQuery] = useState("");
  // Map of userId → "pending" | "sent" to track challenge state
  const [challengeStates, setChallengeStates] = useState({});

  // Fetch active users from the REST endpoint
  const fetchActiveUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/users/active");
      if (!res.ok) return;
      const data = await res.json();
      setActiveUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to fetch active users", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch + polling fallback (10 s)
  useEffect(() => {
    fetchActiveUsers();
    const interval = setInterval(fetchActiveUsers, 10000);
    return () => clearInterval(interval);
  }, [fetchActiveUsers]);

  // Subscribe to the Pusher lobby channel for real-time presence updates
  useEffect(() => {
    if (!pusherClient || !session) return;

    const channel = pusherClient.subscribe("lobby");

    channel.bind("presence", (data) => {
      if (Array.isArray(data.users)) {
        // Filter out self
        setActiveUsers(data.users.filter((u) => u.id !== session.user.id));
      }
    });

    return () => {
      pusherClient.unsubscribe("lobby");
    };
  }, [session]);

  // Listen for responses on own user channel to clear the pending state
  useEffect(() => {
    if (!session || !pusherClient) return;

    // Re-use the existing channel subscription (NotificationSystem already subscribes)
    const channel = pusherClient.channel(`user-${session.user.id}`) ||
      pusherClient.subscribe(`user-${session.user.id}`);

    const onAccepted = () => setChallengeStates({});
    const onDeclined = () => setChallengeStates({});
    const onCancelled = () => setChallengeStates({});

    channel.bind("challenge-accepted", onAccepted);
    channel.bind("challenge-declined", onDeclined);
    channel.bind("challenge-cancelled", onCancelled);

    return () => {
      channel.unbind("challenge-accepted", onAccepted);
      channel.unbind("challenge-declined", onDeclined);
      channel.unbind("challenge-cancelled", onCancelled);
    };
  }, [session]);

  const handleChallenge = async (userId) => {
    if (!session) {
      toast.error("Please log in to challenge players!");
      return;
    }

    // Prevent double-challenging
    if (challengeStates[userId] === "pending") return;

    setChallengeStates((prev) => ({ ...prev, [userId]: "pending" }));

    try {
      const res = await fetch("/api/challenge/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: userId }),
      });
      const data = await res.json();

      if (data.success) {
        setChallengeStates((prev) => ({ ...prev, [userId]: "sent" }));
        toast.success("Challenge sent!", {
          description: "Click the button again to cancel.",
          duration: 5000,
        });

        // Auto-clear the "sent" UI after 30 s (challenge TTL)
        setTimeout(() => {
          setChallengeStates((prev) => {
            const next = { ...prev };
            if (next[userId] === "sent") delete next[userId];
            return next;
          });
          toast.info("Challenge expired", { description: "No response from the player." });
        }, 30000);
      } else {
        toast.error(data.error || "Failed to send challenge");
        setChallengeStates((prev) => { const n = { ...prev }; delete n[userId]; return n; });
      }
    } catch (_) {
      toast.error("An error occurred");
      setChallengeStates((prev) => { const n = { ...prev }; delete n[userId]; return n; });
    }
  };

  const cancelChallenge = async (userId) => {
    setChallengeStates((prev) => { const n = { ...prev }; delete n[userId]; return n; });
    try {
      await fetch("/api/challenge/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: userId }),
      });
      toast.info("Challenge cancelled.");
    } catch (_) {
      // Silent — state already cleared
    }
  };

  // Filtered list based on search query
  const filteredUsers = activeUsers.filter((u) =>
    u.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const playingCount = activeUsers.filter((u) => u.status === "Playing").length;

  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-12">

        {/* Hero */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="inline-flex p-4 rounded-3xl bg-primary/10 text-primary mb-4"
          >
            <Users size={40} />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl font-black tracking-tighter"
          >
            BATTLE ARENA
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-foreground/50 max-w-2xl mx-auto font-medium"
          >
            The world's elite chess players are gathered here. Choose your opponent and prove your strategic dominance.
          </motion.p>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="glass p-6 rounded-[32px] border border-white/10 flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500">
              <Zap size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground/40 uppercase tracking-widest">Online Now</p>
              <h3 className="text-2xl font-black">{activeUsers.length} Players</h3>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="glass p-6 rounded-[32px] border border-white/10 flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Shield size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground/40 uppercase tracking-widest">Available</p>
              <h3 className="text-2xl font-black">{activeUsers.length - playingCount} Players</h3>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="glass p-6 rounded-[32px] border border-white/10 flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Sword size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground/40 uppercase tracking-widest">In Game</p>
              <h3 className="text-2xl font-black">{playingCount} Playing</h3>
            </div>
          </motion.div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-foreground/20" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search players by name…"
            className="w-full bg-white/5 border border-white/10 rounded-[32px] py-5 pl-16 pr-8 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-medium"
          />
        </div>

        {/* Players Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-4">
            <h2 className="text-2xl font-black flex items-center gap-3">
              <Info className="text-primary" /> Available Challengers
            </h2>
            <span className="text-sm text-foreground/40 font-bold">
              {filteredUsers.length} result{filteredUsers.length !== 1 ? "s" : ""}
            </span>
          </div>

          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-4 glass rounded-[48px] border border-white/5">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="font-bold text-foreground/40 animate-pulse uppercase tracking-[0.2em] text-xs">
                Scanning the Globe…
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user, i) => {
                    const state = challengeStates[user.id]; // undefined | "pending" | "sent"
                    const isPlaying = user.status === "Playing";

                    return (
                      <motion.div
                        key={user.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.85 }}
                        transition={{ delay: i * 0.04 }}
                        className="glass p-8 rounded-[48px] border border-white/10 hover:border-primary/30 transition-all group relative overflow-hidden"
                      >
                        {/* Glow on hover */}
                        <div className="absolute inset-0 rounded-[48px] bg-gradient-to-br from-primary/0 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                        {/* Avatar + Status */}
                        <div className="flex items-start justify-between mb-8">
                          <div className="relative">
                            <div className="w-20 h-20 rounded-[28px] bg-secondary flex items-center justify-center text-3xl font-black border-4 border-white/5 shadow-2xl">
                              {user.name?.[0]?.toUpperCase()}
                            </div>
                            <div className={cn(
                              "absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-background",
                              isPlaying ? "bg-amber-500" : "bg-green-500 animate-pulse"
                            )} />
                          </div>

                          <span className={cn(
                            "text-xs font-black px-4 py-2 rounded-full uppercase tracking-widest mt-1",
                            isPlaying ? "bg-amber-500/10 text-amber-500" : "bg-green-500/10 text-green-500"
                          )}>
                            {user.status || "Online"}
                          </span>
                        </div>

                        {/* Name + Rating */}
                        <div className="space-y-4 mb-8">
                          <div>
                            <h3 className="text-2xl font-black tracking-tight">{user.name}</h3>
                            <p className="text-sm text-foreground/40 font-bold uppercase tracking-widest mt-1">
                              Hero Chess Player
                            </p>
                          </div>
                          <div className="flex items-center gap-6">
                            <div>
                              <p className="text-[10px] font-black text-foreground/20 uppercase tracking-widest mb-1">Rating</p>
                              <p className="text-xl font-black text-primary">{user.rating || 1200}</p>
                            </div>
                            <div className="w-px h-8 bg-white/10" />
                            <div>
                              <p className="text-[10px] font-black text-foreground/20 uppercase tracking-widest mb-1">Wins</p>
                              <p className="text-xl font-black">{user.wins ?? "—"}</p>
                            </div>
                          </div>
                        </div>

                        {/* Challenge / Cancel Button */}
                        <button
                          id={`challenge-btn-${user.id}`}
                          onClick={() =>
                            state === "sent"
                              ? cancelChallenge(user.id)
                              : handleChallenge(user.id)
                          }
                          disabled={isPlaying || state === "pending"}
                          className={cn(
                            "w-full py-5 rounded-[32px] font-black text-sm uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 group/btn",
                            isPlaying
                              ? "bg-white/5 text-foreground/20 cursor-not-allowed"
                              : state === "sent"
                              ? "bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400"
                              : state === "pending"
                              ? "bg-white/5 text-foreground/30 cursor-wait"
                              : "bg-primary text-white shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
                          )}
                        >
                          {state === "pending" ? (
                            <><Loader2 className="animate-spin" size={18} /> Sending…</>
                          ) : state === "sent" ? (
                            <>
                              <span className="group-hover/btn:hidden flex items-center gap-2">
                                <CheckCircle2 size={18} /> Challenge Sent
                              </span>
                              <span className="hidden group-hover/btn:flex items-center gap-2">
                                <XCircle size={18} /> Cancel
                              </span>
                            </>
                          ) : isPlaying ? (
                            <><Clock size={18} /> In a Game</>
                          ) : (
                            <>Challenge <Sword size={18} /></>
                          )}
                        </button>

                        {/* Decorative icon */}
                        <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-[0.03] transition-opacity pointer-events-none">
                          <Sword size={120} />
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="col-span-full py-20 text-center glass rounded-[48px] border border-white/5 space-y-6"
                  >
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                      <Users className="text-foreground/20" size={40} />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-black">
                        {searchQuery ? "No Players Found" : "Lone Warrior"}
                      </h3>
                      <p className="text-foreground/40 max-w-xs mx-auto">
                        {searchQuery
                          ? `No players matching "${searchQuery}".`
                          : "No other grandmasters are currently online. Invite a friend or play against the AI!"}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
