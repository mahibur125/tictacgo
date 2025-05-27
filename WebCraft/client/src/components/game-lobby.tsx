import { useState } from "react";
import { Plus, LogIn, Bot } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { type Game } from "@shared/schema";

interface GameLobbyProps {
  onGameCreated: (game: Game) => void;
  onGameJoined: (game: Game) => void;
  onPlayVsComputer: () => void;
  playerId: string;
}

export default function GameLobby({ onGameCreated, onGameJoined, onPlayVsComputer, playerId }: GameLobbyProps) {
  const [gameCode, setGameCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const { toast } = useToast();

  const handleCreateGame = async () => {
    setIsCreating(true);
    try {
      const response = await apiRequest("POST", "/api/games");
      const game = await response.json();
      
      // Join the game as player 1
      await apiRequest("POST", `/api/games/${game.code}/join`, { playerId });
      
      onGameCreated(game);
      toast({
        title: "Game Created!",
        description: `Share code ${game.code} with your friend`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create game. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinGame = async () => {
    if (!gameCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a game code",
        variant: "destructive",
      });
      return;
    }

    setIsJoining(true);
    try {
      const response = await apiRequest("POST", `/api/games/${gameCode.toUpperCase()}/join`, { playerId });
      const game = await response.json();
      
      onGameJoined(game);
      toast({
        title: "Joined Game!",
        description: `Successfully joined game ${game.code}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to join game. Check the code and try again.",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };

  const handleGameCodeChange = (value: string) => {
    setGameCode(value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6));
  };

  return (
    <div className="game-lobby mb-8">
      <div className="text-center mb-6 sm:mb-8 mobile-padding">
        <h2 className="text-2xl sm:text-3xl font-bold text-game-dark dark:text-white mb-2 sm:mb-3">Ready to Play Tic-Tac-Go?</h2>
        <p className="text-game-muted dark:text-gray-300 text-base sm:text-lg">Create a new game or join an existing one with a game code</p>
      </div>
      
      <div className="grid gap-4 sm:gap-6 max-w-3xl mx-auto mobile-padding">
        {/* Play vs Computer Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow">
          <div className="text-center mb-4 sm:mb-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-game-accent to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Bot className="text-white text-xl sm:text-2xl" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-game-dark dark:text-white mb-1 sm:mb-2">Play vs Computer</h3>
            <p className="text-game-muted dark:text-gray-300 text-sm sm:text-base">Test your skills against AI</p>
          </div>
          <Button 
            onClick={onPlayVsComputer}
            className="w-full bg-game-accent hover:bg-green-600 text-white font-medium py-3 px-4 rounded-xl transition-colors text-sm sm:text-base"
          >
            Start Single Player
          </Button>
        </div>
        
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        {/* Create Game Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow">
          <div className="text-center mb-4 sm:mb-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-game-primary to-game-secondary rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Plus className="text-white text-xl sm:text-2xl" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-game-dark dark:text-white mb-1 sm:mb-2">Create Game</h3>
            <p className="text-game-muted dark:text-gray-300 text-sm sm:text-base">Start a new game and invite a friend</p>
          </div>
          <Button 
            onClick={handleCreateGame}
            disabled={isCreating}
            className="w-full bg-game-primary hover:bg-indigo-600 text-white font-medium py-3 px-4 rounded-xl transition-colors text-sm sm:text-base"
          >
            {isCreating ? "Creating..." : "Create New Game"}
          </Button>
        </div>
        
        {/* Join Game Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow">
          <div className="text-center mb-4 sm:mb-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-game-secondary to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <LogIn className="text-white text-xl sm:text-2xl" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-game-dark dark:text-white mb-1 sm:mb-2">Join Game</h3>
            <p className="text-game-muted dark:text-gray-300 text-sm sm:text-base">Enter a game code to join</p>
          </div>
          <div className="space-y-3">
            <Input 
              type="text" 
              placeholder="Enter game code..." 
              value={gameCode}
              onChange={(e) => handleGameCodeChange(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-game-primary focus:border-transparent text-center font-mono text-base sm:text-lg tracking-wider bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <Button 
              onClick={handleJoinGame}
              disabled={isJoining}
              className="w-full bg-game-secondary hover:bg-purple-600 text-white font-medium py-3 px-4 rounded-xl transition-colors text-sm sm:text-base"
            >
              {isJoining ? "Joining..." : "Join Game"}
            </Button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
