/**
 * Simple token bucket rate limiter, one bucket per key (usually the ip
 * address of the guest that is making the requests). Every bucket starts
 * full and earns one token every `refillIntervalMs`, a request is only
 * accepted when the bucket has a token left in it.
 */
export class RateLimiter {
  private buckets = new Map<
    string,
    { tokens: number; lastRefill: number }
  >();

  constructor(
    private readonly maxTokens: number,
    private readonly refillIntervalMs: number
  ) {}

  allow(key: string, cost = 1): boolean {
    const now = Date.now();
    let bucket = this.buckets.get(key);
    if (!bucket) {
      bucket = { tokens: this.maxTokens, lastRefill: now };
      this.buckets.set(key, bucket);
    }

    const earnedTokens = Math.floor(
      (now - bucket.lastRefill) / this.refillIntervalMs
    );
    if (earnedTokens > 0) {
      bucket.tokens = Math.min(
        this.maxTokens,
        bucket.tokens + earnedTokens
      );
      bucket.lastRefill += earnedTokens * this.refillIntervalMs;
    }

    if (bucket.tokens < cost) return false;
    bucket.tokens -= cost;
    return true;
  }
}

/**
 * Locks a key out after too many failed attempts, used to keep anyone on the
 * network from guessing the party code with repeated requests.
 */
export class AttemptGuard {
  private attempts = new Map<
    string,
    { failures: number; lockedUntil: number }
  >();

  constructor(
    private readonly maxAttempts: number,
    private readonly lockoutMs: number
  ) {}

  isLocked(key: string): boolean {
    const record = this.attempts.get(key);
    if (!record) return false;
    if (record.lockedUntil > Date.now()) return true;
    this.attempts.delete(key);
    return false;
  }

  /** Records a failure, answers whether the key is now locked. */
  fail(key: string): boolean {
    let record = this.attempts.get(key);
    if (!record) {
      record = { failures: 0, lockedUntil: 0 };
      this.attempts.set(key, record);
    }
    record.failures += 1;
    if (record.failures >= this.maxAttempts) {
      record.lockedUntil = Date.now() + this.lockoutMs;
      record.failures = 0;
      return true;
    }
    return false;
  }

  succeed(key: string) {
    this.attempts.delete(key);
  }
}
