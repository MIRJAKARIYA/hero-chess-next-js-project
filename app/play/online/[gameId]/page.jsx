"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Chess } from "chess.js";
import ChessBoard from "@/components/ChessBoard";
import { pusherClient } from "@/lib/pusher-client";
import { authClient } from "@/lib/auth-client";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Smile, MessageSquare, Users, Loader2, Trophy, WifiOff } from "lucide-react";
import Link from "next/link";
import { use } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { toast } from "sonner";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function OnlineGamePage({ params }) {
  const { gameId } = use(params);
  const { data: session } = authClient.useSession();
  const [game, setGame] = useState(new Chess());
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [playerColor, setPlayerColor] = useState(null); 
  const [opponent, setOpponent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resultSaved, setResultSaved] = useState(false);
  const [opponentDisconnected, setOpponentDisconnected] = useState(false);
  const chatEndRef = useRef(null);
  const processedMessageIds = useRef(new Set());
  const resultSavedRef = useRef(false);

  useEffect(() => {
    if (!gameId || !session || !pusherClient) return;

    const joinGame = async () => {
      try {
        const res = await fetch("/api/game/init", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            gameId, 
            userId: session.user.id, 
            userName: session.user.name 
          }),
        });
        const data = await res.json();
        setPlayerColor(data.color);
        if (data.opponent) setOpponent(data.opponent);
        setLoading(false);
      } catch (e) {
        console.error("Failed to init game", e);
      }
    };

    joinGame();

    const channel = pusherClient.subscribe(`game-${gameId}`);

    channel.bind("move", (data) => {
      setGame(new Chess(data.fen));
    });

    channel.bind("chat", (data) => {
      const msgKey = `${data.sender}-${data.message}-${data.timestamp || Date.now()}`;
      if (!processedMessageIds.current.has(msgKey)) {
        processedMessageIds.current.add(msgKey);
        setMessages((prev) => [...prev, data]);
      }
    });

    channel.bind("player-joined", (data) => {
      setOpponent(data.opponent);
      toast.info(`${data.opponent.name} has joined the game!`);
    });

    channel.bind("player-disconnected", (data) => {
      setOpponentDisconnected(true);
      toast.warning(`${data.name} disconnected from the game.`, {
        duration: 6000,
      });
    });

    return () => {
      pusherClient.unsubscribe(`game-${gameId}`);
      // Reset own status to Online when leaving the game room
      fetch("/api/user/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Online" }),
      }).catch(() => {});
    };
  }, [gameId, session]);

  // Reset own status to Online (called on game-over and unmount)
  const resetStatusToOnline = useCallback(() => {
    fetch("/api/user/heartbeat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "Online" }),
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (game.isGameOver() && !resultSavedRef.current && playerColor && playerColor !== "spectator") {
      resultSavedRef.current = true;

      let result = "Draw";
      if (game.isCheckmate()) {
        result = game.turn() === playerColor ? "Lost" : "Won";
      }

      fetch("/api/game/save-result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          opponentName: opponent?.name || "Anonymous",
          result,
          type: "online",
        }),
      })
        .then(() => setResultSaved(true))
        .catch((e) => console.error("Failed to save result", e));

      // Flip status back so we appear available in the lobby
      resetStatusToOnline();
    }
  }, [game, playerColor, opponent, resetStatusToOnline]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const onMove = async (move) => {
    if (playerColor === "spectator") {
      toast.error("Spectators cannot move pieces!");
      return;
    }

    if (game.turn() !== playerColor) {
      toast.warning("It's not your turn!", {
        description: `Please wait for your opponent to move.`,
      });
      return;
    }

    try {
      const result = game.move(move);
      if (result) {
        const newFen = game.fen();
        setGame(new Chess(newFen));

        await fetch("/api/game/move", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gameId, move, fen: newFen }),
        });
      }
    } catch (e) {
      console.error("Invalid move", e);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const msg = {
      gameId,
      message: inputMessage,
      sender: session?.user?.name || "Anonymous",
      timestamp: Date.now(),
    };

    setInputMessage("");

    await fetch("/api/game/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(msg),
    });
  };

  const sendEmoji = async (emoji) => {
    await fetch("/api/game/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        gameId, 
        message: emoji, 
        sender: session?.user?.name,
        timestamp: Date.now()
      }),
    });
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-xl font-bold animate-pulse">Entering the Arena...</p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col lg:flex-row p-4 md:p-6 gap-6 overflow-hidden">
      {/* Game Section */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        {/* Opponent Info */}
        <div className={cn(
          "w-full max-w-[800px] flex justify-between items-center glass p-4 rounded-3xl border transition-all duration-500",
          game.turn() !== playerColor ? "border-primary shadow-lg shadow-primary/10 ring-1 ring-primary/20" : "border-white/10 opacity-60"
        )}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xl border border-white/10">
              {opponent?.name?.[0] || "?"}
            </div>
            <div>
              <p className="font-bold text-lg">{opponent?.name || "Waiting..."}</p>
              <p className="text-[10px] text-foreground/40 font-bold uppercase tracking-widest">
                {playerColor === "w" ? "Black Pieces" : "White Pieces"}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-foreground/30 uppercase mb-1">Status</p>
            <p className={cn("font-bold", game.turn() !== playerColor ? "text-green-500" : "text-foreground/40")}>
              {game.turn() !== playerColor ? "Thinking..." : "Waiting..."}
            </p>
          </div>
        </div>

        <ChessBoard game={game} onMove={onMove} playerColor={playerColor} />

        {/* User Info */}
        <div className={cn(
          "w-full max-w-[800px] flex justify-between items-center glass p-4 rounded-3xl border transition-all duration-500",
          game.turn() === playerColor ? "border-primary shadow-lg shadow-primary/10 ring-1 ring-primary/20" : "border-white/10 opacity-60"
        )}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center font-bold text-xl border border-white/10 shadow-lg">
              {session?.user?.name?.[0] || "U"}
            </div>
            <div>
              <p className="font-bold text-lg">{session?.user?.name || "You"}</p>
              <p className="text-[10px] text-foreground/40 font-bold uppercase tracking-widest">
                {playerColor === "w" ? "White Pieces" : "Black Pieces"}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-foreground/30 uppercase mb-1">Status</p>
            <p className={cn("font-bold", game.turn() === playerColor ? "text-green-500" : "text-foreground/40")}>
              {game.turn() === playerColor ? "Your Turn" : "Wait..."}
            </p>
          </div>
        </div>

        {game.isGameOver() && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-lg p-4"
          >
            <div className="bg-card p-12 rounded-[40px] border border-primary/30 text-center shadow-[0_0_50px_rgba(157,80,187,0.2)] max-w-sm w-full">
              <Trophy size={80} className="mx-auto mb-8 text-accent animate-bounce" />
              <h2 className="text-5xl font-black mb-4 tracking-tighter">
                {game.isCheckmate() ? "Checkmate!" : "Draw!"}
              </h2>
              <p className="text-xl text-foreground/60 mb-10">
                {game.isCheckmate() 
                  ? (game.turn() === playerColor ? "Opponent Won" : "You Won!") 
                  : "Good game!"}
              </p>
              <Link href="/play/online" className="block w-full">
                <button 
                  className="w-full py-5 bg-primary text-white rounded-3xl font-black text-xl shadow-xl shadow-primary/30 hover:scale-105 transition-transform"
                >
                  Back to Lobby
                </button>
              </Link>
            </div>
          </motion.div>
        )}
      </div>

      {/* Sidebar Section */}
      <div className="w-full lg:w-[400px] flex flex-col gap-6">
        {/* Chat */}
        <div className="flex-1 glass rounded-[40px] border border-white/10 flex flex-col overflow-hidden max-h-[600px] lg:max-h-none">
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
            <h3 className="font-bold flex items-center gap-2">
              <MessageSquare size={18} className="text-primary" /> Game Chat
            </h3>
            <span className="text-xs bg-green-500/20 text-green-500 px-3 py-1 rounded-full font-bold">LIVE</span>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
            {messages.length === 0 && (
              <div className="text-center text-foreground/10 mt-20">
                <Smile size={64} className="mx-auto mb-4 opacity-5" />
                <p className="font-bold">Say hello to your opponent!</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: msg.sender === session?.user?.name ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "flex flex-col gap-1",
                  msg.sender === session?.user?.name ? "items-end" : "items-start"
                )}
              >
                <span className="text-[10px] font-black text-foreground/20 uppercase tracking-widest px-1">{msg.sender}</span>
                <div className={cn(
                  "px-4 py-3 rounded-2xl max-w-[85%] text-sm shadow-sm",
                  msg.sender === session?.user?.name 
                    ? "bg-primary text-white rounded-tr-none" 
                    : "bg-white/5 text-white rounded-tl-none border border-white/5"
                )}>
                  {msg.message.startsWith("http") ? (
                    <img src={msg.message} alt="Meme" className="max-w-full rounded-xl shadow-lg" />
                  ) : (
                    msg.message
                  )}
                </div>
              </motion.div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div className="p-6 border-t border-white/5 space-y-4 bg-white/5">
            <div className="flex gap-2 justify-center flex-wrap">
              {["😂", "🔥", "🤔", "👑", "GG"].map(emoji => (
                <button 
                  key={emoji}
                  onClick={() => sendEmoji(emoji)}
                  className="w-10 h-10 flex items-center justify-center glass rounded-xl hover:bg-white/10 transition-all text-xl"
                >
                  {emoji}
                </button>
              ))}
              <button 
                onClick={() => sendEmoji("https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHJmZzJ3YmZ4ZzB6Z3Z4ZzB6Z3Z4ZzB6Z3Z4ZzB6Z3Z4ZzB6JmVwPXYxX2ludGVybmFsX2dpZl9ieV9pZCZjdD1n/3o7TKMGpxV9bH9K0ZG/giphy.gif")}
                className="w-10 h-10 flex items-center justify-center glass rounded-xl hover:bg-white/10 transition-all"
                title="Send Meme"
              >
                🖼️
              </button>
            </div>
            
            <form onSubmit={sendMessage} className="flex gap-2">
              <input 
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Send a message..."
                className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
              <button className="p-4 bg-primary text-white rounded-2xl shadow-xl shadow-primary/20 active:scale-95 transition-all">
                <Send size={20} />
              </button>
            </form>
          </div>
        </div>

        {/* Spectators */}
        <div className="glass p-6 rounded-[32px] border border-white/10 bg-gradient-to-r from-white/5 to-transparent">
          <h3 className="text-xs font-black text-foreground/30 uppercase mb-4 flex items-center gap-2 tracking-[0.2em]">
            <Users size={14} /> Spectators
          </h3>
          <div className="flex -space-x-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-10 h-10 rounded-full border-4 border-[#0a0a0a] bg-secondary flex items-center justify-center text-xs font-black shadow-lg">
                U{i}
              </div>
            ))}
            <div className="w-10 h-10 rounded-full border-4 border-[#0a0a0a] bg-white/5 flex items-center justify-center text-[10px] font-bold text-foreground/40">
              +5
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
