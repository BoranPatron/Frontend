/**
 * Cache Debug Panel - Entwicklungs-Tool für Cache-Management
 * Nur in Development-Mode verfügbar
 */

import React, { useState, useEffect } from 'react';
import { RefreshCw, Trash2, Info, Database, Globe, Settings } from 'lucide-react';
import { useCacheManager } from '../utils/serviceWorkerManager';

interface CacheStats {
  serviceWorker: {
    status: any;
    caches: Record<string, number> | null;
  };
  local: any;
}

export default function CacheDebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [loading, setLoading] = useState(false);
  const { clearAllCaches, getCacheInfo, forceRefresh, serviceWorkerStatus } = useCacheManager();

  // Nur in Development-Mode anzeigen
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const loadCacheStats = async () => {
    setLoading(true);
    try {
      const stats = await getCacheInfo();
      setCacheStats(stats);
    } catch (error) {
      console.error('Failed to load cache stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadCacheStats();
    }
  }, [isOpen]);

  const handleClearCache = async () => {
    if (window.confirm('Alle Caches löschen? Dies kann die Performance temporär beeinträchtigen.')) {
      setLoading(true);
      try {
        await clearAllCaches();
        await loadCacheStats();
        alert('Cache erfolgreich geleert!');
      } catch (error) {
        console.error('Failed to clear cache:', error);
        alert('Fehler beim Leeren des Caches');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleForceRefresh = () => {
    if (window.confirm('Seite mit Cache-Clearing neu laden?')) {
      forceRefresh();
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-colors"
          title="Cache Debug Panel öffnen"
        >
          <Database size={20} />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-gray-900 text-white rounded-lg shadow-xl border border-gray-700 w-96 max-h-96 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Database size={18} />
          <h3 className="font-semibold">Cache Debug Panel</h3>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          ×
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleClearCache}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-800 rounded text-sm transition-colors"
          >
            <Trash2 size={14} />
            Cache leeren
          </button>
          <button
            onClick={handleForceRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 rounded text-sm transition-colors"
          >
            <RefreshCw size={14} />
            Force Refresh
          </button>
          <button
            onClick={loadCacheStats}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 rounded text-sm transition-colors"
          >
            <Info size={14} />
            Aktualisieren
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
          </div>
        )}

        {/* Service Worker Status */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Globe size={14} />
            Service Worker
          </div>
          <div className="bg-gray-800 rounded p-3 text-xs space-y-1">
            <div className="flex justify-between">
              <span>Unterstützt:</span>
              <span className={serviceWorkerStatus.supported ? 'text-green-400' : 'text-red-400'}>
                {serviceWorkerStatus.supported ? 'Ja' : 'Nein'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Registriert:</span>
              <span className={serviceWorkerStatus.registered ? 'text-green-400' : 'text-red-400'}>
                {serviceWorkerStatus.registered ? 'Ja' : 'Nein'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Aktiv:</span>
              <span className={serviceWorkerStatus.active ? 'text-green-400' : 'text-red-400'}>
                {serviceWorkerStatus.active ? 'Ja' : 'Nein'}
              </span>
            </div>
            {serviceWorkerStatus.scope && (
              <div className="text-gray-400">
                Scope: {serviceWorkerStatus.scope}
              </div>
            )}
          </div>
        </div>

        {/* Cache Statistics */}
        {cacheStats && (
          <>
            {/* Service Worker Caches */}
            {cacheStats.serviceWorker.caches && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Settings size={14} />
                  SW Caches
                </div>
                <div className="bg-gray-800 rounded p-3 text-xs space-y-1">
                  {Object.entries(cacheStats.serviceWorker.caches).map(([name, count]) => (
                    <div key={name} className="flex justify-between">
                      <span className="truncate">{name}:</span>
                      <span className="text-blue-400">{count} Einträge</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Local Cache */}
            {cacheStats.local && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Database size={14} />
                  Lokaler Cache
                </div>
                <div className="bg-gray-800 rounded p-3 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span>Einträge gesamt:</span>
                    <span className="text-blue-400">{cacheStats.local.totalEntries}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Gültige Einträge:</span>
                    <span className="text-green-400">{cacheStats.local.validEntries}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Abgelaufene Einträge:</span>
                    <span className="text-red-400">{cacheStats.local.expiredEntries}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Hit-Rate:</span>
                    <span className="text-yellow-400">
                      {Math.round(cacheStats.local.hitRate * 100)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Version:</span>
                    <span className="text-gray-400 truncate">{cacheStats.local.version}</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Tips */}
        <div className="bg-blue-900/50 rounded p-3 text-xs">
          <div className="font-medium mb-1">💡 Tipps:</div>
          <ul className="space-y-1 text-gray-300">
            <li>• Cache leeren bei Problemen mit veralteten Daten</li>
            <li>• Force Refresh für komplette Neuladung</li>
            <li>• Service Worker nur in Production aktiv</li>
          </ul>
        </div>

        {/* Console Commands */}
        <div className="bg-gray-800 rounded p-3 text-xs">
          <div className="font-medium mb-1">🔧 Console Commands:</div>
          <div className="space-y-1 text-gray-300 font-mono">
            <div>__cacheManager.stats()</div>
            <div>__cacheManager.clear()</div>
            <div>__apiClient.clearCache()</div>
            <div>__serviceWorker.status()</div>
          </div>
        </div>
      </div>
    </div>
  );
}
