import React from 'react';
import { 
  Building, 
  Calculator, 
  CheckSquare, 
  FileText, 
  Users, 
  Calendar,
  Euro,
  Hammer,
  Clock,
  TrendingUp,
  MapPin,
  Star,
  MessageSquare,
  Archive,
  Camera,
  CheckCircle,
  Settings,
  Package,
  Wrench,
  Zap,
  Brush,
  Map,
  Navigation,
  Filter,
  Search,
  ArrowRight,
  MoreHorizontal,
  Bell,
  Files,
  ChevronLeft
} from 'lucide-react';

interface ProjectMockupProps {
  variant?: 'bautraeger' | 'dienstleister';
}

export function ProjectMockup({ variant = 'bautraeger' }: ProjectMockupProps) {
  if (variant === 'bautraeger') {
    return (
      <div className="bg-gradient-to-br from-[#2c3539] to-[#1a1a2e] rounded-xl p-6 shadow-xl border border-gray-700">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-lg flex items-center justify-center">
              <Building className="w-6 h-6 text-[#2c3539]" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">Wohnanlage Musterstraße</h3>
              <p className="text-gray-300 text-sm">Mehrfamilienhaus • 850m²</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs font-medium">
              Aktiv
            </span>
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Fortschritt</span>
              <span className="text-[#ffbd59] font-semibold">68%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
              <div className="bg-[#ffbd59] h-2 rounded-full" style={{ width: '68%' }}></div>
            </div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Budget</span>
              <span className="text-green-400 font-semibold">1.2M €</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">850k € verbraucht</div>
          </div>
        </div>

        <div className="text-gray-300 text-sm mb-4">
          <MapPin className="w-4 h-4 inline mr-1 text-gray-400" />
          Musterstraße 123, 12345 Musterstadt
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs">Rohbau</span>
          <span className="bg-orange-500/20 text-orange-400 px-2 py-1 rounded text-xs">3 Ausschreibungen</span>
          <span className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded text-xs">5 Gewerke</span>
        </div>
      </div>
    );
  }

  // Dienstleister variant
  return (
    <div className="bg-gradient-to-br from-[#2c3539] to-[#1a1a2e] rounded-xl p-6 shadow-xl border border-gray-700">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <Hammer className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">Bürogebäude Zentrum</h3>
            <p className="text-gray-300 text-sm">Elektroinstallation • 1.200m²</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full text-xs font-medium">
            Angebot eingereicht
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Ihr Angebot</span>
            <span className="text-[#ffbd59] font-semibold">85k €</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">Eingereicht vor 2 Tagen</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Konkurrenz</span>
            <span className="text-red-400 font-semibold">4 weitere</span>
          </div>
          <div className="text-xs text-gray-500 mt-1">Angebote eingegangen</div>
        </div>
      </div>

      <div className="text-gray-300 text-sm mb-4">
        <MapPin className="w-4 h-4 inline mr-1 text-gray-400" />
        Geschäftsstraße 45, 54321 Geschäftsstadt
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs">Elektriker</span>
        <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-xs">15km Entfernung</span>
        <span className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded text-xs">Gewerblich</span>
      </div>
    </div>
  );
}

