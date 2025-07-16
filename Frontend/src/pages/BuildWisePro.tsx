import React, { useState } from 'react';
import { 
  Crown, 
  Star, 
  Zap, 
  Shield, 
  Users, 
  BarChart3, 
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function BuildWisePro() {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<string>('monthly');
  const [isLoading, setIsLoading] = useState(false);

  const plans = [
    {
      id: 'monthly',
      name: 'Monatlich',
      price: 29.99,
      period: 'Monat',
      popular: false,
      features: [
        'Unbegrenzte Projekte',
        'Erweiterte Analytics',
        'Prioritäts-Support',
        'API-Zugriff'
      ]
    },
    {
      id: 'yearly',
      name: 'Jährlich',
      price: 299.99,
      period: 'Jahr',
      popular: true,
      savings: 60,
      features: [
        'Alle Monats-Features',
        '2 Monate kostenlos',
        'Exklusive Features',
        'White-Label Option'
      ]
    }
  ];

  const features = [
    {
      icon: <Crown className="w-6 h-6 text-[#ffbd59]" />,
      title: 'Premium Features',
      description: 'Zugriff auf alle erweiterten Funktionen'
    },
    {
      icon: <Zap className="w-6 h-6 text-[#ffbd59]" />,
      title: 'Unbegrenzte Projekte',
      description: 'Keine Begrenzung der Projektanzahl'
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-[#ffbd59]" />,
      title: 'Erweiterte Analytics',
      description: 'Detaillierte Berichte und Statistiken'
    },
    {
      icon: <Shield className="w-6 h-6 text-[#ffbd59]" />,
      title: 'Prioritäts-Support',
      description: '24/7 Support mit höchster Priorität'
    },
    {
      icon: <Users className="w-6 h-6 text-[#ffbd59]" />,
      title: 'Team-Management',
      description: 'Unbegrenzte Team-Mitglieder'
    }
  ];

  const handleSubscribe = async (planId: string) => {
    setIsLoading(true);
    
    // Simuliere API-Call
    setTimeout(() => {
      console.log('🚀 Pro-Abo wird aktiviert:', planId);
      setIsLoading(false);
      // Hier würde die echte Abo-Logik implementiert werden
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#51646f] via-[#3d4952] to-[#2c3539]">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-white hover:text-[#ffbd59] transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-2xl font-bold text-white">BuildWise Pro</h1>
              <div className="flex items-center space-x-2">
                <Crown className="w-6 h-6 text-[#ffbd59]" />
                <span className="text-sm text-gray-300">Premium Features</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Crown className="w-16 h-16 text-[#ffbd59]" />
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <Star className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">
            Upgrade auf BuildWise Pro
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Entdecken Sie die volle Kraft von BuildWise mit erweiterten Features, 
            unbegrenzten Projekten und Premium-Support.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {features.map((feature, index) => (
            <div key={index} className="bg-white/5 backdrop-blur-lg rounded-lg p-6 border border-white/10 hover:border-[#ffbd59]/30 transition-colors">
              <div className="flex items-center space-x-4 mb-4">
                {feature.icon}
                <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
              </div>
              <p className="text-gray-300">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Pricing Plans */}
        <div className="max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-white text-center mb-8">
            Wählen Sie Ihren Plan
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {plans.map((plan) => (
              <div 
                key={plan.id}
                className={`relative bg-white/5 backdrop-blur-lg rounded-lg p-8 border transition-all ${
                  plan.popular 
                    ? 'border-[#ffbd59] shadow-lg shadow-[#ffbd59]/20' 
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-[#2c3539] px-4 py-1 rounded-full text-sm font-semibold">
                      Beliebt
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <h4 className="text-xl font-semibold text-white mb-2">{plan.name}</h4>
                  <div className="flex items-baseline justify-center space-x-1">
                    <span className="text-4xl font-bold text-white">€{plan.price}</span>
                    <span className="text-gray-300">/{plan.period}</span>
                  </div>
                  {plan.savings && (
                    <p className="text-sm text-green-400 mt-2">
                      Sparen Sie €{plan.savings} pro Jahr
                    </p>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={isLoading}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
                    plan.popular
                      ? 'bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-[#2c3539] hover:from-[#ffa726] hover:to-[#ff9800]'
                      : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                      <span>Wird aktiviert...</span>
                    </div>
                  ) : (
                    `Jetzt ${plan.name} wählen`
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <h3 className="text-2xl font-bold text-white text-center mb-8">
            Häufig gestellte Fragen
          </h3>
          
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white/5 backdrop-blur-lg rounded-lg p-6 border border-white/10">
              <h4 className="text-lg font-semibold text-white mb-2">
                Kann ich mein Abo jederzeit kündigen?
              </h4>
              <p className="text-gray-300">
                Ja, Sie können Ihr Abo jederzeit kündigen. Die Kündigung wird zum Ende der aktuellen Abrechnungsperiode wirksam.
              </p>
            </div>
            
            <div className="bg-white/5 backdrop-blur-lg rounded-lg p-6 border border-white/10">
              <h4 className="text-lg font-semibold text-white mb-2">
                Gibt es eine kostenlose Testphase?
              </h4>
              <p className="text-gray-300">
                Ja, Sie können BuildWise Pro 14 Tage kostenlos testen. Alle Features sind während der Testphase verfügbar.
              </p>
            </div>
            
            <div className="bg-white/5 backdrop-blur-lg rounded-lg p-6 border border-white/10">
              <h4 className="text-lg font-semibold text-white mb-2">
                Welche Zahlungsmethoden werden akzeptiert?
              </h4>
              <p className="text-gray-300">
                Wir akzeptieren alle gängigen Kreditkarten, PayPal und SEPA-Lastschrift für deutsche Kunden.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="mt-16 text-center">
          <div className="bg-white/5 backdrop-blur-lg rounded-lg p-8 border border-white/10">
            <h3 className="text-2xl font-bold text-white mb-4">
              Haben Sie Fragen?
            </h3>
            <p className="text-gray-300 mb-6">
              Unser Support-Team steht Ihnen gerne zur Verfügung
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-6 py-3 bg-[#ffbd59] text-[#2c3539] rounded-lg font-semibold hover:bg-[#ffa726] transition-colors">
                Support kontaktieren
              </button>
              <button 
                onClick={() => navigate('/dashboard')}
                className="px-6 py-3 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20 transition-colors border border-white/20"
              >
                Zurück zum Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 