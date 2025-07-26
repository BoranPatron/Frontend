import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Users,
  MessageSquare,
  FileText,
  ArrowRight,
  RefreshCw,
  Bell,
  XCircle,
  User,
  Phone,
  MapPin
} from 'lucide-react';
import { getInspections, getQuoteRevisions, type InspectionRead, type QuoteRevisionRead } from '../api/inspectionService';

interface InspectionStatusTrackerProps {
  tradeId: number;
  onInspectionClick?: (inspection: InspectionRead) => void;
  onRevisionClick?: (revision: QuoteRevisionRead) => void;
}

export default function InspectionStatusTracker({
  tradeId,
  onInspectionClick,
  onRevisionClick
}: InspectionStatusTrackerProps) {
  const [inspections, setInspections] = useState<InspectionRead[]>([]);
  const [revisions, setRevisions] = useState<{ [inspectionId: number]: QuoteRevisionRead[] }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadInspectionData();
  }, [tradeId]);

  const loadInspectionData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Lade Besichtigungen für dieses Gewerk
      const inspectionData = await getInspections(tradeId);
      setInspections(inspectionData);
      
      // Lade Revisionen für jede Besichtigung
      const revisionData: { [inspectionId: number]: QuoteRevisionRead[] } = {};
      for (const inspection of inspectionData) {
        try {
          const inspectionRevisions = await getQuoteRevisions(inspection.id);
          revisionData[inspection.id] = inspectionRevisions;
        } catch (err) {
          console.warn(`Fehler beim Laden der Revisionen für Besichtigung ${inspection.id}:`, err);
          revisionData[inspection.id] = [];
        }
      }
      setRevisions(revisionData);
      
    } catch (err: any) {
      console.error('❌ Fehler beim Laden der Besichtigungsdaten:', err);
      setError('Fehler beim Laden der Besichtigungsdaten');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return <Calendar size={16} className="text-blue-400" />;
      case 'in_progress': return <Eye size={16} className="text-yellow-400" />;
      case 'completed': return <CheckCircle size={16} className="text-green-400" />;
      case 'cancelled': return <XCircle size={16} className="text-red-400" />;
      default: return <AlertCircle size={16} className="text-gray-400" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Geplant';
      case 'in_progress': return 'Läuft';
      case 'completed': return 'Abgeschlossen';
      case 'cancelled': return 'Abgebrochen';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'in_progress': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'completed': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-300 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getRevisionStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <FileText size={14} className="text-gray-400" />;
      case 'submitted': return <ArrowRight size={14} className="text-blue-400" />;
      case 'confirmed': return <CheckCircle size={14} className="text-green-400" />;
      case 'rejected': return <XCircle size={14} className="text-red-400" />;
      default: return <AlertCircle size={14} className="text-gray-400" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return timeString ? timeString.substring(0, 5) : '';
  };

  const isUpcoming = (inspection: InspectionRead) => {
    const inspectionDate = new Date(inspection.scheduled_date);
    const now = new Date();
    const diffDays = Math.ceil((inspectionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7; // Nächste 7 Tage
  };

  const needsAttention = (inspection: InspectionRead) => {
    const inspectionRevisions = revisions[inspection.id] || [];
    const hasSubmittedRevisions = inspectionRevisions.some(r => r.status === 'submitted');
    return inspection.status === 'completed' && hasSubmittedRevisions;
  };

  if (loading) {
    return (
      <div className="bg-[#2a2a2a] rounded-lg p-4 border border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <RefreshCw size={16} className="text-[#ffbd59] animate-spin" />
          <span className="text-white font-medium">Lade Besichtigungen...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#2a2a2a] rounded-lg p-4 border border-red-500/30">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle size={16} className="text-red-400" />
          <span className="text-red-300 font-medium">Fehler</span>
        </div>
        <p className="text-gray-400 text-sm">{error}</p>
        <button
          onClick={loadInspectionData}
          className="mt-2 text-[#ffbd59] hover:text-[#ffa726] text-sm underline"
        >
          Erneut versuchen
        </button>
      </div>
    );
  }

  if (inspections.length === 0) {
    return (
      <div className="bg-[#2a2a2a] rounded-lg p-4 border border-gray-700">
        <div className="flex items-center gap-2 mb-2">
          <Eye size={16} className="text-gray-400" />
          <span className="text-gray-300 font-medium">Keine Besichtigungen</span>
        </div>
        <p className="text-gray-400 text-sm">Für dieses Gewerk wurden noch keine Besichtigungen erstellt.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Wiedervorlage-Bereich */}
      {inspections.some(i => needsAttention(i) || isUpcoming(i)) && (
        <div className="bg-gradient-to-r from-[#ffbd59]/10 to-[#ffa726]/10 border border-[#ffbd59]/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Bell size={16} className="text-[#ffbd59]" />
            <span className="text-[#ffbd59] font-medium">Wiedervorlage</span>
          </div>
          
          {inspections.filter(i => needsAttention(i)).map(inspection => (
            <div key={`attention-${inspection.id}`} className="mb-2 last:mb-0">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle size={14} className="text-green-400" />
                <span className="text-white">Besichtigung abgeschlossen</span>
                <span className="text-gray-400">•</span>
                <span className="text-[#ffbd59]">Neue Angebote verfügbar</span>
              </div>
              <p className="text-gray-400 text-xs ml-4">
                {inspection.title} - {formatDate(inspection.scheduled_date)}
              </p>
            </div>
          ))}
          
          {inspections.filter(i => isUpcoming(i)).map(inspection => (
            <div key={`upcoming-${inspection.id}`} className="mb-2 last:mb-0">
              <div className="flex items-center gap-2 text-sm">
                <Calendar size={14} className="text-blue-400" />
                <span className="text-white">Anstehende Besichtigung</span>
                <span className="text-gray-400">•</span>
                <span className="text-blue-400">{formatDate(inspection.scheduled_date)}</span>
              </div>
              <p className="text-gray-400 text-xs ml-4">
                {inspection.title} um {formatTime(inspection.scheduled_time_start || '')}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Besichtigungsliste */}
      <div className="bg-[#2a2a2a] rounded-lg border border-gray-700">
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Eye size={16} className="text-[#ffbd59]" />
            <span className="text-white font-medium">Besichtigungen ({inspections.length})</span>
            <button
              onClick={loadInspectionData}
              className="ml-auto text-gray-400 hover:text-white transition-colors"
              title="Aktualisieren"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
        
        <div className="divide-y divide-gray-700">
          {inspections.map(inspection => {
            const inspectionRevisions = revisions[inspection.id] || [];
            const hasRevisions = inspectionRevisions.length > 0;
            const needsAction = needsAttention(inspection);
            
            return (
              <div 
                key={inspection.id} 
                className={`p-4 hover:bg-[#333] transition-colors cursor-pointer ${
                  needsAction ? 'bg-gradient-to-r from-[#ffbd59]/5 to-transparent' : ''
                }`}
                onClick={() => onInspectionClick?.(inspection)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusIcon(inspection.status)}
                      <span className="text-white font-medium">{inspection.title}</span>
                      <span className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(inspection.status)}`}>
                        {getStatusLabel(inspection.status)}
                      </span>
                      {needsAction && (
                        <span className="px-2 py-1 rounded-full text-xs bg-[#ffbd59]/20 text-[#ffbd59] border border-[#ffbd59]/30">
                          Aktion erforderlich
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-400 mb-2">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        <span>{formatDate(inspection.scheduled_date)}</span>
                      </div>
                      {inspection.scheduled_time_start && (
                        <div className="flex items-center gap-1">
                          <Clock size={12} />
                          <span>{formatTime(inspection.scheduled_time_start)}</span>
                          {inspection.scheduled_time_end && (
                            <span>- {formatTime(inspection.scheduled_time_end)}</span>
                          )}
                        </div>
                      )}
                      {inspection.contact_person && (
                        <div className="flex items-center gap-1">
                          <User size={12} />
                          <span>{inspection.contact_person}</span>
                        </div>
                      )}
                    </div>
                    
                    {inspection.description && (
                      <p className="text-gray-400 text-sm mb-2">{inspection.description}</p>
                    )}
                    
                    {inspection.location_address && (
                      <div className="flex items-center gap-1 text-sm text-gray-400 mb-2">
                        <MapPin size={12} />
                        <span>{inspection.location_address}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Revisionen */}
                {hasRevisions && (
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText size={14} className="text-[#ffbd59]" />
                      <span className="text-white text-sm font-medium">
                        Überarbeitete Angebote ({inspectionRevisions.length})
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      {inspectionRevisions.map(revision => (
                        <div 
                          key={revision.id}
                          className="flex items-center justify-between p-2 bg-[#333] rounded border border-gray-600 hover:border-gray-500 transition-colors cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRevisionClick?.(revision);
                          }}
                        >
                          <div className="flex items-center gap-2">
                            {getRevisionStatusIcon(revision.status)}
                            <span className="text-white text-sm">{revision.title}</span>
                            <span className="text-gray-400 text-xs">
                              {revision.total_amount.toLocaleString('de-DE', { style: 'currency', currency: revision.currency })}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {revision.status === 'submitted' && (
                              <span className="px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                Wartet auf Entscheidung
                              </span>
                            )}
                            {revision.status === 'confirmed' && (
                              <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-300 border border-green-500/30">
                                Bestätigt
                              </span>
                            )}
                            {revision.status === 'rejected' && (
                              <span className="px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-300 border border-red-500/30">
                                Abgelehnt
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
} 