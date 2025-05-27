import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { type Game } from "@shared/schema";

interface GameBoardProps {
  game: Game;
  onMove: (position: number) => void;
  disabled: boolean;
  playerId: string;
}

export default function GameBoard({ game, onMove, disabled, playerId }: GameBoardProps) {
  const board = JSON.parse(game.board) as string[];
  const playerXMoves = JSON.parse(game.playerXMoves || "[]") as number[];
  const playerOMoves = JSON.parse(game.playerOMoves || "[]") as number[];
  
  const [fadeOutPositions, setFadeOutPositions] = useState<Set<number>>(new Set());
  const [newMovePosition, setNewMovePosition] = useState<number | null>(null);

  // Determine current player's symbol and moves
  const mySymbol = game.player1 === playerId ? 'X' : 'O';
  const isMyTurn = game.currentPlayer === mySymbol;
  const myMoves = mySymbol === 'X' ? playerXMoves : playerOMoves;
  
  // Find oldest move that will blink if this player has 3 moves and it's their turn
  const shouldBlinkOldest = isMyTurn && myMoves.length === 3;
  const oldestMovePosition = shouldBlinkOldest ? myMoves[0] : null;

  const handleCellClick = (position: number) => {
    if (disabled || board[position] !== "") return;
    
    // If this will be the 4th move, show fade out animation for oldest move
    if (myMoves.length === 3) {
      setFadeOutPositions(new Set([myMoves[0]]));
      setTimeout(() => {
        setFadeOutPositions(new Set());
        setNewMovePosition(position);
        onMove(position);
        setTimeout(() => setNewMovePosition(null), 300);
      }, 500);
    } else {
      setNewMovePosition(position);
      onMove(position);
      setTimeout(() => setNewMovePosition(null), 300);
    }
  };

  // Clear animations when game state changes significantly
  useEffect(() => {
    setFadeOutPositions(new Set());
    setNewMovePosition(null);
  }, [game.winner, game.status]);

  const getCellClasses = (position: number, cell: string) => {
    let classes = "game-cell w-20 h-20 bg-gray-50 hover:bg-gray-100 rounded-xl border-2 border-gray-200 flex items-center justify-center text-3xl font-bold transition-all duration-200 hover:scale-105 hover:shadow-md disabled:opacity-50 disabled:hover:scale-100";
    
    // Add blinking animation for oldest move
    if (oldestMovePosition === position && cell !== "") {
      classes += " blink-warning";
    }
    
    // Add fade out animation
    if (fadeOutPositions.has(position)) {
      classes += " fade-out";
    }
    
    // Add scale in animation for new moves
    if (newMovePosition === position) {
      classes += " scale-in";
    }
    
    return classes;
  };

  return (
    <div className="max-w-md mx-auto mb-8">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-700 game-board-mobile">
        <div className="grid grid-cols-3 gap-3">
          {board.map((cell, index) => (
            <Button
              key={index}
              variant="outline"
              onClick={() => handleCellClick(index)}
              disabled={disabled || cell !== ""}
              className={getCellClasses(index, cell)}
            >
              <span className={`${cell === 'X' ? 'text-game-primary' : 'text-game-secondary'} transition-all duration-200`}>
                {cell}
              </span>
            </Button>
          ))}
        </div>
        
        {/* Game Rules Hint - Mobile Friendly */}
        <div className="mt-4 text-center">
          <p className="text-xs text-game-muted mobile-padding">
            Max 3 marks per player • Oldest mark disappears on 4th move
          </p>
        </div>
      </div>
    </div>
  );
}
