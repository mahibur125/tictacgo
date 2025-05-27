import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  board: text("board").notNull().default('["","","","","","","","",""]'),
  currentPlayer: text("current_player").notNull().default("X"),
  player1: text("player1"),
  player2: text("player2"),
  winner: text("winner"),
  status: text("status").notNull().default("waiting"), // waiting, playing, finished
  playerXMoves: text("player_x_moves").notNull().default("[]"), // Array of move positions for X
  playerOMoves: text("player_o_moves").notNull().default("[]"), // Array of move positions for O
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertGameSchema = createInsertSchema(games).omit({
  id: true,
  createdAt: true,
});

export type InsertGame = z.infer<typeof insertGameSchema>;
export type Game = typeof games.$inferSelect;

// WebSocket message types
export interface GameMove {
  type: "move";
  position: number;
  player: string;
  gameCode: string;
}

export interface GameState {
  type: "gameState";
  game: Game;
}

export interface PlayerJoined {
  type: "playerJoined";
  player: string;
  gameCode: string;
}

export interface GameError {
  type: "error";
  message: string;
}

export type WebSocketMessage = GameMove | GameState | PlayerJoined | GameError;
