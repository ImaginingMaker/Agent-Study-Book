/**
 * Session 管理 — 会话生命周期管理
 *
 * 管理会话的创建、验证、过期清理，每个会话包含上下文和元数据。
 */

import { randomUUID } from "node:crypto";

export interface SessionMeta {
  sessionId: string;
  createdAt: Date;
  lastActiveAt: Date;
  expiresAt: Date;
  userId?: string;
  metadata: Record<string, unknown>;
}

export class SessionManager {
  private sessions: Map<string, SessionMeta> = new Map();
  private readonly ttlMs: number;

  constructor(ttlMs = 30 * 60 * 1000) {
    this.ttlMs = ttlMs;
  }

  createSession(userId?: string, metadata: Record<string, unknown> = {}): SessionMeta {
    const now = new Date();
    const session: SessionMeta = {
      sessionId: randomUUID(),
      createdAt: now,
      lastActiveAt: now,
      expiresAt: new Date(now.getTime() + this.ttlMs),
      userId,
      metadata,
    };

    this.sessions.set(session.sessionId, session);
    return session;
  }

  getSession(sessionId: string): SessionMeta | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;

    if (Date.now() > session.expiresAt.getTime()) {
      this.sessions.delete(sessionId);
      return undefined;
    }

    session.lastActiveAt = new Date();
    return session;
  }

  refreshSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session || Date.now() > session.expiresAt.getTime()) {
      this.sessions.delete(sessionId);
      return false;
    }

    session.lastActiveAt = new Date();
    session.expiresAt = new Date(Date.now() + this.ttlMs);
    return true;
  }

  destroySession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  cleanupExpired(): number {
    const now = Date.now();
    let count = 0;

    for (const [id, session] of this.sessions) {
      if (now > session.expiresAt.getTime()) {
        this.sessions.delete(id);
        count++;
      }
    }

    return count;
  }

  get activeCount(): number {
    return this.sessions.size;
  }
}
