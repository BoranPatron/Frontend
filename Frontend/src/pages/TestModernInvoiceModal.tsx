import React, { useState } from 'react';
import InvoiceModal from '../components/InvoiceModal';
import { Calculator, Euro, Globe, FileText } from 'lucide-react';

const TestModernInvoiceModal: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleInvoiceSubmitted = () => {
    console.log('Rechnung wurde erfolgreich erstellt!');
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#2c3539] to-[#1a1a2e] p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            🧪 Moderne InvoiceModal Test
          </h1>
          <p className="text-gray-400 text-lg">
            Modernisierte Steuerberechnung für die DACH-Region
          </p>
        </div>

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-gradient-to-r from-[#1a1a2e]/80 to-[#2c3539]/80 backdrop-blur-sm rounded-xl border border-gray-600/30 p-6 text-center">
            <div className="p-3 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl w-fit mx-auto mb-4">
              <Globe size={32} className="text-blue-400" />
            </div>
            <h3 className="font-semibold text-white mb-2">DACH-Region</h3>
            <p className="text-sm text-gray-400">
              Schweiz 🇨🇭, Deutschland 🇩🇪, Österreich 🇦🇹
            </p>
          </div>

          <div className="bg-gradient-to-r from-[#1a1a2e]/80 to-[#2c3539]/80 backdrop-blur-sm rounded-xl border border-gray-600/30 p-6 text-center">
            <div className="p-3 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl w-fit mx-auto mb-4">
              <Calculator size={32} className="text-green-400" />
            </div>
            <h3 className="font-semibold text-white mb-2">Auto-MwSt</h3>
            <p className="text-sm text-gray-400">
              Automatische Berechnung nach Land
            </p>
          </div>

          <div className="bg-gradient-to-r from-[#1a1a2e]/80 to-[#2c3539]/80 backdrop-blur-sm rounded-xl border border-gray-600/30 p-6 text-center">
            <div className="p-3 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl w-fit mx-auto mb-4">
              <Euro size={32} className="text-yellow-400" />
            </div>
            <h3 className="font-semibold text-white mb-2">Multi-Currency</h3>
            <p className="text-sm text-gray-400">
              CHF, EUR automatisch
            </p>
          </div>

          <div className="bg-gradient-to-r from-[#1a1a2e]/80 to-[#2c3539]/80 backdrop-blur-sm rounded-xl border border-gray-600/30 p-6 text-center">
            <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl w-fit mx-auto mb-4">
              <FileText size={32} className="text-purple-400" />
            </div>
            <h3 className="font-semibold text-white mb-2">Modern UI</h3>
            <p className="text-sm text-gray-400">
              Card-Design, Icons, Animationen
            </p>
          </div>
        </div>

        {/* VAT Rates Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-r from-[#1a1a2e]/80 to-[#2c3539]/80 backdrop-blur-sm rounded-xl border border-gray-600/30 overflow-hidden">
            <div className="bg-gradient-to-r from-red-500/10 to-red-600/10 px-6 py-4 border-b border-gray-600/30">
              <h3 className="font-semibold text-white flex items-center gap-2">
                🇨🇭 Schweiz (Standard)
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">Standard:</span>
                  <span className="font-semibold text-white">8.1%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Reduziert:</span>
                  <span className="font-semibold text-white">2.6%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Sondersatz:</span>
                  <span className="font-semibold text-white">3.8%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Befreit:</span>
                  <span className="font-semibold text-white">0%</span>
                </div>
                <div className="pt-2 border-t border-gray-600/30">
                  <span className="text-yellow-400 font-medium">Währung: CHF</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-[#1a1a2e]/80 to-[#2c3539]/80 backdrop-blur-sm rounded-xl border border-gray-600/30 overflow-hidden">
            <div className="bg-gradient-to-r from-yellow-500/10 to-amber-500/10 px-6 py-4 border-b border-gray-600/30">
              <h3 className="font-semibold text-white flex items-center gap-2">
                🇩🇪 Deutschland
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">Standard:</span>
                  <span className="font-semibold text-white">19%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Ermäßigt:</span>
                  <span className="font-semibold text-white">7%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Befreit:</span>
                  <span className="font-semibold text-white">0%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300"></span>
                  <span className="font-semibold text-white"></span>
                </div>
                <div className="pt-2 border-t border-gray-600/30">
                  <span className="text-yellow-400 font-medium">Währung: EUR</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-[#1a1a2e]/80 to-[#2c3539]/80 backdrop-blur-sm rounded-xl border border-gray-600/30 overflow-hidden">
            <div className="bg-gradient-to-r from-red-600/10 to-red-700/10 px-6 py-4 border-b border-gray-600/30">
              <h3 className="font-semibold text-white flex items-center gap-2">
                🇦🇹 Österreich
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">Standard:</span>
                  <span className="font-semibold text-white">20%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Ermäßigt:</span>
                  <span className="font-semibold text-white">13%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Reduziert:</span>
                  <span className="font-semibold text-white">10%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Befreit:</span>
                  <span className="font-semibold text-white">0%</span>
                </div>
                <div className="pt-2 border-t border-gray-600/30">
                  <span className="text-yellow-400 font-medium">Währung: EUR</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Test Button */}
        <div className="text-center">
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-white text-lg font-semibold rounded-xl hover:from-[#ffa726] hover:to-[#ff9500] transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-[#ffbd59]/30 hover:scale-105 active:scale-95"
          >
            <FileText size={24} />
            Moderne InvoiceModal öffnen
          </button>
        </div>

        {/* Changelog */}
        <div className="mt-12 bg-gradient-to-r from-[#1a1a2e]/80 to-[#2c3539]/80 backdrop-blur-sm rounded-xl border border-gray-600/30 p-8">
          <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
            🚀 Neu in dieser Version
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-green-400 mb-4">✅ Steuer-Features</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• DACH-Region Unterstützung (CH, DE, AT)</li>
                <li>• Automatische MwSt.-Sätze pro Land</li>
                <li>• Multi-Currency (CHF, EUR)</li>
                <li>• Aktuelle Steuersätze (2025)</li>
                <li>• Smart Defaults pro Land</li>
                <li>• Live-Berechnung bei Land-Wechsel</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-blue-400 mb-4">🎨 Design-Features</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• Modern Card-Design für alle Bereiche</li>
                <li>• Icons für bessere Orientierung</li>
                <li>• Farbkodierte Bereiche</li>
                <li>• Gradient-Hintergründe</li>
                <li>• Verbesserte Typografie</li>
                <li>• Smooth Animationen</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Modal */}
        <InvoiceModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          milestoneId={1}
          milestoneTitle="Test Meilenstein - Dacharbeiten"
          contractValue={15000}
          onInvoiceSubmitted={handleInvoiceSubmitted}
          projectId={1}
          serviceProviderId={1}
        />
      </div>
    </div>
  );
};

export default TestModernInvoiceModal;