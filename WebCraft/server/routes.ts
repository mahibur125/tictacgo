import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { z } from "zod";
import { insertGameSchema, type WebSocketMessage, type Game } from "@shared/schema";

// Game logic utilities
function generateGameCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function checkWinner(board: string[]): string | null {
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

  // No draw condition since marks disappear - game continues until someone wins
  return null;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // WebSocket server setup
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const gameRooms = new Map<string, Set<WebSocket>>();

  // Broadcast to all clients in a game room
  function broadcastToRoom(gameCode: string, message: WebSocketMessage) {
    const room = gameRooms.get(gameCode);
    if (room) {
      const messageStr = JSON.stringify(message);
      room.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(messageStr);
        }
      });
    }
  }

  wss.on('connection', (ws) => {
    console.log('Client connected');

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString()) as WebSocketMessage;
        
        if (message.type === 'move') {
          const game = await storage.getGameByCode(message.gameCode);
          if (!game) {
            ws.send(JSON.stringify({ type: 'error', message: 'Game not found' }));
            return;
          }

          if (game.status !== 'playing') {
            ws.send(JSON.stringify({ type: 'error', message: 'Game is not active' }));
            return;
          }

          if (game.currentPlayer !== message.player) {
            ws.send(JSON.stringify({ type: 'error', message: 'Not your turn' }));
            return;
          }

          const board = JSON.parse(game.board);
          if (board[message.position] !== "") {
            ws.send(JSON.stringify({ type: 'error', message: 'Position already taken' }));
            return;
          }

          // Get current moves for this player
          const playerMoves = message.player === 'X' ? 
            JSON.parse(game.playerXMoves) : 
            JSON.parse(game.playerOMoves);

          // Add new move
          playerMoves.push(message.position);

          // If player has more than 3 moves, remove the oldest one
          let removedPosition = null;
          if (playerMoves.length > 3) {
            removedPosition = playerMoves.shift();
            board[removedPosition] = "";
          }

          // Place the new move
          board[message.position] = message.player;

          const nextPlayer = message.player === 'X' ? 'O' : 'X';
          const winner = checkWinner(board);

          let status = game.status;
          if (winner) {
            status = 'finished';
          }

          // Update moves tracking
          const updateData: any = {
            board: JSON.stringify(board),
            currentPlayer: nextPlayer,
            status
          };

          if (message.player === 'X') {
            updateData.playerXMoves = JSON.stringify(playerMoves);
          } else {
            updateData.playerOMoves = JSON.stringify(playerMoves);
          }

          if (winner) {
            updateData.winner = winner;
          }

          const updatedGame = await storage.updateGame(message.gameCode, updateData);

          if (updatedGame) {
            broadcastToRoom(message.gameCode, {
              type: 'gameState',
              game: updatedGame
            });
          }
        }
      } catch (error) {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    });

    ws.on('close', () => {
      console.log('Client disconnected');
      // Remove from all rooms
      gameRooms.forEach((room, gameCode) => {
        room.delete(ws);
        if (room.size === 0) {
          gameRooms.delete(gameCode);
        }
      });
    });
  });

  // API Routes
  app.post('/api/games', async (req, res) => {
    try {
      const code = generateGameCode();
      const gameData = {
        code,
        board: '["","","","","","","","",""]',
        currentPlayer: 'X',
        player1: null,
        player2: null,
        winner: null,
        status: 'waiting',
        playerXMoves: '[]',
        playerOMoves: '[]'
      };

      const game = await storage.createGame(gameData);
      res.json(game);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create game' });
    }
  });

  app.post('/api/games/:code/join', async (req, res) => {
    try {
      const { code } = req.params;
      const { playerId } = req.body;

      const game = await storage.getGameByCode(code);
      if (!game) {
        return res.status(404).json({ message: 'Game not found' });
      }

      if (game.status !== 'waiting') {
        return res.status(400).json({ message: 'Game is not available to join' });
      }

      let updatedGame;
      if (!game.player1) {
        updatedGame = await storage.updateGame(code, { player1: playerId });
      } else if (!game.player2) {
        updatedGame = await storage.updateGame(code, { 
          player2: playerId,
          status: 'playing'
        });
      } else {
        return res.status(400).json({ message: 'Game is full' });
      }

      if (updatedGame) {
        // Add to room
        if (!gameRooms.has(code)) {
          gameRooms.set(code, new Set());
        }

        // Broadcast updated game state
        broadcastToRoom(code, {
          type: 'gameState',
          game: updatedGame
        });

        res.json(updatedGame);
      } else {
        res.status(500).json({ message: 'Failed to join game' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Failed to join game' });
    }
  });

  app.get('/api/games/:code', async (req, res) => {
    try {
      const { code } = req.params;
      const game = await storage.getGameByCode(code);
      
      if (!game) {
        return res.status(404).json({ message: 'Game not found' });
      }

      res.json(game);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get game' });
    }
  });

  app.post('/api/games/:code/reset', async (req, res) => {
    try {
      const { code } = req.params;
      const game = await storage.getGameByCode(code);
      
      if (!game) {
        return res.status(404).json({ message: 'Game not found' });
      }

      const updatedGame = await storage.updateGame(code, {
        board: '["","","","","","","","",""]',
        currentPlayer: 'X',
        winner: null,
        status: 'playing',
        playerXMoves: '[]',
        playerOMoves: '[]'
      });

      if (updatedGame) {
        broadcastToRoom(code, {
          type: 'gameState',
          game: updatedGame
        });
        res.json(updatedGame);
      } else {
        res.status(500).json({ message: 'Failed to reset game' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Failed to reset game' });
    }
  });

  // WebSocket room joining endpoint
  app.post('/api/games/:code/connect', (req, res) => {
    const { code } = req.params;
    if (!gameRooms.has(code)) {
      gameRooms.set(code, new Set());
    }
    res.json({ success: true });
  });

  return httpServer;
}
