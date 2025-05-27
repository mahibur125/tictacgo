import { useState } from "react";
import { Hash, Volume2, Settings } from "lucide-react";
import GameLobby from "@/components/game-lobby";
import GameRoom from "@/components/game-room";
import WaitingModal from "@/components/waiting-modal";
import ResultModal from "@/components/result-modal";
import SinglePlayerGame from "@/components/single-player-game";
import { type Game } from "@shared/schema";

export default function GamePage() {
  const [gameState, setGameState] = useState<"lobby" | "waiting" | "playing" | "finished" | "singleplayer">("lobby");
  const [currentGame, setCurrentGame] = useState<Game | null>(null);
  const [playerId] = useState(() => `player_${Math.random().toString(36).substring(2, 9)}`);

  const handleGameCreated = (game: Game) => {
    setCurrentGame(game);
    setGameState("waiting");
  };

  const handleGameJoined = (game: Game) => {
    setCurrentGame(game);
    if (game.status === "playing") {
      setGameState("playing");
    } else {
      setGameState("waiting");
    }
  };

  const handleGameStarted = (game: Game) => {
    setCurrentGame(game);
    setGameState("playing");
  };

  const handleGameFinished = (game: Game) => {
    setCurrentGame(game);
    setGameState("finished");
  };

  const handleBackToLobby = () => {
    setCurrentGame(null);
    setGameState("lobby");
  };

  const handlePlayAgain = () => {
    if (gameState === "finished" && currentGame) {
      // Return to the same game mode that was being played
      setGameState("playing");
    }
  };

  const handlePlayAgainSinglePlayer = () => {
    // Stay in single player mode and reset
    setGameState("singleplayer");
  };

  const handlePlayVsComputer = () => {
    setGameState("singleplayer");
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 px-3 sm:px-4 py-3 sm:py-4 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-game-primary to-game-secondary rounded-xl flex items-center justify-center">
              <Hash className="text-white text-base sm:text-lg" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-game-dark dark:text-white">Tic-Tac-Go</h1>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg flex items-center justify-center transition-colors">
              <Volume2 className="text-game-muted dark:text-gray-300 w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg flex items-center justify-center transition-colors">
              <Settings className="text-game-muted dark:text-gray-300 w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {gameState === "lobby" && (
            <GameLobby 
              onGameCreated={handleGameCreated}
              onGameJoined={handleGameJoined}
              onPlayVsComputer={handlePlayVsComputer}
              playerId={playerId}
            />
          )}
          
          {gameState === "singleplayer" && (
            <SinglePlayerGame 
              playerId={playerId}
              onGameFinished={handleGameFinished}
              onBackToLobby={handleBackToLobby}
              onPlayAgain={handlePlayAgainSinglePlayer}
            />
          )}
          
          {(gameState === "playing" || gameState === "finished") && currentGame && (
            <GameRoom 
              game={currentGame}
              playerId={playerId}
              onGameUpdate={setCurrentGame}
              onGameFinished={handleGameFinished}
              onLeaveGame={handleBackToLobby}
            />
          )}
        </div>
      </main>

      {/* Modals */}
      {gameState === "waiting" && currentGame && (
        <WaitingModal
          gameCode={currentGame.code}
          onGameStarted={handleGameStarted}
          onCancel={handleBackToLobby}
          playerId={playerId}
        />
      )}

      {gameState === "finished" && currentGame && (
        <ResultModal
          game={currentGame}
          playerId={playerId}
          onPlayAgain={handlePlayAgain}
          onBackToLobby={handleBackToLobby}
        />
      )}
    </div>
  );
}
