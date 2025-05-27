import { Trophy, Users, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type Game } from "@shared/schema";

interface ResultModalProps {
  game: Game;
  playerId: string;
  onPlayAgain: () => void;
  onBackToLobby: () => void;
}

export default function ResultModal({ game, playerId, onPlayAgain, onBackToLobby }: ResultModalProps) {
  const mySymbol = game.player1 === playerId ? 'X' : 'O';
  const didIWin = game.winner === mySymbol;
  const isDraw = game.winner === 'draw';

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
        description: "Congratulations on your victory!",
        icon: <Trophy className="text-white text-3xl" />,
        bgColor: "bg-gradient-to-br from-game-accent to-green-600"
      };
    } else {
      return {
        title: "You Lose",
        description: "Better luck next time!",
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
              onClick={onPlayAgain}
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
}
