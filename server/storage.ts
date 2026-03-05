import { db } from "./db";
import {
  generations,
  type Generation,
  type InsertGeneration,
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getGenerations(): Promise<Generation[]>;
  getGeneration(id: number): Promise<Generation | undefined>;
  createGeneration(generation: InsertGeneration): Promise<Generation>;
  deleteGeneration(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getGenerations(): Promise<Generation[]> {
    return await db.select().from(generations).orderBy(desc(generations.createdAt));
  }

  async getGeneration(id: number): Promise<Generation | undefined> {
    const [generation] = await db.select().from(generations).where(eq(generations.id, id));
    return generation;
  }

  async createGeneration(generation: InsertGeneration): Promise<Generation> {
    const [created] = await db.insert(generations).values(generation).returning();
    return created;
  }

  async deleteGeneration(id: number): Promise<void> {
    await db.delete(generations).where(eq(generations.id, id));
  }
}

export const storage = new DatabaseStorage();
