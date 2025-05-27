import { useEffect } from "react";
import { Copy, RotateCcw, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/use-websocket";
import { apiRequest } from "@/lib/queryClient";
import GameBoard from "./game-board";
import { type Game, type WebSocketMessage } from "@shared/schema";

interface GameRoomProps {
  game: Game;
  playerId: string;
  onGameUpdate: (game: Game) => void;
  onGameFinished: (game: Game) => void;
  onLeaveGame: () => void;
}

export default function GameRoom({ 
  game, 
  playerId, 
  onGameUpdate, 
  onGameFinished, 
  onLeaveGame 
}: GameRoomProps) {
  const { toast } = useToast();
  
  const handleWebSocketMessage = (message: WebSocketMessage) => {
    if (message.type === "gameState") {
      onGameUpdate(message.game);
      if (message.game.status === "finished") {
        onGameFinished(message.game);
      }
    } else if (message.type === "error") {
      toast({
        title: "Error",
        description: message.message,
        variant: "destructive",
      });
    }
  };

  const { sendMessage } = useWebSocket(handleWebSocketMessage);

  useEffect(() => {
    // Connect to the game room
    apiRequest("POST", `/api/games/${game.code}/connect`);
  }, [game.code]);

  const handleCopyGameCode = async () => {
    try {
      await navigator.clipboard.writeText(game.code);
      toast({
        title: "Copied!",
        description: "Game code copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy game code",
        variant: "destructive",
      });
    }
  };

  const handleMove = (position: number) => {
    const playerSymbol = game.player1 === playerId ? 'X' : 'O';
    sendMessage({
      type: "move",
      position,
      player: playerSymbol,
      gameCode: game.code
    });
  };

  const handleResetGame = async () => {
    try {
      await apiRequest("POST", `/api/games/${game.code}/reset`);
      toast({
        title: "Game Reset",
        description: "Starting a new round",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reset game",
        variant: "destructive",
      });
    }
  };

  const currentPlayerSymbol = game.currentPlayer;
  const isMyTurn = (game.player1 === playerId && currentPlayerSymbol === 'X') || 
                   (game.player2 === playerId && currentPlayerSymbol === 'O');
  const mySymbol = game.player1 === playerId ? 'X' : 'O';
  const opponentSymbol = mySymbol === 'X' ? 'O' : 'X';

  return (
    <div className="game-room">
      {/* Game Status Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100 dark:border-gray-700 mb-4 sm:mb-6 mobile-padding">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          {/* Game Code Display */}
          <div className="flex items-center justify-center sm:justify-start space-x-2 sm:space-x-3">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-3 sm:px-4 py-2">
              <div className="text-xs text-game-muted dark:text-gray-300 font-medium mb-1">GAME CODE</div>
              <div className="font-mono text-base sm:text-lg font-bold text-game-dark dark:text-white tracking-wider">{game.code}</div>
            </div>
            <Button 
              variant="outline"
              size="icon"
              onClick={handleCopyGameCode}
              className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg"
              title="Copy game code"
            >
              <Copy className="text-game-muted dark:text-gray-300 w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </div>
          
          {/* Current Turn Indicator */}
          <div className="flex items-center justify-center space-x-3 sm:space-x-4">
            <div className="text-center">
              <div className="text-xs sm:text-sm text-game-muted dark:text-gray-300 font-medium mb-1">CURRENT TURN</div>
              <div className="flex items-center justify-center space-x-2">
                <span className={`w-6 h-6 sm:w-8 sm:h-8 ${currentPlayerSymbol === 'X' ? 'bg-game-primary' : 'bg-game-secondary'} text-white rounded-lg flex items-center justify-center font-bold text-sm sm:text-lg`}>
                  {currentPlayerSymbol}
                </span>
                <span className="font-semibold text-game-dark dark:text-white text-sm sm:text-base">
                  {isMyTurn ? "Your Turn" : "Opponent's Turn"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Players Section */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8 mobile-padding">
        {/* Player 1 (X) */}
        <div className={`bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 shadow-lg border-2 ${mySymbol === 'X' ? 'border-game-primary' : 'border-transparent'}`}>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-game-primary text-white rounded-xl flex items-center justify-center font-bold text-sm sm:text-xl">X</div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-game-dark dark:text-white text-sm sm:text-base truncate">Player 1</div>
              <div className="text-xs sm:text-sm text-game-muted dark:text-gray-300">{game.player1 === playerId ? "You" : "Opponent"}</div>
            </div>
          </div>
        </div>
        
        {/* Player 2 (O) */}
        <div className={`bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 shadow-lg border-2 ${mySymbol === 'O' ? 'border-game-secondary' : 'border-transparent'}`}>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-game-secondary text-white rounded-xl flex items-center justify-center font-bold text-sm sm:text-xl">O</div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-game-dark dark:text-white text-sm sm:text-base truncate">Player 2</div>
              <div className="text-xs sm:text-sm text-game-muted dark:text-gray-300">{game.player2 === playerId ? "You" : "Opponent"}</div>
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
          className="flex-1 bg-gray-100 hover:bg-gray-200 text-game-dark font-medium py-3 px-6 rounded-xl transition-colors"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          New Game
        </Button>
        <Button 
          variant="destructive"
          onClick={onLeaveGame}
          className="flex-1 bg-game-error hover:bg-red-600 text-white font-medium py-3 px-6 rounded-xl transition-colors"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Leave Game
        </Button>
      </div>
    </div>
  );
}
