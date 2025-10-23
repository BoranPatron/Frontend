import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Users, Plus, Eye, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface Inspection {
  id: number;
  title: string;
  description?: string;
  milestone_id: number;
  project_id: number;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED';
  scheduled_date: string;
  duration_minutes: number;
  location: string;
  contact_person?: string;
  contact_phone?: string;
  contact_email?: string;
  special_instructions?: string;
  required_equipment?: string;
  inspection_notes?: string;
  completion_notes?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  invitations: InspectionInvitation[];
}

interface InspectionInvitation {
  id: number;
  inspection_id: number;
  quote_id: number;
  service_provider_id: number;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
  response_message?: string;
  responded_at?: string;
  notification_sent: boolean;
  notification_sent_at?: string;
  reminder_sent: boolean;
  reminder_sent_at?: string;
  created_at: string;
  updated_at: string;
}

interface Quote {
  id: number;
  title: string;
  company_name?: string;
  contact_person?: string;
  total_amount: number;
  currency: string;
  service_provider_id: number;
  status: string;
}

interface InspectionManagementProps {
  milestoneId: number;
  projectId: number;
  requiresInspection: boolean;
  onInspectionCreated?: (inspection: Inspection) => void;
}

const InspectionManagement: React.FC<InspectionManagementProps> = ({
  milestoneId,
  projectId,
  requiresInspection,
  onInspectionCreated
}) => {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedQuotes, setSelectedQuotes] = useState<number[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduled_date: '',
    duration_minutes: 60,
    location: '',
    contact_person: '',
    contact_phone: '',
    contact_email: '',
    special_instructions: '',
    required_equipment: ''
  });

  useEffect(() => {
    if (requiresInspection) {
      fetchInspections();
      fetchQuotes();
    }
  }, [milestoneId, requiresInspection]);

  const fetchInspections = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v1/inspections/?milestone_id=${milestoneId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setInspections(data);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Besichtigungen:', error);
    }
  };

  const fetchQuotes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v1/quotes/milestone/${milestoneId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setQuotes(data.filter((quote: Quote) => quote.status === 'SUBMITTED'));
      }
    } catch (error) {
      console.error('Fehler beim Laden der Angebote:', error);
    }
  };

  const handleCreateInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const inspectionData = {
        ...formData,
        milestone_id: milestoneId,
        project_id: projectId,
        invited_quote_ids: selectedQuotes,
        scheduled_date: new Date(formData.scheduled_date).toISOString()
      };

      const response = await fetch('/api/v1/inspections/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(inspectionData)
      });

      if (response.ok) {
        const newInspection = await response.json();
        setInspections([...inspections, newInspection]);
        setShowCreateForm(false);
        setFormData({
          title: '',
          description: '',
          scheduled_date: '',
          duration_minutes: 60,
          location: '',
          contact_person: '',
          contact_phone: '',
          contact_email: '',
          special_instructions: '',
          required_equipment: ''
        });
        setSelectedQuotes([]);
        
        if (onInspectionCreated) {
          onInspectionCreated(newInspection);
        }
      } else {
        throw new Error('Fehler beim Erstellen der Besichtigung');
      }
    } catch (error) {
      console.error('Fehler beim Erstellen der Besichtigung:', error);
      alert('Fehler beim Erstellen der Besichtigung');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'IN_PROGRESS':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'CANCELLED':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    const statusTexts = {
      'SCHEDULED': 'Geplant',
      'IN_PROGRESS': 'Läuft',
      'COMPLETED': 'Abgeschlossen',
      'CANCELLED': 'Abgesagt',
      'RESCHEDULED': 'Verschoben'
    };
    return statusTexts[status as keyof typeof statusTexts] || status;
  };

  const getInvitationStatusBadge = (status: string) => {
    const statusConfig = {
      'PENDING': { color: 'bg-yellow-100 text-yellow-800', text: 'Ausstehend' },
      'ACCEPTED': { color: 'bg-green-100 text-green-800', text: 'Angenommen' },
      'DECLINED': { color: 'bg-red-100 text-red-800', text: 'Abgelehnt' },
      'EXPIRED': { color: 'bg-gray-100 text-gray-800', text: 'Abgelaufen' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config?.color || 'bg-gray-100 text-gray-800'}`}>
        {config?.text || status}
      </span>
    );
  };

  if (!requiresInspection) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Eye className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Besichtigungsmanagement</h3>
        </div>
        
        {quotes.length > 0 && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Besichtigung planen</span>
          </button>
        )}
      </div>

      {/* Hinweis wenn keine Angebote vorhanden */}
      {quotes.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Eye className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>Noch keine eingereichten Angebote für Besichtigungseinladungen verfügbar.</p>
        </div>
      )}

      {/* Bestehende Besichtigungen */}
      {inspections.length > 0 && (
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">Geplante Besichtigungen</h4>
          <div className="space-y-4">
            {inspections.map((inspection) => (
              <div key={inspection.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(inspection.status)}
                    <h5 className="font-medium text-gray-900">{inspection.title}</h5>
                    <span className="text-sm text-gray-500">
                      {getStatusText(inspection.status)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(inspection.scheduled_date).toLocaleString('de-DE')}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{inspection.location}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>{inspection.duration_minutes} Minuten</span>
                  </div>
                </div>

                {inspection.description && (
                  <p className="text-sm text-gray-600 mb-4">{inspection.description}</p>
                )}

                {/* Einladungen */}
                {inspection.invitations.length > 0 && (
                  <div>
                    <h6 className="text-sm font-medium text-gray-900 mb-2">
                      Eingeladene Dienstleister ({inspection.invitations.length})
                    </h6>
                    <div className="space-y-2">
                      {inspection.invitations.map((invitation) => {
                        const quote = quotes.find(q => q.id === invitation.quote_id);
                        return (
                          <div key={invitation.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center space-x-3">
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {quote?.company_name || quote?.contact_person || `Angebot #${quote?.id}`}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {quote?.total_amount} {quote?.currency}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {getInvitationStatusBadge(invitation.status)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Formular für neue Besichtigung */}
      {showCreateForm && (
        <div className="border-t border-gray-200 pt-6">
          <form onSubmit={handleCreateInspection} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titel der Besichtigung *
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
                  Termin *
                </label>
                <input
                  type="datetime-local"
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ort der Besichtigung *
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Vollständige Adresse"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Beschreibung
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Zusätzliche Informationen zur Besichtigung"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dauer (Minuten)
                </label>
                <input
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="15"
                  max="480"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ansprechpartner
                </label>
                <input
                  type="text"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefon
                </label>
                <input
                  type="tel"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Angebote auswählen */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dienstleister zur Besichtigung einladen *
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2">
                {quotes.map((quote) => (
                  <label key={quote.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedQuotes.includes(quote.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedQuotes([...selectedQuotes, quote.id]);
                        } else {
                          setSelectedQuotes(selectedQuotes.filter(id => id !== quote.id));
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {quote.company_name || quote.contact_person || `Angebot #${quote.id}`}
                      </p>
                      <p className="text-xs text-gray-500">
                        {quote.title} - {quote.total_amount} {quote.currency}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
              {selectedQuotes.length === 0 && (
                <p className="text-sm text-red-600 mt-1">Mindestens ein Angebot muss ausgewählt werden</p>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={loading || selectedQuotes.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Erstelle...' : 'Besichtigung planen'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default InspectionManagement; 