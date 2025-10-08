import React, { useState, useRef, useCallback } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  Building, 
  MapPin, 
  Calendar,
  FolderOpen,
  CloudUpload,
  File,
  Image,
  Video,
  Archive,
  CheckCircle,
  AlertTriangle,
  Tags,
  Settings,
  Info,
  Zap,
  Sparkles,
  Target,
  Shield,
  Eye,
  EyeOff,
  Wrench,
  ChevronLeft,
  ChevronRight,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { DocumentCategorizer } from '../utils/documentCategorizer';

interface ProjectCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (projectData: any) => void;
}

interface UploadFile {
  file: File;
  category?: string;
  subcategory?: string;
  document_type?: string;
  status: 'pending' | 'categorizing' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  id: string;
  autoDetected?: boolean;
  confidence?: number;
  suggestedCategory?: string;
  suggestedSubcategory?: string;
}

// DMS-Kategorien (synchron mit Backend)
const DOCUMENT_CATEGORIES = {
  planning: {
    name: 'Planung & Genehmigung',
    icon: Building,
    color: 'blue',
    subcategories: [
      'Baupläne & Grundrisse',
      'Baugenehmigungen', 
      'Statische Berechnungen',
      'Energieausweise',
      'Vermessungsunterlagen'
    ]
  },
  contracts: {
    name: 'Verträge & Rechtliches',
    icon: FileText,
    color: 'green',
    subcategories: [
      'Bauverträge',
      'Nachträge',
      'Versicherungen',
      'Gewährleistungen',
      'Mängelrügen'
    ]
  },
  finance: {
    name: 'Finanzen & Abrechnung',
    icon: Settings,
    color: 'yellow',
    subcategories: [
      'Rechnungen',
      'Kostenvoranschläge',
      'Leistungsverzeichnisse',
      'Zahlungsbelege',
      'Änderungsaufträge',
      'Schlussrechnungen'
    ]
  },
  execution: {
    name: 'Ausführung & Handwerk',
    icon: Settings,
    color: 'orange',
    subcategories: [
      'Lieferscheine',
      'Materialbelege',
      'Abnahmeprotokolle',
      'Prüfberichte',
      'Zertifikate',
      'Arbeitsanweisungen'
    ]
  },
  documentation: {
    name: 'Dokumentation & Medien',
    icon: FolderOpen,
    color: 'purple',
    subcategories: [
      'Fotos',
      'Baufortschrittsfotos',
      'Mängeldokumentation',
      'Bestandsdokumentation',
      'Videos',
      'Baustellenberichte'
    ]
  },
  procurement: {
    name: 'Ausschreibungen & Angebote',
    icon: FileText,
    color: 'indigo',
    subcategories: [
      'Ausschreibungsunterlagen',
      'Technische Spezifikationen',
      'Angebote',
      'Angebotsbewertung',
      'Vergabedokumentation',
      'Verhandlungen'
    ]
  },
  project_management: {
    name: 'Projektmanagement',
    icon: Calendar,
    color: 'teal',
    subcategories: [
      'Projektpläne',
      'Terminplanung',
      'Budgetplanung',
      'Projektsteuerung',
      'Risikomanagement',
      'Qualitätsmanagement',
      'Ressourcenplanung',
      'Projektdokumentation'
    ]
  },
  technical: {
    name: 'Technische Unterlagen',
    icon: Wrench,
    color: 'gray',
    subcategories: [
      'Technische Zeichnungen',
      'Spezifikationen',
      'Datenblätter',
      'Handbücher',
      'Anleitungen',
      'Installationsanweisungen',
      'Wartungsanleitungen'
    ]
  },
  order_confirmations: {
    name: 'Auftragsbestätigungen',
    icon: CheckCircle,
    color: 'emerald',
    subcategories: [
      'Auftragsbestätigungen',
      'Bestellbestätigungen',
      'Leistungsbestätigungen'
    ]
  }
};

