import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Camera, MapPin, Plus, Trash2, Upload } from 'lucide-react';
import { api } from '../api/api';
import { useAuth } from '../context/AuthContext';

interface Defect {
  id?: number;
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

interface DefectDocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  milestoneId: number;
  milestoneTitle: string;
  onDefectsDocumented: (defects: Defect[]) => void;
}

const DefectDocumentationModal: React.FC<DefectDocumentationModalProps> = ({
  isOpen,
  onClose,
  milestoneId,
  milestoneTitle,
  onDefectsDocumented
}) => {
  const { user } = useAuth();
  const [defects, setDefects] = useState<Defect[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentDefect, setCurrentDefect] = useState<Partial<Defect>>({
    title: '',
    description: '',
    severity: 'MINOR',
    location: '',
    room: '',
    photos: []
  });

  const severityOptions = [
    { value: 'MINOR', label: 'Geringfügig', color: 'text-yellow-300 bg-yellow-500/15 border-yellow-500/30' },
    { value: 'MAJOR', label: 'Erheblich', color: 'text-orange-300 bg-orange-500/15 border-orange-500/30' },
    { value: 'CRITICAL', label: 'Kritisch', color: 'text-red-300 bg-red-500/15 border-red-500/30' }
  ];

  const addDefect = () => {
    if (!currentDefect.title || !currentDefect.description) {
      setError('Bitte füllen Sie mindestens Titel und Beschreibung aus.');
      return;
    }

    const newDefect: Defect = {
      title: currentDefect.title!,
      description: currentDefect.description!,
      severity: currentDefect.severity!,
      location: currentDefect.location || '',
      room: currentDefect.room || '',
      photos: currentDefect.photos || [],
      resolved: false
    };

    setDefects([...defects, newDefect]);
    setCurrentDefect({
      title: '',
      description: '',
      severity: 'MINOR',
      location: '',
      room: '',
      photos: []
    });
    setError(null);
  };

  const removeDefect = (index: number) => {
    setDefects(defects.filter((_, i) => i !== index));
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setIsLoading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('milestone_id', milestoneId.toString());
        formData.append('file_type', 'defect_photo');

        const response = await api.post('/files/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        return response.data.file_url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setCurrentDefect(prev => ({
        ...prev,
        photos: [...(prev.photos || []), ...uploadedUrls]
      }));
    } catch (error) {
      console.error('Fehler beim Hochladen der Fotos:', error);
      setError('Fehler beim Hochladen der Fotos. Bitte versuchen Sie es erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  const removePhoto = (photoIndex: number) => {
    setCurrentDefect(prev => ({
      ...prev,
      photos: prev.photos?.filter((_, index) => index !== photoIndex) || []
    }));
  };

  const handleSubmit = async () => {
    if (defects.length === 0) {
      setError('Bitte dokumentieren Sie mindestens einen Mangel.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Erstelle zuerst eine Abnahme-Eintrag
      const acceptanceResponse = await api.post('/acceptance', {
        milestone_id: milestoneId,
        status: 'under_review',
        notes: `Mängel dokumentiert von ${user?.first_name} ${user?.last_name}`
      });

      const acceptanceId = acceptanceResponse.data.id;

      // Erstelle dann die Mängel
      const defectPromises = defects.map(async (defect) => {
        const defectResponse = await api.post('/acceptance/defects', {
          acceptance_id: acceptanceId,
          title: defect.title,
          description: defect.description,
          severity: defect.severity,
          location: defect.location,
          room: defect.room,
          photos: defect.photos,
          resolved: false
        });
        return defectResponse.data;
      });

      const createdDefects = await Promise.all(defectPromises);

      // Aktualisiere den Milestone-Status
      await api.put(`/milestones/${milestoneId}/progress/completion`, {
        status: 'completed_with_defects',
        message: 'Mängel wurden dokumentiert. Abnahme unter Vorbehalt erforderlich.'
      });

      onDefectsDocumented(createdDefects);
      onClose();

    } catch (error: any) {
      console.error('Fehler beim Dokumentieren der Mängel:', error);
      setError('Fehler beim Speichern der Mängel. Bitte versuchen Sie es erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    const option = severityOptions.find(opt => opt.value === severity);
    return option?.color || 'text-gray-300 bg-gray-600/20 border-gray-600/40';
  };

  const getSeverityLabel = (severity: string) => {
    const option = severityOptions.find(opt => opt.value === severity);
    return option?.label || severity;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-[#1a1a2e] to-[#2c3539] text-white rounded-xl border border-gray-600/30 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-600/30 bg-[#1a1a2e]/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-orange-500 to-red-500 shadow-inner">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Schritt 2 von 3: Mängel dokumentieren</h2>
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
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-orange-300 mt-0.5" />
              <div>
                <h3 className="font-semibold text-orange-200 mb-2">Mängel dokumentieren</h3>
                <p className="text-orange-200/90 text-sm">
                  Dokumentieren Sie alle festgestellten Mängel mit detaillierten Beschreibungen, 
                  Fotos und Schweregraden. Diese werden dann im nächsten Schritt für die Abnahme unter Vorbehalt verwendet.
                </p>
              </div>
            </div>
          </div>

          {/* Neuer Mangel hinzufügen */}
          <div className="bg-white/5 rounded-lg p-4 border border-gray-600/30">
            <h3 className="text-lg font-semibold mb-4 text-white">Neuen Mangel hinzufügen</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Titel des Mangels *
                </label>
                <input
                  type="text"
                  value={currentDefect.title || ''}
                  onChange={(e) => setCurrentDefect(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  placeholder="z.B. Riss in der Wand"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Schweregrad
                </label>
                <select
                  value={currentDefect.severity || 'MINOR'}
                  onChange={(e) => setCurrentDefect(prev => ({ ...prev, severity: e.target.value as 'MINOR' | 'MAJOR' | 'CRITICAL' }))}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                >
                  {severityOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Beschreibung *
              </label>
              <textarea
                value={currentDefect.description || ''}
                onChange={(e) => setCurrentDefect(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                placeholder="Detaillierte Beschreibung des Mangels..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Raum
                </label>
                <input
                  type="text"
                  value={currentDefect.room || ''}
                  onChange={(e) => setCurrentDefect(prev => ({ ...prev, room: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  placeholder="z.B. Wohnzimmer"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Standort
                </label>
                <input
                  type="text"
                  value={currentDefect.location || ''}
                  onChange={(e) => setCurrentDefect(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  placeholder="z.B. Nordwand"
                />
              </div>
            </div>

            {/* Foto-Upload */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Fotos hinzufügen
              </label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg cursor-pointer transition-colors">
                  <Camera className="w-4 h-4" />
                  Fotos auswählen
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
                {isLoading && (
                  <div className="flex items-center text-orange-300">
                    <div className="w-4 h-4 border-2 border-orange-300 border-t-transparent rounded-full animate-spin mr-2"></div>
                    Wird hochgeladen...
                  </div>
                )}
              </div>
              
              {/* Vorschau der Fotos */}
              {currentDefect.photos && currentDefect.photos.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {currentDefect.photos.map((photo, index) => (
                    <div key={`defect-photo-${currentDefect.id}-${index}`} className="relative">
                      <img
                        src={photo}
                        alt={`Mangel Foto ${index + 1}`}
                        className="w-20 h-20 object-cover rounded-lg border border-gray-600/30"
                      />
                      <button
                        onClick={() => removePhoto(index)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={addDefect}
              disabled={!currentDefect.title || !currentDefect.description}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:text-gray-400 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Mangel hinzufügen
            </button>
          </div>

          {/* Dokumentierte Mängel */}
          {defects.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4 text-white">
                Dokumentierte Mängel ({defects.length})
              </h3>
              
              <div className="space-y-4">
                {defects.map((defect, index) => (
                  <div
                    key={`defect-item-${defect.id || index}`}
                    className="bg-white/5 border border-gray-600/30 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-white">{defect.title}</h4>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(defect.severity)}`}>
                            {getSeverityLabel(defect.severity)}
                          </div>
                        </div>
                        
                        <p className="text-gray-300 text-sm mb-2">{defect.description}</p>
                        
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
                      
                      <button
                        onClick={() => removeDefect(index)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
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
            onClick={handleSubmit}
            disabled={defects.length === 0 || isLoading}
            className={`flex items-center px-6 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed ${
              defects.length > 0 ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white' : 'bg-gray-600 text-gray-300'
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Wird gespeichert...
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 mr-2" />
                Mängel dokumentieren & weiter
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DefectDocumentationModal;
