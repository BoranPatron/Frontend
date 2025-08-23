import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  X, 
  Save, 
  Upload, 
  FileText, 
  Calculator,
  Euro,
  Building,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Info,
  Eye,
  Star,
  Target,
  Wrench,
  Award,
  FileImage,
  FileArchive
} from 'lucide-react';

interface CostEstimateFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (costEstimateData: any) => void;
  trade: any;
  project: any;
}

interface CostEstimateFormData {
  // Basis-Informationen
  quote_number: string;
  title: string;
  description: string;
  total_amount: string;
  currency: string;
  valid_until: string;
  
  // Zeitplan
  estimated_duration: string;
  start_date: string;
  completion_date: string;
  
  // Kostenaufschlüsselung
  labor_cost: string;
  material_cost: string;
  overhead_cost: string;
  
  // Zahlungsbedingungen
  payment_terms: string;
  
  // Dienstleister-Informationen
  company_name: string;
  contact_person: string;
  phone: string;
  email: string;
  website: string;
  
  // Qualifikationen und Referenzen
  qualifications: string;
  references: string;
  certifications: string;
  
  // Technische Details
  technical_approach: string;
  quality_standards: string;
  safety_measures: string;
  environmental_compliance: string;
  
  // Risiko-Bewertung
  risk_assessment: string;
  contingency_plan: string;
  
  // Dokumente
  documents: File[];
  
  // Zusätzliche Informationen
  additional_notes: string;
}

