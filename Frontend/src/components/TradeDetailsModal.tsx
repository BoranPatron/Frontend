import React, { useState, useEffect } from 'react';
import { X, MapPin, Calendar, Euro, Building, User, Clock, CheckCircle, AlertTriangle, Plus, Eye, FileText, Download, ExternalLink } from 'lucide-react';
import type { TradeSearchResult } from '../api/geoService';
// import { getQuotesByTrade } from '../api/quoteService';
import { useAuth } from '../context/AuthContext';
import CostEstimateForm from './CostEstimateForm';
// import FullDocumentViewer from './DocumentViewer';

interface TradeDetailsModalProps {
  trade: TradeSearchResult | null;
  isOpen: boolean;
  onClose: () => void;
  onCreateQuote: (trade: TradeSearchResult) => void;
}

interface Quote {
  id: number;
  service_provider_id: number;
  status: string;
  total_price: number;
  created_at: string;
  service_provider_name?: string;
}

interface DocumentViewerProps {
  documents: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
}

function TradeDocumentViewer({ documents }: DocumentViewerProps) {
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [viewerError, setViewerError] = useState<string | null>(null);
  const [documentViewerOpen, setDocumentViewerOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);

  if (!documents || documents.length === 0) {
    return (
      <div className="bg-gradient-to-br from-[#2c3539]/30 to-[#1a1a2e]/30 rounded-xl p-6 border border-gray-600/30 backdrop-blur-sm">
        <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
          <FileText size={18} className="text-[#ffbd59]" />
          Dokumente
        </h3>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <FileText size={48} className="text-gray-500 mx-auto mb-3 opacity-50" />
            <p className="text-gray-400 text-sm">Keine Dokumente für dieses Gewerk freigegeben</p>
            <p className="text-gray-500 text-xs mt-1">Dokumente werden nach Angebotsannahme verfügbar</p>
          </div>
        </div>
      </div>
    );
  }

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('presentation') || type.includes('powerpoint')) return '📊';
    return '📁';
  };

  const canPreview = (type: string) => {
    return type.includes('pdf') || 
           type.includes('word') || 
           type.includes('document') ||
           type.includes('presentation') || 
           type.includes('powerpoint');
  };

  const getViewerUrl = (url: string, type: string) => {
    console.log('🔧 getViewerUrl called with:', { url, type });
    
    // Für PDF-Dateien direkte Einbettung
    if (type.includes('pdf')) {
      console.log('📄 PDF detected, using direct URL:', url);
      return url;
    }
    
    // Für Office-Dokumente verwenden wir Office Online Viewer
    if (type.includes('word') || type.includes('document') || 
        type.includes('presentation') || type.includes('powerpoint')) {
      // Stelle sicher, dass die URL vollständig ist
      const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;
      const viewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fullUrl)}`;
      console.log('📄 Office document detected, using viewer:', viewerUrl);
      return viewerUrl;
    }
    
    console.log('📄 Default URL used:', url);
    return url;
  };

  return (
    <div className="bg-gradient-to-br from-[#2c3539]/30 to-[#1a1a2e]/30 rounded-xl p-6 border border-gray-600/30 backdrop-blur-sm">
      <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
        <FileText size={18} className="text-[#ffbd59]" />
        Dokumente ({documents.length})
      </h3>
      
      <div className="space-y-3">
        {documents.map((doc) => (
          <div key={doc.id} className="bg-gradient-to-br from-[#1a1a2e]/50 to-[#2c3539]/50 rounded-lg border border-gray-600/30 p-4 hover:border-[#ffbd59]/50 transition-all duration-200 group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-lg flex items-center justify-center text-white font-bold shadow-lg">
                  {getFileIcon(doc.type)}
                </div>
                <div>
                  <p className="font-medium text-white group-hover:text-[#ffbd59] transition-colors">{doc.name}</p>
                  <p className="text-sm text-gray-400">
                    {(doc.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {canPreview(doc.type) && (
                  <button
                    onClick={() => {
                      console.log('🔧 Ansehen Button clicked for document:', doc);
                      // Temporär deaktiviert - öffne in neuem Tab
                      window.open(doc.url, '_blank');
                    }}
                    className="flex items-center gap-1 px-3 py-2 bg-[#ffbd59]/20 text-[#ffbd59] hover:bg-[#ffbd59]/30 rounded-lg transition-all duration-200 text-sm font-medium"
                    title="Dokument im Vollbild anzeigen"
                  >
                    <Eye size={14} />
                    Ansehen
                  </button>
                )}
                <a
                  href={doc.url}
                  download={doc.name}
                  className="flex items-center gap-1 px-3 py-2 bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/30 transition-all duration-200 text-sm font-medium"
                  title="Dokument herunterladen"
                >
                  <Download size={14} />
                  Download
                </a>
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-all duration-200 text-sm font-medium"
                  title="In neuem Tab öffnen"
                >
                  <ExternalLink size={14} />
                  Öffnen
                </a>
              </div>
            </div>

          </div>
        ))}
      </div>
      
      {/* DocumentViewer Modal - Temporär deaktiviert */}
      {/* {documentViewerOpen && selectedDocument && (
        <div className="fixed inset-0 z-[60]">
          <FullDocumentViewer 
            document={selectedDocument} 
            onClose={() => {
              setDocumentViewerOpen(false);
              setSelectedDocument(null);
            }} 
          />
        </div>
      )} */}
    </div>
  );
}

export default function TradeDetailsModal({ 
  trade, 
  isOpen, 
  onClose, 
  onCreateQuote 
}: TradeDetailsModalProps) {
  const { user } = useAuth();
  const [existingQuotes, setExistingQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCostEstimateForm, setShowCostEstimateForm] = useState(false);
  const [userHasQuote, setUserHasQuote] = useState(false);
  const [userQuote, setUserQuote] = useState<Quote | null>(null);

  // Lade existierende Angebote für das Gewerk
  useEffect(() => {
    if (trade && isOpen) {
      loadExistingQuotes();
    }
  }, [trade, isOpen]);

  const loadExistingQuotes = async () => {
    if (!trade) return;
    
    setLoading(true);
    try {
      // TODO: Implementiere getQuotesByTrade API-Call
      // const quotes = await getQuotesByTrade(trade.id);
      const quotes: Quote[] = []; // Temporär leer
      setExistingQuotes(quotes);
      
      // Prüfe ob aktueller User bereits ein Angebot abgegeben hat
      const currentUserQuote = quotes.find((q: Quote) => q.service_provider_id === user?.id);
      setUserHasQuote(!!currentUserQuote);
      setUserQuote(currentUserQuote || null);
      
      console.log('📋 Angebote geladen:', { 
        total: quotes.length, 
        userHasQuote: !!currentUserQuote,
        userQuote: currentUserQuote 
      });
    } catch (error) {
      console.error('❌ Fehler beim Laden der Angebote:', error);
      setExistingQuotes([]);
      setUserHasQuote(false);
      setUserQuote(null);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    const iconMap: { [key: string]: { color: string; icon: React.ReactNode } } = {
      'electrical': { color: '#fbbf24', icon: <span className="text-lg">⚡</span> },
      'plumbing': { color: '#3b82f6', icon: <span className="text-lg">🔧</span> },
      'heating': { color: '#ef4444', icon: <span className="text-lg">🔥</span> },
      'roofing': { color: '#f97316', icon: <span className="text-lg">🏠</span> },
      'windows': { color: '#10b981', icon: <span className="text-lg">🪟</span> },
      'flooring': { color: '#8b5cf6', icon: <span className="text-lg">📐</span> },
      'walls': { color: '#ec4899', icon: <span className="text-lg">🧱</span> },
      'foundation': { color: '#6b7280', icon: <span className="text-lg">🏗️</span> },
      'landscaping': { color: '#22c55e', icon: <span className="text-lg">🌱</span> }
    };
    return iconMap[category] || { color: '#6b7280', icon: <span className="text-lg">🔨</span> };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-blue-100 text-blue-800';
      case 'cost_estimate': return 'bg-yellow-100 text-yellow-800';
      case 'tender': return 'bg-purple-100 text-purple-800';
      case 'bidding': return 'bg-orange-100 text-orange-800';
      case 'evaluation': return 'bg-pink-100 text-pink-800';
      case 'awarded': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-cyan-100 text-cyan-800';
      case 'completed': return 'bg-emerald-100 text-emerald-800';
      case 'delayed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'planning': return 'Planung';
      case 'cost_estimate': return 'Kostenvoranschlag';
      case 'tender': return 'Ausschreibung';
      case 'bidding': return 'Angebote';
      case 'evaluation': return 'Bewertung';
      case 'awarded': return 'Vergeben';
      case 'in_progress': return 'In Bearbeitung';
      case 'completed': return 'Abgeschlossen';
      case 'delayed': return 'Verzögert';
      case 'cancelled': return 'Storniert';
      default: return status;
    }
  };

  const getQuoteStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'under_review': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'withdrawn': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getQuoteStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'Entwurf';
      case 'submitted': return 'Eingereicht';
      case 'under_review': return 'In Prüfung';
      case 'accepted': return 'Angenommen';
      case 'rejected': return 'Abgelehnt';
      case 'withdrawn': return 'Zurückgezogen';
      default: return status;
    }
  };

  // Mapping-Tabelle für englische zu deutschen Begriffen
  const fieldTranslations: { [key: string]: string } = {
    // Elektro
    'electrical_outlets': 'Elektrische Steckdosen',
    'electrical_switches': 'Elektrische Schalter',
    'electrical_lighting': 'Elektrische Beleuchtung',
    'electrical_wiring': 'Elektrische Verkabelung',
    'electrical_panel': 'Elektrischer Verteiler',
    'electrical_safety': 'Elektrische Sicherheit',
    'electrical_grounding': 'Elektrische Erdung',
    'electrical_circuits': 'Elektrische Schaltkreise',
    
    // Sanitär
    'plumbing_fixtures': 'Sanitäranlagen',
    'plumbing_pipes': 'Sanitärrohre',
    'plumbing_sewage_system': 'Abwassersystem',
    'plumbing_water_heater': 'Warmwasserbereiter',
    'plumbing_water_supply': 'Wasserversorgung',
    'plumbing_drainage': 'Entwässerung',
    'plumbing_ventilation': 'Lüftung',
    'plumbing_water_pressure': 'Wasserdruck',
    
    // Heizung
    'heating_boiler': 'Heizkessel',
    'heating_radiators': 'Heizkörper',
    'heating_thermostats': 'Thermostate',
    'heating_pipes': 'Heizungsrohre',
    'heating_controls': 'Heizungssteuerung',
    'heating_insulation': 'Heizungsdämmung',
    'heating_efficiency': 'Heizungseffizienz',
    'heating_fuel_type': 'Brennstoffart',
    
    // Dach
    'roofing_material': 'Dachmaterial',
    'roofing_insulation': 'Dachdämmung',
    'roofing_gutters': 'Dachrinnen',
    'roofing_flashing': 'Dachabdichtung',
    'roofing_ventilation': 'Dachlüftung',
    'roofing_slope': 'Dachneigung',
    'roofing_waterproofing': 'Dachwasserabdichtung',
    'roofing_snow_guards': 'Schneefang',
    
    // Fenster & Türen
    'windows_type': 'Fenstertyp',
    'windows_material': 'Fenstermaterial',
    'windows_glazing': 'Fensterglas',
    'windows_insulation': 'Fensterdämmung',
    'doors_type': 'Türentyp',
    'doors_material': 'Türmaterial',
    'doors_insulation': 'Türdämmung',
    'doors_hardware': 'Türbeschläge',
    
    // Boden
    'flooring_material': 'Bodenbelag',
    'flooring_subfloor': 'Unterboden',
    'flooring_insulation': 'Bodendämmung',
    'flooring_finish': 'Bodenveredelung',
    'flooring_pattern': 'Bodenmuster',
    'flooring_durability': 'Bodenbeständigkeit',
    'flooring_maintenance': 'Bodenwartung',
    'flooring_installation': 'Bodenverlegung',
    
    // Wände
    'walls_material': 'Wandmaterial',
    'walls_insulation': 'Wanddämmung',
    'walls_finish': 'Wandveredelung',
    'walls_structure': 'Wandkonstruktion',
    'walls_moisture': 'Wandfeuchtigkeit',
    'walls_acoustics': 'Wandakustik',
    'walls_fire_resistance': 'Wandbrandschutz',
    'walls_load_bearing': 'Wandtragfähigkeit',
    
    // Fundament
    'foundation_type': 'Fundamenttyp',
    'foundation_material': 'Fundamentmaterial',
    'foundation_depth': 'Fundamenttiefe',
    'foundation_waterproofing': 'Fundamentabdichtung',
    'foundation_insulation': 'Fundamentdämmung',
    'foundation_drainage': 'Fundamententwässerung',
    'foundation_soil': 'Fundamentboden',
    'foundation_stability': 'Fundamentstabilität',
    
    // Garten
    'landscaping_plants': 'Gartenpflanzen',
    'landscaping_irrigation': 'Gartenbewässerung',
    'landscaping_lighting': 'Gartenbeleuchtung',
    'landscaping_paths': 'Gartenwege',
    'landscaping_soil': 'Gartenboden',
    'landscaping_drainage': 'Gartenentwässerung',
    'landscaping_maintenance': 'Gartenwartung',
    'landscaping_seasonal': 'Gartensaisonal',
    
    // Allgemeine Begriffe
    'quantity': 'Menge',
    'size': 'Größe',
    'dimensions': 'Abmessungen',
    'weight': 'Gewicht',
    'color': 'Farbe',
    'brand': 'Marke',
    'model': 'Modell',
    'warranty': 'Garantie',
    'installation': 'Installation',
    'maintenance': 'Wartung',
    'safety': 'Sicherheit',
    'quality': 'Qualität',
    'durability': 'Haltbarkeit',
    'efficiency': 'Effizienz',
    'cost': 'Kosten',
    'budget': 'Budget',
    'timeline': 'Zeitplan',
    'requirements': 'Anforderungen',
    'specifications': 'Spezifikationen',
    'standards': 'Standards',
    'regulations': 'Vorschriften',
    'certifications': 'Zertifizierungen',
    'inspections': 'Prüfungen',
    'testing': 'Tests',
    'approval': 'Genehmigung',
    'documentation': 'Dokumentation',
    'training': 'Schulung',
    'support': 'Support',
    'service': 'Service',
    'repair': 'Reparatur',
    'replacement': 'Ersatz',
    'upgrade': 'Upgrade',
    'modification': 'Modifikation',
    'customization': 'Anpassung',
    'integration': 'Integration',
    'compatibility': 'Kompatibilität',
    'performance': 'Leistung',
    'reliability': 'Zuverlässigkeit',
    'availability': 'Verfügbarkeit',
    'accessibility': 'Zugänglichkeit',
    'usability': 'Benutzerfreundlichkeit',
    'functionality': 'Funktionalität',
    'versatility': 'Vielseitigkeit',
    'flexibility': 'Flexibilität',
    'scalability': 'Skalierbarkeit',
    'expandability': 'Erweiterbarkeit',
    'modularity': 'Modularität',
    'standardization': 'Standardisierung',
    'optimization': 'Optimierung',
    'automation': 'Automatisierung',
    'digitalization': 'Digitalisierung',
    'connectivity': 'Konnektivität',
    'wireless': 'Drahtlos',
    'smart': 'Intelligent',
    'automated': 'Automatisiert',
    'manual': 'Manuell',
    'automatic': 'Automatisch',
    'semi_automatic': 'Halbautomatisch',
    'remote_controlled': 'Fernsteuerung',
    'programmable': 'Programmierbar',
    'configurable': 'Konfigurierbar',
    'adjustable': 'Einstellbar',
    'fixed': 'Fest',
    'portable': 'Tragbar',
    'stationary': 'Stationär',
    'mobile': 'Mobil',
    'permanent': 'Dauerhaft',
    'temporary': 'Temporär',
    'emergency': 'Notfall',
    'backup': 'Backup',
    'redundant': 'Redundant',
    'fail_safe': 'Ausfallsicher',
    'high_availability': 'Hohe Verfügbarkeit',
    'continuous_operation': 'Dauerbetrieb',
    'intermittent_use': 'Unterbrochener Betrieb',
    'peak_load': 'Spitzenlast',
    'normal_load': 'Normallast',
    'minimum_load': 'Mindestlast',
    'maximum_load': 'Maximallast',
    'rated_capacity': 'Nennkapazität',
    'actual_capacity': 'Tatsächliche Kapazität',
    'efficiency_rating': 'Effizienzbewertung',
    'energy_consumption': 'Energieverbrauch',
    'power_consumption': 'Leistungsaufnahme',
    'fuel_consumption': 'Brennstoffverbrauch',
    'water_consumption': 'Wasserverbrauch',
    'air_consumption': 'Luftverbrauch',
    'heat_output': 'Wärmeleistung',
    'cooling_capacity': 'Kühlleistung',
    'heating_capacity': 'Heizleistung',
    'ventilation_rate': 'Lüftungsrate',
    'air_flow': 'Luftstrom',
    'water_flow': 'Wasserstrom',
    'pressure_drop': 'Druckverlust',
    'temperature_range': 'Temperaturbereich',
    'humidity_range': 'Feuchtigkeitsbereich',
    'noise_level': 'Geräuschpegel',
    'vibration_level': 'Vibrationspegel',
    'emission_level': 'Emissionspegel',
    'pollution_level': 'Verschmutzungsgrad',
    'contamination_level': 'Kontaminationsgrad',
    'cleanliness_requirement': 'Sauberkeitsanforderung',
    'sterility_requirement': 'Sterilitätsanforderung',
    'hygiene_requirement': 'Hygieneanforderung',
    'sanitation_requirement': 'Sanitäranforderung',
    'disinfection_requirement': 'Desinfektionsanforderung',
    'decontamination_requirement': 'Dekontaminationsanforderung',
    'purification_requirement': 'Reinigungsanforderung',
    'filtration_requirement': 'Filteranforderung',
    'separation_requirement': 'Trennungsanforderung',
    'isolation_requirement': 'Isolationsanforderung',
    'containment_requirement': 'Eindämmungsanforderung',
    'confinement_requirement': 'Einschlussanforderung',
    'enclosure_requirement': 'Gehäuseanforderung',
    'protection_requirement': 'Schutzanforderung',
    'safety_requirement': 'Sicherheitsanforderung',
    'security_requirement': 'Sicherheitsanforderung',
    'access_control': 'Zugangskontrolle',
    'surveillance': 'Überwachung',
    'monitoring': 'Überwachung',
    'supervision': 'Aufsicht',
    'inspection': 'Prüfung',
    'examination': 'Untersuchung',
    'assessment': 'Bewertung',
    'evaluation': 'Evaluierung',
    'analysis': 'Analyse',
    'verification': 'Verifizierung',
    'validation': 'Validierung',
    'certification': 'Zertifizierung',
    'accreditation': 'Akkreditierung',
    'authorization': 'Autorisierung',
    'permission': 'Erlaubnis',
    'license': 'Lizenz',
    'permit': 'Genehmigung',
    'registration': 'Registrierung',
    'notification': 'Benachrichtigung',
    'declaration': 'Erklärung',
    'statement': 'Aussage',
    'report': 'Bericht',
    'record': 'Aufzeichnung',
    'log': 'Protokoll',
    'history': 'Historie',
    'tracking': 'Verfolgung',
    'tracing': 'Rückverfolgung',
    'audit': 'Audit',
    'review': 'Überprüfung',
    'check': 'Prüfung',
    'control': 'Kontrolle',
    'measurement': 'Messung',
    'calibration': 'Kalibrierung',
    'adjustment': 'Einstellung',
    'alignment': 'Ausrichtung',
    'leveling': 'Nivellierung',
    'balancing': 'Auswuchtung',
    'tuning': 'Abstimmung',
    'fine_tuning': 'Feinabstimmung',
    'coarse_adjustment': 'Grobeinstellung',
    'precise_adjustment': 'Präziseinstellung',
    'rough_adjustment': 'Rauheinstellung',
    'smooth_adjustment': 'Sanfteinstellung',
    'gradual_adjustment': 'Schrittweise Einstellung',
    'step_by_step_adjustment': 'Schritt-für-Schritt Einstellung',
    'incremental_adjustment': 'Inkrementelle Einstellung',
    'progressive_adjustment': 'Progressive Einstellung',
    'regressive_adjustment': 'Regressive Einstellung',
    'linear_adjustment': 'Lineare Einstellung',
    'non_linear_adjustment': 'Nicht-lineare Einstellung',
    'exponential_adjustment': 'Exponentielle Einstellung',
    'logarithmic_adjustment': 'Logarithmische Einstellung',
    'sine_adjustment': 'Sinus-Einstellung',
    'cosine_adjustment': 'Cosinus-Einstellung',
    'tangent_adjustment': 'Tangens-Einstellung',
    'arc_sine_adjustment': 'Arcsinus-Einstellung',
    'arc_cosine_adjustment': 'Arccosinus-Einstellung',
    'arc_tangent_adjustment': 'Arctangens-Einstellung',
    'hyperbolic_adjustment': 'Hyperbolische Einstellung',
    'inverse_hyperbolic_adjustment': 'Inverse hyperbolische Einstellung',
    'bessel_adjustment': 'Bessel-Einstellung',
    'legendre_adjustment': 'Legendre-Einstellung',
    'hermite_adjustment': 'Hermite-Einstellung',
    'laguerre_adjustment': 'Laguerre-Einstellung',
    'chebyshev_adjustment': 'Tschebyscheff-Einstellung',
    'jacobi_adjustment': 'Jacobi-Einstellung',
    'ultraspherical_adjustment': 'Ultrasphärische Einstellung',
    'gegenbauer_adjustment': 'Gegenbauer-Einstellung',
    'meixner_adjustment': 'Meixner-Einstellung',
    'krawtchouk_adjustment': 'Krawtchouk-Einstellung',
    'hahn_adjustment': 'Hahn-Einstellung',
    'dual_hahn_adjustment': 'Dual-Hahn-Einstellung',
    'racah_adjustment': 'Racah-Einstellung',
    'dual_racah_adjustment': 'Dual-Racah-Einstellung',
    'continuous_dual_hahn_adjustment': 'Kontinuierliche Dual-Hahn-Einstellung',
    'continuous_hahn_adjustment': 'Kontinuierliche Hahn-Einstellung',
    'continuous_racah_adjustment': 'Kontinuierliche Racah-Einstellung',
    'continuous_dual_racah_adjustment': 'Kontinuierliche Dual-Racah-Einstellung',
    'wilson_adjustment': 'Wilson-Einstellung',
    'dual_wilson_adjustment': 'Dual-Wilson-Einstellung',
    'askey_wilson_adjustment': 'Askey-Wilson-Einstellung',
    'dual_askey_wilson_adjustment': 'Dual-Askey-Wilson-Einstellung',
    'q_racah_adjustment': 'q-Racah-Einstellung',
    'dual_q_racah_adjustment': 'Dual-q-Racah-Einstellung',
    'q_hahn_adjustment': 'q-Hahn-Einstellung',
    'dual_q_hahn_adjustment': 'Dual-q-Hahn-Einstellung',
    'q_krawtchouk_adjustment': 'q-Krawtchouk-Einstellung',
    'dual_q_krawtchouk_adjustment': 'Dual-q-Krawtchouk-Einstellung',
    'q_meixner_adjustment': 'q-Meixner-Einstellung',
    'dual_q_meixner_adjustment': 'Dual-q-Meixner-Einstellung',
    'q_gegenbauer_adjustment': 'q-Gegenbauer-Einstellung',
    'dual_q_gegenbauer_adjustment': 'Dual-q-Gegenbauer-Einstellung',
    'q_ultraspherical_adjustment': 'q-Ultrasphärische Einstellung',
    'dual_q_ultraspherical_adjustment': 'Dual-q-Ultrasphärische Einstellung',
    'q_jacobi_adjustment': 'q-Jacobi-Einstellung',
    'dual_q_jacobi_adjustment': 'Dual-q-Jacobi-Einstellung',
    'q_legendre_adjustment': 'q-Legendre-Einstellung',
    'dual_q_legendre_adjustment': 'Dual-q-Legendre-Einstellung',
    'q_hermite_adjustment': 'q-Hermite-Einstellung',
    'dual_q_hermite_adjustment': 'Dual-q-Hermite-Einstellung',
    'q_laguerre_adjustment': 'q-Laguerre-Einstellung',
    'dual_q_laguerre_adjustment': 'Dual-q-Laguerre-Einstellung',
    'q_chebyshev_adjustment': 'q-Tschebyscheff-Einstellung',
    'dual_q_chebyshev_adjustment': 'Dual-q-Tschebyscheff-Einstellung',
    'q_bessel_adjustment': 'q-Bessel-Einstellung',
    'dual_q_bessel_adjustment': 'Dual-q-Bessel-Einstellung',
    'q_neumann_adjustment': 'q-Neumann-Einstellung',
    'dual_q_neumann_adjustment': 'Dual-q-Neumann-Einstellung',
    'q_hankel_adjustment': 'q-Hankel-Einstellung',
    'dual_q_hankel_adjustment': 'Dual-q-Hankel-Einstellung',
    'q_struve_adjustment': 'q-Struve-Einstellung',
    'dual_q_struve_adjustment': 'Dual-q-Struve-Einstellung',
    'q_whittaker_adjustment': 'q-Whittaker-Einstellung',
    'dual_q_whittaker_adjustment': 'Dual-q-Whittaker-Einstellung',
    'q_confluent_hypergeometric_adjustment': 'q-Konfluente hypergeometrische Einstellung',
    'dual_q_confluent_hypergeometric_adjustment': 'Dual-q-Konfluente hypergeometrische Einstellung',
    'q_hypergeometric_adjustment': 'q-Hypergeometrische Einstellung',
    'dual_q_hypergeometric_adjustment': 'Dual-q-Hypergeometrische Einstellung',
    'q_generalized_hypergeometric_adjustment': 'q-Verallgemeinerte hypergeometrische Einstellung',
    'dual_q_generalized_hypergeometric_adjustment': 'Dual-q-Verallgemeinerte hypergeometrische Einstellung',
    'q_basic_hypergeometric_adjustment': 'q-Basische hypergeometrische Einstellung',
    'dual_q_basic_hypergeometric_adjustment': 'Dual-q-Basische hypergeometrische Einstellung',
    'q_elliptic_hypergeometric_adjustment': 'q-Elliptische hypergeometrische Einstellung',
    'dual_q_elliptic_hypergeometric_adjustment': 'Dual-q-Elliptische hypergeometrische Einstellung',
    'q_modular_hypergeometric_adjustment': 'q-Modulare hypergeometrische Einstellung',
    'dual_q_modular_hypergeometric_adjustment': 'Dual-q-Modulare hypergeometrische Einstellung',
    'q_theta_adjustment': 'q-Theta-Einstellung',
    'dual_q_theta_adjustment': 'Dual-q-Theta-Einstellung',
    'q_eta_adjustment': 'q-Eta-Einstellung',
    'dual_q_eta_adjustment': 'Dual-q-Eta-Einstellung',
    'q_sigma_adjustment': 'q-Sigma-Einstellung',
    'dual_q_sigma_adjustment': 'Dual-q-Sigma-Einstellung',
    'q_zeta_adjustment': 'q-Zeta-Einstellung',
    'dual_q_zeta_adjustment': 'Dual-q-Zeta-Einstellung',
    'q_lambda_adjustment': 'q-Lambda-Einstellung',
    'dual_q_lambda_adjustment': 'Dual-q-Lambda-Einstellung',
    'q_mu_adjustment': 'q-Mu-Einstellung',
    'dual_q_mu_adjustment': 'Dual-q-Mu-Einstellung',
    'q_nu_adjustment': 'q-Nu-Einstellung',
    'dual_q_nu_adjustment': 'Dual-q-Nu-Einstellung',
    'q_xi_adjustment': 'q-Xi-Einstellung',
    'dual_q_xi_adjustment': 'Dual-q-Xi-Einstellung',
    'q_omicron_adjustment': 'q-Omicron-Einstellung',
    'dual_q_omicron_adjustment': 'Dual-q-Omicron-Einstellung',
    'q_pi_adjustment': 'q-Pi-Einstellung',
    'dual_q_pi_adjustment': 'Dual-q-Pi-Einstellung',
    'q_rho_adjustment': 'q-Rho-Einstellung',
    'dual_q_rho_adjustment': 'Dual-q-Rho-Einstellung',
    'q_tau_adjustment': 'q-Tau-Einstellung',
    'dual_q_tau_adjustment': 'Dual-q-Tau-Einstellung',
    'q_upsilon_adjustment': 'q-Upsilon-Einstellung',
    'dual_q_upsilon_adjustment': 'Dual-q-Upsilon-Einstellung',
    'q_phi_adjustment': 'q-Phi-Einstellung',
    'dual_q_phi_adjustment': 'Dual-q-Phi-Einstellung',
    'q_chi_adjustment': 'q-Chi-Einstellung',
    'dual_q_chi_adjustment': 'Dual-q-Chi-Einstellung',
    'q_psi_adjustment': 'q-Psi-Einstellung',
    'dual_q_psi_adjustment': 'Dual-q-Psi-Einstellung',
    'q_omega_adjustment': 'q-Omega-Einstellung',
    'dual_q_omega_adjustment': 'Dual-q-Omega-Einstellung',
    'q_alpha_adjustment': 'q-Alpha-Einstellung',
    'dual_q_alpha_adjustment': 'Dual-q-Alpha-Einstellung',
    'q_beta_adjustment': 'q-Beta-Einstellung',
    'dual_q_beta_adjustment': 'Dual-q-Beta-Einstellung',
    'q_gamma_adjustment': 'q-Gamma-Einstellung',
    'dual_q_gamma_adjustment': 'Dual-q-Gamma-Einstellung',
    'q_delta_adjustment': 'q-Delta-Einstellung',
    'dual_q_delta_adjustment': 'Dual-q-Delta-Einstellung',
    'q_epsilon_adjustment': 'q-Epsilon-Einstellung',
    'dual_q_epsilon_adjustment': 'Dual-q-Epsilon-Einstellung',
    'q_iota_adjustment': 'q-Iota-Einstellung',
    'dual_q_iota_adjustment': 'Dual-q-Iota-Einstellung',
    'q_kappa_adjustment': 'q-Kappa-Einstellung'
  };

  // Funktion zur Übersetzung von Feldnamen
  const translateFieldName = (fieldName: string): string => {
    // Entferne Unterstriche und ersetze sie durch Leerzeichen
    const cleanFieldName = fieldName.replace(/_/g, ' ');
    
    // Suche nach der Übersetzung in der Mapping-Tabelle
    const translation = fieldTranslations[fieldName.toLowerCase()];
    if (translation) {
      return translation;
    }
    
    // Fallback: Erste Buchstaben großschreiben
    return cleanFieldName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

     // Funktion zur Formatierung der Beschreibung - vereinfacht da keine Merge-Funktion mehr verwendet wird
   const formatDescription = (description: string | null) => {
     if (!description) {
       return <p className="text-gray-500 italic">Keine Beschreibung verfügbar.</p>;
     }

     // Einfache Darstellung der Beschreibung ohne komplexe Abschnitte
     return (
       <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r">
         <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
           <span>📋</span>
           Beschreibung
         </h4>
         <div className="text-blue-700 whitespace-pre-wrap">{description}</div>
       </div>
     );
   };

   // Funktion zur Anzeige zusätzlicher Bauträger-Informationen
   const renderTradeDetails = (trade: TradeSearchResult) => {
     return (
       <div className="space-y-4">
         {/* Grundinformationen */}
         <div className="bg-gray-50 rounded-xl p-4">
           <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
             <Building size={18} />
             Gewerk-Details
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
               <span className="text-sm font-medium text-gray-500">Kategorie</span>
               <p className="text-gray-800">{trade.category || 'Nicht angegeben'}</p>
             </div>
             <div>
               <span className="text-sm font-medium text-gray-500">Priorität</span>
               <p className="text-gray-800">{trade.priority || 'Nicht angegeben'}</p>
             </div>
             <div>
               <span className="text-sm font-medium text-gray-500">Status</span>
               <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(trade.status)}`}>
                 {getStatusLabel(trade.status)}
               </span>
             </div>
             <div>
               <span className="text-sm font-medium text-gray-500">Fortschritt</span>
               <p className="text-gray-800">{trade.progress_percentage || 0}%</p>
             </div>
             {trade.contractor && (
               <div>
                 <span className="text-sm font-medium text-gray-500">Auftragnehmer</span>
                 <p className="text-gray-800">{trade.contractor}</p>
               </div>
             )}
             {trade.requires_inspection && (
               <div className="md:col-span-2">
                 <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                   <CheckCircle className="h-5 w-5 text-yellow-600" />
                   <span className="text-yellow-800 font-medium">Vor-Ort-Besichtigung erforderlich</span>
                 </div>
               </div>
             )}
           </div>
         </div>

         {/* Beschreibung */}
         <div className="bg-gray-50 rounded-xl p-4">
           <h3 className="font-semibold text-gray-800 mb-2">Beschreibung</h3>
           <div className="text-gray-600">
             {formatDescription(trade.description)}
           </div>
         </div>

         {/* Dokumente */}
         <TradeDocumentViewer documents={trade.documents || []} />

         {/* Notizen vom Bauträger */}
         {/* Notizen werden normalerweise nicht direkt im TradeSearchResult übertragen, 
             aber falls sie in der description enthalten sind, werden sie dort angezeigt */}

         {/* Zeitplan-Details */}
         <div className="bg-gray-50 rounded-xl p-4">
           <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
             <Calendar size={18} />
             Zeitplan-Details
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {trade.planned_date && (
               <div>
                 <span className="text-sm font-medium text-gray-500">Geplantes Datum</span>
                 <p className="text-gray-800">
                   {new Date(trade.planned_date).toLocaleDateString('de-DE')}
                 </p>
               </div>
             )}
             {trade.start_date && (
               <div>
                 <span className="text-sm font-medium text-gray-500">Startdatum</span>
                 <p className="text-gray-800">
                   {new Date(trade.start_date).toLocaleDateString('de-DE')}
                 </p>
               </div>
             )}
             {trade.end_date && (
               <div>
                 <span className="text-sm font-medium text-gray-500">Enddatum</span>
                 <p className="text-gray-800">
                   {new Date(trade.end_date).toLocaleDateString('de-DE')}
                 </p>
               </div>
             )}
             {trade.created_at && (
               <div>
                 <span className="text-sm font-medium text-gray-500">Erstellt am</span>
                 <p className="text-gray-800">
                   {new Date(trade.created_at).toLocaleDateString('de-DE')}
                 </p>
               </div>
             )}
           </div>
         </div>
       </div>
     );
   };

   // Alte formatDescription Logik für Fallback (wird nicht mehr benötigt, aber zur Sicherheit behalten)
   const formatDescriptionOld = (description: string | null) => {
     if (!description) {
       return <p className="text-gray-500 italic">Keine Beschreibung verfügbar.</p>;
     }

     // Teile die Beschreibung in Abschnitte auf
     const sections = description.split('\n').filter(line => line.trim());
     
     return (
       <div className="space-y-4">
         {sections.map((section, index) => {
           // Erkenne verschiedene Abschnittstypen
           if (section.includes('📋 **Beschreibung:**')) {
             const content = section.replace('📋 **Beschreibung:**', '').trim();
             return (
               <div key={index} className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r">
                 <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                   <span>📋</span>
                   Beschreibung
                 </h4>
                 <p className="text-blue-700">{content}</p>
               </div>
             );
           }
          
          if (section.includes('🔧 **Kategorie-spezifische Details')) {
            const categoryMatch = section.match(/\(([^)]+)\)/);
            const category = categoryMatch ? categoryMatch[1] : '';
            const details = section.replace(/🔧 \*\*Kategorie-spezifische Details \([^)]+\):\*\*/, '').trim();
            
            if (details) {
              const detailItems = details.split('\n').filter(item => item.trim().startsWith('•'));
              
              return (
                <div key={index} className="bg-orange-50 border-l-4 border-orange-400 p-3 rounded-r">
                  <h4 className="font-semibold text-orange-800 mb-2 flex items-center gap-2">
                    <span>🔧</span>
                    Kategorie-spezifische Details ({category})
                  </h4>
                  <ul className="space-y-1">
                    {detailItems.map((item, itemIndex) => {
                      const itemText = item.replace('•', '').trim();
                      
                      // Übersetze den Feldnamen
                      const colonIndex = itemText.indexOf(':');
                      if (colonIndex !== -1) {
                        const fieldName = itemText.substring(0, colonIndex).trim();
                        const fieldValue = itemText.substring(colonIndex + 1).trim();
                        const translatedFieldName = translateFieldName(fieldName);
                        
                        return (
                          <li key={itemIndex} className="text-orange-700 flex items-start gap-2">
                            <span className="text-orange-500 mt-1">•</span>
                            <span><strong>{translatedFieldName}:</strong> {fieldValue}</span>
                          </li>
                        );
                      }
                      
                      return (
                        <li key={itemIndex} className="text-orange-700 flex items-start gap-2">
                          <span className="text-orange-500 mt-1">•</span>
                          <span>{itemText}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            }
          }
          
          if (section.includes('⚙️ **Technische Spezifikationen:**')) {
            const content = section.replace('⚙️ **Technische Spezifikationen:**', '').trim();
            return (
              <div key={index} className="bg-purple-50 border-l-4 border-purple-400 p-3 rounded-r">
                <h4 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                  <span>⚙️</span>
                  Technische Spezifikationen
                </h4>
                <p className="text-purple-700">{content}</p>
              </div>
            );
          }
          
          if (section.includes('🎯 **Qualitätsanforderungen:**')) {
            const content = section.replace('🎯 **Qualitätsanforderungen:**', '').trim();
            return (
              <div key={index} className="bg-green-50 border-l-4 border-green-400 p-3 rounded-r">
                <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                  <span>🎯</span>
                  Qualitätsanforderungen
                </h4>
                <p className="text-green-700">{content}</p>
              </div>
            );
          }
          
          if (section.includes('🛡️ **Sicherheitsanforderungen:**')) {
            const content = section.replace('🛡️ **Sicherheitsanforderungen:**', '').trim();
            return (
              <div key={index} className="bg-red-50 border-l-4 border-red-400 p-3 rounded-r">
                <h4 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                  <span>🛡️</span>
                  Sicherheitsanforderungen
                </h4>
                <p className="text-red-700">{content}</p>
              </div>
            );
          }
          
          if (section.includes('🌱 **Umweltanforderungen:**')) {
            const content = section.replace('🌱 **Umweltanforderungen:**', '').trim();
            return (
              <div key={index} className="bg-emerald-50 border-l-4 border-emerald-400 p-3 rounded-r">
                <h4 className="font-semibold text-emerald-800 mb-2 flex items-center gap-2">
                  <span>🌱</span>
                  Umweltanforderungen
                </h4>
                <p className="text-emerald-700">{content}</p>
              </div>
            );
          }
          
          if (section.includes('📝 **Notizen:**')) {
            const content = section.replace('📝 **Notizen:**', '').trim();
            return (
              <div key={index} className="bg-gray-50 border-l-4 border-gray-400 p-3 rounded-r">
                <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <span>📝</span>
                  Notizen
                </h4>
                <p className="text-gray-700">{content}</p>
              </div>
            );
          }
          
          // Fallback für unbekannte Abschnitte
          return (
            <div key={index} className="bg-gray-50 border-l-4 border-gray-300 p-3 rounded-r">
              <p className="text-gray-700">{section}</p>
            </div>
          );
        })}
      </div>
    );
  };

  const handleCreateQuote = () => {
    if (trade) {
      setShowCostEstimateForm(true);
    }
  };

  const handleCostEstimateSubmit = async (formData: any) => {
    if (trade) {
      await onCreateQuote(trade);
      setShowCostEstimateForm(false);
      // Lade Angebote neu
      await loadExistingQuotes();
    }
  };

  if (!isOpen || !trade) return null;

  const categoryInfo = getCategoryIcon(trade.category);

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] rounded-2xl shadow-2xl border border-[#ffbd59]/20 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-[#1a1a2e]/95 to-[#16213e]/95 backdrop-blur-lg border-b border-[#ffbd59]/20 p-6 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-white shadow-lg"
                  style={{ backgroundColor: categoryInfo.color }}
                >
                  {categoryInfo.icon}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{trade.title}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(trade.status)}`}>
                      {getStatusLabel(trade.status)}
                    </span>
                    <span className="text-sm text-gray-400">•</span>
                    <span className="text-sm text-gray-300">{trade.category}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-[#ffbd59]/20"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                             {/* Hauptinformationen */}
               <div className="lg:col-span-2 space-y-6">
                 {/* Alle Gewerk-Details vom Bauträger */}
                 {renderTradeDetails(trade)}

                 {/* Projekt-Details */}
                 <div className="bg-gray-50 rounded-xl p-4">
                   <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                     <Building size={18} />
                     Projekt-Informationen
                   </h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                       <span className="text-sm font-medium text-gray-500">Projektname</span>
                       <p className="text-gray-800">{trade.project_name}</p>
                     </div>
                     <div>
                       <span className="text-sm font-medium text-gray-500">Projekttyp</span>
                       <p className="text-gray-800">{trade.project_type}</p>
                     </div>
                     <div>
                       <span className="text-sm font-medium text-gray-500">Projekt-Status</span>
                       <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(trade.project_status)}`}>
                         {getStatusLabel(trade.project_status)}
                       </span>
                     </div>
                   </div>
                 </div>

                 {/* Standort */}
                 <div className="bg-gray-50 rounded-xl p-4">
                   <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                     <MapPin size={18} />
                     Standort
                   </h3>
                   <div className="space-y-2">
                     <p className="text-gray-800">
                       {trade.address_street}
                     </p>
                     <p className="text-gray-600">
                       {trade.address_zip} {trade.address_city}
                     </p>
                     <div className="flex items-center gap-2 text-sm text-gray-500">
                       <span>📍 Entfernung: {trade.distance_km ? trade.distance_km.toFixed(1) : 'N/A'} km</span>
                     </div>
                   </div>
                 </div>

                {/* Existierende Angebote */}
                {existingQuotes.length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <Eye size={18} />
                      Eingegangene Angebote ({existingQuotes.length})
                    </h3>
                    <div className="space-y-2">
                      {existingQuotes.map((quote, index) => (
                        <div key={quote.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                              <User size={16} className="text-gray-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">
                                {quote.service_provider_name || `Anbieter ${index + 1}`}
                              </p>
                              <p className="text-sm text-gray-500">
                                {new Date(quote.created_at).toLocaleDateString('de-DE')}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-800">
                              {quote.total_price.toLocaleString('de-DE')} €
                            </p>
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getQuoteStatusColor(quote.status)}`}>
                              {getQuoteStatusLabel(quote.status)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Seitenleiste */}
              <div className="space-y-4">
                {/* Zeitplan */}
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Calendar size={18} />
                    Zeitplan
                  </h3>
                  <div className="space-y-3">
                                         {trade.planned_date && (
                       <div>
                         <span className="text-sm font-medium text-gray-500">Geplant für</span>
                         <p className="text-gray-800">
                           {new Date(trade.planned_date).toLocaleDateString('de-DE')}
                         </p>
                       </div>
                     )}
                     <div>
                       <span className="text-sm font-medium text-gray-500">Erstellt am</span>
                       <p className="text-gray-800">
                         {trade.created_at ? new Date(trade.created_at).toLocaleDateString('de-DE') : 'Unbekannt'}
                       </p>
                     </div>
                  </div>
                </div>

                {/* Budget */}
                {trade.budget && (
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <Euro size={18} />
                      Budget
                    </h3>
                    <p className="text-2xl font-bold text-green-600">
                      {trade.budget.toLocaleString('de-DE')} €
                    </p>
                  </div>
                )}

                {/* Dokumente */}
                {trade.documents && Array.isArray(trade.documents) && trade.documents.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <TradeDocumentViewer documents={trade.documents} />
                  </div>
                )}

                {/* Angebots-Status für aktuellen User */}
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Ihr Angebot</h3>
                  {loading ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  ) : userHasQuote ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle size={16} className="text-green-600" />
                        <span className="text-sm font-medium text-green-600">Angebot bereits abgegeben</span>
                      </div>
                      {userQuote && (
                        <div className="bg-green-50 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-800">
                                {userQuote.total_price.toLocaleString('de-DE')} €
                              </p>
                              <p className="text-sm text-gray-500">
                                {new Date(userQuote.created_at).toLocaleDateString('de-DE')}
                              </p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getQuoteStatusColor(userQuote.status)}`}>
                              {getQuoteStatusLabel(userQuote.status)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={16} className="text-orange-500" />
                        <span className="text-sm text-gray-600">Noch kein Angebot abgegeben</span>
                      </div>
                      <button
                        onClick={handleCreateQuote}
                        className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-4 py-2 rounded-lg font-medium hover:from-yellow-600 hover:to-yellow-700 transition-all duration-300 flex items-center justify-center gap-2"
                      >
                        <Plus size={16} />
                        Angebot abgeben
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

             {/* CostEstimateForm Modal */}
       {showCostEstimateForm && trade && (
         <CostEstimateForm
           isOpen={showCostEstimateForm}
           onClose={() => setShowCostEstimateForm(false)}
           onSubmit={handleCostEstimateSubmit}
         />
       )}
    </>
  );
} 