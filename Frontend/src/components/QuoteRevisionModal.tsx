import React, { useState, useEffect } from 'react';
import { X, FileText, DollarSign, Calendar, Clock, AlertCircle, CheckCircle } from 'lucide-react';

interface QuoteRevision {
  id: number;
  original_quote_id: number;
  inspection_id?: number;
  service_provider_id: number;
  revision_number: number;
  reason: 'INSPECTION_FINDINGS' | 'SCOPE_CHANGES' | 'PRICE_ADJUSTMENT' | 'TIMELINE_ADJUSTMENT' | 'TECHNICAL_REQUIREMENTS' | 'OTHER';
  revision_notes?: string;
  title: string;
  description?: string;
  total_amount: number;
  currency: string;
  labor_cost?: number;
  material_cost?: number;
  overhead_cost?: number;
  estimated_duration?: number;
  start_date?: string;
  completion_date?: string;
  payment_terms?: string;
  warranty_period?: number;
  price_change_amount?: number;
  price_change_percentage?: number;
  duration_change_days?: number;
  is_active: boolean;
  is_final: boolean;
  created_at: string;
  updated_at: string;
}

interface Quote {
  id: number;
  title: string;
  description?: string;
  total_amount: number;
  currency: string;
  labor_cost?: number;
  material_cost?: number;
  overhead_cost?: number;
  estimated_duration?: number;
  start_date?: string;
  completion_date?: string;
  payment_terms?: string;
  warranty_period?: number;
  company_name?: string;
  contact_person?: string;
}

interface QuoteRevisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  quote: Quote;
  inspectionId?: number;
  onRevisionCreated?: (revision: QuoteRevision) => void;
}