export default function CostEstimateForm({ isOpen, onClose, onSubmit, trade, project }: CostEstimateFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<CostEstimateFormData>({
    quote_number: '',
    title: '',
    description: '',
    total_amount: '',
    currency: 'CHF',
    valid_until: '',
    estimated_duration: '',
    start_date: '',
    completion_date: '',
    labor_cost: '',
    material_cost: '',
    overhead_cost: '',
    payment_terms: '',
    company_name: '',
    contact_person: '',
    phone: '',
    email: '',
    website: '',
    qualifications: '',
    references: '',
    certifications: '',
    technical_approach: '',
    quality_standards: '',
    safety_measures: '',
    environmental_compliance: '',
    risk_assessment: '',
    contingency_plan: '',
    documents: [],
    additional_notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Automatische Befüllung der Benutzerdaten beim Öffnen des Formulars
  useEffect(() => {
    if (isOpen && user) {
      setFormData(prev => ({
        ...prev,
        company_name: user.company_name || '',
        contact_person: user.first_name && user.last_name 
          ? `${user.first_name} ${user.last_name}` 
          : user.first_name || user.last_name || '',
        email: user.email || ''
      }));
    }
  }, [isOpen, user]);

  // Formular-Handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFormData(prev => ({
        ...prev,
        documents: [...prev.documents, ...newFiles]
      }));
    }
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  };

  const getFileIcon = (file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf': return <FileText size={16} className="text-red-400" />;
      case 'doc':
      case 'docx': return <FileText size={16} className="text-blue-400" />;
      case 'xls':
      case 'xlsx': return <FileText size={16} className="text-green-400" />;
      case 'ppt':
      case 'pptx': return <FileText size={16} className="text-orange-400" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif': return <FileImage size={16} className="text-purple-400" />;
      case 'zip':
      case 'rar': return <FileArchive size={16} className="text-gray-400" />;
      default: return <FileText size={16} className="text-gray-400" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateForm = () => {
    const errors: string[] = [];
    
    if (!formData.quote_number) errors.push('Angebotsnummer');
    if (!formData.total_amount) errors.push('Gesamtbetrag');
    if (!formData.valid_until) errors.push('Gültig bis');

    if (!formData.start_date) errors.push('Startdatum');
    if (!formData.completion_date) errors.push('Fertigstellungsdatum');
    if (!formData.company_name) errors.push('Firmenname');
    if (!formData.contact_person) errors.push('Ansprechpartner');
    if (!formData.email) errors.push('E-Mail');
    
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (errors.length > 0) {
      setError(`Bitte füllen Sie folgende Pflichtfelder aus: ${errors.join(', ')}`);
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Bereite die Kostenvoranschlag-Daten vor
      const costEstimateData = {
        ...formData,
        trade_id: trade.id,
        project_id: project.id,
        status: 'submitted',
        // Konvertiere numerische Werte
        total_amount: parseFloat(formData.total_amount) || 0,
        labor_cost: parseFloat(formData.labor_cost) || 0,
        material_cost: parseFloat(formData.material_cost) || 0,
        overhead_cost: parseFloat(formData.overhead_cost) || 0,
        estimated_duration: formData.estimated_duration ? parseInt(formData.estimated_duration) : null,
        // Entferne das documents Array für die Quote API
        documents: undefined
      };

      // Erstelle den Kostenvoranschlag
      const createdQuote = await onSubmit(costEstimateData);
      
      // Lade Dokumente hoch, falls vorhanden
      if (formData.documents.length > 0 && (createdQuote as any)?.id) {
        setSuccess('Erstangebot erstellt, lade Dokumente hoch...');
        
        const uploadPromises = formData.documents.map(async (file) => {
          try {
            const uploadFormData = new FormData();
            uploadFormData.append('file', file);
            uploadFormData.append('title', file.name.replace(/\.[^/.]+$/, ""));
                                        uploadFormData.append('description', `Dokument für Erstangebot: ${formData.title}`);
            uploadFormData.append('project_id', project.id.toString());
            uploadFormData.append('category', 'quotes');
            uploadFormData.append('subcategory', 'cost_estimate');
            uploadFormData.append('document_type', getFileDocumentType(file.name));
            uploadFormData.append('is_public', 'false');
            uploadFormData.append('quote_id', (createdQuote as any).id.toString());
            
            // Import uploadDocument function
            const { uploadDocument } = await import('../api/documentService');
            return await uploadDocument(uploadFormData);
          } catch (uploadError) {
            console.error(`Fehler beim Upload von ${file.name}:`, uploadError);
            throw uploadError;
          }
        });

        try {
          await Promise.all(uploadPromises);
          setSuccess('Erstangebot und alle Dokumente erfolgreich hochgeladen!');
        } catch (uploadError) {
          setSuccess('Erstangebot erstellt, aber einige Dokumente konnten nicht hochgeladen werden.');
          console.error('Dokument-Upload-Fehler:', uploadError);
        }
      } else {
        setSuccess('Erstangebot erfolgreich eingereicht!');
      }
      
      // Modal nach kurzer Verzögerung schließen
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (err: any) {
      setError(err.message || 'Fehler beim Einreichen des Erstangebots');
    } finally {
      setLoading(false);
    }
  };

  const getFileDocumentType = (filename: string): string => {
    const extension = filename.toLowerCase().split('.').pop();
    switch (extension) {
      case 'pdf': return 'pdf';
      case 'doc':
      case 'docx': return 'document';
      case 'xls':
      case 'xlsx': return 'spreadsheet';
      case 'ppt':
      case 'pptx': return 'presentation';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif': return 'image';
      case 'mp4':
      case 'avi':
      case 'mov': return 'video';
      case 'zip':
      case 'rar': return 'archive';
      default: return 'other';
    }
  };

  const handleClose = () => {
    setFormData({
      quote_number: '',
      title: '',
      description: '',
      total_amount: '',
      currency: 'CHF',
      valid_until: '',
      estimated_duration: '',
      start_date: '',
      completion_date: '',
      labor_cost: '',
      material_cost: '',
      overhead_cost: '',
      payment_terms: '',
      company_name: '',
      contact_person: '',
      phone: '',
      email: '',
      website: '',
      qualifications: '',
      references: '',
      certifications: '',
      technical_approach: '',
      quality_standards: '',
      safety_measures: '',
      environmental_compliance: '',
      risk_assessment: '',
      contingency_plan: '',
      documents: [],
      additional_notes: ''
    });
    setError('');
    setSuccess('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-xl shadow-lg shadow-[#ffbd59]/20">
              <Calculator size={24} className="text-[#2c3539]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">Erstangebot abgeben</h2>
              <p className="text-gray-300">Professionelles Erstangebot für: {trade?.title}</p>
            </div>
          </div>
          
          {/* Buttons oben rechts */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all duration-300 text-sm backdrop-blur-sm border border-white/20"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-[#2c3539] rounded-xl font-semibold hover:from-[#ffa726] hover:to-[#ff9800] hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm shadow-lg shadow-[#ffbd59]/25"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#2c3539] border-t-transparent rounded-full animate-spin"></div>
                  Wird eingereicht...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Einreichen
                </>
              )}
            </button>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/10 rounded-xl transition-all duration-300"
            >
              <X size={24} className="text-gray-300" />
            </button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-140px)]">
          {/* Sidebar - Gewerk-Informationen */}
          <div className="w-1/3 bg-white/5 border-r border-white/20 overflow-y-auto backdrop-blur-sm">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Building size={20} className="text-[#ffbd59]" />
                Gewerk-Details
              </h3>
              
              <div className="space-y-4">
                {/* Projekt-Info */}
                <div className="bg-white/10 rounded-xl p-4 border border-white/20 backdrop-blur-sm">
                  <h4 className="font-semibold text-[#ffbd59] mb-2">Projekt</h4>
                  <p className="text-white text-sm">{project?.name}</p>
                  <p className="text-gray-300 text-xs">{project?.description}</p>
                </div>

                {/* Gewerk-Info */}
                <div className="bg-white/10 rounded-xl p-4 border border-white/20 backdrop-blur-sm">
                  <h4 className="font-semibold text-[#ffbd59] mb-2">Gewerk</h4>
                  <p className="text-white text-sm font-medium">{trade?.title}</p>
                  <p className="text-gray-400 text-xs mt-1">{trade?.description}</p>
                  
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-2 text-xs">
                      <Target size={12} className="text-gray-400" />
                      <span className="text-gray-400">Kategorie:</span>
                      <span className="text-white">{trade?.category || 'Nicht angegeben'}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs">
                      <Calendar size={12} className="text-gray-400" />
                      <span className="text-gray-400">Geplant für:</span>
                      <span className="text-white">{trade?.planned_date ? new Date(trade.planned_date).toLocaleDateString('de-DE') : 'Nicht angegeben'}</span>
                    </div>
                    
                    {trade?.priority && (
                      <div className="flex items-center gap-2 text-xs">
                        <Star size={12} className="text-gray-400" />
                        <span className="text-gray-400">Priorität:</span>
                        <span className="text-white">{trade.priority}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Kategorie-spezifische Felder */}
                {trade?.category_specific_fields && Object.keys(trade.category_specific_fields).length > 0 && (
                  <div className="bg-white/10 rounded-xl p-4 border border-white/20 backdrop-blur-sm">
                    <h4 className="font-semibold text-[#ffbd59] mb-2">Technische Spezifikationen</h4>
                    <div className="space-y-2">
                      {Object.entries(trade.category_specific_fields).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-xs">
                          <span className="text-gray-300">{key.replace(/_/g, ' ')}:</span>
                          <span className="text-white">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Technische Anforderungen */}
                {trade?.technical_specifications && (
                  <div className="bg-white/10 rounded-xl p-4 border border-white/20 backdrop-blur-sm">
                    <h4 className="font-semibold text-[#ffbd59] mb-2">Technische Anforderungen</h4>
                    <p className="text-gray-300 text-xs">{trade.technical_specifications}</p>
                  </div>
                )}

                {/* Qualitätsanforderungen */}
                {trade?.quality_requirements && (
                  <div className="bg-white/10 rounded-xl p-4 border border-white/20 backdrop-blur-sm">
                    <h4 className="font-semibold text-[#ffbd59] mb-2">Qualitätsanforderungen</h4>
                    <p className="text-gray-300 text-xs">{trade.quality_requirements}</p>
                  </div>
                )}

                {/* Dokumente */}
                {trade?.documents && trade.documents.length > 0 && (
                  <div className="bg-white/10 rounded-xl p-4 border border-white/20 backdrop-blur-sm">
                    <h4 className="font-semibold text-[#ffbd59] mb-2">Verfügbare Dokumente</h4>
                    <div className="space-y-2">
                      {trade.documents.map((doc: any) => (
                        <div key={doc.id} className="flex items-center gap-2 text-xs">
                          <FileText size={12} className="text-gray-400" />
                          <span className="text-white">{doc.title}</span>
                          <span className="text-gray-500">({formatFileSize(doc.file_size)})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Hauptbereich - Formular */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {/* Formular-Inhalt */}
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Übersicht */}
                <div className="bg-white/10 rounded-2xl p-6 border border-white/20 backdrop-blur-sm shadow-xl">
                  <h3 className="text-lg font-semibold text-[#ffbd59] mb-6 flex items-center gap-2">
                    <Eye size={20} />
                    Übersicht
                  </h3>
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Angebotsnummer *
                        </label>
                        <input
                          type="text"
                          name="quote_number"
                          value={formData.quote_number}
                          onChange={handleInputChange}
                          placeholder="z.B. ANB-2024-001"
                          className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-[#ffbd59] focus:bg-white/10 focus:outline-none transition-all duration-300 backdrop-blur-sm"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Währung *
                        </label>
                        <select
                          name="currency"
                          value={formData.currency}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:border-[#ffbd59] focus:bg-white/10 focus:outline-none transition-all duration-300 backdrop-blur-sm"
                        >
                          <option value="CHF">CHF (CHF)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="USD">USD ($)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Titel *
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="z.B. Elektroinstallation Erdgeschoss - Komplette Neuverkabelung mit modernen Komponenten"
                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-[#ffbd59] focus:bg-white/10 focus:outline-none transition-all duration-300 backdrop-blur-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Beschreibung *
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={4}
                        placeholder="Detaillierte Beschreibung des Erstangebots..."
                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-[#ffbd59] focus:bg-white/10 focus:outline-none transition-all duration-300 backdrop-blur-sm resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Gesamtbetrag *
                        </label>
                        <input
                          type="number"
                          name="total_amount"
                          value={formData.total_amount}
                          onChange={handleInputChange}
                          placeholder="0.00"
                          step="0.01"
                          className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-[#ffbd59] focus:bg-white/10 focus:outline-none transition-all duration-300 backdrop-blur-sm"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Gültig bis *
                        </label>
                        <input
                          type="date"
                          name="valid_until"
                          value={formData.valid_until}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:border-[#ffbd59] focus:bg-white/10 focus:outline-none transition-all duration-300 backdrop-blur-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Kosten */}
                <div className="bg-white/10 rounded-2xl p-6 border border-white/20 backdrop-blur-sm shadow-xl">
                  <h3 className="text-lg font-semibold text-[#ffbd59] mb-6 flex items-center gap-2">
                    <Euro size={20} />
                    Kosten
                  </h3>
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Arbeitskosten
                        </label>
                        <input
                          type="number"
                          name="labor_cost"
                          value={formData.labor_cost}
                          onChange={handleInputChange}
                          placeholder="0.00"
                          step="0.01"
                          className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-[#ffbd59] focus:bg-white/10 focus:outline-none transition-all duration-300 backdrop-blur-sm"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Materialkosten
                        </label>
                        <input
                          type="number"
                          name="material_cost"
                          value={formData.material_cost}
                          onChange={handleInputChange}
                          placeholder="0.00"
                          step="0.01"
                          className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-[#ffbd59] focus:bg-white/10 focus:outline-none transition-all duration-300 backdrop-blur-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Gemeinkosten
                      </label>
                      <input
                        type="number"
                        name="overhead_cost"
                        value={formData.overhead_cost}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        step="0.01"
                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-[#ffbd59] focus:bg-white/10 focus:outline-none transition-all duration-300 backdrop-blur-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Zahlungsbedingungen
                      </label>
                      <select
                        name="payment_terms"
                        value={formData.payment_terms}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:border-[#ffbd59] focus:bg-white/10 focus:outline-none transition-all duration-300 backdrop-blur-sm"
                      >
                        <option value="">Bitte wählen...</option>
                        <option value="30_days">30 Tage netto</option>
                        <option value="14_days">14 Tage netto</option>
                        <option value="immediate">Sofort</option>
                        <option value="50_50">50% bei Auftrag, 50% bei Fertigstellung</option>
                        <option value="milestone">Nach Meilensteinen</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Zeitplan */}
                <div className="bg-white/10 rounded-2xl p-6 border border-white/20 backdrop-blur-sm shadow-xl">
                  <h3 className="text-lg font-semibold text-[#ffbd59] mb-6 flex items-center gap-2">
                    <Calendar size={20} />
                    Zeitplan
                  </h3>
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Geschätzte Dauer (Tage)
                        </label>
                        <input
                          type="number"
                          name="estimated_duration"
                          value={formData.estimated_duration}
                          onChange={handleInputChange}
                          placeholder="30"
                          className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-[#ffbd59] focus:bg-white/10 focus:outline-none transition-all duration-300 backdrop-blur-sm"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Startdatum *
                        </label>
                        <input
                          type="date"
                          name="start_date"
                          value={formData.start_date}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:border-[#ffbd59] focus:bg-white/10 focus:outline-none transition-all duration-300 backdrop-blur-sm"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Fertigstellungsdatum *
                        </label>
                        <input
                          type="date"
                          name="completion_date"
                          value={formData.completion_date}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:border-[#ffbd59] focus:bg-white/10 focus:outline-none transition-all duration-300 backdrop-blur-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Qualifikationen */}
                <div className="bg-white/10 rounded-2xl p-6 border border-white/20 backdrop-blur-sm shadow-xl">
                  <h3 className="text-lg font-semibold text-[#ffbd59] mb-6 flex items-center gap-2">
                    <Award size={20} />
                    Qualifikationen
                  </h3>
                  
                  {/* Info-Banner für automatische Befüllung */}
                  {(user?.company_name || user?.first_name || user?.last_name || user?.email) && (
                    <div className="mb-6 p-4 bg-[#ffbd59]/10 border border-[#ffbd59]/30 rounded-xl">
                      <div className="flex items-center gap-2 text-[#ffbd59]">
                        <Info size={16} />
                        <span className="text-sm font-medium">
                          Ihre Kontaktdaten wurden automatisch aus Ihrem Profil übernommen. Sie können diese bei Bedarf anpassen.
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-white mb-2 flex items-center gap-2">
                          Firmenname *
                          {user?.company_name && (
                            <span className="text-xs text-[#ffbd59] bg-[#ffbd59]/20 px-2 py-1 rounded-lg">
                              Automatisch befüllt
                            </span>
                          )}
                        </label>
                        <input
                          type="text"
                          name="company_name"
                          value={formData.company_name}
                          onChange={handleInputChange}
                          placeholder="Ihre Firma GmbH"
                          className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-400 focus:border-[#ffbd59] focus:bg-white/10 focus:outline-none transition-all duration-300 backdrop-blur-sm ${
                            user?.company_name ? 'border-[#ffbd59]/50 bg-[#ffbd59]/5' : 'border-white/20'
                          }`}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-white mb-2 flex items-center gap-2">
                          Ansprechpartner *
                          {(user?.first_name || user?.last_name) && (
                            <span className="text-xs text-[#ffbd59] bg-[#ffbd59]/20 px-2 py-1 rounded-lg">
                              Automatisch befüllt
                            </span>
                          )}
                        </label>
                        <input
                          type="text"
                          name="contact_person"
                          value={formData.contact_person}
                          onChange={handleInputChange}
                          placeholder="Max Mustermann"
                          className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-400 focus:border-[#ffbd59] focus:bg-white/10 focus:outline-none transition-all duration-300 backdrop-blur-sm ${
                            (user?.first_name || user?.last_name) ? 'border-[#ffbd59]/50 bg-[#ffbd59]/5' : 'border-white/20'
                          }`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Telefon
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="+49 123 456789"
                          className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-[#ffbd59] focus:bg-white/10 focus:outline-none transition-all duration-300 backdrop-blur-sm"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-white mb-2 flex items-center gap-2">
                          E-Mail *
                          {user?.email && (
                            <span className="text-xs text-[#ffbd59] bg-[#ffbd59]/20 px-2 py-1 rounded-lg">
                              Automatisch befüllt
                            </span>
                          )}
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="kontakt@firma.de"
                          className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-400 focus:border-[#ffbd59] focus:bg-white/10 focus:outline-none transition-all duration-300 backdrop-blur-sm ${
                            user?.email ? 'border-[#ffbd59]/50 bg-[#ffbd59]/5' : 'border-white/20'
                          }`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Website
                      </label>
                      <input
                        type="url"
                        name="website"
                        value={formData.website}
                        onChange={handleInputChange}
                        placeholder="https://www.firma.de"
                        className="w-full px-4 py-3 bg-[#2c3539] border border-[#ffbd59]/30 rounded-xl text-white placeholder-gray-400 focus:border-[#ffbd59] focus:outline-none transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Qualifikationen & Zertifizierungen
                      </label>
                      <textarea
                        name="qualifications"
                        value={formData.qualifications}
                        onChange={handleInputChange}
                        rows={3}
                        placeholder="Beschreiben Sie Ihre relevanten Qualifikationen..."
                        className="w-full px-4 py-3 bg-[#2c3539] border border-[#ffbd59]/30 rounded-xl text-white placeholder-gray-400 focus:border-[#ffbd59] focus:outline-none transition-colors resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Referenzen
                      </label>
                      <textarea
                        name="references"
                        value={formData.references}
                        onChange={handleInputChange}
                        rows={3}
                        placeholder="Beschreiben Sie relevante Referenzprojekte..."
                        className="w-full px-4 py-3 bg-[#2c3539] border border-[#ffbd59]/30 rounded-xl text-white placeholder-gray-400 focus:border-[#ffbd59] focus:outline-none transition-colors resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Technisch */}
                <div className="bg-white/10 rounded-2xl p-6 border border-white/20 backdrop-blur-sm shadow-xl">
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-[#ffbd59] mb-3 flex items-center gap-2">
                      <Wrench size={20} />
                      Technische Details
                      <span className="text-sm text-gray-300 bg-white/10 px-3 py-1 rounded-lg font-normal">
                        Optional
                      </span>
                    </h3>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      Diese Angaben helfen dem Auftraggeber, Ihr Angebot besser zu verstehen und einzuschätzen. 
                      Je detaillierter Ihre technischen Informationen, desto fundierter kann die Entscheidung getroffen werden.
                    </p>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Technischer Ansatz
                      </label>
                      <textarea
                        name="technical_approach"
                        value={formData.technical_approach}
                        onChange={handleInputChange}
                        rows={4}
                        placeholder="Beschreiben Sie Ihren technischen Ansatz für dieses Gewerk..."
                        className="w-full px-4 py-3 bg-[#2c3539] border border-[#ffbd59]/30 rounded-xl text-white placeholder-gray-400 focus:border-[#ffbd59] focus:outline-none transition-colors resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Qualitätsstandards
                      </label>
                      <textarea
                        name="quality_standards"
                        value={formData.quality_standards}
                        onChange={handleInputChange}
                        rows={3}
                        placeholder="Beschreiben Sie Ihre Qualitätsstandards..."
                        className="w-full px-4 py-3 bg-[#2c3539] border border-[#ffbd59]/30 rounded-xl text-white placeholder-gray-400 focus:border-[#ffbd59] focus:outline-none transition-colors resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Sicherheitsmaßnahmen
                      </label>
                      <textarea
                        name="safety_measures"
                        value={formData.safety_measures}
                        onChange={handleInputChange}
                        rows={3}
                        placeholder="Beschreiben Sie geplante Sicherheitsmaßnahmen..."
                        className="w-full px-4 py-3 bg-[#2c3539] border border-[#ffbd59]/30 rounded-xl text-white placeholder-gray-400 focus:border-[#ffbd59] focus:outline-none transition-colors resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Umweltcompliance
                      </label>
                      <textarea
                        name="environmental_compliance"
                        value={formData.environmental_compliance}
                        onChange={handleInputChange}
                        rows={3}
                        placeholder="Beschreiben Sie Umweltmaßnahmen und Compliance..."
                        className="w-full px-4 py-3 bg-[#2c3539] border border-[#ffbd59]/30 rounded-xl text-white placeholder-gray-400 focus:border-[#ffbd59] focus:outline-none transition-colors resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Risikobewertung
                        </label>
                        <textarea
                          name="risk_assessment"
                          value={formData.risk_assessment}
                          onChange={handleInputChange}
                          rows={3}
                          placeholder="Identifizierte Risiken und Maßnahmen..."
                          className="w-full px-4 py-3 bg-[#2c3539] border border-[#ffbd59]/30 rounded-xl text-white placeholder-gray-400 focus:border-[#ffbd59] focus:outline-none transition-colors resize-none"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Notfallplan
                        </label>
                        <textarea
                          name="contingency_plan"
                          value={formData.contingency_plan}
                          onChange={handleInputChange}
                          rows={3}
                          placeholder="Notfallpläne und Alternativen..."
                          className="w-full px-4 py-3 bg-[#2c3539] border border-[#ffbd59]/30 rounded-xl text-white placeholder-gray-400 focus:border-[#ffbd59] focus:outline-none transition-colors resize-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dokumente */}
                <div className="bg-white/10 rounded-2xl p-6 border border-white/20 backdrop-blur-sm shadow-xl">
                  <h3 className="text-lg font-semibold text-[#ffbd59] mb-6 flex items-center gap-2">
                    <FileText size={20} />
                    Dokumente
                  </h3>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Dokumente hochladen
                      </label>
                      <div 
                        className="border-2 border-dashed border-[#ffbd59]/30 rounded-xl p-6 text-center hover:border-[#ffbd59]/50 transition-colors"
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.currentTarget.classList.add('border-[#ffbd59]', 'bg-[#ffbd59]/10');
                        }}
                        onDragLeave={(e) => {
                          e.preventDefault();
                          e.currentTarget.classList.remove('border-[#ffbd59]', 'bg-[#ffbd59]/10');
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.currentTarget.classList.remove('border-[#ffbd59]', 'bg-[#ffbd59]/10');
                          const files = Array.from(e.dataTransfer.files);
                          if (files.length > 0) {
                            setFormData(prev => ({
                              ...prev,
                              documents: [...prev.documents, ...files]
                            }));
                          }
                        }}
                      >
                        <Upload size={32} className="text-[#ffbd59] mx-auto mb-4" />
                        <p className="text-white mb-2">Dateien hier hineinziehen oder klicken zum Auswählen</p>
                        <p className="text-gray-400 text-sm mb-4">
                          Unterstützte Formate: PDF, DOC, XLS, PPT, Bilder, Archive (max. 10MB pro Datei)
                        </p>
                        <input
                          type="file"
                          multiple
                          onChange={handleFileUpload}
                          className="hidden"
                          id="file-upload"
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.zip,.rar"
                        />
                        <label
                          htmlFor="file-upload"
                          className="px-6 py-3 bg-[#ffbd59] text-[#2c3539] rounded-lg font-medium cursor-pointer hover:bg-[#ffa726] transition-colors"
                        >
                          Dateien auswählen
                        </label>
                      </div>
                    </div>

                    {/* Hochgeladene Dateien */}
                    {formData.documents.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-white mb-3">Hochgeladene Dateien</h4>
                        <div className="space-y-2">
                          {formData.documents.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-[#2c3539]/50 rounded-lg">
                              <div className="flex items-center gap-3">
                                {getFileIcon(file)}
                                <div>
                                  <p className="text-white text-sm">{file.name}</p>
                                  <p className="text-gray-400 text-xs">{formatFileSize(file.size)}</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeFile(index)}
                                className="p-1 hover:bg-red-500/20 rounded transition-colors"
                              >
                                <X size={16} className="text-red-400" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Zusätzliche Notizen
                      </label>
                      <textarea
                        name="additional_notes"
                        value={formData.additional_notes}
                        onChange={handleInputChange}
                        rows={4}
                        placeholder="Zusätzliche Informationen oder Anmerkungen..."
                        className="w-full px-4 py-3 bg-[#2c3539] border border-[#ffbd59]/30 rounded-xl text-white placeholder-gray-400 focus:border-[#ffbd59] focus:outline-none transition-colors resize-none"
                      />
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Status-Meldungen */}
        {(error || success) && (
          <div className="flex items-center justify-center p-4 border-t border-white/20 bg-white/5 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              {error && (
                <div className="flex items-center gap-2 text-red-400">
                  <AlertTriangle size={16} />
                  <span className="text-sm">{error}</span>
                </div>
              )}
              {success && (
                <div className="flex items-center gap-2 text-green-400">
                  <CheckCircle size={16} />
                  <span className="text-sm">{success}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 