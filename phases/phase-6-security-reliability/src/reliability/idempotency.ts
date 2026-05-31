import { createHash } from "node:crypto";

interface CacheEntry {
  result: unknown;
  expiresAt: number;
}

export class IdempotencyGuard {
  private cache = new Map<string, CacheEntry>();
  private readonly defaultTTL: number;
  private dangerousTools: Set<string>;

  /**
   * @param defaultTTL - TTL in milliseconds (default 5 minutes)
   */
  constructor(defaultTTL: number = 300_000) {
    this.defaultTTL = defaultTTL;
    this.dangerousTools = new Set(["delete_file", "execute_shell", "modify_system"]);
  }

  /**
   * Generate a SHA-256 hash key from tool call parameters.
   */
  generateKey(toolName: string, params: Record<string, unknown>, requestId: string): string {
    const payload = JSON.stringify({ toolName, params, requestId });
    return createHash("sha256").update(payload).digest("hex");
  }

  /**
   * Attempt to execute a function with idempotency protection.
   * Returns the cached result if the key already exists, otherwise executes and caches.
   */
  async tryExecute<T>(
    toolName: string,
    params: Record<string, unknown>,
    requestId: string,
    fn: () => Promise<T>,
  ): Promise<{ cached: boolean; result: T }> {
    this.cleanup();
    const key = this.generateKey(toolName, params, requestId);
    const existing = this.cache.get(key);
    if (existing && existing.expiresAt > Date.now()) {
      return { cached: true, result: existing.result as T };
    }
    const result = await fn();
    this.cache.set(key, { result, expiresAt: Date.now() + this.defaultTTL });
    return { cached: false, result };
  }

  /**
   * Return the list of tools that require explicit confirmation.
   */
  requireConfirmation(toolName: string): boolean {
    return this.dangerousTools.has(toolName);
  }

  /**
   * Register a tool as dangerous requiring confirmation.
   */
  registerDangerousTool(toolName: string): void {
    this.dangerousTools.add(toolName);
  }

  /**
   * Remove expired entries from the cache.
   */
  cleanup(): number {
    const now = Date.now();
    let removed = 0;
    for (const [key, entry] of this.cache) {
      if (entry.expiresAt <= now) {
        this.cache.delete(key);
        removed++;
      }
    }
    return removed;
  }

  /**
   * Clear the entire cache.
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Return the number of cached entries.
   */
  get size(): number {
    return this.cache.size;
  }
}

export type { CacheEntry };
