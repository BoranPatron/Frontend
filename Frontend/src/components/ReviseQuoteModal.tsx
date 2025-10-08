import React, { useState, useEffect } from 'react';
import { X, Edit, FileText, Euro, Calendar, Save, AlertCircle } from 'lucide-react';
import api from '../api/api';

interface ReviseQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingQuote: any;
  trade: any;
  project: any;
  onRevised: () => void;
}

export default function ReviseQuoteModal({
  isOpen,
  onClose,
  existingQuote,
  trade,
  project,
  onRevised
}: ReviseQuoteModalProps) {
  const [formData, setFormData] = useState<any>({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialisiere Formular mit ALLEN bestehenden Angebotsdaten
  useEffect(() => {
    if (isOpen && existingQuote) {
      console.log('🔄 Initialisiere ReviseQuoteModal mit Quote:', existingQuote);
      console.log('   total_amount aus Quote:', existingQuote.total_amount, typeof existingQuote.total_amount);
      
      // Kopiere ALLE Felder aus dem existingQuote
      const initialData = {
        title: existingQuote.title || '',
        description: existingQuote.description || '',
        total_amount: existingQuote.total_amount || 0,
        currency: existingQuote.currency || 'CHF',
        valid_until: existingQuote.valid_until || '',
        labor_cost: existingQuote.labor_cost || 0,
        material_cost: existingQuote.material_cost || 0,
        overhead_cost: existingQuote.overhead_cost || 0,
        estimated_duration: existingQuote.estimated_duration || 0,
        start_date: existingQuote.start_date || '',
        completion_date: existingQuote.completion_date || '',
        payment_terms: existingQuote.payment_terms || '',
        warranty_period: existingQuote.warranty_period || 12,
        // Kontaktdaten
        quote_number: existingQuote.quote_number || '',
        company_name: existingQuote.company_name || '',
        contact_person: existingQuote.contact_person || '',
        phone: existingQuote.phone || '',
        email: existingQuote.email || '',
        website: existingQuote.website || '',
        // Qualifikationen
        qualifications: existingQuote.qualifications || '',
        references: existingQuote.references || '',
        certifications: existingQuote.certifications || '',
        // Technische Details
        technical_approach: existingQuote.technical_approach || '',
        quality_standards: existingQuote.quality_standards || '',
        safety_measures: existingQuote.safety_measures || '',
        environmental_compliance: existingQuote.environmental_compliance || '',
        // Risikomanagement
        risk_assessment: existingQuote.risk_assessment || '',
        contingency_plan: existingQuote.contingency_plan || '',
        // Zusätzliche Informationen
        additional_notes: existingQuote.additional_notes || '',
        pdf_upload_path: existingQuote.pdf_upload_path || '',
        additional_documents: existingQuote.additional_documents || ''
      };
      
      console.log('📋 Initialisiere Formular mit Daten:', initialData);
      console.log('   initialData.total_amount:', initialData.total_amount, typeof initialData.total_amount);
      setFormData(initialData);
      setError(null);
    }
  }, [isOpen, existingQuote]);
  
  // Debug: Log formData changes
  useEffect(() => {
    if (Object.keys(formData).length > 0) {
      console.log('📝 FormData aktualisiert:', {
        total_amount: formData.total_amount,
        title: formData.title,
        description: formData.description?.substring(0, 50)
      });
    }
  }, [formData]);

  if (!isOpen) return null;

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async () => {
    // Validierung
    if (!formData.title || formData.total_amount <= 0) {
      setError('Bitte füllen Sie alle Pflichtfelder aus (Titel, Gesamtbetrag)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Entferne project_id und milestone_id aus den Daten (diese können nicht geändert werden)
      const { project_id, milestone_id, ...rawData } = formData;
      
      // Bereinige die Daten: Entferne leere Strings und konvertiere zu null
      const updateData: any = {};
      Object.keys(rawData).forEach(key => {
        const value = rawData[key];
        
        // Überspringe undefined oder leere Strings bei optionalen Feldern
        if (value === undefined || value === '') {
          // Setze null für optionale Felder
          updateData[key] = null;
        } else if (typeof value === 'number' && value === 0 && 
                   !['total_amount', 'labor_cost', 'material_cost', 'overhead_cost'].includes(key)) {
          // 0 ist OK für Kosten, aber null für andere numerische Felder
          updateData[key] = null;
        } else {
          updateData[key] = value;
        }
      });
      
      console.log('📤 Sende Angebotsüberarbeitung:', updateData);
      
      // API-Call zum Überarbeiten des Angebots
      const response = await api.put(
        `/quotes/${existingQuote.id}/revise-after-inspection`,
        updateData
      );

      console.log('✅ Angebot erfolgreich überarbeitet:', response.data);

      // Erfolgsmeldung
      alert('Angebot erfolgreich überarbeitet! Der Bauträger wurde benachrichtigt.');

      // Callback zum Neuladen der Daten
      onRevised();

      // Modal schließen
      onClose();
    } catch (err: any) {
      console.error('❌ Fehler beim Überarbeiten des Angebots:', err);
      console.error('❌ Fehler-Details:', err.response?.data);
      
      // Robustes Error-Handling für verschiedene Error-Formate
      let errorMessage = 'Fehler beim Überarbeiten des Angebots. Bitte versuchen Sie es erneut.';
      
      if (err.response?.data) {
        const errorData = err.response.data;
        
        // Pydantic Validation Error (Array von Fehlern)
        if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail
            .map((e: any) => `${e.loc?.join('.') || 'Feld'}: ${e.msg}`)
            .join(', ');
        }
        // Einfacher String-Error
        else if (typeof errorData.detail === 'string') {
          errorMessage = errorData.detail;
        }
        // Objekt-Error
        else if (typeof errorData.detail === 'object') {
          errorMessage = JSON.stringify(errorData.detail);
        }
        // Fallback: message Feld
        else if (errorData.message) {
          errorMessage = errorData.message;
        }
      }
      
      console.error('📛 Formatierte Fehlermeldung:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'CHF'
    }).format(amount);
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const getValidityDate = () => {
    const validityDate = new Date();
    validityDate.setDate(validityDate.getDate() + 30); // 30 Tage Gültigkeit
    return validityDate.toISOString().split('T')[0];
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] rounded-2xl shadow-2xl border border-white/20 max-w-4xl w-full max-h-[90vh] overflow-hidden relative">
        {/* Glassmorphism Overlay */}
        <div className="absolute inset-0 bg-white/5 backdrop-blur-lg rounded-2xl"></div>
        
        {/* Header */}
        <div className="relative flex items-center justify-between p-6 border-b border-white/10 bg-gradient-to-r from-[#3d4952]/95 to-[#51646f]/95 backdrop-blur-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/50">
              <Edit size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-white to-blue-400 bg-clip-text text-transparent">
                Angebot nach Besichtigung überarbeiten
              </h2>
              <p className="text-sm text-gray-400">
                Passen Sie Ihr Angebot basierend auf der Besichtigung an
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-all duration-200 hover:shadow-lg"
            disabled={loading}
          >
            <X size={24} className="text-gray-400 hover:text-white transition-colors" />
          </button>
        </div>

        {/* Content */}
        <div className="relative overflow-y-auto max-h-[calc(90vh-200px)] p-6 space-y-6">
          
          {/* Info-Banner */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle size={20} className="text-blue-400 mt-0.5" />
            <div className="text-sm">
              <p className="text-blue-300 font-medium mb-1">
                Angebotsüberarbeitung nach Besichtigung
              </p>
              <p className="text-blue-200/80">
                Sie können Ihr Angebot basierend auf den Erkenntnissen der Besichtigung anpassen. 
                Das bestehende Angebot wird überschrieben und der Bauträger wird über die Änderungen informiert.
              </p>
            </div>
          </div>

          {/* Fehleranzeige */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle size={20} className="text-red-400 mt-0.5" />
              <div className="text-sm">
                <p className="text-red-300 font-medium">Fehler</p>
                <p className="text-red-200/80">{error}</p>
              </div>
            </div>
          )}

          {/* Grundinformationen */}
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FileText size={20} className="text-blue-400" />
              Grundinformationen
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">
                  Titel des Angebots *
                </label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => {
                    console.log('📝 Titel geändert:', e.target.value);
                    handleInputChange('title', e.target.value);
                  }}
                  className="w-full p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:bg-white/15"
                  placeholder="z.B. Elektroinstallation - Premium"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">
                  Beschreibung
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => {
                    console.log('📄 Beschreibung geändert, Länge:', e.target.value.length);
                    handleInputChange('description', e.target.value);
                  }}
                  rows={4}
                  className="w-full p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:bg-white/15"
                  placeholder="Beschreiben Sie die Änderungen oder Anpassungen basierend auf der Besichtigung..."
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Kostenaufschlüsselung */}
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Euro size={20} className="text-blue-400" />
              Kostenaufschlüsselung
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">
                  Arbeitskosten (CHF)
                </label>
                <input
                  type="number"
                  value={formData.labor_cost || 0}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    console.log('👷 Arbeitskosten geändert:', value);
                    handleInputChange('labor_cost', isNaN(value) ? 0 : value);
                  }}
                  className="w-full p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:bg-white/15"
                  min="0"
                  step="100"
                  disabled={loading}
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">
                  Materialkosten (CHF)
                </label>
                <input
                  type="number"
                  value={formData.material_cost || 0}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    console.log('🧱 Materialkosten geändert:', value);
                    handleInputChange('material_cost', isNaN(value) ? 0 : value);
                  }}
                  className="w-full p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:bg-white/15"
                  min="0"
                  step="100"
                  disabled={loading}
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">
                  Gemeinkosten (CHF)
                </label>
                <input
                  type="number"
                  value={formData.overhead_cost || 0}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    console.log('🏢 Gemeinkosten geändert:', value);
                    handleInputChange('overhead_cost', isNaN(value) ? 0 : value);
                  }}
                  className="w-full p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:bg-white/15"
                  min="0"
                  step="100"
                  disabled={loading}
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">
                  Gesamtbetrag (CHF) *
                </label>
                <input
                  type="number"
                  value={formData.total_amount || 0}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    console.log('💰 Gesamtbetrag geändert:', value);
                    handleInputChange('total_amount', isNaN(value) ? 0 : value);
                  }}
                  className="w-full p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:bg-white/15 font-bold"
                  min="0"
                  step="100"
                  disabled={loading}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Berechnete Summe */}
            <div className="mt-4 p-4 bg-blue-500/10 rounded-lg border border-blue-500/30">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Berechnete Summe (Arbeits + Material + Gemein):</span>
                <span className="text-white font-bold text-lg">
                  {formatCurrency(formData.labor_cost + formData.material_cost + formData.overhead_cost)}
                </span>
              </div>
            </div>
          </div>

          {/* Zeitplan */}
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Calendar size={20} className="text-blue-400" />
              Zeitplan & Termine
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">
                  Geschätzte Dauer (Tage)
                </label>
                <input
                  type="number"
                  value={formData.estimated_duration || 0}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    console.log('⏱️ Geschätzte Dauer geändert:', value);
                    handleInputChange('estimated_duration', isNaN(value) ? 0 : value);
                  }}
                  className="w-full p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:bg-white/15"
                  min="0"
                  disabled={loading}
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">
                  Gültig bis
                </label>
                <input
                  type="date"
                  value={formData.valid_until || ''}
                  onChange={(e) => {
                    console.log('📅 Gültig bis geändert:', e.target.value);
                    handleInputChange('valid_until', e.target.value);
                  }}
                  min={getValidityDate()}
                  className="w-full p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:bg-white/15"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">
                  Startdatum
                </label>
                <input
                  type="date"
                  value={formData.start_date || ''}
                  onChange={(e) => {
                    console.log('🚀 Startdatum geändert:', e.target.value);
                    handleInputChange('start_date', e.target.value);
                  }}
                  min={getTomorrowDate()}
                  className="w-full p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:bg-white/15"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">
                  Fertigstellung
                </label>
                <input
                  type="date"
                  value={formData.completion_date || ''}
                  onChange={(e) => {
                    console.log('🏁 Fertigstellung geändert:', e.target.value);
                    handleInputChange('completion_date', e.target.value);
                  }}
                  min={formData.start_date || getTomorrowDate()}
                  className="w-full p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:bg-white/15"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-semibold text-gray-200 mb-2">
                Zahlungsbedingungen
              </label>
              <select
                value={formData.payment_terms || ''}
                onChange={(e) => {
                  console.log('💳 Zahlungsbedingungen geändert:', e.target.value);
                  handleInputChange('payment_terms', e.target.value);
                }}
                className="w-full p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:bg-white/15"
                disabled={loading}
              >
                <option value="" className="bg-[#1a1a2e] text-white">Zahlungsbedingungen auswählen</option>
                <option value="30% Anzahlung, 70% nach Fertigstellung" className="bg-[#1a1a2e] text-white">30% Anzahlung, 70% nach Fertigstellung</option>
                <option value="50% Anzahlung, 50% nach Fertigstellung" className="bg-[#1a1a2e] text-white">50% Anzahlung, 50% nach Fertigstellung</option>
                <option value="100% nach Fertigstellung" className="bg-[#1a1a2e] text-white">100% nach Fertigstellung</option>
                <option value="30% Anzahlung, 40% nach Zwischenabnahme, 30% nach Fertigstellung" className="bg-[#1a1a2e] text-white">30% Anzahlung, 40% nach Zwischenabnahme, 30% nach Fertigstellung</option>
                <option value="20% Anzahlung, 30% nach 50% Fortschritt, 50% nach Fertigstellung" className="bg-[#1a1a2e] text-white">20% Anzahlung, 30% nach 50% Fortschritt, 50% nach Fertigstellung</option>
                <option value="Rechnung 30 Tage netto" className="bg-[#1a1a2e] text-white">Rechnung 30 Tage netto</option>
                <option value="Rechnung 14 Tage netto" className="bg-[#1a1a2e] text-white">Rechnung 14 Tage netto</option>
                <option value="Sofortzahlung" className="bg-[#1a1a2e] text-white">Sofortzahlung</option>
                <option value="Individuelle Vereinbarung" className="bg-[#1a1a2e] text-white">Individuelle Vereinbarung</option>
              </select>
            </div>
          </div>

        </div>

        {/* Footer mit Aktionen */}
        <div className="relative p-6 border-t border-white/10 bg-gradient-to-r from-[#3d4952]/95 to-[#51646f]/95 backdrop-blur-lg flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-6 py-3 text-gray-400 hover:text-white transition-all duration-200 hover:bg-white/10 rounded-xl"
            disabled={loading}
          >
            Abbrechen
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Wird überarbeitet...
              </>
            ) : (
              <>
                <Save size={16} />
                Überarbeitetes Angebot einreichen
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

