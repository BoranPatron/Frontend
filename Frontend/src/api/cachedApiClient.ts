/**
 * Cached API Client - Erweitert den Standard-API-Client um intelligentes Caching
 * Verhindert STRG+R-Probleme durch automatische Cache-Invalidierung
 */

import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { cacheManager, withCache, cacheInvalidation } from '../utils/cacheManager';
import { getApiBaseUrl } from './api';

// Cache-Konfiguration für verschiedene Endpunkte
const CACHE_CONFIG = {
  // Kurze Cache-Zeit für häufig ändernde Daten
  SHORT: 2 * 60 * 1000,    // 2 Minuten
  // Mittlere Cache-Zeit für moderate Änderungen
  MEDIUM: 10 * 60 * 1000,  // 10 Minuten
  // Lange Cache-Zeit für selten ändernde Daten
  LONG: 60 * 60 * 1000,    // 1 Stunde
  // Sehr kurze Cache-Zeit für kritische Daten
  CRITICAL: 30 * 1000      // 30 Sekunden
};

// Endpunkt-spezifische Cache-Konfiguration
const ENDPOINT_CACHE_CONFIG: Record<string, { ttl: number; cacheable: boolean }> = {
  // User-Daten - mittlere Cache-Zeit
  '/users/me': { ttl: CACHE_CONFIG.MEDIUM, cacheable: true },
  '/users/profile': { ttl: CACHE_CONFIG.MEDIUM, cacheable: true },
  
  // Projekt-Daten - kurze Cache-Zeit (ändern sich häufig)
  '/projects': { ttl: CACHE_CONFIG.SHORT, cacheable: true },
  '/projects/': { ttl: CACHE_CONFIG.SHORT, cacheable: true },
  
  // Gewerk-Daten - kurze Cache-Zeit
  '/trades': { ttl: CACHE_CONFIG.SHORT, cacheable: true },
  '/trades/': { ttl: CACHE_CONFIG.SHORT, cacheable: true },
  
  // Angebote - kritische Daten, sehr kurze Cache-Zeit
  '/quotes': { ttl: CACHE_CONFIG.CRITICAL, cacheable: true },
  '/quotes/': { ttl: CACHE_CONFIG.CRITICAL, cacheable: true },
  
  // Statische Daten - lange Cache-Zeit
  '/categories': { ttl: CACHE_CONFIG.LONG, cacheable: true },
  '/settings': { ttl: CACHE_CONFIG.LONG, cacheable: true },
  
  // Keine Cache für Authentifizierung
  '/auth/': { ttl: 0, cacheable: false },
  '/login': { ttl: 0, cacheable: false },
  '/logout': { ttl: 0, cacheable: false },
  
  // Keine Cache für Uploads
  '/upload': { ttl: 0, cacheable: false },
  '/documents/upload': { ttl: 0, cacheable: false }
};

class CachedApiClient {
  private axiosInstance = axios.create();
  private requestCounter = 0;

  constructor() {
    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request Interceptor - Cache-Busting und Authentifizierung
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // Basis-URL setzen
        config.baseURL = getApiBaseUrl();
        
        // Authentifizierung
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Cache-Busting für nicht-cacheable Requests
        const cacheConfig = this.getCacheConfigForUrl(config.url || '');
        if (!cacheConfig.cacheable || config.method?.toLowerCase() !== 'get') {
          // Füge Cache-Busting-Parameter hinzu
          const separator = config.url?.includes('?') ? '&' : '?';
          config.url += `${separator}_cb=${Date.now()}&_req=${++this.requestCounter}`;
        }

        // Request-ID für Debugging
        config.headers['X-Request-ID'] = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Entwicklungs-Logging
        if (process.env.NODE_ENV === 'development') {
          console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, {
            cached: cacheConfig.cacheable,
            ttl: cacheConfig.ttl
          });
        }

