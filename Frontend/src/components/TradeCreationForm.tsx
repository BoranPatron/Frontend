import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  FileText, 
  X, 
  Plus, 
  Trash2, 
  Save,
  AlertTriangle,
  CheckCircle,
  Info,
  MoreVertical,
  Building,
  Calendar,
  Euro,
  Users,
  FileCheck,
  Clock,
  Target,
  Shield,
  Leaf
} from 'lucide-react';

interface TradeCreationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (tradeData: any) => void;
  projectId: number;
}

interface CategoryField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'boolean' | 'textarea';
  required?: boolean;
  options?: string[];
  placeholder?: string;
  unit?: string;
}

const CATEGORY_FIELDS: Record<string, CategoryField[]> = {
  'elektro': [
    { id: 'electrical_voltage', label: 'Spannung', type: 'select', options: ['230V', '400V', '230V/400V'], required: true },
    { id: 'electrical_power', label: 'Leistung (kW)', type: 'number', required: true, unit: 'kW' },
    { id: 'electrical_circuits', label: 'Anzahl Stromkreise', type: 'number', required: true },
    { id: 'electrical_switches', label: 'Anzahl Schalter', type: 'number', required: true },
    { id: 'electrical_outlets', label: 'Anzahl Steckdosen', type: 'number', required: true },
    { id: 'electrical_lighting_points', label: 'Anzahl Leuchten', type: 'number', required: true }
  ],
  'sanitaer': [
    { id: 'plumbing_fixtures', label: 'Anzahl Sanitärobjekte', type: 'number', required: true },
    { id: 'plumbing_pipes_length', label: 'Rohrleitungslänge (m)', type: 'number', required: true, unit: 'm' },
    { id: 'plumbing_water_heater', label: 'Warmwasserbereiter', type: 'boolean', required: false },
    { id: 'plumbing_sewage_system', label: 'Abwassersystem', type: 'boolean', required: false },
    { id: 'plumbing_water_supply', label: 'Wasserversorgung', type: 'boolean', required: false }
  ],
  'heizung': [
    { id: 'heating_system_type', label: 'Heizungssystem', type: 'select', options: ['Gas', 'Öl', 'Wärmepumpe', 'Pellet', 'Fernwärme'], required: true },
    { id: 'heating_power', label: 'Heizleistung (kW)', type: 'number', required: true, unit: 'kW' },
    { id: 'heating_radiators', label: 'Anzahl Heizkörper', type: 'number', required: true },
    { id: 'heating_thermostats', label: 'Anzahl Thermostate', type: 'number', required: true },
    { id: 'heating_boiler', label: 'Kessel vorhanden', type: 'boolean', required: false }
  ],
  'dach': [
    { id: 'roof_material', label: 'Dachmaterial', type: 'select', options: ['Ziegel', 'Beton', 'Metall', 'Schiefer', 'Holz'], required: true },
    { id: 'roof_area', label: 'Dachfläche (m²)', type: 'number', required: true, unit: 'm²' },
    { id: 'roof_pitch', label: 'Dachneigung (°)', type: 'number', required: true, unit: '°' },
    { id: 'roof_insulation', label: 'Dämmung', type: 'boolean', required: false },
    { id: 'roof_gutters', label: 'Regenrinne', type: 'boolean', required: false },
    { id: 'roof_skylights', label: 'Anzahl Dachfenster', type: 'number', required: false }
  ],
  'fenster_tueren': [
    { id: 'windows_count', label: 'Anzahl Fenster', type: 'number', required: true },
    { id: 'windows_type', label: 'Fenstertyp', type: 'select', options: ['Holz', 'Kunststoff', 'Aluminium', 'Holz-Alu'], required: true },
    { id: 'windows_glazing', label: 'Verglasung', type: 'select', options: ['Einfach', 'Doppel', 'Dreifach', 'Wärmeschutz'], required: true },
    { id: 'doors_count', label: 'Anzahl Türen', type: 'number', required: true },
    { id: 'doors_type', label: 'Türtyp', type: 'select', options: ['Holz', 'Kunststoff', 'Metall', 'Glas'], required: true },
    { id: 'doors_material', label: 'Türmaterial', type: 'select', options: ['Massivholz', 'Furnier', 'Lackiert', 'Glas'], required: true }
  ],
  'boden': [
    { id: 'floor_material', label: 'Bodenbelag', type: 'select', options: ['Parkett', 'Laminat', 'Fliesen', 'Teppich', 'Beton'], required: true },
    { id: 'floor_area', label: 'Bodenfläche (m²)', type: 'number', required: true, unit: 'm²' },
    { id: 'floor_subfloor', label: 'Untergrund', type: 'select', options: ['Estrich', 'Holz', 'Beton', 'Zement'], required: true },
    { id: 'floor_insulation', label: 'Dämmung', type: 'boolean', required: false }
  ],
  'wand': [
    { id: 'wall_material', label: 'Wandmaterial', type: 'select', options: ['Ziegel', 'Beton', 'Holz', 'Gipskarton', 'Leichtbau'], required: true },
    { id: 'wall_area', label: 'Wandfläche (m²)', type: 'number', required: true, unit: 'm²' },
    { id: 'wall_insulation', label: 'Dämmung', type: 'boolean', required: false },
    { id: 'wall_paint', label: 'Anstrich', type: 'boolean', required: false }
  ],
  'fundament': [
    { id: 'foundation_type', label: 'Fundamenttyp', type: 'select', options: ['Streifenfundament', 'Plattenfundament', 'Punktfundament', 'Keller'], required: true },
    { id: 'foundation_depth', label: 'Fundamenttiefe (m)', type: 'number', required: true, unit: 'm' },
    { id: 'foundation_soil_type', label: 'Bodentyp', type: 'select', options: ['Lehm', 'Sand', 'Ton', 'Fels', 'Gemisch'], required: true },
    { id: 'foundation_waterproofing', label: 'Abdichtung', type: 'boolean', required: false }
  ],
  'garten': [
    { id: 'garden_area', label: 'Gartenfläche (m²)', type: 'number', required: true, unit: 'm²' },
    { id: 'garden_irrigation', label: 'Bewässerung', type: 'boolean', required: false },
    { id: 'garden_lighting', label: 'Beleuchtung', type: 'boolean', required: false },
    { id: 'garden_paths', label: 'Wege', type: 'boolean', required: false },
    { id: 'garden_plants', label: 'Bepflanzung', type: 'boolean', required: false }
  ],
  'eigene': [
    { id: 'custom_field_1', label: 'Eigenes Feld 1', type: 'text', required: false },
    { id: 'custom_field_2', label: 'Eigenes Feld 2', type: 'text', required: false },
    { id: 'custom_field_3', label: 'Eigenes Feld 3', type: 'text', required: false }
  ]
};

