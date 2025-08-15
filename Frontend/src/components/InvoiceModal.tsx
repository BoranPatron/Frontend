import React, { useState, useRef } from 'react';
import { X, FileText, Upload, Calculator, Euro, Calendar, Building } from 'lucide-react';
import { api } from '../api/api';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  milestoneId: number;
  milestoneTitle: string;
  contractValue: number;
  onInvoiceSubmitted: () => void;
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  milestoneId,
  milestoneTitle,
  contractValue,
  onInvoiceSubmitted
}) => {
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
    vatRate: 19,
    vatAmount: 0,
    totalAmount: 0,
    description: `Rechnung für ${milestoneTitle}`,
    workPeriodFrom: '',
    workPeriodTo: '',
    notes: ''
  });

  // Flexible Kostenpositionen
  const [costPositions, setCostPositions] = useState([
    { id: 1, description: '', amount: 0, category: 'custom', cost_type: 'standard', status: 'active' }
  ]);

  // Upload Data
  const [uploadData, setUploadData] = useState({
    file: null as File | null,
    invoiceNumber: '',
    totalAmount: 0,
    notes: ''
  });

  const calculateVAT = (netAmount: number, vatRate: number) => {
    const vat = netAmount * (vatRate / 100);
    const total = netAmount + vat;
    return { vat, total };
  };

  const recalculateTotal = () => {
    const netAmount = costPositions.reduce((sum, pos) => sum + (pos.amount || 0), 0);
    const { vat, total } = calculateVAT(netAmount, manualInvoice.vatRate);
    
    setManualInvoice(prev => ({
      ...prev,
      netAmount,
      vatAmount: vat,
      totalAmount: total
    }));
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

  const addCostPosition = () => {
    const newId = Math.max(...costPositions.map(p => p.id)) + 1;
    setCostPositions(prev => [...prev, { id: newId, description: '', amount: 0, category: 'custom', cost_type: 'standard', status: 'active' }]);
  };

  const removeCostPosition = (id: number) => {
    if (costPositions.length > 1) {
      setCostPositions(prev => prev.filter(p => p.id !== id));
      // Neuberechnung nach Löschen
      setTimeout(recalculateTotal, 0);
    }
  };

  const updateCostPosition = (id: number, field: 'description' | 'amount' | 'category' | 'cost_type' | 'status', value: string | number) => {
    setCostPositions(prev => 
      prev.map(pos => 
        pos.id === id 
          ? { ...pos, [field]: value }
          : pos
      )
    );
    
    // Neuberechnung bei Betrag-Änderung
    if (field === 'amount') {
      setTimeout(recalculateTotal, 0);
    }
  };

  // Automatische Neuberechnung wenn sich costPositions ändern
  React.useEffect(() => {
    recalculateTotal();
  }, [costPositions.length]); // Nur bei Änderung der Anzahl, nicht bei jedem Update

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
        project_id: 7,  // ✅ Hinzugefügt: project_id
        milestone_id: milestoneId,
        service_provider_id: 6,  // ✅ Hinzugefügt: service_provider_id
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
        type: 'manual'
      };

      const response = await api.post('/invoices/create', invoiceData);
      
      // Sichere Behandlung der Antwort
      if (response.data && typeof response.data === 'object') {
        console.log('✅ Rechnung-Daten:', JSON.stringify(response.data, null, 2));
      }
      
      onInvoiceSubmitted();
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
      formData.append('invoice_number', uploadData.invoiceNumber);
      formData.append('total_amount', uploadData.totalAmount.toString());
      formData.append('notes', uploadData.notes);
      formData.append('type', 'upload');

      const response = await api.post('/invoices/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      onInvoiceSubmitted();
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-[#1a1a2e] to-[#2c3539] rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-600/30">
        {/* Header */}
        <div 
          className="flex items-center justify-between p-6 border-b border-gray-600/30"
          style={{ backgroundColor: '#51636f0a' }}
        >
          <div className="flex items-center space-x-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: '#51636f' }}
            >
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: '#51636f' }}>
                Rechnung stellen
              </h2>
              <p className="text-sm text-gray-600">{milestoneTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Typ-Auswahl */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4" style={{ color: '#51636f' }}>
              Rechnungsart wählen
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setInvoiceType('manual')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  invoiceType === 'manual'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Calculator 
                    className={`w-6 h-6 ${
                      invoiceType === 'manual' ? 'text-blue-600' : 'text-gray-400'
                    }`} 
                  />
                  <div className="text-left">
                    <h4 className="font-semibold">Manuelle Eingabe</h4>
                    <p className="text-sm text-gray-600">Rechnung über Eingabefelder erstellen</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setInvoiceType('upload')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  invoiceType === 'upload'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Upload 
                    className={`w-6 h-6 ${
                      invoiceType === 'upload' ? 'text-blue-600' : 'text-gray-400'
                    }`} 
                  />
                  <div className="text-left">
                    <h4 className="font-semibold">PDF hochladen</h4>
                    <p className="text-sm text-gray-600">Fertige Rechnung als PDF hochladen</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Manual Invoice Form */}
          {invoiceType === 'manual' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold" style={{ color: '#51636f' }}>
                Rechnungsdetails
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Grunddaten */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-700">Grunddaten</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rechnungsnummer *
                    </label>
                    <input
                      type="text"
                      value={manualInvoice.invoiceNumber}
                      onChange={(e) => handleManualInputChange('invoiceNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-transparent"
                      placeholder="z.B. RE-2024-001"
                      style={{ backgroundColor: '#51636f09' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rechnungsdatum
                    </label>
                    <input
                      type="date"
                      value={manualInvoice.invoiceDate}
                      onChange={(e) => handleManualInputChange('invoiceDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fälligkeitsdatum *
                    </label>
                    <input
                      type="date"
                      value={manualInvoice.dueDate}
                      onChange={(e) => handleManualInputChange('dueDate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Leistungszeitraum */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-700">Leistungszeitraum (optional)</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Von
                    </label>
                    <input
                      type="date"
                      value={manualInvoice.workPeriodFrom}
                      onChange={(e) => handleManualInputChange('workPeriodFrom', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bis
                    </label>
                    <input
                      type="date"
                      value={manualInvoice.workPeriodTo}
                      onChange={(e) => handleManualInputChange('workPeriodTo', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Flexible Kostenpositionen */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium text-gray-700">Kostenpositionen</h4>
                  <button
                    type="button"
                    onClick={addCostPosition}
                    className="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    + Position hinzufügen
                  </button>
                </div>
                
                <div className="space-y-3">
                  {costPositions.map((position, index) => (
                    <div key={position.id} className="flex gap-3 items-start">
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder={`Position ${index + 1} - Beschreibung`}
                          value={position.description}
                          onChange={(e) => updateCostPosition(position.id, 'description', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-transparent"
                          style={{ backgroundColor: '#51636f09' }}
                        />
                      </div>
                      <div className="w-32">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Betrag"
                          value={position.amount || ''}
                          onChange={(e) => updateCostPosition(position.id, 'amount', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-transparent"
                          style={{ backgroundColor: '#51636f09' }}
                        />
                      </div>
                      <div className="w-32">
                        <select
                          value={position.category}
                          onChange={(e) => updateCostPosition(position.id, 'category', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-transparent"
                          style={{ backgroundColor: '#51636f09' }}
                        >
                          <option value="material">Material</option>
                          <option value="labor">Arbeit</option>
                          <option value="other">Sonstiges</option>
                          <option value="custom">Individuell</option>
                        </select>
                      </div>
                      {costPositions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeCostPosition(position.id)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          title="Position entfernen"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Steuerberechnung */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-700 mb-3">Steuerberechnung</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      MwSt.-Satz (%)
                    </label>
                    <select
                      value={manualInvoice.vatRate}
                      onChange={(e) => handleManualInputChange('vatRate', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={0}>0% (Steuerbefreit)</option>
                      <option value={7}>7% (Ermäßigt)</option>
                      <option value={19}>19% (Standard)</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Nettobetrag:</span>
                    <span className="font-medium">{manualInvoice.netAmount.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span>MwSt. ({manualInvoice.vatRate}%):</span>
                    <span className="font-medium">{manualInvoice.vatAmount.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Gesamtbetrag:</span>
                    <span style={{ color: '#ffbd59' }}>{manualInvoice.totalAmount.toFixed(2)} €</span>
                  </div>
                </div>
              </div>

              {/* Beschreibung */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Leistungsbeschreibung
                </label>
                <textarea
                  value={manualInvoice.description}
                  onChange={(e) => handleManualInputChange('description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Beschreibung der erbrachten Leistungen..."
                />
              </div>

              {/* Notizen */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Interne Notizen (optional)
                </label>
                <textarea
                  value={manualInvoice.notes}
                  onChange={(e) => handleManualInputChange('notes', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                  placeholder="Interne Notizen zur Rechnung..."
                />
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rechnungs-PDF *
                </label>
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rechnungsnummer *
                  </label>
                  <input
                    type="text"
                    value={uploadData.invoiceNumber}
                    onChange={(e) => setUploadData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="z.B. RE-2024-001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rechnungsbetrag (€) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={uploadData.totalAmount}
                    onChange={(e) => setUploadData(prev => ({ ...prev, totalAmount: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notizen (optional)
                </label>
                <textarea
                  value={uploadData.notes}
                  onChange={(e) => setUploadData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Zusätzliche Informationen zur Rechnung..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex items-center px-6 py-2 text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
            style={{ backgroundColor: '#ffbd59' }}
            onMouseEnter={(e) => {
              if (!isLoading) e.currentTarget.style.backgroundColor = '#ff9500';
            }}
            onMouseLeave={(e) => {
              if (!isLoading) e.currentTarget.style.backgroundColor = '#ffbd59';
            }}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Wird erstellt...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
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
