import { games, type Game, type InsertGame } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Game methods
  createGame(game: InsertGame): Promise<Game>;
  getGameByCode(code: string): Promise<Game | undefined>;
  updateGame(code: string, updates: Partial<Game>): Promise<Game | undefined>;
  deleteGame(code: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async createGame(insertGame: InsertGame): Promise<Game> {
    const [game] = await db
      .insert(games)
      .values(insertGame)
      .returning();
    return game;
  }

  async getGameByCode(code: string): Promise<Game | undefined> {
    const [game] = await db.select().from(games).where(eq(games.code, code));
    return game || undefined;
  }

  async updateGame(code: string, updates: Partial<Game>): Promise<Game | undefined> {
    const [game] = await db
      .update(games)
      .set(updates)
      .where(eq(games.code, code))
      .returning();
    return game || undefined;
  }

  async deleteGame(code: string): Promise<void> {
    await db.delete(games).where(eq(games.code, code));
  }
}

export const storage = new DatabaseStorage();