        return config;
      },
      (error) => {
        console.error('[API] Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response Interceptor - Cache-Management und Fehlerbehandlung
    this.axiosInstance.interceptors.response.use(
      (response) => {
        // Erfolgreiche Antwort - Cache-Invalidierung bei Änderungen
        if (response.config.method?.toLowerCase() !== 'get') {
          this.invalidateCacheForMutation(response.config.url || '', response.config.method || '');
        }

        return response;
      },
      (error) => {
        // Fehlerbehandlung
        if (error.response?.status === 401) {
          // Unauthorized - Cache leeren und zur Anmeldung weiterleiten
          cacheInvalidation.all();
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        } else if (error.response?.status >= 500) {
          // Server-Fehler - Cache für betroffenen Endpunkt invalidieren
          const url = error.config?.url || '';
          this.invalidateCacheForUrl(url);
        }

        console.error('[API] Response error:', {
          status: error.response?.status,
          url: error.config?.url,
          message: error.message
        });

        return Promise.reject(error);
      }
    );
  }

  /**
   * GET-Request mit intelligentem Caching
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    const cacheConfig = this.getCacheConfigForUrl(url);
    
    if (cacheConfig.cacheable && cacheConfig.ttl > 0) {
      // Verwende Cache
      const cacheKey = this.generateCacheKey('GET', url, config?.params);
      
      return withCache(
        async () => {
          const response = await this.axiosInstance.get<T>(url, config);
          return response;
        },
        {
          keyGenerator: () => cacheKey,
          ttl: cacheConfig.ttl,
          prefix: 'api'
        }
      )();
    } else {
      // Kein Cache
      return this.axiosInstance.get<T>(url, config);
    }
  }

  /**
   * POST-Request (immer ohne Cache)
   */
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    const response = await this.axiosInstance.post<T>(url, data, config);
    this.invalidateCacheForMutation(url, 'POST');
    return response;
  }

  /**
   * PUT-Request (immer ohne Cache)
   */
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    const response = await this.axiosInstance.put<T>(url, data, config);
    this.invalidateCacheForMutation(url, 'PUT');
    return response;
  }

  /**
   * DELETE-Request (immer ohne Cache)
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    const response = await this.axiosInstance.delete<T>(url, config);
    this.invalidateCacheForMutation(url, 'DELETE');
    return response;
  }

  /**
   * PATCH-Request (immer ohne Cache)
   */
  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    const response = await this.axiosInstance.patch<T>(url, data, config);
    this.invalidateCacheForMutation(url, 'PATCH');
    return response;
  }

  /**
   * Ermittelt Cache-Konfiguration für eine URL
   */
  private getCacheConfigForUrl(url: string): { ttl: number; cacheable: boolean } {
    // Normalisiere URL für Matching
    const normalizedUrl = url.split('?')[0]; // Entferne Query-Parameter
    
    // Exakte Übereinstimmung
    if (ENDPOINT_CACHE_CONFIG[normalizedUrl]) {
      return ENDPOINT_CACHE_CONFIG[normalizedUrl];
    }
    
    // Pattern-Matching
    for (const [pattern, config] of Object.entries(ENDPOINT_CACHE_CONFIG)) {
      if (pattern.endsWith('/') && normalizedUrl.startsWith(pattern)) {
        return config;
      }
      
      // Regex-Pattern für IDs (z.B. /projects/123)
      if (pattern.includes('/') && !pattern.endsWith('/')) {
        const regexPattern = pattern.replace(/\/\d+/g, '/\\d+') + '/?$';
        if (new RegExp(regexPattern).test(normalizedUrl)) {
          return config;
        }
      }
    }
    
    // Standard: kurze Cache-Zeit für GET, kein Cache für andere
    return { ttl: CACHE_CONFIG.SHORT, cacheable: true };
  }

  /**
   * Generiert Cache-Schlüssel
   */
  private generateCacheKey(method: string, url: string, params?: any): string {
    const baseKey = `${method}:${url}`;
    if (params && Object.keys(params).length > 0) {
      const sortedParams = Object.keys(params)
        .sort()
        .map(key => `${key}=${params[key]}`)
        .join('&');
      return `${baseKey}?${sortedParams}`;
    }
    return baseKey;
  }

  /**
   * Invalidiert Cache nach Mutations-Operationen
   */
  private invalidateCacheForMutation(url: string, method: string): void {
    const normalizedUrl = url.split('?')[0];
    
    // Intelligente Cache-Invalidierung basierend auf URL-Patterns
    if (normalizedUrl.includes('/projects')) {
      cacheInvalidation.project();
    } else if (normalizedUrl.includes('/trades')) {
      cacheInvalidation.trade();
    } else if (normalizedUrl.includes('/quotes')) {
      // Quotes sind kritisch - invalidiere auch verwandte Caches
      cacheInvalidation.api();
    } else if (normalizedUrl.includes('/users')) {
      cacheInvalidation.user();
    } else {
      // Fallback: Invalidiere alle API-Caches
      cacheInvalidation.api();
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`[API] Cache invalidated for ${method} ${url}`);
    }
  }

  /**
   * Invalidiert Cache für spezifische URL
   */
  private invalidateCacheForUrl(url: string): void {
    const normalizedUrl = url.split('?')[0];
    cacheManager.invalidateByPrefix(`api:GET:${normalizedUrl}`);
  }

  /**
   * Manuelle Cache-Kontrolle
   */
  public clearCache(): void {
    cacheInvalidation.all();
  }

  public getCacheStats() {
    return cacheManager.getStats();
  }

  /**
   * Prefetch für wichtige Daten
   */
  public async prefetch(urls: string[]): Promise<void> {
    const promises = urls.map(url => 
      this.get(url).catch(error => {
        console.warn(`[API] Prefetch failed for ${url}:`, error);
      })
    );
    
    await Promise.allSettled(promises);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API] Prefetched ${urls.length} URLs`);
    }
  }
}

// Singleton-Instanz
export const cachedApiClient = new CachedApiClient();

// Development-Tools
if (process.env.NODE_ENV === 'development') {
  (window as any).__apiClient = {
    stats: () => cachedApiClient.getCacheStats(),
    clearCache: () => cachedApiClient.clearCache(),
    prefetch: (urls: string[]) => cachedApiClient.prefetch(urls)
  };
}

export default cachedApiClient;
