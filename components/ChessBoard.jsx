"use client";
import { useState, useEffect, useCallback } from "react";
import { Chess } from "chess.js";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { toast } from "sonner";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const PIECES = {
  p: "♟", r: "♜", n: "♞", b: "♝", q: "♛", k: "♚",
  P: "♙", R: "♖", N: "♘", B: "♗", Q: "♕", K: "♔",
};

export default function ChessBoard({ game, onMove, playerColor = null, isDraggable = true }) {
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [validMoves, setValidMoves] = useState([]);

  const board = game.board();
  
  const displayBoard = playerColor === "b" 
    ? [...board].reverse().map(row => [...row].reverse())
    : board;

  const handleSquareClick = (square) => {
    if (!isDraggable) return;

    // If a square is already selected, try to move
    if (selectedSquare) {
      if (selectedSquare === square) {
        setSelectedSquare(null);
        setValidMoves([]);
        return;
      }

      const move = game.moves({ square: selectedSquare, verbose: true }).find(m => m.to === square);
      
      if (move) {
        onMove(move);
        setSelectedSquare(null);
        setValidMoves([]);
      } else {
        // If clicking on an empty square or opponent piece while something is selected
        const piece = game.get(square);
        if (piece && piece.color === game.turn() && (piece.color === playerColor || playerColor === null)) {
          setSelectedSquare(square);
          setValidMoves(game.moves({ square, verbose: true }).map(m => m.to));
        } else {
          if (selectedSquare) {
             toast.error("Invalid move!", {
               description: "That piece cannot move there.",
               position: "bottom-center"
             });
          }
          setSelectedSquare(null);
          setValidMoves([]);
        }
      }
    } else {
      // Select a piece
      const piece = game.get(square);
      if (piece) {
        if (piece.color !== playerColor && playerColor !== null) {
          toast.error("Not your piece!", {
            description: "You can only control your own pieces.",
            position: "bottom-center"
          });
          return;
        }

        if (piece.color === game.turn()) {
          setSelectedSquare(square);
          setValidMoves(game.moves({ square, verbose: true }).map(m => m.to));
        } else {
          toast.warning("Not your turn!", {
            description: `It is currently ${game.turn() === 'w' ? 'White' : 'Black'}'s turn.`,
            position: "bottom-center"
          });
        }
      }
    }
  };

  const getSquareName = (actualRow, actualCol) => {
    const files = "abcdefgh";
    return `${files[actualCol]}${8 - actualRow}`;
  };

  return (
    <div 
      className="grid grid-cols-8 shrink-0 w-full max-w-[min(90vw,60vh,800px)] aspect-square rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border-8 border-slate-800"
      style={{ gridTemplateRows: "repeat(8, 1fr)" }}
    >
      {displayBoard.map((row, rowIndex) => (
        row.map((cell, colIndex) => {
          const actualRow = playerColor === "b" ? 7 - rowIndex : rowIndex;
          const actualCol = playerColor === "b" ? 7 - colIndex : colIndex;
          const square = getSquareName(actualRow, actualCol);
          const isDark = (actualRow + actualCol) % 2 === 1;
          const isSelected = selectedSquare === square;
          const isValidTarget = validMoves.includes(square);
          const piece = cell;

          return (
            <div
              key={square}
              onClick={() => handleSquareClick(square)}
              className={cn(
                "relative flex aspect-square items-center justify-center text-4xl md:text-5xl cursor-pointer select-none transition-all duration-300",
                isDark ? "bg-[#334155]" : "bg-[#94a3b8]",
                isSelected && "bg-primary/60 shadow-inner ring-4 ring-primary/20",
                isValidTarget && "after:content-[''] after:w-5 after:h-5 after:bg-accent/60 after:rounded-full after:absolute z-20 after:shadow-[0_0_15px_rgba(248,201,77,0.5)]"
              )}
            >
              {piece && (
                <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                  <motion.span
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={cn(
                      "drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]",
                      piece.color === "w" ? "text-amber-50" : "text-slate-900 drop-shadow-[0_0_10px_rgba(157,80,187,0.5)]"
                    )}
                    style={{ 
                      filter: piece.color === 'w' 
                        ? 'drop-shadow(0 0 2px #fff) drop-shadow(0 0 10px rgba(255,255,255,0.5))' 
                        : 'drop-shadow(0 0 2px #9d50bb) drop-shadow(0 0 10px rgba(157,80,187,0.5))'
                    }}
                  >
                    {PIECES[piece.color === "w" ? piece.type.toUpperCase() : piece.type.toLowerCase()]}
                  </motion.span>
                </div>
              )}
              
              {/* Coordinates for edge squares */}
              {colIndex === 0 && (
                <span className="absolute top-1 left-1 text-[12px] text-white/50 font-black">
                  {8 - actualRow}
                </span>
              )}
              {rowIndex === 7 && (
                <span className="absolute bottom-1 right-1 text-[12px] text-white/50 font-black uppercase">
                  {"abcdefgh"[actualCol]}
                </span>
              )}
            </div>
          );
        })
      ))}
    </div>
  );
}
