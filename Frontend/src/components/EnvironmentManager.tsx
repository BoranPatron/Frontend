import React, { useState, useEffect } from 'react';
import { environmentService } from '../api/environmentService';
import type { EnvironmentStatus, FeeConfiguration } from '../api/environmentService';

interface EnvironmentManagerProps {
  isAdmin?: boolean;
  onEnvironmentChange?: () => void;
}

const EnvironmentManager: React.FC<EnvironmentManagerProps> = ({ 
  isAdmin = false, 
  onEnvironmentChange 
}) => {
  const [status, setStatus] = useState<EnvironmentStatus | null>(null);
  const [feeConfig, setFeeConfig] = useState<FeeConfiguration | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [targetMode, setTargetMode] = useState<string>('');

  useEffect(() => {
    loadEnvironmentData();
  }, []);

  const loadEnvironmentData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Lade Fee-Konfiguration (für alle Benutzer)
      const config = await environmentService.getFeeConfiguration();
      setFeeConfig(config);

      // Lade detaillierten Status (nur für Admins)
      if (isAdmin) {
        const envStatus = await environmentService.getEnvironmentStatus();
        setStatus(envStatus);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Fehler beim Laden der Environment-Daten');
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchEnvironment = async (mode: string) => {
    if (mode === 'production') {
      setTargetMode(mode);
      setShowConfirmDialog(true);
      return;
    }

    await performSwitch(mode);
  };

  const performSwitch = async (mode: string) => {
    try {
      setLoading(true);
      setError(null);

      const confirm = mode === 'production';
      await environmentService.switchEnvironment(mode, confirm);

      // Lade Daten neu
      await loadEnvironmentData();

      // Callback aufrufen
      if (onEnvironmentChange) {
        onEnvironmentChange();
      }

      // Bestätigung anzeigen
      const modeName = mode === 'beta' ? 'Beta' : 'Production';
      alert(`✅ Erfolgreich zu ${modeName}-Modus gewechselt!`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Fehler beim Wechseln des Environment-Modus');
    } finally {
      setLoading(false);
      setShowConfirmDialog(false);
    }
  };

  const confirmProductionSwitch = () => {
    performSwitch(targetMode);
  };

  const cancelSwitch = () => {
    setShowConfirmDialog(false);
    setTargetMode('');
  };

  if (loading && !status && !feeConfig) {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Lade Environment-Daten...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        🏗️ Environment-Konfiguration
      </h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Fehler:</strong> {error}
        </div>
      )}

      {/* Aktueller Status */}
      {feeConfig && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">
            📊 Aktueller Status
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <span className="text-sm font-medium text-gray-600">Modus:</span>
                <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                  feeConfig.environment_mode === 'beta' 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {feeConfig.environment_mode.toUpperCase()}
                </span>
              </div>
              
              <div className="flex items-center mb-2">
                <span className="text-sm font-medium text-gray-600">Gebühren:</span>
                <span className="ml-2 text-lg font-bold text-gray-800">
                  {feeConfig.current_fee_percentage}%
                </span>
              </div>

              <div className="text-sm text-gray-500">
                {feeConfig.is_beta_mode ? (
                  <span>🔵 Beta-Modus: Keine Gebühren für Test-Phase</span>
                ) : (
                  <span>🟢 Production-Modus: Gebühren für Live-Betrieb</span>
                )}
              </div>
            </div>

            {status && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-600 mb-2">Admin-Informationen</h4>
                {status.last_switch && (
                  <div className="text-sm text-gray-600">
                    Letzter Wechsel: {new Date(status.last_switch).toLocaleString('de-DE')}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Admin-Bereich */}
      {isAdmin && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            ⚙️ Environment-Verwaltung (Admin)
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => handleSwitchEnvironment('beta')}
              disabled={loading || (feeConfig?.is_beta_mode ?? false)}
              className={`p-4 rounded-lg border-2 transition-colors ${
                feeConfig?.is_beta_mode
                  ? 'bg-blue-100 border-blue-300 text-blue-700 cursor-not-allowed'
                  : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
              }`}
            >
              <div className="text-center">
                <div className="text-2xl mb-2">🔵</div>
                <div className="font-semibold">Beta-Modus</div>
                <div className="text-sm">0.0% Gebühren</div>
                <div className="text-xs text-gray-500 mt-1">Test-Phase</div>
              </div>
            </button>

            <button
              onClick={() => handleSwitchEnvironment('production')}
              disabled={loading || (feeConfig?.is_production_mode ?? false)}
              className={`p-4 rounded-lg border-2 transition-colors ${
                feeConfig?.is_production_mode
                  ? 'bg-green-100 border-green-300 text-green-700 cursor-not-allowed'
                  : 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
              }`}
            >
              <div className="text-center">
                <div className="text-2xl mb-2">🟢</div>
                <div className="font-semibold">Production-Modus</div>
                <div className="text-sm">4.7% Gebühren</div>
                <div className="text-xs text-gray-500 mt-1">Live-Betrieb</div>
              </div>
            </button>
          </div>

          {loading && (
            <div className="mt-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <span className="ml-2 text-sm text-gray-600">Wechsle Environment...</span>
            </div>
          )}
        </div>
      )}

      {/* Bestätigungs-Dialog für Production-Wechsel */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-red-600 mb-4">
              ⚠️ Production-Modus aktivieren
            </h3>
            
            <p className="text-gray-700 mb-4">
              Sie sind dabei, den Production-Modus zu aktivieren. Dies wird Gebühren von 4.7% für alle neuen Angebote aktivieren.
            </p>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
              <p className="text-sm text-yellow-800">
                <strong>Wichtig:</strong> Dieser Wechsel kann nicht automatisch rückgängig gemacht werden.
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelSwitch}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Abbrechen
              </button>
              <button
                onClick={confirmProductionSwitch}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Production aktivieren
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnvironmentManager; 