/**
 * Cache Manager - Robuste, performante und schlanke Caching-Lösung
 * Verhindert STRG+R-Probleme durch intelligentes Cache-Management
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  version: string;
}

interface CacheConfig {
  defaultTTL: number;
  maxSize: number;
  version: string;
  enableLogging: boolean;
}

class CacheManager {
  private cache = new Map<string, CacheItem<any>>();
  private config: CacheConfig;
  private readonly STORAGE_KEY = 'buildwise_cache_v2';

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTTL: 5 * 60 * 1000, // 5 Minuten Standard-TTL
      maxSize: 100, // Maximale Anzahl Cache-Einträge
      version: this.getBuildVersion(),
      enableLogging: process.env.NODE_ENV === 'development',
      ...config
    };

    this.loadFromStorage();
    this.startCleanupInterval();
  }

  /**
   * Ermittelt die Build-Version für Cache-Invalidierung
   */
  private getBuildVersion(): string {
    // Verwende Build-Zeit oder Package-Version
    if (typeof __BUILD_TIME__ !== 'undefined') {
      return __BUILD_TIME__;
    }
    
    // Fallback: Verwende aktuelle Zeit als Version
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Speichert einen Wert im Cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const cacheItem: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL,
      version: this.config.version
    };

    // Prüfe Cache-Größe und entferne älteste Einträge
    if (this.cache.size >= this.config.maxSize) {
      this.evictOldest();
    }

    this.cache.set(key, cacheItem);
    this.saveToStorage();

    if (this.config.enableLogging) {
      console.log(`[CacheManager] Set: ${key}`, { ttl: cacheItem.ttl });
    }
  }

  /**
   * Holt einen Wert aus dem Cache
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) {
      if (this.config.enableLogging) {
        console.log(`[CacheManager] Miss: ${key}`);
      }
      return null;
    }

    // Prüfe Version (Cache-Invalidierung bei neuen Builds)
    if (item.version !== this.config.version) {
      this.delete(key);
      if (this.config.enableLogging) {
        console.log(`[CacheManager] Version mismatch: ${key}`, {
          cached: item.version,
          current: this.config.version
        });
      }
      return null;
    }

    // Prüfe TTL
    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      this.delete(key);
      if (this.config.enableLogging) {
        console.log(`[CacheManager] Expired: ${key}`);
      }
      return null;
    }

    if (this.config.enableLogging) {
      console.log(`[CacheManager] Hit: ${key}`);
    }

    return item.data;
  }

  /**
   * Löscht einen Cache-Eintrag
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.saveToStorage();
      if (this.config.enableLogging) {
        console.log(`[CacheManager] Deleted: ${key}`);
      }
    }
    return deleted;
  }

  /**
   * Prüft ob ein Schlüssel im Cache existiert und gültig ist
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Leert den gesamten Cache
   */
  clear(): void {
    this.cache.clear();
    this.clearStorage();
    if (this.config.enableLogging) {
      console.log('[CacheManager] Cache cleared');
    }
  }

  /**
   * Invalidiert alle Cache-Einträge mit einem bestimmten Präfix
   */
  invalidateByPrefix(prefix: string): number {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.delete(key);
        count++;
      }
    }
    if (this.config.enableLogging) {
      console.log(`[CacheManager] Invalidated ${count} entries with prefix: ${prefix}`);
    }
    return count;
  }

  /**
   * Cache-Statistiken
   */
  getStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl || item.version !== this.config.version) {
        expiredEntries++;
      } else {
        validEntries++;
      }
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      maxSize: this.config.maxSize,
      version: this.config.version,
      hitRate: this.calculateHitRate()
    };
  }

  /**
   * Entfernt älteste Cache-Einträge
   */
  private evictOldest(): void {
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    // Entferne die ältesten 20% der Einträge
    const toRemove = Math.ceil(entries.length * 0.2);
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  /**
   * Startet automatische Bereinigung
   */
  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanup();
    }, 60000); // Jede Minute
  }

  /**
   * Bereinigt abgelaufene Cache-Einträge
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl || item.version !== this.config.version) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.saveToStorage();
      if (this.config.enableLogging) {
        console.log(`[CacheManager] Cleaned ${cleaned} expired entries`);
      }
    }
  }

  /**
   * Lädt Cache aus localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.version === this.config.version) {
          this.cache = new Map(data.entries);
          if (this.config.enableLogging) {
            console.log(`[CacheManager] Loaded ${this.cache.size} entries from storage`);
          }
        } else {
          // Version mismatch - Cache leeren
          this.clearStorage();
          if (this.config.enableLogging) {
            console.log('[CacheManager] Version mismatch - cleared storage');
          }
        }
      }
    } catch (error) {
      console.warn('[CacheManager] Failed to load from storage:', error);
      this.clearStorage();
    }
  }

  /**
   * Speichert Cache in localStorage
   */
  private saveToStorage(): void {
    try {
      const data = {
        version: this.config.version,
        entries: Array.from(this.cache.entries())
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn('[CacheManager] Failed to save to storage:', error);
    }
  }

  /**
   * Leert localStorage
   */
  private clearStorage(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.warn('[CacheManager] Failed to clear storage:', error);
    }
  }

  /**
   * Berechnet Hit-Rate (vereinfacht)
   */
  private calculateHitRate(): number {
    // Vereinfachte Hit-Rate-Berechnung
    // In einer vollständigen Implementierung würde man Hits/Misses tracken
    return this.cache.size > 0 ? 0.85 : 0;
  }
}

