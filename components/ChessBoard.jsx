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

export default function ChessBoard({ game, onMove, playerColor = "w", isDraggable = true }) {
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [validMoves, setValidMoves] = useState([]);

  const board = game.board();

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
        if (piece && piece.color === game.turn()) {
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

  const getSquareName = (row, col) => {
    const files = "abcdefgh";
    return `${files[col]}${8 - row}`;
  };

  return (
    <div className="grid grid-cols-8 w-full max-w-[600px] aspect-square rounded-xl overflow-hidden shadow-2xl border-4 border-border/50">
      {board.map((row, rowIndex) => (
        row.map((cell, colIndex) => {
          const square = getSquareName(rowIndex, colIndex);
          const isDark = (rowIndex + colIndex) % 2 === 1;
          const isSelected = selectedSquare === square;
          const isValidTarget = validMoves.includes(square);
          const piece = cell;

          return (
            <div
              key={square}
              onClick={() => handleSquareClick(square)}
              className={cn(
                "relative flex items-center justify-center text-4xl cursor-pointer select-none transition-colors duration-200",
                isDark ? "bg-[#2d2d2d]" : "bg-[#3d3d3d]",
                isSelected && "bg-primary/40",
                isValidTarget && "after:content-[''] after:w-4 after:h-4 after:bg-accent/40 after:rounded-full after:absolute"
              )}
            >
              {piece && (
                <motion.span
                  layoutId={square}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={cn(
                    "z-10",
                    piece.color === "w" ? "text-white drop-shadow-md" : "text-gray-400 drop-shadow-md"
                  )}
                >
                  {PIECES[piece.color === "w" ? piece.type.toUpperCase() : piece.type.toLowerCase()]}
                </motion.span>
              )}
              
              {/* Coordinates for edge squares */}
              {colIndex === 0 && (
                <span className="absolute top-1 left-1 text-[10px] text-foreground/30 font-bold">
                  {8 - rowIndex}
                </span>
              )}
              {rowIndex === 7 && (
                <span className="absolute bottom-1 right-1 text-[10px] text-foreground/30 font-bold uppercase">
                  {"abcdefgh"[colIndex]}
                </span>
              )}
            </div>
          );
        })
      ))}
    </div>
  );
}
