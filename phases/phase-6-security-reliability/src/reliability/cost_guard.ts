export class CostLimitExceededError extends Error {
  constructor(message?: string) {
    super(message ?? "Cost limit exceeded");
    this.name = "CostLimitExceededError";
  }
}

export interface CostConfig {
  maxCostPerSession: number;
  maxCostPerTurn: number;
  maxTokensPerSession: number;
  alertThreshold: number;
}

interface CostUsage {
  cost: number;
  tokens: number;
  timestamp: number;
}

export class CostGuard {
  private config: CostConfig;
  private turnCost = 0;
  private turnTokens = 0;
  private sessionCost = 0;
  private sessionTokens = 0;
  private usageLog: CostUsage[] = [];
  private alertFired = false;

  constructor(config: CostConfig) {
    this.config = config;
  }

  /**
   * Check limits before a new turn. Throws CostLimitExceededError if any limit is exceeded.
   */
  checkBeforeTurn(): void {
    if (this.sessionCost >= this.config.maxCostPerSession) {
      throw new CostLimitExceededError(
        `Session cost limit reached: $${this.sessionCost.toFixed(4)} >= $${this.config.maxCostPerSession.toFixed(4)}`,
      );
    }

    if (this.sessionTokens >= this.config.maxTokensPerSession) {
      throw new CostLimitExceededError(
        `Session token limit reached: ${this.sessionTokens} >= ${this.config.maxTokensPerSession}`,
      );
    }

    this.turnCost = 0;
    this.turnTokens = 0;
  }

  /**
   * Record usage for a turn. Accumulates cost and tokens.
   */
  recordUsage(tokens: number, cost: number): void {
    this.turnCost += cost;
    this.turnTokens += tokens;
    this.sessionCost += cost;
    this.sessionTokens += tokens;

    this.usageLog.push({ cost, tokens, timestamp: Date.now() });

    if (
      !this.alertFired &&
      this.sessionCost >= this.config.maxCostPerSession * this.config.alertThreshold
    ) {
      console.warn(
        `CostGuard Alert: Session cost $${this.sessionCost.toFixed(4)} has reached ${(this.config.alertThreshold * 100).toFixed(0)}% of limit $${this.config.maxCostPerSession.toFixed(4)}`,
      );
      this.alertFired = true;
    }
  }

  /**
   * Get total session cost.
   */
  getSessionCost(): number {
    return this.sessionCost;
  }

  /**
   * Get total session tokens.
   */
  getSessionTokens(): number {
    return this.sessionTokens;
  }

  /**
   * Get the cost for the current turn.
   */
  getTurnCost(): number {
    return this.turnCost;
  }

  /**
   * Get the tokens for the current turn.
   */
  getTurnTokens(): number {
    return this.turnTokens;
  }

  /**
   * Get all usage records for the session.
   */
  getUsageLog(): CostUsage[] {
    return [...this.usageLog];
  }

  /**
   * Reset all counters for a new session.
   */
  reset(): void {
    this.turnCost = 0;
    this.turnTokens = 0;
    this.sessionCost = 0;
    this.sessionTokens = 0;
    this.usageLog = [];
    this.alertFired = false;
  }
}

export type { CostUsage };
