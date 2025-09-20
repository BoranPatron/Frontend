import React, { useState } from 'react';
import CostPositionManager from '../components/CostPositionManager';

interface CostPosition {
  id: number;
  description: string;
  amount: number;
  category: string;
  cost_type: string;
  status: string;
}

const TestCostPositionManager: React.FC = () => {
  // Starte mit leerer Liste um das neue Empty-State zu zeigen
  const [positions, setPositions] = useState<CostPosition[]>([]);
  
  const [total, setTotal] = useState(0);

  const handlePositionsChange = (newPositions: CostPosition[]) => {
    setPositions(newPositions);
  };

  const handleTotalChange = (newTotal: number) => {
    setTotal(newTotal);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#2c3539] to-[#1a1a2e] p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            🧪 CostPositionManager Test
          </h1>
          <p className="text-gray-400">
            Moderne, mobile-optimierte Kostenpositionen-Verwaltung
          </p>
        </div>

        {/* Info Card */}
        <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-xl p-6 border border-blue-500/20 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">✨ Neue Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-blue-300 mb-2">🎨 Design</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Card-basierte Darstellung</li>
                <li>• Collapse/Expand für Details</li>
                <li>• Inline-Editing Modus</li>
                <li>• Visuell ansprechende Icons</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-green-300 mb-2">📱 Mobile Features</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Swipe-to-Delete (nach links wischen)</li>
                <li>• Touch-optimierte Buttons (44px+)</li>
                <li>• Responsive Grid Layout</li>
                <li>• Direkter Eingabe-Dialog</li>
                <li>• Empty-State mit CTA</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Main Component */}
        <div className="bg-gradient-to-r from-[#1a1a2e]/80 to-[#2c3539]/80 backdrop-blur-sm rounded-xl border border-gray-600/30 p-6">
          <CostPositionManager 
            positions={positions}
            onPositionsChange={handlePositionsChange}
            onTotalChange={handleTotalChange}
          />
        </div>

        {/* Summary */}
        <div className="mt-8 bg-gradient-to-r from-[#ffbd59]/10 to-[#ffa726]/10 rounded-xl p-6 border border-[#ffbd59]/20">
          <h2 className="text-xl font-semibold text-white mb-4">📊 Zusammenfassung</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-[#ffbd59]">
                {positions.length}
              </div>
              <div className="text-sm text-gray-400">Positionen</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {positions.reduce((sum, pos) => sum + pos.amount, 0).toFixed(2)} €
              </div>
              <div className="text-sm text-gray-400">Gesamtbetrag</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {positions.filter(p => p.amount > 0).length}
              </div>
              <div className="text-sm text-gray-400">Mit Betrag</div>
            </div>
          </div>
        </div>

        {/* JSON Debug Info */}
        <details className="mt-8 bg-gradient-to-r from-gray-500/10 to-gray-600/10 rounded-xl p-4 border border-gray-500/20">
          <summary className="text-white font-medium cursor-pointer mb-4">
            🔍 Debug: Aktuelle Daten (zum Aufklappen)
          </summary>
          <pre className="text-xs text-gray-300 bg-black/50 p-4 rounded-lg overflow-auto">
            {JSON.stringify({ positions, total }, null, 2)}
          </pre>
        </details>

        {/* Instructions */}
        <div className="mt-8 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-6 border border-purple-500/20">
          <h2 className="text-xl font-semibold text-white mb-4">🎯 Anleitung zum Testen</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-purple-300 mb-2">🖥️ Desktop</h3>
              <ul className="text-sm text-gray-300 space-y-2">
                <li>• <strong>Hinzufügen:</strong> Dialog mit Titel, Betrag, Kategorie</li>
                <li>• <strong>Bearbeiten:</strong> Edit-Button (Stift-Icon) klicken</li>
                <li>• <strong>Löschen:</strong> Roten Trash-Button verwenden</li>
                <li>• <strong>Details:</strong> Pfeil-Button zum Auf-/Einklappen</li>
                <li>• <strong>Empty-State:</strong> Wenn keine Positionen vorhanden</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-pink-300 mb-2">📱 Mobile</h3>
              <ul className="text-sm text-gray-300 space-y-2">
                <li>• <strong>Hinzufügen:</strong> Dialog mit Auto-Focus auf Beschreibung</li>
                <li>• <strong>Löschen:</strong> Karte nach links wischen</li>
                <li>• <strong>Bearbeiten:</strong> Edit-Button antippen</li>
                <li>• <strong>Validierung:</strong> Button deaktiviert ohne Beschreibung</li>
                <li>• <strong>Escape:</strong> Dialog mit X oder Außenbereich schließen</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestCostPositionManager;