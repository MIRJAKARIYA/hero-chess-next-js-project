"use client";
import { useState, useEffect } from "react";
import { Chess } from "chess.js";
import ChessBoard from "@/components/ChessBoard";
import { motion, AnimatePresence } from "framer-motion";
import { Cpu, RefreshCw, Trophy, Zap, ChevronRight, Brain } from "lucide-react";
import { toast } from "sonner";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const PIECE_VALUES = {
  p: 10, n: 30, b: 30, r: 50, q: 90, k: 900,
};

export default function ComputerPlayPage() {
  const [game, setGame] = useState(new Chess());
  const [difficulty, setDifficulty] = useState("Easy");
  const [isThinking, setIsThinking] = useState(false);

  const [resultSaved, setResultSaved] = useState(false);

  useEffect(() => {
    if (game.turn() === "b" && !game.isGameOver()) {
      setIsThinking(true);
      setTimeout(makeComputerMove, difficulty === "Hard" ? 1000 : 600);
    }

    if (game.isGameOver() && !resultSaved) {
      saveResult();
    }
  }, [game]);

  const saveResult = async () => {
    let result = "Draw";
    if (game.isCheckmate()) {
      result = game.turn() === "b" ? "Won" : "Lost";
    }

    try {
      await fetch("/api/game/save-result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          opponentName: `Stockfish (${difficulty})`,
          result,
          type: "computer"
        }),
      });
      setResultSaved(true);
    } catch (e) {
      console.error("Failed to save computer game result", e);
    }
  };

  const evaluateBoard = (chess) => {
    let totalEvaluation = 0;
    const board = chess.board();
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 8; j++) {
        const piece = board[i][j];
        if (piece) {
          const value = PIECE_VALUES[piece.type] || 0;
          totalEvaluation += (piece.color === "w" ? -value : value);
        }
      }
    }
    return totalEvaluation;
  };

  const minimax = (chess, depth, alpha, beta, isMaximizingPlayer) => {
    if (depth === 0 || chess.isGameOver()) {
      return evaluateBoard(chess);
    }

    const moves = chess.moves();

    if (isMaximizingPlayer) {
      let bestEval = -Infinity;
      for (const move of moves) {
        chess.move(move);
        const evalScore = minimax(chess, depth - 1, alpha, beta, false);
        chess.undo();
        bestEval = Math.max(bestEval, evalScore);
        alpha = Math.max(alpha, evalScore);
        if (beta <= alpha) break;
      }
      return bestEval;
    } else {
      let bestEval = Infinity;
      for (const move of moves) {
        chess.move(move);
        const evalScore = minimax(chess, depth - 1, alpha, beta, true);
        chess.undo();
        bestEval = Math.min(bestEval, evalScore);
        beta = Math.min(beta, evalScore);
        if (beta <= alpha) break;
      }
      return bestEval;
    }
  };

  const makeComputerMove = () => {
    const moves = game.moves();
    if (moves.length === 0) return;

    let bestMove;

    if (difficulty === "Easy") {
      bestMove = moves[Math.floor(Math.random() * moves.length)];
    } else if (difficulty === "Medium") {
      const captures = moves.filter(m => m.includes("x"));
      bestMove = captures.length > 0 
        ? captures[Math.floor(Math.random() * captures.length)] 
        : moves[Math.floor(Math.random() * moves.length)];
    } else {
      // Hard Mode: Minimax Depth 2 (Depth 3 might be slow in JS without worker)
      let bestValue = -Infinity;
      const gameCopy = new Chess(game.fen());
      const shuffledMoves = [...moves].sort(() => Math.random() - 0.5);

      for (const move of shuffledMoves) {
        gameCopy.move(move);
        const boardValue = minimax(gameCopy, 2, -Infinity, Infinity, false);
        gameCopy.undo();
        if (boardValue > bestValue) {
          bestValue = boardValue;
          bestMove = move;
        }
      }
    }

    try {
      game.move(bestMove || moves[0]);
      setGame(new Chess(game.fen()));
    } catch (e) {
      console.error("AI Move failed", e);
    }
    setIsThinking(false);
  };

  const onMove = (move) => {
    if (game.turn() !== "w") return;
    try {
      const result = game.move(move);
      if (result) setGame(new Chess(game.fen()));
    } catch (e) { console.error(e); }
  };

  const resetGame = () => {
    setGame(new Chess());
    setResultSaved(false);
  };

  const handleDifficultyChange = (newDifficulty) => {
    setDifficulty(newDifficulty);
    toast.success(`Difficulty set to ${newDifficulty}`, {
      description: `The computer will now play at ${newDifficulty.toLowerCase()} level.`,
      icon: <Brain size={16} className="text-primary" />,
    });
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
          
          <div className="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/5">
            {["Easy", "Medium", "Hard"].map((level) => (
              <button
                key={level}
                onClick={() => handleDifficultyChange(level)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300",
                  difficulty === level 
                    ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105" 
                    : "text-foreground/40 hover:text-foreground hover:bg-white/5"
                )}
              >
                {level}
              </button>
            ))}
          </div>
          
          <button onClick={resetGame} className="p-3 glass rounded-xl hover:bg-white/10 transition-colors text-primary">
            <RefreshCw size={20} />
          </button>
        </div>

        <div className="relative">
          <ChessBoard game={game} onMove={onMove} playerColor="w" />
          
          <AnimatePresence>
            {isThinking && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 10 }}
                className="absolute top-4 right-4 bg-primary/90 backdrop-blur-md text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-3 shadow-2xl z-30"
              >
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" />
                </div>
                Thinking...
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex justify-between items-center glass p-6 rounded-3xl border border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center font-bold text-xl border border-white/10 shadow-lg">
              Y
            </div>
            <div>
              <p className="font-bold text-lg">You</p>
              <p className="text-xs text-foreground/40 font-medium tracking-wide">White Pieces</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-foreground/30 uppercase mb-1">Status</p>
            <p className={cn("font-bold transition-colors", game.turn() === "w" ? "text-green-500" : "text-foreground/20")}>
              {game.turn() === "w" ? "Your Turn" : "Thinking..."}
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