const QuoteRevisionModal: React.FC<QuoteRevisionModalProps> = ({
  isOpen,
  onClose,
  quote,
  inspectionId,
  onRevisionCreated
}) => {
  const [loading, setLoading] = useState(false);
  const [revisions, setRevisions] = useState<QuoteRevision[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: quote.title,
    description: quote.description || '',
    reason: 'INSPECTION_FINDINGS' as const,
    revision_notes: '',
    total_amount: quote.total_amount,
    currency: quote.currency,
    labor_cost: quote.labor_cost || 0,
    material_cost: quote.material_cost || 0,
    overhead_cost: quote.overhead_cost || 0,
    estimated_duration: quote.estimated_duration || 0,
    start_date: quote.start_date || '',
    completion_date: quote.completion_date || '',
    payment_terms: quote.payment_terms || '',
    warranty_period: quote.warranty_period || 12
  });

  useEffect(() => {
    if (isOpen) {
      fetchRevisions();
      resetForm();
    }
  }, [isOpen, quote]);

  const resetForm = () => {
    setFormData({
      title: quote.title,
      description: quote.description || '',
      reason: 'INSPECTION_FINDINGS',
      revision_notes: '',
      total_amount: quote.total_amount,
      currency: quote.currency,
      labor_cost: quote.labor_cost || 0,
      material_cost: quote.material_cost || 0,
      overhead_cost: quote.overhead_cost || 0,
      estimated_duration: quote.estimated_duration || 0,
      start_date: quote.start_date || '',
      completion_date: quote.completion_date || '',
      payment_terms: quote.payment_terms || '',
      warranty_period: quote.warranty_period || 12
    });
  };

  const fetchRevisions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/inspections/quotes/${quote.id}/revisions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRevisions(data);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Revisionen:', error);
    }
  };

  const handleCreateRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const revisionData = {
        ...formData,
        inspection_id: inspectionId,
        start_date: formData.start_date ? new Date(formData.start_date).toISOString() : null,
        completion_date: formData.completion_date ? new Date(formData.completion_date).toISOString() : null
      };

      const response = await fetch(`/api/inspections/quotes/${quote.id}/revisions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(revisionData)
      });

      if (response.ok) {
        const newRevision = await response.json();
        setRevisions([newRevision, ...revisions]);
        setShowCreateForm(false);
        resetForm();
        
        if (onRevisionCreated) {
          onRevisionCreated(newRevision);
        }
      } else {
        throw new Error('Fehler beim Erstellen der Revision');
      }
    } catch (error) {
      console.error('Fehler beim Erstellen der Revision:', error);
      alert('Fehler beim Erstellen der Revision');
    } finally {
      setLoading(false);
    }
  };

  const getReasonText = (reason: string) => {
    const reasonTexts = {
      'INSPECTION_FINDINGS': 'Erkenntnisse aus Besichtigung',
      'SCOPE_CHANGES': 'Änderungen im Leistungsumfang',
      'PRICE_ADJUSTMENT': 'Preisanpassung',
      'TIMELINE_ADJUSTMENT': 'Zeitplan-Anpassung',
      'TECHNICAL_REQUIREMENTS': 'Technische Anforderungen',
      'OTHER': 'Sonstige Gründe'
    };
    return reasonTexts[reason as keyof typeof reasonTexts] || reason;
  };

  const formatPriceChange = (amount?: number, percentage?: number) => {
    if (amount === undefined && percentage === undefined) return null;
    
    const isPositive = (amount || 0) >= 0;
    const color = isPositive ? 'text-red-600' : 'text-green-600';
    const sign = isPositive ? '+' : '';
    
    return (
      <span className={`text-sm font-medium ${color}`}>
        {amount !== undefined && `${sign}${amount.toFixed(2)} ${quote.currency}`}
        {amount !== undefined && percentage !== undefined && ' '}
        {percentage !== undefined && `(${sign}${percentage.toFixed(1)}%)`}
      </span>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Angebotsrevisionen - {quote.company_name || quote.contact_person}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Ursprüngliches Angebot */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Ursprüngliches Angebot</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">Gesamtbetrag:</span>
                <span className="font-medium">{quote.total_amount} {quote.currency}</span>
              </div>
              {quote.estimated_duration && (
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Dauer:</span>
                  <span className="font-medium">{quote.estimated_duration} Tage</span>
                </div>
              )}
              {quote.start_date && (
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Start:</span>
                  <span className="font-medium">
                    {new Date(quote.start_date).toLocaleDateString('de-DE')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Bestehende Revisionen */}
          {revisions.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Angebotsrevisionen ({revisions.length})
              </h3>
              <div className="space-y-4">
                {revisions.map((revision) => (
                  <div key={revision.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                          Revision #{revision.revision_number}
                        </span>
                        {revision.is_active && (
                          <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">
                            Aktiv
                          </span>
                        )}
                        {revision.is_final && (
                          <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded">
                            Final
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(revision.created_at).toLocaleDateString('de-DE')}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-sm text-gray-600">Grund:</p>
                        <p className="font-medium">{getReasonText(revision.reason)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Neuer Betrag:</p>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">
                            {revision.total_amount} {revision.currency}
                          </span>
                          {formatPriceChange(revision.price_change_amount, revision.price_change_percentage)}
                        </div>
                      </div>
                    </div>

                    {revision.revision_notes && (
                      <div className="mb-3">
                        <p className="text-sm text-gray-600">Änderungsnotizen:</p>
                        <p className="text-sm text-gray-900">{revision.revision_notes}</p>
                      </div>
                    )}

                    {revision.estimated_duration && revision.duration_change_days !== null && (
                      <div>
                        <p className="text-sm text-gray-600">Neue Dauer:</p>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{revision.estimated_duration} Tage</span>
                          {revision.duration_change_days !== 0 && (
                            <span className={`text-sm font-medium ${
                              revision.duration_change_days > 0 ? 'text-red-600' : 'text-green-600'
                            }`}>
                              ({revision.duration_change_days > 0 ? '+' : ''}{revision.duration_change_days} Tage)
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Neue Revision erstellen */}
          <div className="border-t border-gray-200 pt-6">
            {!showCreateForm ? (
              <div className="text-center">
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors mx-auto"
                >
                  <FileText className="w-4 h-4" />
                  <span>Neue Revision erstellen</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateRevision} className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900">Neue Angebotsrevision</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Grund für Revision *
                    </label>
                    <select
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="INSPECTION_FINDINGS">Erkenntnisse aus Besichtigung</option>
                      <option value="SCOPE_CHANGES">Änderungen im Leistungsumfang</option>
                      <option value="PRICE_ADJUSTMENT">Preisanpassung</option>
                      <option value="TIMELINE_ADJUSTMENT">Zeitplan-Anpassung</option>
                      <option value="TECHNICAL_REQUIREMENTS">Technische Anforderungen</option>
                      <option value="OTHER">Sonstige Gründe</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Neuer Gesamtbetrag *
                    </label>
                    <div className="flex">
                      <input
                        type="number"
                        step="0.01"
                        value={formData.total_amount}
                        onChange={(e) => setFormData({ ...formData, total_amount: parseFloat(e.target.value) })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                      <span className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg text-gray-600">
                        {formData.currency}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Titel des überarbeiteten Angebots *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Erklärung der Änderungen
                  </label>
                  <textarea
                    value={formData.revision_notes}
                    onChange={(e) => setFormData({ ...formData, revision_notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Beschreiben Sie die Änderungen gegenüber dem ursprünglichen Angebot..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Arbeitskosten
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.labor_cost}
                      onChange={(e) => setFormData({ ...formData, labor_cost: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Materialkosten
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.material_cost}
                      onChange={(e) => setFormData({ ...formData, material_cost: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gemeinkosten
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.overhead_cost}
                      onChange={(e) => setFormData({ ...formData, overhead_cost: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Geschätzte Dauer (Tage)
                    </label>
                    <input
                      type="number"
                      value={formData.estimated_duration}
                      onChange={(e) => setFormData({ ...formData, estimated_duration: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Geplanter Start
                    </label>
                    <input
                      type="date"
                      value={formData.start_date ? formData.start_date.split('T')[0] : ''}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Geplanter Abschluss
                    </label>
                    <input
                      type="date"
                      value={formData.completion_date ? formData.completion_date.split('T')[0] : ''}
                      onChange={(e) => setFormData({ ...formData, completion_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      resetForm();
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Erstelle...' : 'Revision erstellen'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuoteRevisionModal; 