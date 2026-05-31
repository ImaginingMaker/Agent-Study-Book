export class RateLimitError extends Error {
  constructor(message?: string) {
    super(message ?? "Rate limit exceeded");
    this.name = "RateLimitError";
  }
}

export class AllProvidersFailedError extends Error {
  constructor(message?: string) {
    super(message ?? "All providers failed");
    this.name = "AllProvidersFailedError";
  }
}

/**
 * Retry an async function with exponential backoff.
 * Only retries on RateLimitError; other errors are rethrown immediately.
 *
 * @param fn - The async function to retry
 * @param maxRetries - Maximum number of retry attempts (default 3)
 * @param baseDelayMs - Base delay in ms for exponential backoff (default 1000)
 * @param enableJitter - Add random jitter of ±50% to each delay (default true)
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000,
  enableJitter: boolean = true,
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));

      if (!(lastError instanceof RateLimitError)) {
        throw lastError;
      }

      if (attempt >= maxRetries) {
        throw lastError;
      }

      const delay = baseDelayMs * Math.pow(2, attempt);
      const jitter = enableJitter
        ? delay * 0.5 * (2 * Math.random() - 1) // ±50%
        : 0;
      const finalDelay = Math.max(0, delay + jitter);

      await new Promise((resolve) => setTimeout(resolve, finalDelay));
    }
  }

  throw lastError!;
}

export interface Provider {
  name: string;
  model: string;
  call(prompt: string): Promise<string>;
}

export class ProviderRouter {
  private providers: Provider[];
  private currentIndex = 0;

  constructor(providers: Provider[]) {
    if (providers.length === 0) {
      throw new Error("At least one provider is required");
    }
    this.providers = providers;
  }

  /**
   * Try calling each provider in sequence, skipping any that throw RateLimitError.
   */
  async callWithFallback(prompt: string): Promise<{ result: string; provider: string; model: string }> {
    const errors: Array<{ provider: string; error: Error }> = [];

    for (let i = 0; i < this.providers.length; i++) {
      const index = (this.currentIndex + i) % this.providers.length;
      const provider = this.providers[index];

      try {
        const result = await provider.call(prompt);
        this.currentIndex = (index + 1) % this.providers.length;
        return { result, provider: provider.name, model: provider.model };
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err));
        if (error instanceof RateLimitError) {
          errors.push({ provider: provider.name, error });
          continue;
        }
        throw error;
      }
    }

    throw new AllProvidersFailedError(
      `All providers failed. Errors: ${errors.map((e) => `${e.provider}: ${e.error.message}`).join("; ")}`,
    );
  }
}
