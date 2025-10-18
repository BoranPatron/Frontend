import React, { useState, useRef } from 'react';
import { X, FileText, Upload, Calculator, Euro, Calendar, Building } from 'lucide-react';
import { api } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../api/notificationService';
import CostPositionManager from './CostPositionManager';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  milestoneId: number;
  milestoneTitle: string;
  contractValue?: number;
  onInvoiceSubmitted?: () => void;
  onInvoiceCreated?: () => void;
  projectId?: number;
  serviceProviderId?: number;
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  milestoneId,
  milestoneTitle,
  contractValue,
  onInvoiceSubmitted,
  onInvoiceCreated,
  projectId,
  serviceProviderId
}) => {
  const { user, isServiceProvider } = useAuth();
  const [invoiceType, setInvoiceType] = useState<'manual' | 'upload'>('manual');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual Invoice Data
  const [manualInvoice, setManualInvoice] = useState({
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    netAmount: 0,
    country: 'CH', // Standard: Schweiz
    vatRate: 8.1, // Schweizer Standard-MwSt
    vatAmount: 0,
    totalAmount: 0,
    description: `Rechnung für ${milestoneTitle}`,
    workPeriodFrom: '',
    workPeriodTo: '',
    notes: ''
  });

  // Flexible Kostenpositionen - Start mit leerer Liste
  const [costPositions, setCostPositions] = useState<Array<{
    id: number;
    description: string;
    amount: number;
    category: string;
    cost_type: string;
    status: string;
  }>>([]);

  // Upload Data
  const [uploadData, setUploadData] = useState({
    file: null as File | null,
    invoiceNumber: '',
    totalAmount: 0,
    notes: ''
  });

  // VAT-Konfiguration für DACH-Region
  const vatConfig = {
    CH: {
      name: 'Schweiz',
      currency: 'CHF',
      flag: '🇨🇭',
      rates: [
        { value: 0, label: '0% (Steuerbefreit)' },
        { value: 2.6, label: '2.6% (Reduziert)' },
        { value: 3.8, label: '3.8% (Sondersatz)' },
        { value: 8.1, label: '8.1% (Standard)', default: true }
      ]
    },
    DE: {
      name: 'Deutschland', 
      currency: 'EUR',
      flag: '🇩🇪',
      rates: [
        { value: 0, label: '0% (Steuerbefreit)' },
        { value: 7, label: '7% (Ermäßigt)' },
        { value: 19, label: '19% (Standard)', default: true }
      ]
    },
    AT: {
      name: 'Österreich',
      currency: 'EUR', 
      flag: '🇦🇹',
      rates: [
        { value: 0, label: '0% (Steuerbefreit)' },
        { value: 10, label: '10% (Reduziert)' },
        { value: 13, label: '13% (Ermäßigt)' },
        { value: 20, label: '20% (Standard)', default: true }
      ]
    }
  };

  // VAT-Berechnungsfunktion
  const calculateVAT = (netAmount: number, vatRate: number) => {
    const vat = (netAmount * vatRate) / 100;
    const total = netAmount + vat;
    return { vat, total };
  };

  // Hilfsfunktion um Bauträger-User zu ermitteln
  const getBautraegerUserId = async (projectId?: number): Promise<number> => {
    try {
      if (projectId) {
        const projectResponse = await api.get(`/projects/${projectId}`);
        if (projectResponse.data?.bautraeger_id) {
          return projectResponse.data.bautraeger_id;
        }
      }
      // Fallback: Verwende User-ID 1 als Standard-Bauträger
      return 1;
    } catch (error) {
      console.warn('⚠️ Konnte Bauträger-User nicht ermitteln, verwende Fallback:', error);
      return 1;
    }
  };

  const handleCountryChange = (country: string) => {
    const countryConfig = vatConfig[country as keyof typeof vatConfig];
    const defaultRate = countryConfig.rates.find(rate => rate.default)?.value || countryConfig.rates[0].value;
    
    setManualInvoice(prev => {
      const updated = { 
        ...prev, 
        country, 
        vatRate: defaultRate 
      };
      
      // Neuberechnung mit neuer MwSt
      const netAmount = costPositions.reduce((sum, pos) => sum + (pos.amount || 0), 0);
      const { vat, total } = calculateVAT(netAmount, defaultRate);
      
      updated.netAmount = netAmount;
      updated.vatAmount = vat;
      updated.totalAmount = total;
      
      return updated;
    });
  };


  const handleManualInputChange = (field: string, value: any) => {
    setManualInvoice(prev => {
      const updated = { ...prev, [field]: value };
      
      // Automatische Berechnung bei MwSt-Änderung
      if (field === 'vatRate') {
        const netAmount = costPositions.reduce((sum, pos) => sum + (pos.amount || 0), 0);
        const { vat, total } = calculateVAT(netAmount, updated.vatRate);
        
        updated.netAmount = netAmount;
        updated.vatAmount = vat;
        updated.totalAmount = total;
      }
      
      return updated;
    });
  };

  // Funktion zum Setzen des Fälligkeitsdatums basierend auf Rechnungsdatum + Tage
  const setDueDateFromInvoiceDate = (days: number) => {
    if (!manualInvoice.invoiceDate) {
      setError('Bitte setzen Sie zuerst das Rechnungsdatum');
      return;
    }
    
    const invoiceDate = new Date(manualInvoice.invoiceDate);
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(invoiceDate.getDate() + days);
    
    const dueDateString = dueDate.toISOString().split('T')[0];
    handleManualInputChange('dueDate', dueDateString);
  };

  // Kostenpositionen Handler für neue Komponente
  const handleCostPositionsChange = (newPositions: typeof costPositions) => {
    setCostPositions(newPositions);
    
    // Automatische Neuberechnung der Gesamtsumme
    const netAmount = newPositions.reduce((sum, pos) => sum + (pos.amount || 0), 0);
    const { vat, total } = calculateVAT(netAmount, manualInvoice.vatRate);
    
    setManualInvoice(prev => ({
      ...prev,
      netAmount,
      vatAmount: vat,
      totalAmount: total
    }));
  };

  const handleTotalChange = (total: number) => {
    const { vat, total: totalWithVat } = calculateVAT(total, manualInvoice.vatRate);
    
    setManualInvoice(prev => ({
      ...prev,
      netAmount: total,
      vatAmount: vat,
      totalAmount: totalWithVat
    }));
  };


  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('Bitte laden Sie nur PDF-Dateien hoch.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError('Die Datei ist zu groß. Maximum: 10MB');
        return;
      }
      
      setUploadData(prev => ({ ...prev, file }));
      setError(null);
    }
  };

  const submitManualInvoice = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Validierung
      if (!manualInvoice.invoiceNumber.trim()) {
        throw new Error('Rechnungsnummer ist erforderlich');
      }
      if (!manualInvoice.dueDate) {
        throw new Error('Fälligkeitsdatum ist erforderlich');
      }
      if (manualInvoice.totalAmount <= 0) {
        throw new Error('Rechnungsbetrag muss größer als 0 sein');
      }

                   const invoiceData = {
        project_id: projectId || 7,  // Verwende übergebene projectId oder Fallback
        milestone_id: milestoneId,
        service_provider_id: serviceProviderId || user?.id || 6,  // Verwende übergebene serviceProviderId oder User-ID
        invoice_number: manualInvoice.invoiceNumber,
        invoice_date: new Date(manualInvoice.invoiceDate).toISOString(),
        due_date: new Date(manualInvoice.dueDate).toISOString(),
        net_amount: manualInvoice.netAmount,
        vat_rate: manualInvoice.vatRate,
        vat_amount: manualInvoice.vatAmount,
        total_amount: manualInvoice.totalAmount,
        description: manualInvoice.description,
        work_period_from: manualInvoice.workPeriodFrom ? new Date(manualInvoice.workPeriodFrom).toISOString() : null,
        work_period_to: manualInvoice.workPeriodTo ? new Date(manualInvoice.workPeriodTo).toISOString() : null,
        cost_positions: costPositions.filter(pos => pos.description.trim() && pos.amount > 0),
        notes: manualInvoice.notes,
        type: 'manual',
        user_role: isServiceProvider() ? 'service_provider' : 'bautraeger'  // Füge User-Rolle für Backend-Validierung hinzu
      };

      const response = await api.post('/invoices/create', invoiceData);
      
      // Sichere Behandlung der Antwort
      if (response.data && typeof response.data === 'object') {
        console.log('✅ Rechnung-Daten:', JSON.stringify(response.data, null, 2));
        
        // Erstelle Benachrichtigung für Bauträger
        try {
          const bautraegerUserId = await getBautraegerUserId(projectId);
          await notificationService.createNotification({
            recipient_id: bautraegerUserId,
            type: 'invoice_submitted',
            title: '🧾 Neue Rechnung eingegangen',
            message: `Eine neue Rechnung für "${milestoneTitle}" wurde erstellt`,
            priority: 'high',
            data: JSON.stringify({
              description: `Rechnungsnummer: ${manualInvoice.invoiceNumber}\nBetrag: ${new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(manualInvoice.totalAmount)}`,
              invoice_id: response.data.id,
              invoice_number: manualInvoice.invoiceNumber,
              total_amount: manualInvoice.totalAmount,
              invoice_type: 'manual',
              service_provider_id: serviceProviderId || user?.id
            }),
            related_project_id: projectId,
            related_milestone_id: milestoneId
          });
          
          // Sende Custom Event für sofortige UI-Aktualisierung
          const invoiceEvent = new CustomEvent('invoiceSubmitted', {
            detail: {
              invoice: response.data,
              milestoneId: milestoneId,
              milestoneTitle: milestoneTitle,
              invoiceNumber: manualInvoice.invoiceNumber,
              totalAmount: manualInvoice.totalAmount
            }
          });
          window.dispatchEvent(invoiceEvent);
          
          console.log('🔔 Benachrichtigung für neue Rechnung erstellt');
        } catch (notificationError) {
          console.error('⚠️ Fehler beim Erstellen der Benachrichtigung:', notificationError);
          // Fehler bei Benachrichtigung sollte nicht die Rechnungserstellung blockieren
        }
      }
      
      onInvoiceSubmitted?.();
      onInvoiceCreated?.();
      onClose();
      
    } catch (error: any) {
      console.error('❌ Fehler beim Erstellen der Rechnung:', error);
      
      // Sichere Fehlerbehandlung - nur Strings erlauben
      let errorMessage = 'Fehler beim Erstellen der Rechnung';
      
      if (error.response?.data?.detail) {
        errorMessage = String(error.response.data.detail);
      } else if (error.message) {
        errorMessage = String(error.message);
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const submitUploadInvoice = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!uploadData.file) {
        throw new Error('Bitte wählen Sie eine PDF-Datei aus');
      }
      if (!uploadData.invoiceNumber.trim()) {
        throw new Error('Rechnungsnummer ist erforderlich');
      }
      if (uploadData.totalAmount <= 0) {
        throw new Error('Rechnungsbetrag muss größer als 0 sein');
      }

      const formData = new FormData();
      formData.append('file', uploadData.file);
      formData.append('milestone_id', milestoneId.toString());
      formData.append('project_id', (projectId || 7).toString());
      formData.append('service_provider_id', (serviceProviderId || user?.id || 6).toString());
      // Füge User-Rolle hinzu für Backend-Validierung
      if (isServiceProvider()) {
        formData.append('user_role', 'service_provider');
      }
      formData.append('invoice_number', uploadData.invoiceNumber);
      formData.append('total_amount', uploadData.totalAmount.toString());
      formData.append('notes', uploadData.notes);
      formData.append('type', 'upload');

      const response = await api.post('/invoices/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Sichere Behandlung der Antwort
      if (response.data && typeof response.data === 'object') {
        console.log('✅ PDF-Rechnung hochgeladen:', response.data);
        
        // Erstelle Benachrichtigung für Bauträger
        try {
          const bautraegerUserId = await getBautraegerUserId(projectId);
          await notificationService.createNotification({
            recipient_id: bautraegerUserId,
            type: 'invoice_submitted',
            title: '🧾 Neue Rechnung (PDF) eingegangen',
            message: `Eine neue Rechnung für "${milestoneTitle}" wurde hochgeladen`,
            priority: 'high',
            data: JSON.stringify({
              description: `Rechnungsnummer: ${uploadData.invoiceNumber}\nBetrag: ${new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(uploadData.totalAmount)}`,
              invoice_id: response.data.id,
              invoice_number: uploadData.invoiceNumber,
              total_amount: uploadData.totalAmount,
              invoice_type: 'upload',
              has_pdf: true,
              service_provider_id: serviceProviderId || user?.id
            }),
            related_project_id: projectId,
            related_milestone_id: milestoneId
          });
          
          // Sende Custom Event für sofortige UI-Aktualisierung
          const invoiceEvent = new CustomEvent('invoiceSubmitted', {
            detail: {
              invoice: response.data,
              milestoneId: milestoneId,
              milestoneTitle: milestoneTitle,
              invoiceNumber: uploadData.invoiceNumber,
              totalAmount: uploadData.totalAmount,
              isPDF: true
            }
          });
          window.dispatchEvent(invoiceEvent);
          
          console.log('🔔 Benachrichtigung für neue PDF-Rechnung erstellt');
        } catch (notificationError) {
          console.error('⚠️ Fehler beim Erstellen der Benachrichtigung:', notificationError);
          // Fehler bei Benachrichtigung sollte nicht die Rechnungserstellung blockieren
        }
      }

      onInvoiceSubmitted?.();
      onInvoiceCreated?.();
      onClose();
      
    } catch (error: any) {
      console.error('❌ Fehler beim Hochladen der Rechnung:', error);
      
      // Sichere Fehlerbehandlung - nur Strings erlauben
      let errorMessage = 'Fehler beim Hochladen der Rechnung';
      
      if (error.response?.data?.detail) {
        errorMessage = String(error.response.data.detail);
      } else if (error.message) {
        errorMessage = String(error.message);
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = () => {
    if (invoiceType === 'manual') {
      submitManualInvoice();
    } else {
      submitUploadInvoice();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-[#1a1a2e] to-[#2c3539] rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-600/30 backdrop-blur-sm">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-600/30 bg-gradient-to-r from-[#1a1a2e]/80 to-[#2c3539]/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-[#ffbd59]/20 to-[#ffa726]/20 rounded-xl shadow-lg">
              <FileText size={24} className="text-[#ffbd59]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Rechnung stellen
              </h2>
              <p className="text-sm text-gray-400">{milestoneTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="bg-gradient-to-r from-red-500/10 to-red-600/10 border border-red-500/30 rounded-xl p-4 mb-6 backdrop-blur-sm">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Typ-Auswahl */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4 text-white">
              Rechnungsart wählen
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setInvoiceType('manual')}
                className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                  invoiceType === 'manual'
                    ? 'border-[#ffbd59] bg-gradient-to-r from-[#ffbd59]/10 to-[#ffa726]/10 shadow-lg shadow-[#ffbd59]/20'
                    : 'border-gray-600/30 hover:border-gray-500/50 bg-gradient-to-r from-[#1a1a2e]/50 to-[#2c3539]/50 backdrop-blur-sm'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Calculator 
                    size={20}
                    className={`${
                      invoiceType === 'manual' ? 'text-[#ffbd59]' : 'text-gray-400'
                    }`} 
                  />
                  <div className="text-left">
                    <h4 className="font-semibold text-white">Manuelle Eingabe</h4>
                    <p className="text-sm text-gray-400">Rechnung über Eingabefelder erstellen</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setInvoiceType('upload')}
                className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                  invoiceType === 'upload'
                    ? 'border-[#ffbd59] bg-gradient-to-r from-[#ffbd59]/10 to-[#ffa726]/10 shadow-lg shadow-[#ffbd59]/20'
                    : 'border-gray-600/30 hover:border-gray-500/50 bg-gradient-to-r from-[#1a1a2e]/50 to-[#2c3539]/50 backdrop-blur-sm'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Upload 
                    size={20}
                    className={`${
                      invoiceType === 'upload' ? 'text-[#ffbd59]' : 'text-gray-400'
                    }`} 
                  />
                  <div className="text-left">
                    <h4 className="font-semibold text-white">PDF hochladen</h4>
                    <p className="text-sm text-gray-400">Fertige Rechnung als PDF hochladen</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Manual Invoice Form */}
          {invoiceType === 'manual' && (
            <div className="space-y-6">
              {/* Modern Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-[#ffbd59]/20 to-[#ffa726]/20 rounded-xl">
                  <FileText size={24} className="text-[#ffbd59]" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    Rechnungsdetails
                  </h3>
                  <p className="text-sm text-gray-400">
                    Grundlegende Informationen zur Rechnung
                  </p>
                </div>
              </div>

              {/* Grunddaten Card */}
              <div className="bg-gradient-to-r from-[#1a1a2e]/80 to-[#2c3539]/80 backdrop-blur-sm rounded-xl border border-gray-600/30 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 px-6 py-4 border-b border-gray-600/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Building size={20} className="text-blue-400" />
                    </div>
                    <h4 className="font-semibold text-white">Grunddaten</h4>
                  </div>
                </div>
                
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      📊 Rechnungsnummer *
                    </label>
                    <input
                      type="text"
                      value={manualInvoice.invoiceNumber}
                      onChange={(e) => handleManualInputChange('invoiceNumber', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-600/30 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent bg-[#1a1a2e]/50 text-white placeholder-gray-400 transition-all duration-200"
                      placeholder="z.B. RE-2024-001"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      📅 Rechnungsdatum
                    </label>
                    <input
                      type="date"
                      value={manualInvoice.invoiceDate}
                      onChange={(e) => handleManualInputChange('invoiceDate', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-600/30 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent bg-[#1a1a2e]/50 text-white transition-all duration-200"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      ⏰ Fälligkeitsdatum *
                    </label>
                    <div className="flex gap-3 items-center">
                      <input
                        type="date"
                        value={manualInvoice.dueDate}
                        onChange={(e) => handleManualInputChange('dueDate', e.target.value)}
                        className="flex-1 px-4 py-3 border border-gray-600/30 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent bg-[#1a1a2e]/50 text-white transition-all duration-200"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setDueDateFromInvoiceDate(14)}
                          className="px-3 py-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-400/30 rounded-lg text-blue-300 text-sm font-medium hover:from-blue-500/30 hover:to-cyan-500/30 hover:border-blue-400/50 hover:text-blue-200 transition-all duration-200 shadow-lg hover:shadow-blue-500/20 hover:shadow-lg backdrop-blur-sm"
                        >
                          +14T
                        </button>
                        <button
                          type="button"
                          onClick={() => setDueDateFromInvoiceDate(30)}
                          className="px-3 py-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 rounded-lg text-green-300 text-sm font-medium hover:from-green-500/30 hover:to-emerald-500/30 hover:border-green-400/50 hover:text-green-200 transition-all duration-200 shadow-lg hover:shadow-green-500/20 hover:shadow-lg backdrop-blur-sm"
                        >
                          +30T
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Leistungszeitraum Card */}
              <div className="bg-gradient-to-r from-[#1a1a2e]/80 to-[#2c3539]/80 backdrop-blur-sm rounded-xl border border-gray-600/30 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 px-6 py-4 border-b border-gray-600/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <Calendar size={20} className="text-purple-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">Leistungszeitraum</h4>
                      <p className="text-xs text-gray-400">Optional - für zeitraumbezogene Leistungen</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      📅 Von
                    </label>
                    <input
                      type="date"
                      value={manualInvoice.workPeriodFrom}
                      onChange={(e) => handleManualInputChange('workPeriodFrom', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-600/30 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent bg-[#1a1a2e]/50 text-white transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      📅 Bis
                    </label>
                    <input
                      type="date"
                      value={manualInvoice.workPeriodTo}
                      onChange={(e) => handleManualInputChange('workPeriodTo', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-600/30 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent bg-[#1a1a2e]/50 text-white transition-all duration-200"
                    />
                  </div>
                </div>
              </div>

              {/* Moderne Kostenpositionen-Komponente */}
              <CostPositionManager
                positions={costPositions}
                onPositionsChange={handleCostPositionsChange}
                onTotalChange={handleTotalChange}
              />

              {/* Moderne Steuerberechnung */}
              <div className="bg-gradient-to-r from-[#1a1a2e]/80 to-[#2c3539]/80 backdrop-blur-sm rounded-xl border border-gray-600/30 overflow-hidden">
                <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 px-6 py-4 border-b border-gray-600/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <Calculator size={20} className="text-green-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">Steuerberechnung</h4>
                      <p className="text-xs text-gray-400">Automatische MwSt.-Berechnung nach Ländern</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 space-y-6">
                  {/* Länder-Auswahl */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        🌍 Land / Steuersystem
                      </label>
                      <select
                        value={manualInvoice.country}
                        onChange={(e) => handleCountryChange(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-600/30 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent bg-[#1a1a2e]/50 text-white transition-all duration-200"
                      >
                        {Object.entries(vatConfig).map(([code, config]) => (
                          <option key={code} value={code}>
                            {config.flag} {config.name} ({config.currency})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        📊 MwSt.-Satz
                      </label>
                      <select
                        value={manualInvoice.vatRate}
                        onChange={(e) => handleManualInputChange('vatRate', parseFloat(e.target.value))}
                        className="w-full px-4 py-3 border border-gray-600/30 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent bg-[#1a1a2e]/50 text-white transition-all duration-200"
                      >
                        {vatConfig[manualInvoice.country as keyof typeof vatConfig].rates.map((rate) => (
                          <option key={rate.value} value={rate.value}>
                            {rate.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Betragsaufstellung */}
                  <div className="bg-gradient-to-r from-[#ffbd59]/5 to-[#ffa726]/5 rounded-xl p-6 border border-[#ffbd59]/20">
                    <h5 className="font-semibold text-white mb-4 flex items-center gap-2">
                      📈 Betragsaufstellung
                    </h5>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300 flex items-center gap-2">
                          💰 Nettobetrag:
                        </span>
                        <span className="font-semibold text-white">
                          {manualInvoice.netAmount.toFixed(2)} {vatConfig[manualInvoice.country as keyof typeof vatConfig].currency}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-gray-300 flex items-center gap-2">
                          📈 MwSt. ({manualInvoice.vatRate}%):
                        </span>
                        <span className="font-semibold text-green-400">
                          +{manualInvoice.vatAmount.toFixed(2)} {vatConfig[manualInvoice.country as keyof typeof vatConfig].currency}
                        </span>
                      </div>
                      
                      <div className="border-t border-[#ffbd59]/20 pt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-white font-semibold text-lg flex items-center gap-2">
                            📋 Gesamtbetrag:
                          </span>
                          <span className="font-bold text-2xl text-[#ffbd59] bg-gradient-to-r from-[#ffbd59] to-[#ffa726] bg-clip-text text-transparent">
                            {manualInvoice.totalAmount.toFixed(2)} {vatConfig[manualInvoice.country as keyof typeof vatConfig].currency}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Info-Box für ausgewähltes Land */}
                  <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-lg p-4 border border-blue-500/20">
                    <div className="flex items-start gap-3">
                      <div className="p-1 bg-blue-500/20 rounded">
                        <span className="text-lg">{vatConfig[manualInvoice.country as keyof typeof vatConfig].flag}</span>
                      </div>
                      <div>
                        <h6 className="font-medium text-blue-300">
                          {vatConfig[manualInvoice.country as keyof typeof vatConfig].name}
                        </h6>
                        <p className="text-xs text-blue-200/80">
                          Aktueller MwSt.-Satz: {manualInvoice.vatRate}% | Währung: {vatConfig[manualInvoice.country as keyof typeof vatConfig].currency}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Leistungsbeschreibung Card */}
              <div className="bg-gradient-to-r from-[#1a1a2e]/80 to-[#2c3539]/80 backdrop-blur-sm rounded-xl border border-gray-600/30 overflow-hidden">
                <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 px-6 py-4 border-b border-gray-600/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-500/20 rounded-lg">
                      <FileText size={20} className="text-yellow-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">Leistungsbeschreibung</h4>
                      <p className="text-xs text-gray-400">Detaillierte Beschreibung der erbrachten Leistungen</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <textarea
                    value={manualInvoice.description}
                    onChange={(e) => handleManualInputChange('description', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-600/30 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent bg-[#1a1a2e]/50 text-white placeholder-gray-400 resize-none transition-all duration-200"
                    rows={4}
                    placeholder="📝 Beschreibung der erbrachten Leistungen..."
                  />
                </div>
              </div>

              {/* Interne Notizen Card */}
              <div className="bg-gradient-to-r from-[#1a1a2e]/80 to-[#2c3539]/80 backdrop-blur-sm rounded-xl border border-gray-600/30 overflow-hidden">
                <div className="bg-gradient-to-r from-gray-500/10 to-slate-500/10 px-6 py-4 border-b border-gray-600/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-500/20 rounded-lg">
                      <FileText size={20} className="text-gray-400" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">Interne Notizen</h4>
                      <p className="text-xs text-gray-400">Optional - nur für interne Verwendung</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <textarea
                    value={manualInvoice.notes}
                    onChange={(e) => handleManualInputChange('notes', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-600/30 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent bg-[#1a1a2e]/50 text-white placeholder-gray-400 resize-none transition-all duration-200"
                    rows={3}
                    placeholder="💭 Interne Notizen zur Rechnung..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Upload Form */}
          {invoiceType === 'upload' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold" style={{ color: '#51636f' }}>
                PDF-Rechnung hochladen
              </h3>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Rechnungs-PDF *
                </label>
                <div 
                  className="border-2 border-dashed border-gray-600/30 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  {uploadData.file ? (
                    <div>
                      <p className="text-sm font-medium text-gray-900">{uploadData.file.name}</p>
                      <p className="text-xs text-gray-500">
                        {(uploadData.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-gray-600">Klicken Sie hier oder ziehen Sie eine PDF-Datei hinein</p>
                      <p className="text-xs text-gray-500 mt-1">Maximale Dateigröße: 10MB</p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Rechnungsdetails */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Rechnungsnummer *
                  </label>
                  <input
                    type="text"
                    value={uploadData.invoiceNumber}
                    onChange={(e) => setUploadData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-600/30 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                    placeholder="z.B. RE-2024-001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Rechnungsbetrag (€) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={uploadData.totalAmount}
                    onChange={(e) => setUploadData(prev => ({ ...prev, totalAmount: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-600/30 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Notizen (optional)
                </label>
                <textarea
                  value={uploadData.notes}
                  onChange={(e) => setUploadData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-600/30 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                  rows={3}
                  placeholder="Zusätzliche Informationen zur Rechnung..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-600/30 bg-gradient-to-r from-[#1a1a2e]/80 to-[#2c3539]/80 backdrop-blur-sm">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-6 py-2 text-gray-400 hover:text-white font-medium transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] hover:from-[#ffa726] hover:to-[#ff9500] text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-[#ffbd59]/30 hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Wird erstellt...
              </>
            ) : (
              <>
                <FileText size={18} />
                Rechnung {invoiceType === 'manual' ? 'erstellen' : 'hochladen'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;
