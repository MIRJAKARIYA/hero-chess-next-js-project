"use client";
import { useEffect, useState } from "react";
import { pusherClient } from "@/lib/pusher-client";
import { authClient } from "@/lib/auth-client";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function NotificationSystem() {
  const { data: session } = authClient.useSession();
  const [incomingChallenge, setIncomingChallenge] = useState(null);
  const router = useRouter();

  useEffect(() => {
    if (!session || !pusherClient) return;

    const channel = pusherClient.subscribe(`user-${session.user.id}`);

    channel.bind("challenge", (data) => {
      setIncomingChallenge(data);
      toast.info("New Challenge!", {
        description: `${data.challenger.name} has challenged you!`,
        duration: 10000,
      });
    });

    channel.bind("challenge-accepted", (data) => {
      toast.success("Challenge Accepted!", {
        description: `${data.opponentName} accepted! Redirecting...`,
      });
      setTimeout(() => {
        router.push(`/play/online/${data.gameId}`);
      }, 1500);
    });

    return () => {
      pusherClient.unsubscribe(`user-${session.user.id}`);
    };
  }, [session, router]);

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

  return (
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
                <p className="text-sm text-foreground/60">
                  <span className="text-primary font-bold">{incomingChallenge.challenger.name}</span> wants to play!
                </p>
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
  );
}
