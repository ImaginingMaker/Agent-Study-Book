export type CircuitState = "closed" | "open" | "half_open";

export class CircuitBreakerOpenError extends Error {
  constructor(message?: string) {
    super(message ?? "Circuit breaker is OPEN – request rejected");
    this.name = "CircuitBreakerOpenError";
  }
}

export class CircuitBreaker {
  state: CircuitState = "closed";
  failureCount = 0;
  lastFailureTime: number | null = null;
  totalTrips = 0;

  private readonly failureThreshold: number;
  private readonly recoveryTimeoutMs: number;
  private readonly halfOpenMaxCalls: number;
  private halfOpenCalls = 0;

  /**
   * @param failureThreshold - Number of consecutive failures before opening (default 5)
   * @param recoveryTimeoutMs - Time in ms before transitioning to half-open (default 60s)
   * @param halfOpenMaxCalls - Max test calls allowed in half-open state (default 1)
   */
  constructor(
    failureThreshold: number = 5,
    recoveryTimeoutMs: number = 60_000,
    halfOpenMaxCalls: number = 1,
  ) {
    this.failureThreshold = failureThreshold;
    this.recoveryTimeoutMs = recoveryTimeoutMs;
    this.halfOpenMaxCalls = halfOpenMaxCalls;
  }

  /**
   * Check if the circuit accepts requests.
   */
  isAvailable(): boolean {
    this.evaluateState();
    return this.state !== "open";
  }

  /**
   * Wrap a function call with circuit breaker protection.
   */
  async call<T>(fn: () => Promise<T>): Promise<T> {
    this.evaluateState();

    if (this.state === "open") {
      throw new CircuitBreakerOpenError(
        `Circuit breaker is OPEN (failureCount=${this.failureCount})`,
      );
    }

    if (this.state === "half_open" && this.halfOpenCalls >= this.halfOpenMaxCalls) {
      throw new CircuitBreakerOpenError(
        "Circuit breaker is HALF_OPEN and max test calls reached",
      );
    }

    this.halfOpenCalls++;

    try {
      const result = await fn();
      this.recordSuccess();
      return result;
    } catch (err) {
      this.recordFailure();
      throw err;
    }
  }

  /**
   * Record a successful call and reset the circuit.
   */
  recordSuccess(): void {
    this.state = "closed";
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.halfOpenCalls = 0;
  }

  /**
   * Record a failed call and potentially open the circuit.
   */
  recordFailure(): void {
    this.lastFailureTime = Date.now();
    this.failureCount++;

    if (this.state === "half_open" || this.failureCount >= this.failureThreshold) {
      this.state = "open";
      this.totalTrips++;
    }

    this.halfOpenCalls = 0;
  }

  /**
   * Reset the circuit breaker to its initial closed state.
   */
  reset(): void {
    this.state = "closed";
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.totalTrips = 0;
    this.halfOpenCalls = 0;
  }

  /**
   * Internal state evaluation — transitions OPEN → HALF_OPEN after recovery timeout.
   */
  private evaluateState(): void {
    if (
      this.state === "open" &&
      this.lastFailureTime !== null &&
      Date.now() - this.lastFailureTime >= this.recoveryTimeoutMs
    ) {
      this.state = "half_open";
      this.halfOpenCalls = 0;
    }
  }
}