export function TenderMockup({ variant = 'bautraeger' }: ProjectMockupProps) {
  if (variant === 'bautraeger') {
    // TradeDetailsModal-inspired design for Bauträger
    return (
      <div className="bg-gradient-to-br from-[#2c3539] to-[#1a1a2e] rounded-2xl shadow-2xl border border-gray-700 overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#ffbd59] to-[#ffa726] p-6 text-[#2c3539]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <Building className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Sanitärinstallation</h2>
                <p className="text-sm opacity-80">Wohnanlage Musterstraße • Projekt #1234</p>
              </div>
            </div>
            <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">3 Angebote</span>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Project Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-300">Standort</span>
              </div>
              <p className="text-white">Musterstraße 123, 12345 Musterstadt</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-300">Deadline</span>
              </div>
              <p className="text-white">15. November 2024</p>
            </div>
          </div>
          
          {/* Quotes List */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#ffbd59]" />
              Eingegangene Angebote
            </h3>
            
            {/* Quote 1 - Accepted */}
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">Müller Sanitärtechnik GmbH</h4>
                      <p className="text-sm text-gray-400">Eingereicht vor 2 Tagen</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Gesamtpreis:</span>
                      <p className="text-white font-semibold">42.500 €</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Dauer:</span>
                      <p className="text-white">14 Arbeitstage</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Garantie:</span>
                      <p className="text-white">24 Monate</p>
                    </div>
                  </div>
                </div>
                <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-medium">
                  ✓ Angenommen
                </span>
              </div>
            </div>
            
            {/* Quote 2 - Pending */}
            <div className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">Schmidt Installationen</h4>
                      <p className="text-sm text-gray-400">Eingereicht vor 1 Tag</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Gesamtpreis:</span>
                      <p className="text-white font-semibold">38.900 €</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Dauer:</span>
                      <p className="text-white">12 Arbeitstage</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Garantie:</span>
                      <p className="text-white">36 Monate</p>
                    </div>
                  </div>
                </div>
                <span className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-sm font-medium">
                  Prüfung
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Service provider variant - simplified quote list
  return (
    <div className="bg-gradient-to-br from-[#2c3539] to-[#1a1a2e] rounded-xl p-6 shadow-xl border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <h3 className="font-bold text-white text-lg">Verfügbare Ausschreibungen</h3>
        </div>
        <span className="text-gray-400 text-sm">12 in Ihrer Nähe</span>
      </div>

      <div className="space-y-3">
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 hover:bg-blue-500/15 transition-colors cursor-pointer">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-semibold text-white mb-2">Dachdeckerarbeiten</h4>
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
                <span className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  8km entfernt
                </span>
                <span className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  3 Tage verbleibend
                </span>
                <span className="flex items-center">
                  <Euro className="w-4 h-4 mr-1" />
                  Budget: 25-30k €
                </span>
                <span className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  Start: Januar 2025
                </span>
              </div>
            </div>
            <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-medium">
              Angebot möglich
            </span>
          </div>
        </div>
        
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-semibold text-white mb-2">Heizungsinstallation</h4>
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
                <span className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-1 text-green-400" />
                  Zuschlag erhalten
                </span>
                <span className="flex items-center">
                  <Euro className="w-4 h-4 mr-1" />
                  32.000 €
                </span>
                <span className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  Start: Nächste Woche
                </span>
              </div>
            </div>
            <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-medium">
              ✓ Gewonnen
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CostPositionMockup({ variant = 'bautraeger' }: ProjectMockupProps) {
  if (variant === 'dienstleister') {
    // CostEstimateForm-inspired design for Dienstleister
    return (
      <div className="bg-gradient-to-br from-[#2c3539] to-[#1a1a2e] rounded-2xl shadow-2xl border border-gray-700 overflow-hidden max-w-4xl mx-auto">
        {/* Form Header */}
        <div className="bg-gradient-to-r from-[#ffbd59] to-[#ffa726] p-6 text-[#2c3539]">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Angebotserstellung</h2>
              <p className="text-sm opacity-80">Sanitärinstallation • Wohnanlage Musterstraße</p>
            </div>
          </div>
        </div>
        
        {/* Form Content */}
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Star className="w-4 h-4 text-[#ffbd59]" />
                Angebotsnummer
              </label>
              <div className="bg-gray-800/50 border border-gray-600 rounded-lg px-4 py-3">
                <span className="text-white">ANB-2024-001</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Euro className="w-4 h-4 text-green-400" />
                Gesamtbetrag
              </label>
              <div className="bg-gray-800/50 border border-gray-600 rounded-lg px-4 py-3">
                <span className="text-white font-semibold">42.500 €</span>
              </div>
            </div>
          </div>
          
          {/* Cost Breakdown */}
          <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg p-6 border border-green-500/30">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-green-400" />
              Kostenaufschlüsselung
            </h3>
            
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="text-sm font-medium text-gray-300">Arbeitskosten</span>
                </div>
                <p className="text-white font-semibold text-lg">28.000 €</p>
                <p className="text-sm text-gray-400">200h à 140€</p>
              </div>
              
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <Package className="w-4 h-4 text-purple-400" />
                  </div>
                  <span className="text-sm font-medium text-gray-300">Materialkosten</span>
                </div>
                <p className="text-white font-semibold text-lg">12.500 €</p>
                <p className="text-sm text-gray-400">Inklusive Rohre, Armaturen</p>
              </div>
              
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
                    <Settings className="w-4 h-4 text-orange-400" />
                  </div>
                  <span className="text-sm font-medium text-gray-300">Nebenkosten</span>
                </div>
                <p className="text-white font-semibold text-lg">2.000 €</p>
                <p className="text-sm text-gray-400">Anfahrt, Entsorgung</p>
              </div>
            </div>
          </div>
          
          {/* Company Info */}
          <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-lg p-6 border border-blue-500/30">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-400" />
              Unternehmensdaten
            </h3>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <span className="text-sm text-gray-400">Unternehmen:</span>
                  <p className="text-white font-semibold">Müller Sanitärtechnik GmbH</p>
                </div>
                <div>
                  <span className="text-sm text-gray-400">Ansprechpartner:</span>
                  <p className="text-white">Klaus Müller</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <span className="text-sm text-gray-400">E-Mail:</span>
                  <p className="text-white">k.mueller@sanitaer-mueller.de</p>
                </div>
                <div>
                  <span className="text-sm text-gray-400">Telefon:</span>
                  <p className="text-white">+49 123 456789</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Form Actions */}
        <div className="bg-gray-800/30 px-6 py-4 flex items-center justify-between border-t border-gray-700">
          <div className="text-sm text-gray-400">
            Gültig bis: 30. November 2024
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg font-medium transition-colors">
              Entwurf speichern
            </button>
            <button className="px-6 py-2 bg-[#ffbd59] hover:bg-[#ffa726] text-[#2c3539] rounded-lg font-semibold transition-colors">
              Angebot einreichen
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Bauträger variant - cost overview
  return (
    <div className="bg-gradient-to-br from-[#2c3539] to-[#1a1a2e] rounded-xl p-6 shadow-xl border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
            <Calculator className="w-5 h-5 text-white" />
          </div>
          <h3 className="font-bold text-white text-lg">Kostenkontrolle</h3>
        </div>
        <span className="text-green-400 font-semibold text-xl">275.500 €</span>
      </div>

      <div className="space-y-4">
        {/* Budget Overview */}
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-green-400 font-medium">Genehmigtes Budget</span>
            <span className="text-green-400 font-bold">300.000 €</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div className="bg-green-400 h-2 rounded-full" style={{ width: '92%' }}></div>
          </div>
          <div className="flex justify-between text-sm text-gray-400 mt-1">
            <span>92% verbraucht</span>
            <span>24.500 € verfügbar</span>
          </div>
        </div>
        
        {/* Cost Categories */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <Building className="w-4 h-4 text-orange-400" />
              </div>
              <span className="text-sm font-medium text-gray-300">Rohbau</span>
            </div>
            <p className="text-white font-semibold">180.000 €</p>
            <span className="text-xs text-green-400">✓ Abgeschlossen</span>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Wrench className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-sm font-medium text-gray-300">Sanitär</span>
            </div>
            <p className="text-white font-semibold">45.000 €</p>
            <span className="text-xs text-yellow-400">In Bearbeitung</span>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-purple-400" />
              </div>
              <span className="text-sm font-medium text-gray-300">Elektrik</span>
            </div>
            <p className="text-white font-semibold">32.000 €</p>
            <span className="text-xs text-orange-400">Ausstehend</span>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-pink-500/20 rounded-lg flex items-center justify-center">
                <Brush className="w-4 h-4 text-pink-400" />
              </div>
              <span className="text-sm font-medium text-gray-300">Maler</span>
            </div>
            <p className="text-white font-semibold">18.500 €</p>
            <span className="text-xs text-gray-400">Geplant</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TodoMockup({ variant = 'bautraeger' }: ProjectMockupProps) {
  const todos = variant === 'bautraeger'
    ? [
        { id: 1, title: 'Baugenehmigung einreichen', priority: 'high', due: 'Heute', category: 'Genehmigung' },
        { id: 2, title: 'Angebote für Elektrik bewerten', priority: 'medium', due: 'Morgen', category: 'Ausschreibung' },
        { id: 3, title: 'Baustellentermin vereinbaren', priority: 'medium', due: '3 Tage', category: 'Koordination' },
        { id: 4, title: 'Fortschrittsbericht erstellen', priority: 'low', due: '1 Woche', category: 'Dokumentation' }
      ]
    : [
        { id: 1, title: 'Kostenschätzung Sanitärprojekt', priority: 'high', due: 'Heute', project: 'Wohnanlage Süd' },
        { id: 2, title: 'Material für nächste Woche bestellen', priority: 'medium', due: '2 Tage', project: 'Bürogebäude' },
        { id: 3, title: 'Rechnung Projekt Musterstraße', priority: 'medium', due: '4 Tage', project: 'Wohnanlage Musterstraße' },
        { id: 4, title: 'Wartungstermin vereinbaren', priority: 'low', due: '1 Woche', project: 'Verschiedene' }
      ];

  return (
    <div className="bg-gradient-to-br from-[#2c3539] to-[#1a1a2e] rounded-xl p-6 shadow-xl border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <CheckSquare className="w-5 h-5 text-white" />
          </div>
          <h3 className="font-bold text-white text-lg">
            {variant === 'bautraeger' ? 'Aufgaben & Termine' : 'Ihre Aufgaben'}
          </h3>
        </div>
        <span className="text-gray-400 text-sm">{todos.length} offen</span>
      </div>

      <div className="space-y-3">
        {todos.map(todo => (
          <div key={todo.id} className="bg-gray-800/50 rounded-lg p-4 border border-gray-600 hover:border-gray-500 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <div className="w-5 h-5 border-2 border-gray-500 rounded mt-0.5"></div>
                <div className="flex-1">
                  <h4 className="font-semibold text-white mb-1">{todo.title}</h4>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {todo.due}
                    </span>
                    <span className="flex items-center">
                      <Archive className="w-4 h-4 mr-1" />
                      {variant === 'bautraeger' ? todo.category : todo.project}
                    </span>
                  </div>
                </div>
              </div>
              <div className="ml-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  todo.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                  todo.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {todo.priority === 'high' ? 'Hoch' :
                   todo.priority === 'medium' ? 'Mittel' : 'Niedrig'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function GeoMapMockup({ variant = 'bautraeger' }: ProjectMockupProps) {
  return (
    <div className="bg-gradient-to-br from-[#2c3539] to-[#1a1a2e] rounded-xl shadow-xl border border-gray-700 overflow-hidden">
      {/* Map Header */}
      <div className="bg-gradient-to-r from-[#ffbd59] to-[#ffa726] p-4 text-[#2c3539]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Map className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Aufträge in Ihrer Nähe</h3>
              <p className="text-sm opacity-80">12 Ausschreibungen gefunden</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
              <Filter className="w-4 h-4" />
            </button>
            <button className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Map Area */}
      <div className="relative h-64 bg-gradient-to-br from-green-50 to-blue-50">
        {/* Simplified map background */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-blue-100">
          {/* Map grid pattern */}
          <svg className="w-full h-full opacity-20" viewBox="0 0 400 300">
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#94a3b8" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
          
          {/* Map markers */}
          <div className="absolute top-4 left-8">
            <div className="relative group cursor-pointer">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                <Building className="w-4 h-4 text-white" />
              </div>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap">
                  Dacharbeiten • 25k € • 5km
                </div>
              </div>
            </div>
          </div>
          
          <div className="absolute top-12 right-12">
            <div className="relative group cursor-pointer">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                <Hammer className="w-4 h-4 text-white" />
              </div>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap">
                  Sanitär • 42k € • 8km
                </div>
              </div>
            </div>
          </div>
          
          <div className="absolute bottom-8 left-12">
            <div className="relative group cursor-pointer">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center shadow-lg">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap">
                  Elektrik • 38k € • 12km
                </div>
              </div>
            </div>
          </div>
          
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="relative group cursor-pointer">
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                <Wrench className="w-4 h-4 text-white" />
              </div>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap">
                Heizung • 55k € • 3km
                <div className="text-center mt-1">
                  <span className="bg-green-500 text-white px-2 py-0.5 rounded text-xs">
                    Angebot möglich!
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Your location indicator */}
          <div className="absolute bottom-4 right-4">
            <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
        
        {/* Map controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <button className="w-8 h-8 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50">
            +
          </button>
          <button className="w-8 h-8 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50">
            -
          </button>
          <button className="w-8 h-8 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50">
            <Navigation className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Map Info Panel */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between text-white">
          <span className="text-sm font-medium">Radius: 15 km</span>
          <span className="text-sm text-gray-400">Letzte Aktualisierung: vor 2 Min</span>
        </div>
        
        {/* Quick stats */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-blue-500/20 rounded-lg p-2 text-center">
            <div className="w-6 h-6 bg-blue-500/30 rounded-full mx-auto mb-1 flex items-center justify-center">
              <Building className="w-3 h-3 text-blue-400" />
            </div>
            <div className="text-xs text-blue-400 font-medium">3 Hochbau</div>
          </div>
          <div className="bg-green-500/20 rounded-lg p-2 text-center">
            <div className="w-6 h-6 bg-green-500/30 rounded-full mx-auto mb-1 flex items-center justify-center">
              <Hammer className="w-3 h-3 text-green-400" />
            </div>
            <div className="text-xs text-green-400 font-medium">5 Sanitär</div>
          </div>
          <div className="bg-purple-500/20 rounded-lg p-2 text-center">
            <div className="w-6 h-6 bg-purple-500/30 rounded-full mx-auto mb-1 flex items-center justify-center">
              <Zap className="w-3 h-3 text-purple-400" />
            </div>
            <div className="text-xs text-purple-400 font-medium">2 Elektrik</div>
          </div>
          <div className="bg-orange-500/20 rounded-lg p-2 text-center">
            <div className="w-6 h-6 bg-orange-500/30 rounded-full mx-auto mb-1 flex items-center justify-center">
              <Wrench className="w-3 h-3 text-orange-400" />
            </div>
            <div className="text-xs text-orange-400 font-medium">2 Heizung</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TabsMockup({ variant = 'bautraeger' }: ProjectMockupProps) {
  return (
    <div className="bg-gradient-to-br from-[#2c3539] to-[#1a1a2e] rounded-xl p-6 shadow-xl border border-gray-700 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-lg flex items-center justify-center">
            <Bell className="w-5 h-5 text-[#2c3539]" />
          </div>
          <h3 className="font-bold text-white text-lg">Rechte Seitenleiste</h3>
        </div>
        <span className="text-gray-400 text-sm">Immer verfügbar</span>
      </div>

      {/* Mockup of right side tabs */}
      <div className="relative h-80 bg-gradient-to-br from-gray-800/30 to-gray-900/30 rounded-lg border border-gray-600 overflow-hidden">
        {/* Background representing the main interface */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-700/20 to-gray-800/20">
          <div className="p-4 space-y-2">
            <div className="h-4 bg-gray-600/30 rounded w-3/4"></div>
            <div className="h-4 bg-gray-600/30 rounded w-1/2"></div>
            <div className="h-4 bg-gray-600/30 rounded w-2/3"></div>
          </div>
        </div>
        
        {/* Right side tabs mockup */}
        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 space-y-2">
          {/* Notification Tab (Bauträger) */}
          <div className="relative">
            <div className="bg-gradient-to-r from-[#ffbd59]/80 to-[#f59e0b]/80 rounded-l-lg px-3 py-4 text-white shadow-xl animate-pulse">
              <div className="flex flex-col items-center gap-2">
                <Calendar className="w-5 h-5" />
                <div className="bg-white text-green-600 rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold">
                  3
                </div>
                <ChevronLeft className="w-4 h-4" />
              </div>
            </div>
            <div className="absolute right-full top-1/2 transform -translate-y-1/2 mr-2">
              <div className="bg-gray-900/95 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap border border-[#ffbd59]/50">
                Benachrichtigungen
                <div className="text-[#ffbd59] font-medium">3 neue Angebote</div>
              </div>
            </div>
          </div>
          
          {/* Notification Tab (Dienstleister) - positioned slightly higher */}
          <div className="relative -mt-1">
            <div className="bg-gradient-to-r from-[#ffbd59]/60 to-[#f59e0b]/60 rounded-l-lg px-3 py-4 text-white shadow-xl">
              <div className="flex flex-col items-center gap-2">
                <Bell className="w-5 h-5" />
                <div className="bg-white bg-opacity-90 text-gray-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium">
                  2
                </div>
                <ChevronLeft className="w-4 h-4" />
              </div>
            </div>
            <div className="absolute right-full top-1/2 transform -translate-y-1/2 mr-2">
              <div className="bg-gray-900/95 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap border border-[#ffbd59]/50">
                Terminanfragen
                <div className="text-[#ffbd59] font-medium">2 ausstehend</div>
              </div>
            </div>
          </div>
          
          {/* Document Tab */}
          <div className="relative">
            <div className="bg-gradient-to-r from-[#ffbd59]/60 to-[#f59e0b]/60 rounded-l-lg px-3 py-4 text-white shadow-xl">
              <div className="flex flex-col items-center gap-2">
                <Files className="w-5 h-5" />
                <div className="bg-white/95 text-[#f59e0b] rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold">
                  12
                </div>
              </div>
            </div>
            <div className="absolute right-full top-1/2 transform -translate-y-1/2 mr-2">
              <div className="bg-gray-900/95 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap border border-[#ffbd59]/50">
                Dokumente
                <div className="text-[#ffbd59] font-medium">12 verfügbar</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Arrow pointing to tabs */}
        <div className="absolute right-20 top-1/2 transform -translate-y-1/2">
          <div className="flex items-center gap-2 text-[#ffbd59]">
            <ArrowRight className="w-6 h-6 animate-bounce" />
            <div className="bg-[#ffbd59]/20 text-[#ffbd59] px-3 py-2 rounded-lg text-sm font-medium border border-[#ffbd59]/50">
              Immer hier zu finden!
            </div>
          </div>
        </div>
      </div>
      
      {/* Info boxes */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium text-green-300">Benachrichtigungen</span>
          </div>
          <p className="text-xs text-green-200">Neue Angebote, Terminantworten und wichtige Updates</p>
        </div>
        
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-blue-300">Terminanfragen</span>
          </div>
          <p className="text-xs text-blue-200">Dienstleister-Antworten auf Ihre Terminvorschläge</p>
        </div>
        
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Files className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium text-purple-300">Dokumente</span>
          </div>
          <p className="text-xs text-purple-200">Alle Projektdokumente übersichtlich sortiert</p>
        </div>
      </div>
    </div>
  );
}

export function KanbanMockup({ variant = 'bautraeger' }: ProjectMockupProps) {
  const columns = [
    {
      title: 'Zu erledigen',
      color: 'border-gray-500',
      tasks: variant === 'bautraeger' 
        ? [
            { id: 1, title: 'Baugenehmigung prüfen', priority: 'high', assignee: 'M. Schmidt' },
            { id: 2, title: 'Angebote vergleichen', priority: 'medium', assignee: 'K. Müller' }
          ]
        : [
            { id: 1, title: 'Materialbestellung Projekt A', priority: 'high', project: 'Wohnanlage Süd' },
            { id: 2, title: 'Kostenschätzung erstellen', priority: 'medium', project: 'Bürogebäude' }
          ]
    },
    {
      title: 'In Bearbeitung',
      color: 'border-yellow-500',
      tasks: variant === 'bautraeger'
        ? [
            { id: 3, title: 'Rohbau-Inspektion', priority: 'high', assignee: 'T. Weber' },
          ]
        : [
            { id: 3, title: 'Sanitärarbeiten Musterstraße', priority: 'high', project: 'Wohnanlage Musterstraße' },
          ]
    },
    {
      title: 'Abgeschlossen',
      color: 'border-green-500',
      tasks: variant === 'bautraeger'
        ? [
            { id: 4, title: 'Fundament-Abnahme', priority: 'medium', assignee: 'A. Fischer' },
            { id: 5, title: 'Statikprüfung', priority: 'low', assignee: 'R. Braun' }
          ]
        : [
            { id: 4, title: 'Elektroinstallation Büro', priority: 'medium', project: 'Bürogebäude Zentrum' },
            { id: 5, title: 'Wartung Heizsystem', priority: 'low', project: 'Verschiedene' }
          ]
    }
  ];

  return (
    <div className="bg-gradient-to-br from-[#2c3539] to-[#1a1a2e] rounded-xl p-6 shadow-xl border border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
            <CheckSquare className="w-5 h-5 text-white" />
          </div>
          <h3 className="font-bold text-white text-lg">Kanban Board</h3>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1 bg-gray-700 text-gray-300 rounded-lg text-sm hover:bg-gray-600 transition-colors">
            Filter
          </button>
          <button className="px-3 py-1 bg-[#ffbd59] text-[#2c3539] rounded-lg text-sm font-medium hover:bg-[#ffa726] transition-colors">
            + Neue Aufgabe
          </button>
        </div>
      </div>
      
      {/* Kanban Columns */}
      <div className="grid grid-cols-3 gap-4">
        {columns.map((column, columnIndex) => (
          <div key={columnIndex} className={`bg-gray-800/30 rounded-lg border-t-4 ${column.color} overflow-hidden`}>
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-white">{column.title}</h4>
                <span className="bg-gray-600 text-gray-300 px-2 py-1 rounded-full text-xs">
                  {column.tasks.length}
                </span>
              </div>
            </div>
            
            <div className="p-2 space-y-3 min-h-[200px]">
              {column.tasks.map((task, taskIndex) => (
                <div 
                  key={task.id} 
                  className="bg-gray-800 border border-gray-600 rounded-lg p-3 cursor-move hover:border-gray-500 transition-colors group"
                  style={{
                    transform: columnIndex === 1 && taskIndex === 0 ? 'rotate(-2deg) scale(1.02)' : 'none',
                    boxShadow: columnIndex === 1 && taskIndex === 0 ? '0 8px 20px rgba(0,0,0,0.3)' : 'none'
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h5 className="text-sm font-medium text-white leading-tight">{task.title}</h5>
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        task.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                        task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {task.priority === 'high' ? 'Hoch' :
                         task.priority === 'medium' ? 'Mittel' : 'Niedrig'}
                      </span>
                    </div>
                    
                    <div className="text-xs text-gray-400">
                      {variant === 'bautraeger' ? task.assignee : task.project}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Drop zone indicator */}
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center opacity-0 hover:opacity-100 transition-opacity">
                <div className="text-xs text-gray-500">
                  Aufgabe hierhin ziehen
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Drag & Drop hint */}
      <div className="mt-4 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 px-3 py-2 rounded-lg text-sm">
          <ArrowRight className="w-4 h-4" />
          Ziehen Sie Aufgaben zwischen den Spalten per Drag & Drop
        </div>
      </div>
    </div>
  );
}
