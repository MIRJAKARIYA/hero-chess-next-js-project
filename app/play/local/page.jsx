"use client";
import { useState } from "react";
import { Chess } from "chess.js";
import ChessBoard from "@/components/ChessBoard";
import { motion } from "framer-motion";
import { RefreshCw, Undo2, Trophy } from "lucide-react";

export default function LocalPlayPage() {
  const [game, setGame] = useState(new Chess());
  const [history, setHistory] = useState([]);

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
  const isDraw = game.isDraw();
  const turn = game.turn() === "w" ? "White" : "Black";

  return (
    <div className="min-h-screen p-8 flex flex-col md:flex-row items-center justify-center gap-12 bg-background">
      <div className="flex flex-col gap-6 w-full max-w-[600px]">
        <div className="flex justify-between items-center bg-card p-6 rounded-2xl border border-border shadow-xl">
          <div>
            <h2 className="text-sm font-bold text-foreground/40 uppercase tracking-widest">Current Turn</h2>
            <p className="text-2xl font-black text-primary">{isCheckmate ? "Game Over" : turn}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={undoMove} className="p-3 glass rounded-xl hover:bg-white/10 transition-colors">
              <Undo2 size={20} />
            </button>
            <button onClick={resetGame} className="p-3 glass rounded-xl hover:bg-white/10 transition-colors text-accent">
              <RefreshCw size={20} />
            </button>
          </div>
        </div>

        <ChessBoard game={game} onMove={makeMove} />

        {isCheckmate && (
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md"
          >
            <div className="bg-card p-12 rounded-3xl border border-primary/30 text-center shadow-2xl">
              <Trophy size={64} className="mx-auto mb-6 text-accent animate-bounce" />
              <h2 className="text-4xl font-black mb-2">Checkmate!</h2>
              <p className="text-xl text-foreground/60 mb-8">{game.turn() === "w" ? "Black" : "White"} Wins</p>
              <button onClick={resetGame} className="px-8 py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20">
                Play Again
              </button>
            </div>
          </motion.div>
        )}
      </div>

      <div className="w-full max-w-[400px] h-[600px] flex flex-col gap-6">
        <div className="flex-1 bg-card rounded-2xl border border-border p-6 overflow-hidden flex flex-col">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-primary rounded-full" /> Move History
          </h3>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {history.length === 0 && <p className="text-foreground/30 text-center mt-10">No moves yet</p>}
            {Array.from({ length: Math.ceil(history.length / 2) }).map((_, i) => (
              <div key={i} className="flex gap-4 p-3 rounded-xl bg-white/5 border border-white/5">
                <span className="text-foreground/30 font-mono w-6">{i + 1}.</span>
                <span className="flex-1 font-bold">{history[i * 2]?.san}</span>
                <span className="flex-1 font-bold text-foreground/60">{history[i * 2 + 1]?.san || ""}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
