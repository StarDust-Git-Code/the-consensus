import { TaskCategory, MODEL_ROUTING, DEFAULT_RPD_LIMITS } from './constants';

/**
 * ModelRouter — Smart model selection + API key rotation.
 *
 * Two layers of optimization:
 * 1. Task-based routing: Maps task categories → best model per RPD budget
 * 2. Key rotation: Distributes requests across multiple API keys (each has its own RPD)
 *
 * With N API keys, effective RPD = N × per-key RPD.
 */
class ModelRouterService {
  /** key:model → request count today */
  private requestCounts: Map<string, number> = new Map();
  /** model → custom RPD limit (user overrides) */
  private customLimits: Map<string, number> = new Map();
  /** Timestamp of last reset (midnight PT) */
  private lastReset: number = this.getMidnightPT();
  /** Registered API keys */
  private apiKeys: string[] = [];
  /** Round-robin index for key rotation */
  private keyIndex: number = 0;

  // ── Key Management ──────────────────────────────────────

  /** Register API keys (called when BYOK config changes) */
  setApiKeys(keys: string[]): void {
    this.apiKeys = keys.filter(k => k.trim().length > 0);
    this.keyIndex = 0;
  }

  /** Get all registered keys */
  getApiKeys(): string[] {
    return [...this.apiKeys];
  }

  /** Get the number of active keys */
  getKeyCount(): number {
    return this.apiKeys.length;
  }

  /**
   * Get the next API key to use for a request.
   * Uses round-robin with per-key capacity checking.
   * Returns the key and its index.
   */
  getNextApiKey(model: string): { key: string; keyIndex: number } {
    if (this.apiKeys.length === 0) {
      return { key: '', keyIndex: -1 };
    }
    if (this.apiKeys.length === 1) {
      return { key: this.apiKeys[0], keyIndex: 0 };
    }

    // Try each key starting from the current round-robin position
    for (let i = 0; i < this.apiKeys.length; i++) {
      const idx = (this.keyIndex + i) % this.apiKeys.length;
      const compositeKey = `${idx}:${model}`;
      const limit = this.customLimits.get(model) ?? DEFAULT_RPD_LIMITS[model] ?? Infinity;
      const used = this.requestCounts.get(compositeKey) || 0;

      if (limit === 0) continue;
      if (used < Math.floor(limit * 0.9)) {
        // Advance round-robin to next key for next call
        this.keyIndex = (idx + 1) % this.apiKeys.length;
        return { key: this.apiKeys[idx], keyIndex: idx };
      }
    }

    // All keys exhausted for this model — return next in rotation anyway
    const idx = this.keyIndex;
    this.keyIndex = (this.keyIndex + 1) % this.apiKeys.length;
    return { key: this.apiKeys[idx], keyIndex: idx };
  }

  // ── Model Routing ───────────────────────────────────────

  /**
   * Resolves the best model for a task category.
   * Walks the fallback chain, skipping models at their RPD limit.
   */
  resolveModel(category: TaskCategory, agentModelOverride?: string): string {
    this.checkDailyReset();

    if (agentModelOverride && this.hasCapacity(agentModelOverride)) {
      return agentModelOverride;
    }

    const chain = MODEL_ROUTING[category];
    for (const model of chain) {
      if (this.hasCapacity(model)) {
        return model;
      }
    }

    return chain[chain.length - 1];
  }

  /** Record a successful request for a model on a specific key */
  recordRequest(model: string, keyIndex: number = -1): void {
    // Track per-key usage
    if (keyIndex >= 0) {
      const compositeKey = `${keyIndex}:${model}`;
      const current = this.requestCounts.get(compositeKey) || 0;
      this.requestCounts.set(compositeKey, current + 1);
    }

    // Also track aggregate usage (for UI display)
    const aggKey = `agg:${model}`;
    const aggCurrent = this.requestCounts.get(aggKey) || 0;
    this.requestCounts.set(aggKey, aggCurrent + 1);
  }

  /** Force-exhaust a model on a specific key */
  markExhausted(model: string, keyIndex: number = -1): void {
    const limit = this.customLimits.get(model) ?? DEFAULT_RPD_LIMITS[model] ?? 1000;
    if (keyIndex >= 0) {
      const compositeKey = `${keyIndex}:${model}`;
      this.requestCounts.set(compositeKey, limit);
    }
  }

  /** Check if a model has remaining capacity across any key */
  hasCapacity(model: string): boolean {
    const limit = this.customLimits.get(model) ?? DEFAULT_RPD_LIMITS[model] ?? Infinity;
    if (limit === 0) return false;

    const keyCount = Math.max(this.apiKeys.length, 1);

    // Check if any key still has capacity
    for (let i = 0; i < keyCount; i++) {
      const compositeKey = `${i}:${model}`;
      const used = this.requestCounts.get(compositeKey) || 0;
      if (used < Math.floor(limit * 0.9)) {
        return true;
      }
    }
    return false;
  }

  // ── UI Stats ────────────────────────────────────────────

  /** Get usage stats for the UI — shows aggregate + per-key breakdown */
  getUsageStats(): Array<{ model: string; used: number; limit: number; percent: number }> {
    const models = Object.keys(DEFAULT_RPD_LIMITS).filter(m => (DEFAULT_RPD_LIMITS[m] ?? 0) > 0);
    const keyCount = Math.max(this.apiKeys.length, 1);

    return models.map(model => {
      const perKeyLimit = this.customLimits.get(model) ?? DEFAULT_RPD_LIMITS[model] ?? 0;
      const totalLimit = perKeyLimit * keyCount;

      // Sum usage across all keys
      let totalUsed = 0;
      for (let i = 0; i < keyCount; i++) {
        totalUsed += this.requestCounts.get(`${i}:${model}`) || 0;
      }

      return {
        model,
        used: totalUsed,
        limit: totalLimit,
        percent: totalLimit > 0 ? Math.round((totalUsed / totalLimit) * 100) : 0
      };
    }).sort((a, b) => b.percent - a.percent);
  }

  /** Allow users to override RPD limits */
  setCustomLimit(model: string, limit: number): void {
    this.customLimits.set(model, limit);
  }

  /** Reset counts (called at midnight PT or manually) */
  resetCounts(): void {
    this.requestCounts.clear();
    this.keyIndex = 0;
    this.lastReset = Date.now();
  }

  private checkDailyReset(): void {
    const now = this.getMidnightPT();
    if (now > this.lastReset) {
      this.resetCounts();
      this.lastReset = now;
    }
  }

  private getMidnightPT(): number {
    const now = new Date();
    const pt = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
    pt.setHours(0, 0, 0, 0);
    return pt.getTime();
  }
}

/** Singleton instance */
export const ModelRouter = new ModelRouterService();
