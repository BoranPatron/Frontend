import React, { useState } from 'react';
import { X, Crown, Check, Zap, Mail, Calendar, Users, BarChart3 } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: (planType: 'monthly' | 'yearly') => void;
}

export default function UpgradeModal({ isOpen, onClose, onUpgrade }: UpgradeModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      await onUpgrade(selectedPlan);
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: <Zap className="w-5 h-5" />,
      text: 'Unbegrenzte Gewerke-Ausschreibungen'
    },
    {
      icon: <BarChart3 className="w-5 h-5" />,
      text: 'Alle Dashboard-Funktionen'
    },
    {
      icon: <Mail className="w-5 h-5" />,
      text: 'Email & Kalender Integration'
    },
    {
      icon: <Users className="w-5 h-5" />,
      text: 'Priority Support'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="relative p-8 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-white rounded-t-3xl">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Crown className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold mb-2">Upgrade zu BuildWise Pro</h2>
            <p className="text-white/90 text-lg">
              Entfesseln Sie das volle Potenzial Ihrer Bauprojekte
            </p>
          </div>
        </div>

        <div className="p-8">
          {/* Plan-Auswahl */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Monatlich */}
            <button
              onClick={() => setSelectedPlan('monthly')}
              className={`
                relative p-6 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105
                ${selectedPlan === 'monthly' 
                  ? 'border-[#ffbd59] bg-[#ffbd59]/10 shadow-lg' 
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-800 mb-2">Monatlich</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-900">12.99</span>
                  <span className="text-gray-600 ml-1">CHF/Monat</span>
                </div>
                <p className="text-gray-600 text-sm">
                  Perfekt für den Einstieg
                </p>
              </div>
              {selectedPlan === 'monthly' && (
                <div className="absolute top-4 right-4">
                  <div className="w-6 h-6 bg-[#ffbd59] rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                </div>
              )}
            </button>

            {/* Jährlich */}
            <button
              onClick={() => setSelectedPlan('yearly')}
              className={`
                relative p-6 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105
                ${selectedPlan === 'yearly' 
                  ? 'border-[#ffbd59] bg-[#ffbd59]/10 shadow-lg' 
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  16% sparen!
                </span>
              </div>
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-800 mb-2">Jährlich</h3>
                <div className="mb-2">
                  <span className="text-3xl font-bold text-gray-900">130</span>
                  <span className="text-gray-600 ml-1">CHF/Jahr</span>
                </div>
                <div className="mb-4">
                  <span className="text-sm text-gray-500 line-through">155.88 CHF</span>
                  <span className="text-green-600 text-sm font-semibold ml-2">-25.88 CHF</span>
                </div>
                <p className="text-gray-600 text-sm">
                  Beste Wahl für Profis
                </p>
              </div>
              {selectedPlan === 'yearly' && (
                <div className="absolute top-4 right-4">
                  <div className="w-6 h-6 bg-[#ffbd59] rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                </div>
              )}
            </button>
          </div>

          {/* Features */}
          <div className="bg-gray-50 rounded-2xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
              Was Sie mit Pro erhalten:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="text-[#ffbd59]">
                    {feature.icon}
                  </div>
                  <span className="text-gray-700">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Vergleich */}
          <div className="bg-white border rounded-2xl overflow-hidden mb-8">
            <div className="grid grid-cols-3 bg-gray-50">
              <div className="p-4">
                <h4 className="font-semibold text-gray-800">Feature</h4>
              </div>
              <div className="p-4 text-center border-l">
                <h4 className="font-semibold text-gray-600">Basis</h4>
              </div>
              <div className="p-4 text-center border-l bg-[#ffbd59]/10">
                <h4 className="font-semibold text-[#ffbd59]">Pro</h4>
              </div>
            </div>
            
            <div className="grid grid-cols-3 border-t">
              <div className="p-4">Gewerke-Ausschreibungen</div>
              <div className="p-4 text-center border-l">Max. 3</div>
              <div className="p-4 text-center border-l bg-[#ffbd59]/5">Unbegrenzt</div>
            </div>
            
            <div className="grid grid-cols-3 border-t">
              <div className="p-4">Dashboard-Funktionen</div>
              <div className="p-4 text-center border-l">Basis</div>
              <div className="p-4 text-center border-l bg-[#ffbd59]/5">Alle</div>
            </div>
            
            <div className="grid grid-cols-3 border-t">
              <div className="p-4">Email & Kalender</div>
              <div className="p-4 text-center border-l">❌</div>
              <div className="p-4 text-center border-l bg-[#ffbd59]/5">✅</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={onClose}
              className="px-6 py-3 text-gray-600 hover:text-gray-800 font-semibold transition-colors"
            >
              Vielleicht später
            </button>
            <button
              onClick={handleUpgrade}
              disabled={isLoading}
              className={`
                flex items-center space-x-2 px-8 py-3 rounded-xl font-semibold transition-all duration-300 transform
                ${isLoading
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-[#ffbd59] hover:bg-[#ffa726] hover:scale-105 shadow-lg'
                } text-white
              `}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Wird verarbeitet...</span>
                </>
              ) : (
                <>
                  <Crown className="w-5 h-5" />
                  <span>
                    Jetzt upgraden - {selectedPlan === 'monthly' ? '12.99 CHF/Monat' : '130 CHF/Jahr'}
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Footer */}
          <div className="text-center mt-6 text-sm text-gray-500">
            <p>
              Sicher bezahlen mit Stripe • Jederzeit kündbar • 30 Tage Geld-zurück-Garantie
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 