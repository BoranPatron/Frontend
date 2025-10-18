import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Calendar, FileText, Star, Download } from 'lucide-react';
import { api } from '../api/api';
import { useAuth } from '../context/AuthContext';

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
  const { user } = useAuth();
  const [checkedDefects, setCheckedDefects] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratings, setRatings] = useState({
    qualityRating: 0,
    timelinessRating: 0,
    communicationRating: 0,
    overallRating: 0
  });

  // Verwende die AuthContext Funktionen für korrekte Rollenprüfung
  const { isServiceProvider: isServiceProviderFromAuth, isBautraeger: isBautraegerFromAuth } = useAuth();
  
  // Prüfe ob der aktuelle Benutzer ein Bauträger ist (kann bewerten)
  const isBautraeger = isBautraegerFromAuth();
  
  // Prüfe ob der aktuelle Benutzer ein Dienstleister ist (kann nicht bewerten)
  const isServiceProvider = isServiceProviderFromAuth();
  
  // Debug-Logging
  console.log('🔍 FinalAcceptanceModal - Benutzerrolle:', {
    user: user,
    user_role: user?.user_role,
    user_type: user?.user_type,
    isBautraeger,
    isServiceProvider,
    email: user?.email
  });

  // Initialisiere mit den übergebenen Mängeln
  useEffect(() => {
    if (isOpen && defects.length > 0) {
      // Bereits erledigte Mängel automatisch als behoben markieren
      const resolvedDefectIds = defects
        .filter(defect => defect.resolved)
        .map(defect => defect.id);
      setCheckedDefects(new Set(resolvedDefectIds));
      console.log('🔍 FinalAcceptanceModal - Bereits erledigte Mängel vorausgewählt:', resolvedDefectIds);
    } else if (isOpen && defects.length === 0) {
      setCheckedDefects(new Set());
    }
  }, [isOpen, defects]);

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

    // Nur Bauträger müssen bewerten - Dienstleister können direkt abschließen
    if (isBautraeger) {
      setShowRatingModal(true);
    } else {
      // Dienstleister schließt direkt ab ohne Bewertung
      await submitFinalAcceptanceWithoutRating();
    }
  };

  const submitFinalAcceptance = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Markiere nur noch nicht behobene Mängel als behoben
      for (const defectId of checkedDefects) {
        const defect = defects.find(d => d.id === defectId);
        // Überspringe bereits behobene Mängel um Konflikte zu vermeiden
        if (defect && !defect.resolved) {
          console.log('🔧 Quittiere Mangel (mit Bewertung):', defectId);
          await api.put(`/acceptance/defects/${defectId}`, {
            resolved: true,
            resolved_at: new Date().toISOString()
          });
        } else {
          console.log('ℹ️ Mangel bereits behoben, überspringe (mit Bewertung):', defectId);
        }
      }

      // Wenn keine gültige acceptanceId vorhanden ist, verwende die automatisch erstellte vom Backend
      let finalAcceptanceId = acceptanceId;
      if (!acceptanceId || acceptanceId === 0) {
        console.log('🔧 Keine gültige acceptanceId - lade Abnahme vom Backend');
        
        // Lade die automatisch erstellte Abnahme vom Backend
        const acceptanceResponse = await api.get(`/acceptance/milestone/${milestoneId}`);
        if (acceptanceResponse.data && acceptanceResponse.data.length > 0) {
          const latestAcceptance = acceptanceResponse.data[acceptanceResponse.data.length - 1];
          finalAcceptanceId = latestAcceptance.id;
          console.log('✅ Abnahme-ID vom Backend erhalten:', finalAcceptanceId);
        } else {
          throw new Error('Keine Abnahme verfügbar - bitte versuchen Sie es erneut');
        }
      }

      // Schließe die finale Abnahme ab (mit Bewertung für Bauträger)
      await api.post(`/acceptance/${finalAcceptanceId}/final-complete`, {
        accepted: true,
        qualityRating: ratings.qualityRating,
        timelinessRating: ratings.timelinessRating,
        communicationRating: ratings.communicationRating,
        overallRating: ratings.overallRating,
        milestone_id: milestoneId
      });

      onAcceptanceComplete();
      onClose();
      
    } catch (error: any) {
      console.error('❌ Fehler bei finaler Abnahme:', error);
      setError('Fehler beim Abschließen der finalen Abnahme. Bitte versuchen Sie es erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  const submitFinalAcceptanceWithoutRating = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Markiere nur noch nicht behobene Mängel als behoben
      for (const defectId of checkedDefects) {
        const defect = defects.find(d => d.id === defectId);
        // Überspringe bereits behobene Mängel um Konflikte zu vermeiden
        if (defect && !defect.resolved) {
          console.log('🔧 Quittiere Mangel (ohne Bewertung):', defectId);
          await api.put(`/acceptance/defects/${defectId}`, {
            resolved: true,
            resolved_at: new Date().toISOString()
          });
        } else {
          console.log('ℹ️ Mangel bereits behoben, überspringe (ohne Bewertung):', defectId);
        }
      }

      // Wenn keine gültige acceptanceId vorhanden ist, verwende die automatisch erstellte vom Backend
      let finalAcceptanceId = acceptanceId;
      if (!acceptanceId || acceptanceId === 0) {
        console.log('🔧 Keine gültige acceptanceId - lade Abnahme vom Backend (ohne Bewertung)');
        
        // Lade die automatisch erstellte Abnahme vom Backend
        const acceptanceResponse = await api.get(`/acceptance/milestone/${milestoneId}`);
        if (acceptanceResponse.data && acceptanceResponse.data.length > 0) {
          const latestAcceptance = acceptanceResponse.data[acceptanceResponse.data.length - 1];
          finalAcceptanceId = latestAcceptance.id;
          console.log('✅ Abnahme-ID vom Backend erhalten:', finalAcceptanceId);
        } else {
          throw new Error('Keine Abnahme verfügbar - bitte versuchen Sie es erneut');
        }
      }

      // Schließe die finale Abnahme ab (ohne Bewertung für Dienstleister)
      await api.post(`/acceptance/${finalAcceptanceId}/final-complete`, {
        accepted: true,
        milestone_id: milestoneId
        // Keine Bewertungen für Dienstleister
      });

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
      case 'CRITICAL': return 'text-red-300 bg-red-500/15 border-red-500/30';
      case 'MAJOR': return 'text-orange-300 bg-orange-500/15 border-orange-500/30';
      case 'MINOR': return 'text-yellow-300 bg-yellow-500/15 border-yellow-500/30';
      default: return 'text-gray-300 bg-gray-600/20 border-gray-600/40';
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-[#1a1a2e] to-[#2c3539] text-white rounded-xl border border-gray-600/30 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div 
          className="flex items-center justify-between p-6 border-b border-gray-600/30 bg-[#1a1a2e]/60"
        >
          <div className="flex items-center space-x-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-[#ffbd59] to-[#ffa726] shadow-inner"
            >
              <CheckCircle className="w-5 h-5 text-[#1a1a2e]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {isServiceProvider ? 'Mängelbehebung melden' : 'Schritt 3 von 3: Finale Abnahme'}
              </h2>
              <p className="text-sm text-gray-300">{milestoneTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Anleitung */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <FileText className="w-5 h-5 text-blue-300 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-200 mb-2">Abnahme-Checkliste</h3>
                <p className="text-blue-200/90 text-sm">
                  {isServiceProvider 
                    ? 'Prüfen Sie alle dokumentierten Mängel und bestätigen Sie deren Behebung. Nach der Meldung kann der Bauträger die finale Abnahme durchführen.'
                    : 'Prüfen Sie alle dokumentierten Mängel und bestätigen Sie deren Behebung. Erst wenn alle Mängel als behoben markiert sind, kann die finale Abnahme erfolgen.'
                  }
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
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <p className="text-gray-300">Keine Mängel dokumentiert</p>
                <p className="text-sm text-gray-400">Das Gewerk kann ohne Einschränkungen abgenommen werden.</p>

              </div>
            ) : (
              <div className="space-y-4">
                {defects.map((defect) => (
                  <div
                    key={defect.id}
                    onClick={() => toggleDefectCheck(defect.id)}
                    className={`border rounded-lg p-4 transition-all duration-200 cursor-pointer hover:bg-white/10 ${
                      checkedDefects.has(defect.id) 
                        ? 'bg-green-500/10 border-green-500/20' 
                        : 'bg-white/5 border-gray-600/30'
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      {/* Checkbox */}
                      <div
                        className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
                          checkedDefects.has(defect.id)
                            ? 'border-green-500 bg-green-500'
                            : 'border-gray-500'
                        }`}
                      >
                        {checkedDefects.has(defect.id) && (
                          <CheckCircle className="w-4 h-4 text-white" />
                        )}
                      </div>

                      {/* Mangel-Details */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className={`font-semibold ${
                            checkedDefects.has(defect.id) ? 'line-through text-gray-500' : 'text-white'
                          }`}>
                            {defect.title}
                          </h4>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(defect.severity)}`}>
                            {getSeverityLabel(defect.severity)}
                          </div>
                          {defect.resolved && (
                            <div className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                              ✓ Im Kanban erledigt
                            </div>
                          )}
                        </div>
                        
                        <p className={`text-sm mb-2 ${
                          checkedDefects.has(defect.id) ? 'line-through text-gray-500' : 'text-gray-300'
                        }`}>
                          {defect.description}
                        </p>
                        
                        {(defect.room || defect.location) && (
                          <div className="flex items-center gap-4 text-xs text-gray-400 mb-2">
                            {defect.room && <span>📍 {defect.room}</span>}
                            {defect.location && <span>🏠 {defect.location}</span>}
                          </div>
                        )}

                        {defect.photos && defect.photos.length > 0 && (
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <span>📸 {defect.photos.length} Foto{defect.photos.length !== 1 ? 's' : ''}</span>
                          </div>
                        )}
                      </div>

                      {/* Status-Indikator */}
                      <div className="flex items-center">
                        {checkedDefects.has(defect.id) ? (
                          <div className="flex items-center text-green-400 text-sm">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Behoben
                          </div>
                        ) : (
                          <div className="flex items-center text-orange-300 text-sm">
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
          <div className="bg-white/5 rounded-lg p-4 border border-gray-600/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-300">
                  Behobene Mängel: <span className="font-semibold text-white">{checkedDefects.size}</span> von <span className="font-semibold text-white">{defects.length}</span>
                </div>
                {allDefectsResolved && (
                  <div className="flex items-center text-green-400 text-sm">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Alle Mängel behoben
                  </div>
                )}
              </div>
              
              {/* Fortschrittsbalken */}
              <div className="w-32">
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${defects.length > 0 ? (checkedDefects.size / defects.length) * 100 : 100}%`,
                      background: `linear-gradient(to right, #ffbd59, #ffa726)`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-600/30 bg-[#1a1a2e]">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-6 py-2 text-gray-300 hover:text-white font-medium"
          >
            Abbrechen
          </button>
          <button
            onClick={handleFinalAcceptance}
            disabled={!allDefectsResolved || isLoading}
            className={`flex items-center px-6 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed ${
              allDefectsResolved ? 'bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-[#1a1a2e]' : 'bg-gray-600 text-gray-300'
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Wird abgeschlossen...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                {isServiceProvider ? 'Mängelbehebung melden' : 'Finale Abnahme durchführen'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Rating Modal - nur für Bauträger */}
      {showRatingModal && isBautraeger && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-60 p-4">
          <div className="bg-gradient-to-br from-[#1a1a2e] to-[#2c3539] text-white rounded-xl border border-gray-600/30 shadow-2xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-bold mb-4 text-white">
                Dienstleister bewerten
              </h3>
              
              <div className="space-y-4">
                {/* Qualität */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
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
                  <label className="block text-sm font-medium text-gray-300 mb-2">
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

                {/* Kommunikation */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Kommunikation
                  </label>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRatings(prev => ({ ...prev, communicationRating: star }))}
                        className="p-1"
                      >
                        <Star 
                          className={`w-6 h-6 ${
                            star <= ratings.communicationRating 
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
                  <label className="block text-sm font-medium text-gray-300 mb-2">
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
              </div>

              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowRatingModal(false)}
                  className="px-4 py-2 text-gray-300 hover:text-white"
                >
                  Abbrechen
                </button>
                <button
                  onClick={submitFinalAcceptance}
                  disabled={isLoading || ratings.overallRating === 0}
                  className="flex items-center px-6 py-2 text-[#1a1a2e] rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] disabled:bg-gray-600 disabled:text-gray-300"
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