export default function TradeCreationForm({ isOpen, onClose, onSubmit, projectId }: TradeCreationFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium',
    planned_date: '',
    notes: ''
  });
  const [categoryFields, setCategoryFields] = useState<Record<string, any>>({});
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [technicalSpecs, setTechnicalSpecs] = useState('');
  const [qualityRequirements, setQualityRequirements] = useState('');
  const [safetyRequirements, setSafetyRequirements] = useState('');
  const [environmentalRequirements, setEnvironmentalRequirements] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDetailsDropdown, setShowDetailsDropdown] = useState(false);
  const [projectInfo, setProjectInfo] = useState<any>(null);

  // Lade Projekt-Informationen
  useEffect(() => {
    const loadProjectInfo = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch(`http://localhost:8000/api/v1/projects/${projectId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setProjectInfo(data);
        }
      } catch (error) {
        console.error('Fehler beim Laden der Projekt-Informationen:', error);
      }
    };

    if (isOpen && projectId) {
      loadProjectInfo();
    }
  }, [isOpen, projectId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Fehler zurücksetzen
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleCategoryFieldChange = (fieldId: string, value: any) => {
    setCategoryFields(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/zip',
        'application/x-rar-compressed'
      ];
      
      if (file.size > maxSize) {
        alert(`Datei ${file.name} ist zu groß. Maximale Größe: 10MB`);
        return false;
      }
      
      if (!allowedTypes.includes(file.type)) {
        alert(`Dateityp ${file.type} wird nicht unterstützt.`);
        return false;
      }
      
      return true;
    });
    
    setUploadedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) newErrors.title = 'Titel ist erforderlich';
    if (!formData.description.trim()) newErrors.description = 'Beschreibung ist erforderlich';
    if (!formData.category) newErrors.category = 'Kategorie ist erforderlich';
    if (!formData.planned_date) newErrors.planned_date = 'Geplantes Datum ist erforderlich';
    
    // Kategorie-spezifische Validierung
    if (formData.category && CATEGORY_FIELDS[formData.category]) {
      CATEGORY_FIELDS[formData.category].forEach(field => {
        if (field.required && !categoryFields[field.id]) {
          newErrors[field.id] = `${field.label} ist erforderlich`;
        }
      });
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const tradeData = {
        ...formData,
        project_id: projectId,
        category_specific_fields: categoryFields,
        documents: uploadedFiles,
        technical_specifications: technicalSpecs,
        quality_requirements: qualityRequirements,
        safety_requirements: safetyRequirements,
        environmental_requirements: environmentalRequirements
      };
      
      await onSubmit(tradeData);
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        submit: 'Fehler beim Erstellen des Gewerks'
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      category: '',
      priority: 'medium',
      planned_date: '',
      notes: ''
    });
    setCategoryFields({});
    setUploadedFiles([]);
    setTechnicalSpecs('');
    setQualityRequirements('');
    setSafetyRequirements('');
    setEnvironmentalRequirements('');
    setErrors({});
    setShowDetailsDropdown(false);
    onClose();
  };

  const renderCategoryField = (field: CategoryField) => {
    const value = categoryFields[field.id] || '';
    
    switch (field.type) {
      case 'text':
      case 'number':
        return (
          <input
            type={field.type}
            value={value}
            onChange={(e) => handleCategoryFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={`w-full px-3 py-2 bg-[#2c3539] border rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent text-white placeholder-gray-400 ${
              errors[field.id] ? 'border-red-500' : 'border-[#ffbd59]/30'
            }`}
          />
        );
      
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleCategoryFieldChange(field.id, e.target.value)}
            className={`w-full px-3 py-2 bg-[#2c3539] border rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent text-white ${
              errors[field.id] ? 'border-red-500' : 'border-[#ffbd59]/30'
            }`}
          >
            <option value="">Bitte wählen...</option>
            {field.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
      
      case 'boolean':
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => handleCategoryFieldChange(field.id, e.target.checked)}
              className="w-4 h-4 text-[#ffbd59] border-gray-300 rounded focus:ring-[#ffbd59]"
            />
            <span className="ml-2 text-sm text-gray-300">Ja</span>
          </div>
        );
      
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleCategoryFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            rows={3}
            className={`w-full px-3 py-2 bg-[#2c3539] border rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent text-white placeholder-gray-400 ${
              errors[field.id] ? 'border-red-500' : 'border-[#ffbd59]/30'
            }`}
          />
        );
      
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto border border-[#ffbd59]/20">
        <div className="p-6 border-b border-[#ffbd59]/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold text-white">Neues Gewerk erstellen</h2>
              
              {/* Projekt-Informationen */}
              {projectInfo && (
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Building className="h-4 w-4 text-[#ffbd59]" />
                  <span>{projectInfo.name}</span>
                  <span className="text-gray-500">|</span>
                  <Calendar className="h-4 w-4 text-[#ffbd59]" />
                  <span>Projekt #{projectInfo.id}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {/* Details Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowDetailsDropdown(!showDetailsDropdown)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
                  title="Details einsehen"
                >
                  <MoreVertical size={20} />
                </button>
                
                {showDetailsDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-[#3d4952] rounded-xl shadow-2xl border border-white/20 z-50">
                    <div className="p-2">
                      <div className="p-3 border-b border-white/10">
                        <h4 className="font-medium text-white text-sm">Details einsehen</h4>
                      </div>
                      
                      <div className="p-2 space-y-1">
                        <button className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors text-white w-full text-left">
                          <FileCheck size={16} className="text-[#ffbd59]" />
                          <span className="text-sm">Kostenvoranschlag-Prozess</span>
                        </button>
                        
                        <button className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors text-white w-full text-left">
                          <Users size={16} className="text-[#ffbd59]" />
                          <span className="text-sm">Verfügbare Dienstleister</span>
                        </button>
                        
                        <button className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors text-white w-full text-left">
                          <Clock size={16} className="text-[#ffbd59]" />
                          <span className="text-sm">Zeitplan & Termine</span>
                        </button>
                        
                        <button className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors text-white w-full text-left">
                          <Euro size={16} className="text-[#ffbd59]" />
                          <span className="text-sm">Budget & Kosten</span>
                        </button>
                        
                        <button className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors text-white w-full text-left">
                          <Target size={16} className="text-[#ffbd59]" />
                          <span className="text-sm">Qualitätsstandards</span>
                        </button>
                        
                        <button className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors text-white w-full text-left">
                          <Shield size={16} className="text-[#ffbd59]" />
                          <span className="text-sm">Sicherheitsrichtlinien</span>
                        </button>
                        
                        <button className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors text-white w-full text-left">
                          <Leaf size={16} className="text-[#ffbd59]" />
                          <span className="text-sm">Umweltstandards</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <button
                onClick={handleClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
              >
                <X size={24} />
              </button>
            </div>
          </div>
          
          {/* Kostenvoranschlag-Info */}
          <div className="mt-4 p-4 bg-[#ffbd59]/10 border border-[#ffbd59]/20 rounded-lg">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-[#ffbd59] mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-300">
                <p className="font-medium text-white mb-1">💡 Kostenvoranschlag-Prozess</p>
                <p className="text-gray-400">
                  Durch die detaillierte Spezifikation erhalten Dienstleister alle notwendigen Informationen für präzise Kostenvoranschläge. 
                  Dies reduziert Nachfragen und beschleunigt die Vergabe.
                </p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Grunddaten */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Titel *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 bg-[#2c3539] border rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent text-white placeholder-gray-400 ${
                  errors.title ? 'border-red-500' : 'border-[#ffbd59]/30'
                }`}
                placeholder="z.B. Elektroinstallation Erdgeschoss"
              />
              {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Kategorie *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 bg-[#2c3539] border rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent text-white ${
                  errors.category ? 'border-red-500' : 'border-[#ffbd59]/30'
                }`}
              >
                <option value="">Bitte wählen...</option>
                <option value="elektro">Elektro</option>
                <option value="sanitaer">Sanitär</option>
                <option value="heizung">Heizung</option>
                <option value="dach">Dach</option>
                <option value="fenster_tueren">Fenster/Türen</option>
                <option value="boden">Boden</option>
                <option value="wand">Wand</option>
                <option value="fundament">Fundament</option>
                <option value="garten">Garten/Landschaft</option>
                <option value="eigene">Eigene</option>
              </select>
              {errors.category && <p className="text-red-400 text-sm mt-1">{errors.category}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Priorität
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-[#2c3539] border border-[#ffbd59]/30 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent text-white"
              >
                <option value="low">Niedrig</option>
                <option value="medium">Mittel</option>
                <option value="high">Hoch</option>
                <option value="critical">Kritisch</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Geplantes Datum *
              </label>
              <input
                type="date"
                name="planned_date"
                value={formData.planned_date}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 bg-[#2c3539] border rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent text-white ${
                  errors.planned_date ? 'border-red-500' : 'border-[#ffbd59]/30'
                }`}
              />
              {errors.planned_date && <p className="text-red-400 text-sm mt-1">{errors.planned_date}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Beschreibung *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className={`w-full px-3 py-2 bg-[#2c3539] border rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent text-white placeholder-gray-400 ${
                errors.description ? 'border-red-500' : 'border-[#ffbd59]/30'
              }`}
              placeholder="Detaillierte Beschreibung des Gewerks..."
            />
            {errors.description && <p className="text-red-400 text-sm mt-1">{errors.description}</p>}
          </div>

          {/* Kategorie-spezifische Felder */}
          {formData.category && CATEGORY_FIELDS[formData.category] && (
            <div className="border-t border-[#ffbd59]/20 pt-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Spezifische Felder für {formData.category}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {CATEGORY_FIELDS[formData.category].map(field => (
                  <div key={field.id}>
                    <label className="block text-sm font-medium text-white mb-2">
                      {field.label} {field.required && '*'}
                    </label>
                    {renderCategoryField(field)}
                    {errors[field.id] && <p className="text-red-400 text-sm mt-1">{errors[field.id]}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Datei-Upload */}
          <div className="border-t border-[#ffbd59]/20 pt-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Dokumente und Dateien
            </h3>
            <div className="border-2 border-dashed border-[#ffbd59]/30 rounded-lg p-6 text-center bg-[#2c3539]/50">
              <Upload className="mx-auto h-12 w-12 text-[#ffbd59] mb-4" />
              <div className="text-sm text-gray-300 mb-4">
                <p>Ziehen Sie Dateien hierher oder klicken Sie zum Auswählen</p>
                <p className="text-xs text-gray-400 mt-1">
                  Unterstützte Formate: PDF, Bilder, Office-Dokumente, ZIP (max. 10MB)
                </p>
              </div>
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx,.zip,.rar"
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer bg-[#ffbd59] text-[#2c3539] px-4 py-2 rounded-lg hover:bg-[#ffa726] transition-colors font-medium"
              >
                Dateien auswählen
              </label>
            </div>
            
            {uploadedFiles.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-white mb-2">Hochgeladene Dateien:</h4>
                <div className="space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-[#2c3539] rounded-lg border border-[#ffbd59]/20">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-[#ffbd59] mr-3" />
                        <div>
                          <p className="text-sm font-medium text-white">{file.name}</p>
                          <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="p-1 hover:bg-red-500/20 rounded"
                      >
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {errors.files && <p className="text-red-400 text-sm mt-1">{errors.files}</p>}
          </div>

          {/* Technische Spezifikationen */}
          <div className="border-t border-[#ffbd59]/20 pt-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Technische Spezifikationen
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Technische Anforderungen
                </label>
                <textarea
                  value={technicalSpecs}
                  onChange={(e) => setTechnicalSpecs(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 bg-[#2c3539] border border-[#ffbd59]/30 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent text-white placeholder-gray-400"
                  placeholder="Detaillierte technische Anforderungen..."
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Qualitätsanforderungen
                  </label>
                  <textarea
                    value={qualityRequirements}
                    onChange={(e) => setQualityRequirements(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 bg-[#2c3539] border border-[#ffbd59]/30 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent text-white placeholder-gray-400"
                    placeholder="Qualitätsstandards..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Sicherheitsanforderungen
                  </label>
                  <textarea
                    value={safetyRequirements}
                    onChange={(e) => setSafetyRequirements(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 bg-[#2c3539] border border-[#ffbd59]/30 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent text-white placeholder-gray-400"
                    placeholder="Sicherheitsstandards..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Umweltanforderungen
                  </label>
                  <textarea
                    value={environmentalRequirements}
                    onChange={(e) => setEnvironmentalRequirements(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 bg-[#2c3539] border border-[#ffbd59]/30 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent text-white placeholder-gray-400"
                    placeholder="Umweltstandards..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Notizen */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Notizen
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 bg-[#2c3539] border border-[#ffbd59]/30 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent text-white placeholder-gray-400"
              placeholder="Zusätzliche Notizen..."
            />
          </div>

          {/* Fehleranzeige */}
          {errors.submit && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-400 mr-3" />
              <p className="text-red-300">{errors.submit}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-[#ffbd59]/20">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 border border-[#ffbd59]/30 rounded-lg text-white hover:bg-white/10 transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-[#ffbd59] text-[#2c3539] rounded-lg hover:bg-[#ffa726] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center font-medium"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#2c3539] mr-2"></div>
                  Erstelle...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Gewerk erstellen
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      
      {/* Click outside to close dropdown */}
      {showDetailsDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowDetailsDropdown(false)}
        />
      )}
    </div>
  );
} 