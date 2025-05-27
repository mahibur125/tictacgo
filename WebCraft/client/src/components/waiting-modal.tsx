import { useEffect } from "react";
import { Clock, Copy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/use-websocket";
import { apiRequest } from "@/lib/queryClient";
import { type Game, type WebSocketMessage } from "@shared/schema";

interface WaitingModalProps {
  gameCode: string;
  onGameStarted: (game: Game) => void;
  onCancel: () => void;
  playerId: string;
}

export default function WaitingModal({ gameCode, onGameStarted, onCancel, playerId }: WaitingModalProps) {
  const { toast } = useToast();

  const handleWebSocketMessage = (message: WebSocketMessage) => {
    if (message.type === "gameState") {
      if (message.game.status === "playing") {
        onGameStarted(message.game);
      }
    }
  };

  const { sendMessage } = useWebSocket(handleWebSocketMessage);

  useEffect(() => {
    // Connect to the game room
    apiRequest("POST", `/api/games/${gameCode}/connect`);
  }, [gameCode]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(gameCode);
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

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-game-primary to-game-secondary rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="text-white text-3xl animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-game-dark mb-3">Waiting for Player</h2>
          <p className="text-game-muted mb-6">Share your game code with a friend to start playing</p>
          
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="text-sm text-game-muted font-medium mb-2">GAME CODE</div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-2xl font-bold text-game-dark tracking-wider">{gameCode}</span>
              <Button 
                onClick={handleCopyCode}
                className="bg-game-primary hover:bg-indigo-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
            </div>
          </div>
          
          <Button 
            variant="outline"
            onClick={onCancel}
            className="w-full bg-gray-100 hover:bg-gray-200 text-game-dark font-medium py-3 px-6 rounded-xl transition-colors"
          >
            Cancel Game
          </Button>
        </div>
      </div>
    </div>
  );
}
