import React, { useState, useEffect } from 'react';
import { X, Upload, Camera, FileText, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

interface CompletionPhoto {
  url: string;
  caption?: string;
  category: 'before' | 'after' | 'detail' | 'overview';
  timestamp: string;
}

interface ChecklistItem {
  id: string;
  label: string;
  required: boolean;
  checked: boolean;
}

interface CompletionChecklist {
  category: string;
  items: ChecklistItem[];
  overall_rating: number;
  notes?: string;
}

interface MilestoneCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  milestone: any;
  onSubmit: (data: any) => void;
}

const MilestoneCompletionModal: React.FC<MilestoneCompletionModalProps> = ({
  isOpen,
  onClose,
  milestone,
  onSubmit
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [checklist, setChecklist] = useState<CompletionChecklist | null>(null);
  const [photos, setPhotos] = useState<CompletionPhoto[]>([]);
  const [documents, setDocuments] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Lade Checkliste-Template beim Öffnen
  useEffect(() => {
    if (isOpen && milestone?.category) {
      loadChecklistTemplate(milestone.category);
    }
  }, [isOpen, milestone]);

  const loadChecklistTemplate = async (category: string) => {
    try {
      const response = await fetch(`/api/milestones/completion/checklist/${category}`);
      const data = await response.json();
      
      setChecklist({
        category,
        items: data.template.items,
        overall_rating: 3,
        notes: ''
      });
    } catch (error) {
      console.error('Fehler beim Laden der Checkliste:', error);
    }
  };

  const handleChecklistChange = (itemId: string, checked: boolean) => {
    if (!checklist) return;
    
    setChecklist({
      ...checklist,
      items: checklist.items.map(item =>
        item.id === itemId ? { ...item, checked } : item
      )
    });
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setIsLoading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('milestone_id', milestone.id.toString());
        formData.append('category', 'overview');

        const response = await fetch('/api/milestones/photos/upload', {
          method: 'POST',
          body: formData
        });

        const data = await response.json();
        
        setPhotos(prev => [...prev, {
          url: data.photo_url,
          category: 'overview',
          timestamp: new Date().toISOString(),
          caption: ''
        }]);
      }
    } catch (error) {
      console.error('Fehler beim Upload:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setIsLoading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('milestone_id', milestone.id.toString());
        formData.append('document_type', 'certificate');

        const response = await fetch('/api/milestones/documents/upload', {
          method: 'POST',
          body: formData
        });

        const data = await response.json();
        setDocuments(prev => [...prev, data.document_url]);
      }
    } catch (error) {
      console.error('Fehler beim Upload:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!checklist) return;

    const completionData = {
      milestone_id: milestone.id,
      checklist: {
        ...checklist,
        completed_by: 1, // TODO: Aktuelle User-ID
        completed_at: new Date().toISOString()
      },
      photos,
      documents,
      notes
    };

    try {
      setIsLoading(true);
      await onSubmit(completionData);
      onClose();
    } catch (error) {
      console.error('Fehler beim Einreichen:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const canProceedToNextStep = () => {
    if (currentStep === 1 && checklist) {
      const requiredItems = checklist.items.filter(item => item.required);
      return requiredItems.every(item => item.checked);
    }
    return true;
  };

  const getStepIcon = (step: number) => {
    if (currentStep > step) return <CheckCircle className="w-6 h-6 text-green-500" />;
    if (currentStep === step) return <Clock className="w-6 h-6 text-blue-500" />;
    return <div className="w-6 h-6 rounded-full border-2 border-gray-300" />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Gewerk abschließen</h2>
            <p className="text-gray-600">{milestone?.title}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Fortschrittsanzeige */}
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {getStepIcon(1)}
                <span className={`font-medium ${currentStep >= 1 ? 'text-gray-800' : 'text-gray-400'}`}>
                  Selbstprüfung
                </span>
              </div>
              <div className="w-12 h-0.5 bg-gray-300"></div>
              <div className="flex items-center space-x-2">
                {getStepIcon(2)}
                <span className={`font-medium ${currentStep >= 2 ? 'text-gray-800' : 'text-gray-400'}`}>
                  Dokumentation
                </span>
              </div>
              <div className="w-12 h-0.5 bg-gray-300"></div>
              <div className="flex items-center space-x-2">
                {getStepIcon(3)}
                <span className={`font-medium ${currentStep >= 3 ? 'text-gray-800' : 'text-gray-400'}`}>
                  Abschluss
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Abnahme-Checkliste für {milestone?.category?.toUpperCase()}
                </h3>
                
                {checklist && (
                  <div className="space-y-3">
                    {checklist.items.map((item) => (
                      <div key={item.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <input
                          type="checkbox"
                          id={item.id}
                          checked={item.checked}
                          onChange={(e) => handleChecklistChange(item.id, e.target.checked)}
                          className="w-5 h-5 text-blue-600 rounded"
                        />
                        <label htmlFor={item.id} className="flex-1 text-gray-700">
                          {item.label}
                          {item.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        {item.checked && <CheckCircle className="w-5 h-5 text-green-500" />}
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gesamtbewertung (1-5 Sterne)
                  </label>
                  <div className="flex space-x-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => setChecklist(prev => prev ? {...prev, overall_rating: rating} : null)}
                        className={`w-8 h-8 ${
                          checklist && rating <= checklist.overall_rating
                            ? 'text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Dokumentation hochladen
                </h3>
                
                {/* Foto-Upload */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <div className="text-center">
                    <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-700 mb-2">Fotos hochladen</h4>
                    <p className="text-gray-500 mb-4">
                      Laden Sie Fotos des abgeschlossenen Gewerkes hoch
                    </p>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      id="photo-upload"
                    />
                    <label
                      htmlFor="photo-upload"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Fotos auswählen
                    </label>
                  </div>
                </div>

                {/* Foto-Vorschau */}
                {photos.length > 0 && (
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    {photos.map((photo, index) => (
                      <div key={index} className="relative">
                        <img
                          src={photo.url}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                          {photo.category}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Dokument-Upload */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 mt-6">
                  <div className="text-center">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-700 mb-2">Dokumente hochladen</h4>
                    <p className="text-gray-500 mb-4">
                      Prüfzertifikate, Garantiescheine, etc.
                    </p>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx"
                      onChange={handleDocumentUpload}
                      className="hidden"
                      id="document-upload"
                    />
                    <label
                      htmlFor="document-upload"
                      className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Dokumente auswählen
                    </label>
                  </div>
                </div>

                {/* Dokument-Liste */}
                {documents.length > 0 && (
                  <div className="mt-4">
                    <h5 className="font-medium text-gray-700 mb-2">Hochgeladene Dokumente:</h5>
                    <ul className="space-y-2">
                      {documents.map((doc, index) => (
                        <li key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                          <FileText className="w-4 h-4" />
                          <span>Dokument {index + 1}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Abschluss bestätigen
                </h3>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-800">Bereit für Abnahme</span>
                  </div>
                  <p className="text-green-700 mt-2">
                    Alle erforderlichen Punkte wurden abgehakt und die Dokumentation ist vollständig.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Zusätzliche Notizen (optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Besondere Hinweise für die Abnahme..."
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 mb-2">Was passiert als nächstes?</h4>
                  <ul className="text-blue-700 text-sm space-y-1">
                    <li>• Der Bauträger wird über den Abschluss-Antrag benachrichtigt</li>
                    <li>• Ein Abnahme-Termin wird vereinbart</li>
                    <li>• Nach erfolgreicher Abnahme können Sie die Rechnung erstellen</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex space-x-3">
            {currentStep > 1 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Zurück
              </button>
            )}
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Abbrechen
            </button>
            
            {currentStep < 3 ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!canProceedToNextStep()}
                className={`px-4 py-2 rounded-lg ${
                  canProceedToNextStep()
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Weiter
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {isLoading ? 'Wird eingereicht...' : 'Abschluss beantragen'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MilestoneCompletionModal; 