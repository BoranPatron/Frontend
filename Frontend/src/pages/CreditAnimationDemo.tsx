import React from 'react';
import { CreditAnimationProvider, useCreditAdditionAnimation } from '../components/CreditAnimationProvider';

// Demo-Komponente für Credit-Addition-Animation
function CreditAnimationDemo() {
  const { showCreditAnimation } = useCreditAdditionAnimation();

  const handleQuoteAccepted = () => {
    showCreditAnimation(5, 'quote_accepted', 'Müller Bau GmbH');
  };

  const handleInspectionQuoteAccepted = () => {
    showCreditAnimation(15, 'inspection_quote_accepted', 'Schmidt & Partner');
  };

  const handleProjectCompleted = () => {
    showCreditAnimation(10, 'project_completed');
  };

  const handleProviderReview = () => {
    showCreditAnimation(2, 'provider_review');
  };

  const handleRegistrationBonus = () => {
    showCreditAnimation(90, 'registration_bonus');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">
          Credit-Addition-Animation Demo
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <button
            onClick={handleQuoteAccepted}
            className="p-6 bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-emerald-500/30 rounded-xl hover:from-emerald-500/30 hover:to-green-500/30 transition-all duration-300"
          >
            <h3 className="text-lg font-semibold text-emerald-300 mb-2">Angebot angenommen</h3>
            <p className="text-gray-300 text-sm mb-4">+5 Credits</p>
            <p className="text-gray-400 text-xs">Standard-Angebot ohne Besichtigung</p>
          </button>

          <button
            onClick={handleInspectionQuoteAccepted}
            className="p-6 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30 rounded-xl hover:from-blue-500/30 hover:to-indigo-500/30 transition-all duration-300"
          >
            <h3 className="text-lg font-semibold text-blue-300 mb-2">Besichtigungs-Angebot angenommen</h3>
            <p className="text-gray-300 text-sm mb-4">+15 Credits</p>
            <p className="text-gray-400 text-xs">Angebot nach Besichtigung (Bonus!)</p>
          </button>

          <button
            onClick={handleProjectCompleted}
            className="p-6 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl hover:from-purple-500/30 hover:to-pink-500/30 transition-all duration-300"
          >
            <h3 className="text-lg font-semibold text-purple-300 mb-2">Projekt abgeschlossen</h3>
            <p className="text-gray-300 text-sm mb-4">+10 Credits</p>
            <p className="text-gray-400 text-xs">Projekt erfolgreich beendet</p>
          </button>

          <button
            onClick={handleProviderReview}
            className="p-6 bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 rounded-xl hover:from-yellow-500/30 hover:to-amber-500/30 transition-all duration-300"
          >
            <h3 className="text-lg font-semibold text-yellow-300 mb-2">Bewertung abgegeben</h3>
            <p className="text-gray-300 text-sm mb-4">+2 Credits</p>
            <p className="text-gray-400 text-xs">Dienstleister bewertet</p>
          </button>

          <button
            onClick={handleRegistrationBonus}
            className="p-6 bg-gradient-to-br from-rose-500/20 to-pink-500/20 border border-rose-500/30 rounded-xl hover:from-rose-500/30 hover:to-pink-500/30 transition-all duration-300"
          >
            <h3 className="text-lg font-semibold text-rose-300 mb-2">Willkommensbonus</h3>
            <p className="text-gray-300 text-sm mb-4">+90 Credits</p>
            <p className="text-gray-400 text-xs">Registrierungs-Bonus</p>
          </button>
        </div>

        <div className="mt-12 p-6 bg-gray-800/50 rounded-xl border border-gray-600/30">
          <h2 className="text-xl font-semibold text-white mb-4">Integration in bestehende Komponenten</h2>
          <div className="space-y-3 text-gray-300">
            <p>• <code className="bg-gray-700 px-2 py-1 rounded text-emerald-300">Dashboard.tsx</code> - Aktualisiert mit Credit-Animation</p>
            <p>• <code className="bg-gray-700 px-2 py-1 rounded text-emerald-300">ProjectDetail.tsx</code> - Aktualisiert mit Credit-Animation</p>
            <p>• <code className="bg-gray-700 px-2 py-1 rounded text-emerald-300">Quotes.tsx</code> - Aktualisiert mit Credit-Animation</p>
            <p>• <code className="bg-gray-700 px-2 py-1 rounded text-emerald-300">CreditAdditionAnimation.tsx</code> - Neue Animation-Komponente</p>
            <p>• <code className="bg-gray-700 px-2 py-1 rounded text-emerald-300">useCreditAdditionAnimation.ts</code> - Hook für Animation-Management</p>
          </div>
        </div>

        <div className="mt-8 p-6 bg-blue-900/20 rounded-xl border border-blue-500/30">
          <h2 className="text-xl font-semibold text-blue-300 mb-4">Credit-Konfiguration</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-300 mb-2">Standard-Events:</p>
              <ul className="space-y-1 text-gray-400">
                <li>• Angebot angenommen: <span className="text-emerald-400">5 Credits</span></li>
                <li>• Besichtigungs-Angebot: <span className="text-blue-400">15 Credits</span></li>
                <li>• Projekt abgeschlossen: <span className="text-purple-400">10 Credits</span></li>
                <li>• Bewertung abgegeben: <span className="text-yellow-400">2 Credits</span></li>
              </ul>
            </div>
            <div>
              <p className="text-gray-300 mb-2">Bonus-Events:</p>
              <ul className="space-y-1 text-gray-400">
                <li>• Registrierungs-Bonus: <span className="text-rose-400">90 Credits</span></li>
                <li>• Empfehlungs-Bonus: <span className="text-violet-400">20 Credits</span></li>
                <li>• Treue-Bonus: <span className="text-red-400">10 Credits</span></li>
                <li>• Meilenstein erreicht: <span className="text-cyan-400">1 Credit</span></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hauptkomponente mit Provider
export default function CreditAnimationDemoPage() {
  return (
    <CreditAnimationProvider>
      <CreditAnimationDemo />
    </CreditAnimationProvider>
  );
}

