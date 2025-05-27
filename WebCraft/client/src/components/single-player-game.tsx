import { useState, useEffect, useCallback } from "react";
import { RotateCcw, Home, Bot, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import GameBoard from "./game-board";

interface SinglePlayerGameProps {
  playerId: string;
  onGameFinished: (game: any) => void;
  onBackToLobby: () => void;
  onPlayAgain: () => void;
}

// Local game state for single player
interface LocalGame {
  id: number;
  code: string;
  board: string;
  currentPlayer: string;
  player1: string;
  player2: string;
  winner: string | null;
  status: string;
  playerXMoves: string;
  playerOMoves: string;
  createdAt: Date | null;
}

export default function SinglePlayerGame({ playerId, onGameFinished, onBackToLobby, onPlayAgain }: SinglePlayerGameProps) {
  const { toast } = useToast();
  
  // Initialize local game state
  const [game, setGame] = useState<LocalGame>({
    id: 1,
    code: "SINGLE",
    board: '["","","","","","","","",""]',
    currentPlayer: "X",
    player1: playerId,
    player2: "COMPUTER",
    winner: null,
    status: "playing",
    playerXMoves: "[]",
    playerOMoves: "[]",
    createdAt: new Date()
  });

  const [isGameFinished, setIsGameFinished] = useState(false);

  // AI Logic
  const makeComputerMove = useCallback((currentGame: LocalGame) => {
    const board = JSON.parse(currentGame.board) as string[];
    const computerMoves = JSON.parse(currentGame.playerOMoves) as number[];
    
    // Find available positions
    const availablePositions = board.map((cell, index) => cell === "" ? index : -1).filter(index => index !== -1);
    
    if (availablePositions.length === 0) return;

    // AI Strategy:
    // 1. Try to win
    // 2. Block player from winning
    // 3. Take center or corner
    // 4. Take any available spot
    
    const checkWinningMove = (player: string) => {
      const lines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
        [0, 4, 8], [2, 4, 6] // diagonals
      ];
      
      for (const line of lines) {
        const [a, b, c] = line;
        const lineValues = [board[a], board[b], board[c]];
        const playerCount = lineValues.filter(cell => cell === player).length;
        const emptyCount = lineValues.filter(cell => cell === "").length;
        
        if (playerCount === 2 && emptyCount === 1) {
          const emptyIndex = line.find(i => board[i] === "");
          if (emptyIndex !== undefined && availablePositions.includes(emptyIndex)) {
            return emptyIndex;
          }
        }
      }
      return null;
    };

    // 1. Try to win
    let movePosition = checkWinningMove("O");
    
    // 2. Block player from winning
    if (movePosition === null) {
      movePosition = checkWinningMove("X");
    }
    
    // 3. Take center if available
    if (movePosition === null && availablePositions.includes(4)) {
      movePosition = 4;
    }
    
    // 4. Take corner
    if (movePosition === null) {
      const corners = [0, 2, 6, 8].filter(pos => availablePositions.includes(pos));
      if (corners.length > 0) {
        movePosition = corners[Math.floor(Math.random() * corners.length)];
      }
    }
    
    // 5. Take any available position
    if (movePosition === null) {
      movePosition = availablePositions[Math.floor(Math.random() * availablePositions.length)];
    }

    // Make the move
    const newBoard = [...board];
    const newComputerMoves = [...computerMoves, movePosition];
    
    // Handle disappearing moves (max 3 marks)
    if (newComputerMoves.length > 3) {
      const removedPosition = newComputerMoves.shift()!;
      newBoard[removedPosition] = "";
    }
    
    newBoard[movePosition] = "O";

    // Check for winner
    const checkWinner = (board: string[]): string | null => {
      const lines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
        [0, 4, 8], [2, 4, 6] // diagonals
      ];

      for (const [a, b, c] of lines) {
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
          return board[a];
        }
      }
      return null;
    };

    const winner = checkWinner(newBoard);
    const newStatus = winner ? "finished" : "playing";

    const updatedGame: LocalGame = {
      ...currentGame,
      board: JSON.stringify(newBoard),
      currentPlayer: "X",
      playerOMoves: JSON.stringify(newComputerMoves),
      winner,
      status: newStatus
    };

    setGame(updatedGame);

    if (winner) {
      setIsGameFinished(true);
      setTimeout(() => onGameFinished(updatedGame), 1000);
    }
  }, [onGameFinished]);

  // Handle player move
  const handleMove = (position: number) => {
    if (game.currentPlayer !== "X" || game.status !== "playing") return;

    const board = JSON.parse(game.board) as string[];
    const playerXMoves = JSON.parse(game.playerXMoves) as number[];
    
    if (board[position] !== "") return;

    const newBoard = [...board];
    const newPlayerMoves = [...playerXMoves, position];
    
    // Handle disappearing moves (max 3 marks)
    if (newPlayerMoves.length > 3) {
      const removedPosition = newPlayerMoves.shift()!;
      newBoard[removedPosition] = "";
    }
    
    newBoard[position] = "X";

    // Check for winner
    const checkWinner = (board: string[]): string | null => {
      const lines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
        [0, 4, 8], [2, 4, 6] // diagonals
      ];

      for (const [a, b, c] of lines) {
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
          return board[a];
        }
      }
      return null;
    };

    const winner = checkWinner(newBoard);
    const newStatus = winner ? "finished" : "playing";

    const updatedGame: LocalGame = {
      ...game,
      board: JSON.stringify(newBoard),
      currentPlayer: winner ? "X" : "O",
      playerXMoves: JSON.stringify(newPlayerMoves),
      winner,
      status: newStatus
    };

    setGame(updatedGame);

    if (winner) {
      setIsGameFinished(true);
      setTimeout(() => onGameFinished(updatedGame), 1000);
    } else {
      // Computer's turn
      setTimeout(() => makeComputerMove(updatedGame), 800);
    }
  };

  const handleResetGame = () => {
    const newGame: LocalGame = {
      id: 1,
      code: "SINGLE",
      board: '["","","","","","","","",""]',
      currentPlayer: "X",
      player1: playerId,
      player2: "COMPUTER",
      winner: null,
      status: "playing",
      playerXMoves: "[]",
      playerOMoves: "[]",
      createdAt: new Date()
    };
    setGame(newGame);
    setIsGameFinished(false);
    
    toast({
      title: "New Game Started",
      description: "Good luck against the computer!",
    });
  };

  const handlePlayAgainClick = () => {
    // Reset the game and stay in single player mode
    handleResetGame();
    onPlayAgain();
  };

  const isMyTurn = game.currentPlayer === "X" && !isGameFinished;

  // Single Player Result Modal Component
  const SinglePlayerResultModal = () => {
    const didIWin = game.winner === "X";
    const isDraw = game.winner === "draw";

    const getResultInfo = () => {
      if (isDraw) {
        return {
          title: "It's a Draw!",
          description: "Great game! Nobody wins this time.",
          icon: <Users className="text-white text-3xl" />,
          bgColor: "bg-gradient-to-br from-game-muted to-gray-600"
        };
      } else if (didIWin) {
        return {
          title: "You Win!",
          description: "Congratulations! You beat the computer!",
          icon: <Trophy className="text-white text-3xl" />,
          bgColor: "bg-gradient-to-br from-game-accent to-green-600"
        };
      } else {
        return {
          title: "You Lose",
          description: "The computer won this time!",
          icon: <Trophy className="text-white text-3xl opacity-50" />,
          bgColor: "bg-gradient-to-br from-game-error to-red-600"
        };
      }
    };

    const resultInfo = getResultInfo();

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 sm:p-8 max-w-sm sm:max-w-md w-full shadow-2xl transform scale-100 transition-transform mobile-padding">
          <div className="text-center">
            <div className={`w-16 h-16 sm:w-20 sm:h-20 ${resultInfo.bgColor} rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6`}>
              {resultInfo.icon}
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-game-dark dark:text-white mb-2 sm:mb-3">{resultInfo.title}</h2>
            <p className="text-game-muted dark:text-gray-300 text-base sm:text-lg mb-6 sm:mb-8">{resultInfo.description}</p>
            
            <div className="flex flex-col gap-3">
              <Button 
                onClick={handlePlayAgainClick}
                className="w-full bg-game-primary hover:bg-indigo-600 text-white font-medium py-3 px-6 rounded-xl transition-colors text-base"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Play Again
              </Button>
              <Button 
                variant="outline"
                onClick={onBackToLobby}
                className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-game-dark dark:text-white font-medium py-3 px-6 rounded-xl transition-colors text-base"
              >
                <Home className="w-4 h-4 mr-2" />
                Back to Lobby
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="single-player-game">
      {/* Game Status Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100 dark:border-gray-700 mb-4 sm:mb-6 mobile-padding">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          {/* Game Mode Display */}
          <div className="flex items-center justify-center sm:justify-start space-x-2 sm:space-x-3">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-3 sm:px-4 py-2">
              <div className="text-xs text-game-muted dark:text-gray-300 font-medium mb-1">SINGLE PLAYER</div>
              <div className="font-mono text-base sm:text-lg font-bold text-game-dark dark:text-white tracking-wider">VS COMPUTER</div>
            </div>
            <Bot className="text-game-accent w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          
          {/* Current Turn Indicator */}
          <div className="flex items-center justify-center space-x-3 sm:space-x-4">
            <div className="text-center">
              <div className="text-xs sm:text-sm text-game-muted dark:text-gray-300 font-medium mb-1">CURRENT TURN</div>
              <div className="flex items-center justify-center space-x-2">
                <span className={`w-6 h-6 sm:w-8 sm:h-8 ${game.currentPlayer === 'X' ? 'bg-game-primary' : 'bg-game-secondary'} text-white rounded-lg flex items-center justify-center font-bold text-sm sm:text-lg`}>
                  {game.currentPlayer}
                </span>
                <span className="font-semibold text-game-dark dark:text-white text-sm sm:text-base">
                  {isMyTurn ? "Your Turn" : "Computer's Turn"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Players Section */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8 mobile-padding">
        {/* Player (X) */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 shadow-lg border-2 border-game-primary">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-game-primary text-white rounded-xl flex items-center justify-center font-bold text-sm sm:text-xl">X</div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-game-dark dark:text-white text-sm sm:text-base truncate">You</div>
              <div className="text-xs sm:text-sm text-game-muted dark:text-gray-300">Player</div>
            </div>
          </div>
        </div>
        
        {/* Computer (O) */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 shadow-lg border-2 border-game-secondary">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-game-secondary text-white rounded-xl flex items-center justify-center font-bold text-sm sm:text-xl">O</div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-game-dark dark:text-white text-sm sm:text-base truncate">Computer</div>
              <div className="text-xs sm:text-sm text-game-muted dark:text-gray-300">AI</div>
            </div>
          </div>
        </div>
      </div>

      {/* Game Board */}
      <GameBoard 
        game={game}
        onMove={handleMove}
        disabled={!isMyTurn || game.status !== 'playing'}
        playerId={playerId}
      />

      {/* Game Actions */}
      <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto mt-8">
        <Button 
          variant="outline"
          onClick={handleResetGame}
          className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-game-dark dark:text-white font-medium py-3 px-6 rounded-xl transition-colors"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          New Game
        </Button>
        <Button 
          variant="destructive"
          onClick={onBackToLobby}
          className="flex-1 bg-game-error hover:bg-red-600 text-white font-medium py-3 px-6 rounded-xl transition-colors"
        >
          <Home className="w-4 h-4 mr-2" />
          Back to Lobby
        </Button>
      </div>
    </div>
  );
}