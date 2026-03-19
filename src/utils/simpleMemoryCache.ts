type CacheEntry<T> = {
    value: T;
    expiresAt: number;
};

class SimpleMemoryCache {
    store: Map<string, CacheEntry<unknown>>;

    constructor() {
        this.store = new Map();
    }

    get<T>(key: string): T | null {
        const entry = this.store.get(key);
        if (!entry) return null;

        if (entry.expiresAt <= Date.now()) {
            this.store.delete(key);
            return null;
        }

        return entry.value as T;
    }

    set<T>(key: string, value: T, ttlMs = 30000): T {
        this.store.set(key, {
            value,
            expiresAt: Date.now() + ttlMs,
        });
        return value;
    }

    async getOrSet<T>(key: string, factory: () => Promise<T>, ttlMs = 30000): Promise<T> {
        const cached = this.get<T>(key);
        if (cached !== null) return cached;

        const value = await factory();
        return this.set(key, value, ttlMs);
    }

    clear() {
        this.store.clear();
    }
}

export default SimpleMemoryCache;
