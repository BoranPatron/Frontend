/**
 * Service Worker Manager - Registrierung und Kontrolle
 * Integriert Service Worker für besseres Caching-Management
 */

interface ServiceWorkerMessage {
  type: string;
  payload?: any;
}

interface ServiceWorkerResponse {
  success: boolean;
  data?: any;
  error?: string;
}

class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private isSupported = 'serviceWorker' in navigator;

  constructor() {
    if (this.isSupported && process.env.NODE_ENV === 'production') {
      this.register();
    } else if (process.env.NODE_ENV === 'development') {
      console.log('[SW Manager] Service Worker disabled in development mode');
    }
  }

  /**
   * Registriert den Service Worker
   */
  async register(): Promise<boolean> {
    if (!this.isSupported) {
      console.warn('[SW Manager] Service Worker not supported');
      return false;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('[SW Manager] Service Worker registered:', this.registration.scope);

      // Event Listener für Updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration?.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Neuer Service Worker verfügbar
              this.notifyUpdate();
            }
          });
        }
      });

      // Prüfe auf wartende Service Worker
      if (this.registration.waiting) {
        this.notifyUpdate();
      }

      return true;
    } catch (error) {
      console.error('[SW Manager] Service Worker registration failed:', error);
      return false;
    }
  }

  /**
   * Deregistriert den Service Worker
   */
  async unregister(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      const result = await this.registration.unregister();
      console.log('[SW Manager] Service Worker unregistered:', result);
      return result;
    } catch (error) {
      console.error('[SW Manager] Service Worker unregistration failed:', error);
      return false;
    }
  }

  /**
   * Sendet Nachricht an Service Worker
   */
  private async sendMessage(message: ServiceWorkerMessage): Promise<ServiceWorkerResponse> {
    return new Promise((resolve, reject) => {
      if (!navigator.serviceWorker.controller) {
        reject(new Error('No service worker controller'));
        return;
      }

      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data);
      };

      navigator.serviceWorker.controller.postMessage(message, [messageChannel.port2]);
    });
  }

  /**
   * Löscht alle Service Worker Caches
   */
  async clearCache(): Promise<boolean> {
    try {
      const response = await this.sendMessage({ type: 'CLEAR_CACHE' });
      return response.success;
    } catch (error) {
      console.error('[SW Manager] Failed to clear cache:', error);
      return false;
    }
  }

  /**
   * Ermittelt Cache-Statistiken
   */
  async getCacheStats(): Promise<Record<string, number> | null> {
    try {
      const response = await this.sendMessage({ type: 'GET_CACHE_STATS' });
      return response.success ? response.data : null;
    } catch (error) {
      console.error('[SW Manager] Failed to get cache stats:', error);
      return null;
    }
  }

  /**
   * Invalidiert Cache für bestimmte Patterns
   */
  async invalidateCache(pattern: string): Promise<boolean> {
    try {
      const response = await this.sendMessage({ 
        type: 'INVALIDATE_CACHE', 
        payload: { pattern } 
      });
      return response.success;
    } catch (error) {
      console.error('[SW Manager] Failed to invalidate cache:', error);
      return false;
    }
  }

  /**
   * Aktiviert wartenden Service Worker
   */
  async skipWaiting(): Promise<void> {
    if (this.registration?.waiting) {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }

  /**
   * Benachrichtigt über verfügbare Updates
   */
  private notifyUpdate(): void {
    // Zeige Update-Benachrichtigung
    if (window.confirm('Eine neue Version der Anwendung ist verfügbar. Jetzt aktualisieren?')) {
      this.skipWaiting();
      window.location.reload();
    }
  }

  /**
   * Prüft Service Worker Status
   */
  getStatus(): {
    supported: boolean;
    registered: boolean;
    active: boolean;
    scope?: string;
  } {
    return {
      supported: this.isSupported,
      registered: !!this.registration,
      active: !!navigator.serviceWorker.controller,
      scope: this.registration?.scope
    };
  }
}

// Singleton-Instanz
export const serviceWorkerManager = new ServiceWorkerManager();

/**
 * Cache-Management Hook für React-Komponenten
 */
export const useCacheManager = () => {
  const clearAllCaches = async (): Promise<boolean> => {
    // Lösche sowohl Service Worker als auch lokale Caches
    const swResult = await serviceWorkerManager.clearCache();
    
    // Lösche auch localStorage-basierte Caches
    try {
      const { cacheInvalidation } = await import('./cacheManager');
      cacheInvalidation.all();
      return swResult;
    } catch (error) {
      console.error('[Cache Manager] Failed to clear local caches:', error);
      return swResult;
    }
  };

  const getCacheInfo = async () => {
    const swStats = await serviceWorkerManager.getCacheStats();
    const swStatus = serviceWorkerManager.getStatus();
    
    try {
      const { cacheManager } = await import('./cacheManager');
      const localStats = cacheManager.getStats();
      
      return {
        serviceWorker: {
          status: swStatus,
          caches: swStats
        },
        local: localStats
      };
    } catch (error) {
      return {
        serviceWorker: {
          status: swStatus,
          caches: swStats
        },
        local: null
      };
    }
  };

  const forceRefresh = (): void => {
    // Lösche alle Caches und lade Seite neu
    clearAllCaches().then(() => {
      window.location.reload();
    });
  };

  return {
    clearAllCaches,
    getCacheInfo,
    forceRefresh,
    serviceWorkerStatus: serviceWorkerManager.getStatus()
  };
};

// Development-Tools
if (process.env.NODE_ENV === 'development') {
  (window as any).__serviceWorker = {
    manager: serviceWorkerManager,
    clearCache: () => serviceWorkerManager.clearCache(),
    getStats: () => serviceWorkerManager.getCacheStats(),
    status: () => serviceWorkerManager.getStatus()
  };
}

export default serviceWorkerManager;
