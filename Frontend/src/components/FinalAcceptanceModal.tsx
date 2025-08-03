import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Calendar, FileText, Star, Download } from 'lucide-react';
import { api } from '../api/api';

interface Defect {
  id: number;
  title: string;
  description: string;
  severity: 'MINOR' | 'MAJOR' | 'CRITICAL';
  location: string;
  room: string;
  photos: string[];
  resolved: boolean;
  resolved_at?: string;
  task_id?: number;
}

interface FinalAcceptanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  acceptanceId: number;
  milestoneId: number;
  milestoneTitle: string;
  defects: Defect[];
  onAcceptanceComplete: () => void;
}

const FinalAcceptanceModal: React.FC<FinalAcceptanceModalProps> = ({
  isOpen,
  onClose,
  acceptanceId,
  milestoneId,
  milestoneTitle,
  defects,
  onAcceptanceComplete
}) => {
  const [checkedDefects, setCheckedDefects] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratings, setRatings] = useState({
    qualityRating: 0,
    timelinessRating: 0,
    overallRating: 0
  });
  const [finalNotes, setFinalNotes] = useState('');

  // Lade den aktuellen Status der Mängel
  useEffect(() => {
    if (isOpen && defects.length > 0) {
      loadDefectStatus();
    }
  }, [isOpen, defects]);

  const loadDefectStatus = async () => {
    try {
      const response = await api.get(`/acceptance/${acceptanceId}/defects`);
      const defectStatuses = response.data;
      
      const resolvedDefectIds = new Set(
        defectStatuses
          .filter((defect: any) => defect.resolved)
          .map((defect: any) => defect.id)
      );
      
      setCheckedDefects(resolvedDefectIds);
    } catch (error) {
      console.error('Fehler beim Laden der Mangel-Status:', error);
    }
  };

  const toggleDefectCheck = (defectId: number) => {
    const newChecked = new Set(checkedDefects);
    if (newChecked.has(defectId)) {
      newChecked.delete(defectId);
    } else {
      newChecked.add(defectId);
    }
    setCheckedDefects(newChecked);
  };

  const allDefectsResolved = defects.length === 0 || defects.every(defect => checkedDefects.has(defect.id));

  const handleFinalAcceptance = async () => {
    if (!allDefectsResolved) {
      setError('Alle Mängel müssen als behoben markiert werden, bevor die finale Abnahme erfolgen kann.');
      return;
    }

    setShowRatingModal(true);
  };

  const submitFinalAcceptance = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Markiere alle Mängel als behoben
      for (const defectId of checkedDefects) {
        await api.put(`/acceptance/defects/${defectId}`, {
          resolved: true,
          resolved_at: new Date().toISOString()
        });
      }

      // Schließe die finale Abnahme ab
      await api.post(`/acceptance/${acceptanceId}/final-complete`, {
        accepted: true,
        qualityRating: ratings.qualityRating,
        timelinessRating: ratings.timelinessRating,
        overallRating: ratings.overallRating,
        finalNotes: finalNotes,
        milestone_id: milestoneId
      });

      console.log('✅ Finale Abnahme erfolgreich abgeschlossen');
      onAcceptanceComplete();
      onClose();
      
    } catch (error: any) {
      console.error('❌ Fehler bei finaler Abnahme:', error);
      setError('Fehler beim Abschließen der finalen Abnahme. Bitte versuchen Sie es erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'text-red-600 bg-red-50 border-red-200';
      case 'MAJOR': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'MINOR': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'Kritisch';
      case 'MAJOR': return 'Erheblich';
      case 'MINOR': return 'Geringfügig';
      default: return severity;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div 
          className="flex items-center justify-between p-6 border-b border-gray-200"
          style={{ backgroundColor: '#51636f0a' }}
        >
          <div className="flex items-center space-x-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: '#51636f' }}
            >
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: '#51636f' }}>
                Finale Abnahme
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
        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Anleitung */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Abnahme-Checkliste</h3>
                <p className="text-blue-700 text-sm">
                  Prüfen Sie alle dokumentierten Mängel und bestätigen Sie deren Behebung. 
                  Erst wenn alle Mängel als behoben markiert sind, kann die finale Abnahme erfolgen.
                </p>
              </div>
            </div>
          </div>

          {/* Mängel-Checkliste */}
          <div>
            <h3 className="text-lg font-semibold mb-4" style={{ color: '#51636f' }}>
              Dokumentierte Mängel ({defects.length})
            </h3>
            
            {defects.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <p className="text-gray-600">Keine Mängel dokumentiert</p>
                <p className="text-sm text-gray-500">Das Gewerk kann ohne Einschränkungen abgenommen werden.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {defects.map((defect) => (
                  <div
                    key={defect.id}
                    className={`border rounded-lg p-4 transition-all duration-200 ${
                      checkedDefects.has(defect.id) 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      {/* Checkbox */}
                      <button
                        onClick={() => toggleDefectCheck(defect.id)}
                        className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
                          checkedDefects.has(defect.id)
                            ? 'border-green-500 bg-green-500'
                            : 'border-gray-300 hover:border-green-400'
                        }`}
                      >
                        {checkedDefects.has(defect.id) && (
                          <CheckCircle className="w-4 h-4 text-white" />
                        )}
                      </button>

                      {/* Mangel-Details */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className={`font-semibold ${
                            checkedDefects.has(defect.id) ? 'line-through text-gray-500' : 'text-gray-900'
                          }`}>
                            {defect.title}
                          </h4>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(defect.severity)}`}>
                            {getSeverityLabel(defect.severity)}
                          </div>
                        </div>
                        
                        <p className={`text-sm mb-2 ${
                          checkedDefects.has(defect.id) ? 'line-through text-gray-500' : 'text-gray-600'
                        }`}>
                          {defect.description}
                        </p>
                        
                        {(defect.room || defect.location) && (
                          <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                            {defect.room && <span>📍 {defect.room}</span>}
                            {defect.location && <span>🏠 {defect.location}</span>}
                          </div>
                        )}

                        {defect.photos && defect.photos.length > 0 && (
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>📸 {defect.photos.length} Foto{defect.photos.length !== 1 ? 's' : ''}</span>
                          </div>
                        )}
                      </div>

                      {/* Status-Indikator */}
                      <div className="flex items-center">
                        {checkedDefects.has(defect.id) ? (
                          <div className="flex items-center text-green-600 text-sm">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Behoben
                          </div>
                        ) : (
                          <div className="flex items-center text-orange-600 text-sm">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            Offen
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Status-Übersicht */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600">
                  Behobene Mängel: <span className="font-semibold">{checkedDefects.size}</span> von <span className="font-semibold">{defects.length}</span>
                </div>
                {allDefectsResolved && (
                  <div className="flex items-center text-green-600 text-sm">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Alle Mängel behoben
                  </div>
                )}
              </div>
              
              {/* Fortschrittsbalken */}
              <div className="w-32">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${defects.length > 0 ? (checkedDefects.size / defects.length) * 100 : 100}%`,
                      background: `linear-gradient(to right, #ffbd59, #ff9500)`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
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
            onClick={handleFinalAcceptance}
            disabled={!allDefectsResolved || isLoading}
            className="flex items-center px-6 py-2 text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ 
              backgroundColor: allDefectsResolved ? '#ffbd59' : '#9ca3af'
            }}
            onMouseEnter={(e) => {
              if (allDefectsResolved && !isLoading) {
                e.currentTarget.style.backgroundColor = '#ff9500';
              }
            }}
            onMouseLeave={(e) => {
              if (allDefectsResolved && !isLoading) {
                e.currentTarget.style.backgroundColor = '#ffbd59';
              }
            }}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Wird abgeschlossen...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Finale Abnahme durchführen
              </>
            )}
          </button>
        </div>
      </div>

      {/* Rating Modal */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-bold mb-4" style={{ color: '#51636f' }}>
                Dienstleister bewerten
              </h3>
              
              <div className="space-y-4">
                {/* Qualität */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Qualität der Arbeit
                  </label>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRatings(prev => ({ ...prev, qualityRating: star }))}
                        className="p-1"
                      >
                        <Star 
                          className={`w-6 h-6 ${
                            star <= ratings.qualityRating 
                              ? 'text-yellow-400 fill-current' 
                              : 'text-gray-300'
                          }`} 
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Termintreue */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Termintreue
                  </label>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRatings(prev => ({ ...prev, timelinessRating: star }))}
                        className="p-1"
                      >
                        <Star 
                          className={`w-6 h-6 ${
                            star <= ratings.timelinessRating 
                              ? 'text-yellow-400 fill-current' 
                              : 'text-gray-300'
                          }`} 
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Gesamtbewertung */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gesamtbewertung
                  </label>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRatings(prev => ({ ...prev, overallRating: star }))}
                        className="p-1"
                      >
                        <Star 
                          className={`w-6 h-6 ${
                            star <= ratings.overallRating 
                              ? 'text-yellow-400 fill-current' 
                              : 'text-gray-300'
                          }`} 
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notizen */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Abschließende Notizen (optional)
                  </label>
                  <textarea
                    value={finalNotes}
                    onChange={(e) => setFinalNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Zusätzliche Bemerkungen zur Abnahme..."
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowRatingModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Abbrechen
                </button>
                <button
                  onClick={submitFinalAcceptance}
                  disabled={isLoading || ratings.overallRating === 0}
                  className="flex items-center px-6 py-2 text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50"
                  style={{ backgroundColor: '#ffbd59' }}
                  onMouseEnter={(e) => {
                    if (!isLoading && ratings.overallRating > 0) {
                      e.currentTarget.style.backgroundColor = '#ff9500';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isLoading && ratings.overallRating > 0) {
                      e.currentTarget.style.backgroundColor = '#ffbd59';
                    }
                  }}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Abnahme abschließen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinalAcceptanceModal;