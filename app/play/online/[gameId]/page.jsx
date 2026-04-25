"use client";
import { useState, useEffect, useRef } from "react";
import { Chess } from "chess.js";
import ChessBoard from "@/components/ChessBoard";
import { pusherClient } from "@/lib/pusher";
import { authClient } from "@/lib/auth-client";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Smile, Image as ImageIcon, MessageSquare, Users } from "lucide-react";
import { use } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function OnlineGamePage({ params }) {
  const { gameId } = use(params);
  const { data: session } = authClient.useSession();
  const [game, setGame] = useState(new Chess());
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [playerColor, setPlayerColor] = useState("w"); // Default to white for now
  const [opponent, setOpponent] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (!gameId) return;

    const channel = pusherClient.subscribe(`game-${gameId}`);

    channel.bind("move", (data) => {
      // Don't update if it's our own move (already updated locally)
      // Actually, it's safer to just sync with the FEN
      setGame(new Chess(data.fen));
    });

    channel.bind("chat", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      pusherClient.unsubscribe(`game-${gameId}`);
    };
  }, [gameId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const onMove = async (move) => {
    // Only allow moving if it's our turn
    if (game.turn() !== playerColor) {
      alert("It's not your turn!");
      return;
    }

    try {
      const result = game.move(move);
      if (result) {
        const newFen = game.fen();
        setGame(new Chess(newFen));

        // Sync with server
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
      body: JSON.stringify({ gameId, message: emoji, sender: session?.user?.name }),
    });
  };

  return (
    <div className="h-screen bg-background flex flex-col lg:flex-row p-4 md:p-6 gap-6 overflow-hidden">
      {/* Game Section */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <div className="w-full max-w-[800px] flex justify-between items-center glass p-3 rounded-xl border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center font-bold text-xs">O</div>
            <div>
              <p className="font-bold text-sm">{opponent?.name || "Waiting..."}</p>
              <p className="text-[10px] text-foreground/40">Rating: 1500</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-foreground/30 uppercase">Time</p>
            <p className="text-lg font-mono">10:00</p>
          </div>
        </div>

        <ChessBoard game={game} onMove={onMove} playerColor={playerColor} />

        <div className="w-full max-w-[800px] flex justify-between items-center glass p-3 rounded-xl border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-bold text-xs">
              {session?.user?.name?.[0] || "Y"}
            </div>
            <div>
              <p className="font-bold text-sm">{session?.user?.name || "You"}</p>
              <p className="text-[10px] text-foreground/40">Rating: 1450</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-foreground/30 uppercase">Time</p>
            <p className="text-lg font-mono">08:45</p>
          </div>
        </div>
      </div>

      {/* Sidebar Section */}
      <div className="w-full lg:w-[400px] flex flex-col gap-6">
        {/* Chat */}
        <div className="flex-1 glass rounded-3xl border border-white/10 flex flex-col overflow-hidden max-h-[600px] lg:max-h-none">
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
            <h3 className="font-bold flex items-center gap-2">
              <MessageSquare size={18} className="text-primary" /> Game Chat
            </h3>
            <span className="text-xs bg-green-500/20 text-green-500 px-2 py-1 rounded-lg">Online</span>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
            {messages.length === 0 && (
              <div className="text-center text-foreground/20 mt-20">
                <Smile size={48} className="mx-auto mb-2 opacity-10" />
                <p>Start the conversation!</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex flex-col gap-1",
                  msg.sender === session?.user?.name ? "items-end" : "items-start"
                )}
              >
                <span className="text-[10px] font-bold text-foreground/30 uppercase">{msg.sender}</span>
                <div className={cn(
                  "px-4 py-2 rounded-2xl max-w-[80%] text-sm overflow-hidden",
                  msg.sender === session?.user?.name 
                    ? "bg-primary text-white rounded-tr-none" 
                    : "bg-white/10 text-white rounded-tl-none"
                )}>
                  {msg.message.startsWith("http") ? (
                    <img src={msg.message} alt="Meme" className="max-w-full rounded-lg" />
                  ) : (
                    msg.message
                  )}
                </div>
              </motion.div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div className="p-4 border-t border-white/5 space-y-4 bg-white/5">
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
                className="w-10 h-10 flex items-center justify-center glass rounded-xl hover:bg-white/10 transition-all text-xl"
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
                placeholder="Type a message..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
              <button className="p-3 bg-primary text-white rounded-xl shadow-lg shadow-primary/20">
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>

        {/* Spectators / Info */}
        <div className="glass p-6 rounded-3xl border border-white/10">
          <h3 className="text-sm font-bold text-foreground/40 uppercase mb-4 flex items-center gap-2">
            <Users size={14} /> Spectators (2)
          </h3>
          <div className="flex -space-x-2">
            {[1, 2].map(i => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-background bg-secondary flex items-center justify-center text-[10px] font-bold">
                U{i}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

