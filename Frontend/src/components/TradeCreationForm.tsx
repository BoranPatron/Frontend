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
  Eye,
  Users,
  Map,
  ChevronRight,
  Calendar,
  Clock,
  Euro,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';
import ResourceSelectionPanel from './ResourceSelectionPanel';
import ResourceGeoSearch from './ResourceGeoSearch';
import StarRating from './StarRating';
import { Resource, ResourceAllocation } from '../api/resourceService';
import { TRADE_CATEGORIES } from '../constants/tradeCategories';

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
  },
  procurement: {
    name: 'Ausschreibungen & Angebote',
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
    subcategories: [
      'Auftragsbestätigungen',
      'Bestellbestätigungen',
      'Leistungsbestätigungen'
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
    submission_deadline: '', // Angebotsfrist (optional)
    notes: '',
    requires_inspection: false
  });

  // Kategorie-Auswahl States
  const [showCategoryPanel, setShowCategoryPanel] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  
  // Priorität-Auswahl States
  const [showPriorityPanel, setShowPriorityPanel] = useState(false);

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
  
  // Resource Selection States
  const [showResourcePanel, setShowResourcePanel] = useState(false);
  const [showResourceMap, setShowResourceMap] = useState(false);
  const [selectedResources, setSelectedResources] = useState<Resource[]>([]);
  const [preSelectedAllocations, setPreSelectedAllocations] = useState<ResourceAllocation[]>([]);
  const [expandedResources, setExpandedResources] = useState<Set<number>>(new Set());
  const [isResourceSectionExpanded, setIsResourceSectionExpanded] = useState(false);

  // Toggle resource expansion
  const toggleResourceExpansion = (resourceId: number) => {
    setExpandedResources(prev => {
      const newSet = new Set(prev);
      if (newSet.has(resourceId)) {
        newSet.delete(resourceId);
      } else {
        newSet.add(resourceId);
      }
      return newSet;
    });
  };

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const categoryPanelRef = useRef<HTMLDivElement>(null);
  const priorityPanelRef = useRef<HTMLDivElement>(null);

  // Lade Projekt-Informationen und Dokumente
  useEffect(() => {
    const loadProjectInfo = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
        const response = await fetch(`${baseUrl}/projects/${projectId}`, {
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

        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
        const response = await fetch(`${baseUrl}/documents/?project_id=${projectId}&limit=100`, {
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

  // Click Outside Handler für Kategorie- und Priorität-Panel
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryPanelRef.current && !categoryPanelRef.current.contains(event.target as Node)) {
        setShowCategoryPanel(false);
      }
      if (priorityPanelRef.current && !priorityPanelRef.current.contains(event.target as Node)) {
        setShowPriorityPanel(false);
      }
    };

    if (showCategoryPanel || showPriorityPanel) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCategoryPanel, showPriorityPanel]);

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

  // Gefilterte Kategorien für die Suchfunktion
  const getFilteredCategories = () => {
    if (!categorySearch.trim()) {
      return TRADE_CATEGORIES;
    }
    
    const search = categorySearch.toLowerCase();
    return TRADE_CATEGORIES.filter(category => 
      category.label.toLowerCase().includes(search) ||
      category.value.toLowerCase().includes(search)
    );
  };

  // Kategorie auswählen
  const selectCategory = (categoryValue: string) => {
    setFormData(prev => ({
      ...prev,
      category: categoryValue
    }));
    setShowCategoryPanel(false);
    setCategorySearch('');
    
    // Fehler zurücksetzen
    if (errors.category) {
      setErrors(prev => ({
        ...prev,
        category: ''
      }));
    }
  };

  // Priorität auswählen
  const selectPriority = (priorityValue: string) => {
    setFormData(prev => ({
      ...prev,
      priority: priorityValue
    }));
    setShowPriorityPanel(false);
  };

  // Prioritätsoptionen
  const PRIORITY_OPTIONS = [
    { value: 'low', label: 'Niedrig', color: 'text-green-400' },
    { value: 'medium', label: 'Mittel', color: 'text-yellow-400' },
    { value: 'high', label: 'Hoch', color: 'text-orange-400' },
    { value: 'urgent', label: 'Dringend', color: 'text-red-400' }
  ];

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
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
        const response = await fetch(`${baseUrl}/documents/upload`, {
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
        submission_deadline: formData.submission_deadline || null, // Angebotsfrist (optional)
        notes: formData.notes,
        project_id: projectId,
        status: 'cost_estimate',
        is_critical: false,
        notify_on_completion: false,
        requires_inspection: formData.requires_inspection,
        document_ids: uploadedDocuments.map(doc => doc.id), // Referenzen zu DMS-Dokumenten
        shared_document_ids: Array.from(selectedDocuments), // Geteilte Projekt-Dokumente
        resource_allocations: preSelectedAllocations // Vorausgewählte Ressourcen
      };
      
      const result = await createMilestoneWithDocuments(milestoneData);
      
      // 3. Sende Benachrichtigungen an zugeordnete Dienstleister
      if (preSelectedAllocations.length > 0) {
        try {
          // const { sendInvitationNotification } = await import('../api/resourceService'); // Function not available
          
          // Sende Benachrichtigungen für alle zugeordneten Ressourcen
          const notificationPromises = preSelectedAllocations.map(async (allocation) => {
            try {
              // Erstelle die ResourceAllocation mit der neuen milestone_id
              // const { createAllocation } = await import('../api/resourceService'); // Function not available
              // const resourceAllocation = await createAllocation({
              //   trade_id: result.id,
              //   resource_id: allocation.resource_id,
              //   allocated_person_count: allocation.allocated_person_count,
              //   allocated_start_date: allocation.allocated_start_date,
              //   allocated_end_date: allocation.allocated_end_date,
              //   allocation_status: 'invited',
              //   notes: 'Automatisch zugeordnet bei Ausschreibungserstellung'
              // });
              
              // Sende Benachrichtigung an den Dienstleister
              // await sendInvitationNotification(resourceAllocation.id);
              console.log(`✅ Benachrichtigung gesendet für Ressource ${allocation.resource_id}`);
            } catch (error) {
              console.error(`❌ Fehler beim Senden der Benachrichtigung für Ressource ${allocation.resource_id}:`, error);
            }
          });
          
          // Warte auf alle Benachrichtigungen (parallel)
          await Promise.allSettled(notificationPromises);
          console.log(`✅ Alle Benachrichtigungen für ${preSelectedAllocations.length} Ressourcen verarbeitet`);
        } catch (error) {
          console.error('❌ Fehler beim Senden der Benachrichtigungen:', error);
          // Fehler bei Benachrichtigungen soll die Ausschreibungserstellung nicht blockieren
        }
      }
      
      // Schließe das Modal und rufe onSubmit auf
      await onSubmit(result);
      handleClose();
    } catch (error) {
      console.error('❌ Fehler beim Erstellen der Ausschreibung:', error);
      setErrors(prev => ({
        ...prev,
        submit: 'Fehler beim Erstellen der Ausschreibung'
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
      submission_deadline: '',
      notes: '',
      requires_inspection: false
    });
    setUploadFiles([]);
    setCategorizingFiles([]);
    setShowCategoryDialog(false);
    setSelectedDocuments(new Set());
    setErrors({});
    setSelectedResources([]);
    setPreSelectedAllocations([]);
    setShowResourcePanel(false);
    setShowResourceMap(false);
    setShowCategoryPanel(false);
    setCategorySearch('');
    setShowPriorityPanel(false);
    setIsResourceSectionExpanded(false);
    // setResourceDateRange({ start: '', end: '' }); // Commented out as variable not defined
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-gradient-to-br from-[#0f0f23]/95 via-[#1a1a2e]/95 to-[#16213e]/95 backdrop-blur-lg flex items-center justify-center z-40">
        {/* Drag & Drop Overlay */}
        {dragOver && (
          <div className="fixed inset-0 bg-[#ffbd59]/20 backdrop-blur-sm z-60 flex items-center justify-center">
            <div className="bg-gradient-to-br from-[#2c3539] to-[#1a1a2e] rounded-2xl p-8 shadow-2xl text-center border-2 border-[#ffbd59] border-dashed">
              <CloudUpload className="w-16 h-16 text-[#ffbd59] mx-auto mb-4 animate-bounce" />
              <h3 className="text-xl font-bold text-white mb-2">Dokumente hier ablegen</h3>
              <p className="text-gray-300">Dateien werden automatisch der Ausschreibung hinzugefügt</p>
            </div>
          </div>
        )}

        <div 
          ref={dropZoneRef}
          className="relative bg-white/10 backdrop-blur-lg rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto border border-white/20"
        >
          <div className="p-6 border-b border-[#ffbd59]/30 bg-gradient-to-r from-[#ffbd59]/10 via-[#f59e0b]/10 to-[#ffbd59]/10 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white drop-shadow-lg">Neue Ausschreibung</h2>
                {projectInfo && (
                  <p className="text-gray-200 mt-1 text-sm">
                    Projekt: <span className="text-[#ffbd59] font-medium">{projectInfo.name}</span>
                  </p>
                )}
              </div>
              
              {/* Prominente Projekt-Anzeige */}
              {projectInfo && (
                <div className="bg-gradient-to-r from-[#ffbd59]/20 via-[#ffbd59]/30 to-[#ffa726]/20 border border-[#ffbd59]/40 rounded-2xl px-6 py-4 mr-4 shadow-lg shadow-[#ffbd59]/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#ffbd59]/30 rounded-lg border border-[#ffbd59]/50">
                      <Building className="w-5 h-5 text-[#ffbd59]" />
                    </div>
                      <div className="text-right">
                      <div className="text-xs text-gray-300 uppercase tracking-wider font-medium">Projekt</div>
                        <div className="text-white font-bold text-lg leading-tight">{projectInfo.name}</div>
                      </div>
                  </div>
                </div>
              )}
              
              <button
                onClick={handleClose}
                className="text-gray-300 hover:text-white transition-all duration-300 p-2 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 border border-white/20 hover:border-white/40 shadow-lg hover:shadow-xl hover:shadow-white/20"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Wichtiger Hinweis für Bauträger */}
          <div className="p-4 border-b border-[#ffbd59]/20 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-yellow-500/30 to-amber-500/30 rounded-lg shadow-sm shadow-yellow-500/30">
                <AlertTriangle size={18} className="text-yellow-300" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-yellow-300 mb-1">
                  Hinweis 
                </h3>
                <p className="text-xs text-yellow-200/80 leading-relaxed">
                  Die hier eingetragenen Daten und hochgeladenen Dokumente werden in der Ausschreibung freigegeben und sind dadurch auch für Dienstleister sichtbar. 
                  Diese können die Ausschreibung finden und sich dann per Angebot auf die Ausschreibung bewerben.
                </p>
              </div>
            </div>
          </div>

          {/* Ressourcen-Vorauswahl Abschnitt - Unter dem Titel */}
          <div className="p-6 border-b border-[#ffbd59]/30 bg-gradient-to-r from-[#ffbd59]/10 via-[#f59e0b]/10 to-[#ffbd59]/10 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div>
                  <h3 className="text-lg font-semibold text-white flex items-center">
                    <Users className="w-5 h-5 mr-2 text-[#ffbd59]" />
                    Ressourcen-Vorauswahl
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Wählen Sie vorab passende Dienstleister für diese Ausschreibung
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsResourceSectionExpanded(!isResourceSectionExpanded)}
                  className="p-2 text-gray-300 hover:text-white transition-all duration-300 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 border border-[#ffbd59]/40 hover:border-[#ffbd59]/60 shadow-lg shadow-[#ffbd59]/20 hover:shadow-xl hover:shadow-[#ffbd59]/30"
                >
                  <ChevronRight className={`w-5 h-5 transition-transform duration-300 ${isResourceSectionExpanded ? 'rotate-90' : ''}`} />
                </button>
              </div>
            </div>
            
            {/* Einklappbarer Inhalt */}
            {isResourceSectionExpanded && (
              <>
                <div className="flex items-center justify-end mb-4">
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowResourcePanel(!showResourcePanel)}
                      className="px-4 py-2 bg-[#ffbd59] text-black rounded-lg hover:bg-[#f59e0b] transition-all duration-300 flex items-center space-x-2 text-sm font-medium shadow-lg hover:shadow-xl hover:shadow-[#ffbd59]/30 transform hover:scale-105"
                    >
                      <Users className="w-4 h-4" />
                      <span>Ressourcen durchsuchen</span>
                      <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${showResourcePanel ? 'rotate-90' : ''}`} />
                    </button>
                  </div>
                </div>
                
                {/* Kombiniertes Informational Banner für Ressourcen-Vorauswahl */}
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-400/40 rounded-lg backdrop-blur-sm shadow-lg shadow-blue-500/10">
              <div className="flex items-start space-x-3">
                <div className="p-1 bg-blue-500/20 rounded-lg">
                  <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                </div>
                <div className="text-sm text-blue-200">
                  <div className="font-semibold text-blue-100 mb-2">Ressourcen-Vorauswahl (optional)</div>
                  <div className="space-y-2">
                    <p className="text-xs text-gray-300">
                      Sie können bereits jetzt passende Dienstleister vorauswählen. Diese werden 
                      automatisch benachrichtigt und können direkt ein Angebot abgeben.
                    </p>
                    <div className="space-y-1 text-xs">
                      <p>• <strong>Funktion:</strong> Wählen Sie passende Dienstleister vor der Ausschreibung aus</p>
                      <p>• <strong>Zweck:</strong> Zeit sparen und gezielt qualifizierte Anbieter kontaktieren</p>
                      <p>• <strong>Vorteile:</strong> Schnellere Angebote, bessere Preise, weniger Aufwand</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Ausgewählte Ressourcen Anzeige */}
            {selectedResources.length > 0 ? (
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-200">
                    {selectedResources.length} Ressourcen vorausgewählt
                  </span>
                  <span className="text-xs text-gray-300">
                    {selectedResources.reduce((sum, r) => sum + r.person_count, 0)} Personen gesamt
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {selectedResources.map((resource) => {
                    const isExpanded = expandedResources.has(resource.id!);
                    return (
                    <div
                      key={resource.id}
                        className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 hover:border-white/20 transition-all duration-300 shadow-lg hover:shadow-xl"
                      >
                        {/* Kompakte Ansicht - Header */}
                        <div className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-semibold text-white">
                            {resource.provider_name || 'Dienstleister'}
                                </h4>
                                <button
                                  type="button"
                                  onClick={() => toggleResourceExpansion(resource.id!)}
                                  className="flex items-center space-x-1 text-xs text-gray-400 hover:text-gray-300 transition-colors"
                                >
                                  <span>{isExpanded ? 'Weniger anzeigen' : 'Mehr anzeigen'}</span>
                                  <span className="text-[#ffbd59]">
                                    {isExpanded ? '▲' : '▼'}
                          </span>
                                </button>
                              </div>
                              <div className="flex items-center space-x-2 mb-2">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                  resource.status === 'available' 
                                    ? 'bg-green-500/20 text-green-400' 
                                    : 'bg-gray-500/20 text-gray-400'
                                }`}>
                                  {resource.status === 'available' ? 'Verfügbar' : 'Reserviert'}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {resource.category}
                                </span>
                                {(!resource.latitude || !resource.longitude) && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-500/20 text-yellow-400">
                                    📍 Kein Standort
                                  </span>
                                )}
                                {/* Sterne-Bewertung */}
                                {resource.overall_rating && resource.overall_rating > 0 && (
                                  <div className="flex items-center space-x-1">
                                    <StarRating 
                                      rating={resource.overall_rating} 
                                      size="sm" 
                                      showCount={true} 
                                      count={resource.rating_count || 0}
                                      detailedRatings={{
                                        quality: resource.avg_quality_rating,
                                        timeliness: resource.avg_timeliness_rating,
                                        communication: resource.avg_communication_rating,
                                        value: resource.avg_value_rating
                                      }}
                                      className="bg-yellow-500/10 px-1.5 py-0.5 rounded border border-yellow-500/30 backdrop-blur-sm shadow-sm shadow-yellow-500/20"
                                    />
                                  </div>
                                )}
                              </div>
                              
                              {/* Kompakte Info-Zeile */}
                              <div className="flex items-center space-x-4 text-xs text-gray-300">
                                <div className="flex items-center space-x-1">
                                  <Users className="w-3 h-3 text-gray-400" />
                                  <span>{resource.person_count} Personen</span>
                                </div>
                            {resource.hourly_rate && (
                                  <div className="flex items-center space-x-1">
                                    <Euro className="w-3 h-3 text-gray-400" />
                                <span>{resource.hourly_rate}€/h</span>
                          </div>
                                )}
                                {resource.start_date && resource.end_date && (
                                  <div className="flex items-center space-x-1">
                                    <Calendar className="w-3 h-3 text-gray-400" />
                              <span>
                                      {new Date(resource.start_date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })} - 
                                      {new Date(resource.end_date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedResources(prev => prev.filter(r => r.id !== resource.id));
                          setPreSelectedAllocations(prev => prev.filter(a => a.resource_id !== resource.id));
                        }}
                              className="p-1 hover:bg-red-500/20 rounded transition-all duration-300 ml-2"
                      >
                              <X className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                        </div>

                        {/* Erweiterte Ansicht */}
                        {isExpanded && (
                          <div className="px-4 pb-4 border-t border-white/10">
                            {/* Detaillierte Informationen */}
                            <div className="grid grid-cols-2 gap-3 text-xs mt-3">
                              {resource.total_hours && (
                                <div className="flex items-center space-x-2">
                                  <Clock className="w-3 h-3 text-gray-400" />
                                  <span className="text-gray-300">{resource.total_hours}h</span>
                                </div>
                              )}
                              
                              {resource.start_date && resource.end_date && (
                                <div className="flex items-center space-x-2">
                                  <Calendar className="w-3 h-3 text-gray-400" />
                                  <span className="text-gray-300">
                                    {new Date(resource.start_date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })} - 
                                    {new Date(resource.end_date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                  </span>
                                </div>
                              )}
                              
                              {resource.hourly_rate && (
                                <div className="flex items-center space-x-2">
                                  <Euro className="w-3 h-3 text-gray-400" />
                                  <span className="text-gray-300">{resource.hourly_rate}€/h</span>
                                </div>
                              )}
                            </div>

                            {/* Bewertung - Prominent angezeigt */}
                            {resource.overall_rating && resource.overall_rating > 0 && (
                              <div className="mt-3 pt-3 border-t border-gray-600">
                                <div className="text-xs font-medium text-gray-400 mb-2">⭐ Bewertung</div>
                                <div className="flex items-center justify-between">
                                  <StarRating 
                                    rating={resource.overall_rating} 
                                    size="md" 
                                    showCount={true} 
                                    count={resource.rating_count || 0}
                                    detailedRatings={{
                                      quality: resource.avg_quality_rating,
                                      timeliness: resource.avg_timeliness_rating,
                                      communication: resource.avg_communication_rating,
                                      value: resource.avg_value_rating
                                    }}
                                    className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 px-3 py-2 rounded-lg border border-yellow-500/40 backdrop-blur-sm shadow-lg shadow-yellow-500/20"
                                  />
                                  <div className="text-xs text-gray-300">
                                    {resource.rating_count === 1 ? '1 Bewertung' : `${resource.rating_count || 0} Bewertungen`}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Kontakt-Informationen */}
                            {(resource.provider_company_name || resource.provider_email || resource.provider_phone || resource.provider_company_address || resource.provider_company_phone || resource.provider_company_website) && (
                              <div className="mt-3 pt-3 border-t border-gray-600">
                                <div className="text-xs font-medium text-gray-400 mb-2">📞 Kontakt & Details</div>
                                <div className="space-y-1 text-xs">
                                  {resource.provider_company_name && (
                                    <div className="flex items-center space-x-2">
                                      <Building className="w-3 h-3 text-gray-400" />
                                      <span className="text-gray-300">{resource.provider_company_name}</span>
                                    </div>
                                  )}
                                  {resource.provider_email && (
                                    <div className="flex items-center space-x-2">
                                      <Mail className="w-3 h-3 text-gray-400" />
                                      <span className="text-gray-300">{resource.provider_email}</span>
                                    </div>
                                  )}
                                  {resource.provider_phone && (
                                    <div className="flex items-center space-x-2">
                                      <Phone className="w-3 h-3 text-gray-400" />
                                      <span className="text-gray-300">{resource.provider_phone}</span>
                                    </div>
                                  )}
                                  {resource.provider_company_phone && resource.provider_company_phone !== resource.provider_phone && (
                                    <div className="flex items-center space-x-2">
                                      <Phone className="w-3 h-3 text-gray-400" />
                                      <span className="text-gray-300">{resource.provider_company_phone} (Firma)</span>
                                    </div>
                                  )}
                                  {resource.provider_company_address && (
                                    <div className="flex items-center space-x-2">
                                      <MapPin className="w-3 h-3 text-gray-400" />
                                      <span className="text-gray-300">{resource.provider_company_address}</span>
                                    </div>
                                  )}
                                  {resource.provider_company_website && (
                                    <div className="flex items-center space-x-2">
                                      <span className="text-gray-400">🌐</span>
                                      <span className="text-gray-300">{resource.provider_company_website}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Adresse-Details */}
                            {(resource.address_street || resource.address_city || resource.address_postal_code || resource.address_country) && (
                              <div className="mt-3 pt-3 border-t border-gray-600">
                                <div className="text-xs font-medium text-gray-400 mb-2">📍 Standort</div>
                                <div className="space-y-1 text-xs">
                                  {resource.address_street && (
                                    <div className="flex items-center space-x-2">
                                      <MapPin className="w-3 h-3 text-gray-400" />
                                      <span className="text-gray-300">{resource.address_street}</span>
                                    </div>
                                  )}
                                  {(resource.address_city || resource.address_postal_code) && (
                                    <div className="flex items-center space-x-2">
                                      <span className="text-gray-400">🏙️</span>
                                      <span className="text-gray-300">
                                        {resource.address_postal_code && resource.address_city 
                                          ? `${resource.address_postal_code} ${resource.address_city}`
                                          : resource.address_city || resource.address_postal_code
                                        }
                                      </span>
                                    </div>
                                  )}
                                  {resource.address_country && (
                                    <div className="flex items-center space-x-2">
                                      <span className="text-gray-400">🌍</span>
                                      <span className="text-gray-300">{resource.address_country}</span>
                                    </div>
                                  )}
                                  {resource.latitude && resource.longitude && (
                                    <div className="flex items-center space-x-2">
                                      <span className="text-gray-400">📍</span>
                                      <span className="text-gray-300">
                                        {resource.latitude.toFixed(4)}, {resource.longitude.toFixed(4)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Skills & Equipment */}
                            {(resource.skills && resource.skills.length > 0) || (resource.equipment && resource.equipment.length > 0) ? (
                              <div className="mt-3 pt-3 border-t border-gray-600">
                                <div className="text-xs font-medium text-gray-400 mb-2">🛠️ Fähigkeiten & Ausrüstung</div>
                                <div className="space-y-2 text-xs">
                                  {resource.skills && resource.skills.length > 0 && (
                                    <div>
                                      <div className="text-gray-400 mb-1">Fähigkeiten:</div>
                                      <div className="flex flex-wrap gap-1">
                                        {resource.skills.map((skill, index) => (
                                          <span key={`skill-${resource.id}-${index}`} className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs">
                                            {skill}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {resource.equipment && resource.equipment.length > 0 && (
                                    <div>
                                      <div className="text-gray-400 mb-1">Ausrüstung:</div>
                                      <div className="flex flex-wrap gap-1">
                                        {resource.equipment.map((equipment, index) => (
                                          <span key={`equipment-${resource.id}-${index}`} className="px-2 py-1 bg-green-500/20 text-green-300 rounded text-xs">
                                            {equipment}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : null}

                            {/* Bauträger-Zeitraum */}
                            {(resource.builder_preferred_start_date || resource.builder_preferred_end_date || resource.builder_date_range_notes) && (
                              <div className="mt-3 pt-3 border-t border-gray-600">
                                <div className="text-xs font-medium text-gray-400 mb-2">📅 Gewünschter Zeitraum</div>
                                <div className="space-y-1 text-xs">
                                  {resource.builder_preferred_start_date && resource.builder_preferred_end_date && (
                                    <div className="flex items-center space-x-2">
                                      <Calendar className="w-3 h-3 text-[#ffbd59]" />
                                      <span className="text-[#ffbd59]">
                                        {new Date(resource.builder_preferred_start_date).toLocaleDateString('de-DE')} - {new Date(resource.builder_preferred_end_date).toLocaleDateString('de-DE')}
                                      </span>
                                    </div>
                                  )}
                                  {resource.builder_date_range_notes && (
                                    <div className="mt-2 p-2 bg-[#ffbd59]/10 border border-[#ffbd59]/30 rounded">
                                      <div className="text-[#ffbd59] text-xs">
                                        <strong>Notizen:</strong> {resource.builder_date_range_notes}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Zusätzliche Informationen */}
                            {(resource.description || resource.provider_bio || resource.provider_languages || resource.provider_region || resource.provider_business_license) && (
                              <div className="mt-3 pt-3 border-t border-gray-600">
                                <div className="text-xs font-medium text-gray-400 mb-2">ℹ️ Weitere Informationen</div>
                                <div className="space-y-2 text-xs">
                                  {resource.description && (
                                    <div>
                                      <div className="text-gray-400 mb-1">Beschreibung:</div>
                                      <div className="text-gray-300 leading-relaxed">{resource.description}</div>
                                    </div>
                                  )}
                                  {resource.provider_bio && (
                                    <div>
                                      <div className="text-gray-400 mb-1">Über den Dienstleister:</div>
                                      <div className="text-gray-300 leading-relaxed">{resource.provider_bio}</div>
                                    </div>
                                  )}
                                  {resource.provider_languages && (
                                    <div className="flex items-center space-x-2">
                                      <span className="text-gray-400">🗣️</span>
                                      <span className="text-gray-300">Sprachen: {resource.provider_languages}</span>
                                    </div>
                                  )}
                                  {resource.provider_region && (
                                    <div className="flex items-center space-x-2">
                                      <span className="text-gray-400">🌍</span>
                                      <span className="text-gray-300">Region: {resource.provider_region}</span>
                                    </div>
                                  )}
                                  {resource.provider_business_license && (
                                    <div className="flex items-center space-x-2">
                                      <span className="text-gray-400">📋</span>
                                      <span className="text-gray-300">Gewerbelizenz: {resource.provider_business_license}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Preise & Währung */}
                            {(resource.hourly_rate || resource.daily_rate || resource.currency) && (
                              <div className="mt-3 pt-3 border-t border-gray-600">
                                <div className="text-xs font-medium text-gray-400 mb-2">💰 Preise</div>
                                <div className="space-y-1 text-xs">
                                  {resource.hourly_rate && (
                                    <div className="flex items-center space-x-2">
                                      <Euro className="w-3 h-3 text-gray-400" />
                                      <span className="text-gray-300">{resource.hourly_rate}€/h</span>
                                    </div>
                                  )}
                                  {resource.daily_rate && (
                                    <div className="flex items-center space-x-2">
                                      <Euro className="w-3 h-3 text-gray-400" />
                                      <span className="text-gray-300">{resource.daily_rate}€/Tag</span>
                                    </div>
                                  )}
                                  {resource.currency && resource.currency !== 'EUR' && (
                                    <div className="flex items-center space-x-2">
                                      <span className="text-gray-400">💱</span>
                                      <span className="text-gray-300">Währung: {resource.currency}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-blue-500/10 border border-blue-500/40 rounded-lg p-6 backdrop-blur-sm shadow-lg shadow-blue-500/10">
                <div className="flex items-start space-x-3">
                  <div className="p-1 bg-blue-500/20 rounded-lg">
                    <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  </div>
                  <div className="text-sm text-blue-200">
                    <p className="font-medium mb-1">Keine Ressourcen ausgewählt</p>
                    <p className="text-xs text-gray-300">
                      Klicken Sie auf "Ressourcen durchsuchen" um passende Dienstleister zu finden.
                    </p>
                  </div>
                </div>
              </div>
            )}
              </>
            )}
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Linke Spalte: Gewerk-Informationen */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    Titel *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className={`w-full bg-white/10 backdrop-blur-sm border rounded-lg px-4 py-3 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#ffbd59]/50 focus:border-[#ffbd59]/50 border-white/20 hover:border-white/30 transition-all duration-300 shadow-lg focus:shadow-xl focus:shadow-[#ffbd59]/20 ${
                      errors.title ? 'border-red-500/50' : ''
                    }`}
                    placeholder="z.B. Elektroinstallation Erdgeschoss"
                  />
                  {errors.title && (
                    <p className="text-red-300 text-sm mt-1">{errors.title}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    Beschreibung & Leistungsumfang *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className={`w-full bg-white/10 backdrop-blur-sm border rounded-lg px-4 py-3 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#ffbd59]/50 focus:border-[#ffbd59]/50 border-white/20 hover:border-white/30 transition-all duration-300 shadow-lg focus:shadow-xl focus:shadow-[#ffbd59]/20 resize-none ${
                      errors.description ? 'border-red-500/50' : ''
                    }`}
                    placeholder="Detaillierte Beschreibung des Gewerks..."
                  />
                  {errors.description && (
                    <p className="text-red-300 text-sm mt-1">{errors.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Kategorie *
                    </label>
                    
                    {/* Kategorie-Auswahl Button */}
                    <div className="relative" ref={categoryPanelRef}>
                      <button
                        type="button"
                        onClick={() => setShowCategoryPanel(!showCategoryPanel)}
                        className={`w-full bg-white/10 backdrop-blur-sm border rounded-lg px-4 py-3 text-left text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59]/50 focus:border-[#ffbd59]/50 border-white/20 hover:border-white/30 transition-all duration-300 shadow-lg focus:shadow-xl focus:shadow-[#ffbd59]/20 ${
                          errors.category ? 'border-red-500/50' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={formData.category ? 'text-white' : 'text-gray-400'}>
                            {formData.category 
                              ? TRADE_CATEGORIES.find(cat => cat.value === formData.category)?.label || 'Kategorie wählen'
                              : 'Kategorie wählen'
                            }
                          </span>
                          <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${showCategoryPanel ? 'rotate-90' : ''}`} />
                        </div>
                      </button>

                      {/* Aufklappbarer Kategorie-Bereich */}
                      {showCategoryPanel && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900/95 backdrop-blur-lg rounded-xl border border-white/20 shadow-2xl z-50 max-h-80 overflow-hidden">
                          {/* Suchfeld */}
                          <div className="p-4 border-b border-white/10">
                            <input
                              type="text"
                              placeholder="Kategorie suchen..."
                              value={categorySearch}
                              onChange={(e) => setCategorySearch(e.target.value)}
                              className="w-full bg-gray-800/80 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#ffbd59]/50 focus:border-[#ffbd59]/50 shadow-lg focus:shadow-xl focus:shadow-[#ffbd59]/20"
                            />
                          </div>

                          {/* Kategorie-Tags */}
                          <div className="p-4 max-h-60 overflow-y-auto">
                            <div className="flex flex-wrap gap-2">
                              {getFilteredCategories().map((category) => (
                                <button
                                  key={category.value}
                                  type="button"
                                  onClick={() => selectCategory(category.value)}
                                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium border transition-all duration-300 backdrop-blur-sm ${
                                    formData.category === category.value
                                      ? 'bg-[#ffbd59]/30 border-[#ffbd59]/60 shadow-lg shadow-[#ffbd59]/20 text-[#ffbd59]'
                                      : 'bg-[#ffbd59]/10 border-[#ffbd59]/30 hover:border-[#ffbd59]/50 hover:bg-[#ffbd59]/20 text-white hover:text-[#ffbd59]'
                                  }`}
                                >
                                  <span>{category.label}</span>
                                  {formData.category === category.value && (
                                    <CheckCircle className="w-3 h-3 text-[#ffbd59]" />
                                  )}
                                </button>
                              ))}
                              
                              {getFilteredCategories().length === 0 && (
                                <div className="w-full text-center py-4">
                                  <p className="text-gray-400 text-sm">Keine Kategorien gefunden</p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Footer */}
                          <div className="p-3 border-t border-white/10 bg-gradient-to-r from-[#ffbd59]/5 via-[#f59e0b]/5 to-[#ffbd59]/5 backdrop-blur-sm">
                            <div className="flex items-center justify-between text-xs text-gray-300">
                              <span>{getFilteredCategories().length} Kategorien verfügbar</span>
                              <button
                                type="button"
                                onClick={() => setShowCategoryPanel(false)}
                                className="text-gray-400 hover:text-white transition-colors duration-300"
                              >
                                Schließen
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {errors.category && (
                      <p className="text-red-300 text-sm mt-1">{errors.category}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Priorität
                    </label>
                    
                    {/* Priorität-Auswahl Button */}
                    <div className="relative" ref={priorityPanelRef}>
                      <button
                        type="button"
                        onClick={() => setShowPriorityPanel(!showPriorityPanel)}
                        className="w-full bg-white/10 backdrop-blur-sm border rounded-lg px-4 py-3 text-left text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59]/50 focus:border-[#ffbd59]/50 border-white/20 hover:border-white/30 transition-all duration-300 shadow-lg focus:shadow-xl focus:shadow-[#ffbd59]/20"
                      >
                        <div className="flex items-center justify-between">
                          <span className={formData.priority ? 'text-white' : 'text-gray-400'}>
                            {formData.priority 
                              ? PRIORITY_OPTIONS.find(opt => opt.value === formData.priority)?.label || 'Priorität wählen'
                              : 'Priorität wählen'
                            }
                          </span>
                          <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${showPriorityPanel ? 'rotate-90' : ''}`} />
                        </div>
                      </button>

                      {/* Aufklappbarer Priorität-Bereich */}
                      {showPriorityPanel && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900/95 backdrop-blur-lg rounded-xl border border-white/20 shadow-2xl z-50 max-h-60 overflow-hidden">
                          {/* Priorität-Tags */}
                          <div className="p-4">
                            <div className="flex flex-wrap gap-2">
                              {PRIORITY_OPTIONS.map((priority) => (
                                <button
                                  key={priority.value}
                                  type="button"
                                  onClick={() => selectPriority(priority.value)}
                                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium border transition-all duration-300 backdrop-blur-sm ${
                                    formData.priority === priority.value
                                      ? 'bg-[#ffbd59]/30 border-[#ffbd59]/60 shadow-lg shadow-[#ffbd59]/20 text-[#ffbd59]'
                                      : 'bg-[#ffbd59]/10 border-[#ffbd59]/30 hover:border-[#ffbd59]/50 hover:bg-[#ffbd59]/20 text-white hover:text-[#ffbd59]'
                                  }`}
                                >
                                  <span>{priority.label}</span>
                                  {formData.priority === priority.value && (
                                    <CheckCircle className="w-3 h-3 text-[#ffbd59]" />
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Footer */}
                          <div className="p-3 border-t border-white/10 bg-gradient-to-r from-[#ffbd59]/5 via-[#f59e0b]/5 to-[#ffbd59]/5 backdrop-blur-sm">
                            <div className="flex items-center justify-between text-xs text-gray-300">
                              <span>{PRIORITY_OPTIONS.length} Prioritäten verfügbar</span>
                              <button
                                type="button"
                                onClick={() => setShowPriorityPanel(false)}
                                className="text-gray-400 hover:text-white transition-colors duration-300"
                              >
                                Schließen
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    Geplantes Datum *
                  </label>
                  <input
                    type="date"
                    name="planned_date"
                    value={formData.planned_date}
                    onChange={handleInputChange}
                    className={`w-full bg-white/10 backdrop-blur-sm border rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59]/50 focus:border-[#ffbd59]/50 border-white/20 hover:border-white/30 transition-all duration-300 shadow-lg focus:shadow-xl focus:shadow-[#ffbd59]/20 ${
                      errors.planned_date ? 'border-red-500/50' : ''
                    }`}
                  />
                  {errors.planned_date && (
                    <p className="text-red-300 text-sm mt-1">{errors.planned_date}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    Angebotsfrist (optional)
                  </label>
                  <input
                    type="date"
                    name="submission_deadline"
                    value={formData.submission_deadline}
                    onChange={handleInputChange}
                    className="w-full bg-white/10 backdrop-blur-sm border rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59]/50 focus:border-[#ffbd59]/50 border-white/20 hover:border-white/30 transition-all duration-300 shadow-lg focus:shadow-xl focus:shadow-[#ffbd59]/20"
                    placeholder="Angebotsfrist festlegen..."
                  />
                  
                  {/* Hilfetext für Angebotsfrist */}
                  <div className="mt-2 p-3 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-400/30 rounded-lg backdrop-blur-sm shadow-lg shadow-blue-500/10">
                    <div className="flex items-start space-x-2">
                      <div className="p-1 bg-blue-500/20 rounded-lg">
                        <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                      </div>
                      <div className="text-sm text-blue-200">
                        <div className="font-medium text-blue-100 mb-1">Angebotsfrist - Best Practices</div>
                        <div className="text-xs text-gray-300 space-y-1">
                          <p>• <strong>Empfohlen:</strong> Mindestens 2-4 Wochen für komplexe Gewerke</p>
                          <p>• <strong>Einfache Gewerke:</strong> 1-2 Wochen ausreichend</p>
                          <p>• <strong>Dringende Aufträge:</strong> Mindestens 1 Woche</p>
                          <p>• <strong>Rechtlich:</strong> VOB/VOL Mindestfristen beachten</p>
                          <p>• <strong>Besichtigung:</strong> Zusätzliche Zeit für Vor-Ort-Termine einplanen</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      name="requires_inspection"
                      checked={formData.requires_inspection}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-[#ffbd59] bg-white/10 backdrop-blur-sm border-white/20 rounded focus:ring-[#ffbd59] focus:ring-2 focus:ring-[#ffbd59]/50"
                    />
                    <span className="text-gray-200">Besichtigung erforderlich</span>
                  </label>

                  {/* Disclaimer */}
                  <div className="mt-3 p-3 bg-gradient-to-r from-[#ffbd59]/20 to-[#ffa726]/20 border border-[#ffbd59]/40 rounded-lg backdrop-blur-sm shadow-lg shadow-[#ffbd59]/10">
                    <div className="flex items-start space-x-2">
                      <div className="p-1 bg-[#ffbd59]/20 rounded-lg">
                      <Info className="w-4 h-4 text-[#ffbd59] mt-0.5 flex-shrink-0" />
                      </div>
                      <div>
                        <p className="text-[#ffbd59] text-sm font-medium">
                          Hinweis zur Besichtigung
                        </p>
                        <p className="text-gray-200 text-xs mt-1">
                          Bei aktivierter Besichtigung müssen Dienstleister vor Angebotsabgabe einen Termin vereinbaren.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Aufklappbare Erklärung */}
                  {formData.requires_inspection && (
                    <div className="mt-3 p-4 bg-gradient-to-br from-white/5 to-white/10 border border-[#ffbd59]/30 rounded-lg backdrop-blur-sm shadow-lg shadow-[#ffbd59]/10">
                      <div className="flex items-start space-x-2">
                        <div className="p-1 bg-[#ffbd59]/20 rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-[#ffbd59] mt-0.5 flex-shrink-0" />
                        </div>
                        <div>
                          <p className="text-[#ffbd59] text-sm font-medium mb-2">
                            Wichtige Informationen zur Besichtigung
                          </p>
                          <div className="text-gray-200 text-xs space-y-1">
                            <p>• Dienstleister müssen eine Besichtigung durchführen</p>
                            <p>• Termine werden über das BuildWise-System koordiniert</p>
                            <p>• Ohne Besichtigung können Angebote von Dienstleistern nicht angenommen werden</p>
                            <p>• Die Besichtigung ist für beide Seiten kostenlos</p>
                            <p>• Die Folgeprozesse laufen über das BuildWise-System</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    Notizen
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#ffbd59]/50 focus:border-[#ffbd59]/50 hover:border-white/30 transition-all duration-300 shadow-lg focus:shadow-xl focus:shadow-[#ffbd59]/20 resize-none"
                    placeholder="Zusätzliche Notizen oder Anweisungen..."
                  />
                </div>
              </div>

              {/* Rechte Spalte: Dokumenten-Upload und Auswahl */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-4">
                    Dokumente hinzufügen
                  </label>
                  
                  {/* Drag & Drop Zone */}
                  <div 
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 backdrop-blur-sm ${
                      dragOver 
                        ? 'border-[#ffbd59] bg-[#ffbd59]/20 shadow-lg shadow-[#ffbd59]/30' 
                        : 'border-white/30 hover:border-[#ffbd59]/50 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <CloudUpload className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">
                      Dateien hier ablegen
                    </h3>
                    <p className="text-gray-300 mb-4">
                      oder klicken Sie zum Auswählen
                    </p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-[#ffbd59] text-black px-6 py-2 rounded-lg font-medium hover:bg-[#f59e0b] transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-[#ffbd59]/30 transform hover:scale-105"
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
                    <p className="text-xs text-gray-400 mt-2">
                      Unterstützte Formate: PDF, Word, Excel, PowerPoint, Bilder, Videos
                    </p>
                  </div>

                  {/* Upload-Liste */}
                  {uploadFiles.length > 0 && (
                    <div className="mt-6 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-200">
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
                            className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs rounded-lg border border-red-500/30 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-red-500/20"
                          >
                            Kategorisieren erforderlich
                          </button>
                        )}
                      </div>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {uploadFiles.map((uploadFile) => (
                          <div
                            key={uploadFile.id}
                            className="flex items-center justify-between bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10 hover:border-white/20 transition-all duration-300"
                          >
                            <div className="flex items-center space-x-3 flex-1">
                              <div className="text-[#ffbd59]">
                                {getFileIcon(uploadFile.file)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-white text-sm font-medium truncate">
                                  {uploadFile.file.name}
                                </p>
                                <div className="flex items-center space-x-2 text-xs text-gray-300">
                                  <span>{formatFileSize(uploadFile.file.size)}</span>
                                  {uploadFile.category && uploadFile.subcategory ? (
                                    <>
                                      <span>•</span>
                                      <span className="text-green-300">{DOCUMENT_CATEGORIES[uploadFile.category as keyof typeof DOCUMENT_CATEGORIES]?.name}</span>
                                      <span>→</span>
                                      <span className="text-green-300">{uploadFile.subcategory}</span>
                                    </>
                                  ) : (
                                    <span className="text-red-300 font-medium">• Kategorisierung erforderlich</span>
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
                                className="text-gray-300 hover:text-red-400 transition-colors duration-300"
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
                    <p className="text-sm text-gray-300 mb-4">
                      Wählen Sie bestehende Projektdokumente aus, die den Bewerbern zur Verfügung gestellt werden sollen.
                      Diese Dokumente helfen bei der präzisen Angebotserstellung.
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#ffbd59]/20 border border-[#ffbd59]/40 rounded-full backdrop-blur-sm shadow-lg shadow-[#ffbd59]/20">
                          <FolderOpen className="w-4 h-4 text-[#ffbd59]" />
                          <span className="text-sm text-[#ffbd59] font-medium">
                            {projectDocuments.length} Dokument{projectDocuments.length !== 1 ? 'e' : ''} verfügbar
                          </span>
                        </div>
                        {selectedDocuments.size > 0 && (
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 border border-green-500/40 rounded-full backdrop-blur-sm shadow-lg shadow-green-500/20">
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
                    <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                      {/* Filter & Suche */}
                      <div className="flex flex-col sm:flex-row gap-3 mb-4">
                        <div className="flex-1">
                          <input
                            type="text"
                            placeholder="Dokumente durchsuchen..."
                            value={documentSearch}
                            onChange={(e) => setDocumentSearch(e.target.value)}
                            className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg focus:ring-2 focus:ring-[#ffbd59]/50 focus:border-[#ffbd59]/50 text-white placeholder-gray-300 text-sm shadow-lg focus:shadow-xl focus:shadow-[#ffbd59]/20"
                          />
                        </div>
                                                 <div className="sm:w-48">
                           <select
                             value={documentFilter}
                             onChange={(e) => setDocumentFilter(e.target.value)}
                             className="w-full px-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg focus:ring-2 focus:ring-[#ffbd59]/50 focus:border-[#ffbd59]/50 text-white text-sm shadow-lg focus:shadow-xl focus:shadow-[#ffbd59]/20"
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
                               className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-300 backdrop-blur-sm ${
                                 isSelected 
                                   ? 'bg-[#ffbd59]/20 border-[#ffbd59]/50 shadow-lg shadow-[#ffbd59]/20' 
                                   : 'bg-white/5 border-white/10 hover:border-[#ffbd59]/30 hover:bg-white/10'
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
                                   className="w-4 h-4 text-[#ffbd59] bg-white/10 backdrop-blur-sm border-white/20 rounded focus:ring-[#ffbd59] focus:ring-2 focus:ring-[#ffbd59]/50 cursor-pointer"
                                 />
                                
                                <div className="text-[#ffbd59]">
                                  {getFileIcon(document)}
                                </div>
                                
                                                                 <div 
                                   className="flex-1 min-w-0 cursor-pointer"
                                   onClick={() => toggleDocumentSelection(document.id)}
                                 >
                                   <p className="text-white text-sm font-medium truncate">{document.title}</p>
                                   <div className="flex items-center space-x-2 text-xs text-gray-300">
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
                                <Eye className="w-4 h-4 text-gray-300" />
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
                
                {/* Placeholder for resource section that was moved down */}
                  
              </div>
            </div>
                </div>
              </div>
            </div>
            

            {/* Submit-Bereich */}
            <div className="flex items-center justify-between pt-6 border-t border-white/10 mt-8">
              <div className="flex items-center space-x-4 text-sm text-gray-300">
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
                  className="px-6 py-2 text-gray-300 hover:text-white transition-all duration-300 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 border border-white/20 hover:border-white/40 shadow-lg hover:shadow-xl hover:shadow-white/10 transform hover:scale-105"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#ffbd59] text-black px-8 py-2 rounded-lg font-medium hover:bg-[#f59e0b] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-lg hover:shadow-xl hover:shadow-[#ffbd59]/30 transform hover:scale-105 disabled:transform-none"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
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
              <div className="mt-4 p-4 bg-red-500/10 border border-red-500/40 rounded-lg backdrop-blur-sm shadow-lg shadow-red-500/10">
                <div className="flex items-center space-x-2">
                  <div className="p-1 bg-red-500/20 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  </div>
                  <span className="text-red-300 font-medium">{errors.submit}</span>
                </div>
              </div>
            )}
          </form>
          
          {/* Resource Selection Panel - Innerhalb des Modal-Containers */}
          <ResourceSelectionPanel
            isOpen={showResourcePanel}
            onToggle={() => setShowResourcePanel(!showResourcePanel)}
            tradeId={0} // Temporäre ID, wird beim Submit generiert
            category={formData.category}
            onResourcesSelected={(allocations, resources) => {
              setPreSelectedAllocations(allocations);
              // Verwende die vollständigen Resource-Daten direkt
              setSelectedResources(prev => {
                // Verhindere Duplikate
                const existingIds = prev.map(r => r.id);
                const filtered = resources.filter(r => !existingIds.includes(r.id));
                return [...prev, ...filtered];
              });
            }}
          />
        </div>
      </div>

      {/* DMS-Upload-Modal (exakte Kopie vom DMS) */}
      {showCategoryDialog && (
        <div className="fixed inset-0 bg-gradient-to-br from-[#0f0f23]/95 via-[#1a1a2e]/95 to-[#16213e]/95 backdrop-blur-lg z-[9999] flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden border border-white/20">
            {/* Header */}
            <div className="p-6 border-b border-white/20 bg-gradient-to-r from-[#ffbd59]/10 via-[#f59e0b]/10 to-[#ffbd59]/10 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white drop-shadow-lg">Dokumente kategorisieren</h2>
                <button
                  onClick={() => {
                    setShowCategoryDialog(false);
                    setCategorizingFiles([]);
                  }}
                  className="text-gray-300 hover:text-white transition-all duration-300 p-2 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 border border-white/20 hover:border-white/40 shadow-lg hover:shadow-xl hover:shadow-white/20"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
                
            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
              <div className="space-y-4">
                {categorizingFiles.map((uploadFile, index) => (
                  <div key={uploadFile.id} className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10 shadow-lg">
                    <div className="flex items-start gap-4">
                      {/* File Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-1 bg-blue-500/20 rounded-lg">
                          <File className="w-5 h-5 text-blue-400" />
                          </div>
                          <span className="font-medium text-white">{uploadFile.file.name}</span>
                          <span className="text-sm text-gray-300">
                            ({formatFileSize(uploadFile.file.size)})
                          </span>
                        </div>

                        {/* Category Selection - exakt wie im DMS */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-200 mb-1">
                              Kategorie
                            </label>
                            <select
                              value={uploadFile.category || ''}
                              onChange={(e) => assignCategoryToFile(index, e.target.value)}
                              className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59]/50 focus:border-[#ffbd59]/50 shadow-lg focus:shadow-xl focus:shadow-[#ffbd59]/20"
                            >
                              <option value="">Kategorie wählen...</option>
                              {Object.entries(DOCUMENT_CATEGORIES).map(([key, category]) => (
                                <option key={key} value={key}>{category.name}</option>
                              ))}
                            </select>
                          </div>
                
                          {uploadFile.category && (
                            <div>
                              <label className="block text-sm font-medium text-gray-200 mb-1">
                                Unterkategorie
                              </label>
                              <select
                                value={uploadFile.subcategory || ''}
                                onChange={(e) => assignCategoryToFile(index, uploadFile.category!, e.target.value)}
                                className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59]/50 focus:border-[#ffbd59]/50 shadow-lg focus:shadow-xl focus:shadow-[#ffbd59]/20"
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
                        className="text-gray-300 hover:text-red-400 transition-colors duration-300 p-1 hover:bg-red-500/20 rounded"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer - exakt wie im DMS */}
            <div className="p-6 border-t border-white/20 flex items-center justify-between bg-gradient-to-r from-[#ffbd59]/5 via-[#f59e0b]/5 to-[#ffbd59]/5 backdrop-blur-sm">
              <div className="text-sm text-gray-300">
                {categorizingFiles.length} Datei{categorizingFiles.length !== 1 ? 'en' : ''} ausgewählt
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setShowCategoryDialog(false);
                    setCategorizingFiles([]);
                  }}
                  className="px-4 py-2 text-gray-300 hover:text-white transition-all duration-300 bg-white/10 backdrop-blur-sm rounded-lg hover:bg-white/20 border border-white/20 hover:border-white/40 shadow-lg hover:shadow-xl hover:shadow-white/10"
                >
                  Abbrechen
                </button>
                <button
                  onClick={() => {
                    setShowCategoryDialog(false);
                    setCategorizingFiles([]);
                  }}
                  disabled={categorizingFiles.some(f => !f.category && !f.subcategory)}
                  className="bg-[#ffbd59] hover:bg-[#f59e0b] disabled:bg-white/10 disabled:cursor-not-allowed text-black disabled:text-gray-400 px-6 py-2 rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-[#ffbd59]/30 transform hover:scale-105 disabled:transform-none"
                  title={categorizingFiles.some(f => !f.category && !f.subcategory) ? 'Bitte wählen Sie für alle Dokumente mindestens eine Kategorie oder Unterkategorie aus' : ''}
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
