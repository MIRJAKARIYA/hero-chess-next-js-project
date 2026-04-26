"use client";
import { useState } from "react";
import { Chess } from "chess.js";
import ChessBoard from "@/components/ChessBoard";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Undo2, Trophy, Users, History as HistoryIcon } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function LocalPlayPage() {
  const [game, setGame] = useState(new Chess());
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const makeMove = (move) => {
    try {
      const result = game.move(move);
      if (result) {
        setGame(new Chess(game.fen()));
        setHistory([...history, result]);
      }
    } catch (e) {
      console.error("Invalid move", e);
    }
  };

  const resetGame = () => {
    setGame(new Chess());
    setHistory([]);
  };

  const undoMove = () => {
    game.undo();
    setGame(new Chess(game.fen()));
    setHistory(history.slice(0, -1));
  };

  const isCheckmate = game.isCheckmate();
  const turn = game.turn();

  return (
    <div className="h-[100dvh] p-4 md:p-6 flex flex-col items-center justify-center gap-6 bg-background relative overflow-y-auto overflow-x-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-secondary" />

      <div className="flex flex-col gap-4 w-full max-w-[800px] z-10">
        {/* Player 2 (Black) */}
        <div className={cn(
          "flex justify-between items-center glass p-4 rounded-3xl border transition-all duration-500",
          turn === "b" ? "border-primary shadow-lg shadow-primary/10 ring-1 ring-primary/20" : "border-white/10 opacity-60"
        )}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xl border border-white/10">
              P2
            </div>
            <div>
              <p className="font-bold text-lg">Player 2</p>
              <p className="text-xs text-foreground/40 font-medium">Black Pieces</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowHistory(!showHistory)} className="p-3 glass rounded-xl hover:bg-white/10 transition-colors">
              <HistoryIcon size={20} />
            </button>
            <button onClick={resetGame} className="p-3 glass rounded-xl hover:bg-white/10 transition-colors text-accent">
              <RefreshCw size={20} />
            </button>
          </div>
        </div>

        {/* Board */}
        <div className="relative">
          <ChessBoard game={game} onMove={makeMove} />
          
          <AnimatePresence>
            {showHistory && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="absolute top-0 right-[-320px] w-[300px] h-full glass rounded-3xl border border-white/10 p-6 hidden xl:flex flex-col"
              >
                <h3 className="text-sm font-bold mb-4 flex items-center gap-2 uppercase tracking-widest text-foreground/40">
                  <span className="w-2 h-2 bg-primary rounded-full" /> Move History
                </h3>
                <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {history.length === 0 && <p className="text-foreground/30 text-center mt-10">No moves yet</p>}
                  {Array.from({ length: Math.ceil(history.length / 2) }).map((_, i) => (
                    <div key={i} className="flex gap-4 p-3 rounded-xl bg-white/5 border border-white/5">
                      <span className="text-foreground/30 font-mono w-6 text-xs">{i + 1}.</span>
                      <span className="flex-1 font-bold text-sm">{history[i * 2]?.san}</span>
                      <span className="flex-1 font-bold text-sm text-foreground/60">{history[i * 2 + 1]?.san || ""}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Player 1 (White) */}
        <div className={cn(
          "flex justify-between items-center glass p-4 rounded-3xl border transition-all duration-500",
          turn === "w" ? "border-primary shadow-lg shadow-primary/10 ring-1 ring-primary/20" : "border-white/10 opacity-60"
        )}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center font-bold text-xl">
              P1
            </div>
            <div>
              <p className="font-bold text-lg">Player 1</p>
              <p className="text-xs text-foreground/40 font-medium">White Pieces</p>
            </div>
          </div>
          <div className="flex gap-4 items-center">
             <button onClick={undoMove} className="p-3 glass rounded-xl hover:bg-white/10 transition-colors">
              <Undo2 size={20} />
            </button>
            <div className="text-right">
              <p className="text-xs font-bold text-foreground/30 uppercase mb-1">Status</p>
              <p className={cn("font-bold", turn === "w" ? "text-green-500" : "text-foreground/40")}>
                {turn === "w" ? "Your Turn" : "Waiting..."}
              </p>
            </div>
          </div>
        </div>

        {isCheckmate && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-lg p-4"
          >
            <div className="bg-card p-12 rounded-[40px] border border-primary/30 text-center shadow-[0_0_50px_rgba(157,80,187,0.2)] max-w-sm w-full">
              <Trophy size={80} className="mx-auto mb-8 text-accent animate-bounce" />
              <h2 className="text-5xl font-black mb-4 tracking-tighter">Checkmate!</h2>
              <p className="text-xl text-foreground/60 mb-10">
                {turn === "w" ? "Player 2 (Black) Wins" : "Player 1 (White) Wins"}
              </p>
              <button 
                onClick={resetGame} 
                className="w-full py-5 bg-primary text-white rounded-3xl font-black text-xl shadow-xl shadow-primary/30 hover:scale-105 transition-transform"
              >
                Play Again
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

