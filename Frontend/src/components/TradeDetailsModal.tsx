import React from 'react';
import { 
  X, 
  Calendar, 
  TrendingUp, 
  Shield, 
  FileText, 
  Wrench, 
  Euro, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  Globe,
  CheckCircle,
  AlertTriangle,
  Info,
  Download,
  Eye,
  Settings,
  Target,
  BarChart3,
  MapPin,
  Tag,
  Star,
  Award,
  File,
  FolderOpen,
  AlertCircle,
  Zap,
  Thermometer,
  Droplets,
  Sun,
  Home,
  TreePine,
  Hammer,
  Ruler,
  Palette,
  Layers,
  Anchor,
  Sprout
} from 'lucide-react';

interface TradeDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  trade: any;
  quotes: any[];
  project: any;
}

export default function TradeDetailsModal({ isOpen, onClose, trade, quotes, project }: TradeDetailsModalProps) {
  if (!isOpen || !trade) return null;

  const getCategoryIcon = (category: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      'elektro': <Zap size={16} className="text-yellow-400" />,
      'sanitaer': <Droplets size={16} className="text-blue-400" />,
      'heizung': <Thermometer size={16} className="text-red-400" />,
      'dach': <Sun size={16} className="text-orange-400" />,
      'fenster_tueren': <Home size={16} className="text-green-400" />,
      'boden': <Layers size={16} className="text-brown-400" />,
      'wand': <Palette size={16} className="text-purple-400" />,
      'fundament': <Anchor size={16} className="text-gray-400" />,
      'garten': <Sprout size={16} className="text-green-400" />,
      'eigene': <Settings size={16} className="text-gray-400" />
    };
    return iconMap[category] || <Wrench size={16} className="text-gray-400" />;
  };

  const getCategoryLabel = (category: string) => {
    const labelMap: { [key: string]: string } = {
      'elektro': 'Elektroinstallation',
      'sanitaer': 'Sanitär',
      'heizung': 'Heizung',
      'dach': 'Dach',
      'fenster_tueren': 'Fenster & Türen',
      'boden': 'Boden',
      'wand': 'Wand',
      'fundament': 'Fundament',
      'garten': 'Garten & Landschaft',
      'eigene': 'Eigene Kategorie'
    };
    return labelMap[category] || category;
  };

  const getStatusLabel = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'planning': 'Planung',
      'cost_estimate': 'Kostenvoranschlag',
      'tender': 'Ausschreibung',
      'bidding': 'Angebotsphase',
      'evaluation': 'Bewertung',
      'awarded': 'Vergeben',
      'in_progress': 'In Bearbeitung',
      'completed': 'Abgeschlossen',
      'delayed': 'Verzögert',
      'cancelled': 'Abgebrochen'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap: { [key: string]: string } = {
      'planning': 'bg-blue-500/20 border-blue-500/30 text-blue-300',
      'cost_estimate': 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300',
      'tender': 'bg-purple-500/20 border-purple-500/30 text-purple-300',
      'bidding': 'bg-orange-500/20 border-orange-500/30 text-orange-300',
      'evaluation': 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300',
      'awarded': 'bg-green-500/20 border-green-500/30 text-green-300',
      'in_progress': 'bg-blue-500/20 border-blue-500/30 text-blue-300',
      'completed': 'bg-green-500/20 border-green-500/30 text-green-300',
      'delayed': 'bg-red-500/20 border-red-500/30 text-red-300',
      'cancelled': 'bg-gray-500/20 border-gray-500/30 text-gray-300'
    };
    return colorMap[status] || 'bg-gray-500/20 border-gray-500/30 text-gray-300';
  };

  const getPriorityLabel = (priority: string) => {
    const priorityMap: { [key: string]: string } = {
      'low': 'Niedrig',
      'medium': 'Mittel',
      'high': 'Hoch',
      'critical': 'Kritisch'
    };
    return priorityMap[priority] || priority;
  };

  const getPriorityColor = (priority: string) => {
    const colorMap: { [key: string]: string } = {
      'low': 'bg-green-500/20 border-green-500/30 text-green-300',
      'medium': 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300',
      'high': 'bg-orange-500/20 border-orange-500/30 text-orange-300',
      'critical': 'bg-red-500/20 border-red-500/30 text-red-300'
    };
    return colorMap[priority] || 'bg-gray-500/20 border-gray-500/30 text-gray-300';
  };

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return amount.toLocaleString('de-DE', { style: 'currency', currency });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderCategorySpecificFields = () => {
    if (!trade.category_specific_fields) return null;

    const fields = trade.category_specific_fields;
    const category = trade.category;

    const renderField = (key: string, value: any, label: string, unit?: string) => {
      if (value === undefined || value === null) return null;
      
      return (
        <div key={key} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
          <div className="flex items-center gap-2">
            <Info size={14} className="text-gray-400" />
            <span className="text-sm text-gray-400">{label}</span>
          </div>
          <span className="text-sm font-medium text-white">
            {typeof value === 'boolean' ? (value ? 'Ja' : 'Nein') : value}
            {unit && ` ${unit}`}
          </span>
        </div>
      );
    };

    switch (category) {
      case 'elektro':
        return (
          <div className="space-y-2">
            <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Zap size={16} className="text-yellow-400" />
              Elektro-spezifische Details
            </h4>
            {renderField('electrical_voltage', fields.electrical_voltage, 'Spannung', 'V')}
            {renderField('electrical_power', fields.electrical_power, 'Leistung', 'kW')}
            {renderField('electrical_circuits', fields.electrical_circuits, 'Stromkreise')}
            {renderField('electrical_switches', fields.electrical_switches, 'Schalter')}
            {renderField('electrical_outlets', fields.electrical_outlets, 'Steckdosen')}
            {renderField('electrical_lighting_points', fields.electrical_lighting_points, 'Beleuchtungspunkte')}
          </div>
        );

      case 'sanitaer':
        return (
          <div className="space-y-2">
            <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Droplets size={16} className="text-blue-400" />
              Sanitär-spezifische Details
            </h4>
            {renderField('plumbing_fixtures', fields.plumbing_fixtures, 'Sanitäranlagen')}
            {renderField('plumbing_pipes_length', fields.plumbing_pipes_length, 'Rohrlänge', 'm')}
            {renderField('plumbing_water_heater', fields.plumbing_water_heater, 'Warmwasserbereiter')}
            {renderField('plumbing_sewage_system', fields.plumbing_sewage_system, 'Abwassersystem')}
            {renderField('plumbing_water_supply', fields.plumbing_water_supply, 'Wasserversorgung')}
          </div>
        );

      case 'heizung':
        return (
          <div className="space-y-2">
            <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Thermometer size={16} className="text-red-400" />
              Heizungs-spezifische Details
            </h4>
            {renderField('heating_system_type', fields.heating_system_type, 'Heizungstyp')}
            {renderField('heating_power', fields.heating_power, 'Heizleistung', 'kW')}
            {renderField('heating_radiators', fields.heating_radiators, 'Heizkörper')}
            {renderField('heating_thermostats', fields.heating_thermostats, 'Thermostate')}
            {renderField('heating_boiler', fields.heating_boiler, 'Kessel')}
          </div>
        );

      case 'dach':
        return (
          <div className="space-y-2">
            <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Sun size={16} className="text-orange-400" />
              Dach-spezifische Details
            </h4>
            {renderField('roof_material', fields.roof_material, 'Dachmaterial')}
            {renderField('roof_area', fields.roof_area, 'Dachfläche', 'm²')}
            {renderField('roof_pitch', fields.roof_pitch, 'Dachneigung', '°')}
            {renderField('roof_insulation', fields.roof_insulation, 'Dämmung')}
            {renderField('roof_gutters', fields.roof_gutters, 'Regenrinne')}
            {renderField('roof_skylights', fields.roof_skylights, 'Dachfenster')}
          </div>
        );

      case 'fenster_tueren':
        return (
          <div className="space-y-2">
            <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Home size={16} className="text-green-400" />
              Fenster & Türen Details
            </h4>
            {renderField('windows_count', fields.windows_count, 'Fenster')}
            {renderField('windows_type', fields.windows_type, 'Fenstertyp')}
            {renderField('windows_glazing', fields.windows_glazing, 'Verglasung')}
            {renderField('doors_count', fields.doors_count, 'Türen')}
            {renderField('doors_type', fields.doors_type, 'Türtyp')}
            {renderField('doors_material', fields.doors_material, 'Türmaterial')}
          </div>
        );

      case 'boden':
        return (
          <div className="space-y-2">
            <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Layers size={16} className="text-brown-400" />
              Boden-spezifische Details
            </h4>
            {renderField('floor_material', fields.floor_material, 'Bodenmaterial')}
            {renderField('floor_area', fields.floor_area, 'Bodenfläche', 'm²')}
            {renderField('floor_subfloor', fields.floor_subfloor, 'Untergrund')}
            {renderField('floor_insulation', fields.floor_insulation, 'Bodendämmung')}
          </div>
        );

      case 'wand':
        return (
          <div className="space-y-2">
            <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Palette size={16} className="text-purple-400" />
              Wand-spezifische Details
            </h4>
            {renderField('wall_material', fields.wall_material, 'Wandmaterial')}
            {renderField('wall_area', fields.wall_area, 'Wandfläche', 'm²')}
            {renderField('wall_insulation', fields.wall_insulation, 'Wanddämmung')}
            {renderField('wall_paint', fields.wall_paint, 'Wandanstrich')}
          </div>
        );

      case 'fundament':
        return (
          <div className="space-y-2">
            <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Anchor size={16} className="text-gray-400" />
              Fundament-spezifische Details
            </h4>
            {renderField('foundation_type', fields.foundation_type, 'Fundamenttyp')}
            {renderField('foundation_depth', fields.foundation_depth, 'Fundamenttiefe', 'm')}
            {renderField('foundation_soil_type', fields.foundation_soil_type, 'Bodentyp')}
            {renderField('foundation_waterproofing', fields.foundation_waterproofing, 'Wasserdichtung')}
          </div>
        );

      case 'garten':
        return (
          <div className="space-y-2">
            <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Sprout size={16} className="text-green-400" />
              Garten-spezifische Details
            </h4>
            {renderField('garden_area', fields.garden_area, 'Gartenfläche', 'm²')}
            {renderField('garden_irrigation', fields.garden_irrigation, 'Bewässerung')}
            {renderField('garden_lighting', fields.garden_lighting, 'Gartenbeleuchtung')}
            {renderField('garden_paths', fields.garden_paths, 'Gartenwege')}
            {renderField('garden_plants', fields.garden_plants, 'Bepflanzung')}
          </div>
        );

      default:
        return null;
    }
  };

  const renderDocuments = () => {
    if (!trade.documents || trade.documents.length === 0) {
      return (
        <div className="text-center py-8 text-gray-400">
          <FileText size={32} className="mx-auto mb-2 opacity-50" />
          <p>Keine Dokumente vorhanden</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {trade.documents.map((doc: any) => (
          <div key={doc.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <div className="flex items-center gap-3">
              <FileText size={16} className="text-blue-400" />
              <div>
                <div className="text-sm font-medium text-white">{doc.title}</div>
                <div className="text-xs text-gray-400">{formatFileSize(doc.file_size)}</div>
              </div>
            </div>
            <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <Download size={16} className="text-gray-400" />
            </button>
          </div>
        ))}
      </div>
    );
  };

  const renderQuotes = () => {
    if (!quotes || quotes.length === 0) {
      return (
        <div className="text-center py-8 text-gray-400">
          <FileText size={32} className="mx-auto mb-2 opacity-50" />
          <p>Keine Angebote vorhanden</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {quotes.map((quote: any) => (
          <div key={quote.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  quote.status === 'accepted' ? 'bg-green-500' :
                  quote.status === 'rejected' ? 'bg-red-500' :
                  quote.status === 'under_review' ? 'bg-yellow-500' :
                  'bg-blue-500'
                }`}></div>
                <span className="text-sm font-medium text-white">{quote.title}</span>
              </div>
              <span className="text-lg font-bold text-[#ffbd59]">
                {formatCurrency(quote.total_amount, quote.currency)}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Firma:</span>
                <div className="text-white">{quote.company_name || '—'}</div>
              </div>
              <div>
                <span className="text-gray-400">Dauer:</span>
                <div className="text-white">{quote.estimated_duration} Tage</div>
              </div>
              <div>
                <span className="text-gray-400">Gültig bis:</span>
                <div className="text-white">{formatDate(quote.valid_until)}</div>
              </div>
              <div>
                <span className="text-gray-400">Garantie:</span>
                <div className="text-white">{quote.warranty_period} Monate</div>
              </div>
            </div>

            {quote.contact_released && (
              <div className="mt-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-blue-300 mb-2">
                  <User size={14} />
                  <span className="font-medium">Kontaktdaten freigegeben</span>
                </div>
                <div className="space-y-1 text-xs text-gray-400">
                  {quote.contact_person && (
                    <div className="flex items-center gap-1">
                      <User size={12} />
                      <span>{quote.contact_person}</span>
                    </div>
                  )}
                  {quote.phone && (
                    <div className="flex items-center gap-1">
                      <Phone size={12} />
                      <span>{quote.phone}</span>
                    </div>
                  )}
                  {quote.email && (
                    <div className="flex items-center gap-1">
                      <Mail size={12} />
                      <span>{quote.email}</span>
                    </div>
                  )}
                  {quote.website && (
                    <div className="flex items-center gap-1">
                      <Globe size={12} />
                      <span>{quote.website}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#2c3539] rounded-2xl shadow-2xl border border-white/20 max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-xl">
              <Wrench size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{trade.title}</h2>
              <p className="text-sm text-gray-400">{trade.description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Info size={20} className="text-[#ffbd59]" />
                  Grundinformationen
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(trade.category || '')}
                      <span className="text-sm text-gray-400">Kategorie</span>
                    </div>
                    <span className="text-sm font-medium text-white">{getCategoryLabel(trade.category || '')}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Target size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-400">Status</span>
                    </div>
                    <span className={`text-sm font-medium px-2 py-1 rounded-full ${getStatusColor(trade.status)}`}>
                      {getStatusLabel(trade.status)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Star size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-400">Priorität</span>
                    </div>
                    <span className={`text-sm font-medium px-2 py-1 rounded-full ${getPriorityColor(trade.priority)}`}>
                      {getPriorityLabel(trade.priority)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-400">Fortschritt</span>
                    </div>
                    <span className="text-sm font-medium text-white">{trade.progress_percentage || 0}%</span>
                  </div>

                  {trade.is_critical && (
                    <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <Shield size={16} className="text-red-400" />
                      <span className="text-sm text-red-300 font-medium">Kritisches Gewerk</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Calendar size={20} className="text-[#ffbd59]" />
                  Zeitplan & Budget
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-400">Geplant für</span>
                    </div>
                    <span className="text-sm font-medium text-white">{formatDate(trade.planned_date)}</span>
                  </div>

                  {trade.start_date && (
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-gray-400" />
                        <span className="text-sm text-gray-400">Start</span>
                      </div>
                      <span className="text-sm font-medium text-white">{formatDate(trade.start_date)}</span>
                    </div>
                  )}

                  {trade.end_date && (
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Award size={16} className="text-gray-400" />
                        <span className="text-sm text-gray-400">Ende</span>
                      </div>
                      <span className="text-sm font-medium text-white">{formatDate(trade.end_date)}</span>
                    </div>
                  )}

                  {trade.budget && (
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Euro size={16} className="text-gray-400" />
                        <span className="text-sm text-gray-400">Budget</span>
                      </div>
                      <span className="text-sm font-medium text-[#ffbd59]">{formatCurrency(trade.budget)}</span>
                    </div>
                  )}

                  {trade.actual_costs && (
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-2">
                        <BarChart3 size={16} className="text-gray-400" />
                        <span className="text-sm text-gray-400">Tatsächliche Kosten</span>
                      </div>
                      <span className="text-sm font-medium text-white">{formatCurrency(trade.actual_costs)}</span>
                    </div>
                  )}

                  {trade.contractor && (
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-gray-400" />
                        <span className="text-sm text-gray-400">Auftragnehmer</span>
                      </div>
                      <span className="text-sm font-medium text-white">{trade.contractor}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Category Specific Fields */}
            {renderCategorySpecificFields()}

            {/* Technical Specifications */}
            {(trade.technical_specifications || trade.quality_requirements || trade.safety_requirements || trade.environmental_requirements) && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Settings size={20} className="text-[#ffbd59]" />
                  Technische Spezifikationen
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {trade.technical_specifications && (
                    <div className="p-4 bg-white/5 rounded-lg">
                      <h4 className="font-medium text-white mb-2">Technische Spezifikationen</h4>
                      <p className="text-sm text-gray-300">{trade.technical_specifications}</p>
                    </div>
                  )}
                  
                  {trade.quality_requirements && (
                    <div className="p-4 bg-white/5 rounded-lg">
                      <h4 className="font-medium text-white mb-2">Qualitätsanforderungen</h4>
                      <p className="text-sm text-gray-300">{trade.quality_requirements}</p>
                    </div>
                  )}
                  
                  {trade.safety_requirements && (
                    <div className="p-4 bg-white/5 rounded-lg">
                      <h4 className="font-medium text-white mb-2">Sicherheitsanforderungen</h4>
                      <p className="text-sm text-gray-300">{trade.safety_requirements}</p>
                    </div>
                  )}
                  
                  {trade.environmental_requirements && (
                    <div className="p-4 bg-white/5 rounded-lg">
                      <h4 className="font-medium text-white mb-2">Umweltanforderungen</h4>
                      <p className="text-sm text-gray-300">{trade.environmental_requirements}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Documents */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <FolderOpen size={20} className="text-[#ffbd59]" />
                Dokumente
              </h3>
              {renderDocuments()}
            </div>

            {/* Quotes */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <FileText size={20} className="text-[#ffbd59]" />
                Angebote ({quotes.length})
              </h3>
              {renderQuotes()}
            </div>

            {/* Notes */}
            {trade.notes && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <AlertCircle size={20} className="text-[#ffbd59]" />
                  Notizen
                </h3>
                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-sm text-gray-300">{trade.notes}</p>
                </div>
              </div>
            )}

            {/* Project Information */}
            {project && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <MapPin size={20} className="text-[#ffbd59]" />
                  Projektinformationen
                </h3>
                <div className="p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Tag size={16} className="text-gray-400" />
                    <span className="text-sm font-medium text-white">{project.name}</span>
                  </div>
                  <p className="text-sm text-gray-300">{project.description}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 