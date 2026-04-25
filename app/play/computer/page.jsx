"use client";
import { useState, useEffect } from "react";
import { Chess } from "chess.js";
import ChessBoard from "@/components/ChessBoard";
import { motion } from "framer-motion";
import { Cpu, RefreshCw, Trophy, Zap } from "lucide-react";

export default function ComputerPlayPage() {
  const [game, setGame] = useState(new Chess());
  const [difficulty, setDifficulty] = useState("Easy");
  const [isThinking, setIsThinking] = useState(false);

  useEffect(() => {
    if (game.turn() === "b" && !game.isGameOver()) {
      setIsThinking(true);
      setTimeout(makeComputerMove, 800);
    }
  }, [game]);

  const makeComputerMove = () => {
    const moves = game.moves();
    if (moves.length > 0) {
      // Simple logic: Random for Easy, simple capture priority for Medium
      let move;
      if (difficulty === "Easy") {
        move = moves[Math.floor(Math.random() * moves.length)];
      } else {
        // Simple heuristic: try to capture pieces
        const captures = moves.filter(m => m.includes("x"));
        move = captures.length > 0 ? captures[Math.floor(Math.random() * captures.length)] : moves[Math.floor(Math.random() * moves.length)];
      }
      
      game.move(move);
      setGame(new Chess(game.fen()));
    }
    setIsThinking(false);
  };

  const onMove = (move) => {
    if (game.turn() !== "w") return;

    try {
      const result = game.move(move);
      if (result) {
        setGame(new Chess(game.fen()));
      }
    } catch (e) {
      console.error("Invalid move", e);
    }
  };

  const resetGame = () => {
    setGame(new Chess());
  };

  return (
    <div className="h-screen p-4 md:p-6 flex flex-col items-center justify-center gap-6 bg-background relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-secondary" />

      <div className="flex flex-col gap-4 w-full max-w-[800px] z-10">
        <div className="flex justify-between items-center glass p-4 rounded-3xl border border-white/10 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-accent/20 rounded-2xl">
              <Cpu size={24} className="text-accent" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground/40 uppercase tracking-widest">Opponent</h2>
              <p className="text-2xl font-black">Stockfish <span className="text-accent">Lite</span></p>
            </div>
          </div>
          
          <div className="flex gap-4 items-center">
            <select 
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm font-bold focus:outline-none"
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
            </select>
            <button onClick={resetGame} className="p-3 glass rounded-xl hover:bg-white/10 transition-colors text-primary">
              <RefreshCw size={20} />
            </button>
          </div>
        </div>

        <div className="relative">
          <ChessBoard game={game} onMove={onMove} playerColor="w" />
          
          {isThinking && (
            <div className="absolute top-4 right-4 bg-primary/90 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 animate-pulse shadow-lg">
              <Zap size={14} className="animate-bounce" />
              Thinking...
            </div>
          )}
        </div>

        <div className="flex justify-between items-center glass p-6 rounded-3xl border border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center font-bold text-xl">U</div>
            <div>
              <p className="font-bold text-lg">You</p>
              <p className="text-xs text-foreground/40 font-medium">White Pieces</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-foreground/30 uppercase mb-1">Status</p>
            <p className="font-bold text-green-500">Your Turn</p>
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
                  ? (game.turn() === "w" ? "Computer Wins" : "You Won!") 
                  : "Good game!"}
              </p>
              <button 
                onClick={resetGame} 
                className="w-full py-5 bg-primary text-white rounded-3xl font-black text-xl shadow-xl shadow-primary/30 hover:scale-105 transition-transform"
              >
                Rematch
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
