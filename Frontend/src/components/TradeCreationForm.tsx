import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  X, 
  Save,
  AlertTriangle,
  CheckCircle,
  Info,
  Building,
  FileCheck,
  CloudUpload,
  File,
  Image,
  Video,
  Archive,
  FolderOpen,
  Eye
} from 'lucide-react';

interface TradeCreationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (tradeData: any) => void;
  projectId: number;
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

interface ProjectDocument {
  id: number;
  title: string;
  file_name: string;
  category: string;
  subcategory?: string;
  created_at: string;
  file_size: number;
  mime_type: string;
  selected?: boolean;
}

// DMS-Kategorien (synchron mit Backend)
const DOCUMENT_CATEGORIES = {
  planning: {
    name: 'Planung & Genehmigung',
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
    subcategories: [
      'Baufortschrittsfotos',
      'Mängeldokumentation',
      'Bestandsdokumentation',
      'Videos',
      'Baustellenberichte'
    ]
  }
};

export default function TradeCreationForm({ isOpen, onClose, onSubmit, projectId }: TradeCreationFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium',
    planned_date: '',
    notes: '',
    requires_inspection: false
  });

  // Erweiterte Upload-States
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [categorizingFiles, setCategorizingFiles] = useState<UploadFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  
  // Projekt-Dokumente States
  const [projectDocuments, setProjectDocuments] = useState<ProjectDocument[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<Set<number>>(new Set());
  const [documentFilter, setDocumentFilter] = useState('all');
  const [documentSearch, setDocumentSearch] = useState('');
  
  // Original States
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projectInfo, setProjectInfo] = useState<any>(null);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Lade Projekt-Informationen und Dokumente
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

    const loadProjectDocuments = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch(`http://localhost:8000/api/v1/documents?project_id=${projectId}&limit=100`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setProjectDocuments(data.map((doc: any) => ({ ...doc, selected: false })));
        }
      } catch (error) {
        console.error('Error loading project documents:', error);
      }
    };

    if (isOpen && projectId) {
      loadProjectInfo();
      loadProjectDocuments();
    }
  }, [isOpen, projectId]);

  // Auto-Kategorisierung für neue Dateien
  useEffect(() => {
    const uncategorizedFiles = uploadFiles.filter(file => !file.category && !file.subcategory && file.status === 'pending');
    
    if (uncategorizedFiles.length > 0 && !showCategoryDialog) {
      setCategorizingFiles(uncategorizedFiles);
      setShowCategoryDialog(true);
    }
  }, [uploadFiles, showCategoryDialog]);

  // Drag & Drop Event Handlers
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      setDragOver(true);
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      if (!dropZoneRef.current?.contains(e.relatedTarget as Node)) {
        setDragOver(false);
      }
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      
      const files = Array.from(e.dataTransfer?.files || []);
      handleFilesSelected(files);
    };

    if (isOpen) {
      document.addEventListener('dragover', handleDragOver);
      document.addEventListener('dragleave', handleDragLeave);
      document.addEventListener('drop', handleDrop);
    }

    return () => {
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('dragleave', handleDragLeave);
      document.removeEventListener('drop', handleDrop);
    };
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Fehler zurücksetzen
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Neue Datei-Handling-Funktionen
  const getDocumentTypeFromFile = (file: File): string => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    
    switch (ext) {
      case 'pdf': return 'pdf';
      case 'jpg': case 'jpeg': case 'png': case 'gif': case 'bmp': return 'photo';
      case 'mp4': case 'avi': case 'mov': case 'wmv': return 'video';
      case 'doc': case 'docx': return 'report';
      case 'xls': case 'xlsx': return 'report';
      case 'ppt': case 'pptx': return 'report';
      default: return 'other';
    }
  };

  const handleFilesSelected = (files: File[]) => {
    const validFiles = files.filter(file => {
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        alert(`Datei ${file.name} ist zu groß. Maximale Größe: 50MB`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) {
      return;
    }

    const newUploadFiles: UploadFile[] = validFiles.map(file => ({
      file,
      document_type: getDocumentTypeFromFile(file),
      status: 'pending',
      progress: 0,
      id: Math.random().toString(36).substr(2, 9)
    }));

    setUploadFiles(prev => [...prev, ...newUploadFiles]);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFilesSelected(files);
  };

  // DMS-kompatible assignCategoryToFile Funktion (verwendet Index statt ID)
  const assignCategoryToFile = (index: number, category: string, subcategory?: string) => {
    // Aktualisiere sowohl categorizingFiles als auch uploadFiles
    setCategorizingFiles(prev => prev.map((file, i) => 
      i === index ? { ...file, category, subcategory } : file
    ));
    
    // Finde die entsprechende Datei in uploadFiles anhand der ID
    const targetFile = categorizingFiles[index];
    if (targetFile) {
      setUploadFiles(prev => prev.map(file => 
        file.id === targetFile.id ? { ...file, category, subcategory } : file
      ));
    }
  };

  const removeFile = (fileId: string) => {
    setUploadFiles(prev => prev.filter(file => file.id !== fileId));
  };

  // Projekt-Dokumente Funktionen
  const toggleDocumentSelection = (documentId: number) => {
    setSelectedDocuments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(documentId)) {
        newSet.delete(documentId);
      } else {
        newSet.add(documentId);
      }
      return newSet;
    });
  };

  const getFilteredDocuments = () => {
    let filtered = projectDocuments;

    // Kategorie-Filter
    if (documentFilter !== 'all') {
      filtered = filtered.filter(doc => doc.category === documentFilter);
    }

    // Such-Filter
    if (documentSearch) {
      const search = documentSearch.toLowerCase();
      filtered = filtered.filter(doc => 
        doc.title.toLowerCase().includes(search) ||
        doc.file_name.toLowerCase().includes(search) ||
        doc.category.toLowerCase().includes(search) ||
        doc.subcategory?.toLowerCase().includes(search)
      );
    }

    return filtered;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getFileIcon = (file: File | ProjectDocument) => {
    const mimeType = 'mime_type' in file ? file.mime_type : file.type;
    const type = mimeType?.toLowerCase() || '';
    
    if (type.includes('image')) return <Image className="w-5 h-5" />;
    if (type.includes('video')) return <Video className="w-5 h-5" />;
    if (type.includes('pdf') || type.includes('document')) return <FileText className="w-5 h-5" />;
    if (type.includes('zip') || type.includes('rar')) return <Archive className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) newErrors.title = 'Titel ist erforderlich';
    if (!formData.description.trim()) newErrors.description = 'Beschreibung ist erforderlich';
    if (!formData.category) newErrors.category = 'Kategorie ist erforderlich';
    if (!formData.planned_date) newErrors.planned_date = 'Geplantes Datum ist erforderlich';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const uploadDocumentsToAPI = async (files: UploadFile[]) => {
    const uploadPromises = files.map(async (uploadFile) => {
      try {
        // Setze Status auf uploading
        setUploadFiles(prev => prev.map(file => 
          file.id === uploadFile.id 
            ? { ...file, status: 'uploading', progress: 0 }
            : file
        ));

        const formData = new FormData();
        formData.append('file', uploadFile.file);
        formData.append('project_id', projectId.toString());
        formData.append('title', uploadFile.file.name.split('.')[0]);
        formData.append('description', `Dokument für Ausschreibung: ${uploadFile.file.name.split('.')[0]}`);
        formData.append('document_type', uploadFile.document_type || 'other');
        
        // Verwende DMS-kompatible Kategorien (uppercase wie im DMS)
        formData.append('category', (uploadFile.category || 'DOCUMENTATION').toUpperCase());
        formData.append('subcategory', uploadFile.subcategory || '');
        formData.append('tags', 'ausschreibung,gewerk');
        formData.append('is_public', 'true');

        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:8000/api/v1/documents/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Upload failed: ${response.statusText} - ${errorText}`);
        }

        const result = await response.json();
        
        // Update file status
        setUploadFiles(prev => prev.map(file => 
          file.id === uploadFile.id 
            ? { ...file, status: 'success', progress: 100 }
            : file
        ));

        return result;
      } catch (error) {
        console.error(`Fehler beim Upload von ${uploadFile.file.name}:`, error);
        
        // Update file status
        setUploadFiles(prev => prev.map(file => 
          file.id === uploadFile.id 
            ? { ...file, status: 'error', error: error instanceof Error ? error.message : 'Upload failed' }
            : file
        ));
        
        throw error;
      }
    });

    return Promise.allSettled(uploadPromises);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    // Prüfe ob alle Upload-Dateien kategorisiert sind (wie im DMS)
    const uncategorizedFiles = uploadFiles.filter(file => !file.category || !file.subcategory);
    if (uncategorizedFiles.length > 0) {
      setErrors(prev => ({
        ...prev,
        submit: 'Bitte kategorisieren Sie alle Dokumente bevor Sie die Ausschreibung erstellen.'
      }));
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // 1. Upload Dokumente zuerst (nur kategorisierte Dateien)
      const documentsToUpload = uploadFiles.filter(file => 
        file.status !== 'error' && file.category && file.subcategory
      );
      let uploadedDocuments = [];
      
      if (documentsToUpload.length > 0) {
        const uploadResults = await uploadDocumentsToAPI(documentsToUpload);
        uploadedDocuments = uploadResults
          .filter(result => result.status === 'fulfilled')
          .map(result => (result as PromiseFulfilledResult<any>).value);
        
        }

      // 2. Erstelle Gewerk mit Referenzen zu den hochgeladenen Dokumenten
      const { createMilestoneWithDocuments } = await import('../api/milestoneService');
      
      const milestoneData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        priority: formData.priority,
        planned_date: formData.planned_date,
        notes: formData.notes,
        project_id: projectId,
        status: 'cost_estimate',
        is_critical: false,
        notify_on_completion: false,
        requires_inspection: formData.requires_inspection,
        document_ids: uploadedDocuments.map(doc => doc.id), // Referenzen zu DMS-Dokumenten
        shared_document_ids: Array.from(selectedDocuments) // Geteilte Projekt-Dokumente
      };
      
      const result = await createMilestoneWithDocuments(milestoneData);
      // Schließe das Modal und rufe onSubmit auf
      await onSubmit(result);
      handleClose();
    } catch (error) {
      console.error('❌ Fehler beim Erstellen des Gewerks:', error);
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
      notes: '',
      requires_inspection: false
    });
    setUploadFiles([]);
    setCategorizingFiles([]);
    setShowCategoryDialog(false);
    setSelectedDocuments(new Set());
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        {/* Drag & Drop Overlay */}
        {dragOver && (
          <div className="fixed inset-0 bg-[#ffbd59]/20 backdrop-blur-sm z-60 flex items-center justify-center">
            <div className="bg-gradient-to-br from-[#2c3539] to-[#1a1a2e] rounded-2xl p-8 shadow-2xl text-center border-2 border-[#ffbd59] border-dashed">
              <CloudUpload className="w-16 h-16 text-[#ffbd59] mx-auto mb-4 animate-bounce" />
              <h3 className="text-xl font-bold text-white mb-2">Dokumente hier ablegen</h3>
              <p className="text-gray-300">Dateien werden automatisch dem Gewerk hinzugefügt</p>
            </div>
          </div>
        )}

        <div 
          ref={dropZoneRef}
          className="bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto border border-[#ffbd59]/20"
        >
          <div className="p-6 border-b border-[#ffbd59]/20">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white">Neue Ausschreibung</h2>
                {projectInfo && (
                  <p className="text-gray-300 mt-1 text-sm">
                    Projekt: <span className="text-[#ffbd59] font-medium">{projectInfo.name}</span>
                  </p>
                )}
              </div>
              
              {/* Prominente Projekt-Anzeige */}
              {projectInfo && (
                <div className="bg-gradient-to-r from-[#ffbd59]/10 via-[#ffbd59]/20 to-[#ffa726]/10 border border-[#ffbd59]/30 rounded-2xl px-6 py-4 mr-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#ffbd59]/20 rounded-lg">
                      <Building className="w-5 h-5 text-[#ffbd59]" />
                    </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-400 uppercase tracking-wider font-medium">Projekt</div>
                        <div className="text-white font-bold text-lg leading-tight">{projectInfo.name}</div>
                      </div>
                  </div>
                </div>
              )}
              
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-white transition-colors p-2"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Linke Spalte: Gewerk-Informationen */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Titel *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className={`w-full bg-[#2c3539]/50 border rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] ${
                      errors.title ? 'border-red-500' : 'border-gray-600'
                    }`}
                    placeholder="z.B. Elektroinstallation Erdgeschoss"
                  />
                  {errors.title && (
                    <p className="text-red-400 text-sm mt-1">{errors.title}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Beschreibung *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className={`w-full bg-[#2c3539]/50 border rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] resize-none ${
                      errors.description ? 'border-red-500' : 'border-gray-600'
                    }`}
                    placeholder="Detaillierte Beschreibung des Gewerks..."
                  />
                  {errors.description && (
                    <p className="text-red-400 text-sm mt-1">{errors.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Kategorie *
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className={`w-full bg-[#2c3539]/50 border rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] ${
                        errors.category ? 'border-red-500' : 'border-gray-600'
                      }`}
                    >
                      <option value="">Kategorie wählen</option>
                      <option value="electrical">Elektro</option>
                      <option value="plumbing">Sanitär</option>
                      <option value="heating">Heizung</option>
                      <option value="flooring">Bodenbelag</option>
                      <option value="painting">Malerei</option>
                      <option value="carpentry">Zimmerei</option>
                      <option value="roofing">Dachdeckerei</option>
                      <option value="landscaping">Garten- & Landschaftsbau</option>
                      <option value="civil_engineering">Tiefbau</option>
                      <option value="structural">Hochbau</option>
                      <option value="interior">Innenausbau / Interior</option>
                      <option value="facade">Fassade</option>
                      <option value="windows_doors">Fenster & Türen</option>
                      <option value="drywall">Trockenbau</option>
                      <option value="tiling">Fliesenarbeiten</option>
                      <option value="insulation">Dämmung</option>
                      <option value="hvac">Klima / Lüftung (HVAC)</option>
                      <option value="smart_home">Smart Home</option>
                      <option value="site_preparation">Erdarbeiten / Baustellenvorbereitung</option>
                      <option value="other">Sonstiges</option>
                    </select>
                    {errors.category && (
                      <p className="text-red-400 text-sm mt-1">{errors.category}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Priorität
                    </label>
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                      className="w-full bg-[#2c3539]/50 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59]"
                    >
                      <option value="low">Niedrig</option>
                      <option value="medium">Mittel</option>
                      <option value="high">Hoch</option>
                      <option value="urgent">Dringend</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Geplantes Datum *
                  </label>
                  <input
                    type="date"
                    name="planned_date"
                    value={formData.planned_date}
                    onChange={handleInputChange}
                    className={`w-full bg-[#2c3539]/50 border rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] ${
                      errors.planned_date ? 'border-red-500' : 'border-gray-600'
                    }`}
                  />
                  {errors.planned_date && (
                    <p className="text-red-400 text-sm mt-1">{errors.planned_date}</p>
                  )}
                </div>

                <div>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      name="requires_inspection"
                      checked={formData.requires_inspection}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-[#ffbd59] bg-[#2c3539]/50 border-gray-600 rounded focus:ring-[#ffbd59] focus:ring-2"
                    />
                    <span className="text-gray-300">Besichtigung erforderlich</span>
                  </label>

                  {/* Disclaimer */}
                  <div className="mt-3 p-3 bg-gradient-to-r from-[#ffbd59]/10 to-[#ffa726]/10 border border-[#ffbd59]/20 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <Info className="w-4 h-4 text-[#ffbd59] mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-[#ffbd59] text-sm font-medium">
                          Hinweis zur Besichtigung
                        </p>
                        <p className="text-gray-300 text-xs mt-1">
                          Bei aktivierter Besichtigung müssen Dienstleister vor Angebotsabgabe einen Termin vereinbaren.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Aufklappbare Erklärung */}
                  {formData.requires_inspection && (
                    <div className="mt-3 p-4 bg-gradient-to-br from-[#2c3539]/50 to-[#1a1a2e]/50 border border-gray-600/30 rounded-lg backdrop-blur-sm">
                      <div className="flex items-start space-x-2">
                        <AlertTriangle className="w-4 h-4 text-[#ffbd59] mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-[#ffbd59] text-sm font-medium mb-2">
                            Wichtige Informationen zur Besichtigung
                          </p>
                          <div className="text-gray-300 text-xs space-y-1">
                            <p>• Dienstleister müssen vor der Angebotsabgabe eine Besichtigung durchführen</p>
                            <p>• Termine werden über das BuildWise-System koordiniert</p>
                            <p>• Ohne Besichtigung können keine Angebote abgegeben werden</p>
                            <p>• Die Besichtigung ist für beide Seiten kostenlos</p>
                            <p>• Terminvereinbarung erfolgt nach Interessensbekundung</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Notizen
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full bg-[#2c3539]/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] resize-none"
                    placeholder="Zusätzliche Notizen oder Anweisungen..."
                  />
                </div>
              </div>

              {/* Rechte Spalte: Dokumenten-Upload und Auswahl */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-4">
                    Dokumente hinzufügen
                  </label>
                  
                  {/* Drag & Drop Zone */}
                  <div 
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      dragOver 
                        ? 'border-[#ffbd59] bg-[#ffbd59]/10' 
                        : 'border-gray-600 hover:border-[#ffbd59]/50'
                    }`}
                  >
                    <CloudUpload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">
                      Dateien hier ablegen
                    </h3>
                    <p className="text-gray-400 mb-4">
                      oder klicken Sie zum Auswählen
                    </p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-[#ffbd59] text-[#1a1a2e] px-6 py-2 rounded-lg font-medium hover:bg-[#ffa726] transition-colors"
                    >
                      Dateien auswählen
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      onChange={handleFileInputChange}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.mp4,.avi,.mov"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Unterstützte Formate: PDF, Word, Excel, PowerPoint, Bilder, Videos
                    </p>
                  </div>

                  {/* Upload-Liste */}
                  {uploadFiles.length > 0 && (
                    <div className="mt-6 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-300">
                          Hochgeladene Dateien ({uploadFiles.length})
                        </h4>
                        {uploadFiles.some(file => !file.category || !file.subcategory) && (
                          <button
                            type="button"
                            onClick={() => {
                              const uncategorizedFiles = uploadFiles.filter(file => !file.category || !file.subcategory);
                              setCategorizingFiles(uncategorizedFiles);
                              setShowCategoryDialog(true);
                            }}
                            className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs rounded-lg border border-red-500/30 transition-colors"
                          >
                            Kategorisieren erforderlich
                          </button>
                        )}
                      </div>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {uploadFiles.map((uploadFile) => (
                          <div
                            key={uploadFile.id}
                            className="flex items-center justify-between bg-[#2c3539]/30 rounded-lg p-3"
                          >
                            <div className="flex items-center space-x-3 flex-1">
                              <div className="text-[#ffbd59]">
                                {getFileIcon(uploadFile.file)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-white text-sm font-medium truncate">
                                  {uploadFile.file.name}
                                </p>
                                <div className="flex items-center space-x-2 text-xs text-gray-400">
                                  <span>{formatFileSize(uploadFile.file.size)}</span>
                                  {uploadFile.category && uploadFile.subcategory ? (
                                    <>
                                      <span>•</span>
                                      <span className="text-green-400">{DOCUMENT_CATEGORIES[uploadFile.category as keyof typeof DOCUMENT_CATEGORIES]?.name}</span>
                                      <span>→</span>
                                      <span className="text-green-400">{uploadFile.subcategory}</span>
                                    </>
                                  ) : (
                                    <span className="text-red-400 font-medium">• Kategorisierung erforderlich</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {/* Status-Anzeige */}
                              {uploadFile.status === 'success' && (
                                <CheckCircle className="w-4 h-4 text-green-400" />
                              )}
                              {uploadFile.status === 'error' && (
                                <AlertTriangle className="w-4 h-4 text-red-400" />
                              )}
                              {uploadFile.status === 'uploading' && (
                                <div className="w-4 h-4 border-2 border-[#ffbd59] border-t-transparent rounded-full animate-spin" />
                              )}
                              
                              <button
                                type="button"
                                onClick={() => removeFile(uploadFile.id)}
                                className="text-gray-400 hover:text-red-400 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Projekt-Dokumente Auswahl */}
                <div>
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-2 relative">
                      <span className="relative z-10 bg-gradient-to-r from-[#ffbd59] via-white to-[#ffbd59] bg-clip-text text-transparent font-bold">
                        Projekt-Dokumente für Ausschreibung auswählen
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-[#ffbd59]/20 via-[#ffbd59]/40 to-[#ffbd59]/20 rounded-lg blur-sm -z-10 animate-pulse"></div>
                      <div className="absolute -inset-1 bg-gradient-to-r from-[#ffbd59]/10 via-[#ffbd59]/20 to-[#ffbd59]/10 rounded-xl blur-md -z-20"></div>
                    </h3>
                    <p className="text-sm text-gray-400 mb-4">
                      Wählen Sie bestehende Projektdokumente aus, die den Bewerbern zur Verfügung gestellt werden sollen.
                      Diese Dokumente helfen bei der präzisen Angebotserstellung.
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#ffbd59]/10 border border-[#ffbd59]/30 rounded-full">
                          <FolderOpen className="w-4 h-4 text-[#ffbd59]" />
                          <span className="text-sm text-[#ffbd59] font-medium">
                            {projectDocuments.length} Dokument{projectDocuments.length !== 1 ? 'e' : ''} verfügbar
                          </span>
                        </div>
                        {selectedDocuments.size > 0 && (
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-full">
                            <CheckCircle className="w-4 h-4 text-green-400" />
                            <span className="text-sm text-green-400 font-medium">
                              {selectedDocuments.size} ausgewählt
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Dokument-Liste - immer sichtbar */}
                    <div className="bg-[#2c3539]/30 rounded-lg p-4 border border-gray-600/30">
                      {/* Filter & Suche */}
                      <div className="flex flex-col sm:flex-row gap-3 mb-4">
                        <div className="flex-1">
                          <input
                            type="text"
                            placeholder="Dokumente durchsuchen..."
                            value={documentSearch}
                            onChange={(e) => setDocumentSearch(e.target.value)}
                            className="w-full px-3 py-2 bg-[#1a1a2e]/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] text-white placeholder-gray-400 text-sm"
                          />
                        </div>
                                                 <div className="sm:w-48">
                           <select
                             value={documentFilter}
                             onChange={(e) => setDocumentFilter(e.target.value)}
                             className="w-full px-3 py-2 bg-[#1a1a2e]/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] text-white text-sm"
                           >
                             <option value="all">Alle Kategorien</option>
                             <optgroup label="📋 Dokumentenkategorien">
                               <option value="planning">🏗️ Planung & Genehmigung</option>
                               <option value="contracts">📄 Verträge & Rechtliches</option>
                               <option value="finance">💰 Finanzen & Abrechnung</option>
                               <option value="execution">🔨 Ausführung & Handwerk</option>
                               <option value="documentation">📁 Dokumentation & Medien</option>
                               <option value="order_confirmations">✅ Auftragsbestätigungen</option>
                             </optgroup>
                           </select>
                         </div>
                      </div>

                      {/* Dokument-Liste */}
                      <div className="space-y-2 max-h-80 overflow-y-auto">
                        {getFilteredDocuments().map((document) => {
                          const isSelected = selectedDocuments.has(document.id);
                          
                          return (
                                                         <div 
                               key={document.id} 
                               className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                                 isSelected 
                                   ? 'bg-[#ffbd59]/10 border-[#ffbd59]/50' 
                                   : 'bg-[#1a1a2e]/50 border-gray-600/30 hover:border-[#ffbd59]/30'
                               }`}
                             >
                               <div className="flex items-center space-x-3">
                                 <input
                                   type="checkbox"
                                   checked={isSelected}
                                   onChange={(e) => {
                                     e.stopPropagation();
                                     toggleDocumentSelection(document.id);
                                   }}
                                   className="w-4 h-4 text-[#ffbd59] bg-[#1a1a2e]/50 border-gray-600 rounded focus:ring-[#ffbd59] focus:ring-2 cursor-pointer"
                                 />
                                
                                <div className="text-[#ffbd59]">
                                  {getFileIcon(document)}
                                </div>
                                
                                                                 <div 
                                   className="flex-1 min-w-0 cursor-pointer"
                                   onClick={() => toggleDocumentSelection(document.id)}
                                 >
                                   <p className="text-white text-sm font-medium truncate">{document.title}</p>
                                   <div className="flex items-center space-x-2 text-xs text-gray-400">
                                     <span>{document.file_name}</span>
                                     <span>•</span>
                                     <span>{document.category}</span>
                                     {document.subcategory && (
                                       <>
                                         <span>•</span>
                                         <span>{document.subcategory}</span>
                                       </>
                                     )}
                                     <span>•</span>
                                     <span>{formatFileSize(document.file_size)}</span>
                                     <span>•</span>
                                     <span>{formatDate(document.created_at)}</span>
                                   </div>
                                 </div>
                              </div>

                              <div className="flex items-center space-x-2">
                                <Eye className="w-4 h-4 text-gray-400" />
                                {isSelected && (
                                  <CheckCircle className="w-4 h-4 text-[#ffbd59]" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                        
                        {getFilteredDocuments().length === 0 && (
                          <div className="text-center py-8">
                            <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-400">
                              {documentSearch || documentFilter !== 'all' 
                                ? 'Keine Dokumente gefunden' 
                                : 'Noch keine Dokumente im Projekt'
                              }
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                </div>
              </div>
            </div>

            {/* Submit-Bereich */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-700 mt-8">
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <div className="flex items-center space-x-2">
                  <FileCheck className="w-4 h-4" />
                  <span>{uploadFiles.length} neue Dokumente</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Eye className="w-4 h-4" />
                  <span>{selectedDocuments.size} geteilte Dokumente</span>
                </div>
                {projectInfo && (
                  <div className="flex items-center space-x-2">
                    <Building className="w-4 h-4" />
                    <span>{projectInfo.name}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#ffbd59] text-[#1a1a2e] px-8 py-2 rounded-lg font-medium hover:bg-[#ffa726] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[#1a1a2e] border-t-transparent rounded-full animate-spin" />
                      <span>Erstelle...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Ausschreibung erstellen</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {errors.submit && (
              <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <span className="text-red-400">{errors.submit}</span>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* DMS-Upload-Modal (exakte Kopie vom DMS) */}
      {showCategoryDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-[#2c3539] to-[#1a1a2e] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden border border-gray-700">
            {/* Header */}
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Dokumente kategorisieren</h2>
                <button
                  onClick={() => {
                    setShowCategoryDialog(false);
                    setCategorizingFiles([]);
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
                
            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
              <div className="space-y-4">
                {categorizingFiles.map((uploadFile, index) => (
                  <div key={uploadFile.id} className="bg-[#3d4952]/50 rounded-lg p-4 border border-gray-600">
                    <div className="flex items-start gap-4">
                      {/* File Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <File className="w-5 h-5 text-blue-400" />
                          <span className="font-medium text-white">{uploadFile.file.name}</span>
                          <span className="text-sm text-gray-400">
                            ({formatFileSize(uploadFile.file.size)})
                          </span>
                        </div>

                        {/* Category Selection - exakt wie im DMS */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">
                              Kategorie
                            </label>
                            <select
                              value={uploadFile.category || ''}
                              onChange={(e) => assignCategoryToFile(index, e.target.value)}
                              className="w-full bg-[#2c3539] border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59]"
                            >
                              <option value="">Kategorie wählen...</option>
                              {Object.entries(DOCUMENT_CATEGORIES).map(([key, category]) => (
                                <option key={key} value={key}>{category.name}</option>
                              ))}
                            </select>
                          </div>
                
                          {uploadFile.category && (
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-1">
                                Unterkategorie
                              </label>
                              <select
                                value={uploadFile.subcategory || ''}
                                onChange={(e) => assignCategoryToFile(index, uploadFile.category!, e.target.value)}
                                className="w-full bg-[#2c3539] border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59]"
                              >
                                <option value="">Unterkategorie wählen...</option>
                                {DOCUMENT_CATEGORIES[uploadFile.category as keyof typeof DOCUMENT_CATEGORIES]?.subcategories.map(sub => (
                                  <option key={sub} value={sub}>{sub}</option>
                                ))}
                              </select>

                            </div>
                          )}
                        </div>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => {
                          setCategorizingFiles(prev => prev.filter((_, i) => i !== index));
                          setUploadFiles(prev => prev.filter(file => file.id !== uploadFile.id));
                        }}
                        className="text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer - exakt wie im DMS */}
            <div className="p-6 border-t border-gray-700 flex items-center justify-between">
              <div className="text-sm text-gray-400">
                {categorizingFiles.length} Datei{categorizingFiles.length !== 1 ? 'en' : ''} ausgewählt
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setShowCategoryDialog(false);
                    setCategorizingFiles([]);
                  }}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={() => {
                    setShowCategoryDialog(false);
                    setCategorizingFiles([]);
                  }}
                  disabled={categorizingFiles.some(f => !f.category || !f.subcategory)}
                  className="bg-[#ffbd59] hover:bg-[#ffa726] disabled:bg-[#2c3539] disabled:cursor-not-allowed text-[#1a1a2e] disabled:text-gray-400 px-6 py-2 rounded-lg font-medium transition-colors"
                  title={categorizingFiles.some(f => !f.category || !f.subcategory) ? 'Bitte wählen Sie für alle Dokumente Kategorie und Unterkategorie aus' : ''}
                >
                  Kategorisierung abschließen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 
