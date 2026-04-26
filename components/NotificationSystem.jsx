"use client";
import { useEffect, useState, useCallback } from "react";
import { pusherClient } from "@/lib/pusher-client";
import { authClient } from "@/lib/auth-client";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, X, Swords } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const CHALLENGE_TIMEOUT_MS = 30000;

export default function NotificationSystem() {
  const { data: session } = authClient.useSession();
  const [incomingChallenge, setIncomingChallenge] = useState(null);
  const [countdown, setCountdown] = useState(30);
  const router = useRouter();

  // Auto-decline when countdown hits 0 or user clicks decline
  const declineChallenge = useCallback(async (challenge, silent = false) => {
    if (!challenge) return;
    setIncomingChallenge(null);
    if (!silent) {
      try {
        await fetch("/api/challenge/decline", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ challengerId: challenge.challenger.id }),
        });
      } catch (_) {}
    }
  }, []);

  // Countdown timer while a challenge is pending
  useEffect(() => {
    if (!incomingChallenge) {
      setCountdown(30);
      return;
    }

    setCountdown(30);
    const tick = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(tick);
          // Pass a snapshot so the closure captures the right value
          setIncomingChallenge((current) => {
            if (current) {
              declineChallenge(current);
              toast.info("Challenge expired", { description: "You didn't respond in time." });
            }
            return null;
          });
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    return () => clearInterval(tick);
  }, [incomingChallenge, declineChallenge]);

  useEffect(() => {
    if (!session || !pusherClient) return;

    const channel = pusherClient.subscribe(`user-${session.user.id}`);

    // Incoming challenge from another player
    channel.bind("challenge", (data) => {
      setIncomingChallenge(data);
      toast.info(`${data.challenger.name} wants to play!`, {
        description: "Check the notification to accept or decline.",
        duration: 5000,
      });
    });

    // Challenger hears back when accepted
    channel.bind("challenge-accepted", (data) => {
      toast.success("Challenge Accepted!", {
        description: `${data.opponentName} is ready — entering the arena!`,
        duration: 3000,
      });
      setTimeout(() => router.push(`/play/online/${data.gameId}`), 1200);
    });

    // Challenger hears back when declined
    channel.bind("challenge-declined", (data) => {
      toast.error("Challenge Declined", {
        description: `${data.declinedBy} declined your challenge.`,
        duration: 4000,
      });
    });

    // Target player's challenge popup was cancelled by the challenger
    channel.bind("challenge-cancelled", (data) => {
      setIncomingChallenge((current) => {
        // Only dismiss if it's from the same challenger
        if (current && data.challengerName === current.challenger.name) {
          toast.info("Challenge withdrawn", {
            description: `${data.challengerName} cancelled their challenge.`,
          });
          return null;
        }
        return current;
      });
    });

    return () => {
      pusherClient.unsubscribe(`user-${session.user.id}`);
    };
  }, [session, router]);

  const acceptChallenge = async () => {
    if (!incomingChallenge) return;
    const challenge = incomingChallenge;
    setIncomingChallenge(null);

    try {
      const res = await fetch("/api/challenge/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengerId: challenge.challenger.id }),
      });
      const data = await res.json();
      if (data.success) {
        router.push(`/play/online/${data.gameId}`);
      } else {
        toast.error(data.error || "Could not accept challenge");
      }
    } catch (_) {
      toast.error("Failed to accept challenge");
    }
  };

  // Progress bar width as percentage
  const progressPct = (countdown / 30) * 100;

  return (
    <AnimatePresence>
      {incomingChallenge && (
        <motion.div
          initial={{ opacity: 0, y: -60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -60, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-4"
        >
          <div className="glass p-6 rounded-[32px] border border-primary/40 shadow-[0_0_60px_rgba(157,80,187,0.35)] flex flex-col gap-5 overflow-hidden relative">
            {/* Animated glow ring */}
            <div className="absolute inset-0 rounded-[32px] border border-primary/20 animate-pulse pointer-events-none" />

            {/* Header */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
                <Swords className="text-primary animate-pulse" size={26} />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-black tracking-tight">Match Invitation</h3>
                <p className="text-sm text-foreground/60 truncate">
                  <span className="text-primary font-bold">{incomingChallenge.challenger.name}</span>
                  {" "}wants to battle!
                </p>
              </div>
              <div className="ml-auto text-right shrink-0">
                <p className="text-[10px] font-black text-foreground/30 uppercase tracking-widest mb-0.5">Expires in</p>
                <p className={`text-2xl font-black tabular-nums ${countdown <= 10 ? "text-red-400" : "text-primary"}`}>
                  {countdown}s
                </p>
              </div>
            </div>

            {/* Countdown progress bar */}
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.9, ease: "linear" }}
              />
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                id="accept-challenge-btn"
                onClick={acceptChallenge}
                className="flex-1 py-4 bg-primary text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-primary/30 hover:scale-[1.03] active:scale-[0.97] transition-transform"
              >
                <Check size={18} /> Accept
              </button>
              <button
                id="decline-challenge-btn"
                onClick={() => declineChallenge(incomingChallenge)}
                className="flex-1 py-4 glass border border-white/10 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-all"
              >
                <X size={18} /> Decline
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
