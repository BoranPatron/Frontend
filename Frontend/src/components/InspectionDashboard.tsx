import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Users, CheckCircle, XCircle, AlertTriangle, Eye, Plus, Send, User, Phone, FileText, Edit3 } from 'lucide-react';

interface Trade {
  id: number;
  title: string;
  description: string;
  category: string;
  budget: number;
  requires_inspection: boolean;
  status: string;
  start_date?: string;
  project_name: string;
}

interface Quote {
  id: number;
  title: string;
  total_amount: number;
  currency: string;
  service_provider_id: number;
  company_name: string;
  contact_person: string;
  status: string;
  created_at: string;
}

interface Inspection {
  id: number;
  title: string;
  description: string;
  scheduled_date: string;
  scheduled_time_start: string;
  scheduled_time_end: string;
  location_address: string;
  contact_person: string;
  contact_phone: string;
  status: string;
  invitations: InspectionInvitation[];
}

interface InspectionInvitation {
  id: number;
  service_provider_id: number;
  company_name: string;
  status: string;
  response_message?: string;
  responded_at?: string;
}

interface InspectionDashboardProps {
  projectId?: number;
  userRole?: string; // 'bautraeger' oder 'dienstleister'
}

export default function InspectionDashboard({ projectId, userRole = 'bautraeger' }: InspectionDashboardProps) {
  const [inspectionTrades, setInspectionTrades] = useState<Trade[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [myInvitations, setMyInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [selectedQuotes, setSelectedQuotes] = useState<Quote[]>([]);
  const [availableQuotes, setAvailableQuotes] = useState<Quote[]>([]);

  useEffect(() => {
    if (userRole === 'bautraeger') {
      loadInspectionTrades();
      loadInspections();
    } else {
      loadMyInvitations();
    }
  }, [projectId, userRole]);

  const loadInspectionTrades = async () => {
    try {
      // Lade alle Gewerke mit requires_inspection = true
      const response = await fetch('/api/v1/inspections/milestones/inspection-required', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setInspectionTrades(data);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Besichtigungs-Gewerke:', error);
    }
  };

  const loadInspections = async () => {
    try {
      const response = await fetch('/api/v1/inspections', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setInspections(data);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Besichtigungen:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMyInvitations = async () => {
    try {
      const response = await fetch('/api/v1/inspections/invitations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMyInvitations(data);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Einladungen:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadQuotesForTrade = async (tradeId: number) => {
    try {
      const response = await fetch(`/api/v1/quotes/milestone/${tradeId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAvailableQuotes(data.filter((quote: Quote) => quote.status === 'submitted'));
      }
    } catch (error) {
      console.error('Fehler beim Laden der Angebote:', error);
    }
  };

  const handleCreateInspection = (trade: Trade) => {
    setSelectedTrade(trade);
    loadQuotesForTrade(trade.id);
    setShowCreateModal(true);
  };

  const handleInviteServiceProviders = (trade: Trade) => {
    setSelectedTrade(trade);
    loadQuotesForTrade(trade.id);
    setShowInviteModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ffbd59]"></div>
      </div>
    );
  }

  // Dienstleister-Ansicht
  if (userRole === 'dienstleister') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Meine Besichtigungseinladungen</h2>
            <p className="text-gray-400 mt-1">Verwalten Sie Ihre Besichtigungstermine und Quote-Revisionen</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-300">
              {myInvitations.length} Einladungen
            </div>
          </div>
        </div>

        {/* Einladungen für Dienstleister */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h3 className="text-lg font-semibold text-white flex items-center gap-3">
              <Calendar size={20} className="text-[#ffbd59]" />
              Besichtigungseinladungen ({myInvitations.length})
            </h3>
          </div>
          
          <div className="p-6">
            {myInvitations.length === 0 ? (
              <div className="text-center py-8">
                <Calendar size={48} className="text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400 text-sm mb-4">Keine Besichtigungseinladungen vorhanden</p>
                <p className="text-gray-500 text-xs">Sie erhalten Einladungen wenn Bauträger Sie zu Besichtigungen einladen</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myInvitations.map((invitation) => (
                  <ServiceProviderInvitationCard
                    key={invitation.id}
                    invitation={invitation}
                    onUpdate={loadMyInvitations}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Bauträger-Ansicht (bestehend)
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Besichtigungs-Management</h2>
          <p className="text-gray-400 mt-1">Verwalten Sie Vor-Ort-Besichtigungen für Ihre Gewerke</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-300">
            {inspectionTrades.length} Gewerke mit Besichtigungsoption
          </div>
        </div>
      </div>

      {/* Besichtigungs-pflichtige Gewerke */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white flex items-center gap-3">
            <Eye size={20} className="text-[#ffbd59]" />
            Gewerke mit Besichtigungsoption ({inspectionTrades.length})
          </h3>
        </div>
        
        <div className="p-6">
          {inspectionTrades.length === 0 ? (
            <div className="text-center py-8">
              <Eye size={48} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400 text-sm mb-4">Keine Gewerke mit Besichtigungsoption vorhanden</p>
              <p className="text-gray-500 text-xs">Aktivieren Sie die Besichtigungsoption beim Erstellen von Gewerken</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inspectionTrades.map((trade) => {
                const tradeInspections = inspections.filter(i => i.id === trade.id);
                const hasInspection = tradeInspections.length > 0;
                
                return (
                  <div
                    key={trade.id}
                    className="bg-white/10 rounded-lg p-4 border border-white/10 hover:bg-white/20 transition-all duration-300"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="text-white font-medium text-sm mb-2">{trade.title}</h4>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-500/20 text-gray-300 border border-gray-500/30">
                            {trade.category}
                          </span>
                          <span className="text-xs px-2 py-1 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
                            🔍 Besichtigung
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 space-y-1">
                          <div>Budget: €{trade.budget?.toLocaleString('de-DE') || '0'}</div>
                          <div>Projekt: {trade.project_name}</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-4">
                      {!hasInspection ? (
                        <button
                          onClick={() => handleCreateInspection(trade)}
                          className="flex-1 px-3 py-2 bg-[#ffbd59] text-[#2c3539] rounded-lg text-xs font-medium hover:bg-[#ffa726] transition-colors flex items-center justify-center gap-1"
                        >
                          <Plus size={14} />
                          Besichtigung planen
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => handleInviteServiceProviders(trade)}
                            className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg text-xs font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-1"
                          >
                            <Send size={14} />
                            Einladen
                          </button>
                          <button className="px-3 py-2 bg-white/10 text-white rounded-lg text-xs font-medium hover:bg-white/20 transition-colors">
                            <Eye size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Geplante Besichtigungen */}
      <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white flex items-center gap-3">
            <Calendar size={20} className="text-[#ffbd59]" />
            Geplante Besichtigungen ({inspections.length})
          </h3>
        </div>
        
        <div className="p-6">
          {inspections.length === 0 ? (
            <div className="text-center py-8">
              <Calendar size={48} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400 text-sm mb-4">Keine Besichtigungen geplant</p>
              <p className="text-gray-500 text-xs">Erstellen Sie Besichtigungstermine für Ihre Gewerke</p>
            </div>
          ) : (
            <div className="space-y-4">
              {inspections.map((inspection) => (
                <InspectionCard
                  key={inspection.id}
                  inspection={inspection}
                  onStatusUpdate={loadInspections}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Inspection Modal */}
      {showCreateModal && selectedTrade && (
        <CreateInspectionModal
          trade={selectedTrade}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadInspections();
          }}
        />
      )}

      {/* Invite Service Providers Modal */}
      {showInviteModal && selectedTrade && (
        <InviteServiceProvidersModal
          trade={selectedTrade}
          availableQuotes={availableQuotes}
          onClose={() => setShowInviteModal(false)}
          onSuccess={() => {
            setShowInviteModal(false);
            loadInspections();
          }}
        />
      )}
    </div>
  );
}

// Neue InspectionCard Komponente
function InspectionCard({ inspection, onStatusUpdate }: {
  inspection: Inspection;
  onStatusUpdate: () => void;
}) {
  const [showQuoteRevisions, setShowQuoteRevisions] = useState(false);
  const [quoteRevisions, setQuoteRevisions] = useState<any[]>([]);
  const [isLoadingRevisions, setIsLoadingRevisions] = useState(false);

  const loadQuoteRevisions = async () => {
    if (showQuoteRevisions) {
      setShowQuoteRevisions(false);
      return;
    }

    setIsLoadingRevisions(true);
    try {
      const response = await fetch(`/api/v1/inspections/${inspection.id}/quote-revisions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const revisions = await response.json();
        setQuoteRevisions(revisions);
        setShowQuoteRevisions(true);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Quote-Revisionen:', error);
    } finally {
      setIsLoadingRevisions(false);
    }
  };

  const handleCompleteInspection = async () => {
    try {
      const response = await fetch(`/api/v1/inspections/${inspection.id}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        onStatusUpdate();
      }
    } catch (error) {
      console.error('Fehler beim Abschließen der Besichtigung:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'invited': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'confirmed': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'completed': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'planned': return 'Geplant';
      case 'invited': return 'Eingeladen';
      case 'confirmed': return 'Bestätigt';
      case 'completed': return 'Abgeschlossen';
      case 'cancelled': return 'Abgebrochen';
      default: return status;
    }
  };

  const getInvitationStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle size={16} className="text-green-400" />;
      case 'declined': return <XCircle size={16} className="text-red-400" />;
      case 'sent': return <Clock size={16} className="text-yellow-400" />;
      default: return <AlertTriangle size={16} className="text-gray-400" />;
    }
  };

  return (
    <div className="bg-white/10 rounded-lg p-4 border border-white/10">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h4 className="text-white font-medium">{inspection.title}</h4>
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(inspection.status)}`}>
              {getStatusLabel(inspection.status)}
            </span>
          </div>
          <p className="text-gray-400 text-sm mb-3">{inspection.description}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-300">
              <Calendar size={14} />
              <span>{new Date(inspection.scheduled_date).toLocaleDateString('de-DE')}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <Clock size={14} />
              <span>{inspection.scheduled_time_start} - {inspection.scheduled_time_end}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <MapPin size={14} />
              <span>{inspection.location_address || 'Projektadresse'}</span>
            </div>
          </div>

          {inspection.contact_person && (
            <div className="mt-3 flex items-center gap-4 text-sm text-gray-300">
              <div className="flex items-center gap-2">
                <User size={14} />
                <span>{inspection.contact_person}</span>
              </div>
              {inspection.contact_phone && (
                <div className="flex items-center gap-2">
                  <Phone size={14} />
                  <span>{inspection.contact_phone}</span>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {inspection.status === 'confirmed' && (
            <button
              onClick={handleCompleteInspection}
              className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600 transition-colors"
            >
              Abschließen
            </button>
          )}
          
          <button
            onClick={loadQuoteRevisions}
            disabled={isLoadingRevisions}
            className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
          >
            {isLoadingRevisions ? (
              <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
            ) : (
              <FileText size={12} />
            )}
            Revisionen ({quoteRevisions.length})
          </button>
        </div>
      </div>

      {/* Einladungen */}
      {inspection.invitations && inspection.invitations.length > 0 && (
        <div className="border-t border-white/10 pt-4 mb-4">
          <h5 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <Users size={14} />
            Eingeladene Dienstleister ({inspection.invitations.length})
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {inspection.invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="bg-white/5 rounded-lg p-3 border border-white/5"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">
                    {invitation.company_name}
                  </span>
                  {getInvitationStatusIcon(invitation.status)}
                </div>
                <div className="text-xs text-gray-400">
                  Status: {invitation.status === 'confirmed' ? 'Bestätigt' : 
                          invitation.status === 'declined' ? 'Abgelehnt' : 
                          invitation.status === 'sent' ? 'Einladung versendet' : 'Unbekannt'}
                </div>
                {invitation.response_message && (
                  <div className="mt-2 text-xs text-gray-300 bg-white/5 rounded p-2">
                    "{invitation.response_message}"
                  </div>
                )}
                {invitation.responded_at && (
                  <div className="text-xs text-gray-500 mt-1">
                    Antwort: {new Date(invitation.responded_at).toLocaleDateString('de-DE')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quote-Revisionen */}
      {showQuoteRevisions && (
        <div className="border-t border-white/10 pt-4">
          <h5 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <Edit3 size={14} />
            Überarbeitete Angebote ({quoteRevisions.length})
          </h5>
          
          {quoteRevisions.length === 0 ? (
            <div className="text-center py-6">
              <FileText size={32} className="text-gray-400 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">Noch keine überarbeiteten Angebote eingegangen</p>
            </div>
          ) : (
            <div className="space-y-3">
              {quoteRevisions.map((revision) => (
                <QuoteRevisionCard
                  key={revision.id}
                  revision={revision}
                  onStatusUpdate={onStatusUpdate}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Quote-Revision Karte
function QuoteRevisionCard({ revision, onStatusUpdate }: {
  revision: any;
  onStatusUpdate: () => void;
}) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      const response = await fetch(`/api/v1/inspections/quote-revisions/${revision.id}/confirm`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        onStatusUpdate();
      }
    } catch (error) {
      console.error('Fehler beim Bestätigen der Quote-Revision:', error);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleReject = async () => {
    setIsRejecting(true);
    try {
      const response = await fetch(`/api/v1/inspections/quote-revisions/${revision.id}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        onStatusUpdate();
      }
    } catch (error) {
      console.error('Fehler beim Ablehnen der Quote-Revision:', error);
    } finally {
      setIsRejecting(false);
    }
  };

  const getRevisionStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'accepted': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'rejected': return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getRevisionStatusLabel = (status: string) => {
    switch (status) {
      case 'submitted': return 'Eingereicht';
      case 'accepted': return 'Angenommen';
      case 'rejected': return 'Abgelehnt';
      default: return status;
    }
  };

  return (
    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h6 className="text-white font-medium">{revision.service_provider?.company_name || 'Unbekannt'}</h6>
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRevisionStatusColor(revision.status)}`}>
              {getRevisionStatusLabel(revision.status)}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm mb-3">
            <div>
              <span className="text-gray-400">Neue Summe:</span>
              <div className="text-[#ffbd59] font-bold">
                €{revision.total_amount?.toLocaleString('de-DE') || '0'}
              </div>
            </div>
            <div>
              <span className="text-gray-400">Änderung:</span>
              <div className={`font-medium ${
                revision.amount_difference > 0 ? 'text-red-400' : revision.amount_difference < 0 ? 'text-green-400' : 'text-gray-400'
              }`}>
                {revision.amount_difference > 0 ? '+' : ''}
                €{revision.amount_difference?.toLocaleString('de-DE') || '0'}
                {revision.amount_difference_percentage && (
                  <span className="text-xs ml-1">
                    ({revision.amount_difference_percentage > 0 ? '+' : ''}{revision.amount_difference_percentage.toFixed(1)}%)
                  </span>
                )}
              </div>
            </div>
          </div>

          {revision.revision_reason && (
            <div className="mb-3">
              <span className="text-gray-400 text-sm">Grund der Überarbeitung:</span>
              <p className="text-gray-300 text-sm mt-1">{revision.revision_reason}</p>
            </div>
          )}

          <div className="text-xs text-gray-500">
            Eingereicht: {new Date(revision.created_at).toLocaleDateString('de-DE')}
          </div>
        </div>

        {revision.status === 'submitted' && (
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={handleReject}
              disabled={isRejecting}
              className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {isRejecting ? 'Ablehnen...' : 'Ablehnen'}
            </button>
            <button
              onClick={handleConfirm}
              disabled={isConfirming}
              className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              {isConfirming ? 'Bestätige...' : 'Bestätigen & Beauftragen'}
            </button>
          </div>
        )}

        {revision.status === 'accepted' && (
          <div className="ml-4">
            <div className="px-3 py-1.5 bg-green-500/20 text-green-300 rounded-lg text-xs font-medium border border-green-500/30">
              ✓ Beauftragt
            </div>
          </div>
        )}

        {revision.status === 'rejected' && (
          <div className="ml-4">
            <div className="px-3 py-1.5 bg-red-500/20 text-red-300 rounded-lg text-xs font-medium border border-red-500/30">
              ✗ Abgelehnt
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Placeholder für Create Inspection Modal
function CreateInspectionModal({ trade, onClose, onSuccess }: {
  trade: Trade;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    title: `Besichtigung: ${trade.title}`,
    description: `Vor-Ort-Besichtigung für ${trade.title}`,
    scheduled_date: '',
    scheduled_time_start: '14:00',
    scheduled_time_end: '16:00',
    duration_minutes: 120,
    location_address: '',
    location_notes: '',
    contact_person: '',
    contact_phone: '',
    preparation_notes: 'Bitte bringen Sie alle relevanten Unterlagen und Werkzeuge zur Besichtigung mit.'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/v1/inspections/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          milestone_id: trade.id,
          ...formData
        })
      });

      if (response.ok) {
        onSuccess();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Fehler beim Erstellen der Besichtigung');
      }
    } catch (error) {
      console.error('Fehler beim Erstellen der Besichtigung:', error);
      setError('Netzwerkfehler beim Erstellen der Besichtigung');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'duration_minutes' ? parseInt(value) || 120 : value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#2c3539] rounded-2xl shadow-2xl border border-white/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-white/10">
          <h3 className="text-xl font-semibold text-white">Besichtigung planen</h3>
          <p className="text-gray-400 mt-1">Gewerk: {trade.title}</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Titel *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 bg-white/10 text-white rounded-lg border border-white/20 focus:outline-none focus:border-[#ffbd59]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Datum *
              </label>
              <input
                type="date"
                name="scheduled_date"
                value={formData.scheduled_date}
                onChange={handleInputChange}
                required
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 bg-white/10 text-white rounded-lg border border-white/20 focus:outline-none focus:border-[#ffbd59]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Startzeit
              </label>
              <input
                type="time"
                name="scheduled_time_start"
                value={formData.scheduled_time_start}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-white/10 text-white rounded-lg border border-white/20 focus:outline-none focus:border-[#ffbd59]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Endzeit
              </label>
              <input
                type="time"
                name="scheduled_time_end"
                value={formData.scheduled_time_end}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-white/10 text-white rounded-lg border border-white/20 focus:outline-none focus:border-[#ffbd59]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Dauer (Min.)
              </label>
              <input
                type="number"
                name="duration_minutes"
                value={formData.duration_minutes}
                onChange={handleInputChange}
                min="30"
                max="480"
                className="w-full px-3 py-2 bg-white/10 text-white rounded-lg border border-white/20 focus:outline-none focus:border-[#ffbd59]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Beschreibung
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 bg-white/10 text-white rounded-lg border border-white/20 focus:outline-none focus:border-[#ffbd59] resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Adresse (falls abweichend vom Projekt)
            </label>
            <input
              type="text"
              name="location_address"
              value={formData.location_address}
              onChange={handleInputChange}
              placeholder="z.B. Musterstraße 123, 10115 Berlin"
              className="w-full px-3 py-2 bg-white/10 text-white rounded-lg border border-white/20 focus:outline-none focus:border-[#ffbd59] placeholder-white/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Zusätzliche Ortsangaben
            </label>
            <textarea
              name="location_notes"
              value={formData.location_notes}
              onChange={handleInputChange}
              rows={2}
              placeholder="z.B. Eingang über Hinterhof, 2. Stock links"
              className="w-full px-3 py-2 bg-white/10 text-white rounded-lg border border-white/20 focus:outline-none focus:border-[#ffbd59] resize-none placeholder-white/50"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Ansprechpartner
              </label>
              <input
                type="text"
                name="contact_person"
                value={formData.contact_person}
                onChange={handleInputChange}
                placeholder="Name des Ansprechpartners"
                className="w-full px-3 py-2 bg-white/10 text-white rounded-lg border border-white/20 focus:outline-none focus:border-[#ffbd59] placeholder-white/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Telefonnummer
              </label>
              <input
                type="tel"
                name="contact_phone"
                value={formData.contact_phone}
                onChange={handleInputChange}
                placeholder="+49 123 456789"
                className="w-full px-3 py-2 bg-white/10 text-white rounded-lg border border-white/20 focus:outline-none focus:border-[#ffbd59] placeholder-white/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Vorbereitungshinweise für Dienstleister
            </label>
            <textarea
              name="preparation_notes"
              value={formData.preparation_notes}
              onChange={handleInputChange}
              rows={3}
              placeholder="Was sollen die Dienstleister mitbringen oder vorbereiten?"
              className="w-full px-3 py-2 bg-white/10 text-white rounded-lg border border-white/20 focus:outline-none focus:border-[#ffbd59] resize-none placeholder-white/50"
            />
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-[#ffbd59] text-[#2c3539] rounded-lg font-medium hover:bg-[#ffa726] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b border-[#2c3539]"></div>
                  Erstelle...
                </>
              ) : (
                'Besichtigung erstellen'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Placeholder für Invite Service Providers Modal
function InviteServiceProvidersModal({ trade, availableQuotes, onClose, onSuccess }: {
  trade: Trade;
  availableQuotes: Quote[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [selectedQuoteIds, setSelectedQuoteIds] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [inspectionId, setInspectionId] = useState<number | null>(null);

  // Lade die Besichtigung für dieses Gewerk
  useEffect(() => {
    const fetchInspection = async () => {
      try {
        const response = await fetch(`/api/v1/inspections/?milestone_id=${trade.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const inspections = await response.json();
          if (inspections.length > 0) {
            setInspectionId(inspections[0].id);
          }
        }
      } catch (error) {
        console.error('Fehler beim Laden der Besichtigung:', error);
      }
    };

    fetchInspection();
  }, [trade.id]);

  const handleQuoteSelection = (quoteId: number) => {
    setSelectedQuoteIds(prev => 
      prev.includes(quoteId) 
        ? prev.filter(id => id !== quoteId)
        : [...prev, quoteId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedQuoteIds.length === 0) {
      setError('Bitte wählen Sie mindestens einen Dienstleister aus');
      return;
    }

    if (!inspectionId) {
      setError('Keine Besichtigung gefunden. Bitte erstellen Sie zuerst eine Besichtigung.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/v1/inspections/${inspectionId}/invitations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(selectedQuoteIds)
      });

      if (response.ok) {
        onSuccess();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Fehler beim Versenden der Einladungen');
      }
    } catch (error) {
      console.error('Fehler beim Versenden der Einladungen:', error);
      setError('Netzwerkfehler beim Versenden der Einladungen');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#2c3539] rounded-2xl shadow-2xl border border-white/20 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-white/10">
          <h3 className="text-xl font-semibold text-white">Dienstleister zur Besichtigung einladen</h3>
          <p className="text-gray-400 mt-1">Gewerk: {trade.title}</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          <div className="mb-4">
            <h4 className="text-white font-medium mb-3">
              Verfügbare Angebote ({availableQuotes.length})
            </h4>
            <p className="text-gray-400 text-sm mb-4">
              Wählen Sie die Dienstleister aus, die Sie zur Besichtigung einladen möchten:
            </p>
          </div>

          {availableQuotes.length === 0 ? (
            <div className="text-center py-8">
              <Users size={48} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400 text-sm mb-4">Keine Angebote verfügbar</p>
              <p className="text-gray-500 text-xs">
                Es liegen noch keine Angebote für dieses Gewerk vor.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {availableQuotes.map((quote) => (
                <div 
                  key={quote.id} 
                  className={`bg-white/5 rounded-lg p-4 border transition-all duration-200 cursor-pointer ${
                    selectedQuoteIds.includes(quote.id)
                      ? 'border-[#ffbd59] bg-[#ffbd59]/10'
                      : 'border-white/10 hover:bg-white/10'
                  }`}
                  onClick={() => handleQuoteSelection(quote.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <input
                          type="checkbox"
                          checked={selectedQuoteIds.includes(quote.id)}
                          onChange={() => handleQuoteSelection(quote.id)}
                          className="rounded border-white/20 bg-white/10 text-[#ffbd59] focus:ring-[#ffbd59] focus:ring-offset-0"
                        />
                        <div>
                          <div className="text-white font-medium">{quote.company_name}</div>
                          <div className="text-sm text-gray-400">{quote.contact_person}</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Angebotssumme:</span>
                          <div className="text-[#ffbd59] font-bold">
                            €{quote.total_amount.toLocaleString('de-DE')}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-400">Eingereicht:</span>
                          <div className="text-white">
                            {new Date(quote.created_at).toLocaleDateString('de-DE')}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-2 text-xs">
                        <span className="px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          {quote.status === 'submitted' ? 'Eingereicht' : quote.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {availableQuotes.length > 0 && (
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="text-blue-300 text-sm">
                <strong>{selectedQuoteIds.length}</strong> von <strong>{availableQuotes.length}</strong> Dienstleistern ausgewählt
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={isSubmitting || selectedQuoteIds.length === 0 || !inspectionId}
              className="flex-1 px-4 py-2 bg-[#ffbd59] text-[#2c3539] rounded-lg font-medium hover:bg-[#ffa726] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b border-[#2c3539]"></div>
                  Versende...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Einladungen versenden ({selectedQuoteIds.length})
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 

// Dienstleister Einladungs-Karte
function ServiceProviderInvitationCard({ invitation, onUpdate }: {
  invitation: any;
  onUpdate: () => void;
}) {
  const [showRevisionForm, setShowRevisionForm] = useState(false);
  const [isResponding, setIsResponding] = useState(false);

  const handleRespond = async (status: string, message?: string) => {
    setIsResponding(true);
    try {
      const response = await fetch(`/api/v1/inspections/invitations/${invitation.id}/respond`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status,
          response_message: message
        })
      });

      if (response.ok) {
        onUpdate();
      }
    } catch (error) {
      console.error('Fehler beim Antworten auf Einladung:', error);
    } finally {
      setIsResponding(false);
    }
  };

  const getInvitationStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'declined': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'sent': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getInvitationStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Bestätigt';
      case 'declined': return 'Abgelehnt';
      case 'sent': return 'Einladung erhalten';
      default: return status;
    }
  };

  return (
    <div className="bg-white/10 rounded-lg p-4 border border-white/10">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h4 className="text-white font-medium">{invitation.inspection?.title || 'Besichtigung'}</h4>
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getInvitationStatusColor(invitation.status)}`}>
              {getInvitationStatusLabel(invitation.status)}
            </span>
          </div>
          
          <p className="text-gray-400 text-sm mb-3">{invitation.inspection?.description}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-3">
            <div className="flex items-center gap-2 text-gray-300">
              <Calendar size={14} />
              <span>{new Date(invitation.inspection?.scheduled_date).toLocaleDateString('de-DE')}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <Clock size={14} />
              <span>{invitation.inspection?.scheduled_time_start} - {invitation.inspection?.scheduled_time_end}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <MapPin size={14} />
              <span>{invitation.inspection?.location_address || 'Projektadresse'}</span>
            </div>
          </div>

          {invitation.inspection?.contact_person && (
            <div className="flex items-center gap-4 text-sm text-gray-300 mb-3">
              <div className="flex items-center gap-2">
                <User size={14} />
                <span>{invitation.inspection.contact_person}</span>
              </div>
              {invitation.inspection.contact_phone && (
                <div className="flex items-center gap-2">
                  <Phone size={14} />
                  <span>{invitation.inspection.contact_phone}</span>
                </div>
              )}
            </div>
          )}

          {invitation.inspection?.preparation_notes && (
            <div className="mb-3">
              <span className="text-gray-400 text-sm">Vorbereitungshinweise:</span>
              <p className="text-gray-300 text-sm mt-1">{invitation.inspection.preparation_notes}</p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 ml-4">
          {invitation.status === 'sent' && (
            <>
              <button
                onClick={() => handleRespond('declined')}
                disabled={isResponding}
                className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                Ablehnen
              </button>
              <button
                onClick={() => handleRespond('confirmed')}
                disabled={isResponding}
                className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                Zusagen
              </button>
            </>
          )}

          {invitation.status === 'confirmed' && invitation.inspection?.status === 'completed' && (
            <button
              onClick={() => setShowRevisionForm(true)}
              className="px-3 py-1.5 bg-[#ffbd59] text-[#2c3539] rounded-lg text-xs font-medium hover:bg-[#ffa726] transition-colors flex items-center gap-1"
            >
              <Edit3 size={12} />
              Angebot überarbeiten
            </button>
          )}
        </div>
      </div>

      {/* Quote-Revision Form */}
      {showRevisionForm && (
        <QuoteRevisionForm
          invitation={invitation}
          onClose={() => setShowRevisionForm(false)}
          onSuccess={() => {
            setShowRevisionForm(false);
            onUpdate();
          }}
        />
      )}
    </div>
  );
}

// Quote-Revision Formular für Dienstleister
function QuoteRevisionForm({ invitation, onClose, onSuccess }: {
  invitation: any;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    title: `Überarbeitetes Angebot nach Besichtigung`,
    description: '',
    revision_reason: '',
    total_amount: invitation.quote?.total_amount || 0,
    currency: 'EUR',
    valid_until: '',
    labor_cost: invitation.quote?.labor_cost || 0,
    material_cost: invitation.quote?.material_cost || 0,
    overhead_cost: invitation.quote?.overhead_cost || 0,
    estimated_duration: invitation.quote?.estimated_duration || 0,
    start_date: '',
    completion_date: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/v1/inspections/${invitation.inspection_id}/quote-revisions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          original_quote_id: invitation.quote_id,
          ...formData
        })
      });

      if (response.ok) {
        onSuccess();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Fehler beim Erstellen der Quote-Revision');
      }
    } catch (error) {
      console.error('Fehler beim Erstellen der Quote-Revision:', error);
      setError('Netzwerkfehler beim Erstellen der Quote-Revision');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['total_amount', 'labor_cost', 'material_cost', 'overhead_cost'].includes(name) 
        ? parseFloat(value) || 0 
        : name === 'estimated_duration' 
        ? parseInt(value) || 0 
        : value
    }));
  };

  const calculateDifference = () => {
    const originalAmount = invitation.quote?.total_amount || 0;
    const newAmount = formData.total_amount;
    const difference = newAmount - originalAmount;
    const percentage = originalAmount > 0 ? (difference / originalAmount) * 100 : 0;
    return { difference, percentage };
  };

  const { difference, percentage } = calculateDifference();

  return (
    <div className="border-t border-white/10 pt-4 mt-4">
      <h5 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
        <Edit3 size={14} />
        Angebot nach Besichtigung überarbeiten
      </h5>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Titel
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-white/10 text-white rounded-lg border border-white/20 focus:outline-none focus:border-[#ffbd59] text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Gültig bis
            </label>
            <input
              type="date"
              name="valid_until"
              value={formData.valid_until}
              onChange={handleInputChange}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 bg-white/10 text-white rounded-lg border border-white/20 focus:outline-none focus:border-[#ffbd59] text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Grund der Überarbeitung *
          </label>
          <textarea
            name="revision_reason"
            value={formData.revision_reason}
            onChange={handleInputChange}
            required
            rows={2}
            placeholder="Warum wurde das Angebot überarbeitet? (z.B. zusätzliche Arbeiten erkannt, Materialänderungen, etc.)"
            className="w-full px-3 py-2 bg-white/10 text-white rounded-lg border border-white/20 focus:outline-none focus:border-[#ffbd59] resize-none text-sm placeholder-white/50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Beschreibung der Änderungen
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={3}
            placeholder="Detaillierte Beschreibung der Änderungen..."
            className="w-full px-3 py-2 bg-white/10 text-white rounded-lg border border-white/20 focus:outline-none focus:border-[#ffbd59] resize-none text-sm placeholder-white/50"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Neue Gesamtsumme * (€)
            </label>
            <input
              type="number"
              name="total_amount"
              value={formData.total_amount}
              onChange={handleInputChange}
              required
              min="0"
              step="0.01"
              className="w-full px-3 py-2 bg-white/10 text-white rounded-lg border border-white/20 focus:outline-none focus:border-[#ffbd59] text-sm"
            />
            <div className="mt-1 text-xs">
              <span className="text-gray-400">Original: €{invitation.quote?.total_amount?.toLocaleString('de-DE') || '0'}</span>
              <span className={`ml-2 font-medium ${
                difference > 0 ? 'text-red-400' : difference < 0 ? 'text-green-400' : 'text-gray-400'
              }`}>
                Änderung: {difference > 0 ? '+' : ''}€{difference.toLocaleString('de-DE')} ({percentage > 0 ? '+' : ''}{percentage.toFixed(1)}%)
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Geschätzte Dauer (Tage)
            </label>
            <input
              type="number"
              name="estimated_duration"
              value={formData.estimated_duration}
              onChange={handleInputChange}
              min="1"
              className="w-full px-3 py-2 bg-white/10 text-white rounded-lg border border-white/20 focus:outline-none focus:border-[#ffbd59] text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Arbeitskosten (€)
            </label>
            <input
              type="number"
              name="labor_cost"
              value={formData.labor_cost}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              className="w-full px-3 py-2 bg-white/10 text-white rounded-lg border border-white/20 focus:outline-none focus:border-[#ffbd59] text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Materialkosten (€)
            </label>
            <input
              type="number"
              name="material_cost"
              value={formData.material_cost}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              className="w-full px-3 py-2 bg-white/10 text-white rounded-lg border border-white/20 focus:outline-none focus:border-[#ffbd59] text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Gemeinkosten (€)
            </label>
            <input
              type="number"
              name="overhead_cost"
              value={formData.overhead_cost}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              className="w-full px-3 py-2 bg-white/10 text-white rounded-lg border border-white/20 focus:outline-none focus:border-[#ffbd59] text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Startdatum
            </label>
            <input
              type="date"
              name="start_date"
              value={formData.start_date}
              onChange={handleInputChange}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 bg-white/10 text-white rounded-lg border border-white/20 focus:outline-none focus:border-[#ffbd59] text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Fertigstellungsdatum
            </label>
            <input
              type="date"
              name="completion_date"
              value={formData.completion_date}
              onChange={handleInputChange}
              min={formData.start_date || new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 bg-white/10 text-white rounded-lg border border-white/20 focus:outline-none focus:border-[#ffbd59] text-sm"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors disabled:opacity-50 text-sm"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 bg-[#ffbd59] text-[#2c3539] rounded-lg font-medium hover:bg-[#ffa726] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b border-[#2c3539]"></div>
                Speichere...
              </>
            ) : (
              'Überarbeitetes Angebot einreichen'
            )}
          </button>
        </div>
      </form>
    </div>
  );
} 