/**
 * 记忆存储 — 基于文件的持久化记忆
 *
 * 提供消息存储、检索、清空功能，用于维护对话历史。
 */

import { readFile, writeFile, access } from "node:fs/promises";
import { constants } from "node:fs";

export interface Message {
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  timestamp: Date;
}

export interface MemoryEntry {
  sessionId: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export class MemoryStore {
  private entries: Map<string, MemoryEntry> = new Map();
  private readonly persistencePath: string;

  constructor(persistencePath = "memory_store.json") {
    this.persistencePath = persistencePath;
  }

  async addMessage(sessionId: string, message: Omit<Message, "timestamp">): Promise<void> {
    let entry = this.entries.get(sessionId);
    if (!entry) {
      entry = {
        sessionId,
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.entries.set(sessionId, entry);
    }

    entry.messages.push({ ...message, timestamp: new Date() });
    entry.updatedAt = new Date();
    await this.persist();
  }

  async getMessages(sessionId: string, limit?: number): Promise<Message[]> {
    const entry = this.entries.get(sessionId);
    if (!entry) return [];

    const messages = entry.messages;
    return limit ? messages.slice(-limit) : messages;
  }

  async clearSession(sessionId: string): Promise<void> {
    this.entries.delete(sessionId);
    await this.persist();
  }

  async clearAll(): Promise<void> {
    this.entries.clear();
    await this.persist();
  }

  async load(): Promise<void> {
    try {
      await access(this.persistencePath, constants.F_OK);
    } catch {
      return;
    }

    const raw = await readFile(this.persistencePath, "utf-8");
    const data = JSON.parse(raw) as Record<string, MemoryEntry>;

    for (const [key, value] of Object.entries(data)) {
      this.entries.set(key, {
        ...value,
        messages: value.messages.map((m) => ({ ...m, timestamp: new Date(m.timestamp) })),
        createdAt: new Date(value.createdAt),
        updatedAt: new Date(value.updatedAt),
      });
    }
  }

  private async persist(): Promise<void> {
    const data: Record<string, MemoryEntry> = {};
    for (const [key, value] of this.entries) {
      data[key] = value;
    }
    await writeFile(this.persistencePath, JSON.stringify(data, null, 2), "utf-8");
  }

  get sessionCount(): number {
    return this.entries.size;
  }

  hasSession(sessionId: string): boolean {
    return this.entries.has(sessionId);
  }
}