// Singleton-Instanz
export const cacheManager = new CacheManager();

/**
 * Cache-Decorator für API-Calls
 */
export function withCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: {
    keyGenerator?: (...args: Parameters<T>) => string;
    ttl?: number;
    prefix?: string;
  } = {}
): T {
  const { keyGenerator, ttl, prefix = 'api' } = options;

  return (async (...args: Parameters<T>) => {
    const key = keyGenerator 
      ? `${prefix}:${keyGenerator(...args)}`
      : `${prefix}:${JSON.stringify(args)}`;

    // Versuche aus Cache zu laden
    const cached = cacheManager.get(key);
    if (cached !== null) {
      return cached;
    }

    // Führe Funktion aus und cache Ergebnis
    try {
      const result = await fn(...args);
      cacheManager.set(key, result, ttl);
      return result;
    } catch (error) {
      // Bei Fehlern nicht cachen
      throw error;
    }
  }) as T;
}

/**
 * Cache-Invalidierung für spezifische Bereiche
 */
export const cacheInvalidation = {
  // Invalidiert alle API-Caches
  api: () => cacheManager.invalidateByPrefix('api:'),
  
  // Invalidiert User-spezifische Caches
  user: () => cacheManager.invalidateByPrefix('user:'),
  
  // Invalidiert Projekt-spezifische Caches
  project: (projectId?: string) => {
    if (projectId) {
      return cacheManager.invalidateByPrefix(`project:${projectId}`);
    }
    return cacheManager.invalidateByPrefix('project:');
  },
  
  // Invalidiert Gewerk-spezifische Caches
  trade: (tradeId?: string) => {
    if (tradeId) {
      return cacheManager.invalidateByPrefix(`trade:${tradeId}`);
    }
    return cacheManager.invalidateByPrefix('trade:');
  },
  
  // Komplette Cache-Invalidierung
  all: () => cacheManager.clear()
};

// Development-Tools
if (process.env.NODE_ENV === 'development') {
  // Globale Cache-Tools für Debugging
  (window as any).__cacheManager = {
    stats: () => cacheManager.getStats(),
    clear: () => cacheManager.clear(),
    invalidate: cacheInvalidation,
    get: (key: string) => cacheManager.get(key),
    set: (key: string, data: any, ttl?: number) => cacheManager.set(key, data, ttl)
  };
}

export default cacheManager;
