import React, { useState, useEffect } from 'react';
import { 
  X, 
  FileText, 
  Euro, 
  Calendar, 
  User, 
  Building, 
  CheckCircle, 
  Clock, 
  XCircle,
  Download,
  Share2,
  Edit,
  Trash2,
  AlertTriangle,
  Award,
  Shield,
  Clock as ClockIcon
} from 'lucide-react';

interface QuoteDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  quote: any;
  trade: any;
  project: any;
  user: any;
  onEditQuote?: (quote: any) => void;
  onDeleteQuote?: (quoteId: number) => void;
}

export default function QuoteDetailsModal({ 
  isOpen, 
  onClose, 
  quote, 
  trade, 
  project, 
  user,
  onEditQuote,
  onDeleteQuote
}: QuoteDetailsModalProps) {
  
  const [fullQuoteData, setFullQuoteData] = useState<any>(quote);
  const [isLoadingFullData, setIsLoadingFullData] = useState(false);

  // Lade vollständige Quote-Details beim Öffnen
  useEffect(() => {
    if (isOpen && quote?.id) {
      loadFullQuoteDetails();
    }
  }, [isOpen, quote?.id]);

  const loadFullQuoteDetails = async () => {
    if (!quote?.id) return;
    
    setIsLoadingFullData(true);
    try {
      const response = await fetch(`/api/v1/quotes/${displayQuote.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const fullQuoteData = await response.json();
        console.log('🔍 Vollständige Quote-Daten geladen:', fullQuoteData);
        setFullQuoteData(fullQuoteData);
      } else {
        console.warn('⚠️ Fehler beim Laden der vollständigen Quote-Details:', response.status);
        // Fallback: verwende die ursprünglichen Quote-Daten
        setFullQuoteData(quote);
      }
    } catch (error) {
      console.error('❌ Fehler beim Laden der vollständigen Quote-Details:', error);
      // Fallback: verwende die ursprünglichen Quote-Daten
      setFullQuoteData(quote);
    } finally {
      setIsLoadingFullData(false);
    }
  };
  
  if (!isOpen || !quote) return null;

  // Verwende fullQuoteData anstatt quote für die Anzeige
  const displayQuote = fullQuoteData || quote;

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Nicht angegeben';
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const getStatusInfo = () => {
    switch (displayQuote.status) {
      case 'accepted':
        return {
          icon: <CheckCircle size={20} className="text-green-400" />,
          text: 'Angebot angenommen',
          color: 'text-green-400',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/20',
          description: 'Ihr Angebot wurde vom Bauträger angenommen. Sie erhalten in Kürze eine Auftragsbestätigung.'
        };
      case 'rejected':
        return {
          icon: <XCircle size={20} className="text-red-400" />,
          text: 'Angebot abgelehnt',
          color: 'text-red-400',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/20',
          description: 'Ihr Angebot wurde vom Bauträger abgelehnt. Sie können ein neues Angebot abgeben.'
        };
      case 'submitted':
      default:
        return {
          icon: <Clock size={20} className="text-blue-400" />,
          text: 'Angebot eingereicht',
          color: 'text-blue-400',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/20',
          description: 'Ihr Angebot wird vom Bauträger geprüft. Sie erhalten eine Benachrichtigung über die Entscheidung.'
        };
    }
  };

  const statusInfo = getStatusInfo();

  const handleDownloadPDF = () => {
    // PDF-Download Funktionalität hier implementieren
    };

  const handleShareQuote = () => {
    // Teilen-Funktionalität hier implementieren
    };

  const handleEditQuote = () => {
    if (onEditQuote) {
      onEditQuote(displayQuote);
    }
  };

  const handleDeleteQuote = () => {
    if (onDeleteQuote && displayQuote.status === 'submitted') {
      if (window.confirm('Möchten Sie dieses Angebot wirklich zurückziehen?')) {
        onDeleteQuote(displayQuote.id);
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#0f172a]/95 rounded-2xl shadow-2xl border border-white/10 max-w-4xl w-full max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#ffbd59]/15 rounded-xl">
              <FileText size={24} className="text-[#ffbd59] drop-shadow" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Angebot Details</h2>
              <p className="text-gray-300">{displayQuote.title}</p>
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
            
            {/* Status-Banner */}
            <div className={`${statusInfo.bgColor} border ${statusInfo.borderColor} rounded-xl p-4`}> 
              <div className="flex items-center gap-3 mb-2">
                {statusInfo.icon}
                <h3 className={`text-lg font-semibold ${statusInfo.color}`}>{statusInfo.text}</h3>
              </div>
              <p className="text-gray-300 text-sm">{statusInfo.description}</p>
            </div>

            {/* Grundlegende Angebot-Informationen */}
            <div className="bg-white/5 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <FileText size={20} className="text-[#ffbd59]" />
                Grundlegende Angebot-Informationen
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Linke Spalte */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Building size={16} className="text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-400">Projekt</div>
                      <div className="text-white font-medium">{project?.name || 'Unbekannt'}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <FileText size={16} className="text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-400">Gewerk</div>
                      <div className="text-white font-medium">{trade?.title || 'Unbekannt'}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <FileText size={16} className="text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-400">Angebotsnummer</div>
                      <div className="text-white font-medium">#{displayQuote.id}{displayQuote.quote_number ? ` - ${displayQuote.quote_number}` : ''}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Calendar size={16} className="text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-400">Erstellt am</div>
                      <div className="text-white font-medium">{formatDate(displayQuote.created_at)}</div>
                    </div>
                  </div>
                </div>
                
                {/* Rechte Spalte */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Euro size={16} className="text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-400">Gesamtbetrag</div>
                      <div className="text-white font-medium text-lg">
                        {formatCurrency(displayQuote.total_amount, displayQuote.currency)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Calendar size={16} className="text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-400">Gültig bis</div>
                      <div className="text-white font-medium">
                        {formatDate(displayQuote.valid_until || displayQuote.validity_date || displayQuote.valid_till || displayQuote.expires_at)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <ClockIcon size={16} className="text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-400">Geschätzte Dauer</div>
                      <div className="text-white font-medium">{displayQuote.estimated_duration || 0} Tage</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Shield size={16} className="text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-400">Garantie</div>
                      <div className="text-white font-medium">{displayQuote.warranty_period || 0} Monate</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Unternehmensinformationen */}
            <div className="bg-white/5 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Building size={20} className="text-[#ffbd59]" />
                Unternehmensinformationen
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Building size={16} className="text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-400">Unternehmen</div>
                      <div className="text-white font-medium">{displayQuote.company_name || 'Nicht angegeben'}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <User size={16} className="text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-400">Ansprechpartner</div>
                      <div className="text-white font-medium">{displayQuote.contact_person || 'Nicht angegeben'}</div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User size={16} className="text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-400">E-Mail</div>
                      <div className="text-white font-medium">{displayQuote.email || 'Nicht angegeben'}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <User size={16} className="text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-400">Telefon</div>
                      <div className="text-white font-medium">{displayQuote.phone || 'Nicht angegeben'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Zeitplan und Termine */}
            <div className="bg-white/5 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Calendar size={20} className="text-[#ffbd59]" />
                Zeitplan und Termine
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Calendar size={16} className="text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-400">Startdatum</div>
                      <div className="text-white font-medium">{formatDate(displayQuote.start_date)}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Calendar size={16} className="text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-400">Fertigstellung</div>
                      <div className="text-white font-medium">{formatDate(displayQuote.completion_date)}</div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Shield size={16} className="text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-400">Zahlungsbedingungen</div>
                      <div className="text-white font-medium">{displayQuote.payment_terms || 'Nicht angegeben'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Kostenaufschlüsselung */}
            {displayQuote.labor_cost || displayQuote.material_cost || displayQuote.overhead_cost ? (
              <div className="bg-white/5 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Euro size={20} className="text-[#ffbd59]" />
                  Kostenaufschlüsselung
                </h3>
                
                <div className="space-y-3">
                  {displayQuote.labor_cost && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Arbeitskosten</span>
                      <span className="text-white font-medium">{formatCurrency(displayQuote.labor_cost, displayQuote.currency)}</span>
                    </div>
                  )}
                  
                  {displayQuote.material_cost && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Materialkosten</span>
                      <span className="text-white font-medium">{formatCurrency(displayQuote.material_cost, displayQuote.currency)}</span>
                    </div>
                  )}
                  
                  {displayQuote.overhead_cost && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Gemeinkosten</span>
                      <span className="text-white font-medium">{formatCurrency(displayQuote.overhead_cost, displayQuote.currency)}</span>
                    </div>
                  )}
                  
                  <div className="border-t border-white/20 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-white font-semibold">Gesamtbetrag</span>
                      <span className="text-[#ffbd59] font-bold text-lg">{formatCurrency(displayQuote.total_amount, displayQuote.currency)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Beschreibung */}
            {displayQuote.description && (
              <div className="bg-white/5 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <FileText size={20} className="text-[#ffbd59]" />
                  Beschreibung
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed">{displayQuote.description}</p>
              </div>
            )}

            {/* Qualifikationen und Referenzen */}
            {(displayQuote.qualifications || displayQuote.references) && (
              <div className="bg-white/5 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Award size={20} className="text-[#ffbd59]" />
                  Qualifikationen und Referenzen
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {displayQuote.qualifications && (
                    <div>
                      <h4 className="text-white font-medium mb-2">Qualifikationen</h4>
                      <p className="text-gray-300 text-sm leading-relaxed">{displayQuote.qualifications}</p>
                    </div>
                  )}
                  
                  {displayQuote.references && (
                    <div>
                      <h4 className="text-white font-medium mb-2">Referenzen</h4>
                      <p className="text-gray-300 text-sm leading-relaxed">{displayQuote.references}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Technischer Ansatz und Qualitätsstandards */}
            {(displayQuote.technical_approach || displayQuote.quality_standards) && (
              <div className="bg-white/5 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Shield size={20} className="text-[#ffbd59]" />
                  Technischer Ansatz und Qualität
                </h3>
                
                <div className="space-y-4">
                  {displayQuote.technical_approach && (
                    <div>
                      <h4 className="text-white font-medium mb-2">Technischer Ansatz</h4>
                      <p className="text-gray-300 text-sm leading-relaxed">{displayQuote.technical_approach}</p>
                    </div>
                  )}
                  
                  {displayQuote.quality_standards && (
                    <div>
                      <h4 className="text-white font-medium mb-2">Qualitätsstandards</h4>
                      <p className="text-gray-300 text-sm leading-relaxed">{displayQuote.quality_standards}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sicherheit und Compliance */}
            {(displayQuote.safety_measures || displayQuote.environmental_compliance) && (
              <div className="bg-white/5 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Shield size={20} className="text-[#ffbd59]" />
                  Sicherheit und Umwelt-Compliance
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {displayQuote.safety_measures && (
                    <div>
                      <h4 className="text-white font-medium mb-2">Sicherheitsmaßnahmen</h4>
                      <p className="text-gray-300 text-sm leading-relaxed">{displayQuote.safety_measures}</p>
                    </div>
                  )}
                  
                  {displayQuote.environmental_compliance && (
                    <div>
                      <h4 className="text-white font-medium mb-2">Umwelt-Compliance</h4>
                      <p className="text-gray-300 text-sm leading-relaxed">{displayQuote.environmental_compliance}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Risikobewertung und Notfallplan */}
            {(displayQuote.risk_assessment || displayQuote.contingency_plan) && (
              <div className="bg-white/5 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <AlertTriangle size={20} className="text-[#ffbd59]" />
                  Risikomanagement
                </h3>
                
                <div className="space-y-4">
                  {displayQuote.risk_assessment && (
                    <div>
                      <h4 className="text-white font-medium mb-2">Risikobewertung</h4>
                      <p className="text-gray-300 text-sm leading-relaxed">{displayQuote.risk_assessment}</p>
                    </div>
                  )}
                  
                  {displayQuote.contingency_plan && (
                    <div>
                      <h4 className="text-white font-medium mb-2">Notfallplan</h4>
                      <p className="text-gray-300 text-sm leading-relaxed">{displayQuote.contingency_plan}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Zusätzliche Notizen */}
            {displayQuote.additional_notes && (
              <div className="bg-white/5 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <FileText size={20} className="text-[#ffbd59]" />
                  Zusätzliche Notizen
                </h3>
                <p className="text-gray-300 text-sm leading-relaxed">{displayQuote.additional_notes}</p>
              </div>
            )}





            {/* Angebot-Dokumente - Erweiterte Logik */}
            {(() => {
              const hasDocuments = displayQuote.pdf_upload_path || displayQuote.additional_documents || 
                                 displayQuote.document_path || displayQuote.documents || displayQuote.file_path || 
                                 displayQuote.attachments || displayQuote.uploaded_files;
              
              if (!hasDocuments) {
                return (
                  <div className="bg-gray-500/10 border border-gray-500/30 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                      <FileText size={20} className="text-gray-400" />
                      Keine Dokumente hochgeladen
                    </h3>
                    <p className="text-gray-300 text-sm">
                      Für dieses Angebot wurden keine Dokumente hochgeladen.
                    </p>
                  </div>
                );
              }
              
              return (
                <div className="bg-white/5 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <FileText size={20} className="text-[#ffbd59]" />
                    Angebot-Dokumente
                  </h3>
                  
                  <div className="space-y-3">
                    {/* PDF Upload - Mehrere mögliche Feldnamen prüfen */}
                    {(displayQuote.pdf_upload_path || displayQuote.document_path || displayQuote.file_path) && (
                      <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-white/10">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-red-500/20 rounded-lg">
                            <FileText size={16} className="text-red-400" />
                          </div>
                          <div>
                            <div className="text-white font-medium">Angebot PDF</div>
                            <div className="text-gray-400 text-sm">
                              {(displayQuote.pdf_upload_path || displayQuote.document_path || displayQuote.file_path)?.split('/').pop() || 'Angebot.pdf'}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const path = displayQuote.pdf_upload_path || displayQuote.document_path || displayQuote.file_path;
                            const fullPath = path?.startsWith('/') ? `/api/v1${path}` : `/api/v1/${path}`;
                            window.open(fullPath, '_blank');
                          }}
                          className="flex items-center gap-2 px-3 py-1.5 bg-[#ffbd59] text-[#0f172a] rounded-lg font-medium hover:bg-[#ffa726] transition-colors"
                        >
                          <Download size={14} />
                          Download
                        </button>
                      </div>
                    )}
                    
                    {/* Zusätzliche Dokumente - Mehrere mögliche Feldnamen prüfen */}
                    {(() => {
                      const documentsField = displayQuote.additional_documents || displayQuote.documents || displayQuote.attachments || displayQuote.uploaded_files;
                      if (!documentsField) return null;
                      
                      try {
                        let additionalDocs = [];
                        
                        // Versuche JSON zu parsen wenn String
                        if (typeof documentsField === 'string') {
                          additionalDocs = JSON.parse(documentsField);
                        } else if (Array.isArray(documentsField)) {
                          additionalDocs = documentsField;
                        } else if (typeof documentsField === 'object') {
                          additionalDocs = [documentsField];
                        }
                        
                        return Array.isArray(additionalDocs) && additionalDocs.length > 0 ? (
                          additionalDocs.map((doc: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-white/10">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/20 rounded-lg">
                                  <FileText size={16} className="text-blue-400" />
                                </div>
                                <div>
                                  <div className="text-white font-medium">
                                    {doc.name || doc.title || doc.filename || `Dokument ${index + 1}`}
                                  </div>
                                  <div className="text-gray-400 text-sm">
                                    {doc.type || doc.mime_type || 'Unbekannter Typ'} • {doc.size ? `${Math.round(doc.size / 1024)} KB` : 'Unbekannte Größe'}
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  const path = doc.url || doc.path || doc.file_path;
                                  const fullPath = path?.startsWith('/') ? `/api/v1${path}` : `/api/v1/${path}`;
                                  window.open(fullPath, '_blank');
                                }}
                                className="flex items-center gap-2 px-3 py-1.5 bg-[#ffbd59] text-[#0f172a] rounded-lg font-medium hover:bg-[#ffa726] transition-colors"
                              >
                                <Download size={14} />
                                Download
                              </button>
                            </div>
                          ))
                        ) : null;
                      } catch (e) {
                        console.error('Fehler beim Parsen der zusätzlichen Dokumente:', e);
                        return (
                          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                            <div className="text-red-400 text-sm">
                              Fehler beim Laden der Dokumente. Raw-Daten: {String(documentsField)}
                            </div>
                          </div>
                        );
                      }
                    })()}
                  </div>
                </div>
              );
            })()}

            {/* Aktionen */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleDownloadPDF}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-[#ffbd59] text-[#0f172a] rounded-xl font-semibold hover:bg-[#ffa726] transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <Download size={16} />
                PDF herunterladen
              </button>
              
              <button
                onClick={handleShareQuote}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/15 transition-all duration-300 border border-white/10"
              >
                <Share2 size={16} />
                Angebot teilen
              </button>
              
              {displayQuote.status === 'submitted' && onEditQuote && (
                <button
                  onClick={handleEditQuote}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-500/20 text-blue-300 rounded-xl font-semibold hover:bg-blue-500/30 transition-all duration-300 border border-blue-500/20"
                >
                  <Edit size={16} />
                  Bearbeiten
                </button>
              )}
              
              {displayQuote.status === 'submitted' && onDeleteQuote && (
                <button
                  onClick={handleDeleteQuote}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-red-500/20 text-red-300 rounded-xl font-semibold hover:bg-red-500/30 transition-all duration-300 border border-red-500/20"
                >
                  <Trash2 size={16} />
                  Zurückziehen
                </button>
              )}
            </div>

            {/* Zusätzliche Informationen - Erweitert */}
            <div className="bg-white/5 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <FileText size={20} className="text-[#ffbd59]" />
                Angebot-Übersicht
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-400">
                <div>
                  <p className="mb-2">
                    <strong>Angebots-ID:</strong> #{displayQuote.id}
                  </p>
                  <p className="mb-2">
                    <strong>Status:</strong> 
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                      displayQuote.status === 'accepted' ? 'bg-green-500/20 text-green-400' :
                      displayQuote.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {displayQuote.status === 'accepted' ? 'Angenommen' :
                       displayQuote.status === 'rejected' ? 'Abgelehnt' :
                       'Eingereicht'}
                    </span>
                  </p>
                  <p className="mb-2">
                    <strong>Eingereicht am:</strong> {formatDate(displayQuote.submitted_at || displayQuote.created_at)}
                  </p>
                </div>
                <div>
                  <p className="mb-2">
                    <strong>Kontakt:</strong> {displayQuote.email || 'Nicht angegeben'}
                  </p>
                  <p className="mb-2">
                    <strong>Telefon:</strong> {displayQuote.phone || 'Nicht angegeben'}
                  </p>
                  {displayQuote.rating && (
                    <p className="mb-2">
                      <strong>KI-Bewertung:</strong> {displayQuote.rating}/5
                    </p>
                  )}
                </div>
              </div>
              
              {/* AI Recommendation und Feedback */}
              {(displayQuote.ai_recommendation || displayQuote.feedback) && (
                <div className="mt-4 pt-4 border-t border-white/20">
                  {displayQuote.ai_recommendation && (
                    <div className="mb-3">
                      <strong className="text-[#ffbd59]">KI-Empfehlung:</strong>
                      <p className="text-gray-300 text-sm mt-1">{displayQuote.ai_recommendation}</p>
                    </div>
                  )}
                  {displayQuote.feedback && (
                    <div>
                      <strong className="text-blue-400">Feedback:</strong>
                      <p className="text-gray-300 text-sm mt-1">{displayQuote.feedback}</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Ablehnungsgrund falls vorhanden */}
              {displayQuote.rejection_reason && displayQuote.status === 'rejected' && (
                <div className="mt-4 pt-4 border-t border-red-500/30">
                  <strong className="text-red-400">Ablehnungsgrund:</strong>
                  <p className="text-gray-300 text-sm mt-1">{displayQuote.rejection_reason}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
