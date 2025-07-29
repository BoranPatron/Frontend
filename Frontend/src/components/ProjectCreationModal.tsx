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
  Info
} from 'lucide-react';

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
      'Baufortschrittsfotos',
      'Mängeldokumentation',
      'Bestandsdokumentation',
      'Videos',
      'Baustellenberichte'
    ]
  }
};

export default function ProjectCreationModal({ isOpen, onClose, onSubmit }: ProjectCreationModalProps) {
  const [activeStep, setActiveStep] = useState(1);
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
    const newFiles: UploadFile[] = files.map(file => ({
      file,
      status: 'pending',
      progress: 0,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }));

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
      <div className="bg-gradient-to-br from-[#2c3539] to-[#3d4952] rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden border border-[#ffbd59]/20">
        
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

        <div className="p-6 overflow-y-auto max-h-[calc(95vh-200px)]">
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
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-2">
                        Geplante Fertigstellung
                      </label>
                      <input
                        type="date"
                        name="planned_end_date"
                        value={formData.planned_end_date}
                        onChange={handleFormChange}
                        className="w-full px-4 py-3 bg-[#1a1a2e]/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] text-white"
                      />
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
                    <p className="text-gray-400 text-sm mb-4">
                      Unterstützte Formate: PDF, Word, Excel, Bilder, Videos (max. 50MB pro Datei)
                    </p>
                    
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
                  <p className="text-gray-300 mb-2">
                    Bitte wählen Sie eine Kategorie für die {categorizingFiles.length} Datei(en):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {categorizingFiles.map((file, index) => (
                      <span key={index} className="bg-[#ffbd59]/20 text-[#ffbd59] px-3 py-1 rounded-full text-sm">
                        {file.file.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(DOCUMENT_CATEGORIES).map(([key, category]) => {
                    const Icon = category.icon;
                    return (
                      <div key={key} className="bg-[#1a1a2e]/30 rounded-xl p-4 border border-gray-600/30">
                        <div className="flex items-center mb-3">
                          <Icon className="w-6 h-6 mr-3 text-[#ffbd59]" />
                          <h4 className="text-white font-semibold">{category.name}</h4>
                        </div>
                        
                        <div className="space-y-2">
                          {category.subcategories.map((subcategory) => (
                            <button
                              key={subcategory}
                              type="button"
                              onClick={() => handleCategoryAssignment(key, subcategory, 'other')}
                              className="w-full text-left px-3 py-2 text-gray-300 hover:text-white hover:bg-[#ffbd59]/10 rounded-lg transition-colors text-sm"
                            >
                              {subcategory}
                            </button>
                          ))}
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
    </div>
  );
} 