export default function ProjectCreationModal({ isOpen, onClose, onSubmit }: ProjectCreationModalProps) {
  const [activeStep, setActiveStep] = useState(1);
  const [isPrivacyBannerCollapsed, setIsPrivacyBannerCollapsed] = useState(true);
  const [showDocumentInheritanceTooltip, setShowDocumentInheritanceTooltip] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    project_type: 'new_build',
    construction_phase: '',
    address_street: '',
    address_city: '',
    address_postal_code: '',
    address_country: 'CH',
    planned_start_date: '',
    planned_end_date: '',
    budget: ''
  });

  // Dokument-Upload States
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [categorizingFiles, setCategorizingFiles] = useState<UploadFile[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Drag & Drop Handler
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFileSelection(files);
  }, []);

  const handleFileSelection = (files: File[]) => {
    const newFiles: UploadFile[] = files.map(file => {
      // Automatische Kategorisierung basierend auf Dateiname
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      const detectedCategory = DocumentCategorizer.categorizeDocument(file.name, fileExtension);
      const suggestedSubcategory = detectedCategory ? DocumentCategorizer.suggestSubcategory(detectedCategory, file.name) : null;
      
      return {
        file,
        status: 'pending',
        progress: 0,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        autoDetected: !!detectedCategory,
        confidence: detectedCategory ? DocumentCategorizer.calculateConfidence(file.name, fileExtension, detectedCategory) : 0,
        suggestedCategory: detectedCategory?.id,
        suggestedSubcategory: suggestedSubcategory || undefined
      };
    });

    setUploadFiles(prev => [...prev, ...newFiles]);
    setCategorizingFiles(newFiles);
    setShowCategoryDialog(true);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileSelection(Array.from(e.target.files));
    }
  };

  const handleCategoryAssignment = (category: string, subcategory: string, document_type: string) => {
    const updatedFiles = categorizingFiles.map(file => ({
      ...file,
      category,
      subcategory,
      document_type,
      status: 'categorizing' as const
    }));

    setUploadFiles(prev => 
      prev.map(file => {
        const updated = updatedFiles.find(f => f.id === file.id);
        return updated || file;
      })
    );

    setShowCategoryDialog(false);
    setCategorizingFiles([]);
  };

  const handleAutoAcceptSuggestions = () => {
    const updatedFiles = categorizingFiles.map(file => {
      if (file.autoDetected && file.suggestedCategory && file.suggestedSubcategory) {
        return {
          ...file,
          category: file.suggestedCategory,
          subcategory: file.suggestedSubcategory,
          document_type: 'other',
          status: 'categorizing' as const
        };
      }
      return file;
    });

    setUploadFiles(prev => 
      prev.map(file => {
        const updated = updatedFiles.find(f => f.id === file.id);
        return updated || file;
      })
    );

    setShowCategoryDialog(false);
    setCategorizingFiles([]);
  };

  const removeFile = (fileId: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const getFileIcon = (file: File) => {
    const type = file.type.toLowerCase();
    if (type.includes('image')) return Image;
    if (type.includes('video')) return Video;
    if (type.includes('pdf') || type.includes('document')) return FileText;
    if (type.includes('zip') || type.includes('rar')) return Archive;
    return File;
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate form
      const newErrors: Record<string, string> = {};
      if (!formData.name.trim()) newErrors.name = 'Projektname ist erforderlich';
      if (!formData.address_city.trim()) newErrors.address_city = 'Stadt ist erforderlich';

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        setIsSubmitting(false);
        return;
      }

      // Submit project with documents
      await onSubmit({
        ...formData,
        documents: uploadFiles.filter(f => f.status === 'categorizing')
      });

      onClose();
    } catch (error) {
      console.error('Error creating project:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-[#2c3539] to-[#3d4952] rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden border border-[#ffbd59]/20 relative">
        
        {/* Seitlicher Datenschutz-Banner */}
        <div className={`absolute top-0 right-0 h-full transition-all duration-300 ease-in-out z-10 ${
          isPrivacyBannerCollapsed ? 'w-16' : 'w-80 lg:w-80 md:w-64 sm:w-48'
        }`}>
          <div className="h-full bg-gradient-to-b from-blue-500/15 to-indigo-500/15 border-l border-blue-500/30 backdrop-blur-sm">
            {/* Toggle Button */}
            <button
              onClick={() => setIsPrivacyBannerCollapsed(!isPrivacyBannerCollapsed)}
              className="absolute top-4 left-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 hover:text-blue-300 rounded-lg p-2 transition-all duration-200 border border-blue-500/30 shadow-lg"
              title={isPrivacyBannerCollapsed ? "Datenschutz-Info anzeigen" : "Datenschutz-Info ausblenden"}
            >
              {isPrivacyBannerCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>

            {/* Collapsed State Indicator */}
            {isPrivacyBannerCollapsed && (
              <div className="space-y-2">
                <div className="absolute top-36 left-1/2 transform -translate-x-1/2 -rotate-90 origin-center">
                  <div className="flex items-center space-x-1 text-blue-300 text-xs font-medium whitespace-nowrap bg-blue-500/20 px-3 py-1 rounded border border-blue-500/30">
                    <Shield size={12} />
                    <span>Datenschutz & Sichtbarkeit</span>
                  </div>
                </div>
                
                {/* Dokumenten-Vererbung Button - DEAKTIVIERT */}
                {/* <div className="absolute top-48 left-1/2 transform -translate-x-1/2 -rotate-90 origin-center">
                  <button
                    onClick={() => setShowDocumentInheritanceTooltip(!showDocumentInheritanceTooltip)}
                    className="flex items-center space-x-1 text-green-300 text-xs font-medium whitespace-nowrap bg-green-500/20 px-3 py-1 rounded border border-green-500/30 hover:bg-green-500/30 transition-colors"
                    title={showDocumentInheritanceTooltip ? "Dokumenten-Vererbung ausblenden" : "Dokumenten-Vererbung anzeigen"}
                  >
                    <FolderOpen size={12} />
                    <span>Dokumenten-Vererbung</span>
                    {showDocumentInheritanceTooltip ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
                  </button>
                </div> */}
              </div>
            )}

            {/* Banner Content */}
            <div className={`h-full pt-16 px-4 transition-all duration-300 ${
              isPrivacyBannerCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}>
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Shield className="w-5 h-5 text-blue-400" />
                  <h4 className="text-white font-semibold text-sm">
                    Datenschutz & Sichtbarkeit
                  </h4>
                </div>
                
                <div className="text-gray-300 text-xs space-y-3">
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="flex items-start space-x-2">
                      <Eye className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-white font-medium text-xs mb-1">Alle Projektinformationen</p>
                        <p className="text-gray-400 text-xs leading-relaxed">
                          sind nur für Sie als Bauträger sichtbar und werden vertraulich behandelt.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-500/10 rounded-lg p-3 border border-yellow-500/20">
                    <div className="flex items-start space-x-2">
                      <EyeOff className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-yellow-400 font-medium text-xs mb-1">Ausnahme: Projektadresse</p>
                        <p className="text-gray-400 text-xs leading-relaxed">
                          Die Adresse wird bei der Erstellung von Ausschreibungen automatisch an Dienstleister weitergegeben, damit diese die Anschrift der Baustelle kennen.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/20">
                    <div className="flex items-start space-x-2">
                      <FolderOpen className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-green-400 font-medium text-xs mb-1">Dokumente im DMS</p>
                        <p className="text-gray-400 text-xs leading-relaxed">
                          Hochgeladene Dokumente werden diesem Projekt im Dokumenten-Management-System (DMS) zugeordnet. Bei späteren Ausschreibungen können Sie gezielt auswählen, welche Dokumente für Dienstleister sichtbar sein sollen.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#ffbd59] to-[#ff8c42] p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Building className="w-8 h-8 text-white" />
              <h2 className="text-2xl font-bold text-white">Neues Projekt erstellen</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-2"
            >
              <X size={24} />
            </button>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center mt-6 space-x-4">
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-full ${activeStep === 1 ? 'bg-white/20 text-white' : 'bg-white/10 text-white/60'}`}>
              <Building size={16} />
              <span className="text-sm font-medium">Projektdaten</span>
            </div>
            <div className="w-8 h-0.5 bg-white/30"></div>
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-full ${activeStep === 2 ? 'bg-white/20 text-white' : 'bg-white/10 text-white/60'}`}>
              <FolderOpen size={16} />
              <span className="text-sm font-medium">Dokumente</span>
            </div>
          </div>
        </div>

        <div className={`p-6 overflow-y-auto max-h-[calc(95vh-200px)] transition-all duration-300 ${
          isPrivacyBannerCollapsed ? 'mr-16' : 'mr-80 lg:mr-80 md:mr-64 sm:mr-48'
        }`}>
          <form onSubmit={handleSubmit}>
            
            {/* Step 1: Projektdaten */}
            {activeStep === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Grundinformationen */}
                  <div className="bg-[#1a1a2e]/30 rounded-xl p-6 border border-gray-600/30">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <Info className="w-5 h-5 mr-2 text-[#ffbd59]" />
                      Grundinformationen
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-200 mb-2">
                          Projektname *
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleFormChange}
                          className="w-full px-4 py-3 bg-[#1a1a2e]/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] text-white placeholder-gray-400"
                          placeholder="z.B. Einfamilienhaus München"
                        />
                        {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-200 mb-2">
                          Land
                        </label>
                        <select
                          name="address_country"
                          value={formData.address_country}
                          onChange={handleFormChange}
                          className="w-full px-4 py-3 bg-[#1a1a2e]/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] text-white"
                        >
                          <option value="CH">Schweiz</option>
                          <option value="DE">Deutschland</option>
                          <option value="AT">Österreich</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-200 mb-2">
                          Projekttyp *
                        </label>
                        <select
                          name="project_type"
                          value={formData.project_type}
                          onChange={handleFormChange}
                          className="w-full px-4 py-3 bg-[#1a1a2e]/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] text-white"
                        >
                          <option value="new_build">Neubau</option>
                          <option value="renovation">Renovierung</option>
                          <option value="extension">Anbau</option>
                          <option value="refurbishment">Sanierung</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-200 mb-2">
                          Beschreibung
                        </label>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleFormChange}
                          rows={3}
                          className="w-full px-4 py-3 bg-[#1a1a2e]/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] text-white placeholder-gray-400"
                          placeholder="Kurze Beschreibung des Projekts..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Adresse */}
                  <div className="bg-[#1a1a2e]/30 rounded-xl p-6 border border-gray-600/30">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <MapPin className="w-5 h-5 mr-2 text-[#ffbd59]" />
                      Projektadresse
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-200 mb-2">
                          Straße & Hausnummer
                        </label>
                        <input
                          type="text"
                          name="address_street"
                          value={formData.address_street}
                          onChange={handleFormChange}
                          className="w-full px-4 py-3 bg-[#1a1a2e]/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] text-white placeholder-gray-400"
                          placeholder="z.B. Musterstraße 123"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-200 mb-2">
                            PLZ
                          </label>
                          <input
                            type="text"
                            name="address_postal_code"
                            value={formData.address_postal_code}
                            onChange={handleFormChange}
                            className="w-full px-4 py-3 bg-[#1a1a2e]/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] text-white placeholder-gray-400"
                            placeholder="8000"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-200 mb-2">
                            Stadt *
                          </label>
                          <input
                            type="text"
                            name="address_city"
                            value={formData.address_city}
                            onChange={handleFormChange}
                            className="w-full px-4 py-3 bg-[#1a1a2e]/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] text-white placeholder-gray-400"
                            placeholder="Zürich"
                          />
                          {errors.address_city && <p className="text-red-400 text-sm mt-1">{errors.address_city}</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Zeitplanung & Budget */}
                <div className="bg-[#1a1a2e]/30 rounded-xl p-6 border border-gray-600/30">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-[#ffbd59]" />
                    Zeitplanung & Budget
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-2">
                        Geplanter Baubeginn
                      </label>
                      <input
                        type="date"
                        name="planned_start_date"
                        value={formData.planned_start_date}
                        onChange={handleFormChange}
                        className="w-full px-4 py-3 bg-[#1a1a2e]/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] text-white"
                      />
                      <div className="flex flex-wrap gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => {
                            const today = new Date();
                            const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
                            setFormData(prev => ({ ...prev, planned_start_date: nextMonth.toISOString().split('T')[0] }));
                          }}
                          className="px-2 py-1 text-xs bg-[#ffbd59]/20 hover:bg-[#ffbd59]/30 text-[#ffbd59] rounded border border-[#ffbd59]/30 transition-colors"
                        >
                          +1M
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const today = new Date();
                            const next3Months = new Date(today.getFullYear(), today.getMonth() + 3, today.getDate());
                            setFormData(prev => ({ ...prev, planned_start_date: next3Months.toISOString().split('T')[0] }));
                          }}
                          className="px-2 py-1 text-xs bg-[#ffbd59]/20 hover:bg-[#ffbd59]/30 text-[#ffbd59] rounded border border-[#ffbd59]/30 transition-colors"
                        >
                          +3M
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const today = new Date();
                            const next6Months = new Date(today.getFullYear(), today.getMonth() + 6, today.getDate());
                            setFormData(prev => ({ ...prev, planned_start_date: next6Months.toISOString().split('T')[0] }));
                          }}
                          className="px-2 py-1 text-xs bg-[#ffbd59]/20 hover:bg-[#ffbd59]/30 text-[#ffbd59] rounded border border-[#ffbd59]/30 transition-colors"
                        >
                          +6M
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-2">
                        <span className="hidden sm:inline">Voraussichtliches Enddatum</span>
                        <span className="sm:hidden">Vrsl. Enddatum</span>
                      </label>
                      <input
                        type="date"
                        name="planned_end_date"
                        value={formData.planned_end_date}
                        onChange={handleFormChange}
                        className="w-full px-4 py-3 bg-[#1a1a2e]/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] text-white"
                      />
                      <div className="flex flex-wrap gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => {
                            const today = new Date();
                            const next6Months = new Date(today.getFullYear(), today.getMonth() + 6, today.getDate());
                            setFormData(prev => ({ ...prev, planned_end_date: next6Months.toISOString().split('T')[0] }));
                          }}
                          className="px-2 py-1 text-xs bg-[#ffbd59]/20 hover:bg-[#ffbd59]/30 text-[#ffbd59] rounded border border-[#ffbd59]/30 transition-colors"
                        >
                          +6M
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const today = new Date();
                            const nextYear = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
                            setFormData(prev => ({ ...prev, planned_end_date: nextYear.toISOString().split('T')[0] }));
                          }}
                          className="px-2 py-1 text-xs bg-[#ffbd59]/20 hover:bg-[#ffbd59]/30 text-[#ffbd59] rounded border border-[#ffbd59]/30 transition-colors"
                        >
                          +1J
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const today = new Date();
                            const next18Months = new Date(today.getFullYear(), today.getMonth() + 18, today.getDate());
                            setFormData(prev => ({ ...prev, planned_end_date: next18Months.toISOString().split('T')[0] }));
                          }}
                          className="px-2 py-1 text-xs bg-[#ffbd59]/20 hover:bg-[#ffbd59]/30 text-[#ffbd59] rounded border border-[#ffbd59]/30 transition-colors"
                        >
                          +18M
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const today = new Date();
                            const next2Years = new Date(today.getFullYear() + 2, today.getMonth(), today.getDate());
                            setFormData(prev => ({ ...prev, planned_end_date: next2Years.toISOString().split('T')[0] }));
                          }}
                          className="px-2 py-1 text-xs bg-[#ffbd59]/20 hover:bg-[#ffbd59]/30 text-[#ffbd59] rounded border border-[#ffbd59]/30 transition-colors"
                        >
                          +2J
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-2">
                        Budget (CHF)
                      </label>
                      <input
                        type="number"
                        name="budget"
                        value={formData.budget}
                        onChange={handleFormChange}
                        className="w-full px-4 py-3 bg-[#1a1a2e]/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] text-white placeholder-gray-400"
                        placeholder="500000"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Dokumente */}
            {activeStep === 2 && (
              <div className="space-y-6">
                
                {/* Drag & Drop Bereich */}
                <div className="bg-[#1a1a2e]/30 rounded-xl p-6 border border-gray-600/30">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <CloudUpload className="w-5 h-5 mr-2 text-[#ffbd59]" />
                    Projekt-Dokumente hochladen
                  </h3>
                  
                  <div
                    ref={dropZoneRef}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                      dragOver 
                        ? 'border-[#ffbd59] bg-[#ffbd59]/10' 
                        : 'border-gray-600 hover:border-[#ffbd59]/50'
                    }`}
                  >
                    <CloudUpload className={`w-12 h-12 mx-auto mb-4 ${dragOver ? 'text-[#ffbd59]' : 'text-gray-400'}`} />
                    <p className="text-white text-lg font-medium mb-2">
                      Dokumente hier ablegen oder klicken zum Auswählen
                    </p>
                    <p className="text-gray-400 text-sm mb-2">
                      Unterstützte Formate: PDF, Word, Excel, Bilder, Videos (max. 50MB pro Datei)
                    </p>
                    <div className="flex items-center justify-center gap-2 text-[#ffbd59] text-sm font-medium">
                      <Sparkles className="w-4 h-4" />
                      <span>Automatische Kategorisierung</span>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-[#ffbd59] hover:bg-[#ff8c42] text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                      Dateien auswählen
                    </button>
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      onChange={handleFileInputChange}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.mp4,.mov,.avi"
                    />
                  </div>
                </div>

                {/* Hochgeladene Dateien */}
                {uploadFiles.length > 0 && (
                  <div className="bg-[#1a1a2e]/30 rounded-xl p-6 border border-gray-600/30">
                    <h4 className="text-lg font-semibold text-white mb-4">
                      Hochgeladene Dokumente ({uploadFiles.length})
                    </h4>
                    
                    <div className="space-y-3">
                      {uploadFiles.map((uploadFile) => {
                        const FileIcon = getFileIcon(uploadFile.file);
                        return (
                          <div key={uploadFile.id} className="flex items-center justify-between p-4 bg-[#1a1a2e]/50 rounded-lg border border-gray-600/30">
                            <div className="flex items-center space-x-3">
                              <FileIcon className="w-6 h-6 text-[#ffbd59]" />
                              <div>
                                <p className="text-white font-medium">{uploadFile.file.name}</p>
                                <p className="text-gray-400 text-sm">
                                  {(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB
                                  {uploadFile.category && (
                                    <span className="ml-2 text-[#ffbd59]">
                                      • {DOCUMENT_CATEGORIES[uploadFile.category as keyof typeof DOCUMENT_CATEGORIES]?.name}
                                      {uploadFile.subcategory && ` > ${uploadFile.subcategory}`}
                                    </span>
                                  )}
                                  {uploadFile.autoDetected && (
                                    <span className="ml-2 text-green-400 flex items-center gap-1">
                                      <Zap className="w-3 h-3" />
                                      Auto-erkannt ({uploadFile.confidence}%)
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              {uploadFile.status === 'success' && (
                                <CheckCircle className="w-5 h-5 text-green-400" />
                              )}
                              {uploadFile.status === 'error' && (
                                <AlertTriangle className="w-5 h-5 text-red-400" />
                              )}
                              <button
                                type="button"
                                onClick={() => removeFile(uploadFile.id)}
                                className="text-gray-400 hover:text-red-400 transition-colors"
                              >
                                <X size={18} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-600/30">
              <div>
                {activeStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setActiveStep(activeStep - 1)}
                    className="px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-lg font-medium transition-colors"
                  >
                    Zurück
                  </button>
                )}
              </div>
              
              <div className="flex space-x-4">
                {activeStep < 2 ? (
                  <button
                    type="button"
                    onClick={() => setActiveStep(activeStep + 1)}
                    className="px-6 py-3 bg-[#ffbd59] hover:bg-[#ff8c42] text-white rounded-lg font-medium transition-colors"
                  >
                    Weiter
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-8 py-3 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                  >
                    {isSubmitting ? 'Erstelle Projekt...' : 'Projekt erstellen'}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Kategorisierungs-Dialog */}
        {showCategoryDialog && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-gradient-to-br from-[#2c3539] to-[#3d4952] rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-y-auto border border-[#ffbd59]/20">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">Dokumente kategorisieren</h3>
                  <button
                    onClick={() => setShowCategoryDialog(false)}
                    className="text-gray-400 hover:text-[#ffbd59] transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-[#ffbd59]" />
                    <h4 className="text-lg font-semibold text-white">Intelligente Dokumentenkategorisierung</h4>
                  </div>
                  
                  <p className="text-gray-300 mb-4">
                    Automatische Kategorisierungsvorschläge erstellt:
                  </p>
                  
                  <div className="space-y-3">
                    {categorizingFiles.map((file, index) => (
                      <div key={index} className="bg-[#1a1a2e]/50 rounded-lg p-4 border border-gray-600/30">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <File className="w-5 h-5 text-blue-400" />
                            <span className="text-white font-medium">{file.file.name}</span>
                            <span className="text-gray-400 text-sm">
                              ({(file.file.size / 1024 / 1024).toFixed(2)} MB)
                            </span>
                          </div>
                          {file.autoDetected && (
                            <div className="flex items-center gap-2">
                              <Zap className="w-4 h-4 text-[#ffbd59]" />
                              <span className="text-[#ffbd59] text-sm font-medium">
                                {file.confidence}% sicher
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {file.autoDetected && file.suggestedCategory ? (
                          <div className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-green-400" />
                            <span className="text-green-400 text-sm">
                              <strong>{DOCUMENT_CATEGORIES[file.suggestedCategory as keyof typeof DOCUMENT_CATEGORIES]?.name}</strong>
                              {file.suggestedSubcategory && ` > ${file.suggestedSubcategory}`}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-400 text-sm">
                              Bitte manuell kategorisieren
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <h5 className="text-white font-medium mb-3">Kategorien auswählen:</h5>
                  <p className="text-gray-400 text-sm mb-4">
                    Klicken Sie auf eine Unterkategorie, um alle ausgewählten Dokumente zu kategorisieren. 
                    Automatisch erkannte Vorschläge sind bereits vorausgewählt.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(DOCUMENT_CATEGORIES).map(([key, category]) => {
                    const Icon = category.icon;
                    const hasAutoDetected = categorizingFiles.some(f => f.suggestedCategory === key);
                    
                    return (
                      <div key={key} className="rounded-xl p-4 border bg-[#1a1a2e]/30 border-gray-600/30">
                        <div className="flex items-center mb-3">
                          <Icon className="w-6 h-6 mr-3 text-gray-400" />
                          <h4 className="font-semibold text-gray-300">
                            {category.name}
                          </h4>
                        </div>
                        
                        <div className="space-y-2">
                          {category.subcategories.map((subcategory) => {
                            const isSuggested = categorizingFiles.some(f => 
                              f.suggestedCategory === key && f.suggestedSubcategory === subcategory
                            );
                            
                            return (
                              <button
                                key={subcategory}
                                type="button"
                                onClick={() => handleCategoryAssignment(key, subcategory, 'other')}
                                className="w-full text-left px-3 py-2 rounded-lg transition-colors text-sm text-gray-300 hover:text-white hover:bg-[#ffbd59]/10"
                              >
                                <div className="flex items-center justify-between">
                                  <span>{subcategory}</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dokumenten-Vererbung Tooltip */}
      {showDocumentInheritanceTooltip && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] text-white rounded-2xl shadow-2xl max-w-md w-full border border-green-500/20">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <FolderOpen className="w-6 h-6 mr-2 text-green-400" />
                  Dokumenten-Vererbung
                </h3>
                <button
                  onClick={() => setShowDocumentInheritanceTooltip(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="space-y-4 text-gray-300">
                <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20">
                  <h4 className="text-green-400 font-semibold mb-2 flex items-center">
                    <Eye className="w-4 h-4 mr-2" />
                    Wie funktioniert die Dokumenten-Vererbung?
                  </h4>
                  <p className="text-sm leading-relaxed">
                    Beim Erstellen von Ausschreibungen können Sie gezielt auswählen, welche Projekt-Dokumente für Dienstleister sichtbar sein sollen.
                  </p>
                </div>
                
                <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
                  <h4 className="text-blue-400 font-semibold mb-2 flex items-center">
                    <Shield className="w-4 h-4 mr-2" />
                    Datenschutz & Kontrolle
                  </h4>
                  <p className="text-sm leading-relaxed">
                    <strong>Nur die von Ihnen ausgewählten Dokumente</strong> werden an Dienstleister weitergegeben. Alle anderen Projekt-Dokumente bleiben privat und sind nur für Sie sichtbar.
                  </p>
                </div>
                
                <div className="bg-yellow-500/10 rounded-lg p-4 border border-yellow-500/20">
                  <h4 className="text-yellow-400 font-semibold mb-2 flex items-center">
                    <Info className="w-4 h-4 mr-2" />
                    Praktisches Beispiel
                  </h4>
                  <p className="text-sm leading-relaxed">
                    Sie können z.B. nur die Baupläne und technischen Spezifikationen freigeben, während interne Kostenaufstellungen und Verträge privat bleiben.
                  </p>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowDocumentInheritanceTooltip(false)}
                  className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Verstanden
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 