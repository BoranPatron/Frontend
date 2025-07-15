import React, { useState, useEffect } from 'react';
import { 
  X, 
  Save, 
  Upload, 
  FileText, 
  Calculator,
  Clock,
  Euro,
  Building,
  Calendar,
  User,
  Phone,
  Mail,
  Globe,
  Shield,
  CheckCircle,
  AlertTriangle,
  Info,
  Download,
  Eye,
  Star,
  Target,
  Wrench,
  FileCheck,
  BarChart3,
  TrendingUp,
  Handshake,
  Award,
  Clock3,
  CalendarDays,
  FileSpreadsheet,
  FileImage,
  FileArchive,
  FileVideo,
  FileAudio,
  FileCode
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
  profit_margin: string;
  
  // Zahlungsbedingungen
  payment_terms: string;
  warranty_period: string;
  
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
  const [formData, setFormData] = useState<CostEstimateFormData>({
    title: '',
    description: '',
    total_amount: '',
    currency: 'EUR',
    valid_until: '',
    estimated_duration: '',
    start_date: '',
    completion_date: '',
    labor_cost: '',
    material_cost: '',
    overhead_cost: '',
    profit_margin: '',
    payment_terms: '',
    warranty_period: '',
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
  const [activeTab, setActiveTab] = useState('overview');

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
    
    if (!formData.total_amount) errors.push('Gesamtbetrag');
    if (!formData.valid_until) errors.push('Gültig bis');
    if (!formData.estimated_duration) errors.push('Geschätzte Dauer');
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
      const costEstimateData = {
        ...formData,
        trade_id: trade.id,
        project_id: project.id,
        status: 'submitted'
      };

      await onSubmit(costEstimateData);
      setSuccess('Kostenvoranschlag erfolgreich eingereicht!');
      
      // Modal nach kurzer Verzögerung schließen
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (err: any) {
      setError(err.message || 'Fehler beim Einreichen des Kostenvoranschlags');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      total_amount: '',
      currency: 'EUR',
      valid_until: '',
      estimated_duration: '',
      start_date: '',
      completion_date: '',
      labor_cost: '',
      material_cost: '',
      overhead_cost: '',
      profit_margin: '',
      payment_terms: '',
      warranty_period: '',
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] rounded-2xl shadow-2xl border border-[#ffbd59]/20 max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#ffbd59]/20">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#ffbd59]/20 rounded-xl">
              <Calculator size={24} className="text-[#ffbd59]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Kostenvoranschlag abgeben</h2>
              <p className="text-gray-400">Professioneller Kostenvoranschlag für: {trade?.title}</p>
            </div>
          </div>
          
          {/* Buttons oben rechts */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-[#2c3539] rounded-lg font-semibold hover:from-[#ffa726] hover:to-[#ff9800] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
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
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X size={24} className="text-gray-400" />
            </button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-140px)]">
          {/* Sidebar - Gewerk-Informationen */}
          <div className="w-1/3 bg-[#2c3539]/50 border-r border-[#ffbd59]/20 overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Building size={20} className="text-[#ffbd59]" />
                Gewerk-Details
              </h3>
              
              <div className="space-y-4">
                {/* Projekt-Info */}
                <div className="bg-[#2c3539]/50 rounded-xl p-4 border border-[#ffbd59]/20">
                  <h4 className="font-semibold text-[#ffbd59] mb-2">Projekt</h4>
                  <p className="text-white text-sm">{project?.name}</p>
                  <p className="text-gray-400 text-xs">{project?.description}</p>
                </div>

                {/* Gewerk-Info */}
                <div className="bg-[#2c3539]/50 rounded-xl p-4 border border-[#ffbd59]/20">
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
                  <div className="bg-[#2c3539]/50 rounded-xl p-4 border border-[#ffbd59]/20">
                    <h4 className="font-semibold text-[#ffbd59] mb-2">Technische Spezifikationen</h4>
                    <div className="space-y-2">
                      {Object.entries(trade.category_specific_fields).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-xs">
                          <span className="text-gray-400">{key.replace(/_/g, ' ')}:</span>
                          <span className="text-white">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Technische Anforderungen */}
                {trade?.technical_specifications && (
                  <div className="bg-[#2c3539]/50 rounded-xl p-4 border border-[#ffbd59]/20">
                    <h4 className="font-semibold text-[#ffbd59] mb-2">Technische Anforderungen</h4>
                    <p className="text-gray-400 text-xs">{trade.technical_specifications}</p>
                  </div>
                )}

                {/* Qualitätsanforderungen */}
                {trade?.quality_requirements && (
                  <div className="bg-[#2c3539]/50 rounded-xl p-4 border border-[#ffbd59]/20">
                    <h4 className="font-semibold text-[#ffbd59] mb-2">Qualitätsanforderungen</h4>
                    <p className="text-gray-400 text-xs">{trade.quality_requirements}</p>
                  </div>
                )}

                {/* Dokumente */}
                {trade?.documents && trade.documents.length > 0 && (
                  <div className="bg-[#2c3539]/50 rounded-xl p-4 border border-[#ffbd59]/20">
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
              {/* Tabs */}
              <div className="flex space-x-1 mb-6 bg-[#2c3539]/50 rounded-xl p-1">
                {[
                  { id: 'overview', label: 'Übersicht', icon: Eye },
                  { id: 'costs', label: 'Kosten', icon: Euro },
                  { id: 'schedule', label: 'Zeitplan', icon: Calendar },
                  { id: 'qualifications', label: 'Qualifikationen', icon: Award },
                  { id: 'technical', label: 'Technisch', icon: Wrench },
                  { id: 'documents', label: 'Dokumente', icon: FileText }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeTab === tab.id
                        ? 'bg-[#ffbd59] text-[#2c3539]'
                        : 'text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <tab.icon size={16} />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Formular-Inhalt */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Übersicht Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Titel des Kostenvoranschlags *
                        </label>
                        <input
                          type="text"
                          name="title"
                          value={formData.title}
                          onChange={handleInputChange}
                          placeholder="z.B. Elektroinstallation Erdgeschoss"
                          className="w-full px-4 py-3 bg-[#2c3539] border border-[#ffbd59]/30 rounded-xl text-white placeholder-gray-400 focus:border-[#ffbd59] focus:outline-none transition-colors"
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
                          className="w-full px-4 py-3 bg-[#2c3539] border border-[#ffbd59]/30 rounded-xl text-white focus:border-[#ffbd59] focus:outline-none transition-colors"
                        >
                          <option value="EUR">EUR (€)</option>
                          <option value="USD">USD ($)</option>
                          <option value="CHF">CHF (CHF)</option>
                        </select>
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
                        rows={4}
                        placeholder="Detaillierte Beschreibung des Kostenvoranschlags..."
                        className="w-full px-4 py-3 bg-[#2c3539] border border-[#ffbd59]/30 rounded-xl text-white placeholder-gray-400 focus:border-[#ffbd59] focus:outline-none transition-colors resize-none"
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
                          className="w-full px-4 py-3 bg-[#2c3539] border border-[#ffbd59]/30 rounded-xl text-white placeholder-gray-400 focus:border-[#ffbd59] focus:outline-none transition-colors"
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
                          className="w-full px-4 py-3 bg-[#2c3539] border border-[#ffbd59]/30 rounded-xl text-white focus:border-[#ffbd59] focus:outline-none transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Kosten Tab */}
                {activeTab === 'costs' && (
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
                          className="w-full px-4 py-3 bg-[#2c3539] border border-[#ffbd59]/30 rounded-xl text-white placeholder-gray-400 focus:border-[#ffbd59] focus:outline-none transition-colors"
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
                          className="w-full px-4 py-3 bg-[#2c3539] border border-[#ffbd59]/30 rounded-xl text-white placeholder-gray-400 focus:border-[#ffbd59] focus:outline-none transition-colors"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
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
                          className="w-full px-4 py-3 bg-[#2c3539] border border-[#ffbd59]/30 rounded-xl text-white placeholder-gray-400 focus:border-[#ffbd59] focus:outline-none transition-colors"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Gewinnmarge (%)
                        </label>
                        <input
                          type="number"
                          name="profit_margin"
                          value={formData.profit_margin}
                          onChange={handleInputChange}
                          placeholder="15"
                          step="0.1"
                          className="w-full px-4 py-3 bg-[#2c3539] border border-[#ffbd59]/30 rounded-xl text-white placeholder-gray-400 focus:border-[#ffbd59] focus:outline-none transition-colors"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Zahlungsbedingungen
                        </label>
                        <select
                          name="payment_terms"
                          value={formData.payment_terms}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 bg-[#2c3539] border border-[#ffbd59]/30 rounded-xl text-white focus:border-[#ffbd59] focus:outline-none transition-colors"
                        >
                          <option value="">Bitte wählen...</option>
                          <option value="30_days">30 Tage netto</option>
                          <option value="14_days">14 Tage netto</option>
                          <option value="immediate">Sofort</option>
                          <option value="50_50">50% bei Auftrag, 50% bei Fertigstellung</option>
                          <option value="milestone">Nach Meilensteinen</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Garantie (Monate)
                        </label>
                        <input
                          type="number"
                          name="warranty_period"
                          value={formData.warranty_period}
                          onChange={handleInputChange}
                          placeholder="24"
                          className="w-full px-4 py-3 bg-[#2c3539] border border-[#ffbd59]/30 rounded-xl text-white placeholder-gray-400 focus:border-[#ffbd59] focus:outline-none transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Zeitplan Tab */}
                {activeTab === 'schedule' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Geschätzte Dauer (Tage) *
                        </label>
                        <input
                          type="number"
                          name="estimated_duration"
                          value={formData.estimated_duration}
                          onChange={handleInputChange}
                          placeholder="30"
                          className="w-full px-4 py-3 bg-[#2c3539] border border-[#ffbd59]/30 rounded-xl text-white placeholder-gray-400 focus:border-[#ffbd59] focus:outline-none transition-colors"
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
                          className="w-full px-4 py-3 bg-[#2c3539] border border-[#ffbd59]/30 rounded-xl text-white focus:border-[#ffbd59] focus:outline-none transition-colors"
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
                          className="w-full px-4 py-3 bg-[#2c3539] border border-[#ffbd59]/30 rounded-xl text-white focus:border-[#ffbd59] focus:outline-none transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Qualifikationen Tab */}
                {activeTab === 'qualifications' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Firmenname *
                        </label>
                        <input
                          type="text"
                          name="company_name"
                          value={formData.company_name}
                          onChange={handleInputChange}
                          placeholder="Ihre Firma GmbH"
                          className="w-full px-4 py-3 bg-[#2c3539] border border-[#ffbd59]/30 rounded-xl text-white placeholder-gray-400 focus:border-[#ffbd59] focus:outline-none transition-colors"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Ansprechpartner *
                        </label>
                        <input
                          type="text"
                          name="contact_person"
                          value={formData.contact_person}
                          onChange={handleInputChange}
                          placeholder="Max Mustermann"
                          className="w-full px-4 py-3 bg-[#2c3539] border border-[#ffbd59]/30 rounded-xl text-white placeholder-gray-400 focus:border-[#ffbd59] focus:outline-none transition-colors"
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
                          className="w-full px-4 py-3 bg-[#2c3539] border border-[#ffbd59]/30 rounded-xl text-white placeholder-gray-400 focus:border-[#ffbd59] focus:outline-none transition-colors"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          E-Mail *
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="kontakt@firma.de"
                          className="w-full px-4 py-3 bg-[#2c3539] border border-[#ffbd59]/30 rounded-xl text-white placeholder-gray-400 focus:border-[#ffbd59] focus:outline-none transition-colors"
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
                )}

                {/* Technisch Tab */}
                {activeTab === 'technical' && (
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
                )}

                {/* Dokumente Tab */}
                {activeTab === 'documents' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Dokumente hochladen
                      </label>
                      <div className="border-2 border-dashed border-[#ffbd59]/30 rounded-xl p-6 text-center">
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
                )}
              </form>
            </div>
          </div>
        </div>

        {/* Status-Meldungen */}
        {(error || success) && (
          <div className="flex items-center justify-center p-4 border-t border-[#ffbd59]/20 bg-[#2c3539]/50">
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