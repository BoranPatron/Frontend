import React, { useState, useRef } from 'react';
import { 
  X, 
  Camera, 
  Upload, 
  Star, 
  AlertTriangle, 
  CheckCircle, 
  Plus, 
  Trash2,
  FileText,
  Save,
  MapPin,
  Clock,
  User,
  Edit3,
  Image as ImageIcon
} from 'lucide-react';
import PhotoAnnotationEditor from './PhotoAnnotationEditor';

interface AcceptanceDefect {
  id?: number;
  title: string;
  description: string;
  severity: 'MINOR' | 'MAJOR' | 'CRITICAL';
  location: string;
  room: string;
  photos: string[];
}

interface AcceptanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  trade: any;
  onComplete: (data: AcceptanceData) => void;
  // Benötigt für Dienstleister-Einladung
  acceptedQuote?: any;
  project?: any;
  // Optional: Nach finaler Abnahme Bewertungsdialog öffnen
  onRequestServiceProviderRating?: (params: {
    serviceProviderId: number;
    projectId: number;
    milestoneId: number;
    quoteId?: number;
  }) => void;
}

interface AcceptanceData {
  accepted: boolean;
  acceptanceNotes: string;
  contractorNotes: string;
  qualityRating: number;
  timelinessRating: number;
  overallRating: number;
  photos: string[];
  defects: AcceptanceDefect[];
  reviewDate?: string;
  reviewNotes?: string;
  checklist: {
    workCompleted: boolean;
    qualityAcceptable: boolean;
    specificationsMet: boolean;
    safetyCompliant: boolean;
    cleanedUp: boolean;
    documentsProvided: boolean;
  };
}

const AcceptanceModal: React.FC<AcceptanceModalProps> = ({ 
  isOpen, 
  onClose, 
  trade, 
  onComplete,
  acceptedQuote,
  project,
  onRequestServiceProviderRating
}) => {
  const [step, setStep] = useState(1); // 1: Checkliste, 2: Mängel & Fotos, 3: Entscheidung
  const [accepted, setAccepted] = useState<boolean | null>(null);
  const [reviewDate, setReviewDate] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [showFinalAcceptanceWarning, setShowFinalAcceptanceWarning] = useState(false);
  
  // Checkliste für Abnahme vor Ort
  const [checklist, setChecklist] = useState({
    workCompleted: false,        // Arbeiten vollständig ausgeführt
    qualityAcceptable: false,    // Qualität entspricht Anforderungen
    specificationsMet: false,    // Spezifikationen eingehalten
    safetyCompliant: false,      // Sicherheitsvorschriften beachtet
    cleanedUp: false,           // Arbeitsplatz ordnungsgemäß gereinigt
    documentsProvided: false     // Erforderliche Dokumente übergeben
  });

  const [acceptanceNotes, setAcceptanceNotes] = useState('');
  const [contractorNotes, setContractorNotes] = useState('');
  const [qualityRating, setQualityRating] = useState(0);
  const [timelinessRating, setTimelinessRating] = useState(0);
  const [overallRating, setOverallRating] = useState(0);
  const [photos, setPhotos] = useState<string[]>([]);
  const [defects, setDefects] = useState<AcceptanceDefect[]>([]);
  const [currentDefect, setCurrentDefect] = useState<AcceptanceDefect>({
    title: '',
    description: '',
    severity: 'MINOR',
    location: '',
    room: '',
    photos: []
  });
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showPhotoEditor, setShowPhotoEditor] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<string | null>(null);
  const [editingDefectId, setEditingDefectId] = useState<string | null>(null);

  // Robuster Foto-Upload Handler für Online-Betrieb
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setLoading(true);
    try {
      const processedPhotos: string[] = [];
      
      for (const file of Array.from(files)) {
        // Validierung
        if (!file.type.startsWith('image/')) {
          alert('Nur Bilddateien sind erlaubt');
          continue;
        }
        
        if (file.size > 10 * 1024 * 1024) { // 10MB Limit
          alert('Datei zu groß. Maximum 10MB pro Bild.');
          continue;
        }

        try {
          // Versuche Server-Upload für Online-Betrieb
          const formData = new FormData();
          formData.append('file', file);
          formData.append('type', 'defect_photo');
          
          const { api } = await import('../api/api');
          const response = await api.post('/acceptance/upload-photo', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });

          const result = response.data || response;
          processedPhotos.push(result.url);
        } catch (serverError) {
          console.warn('Server-Upload fehlgeschlagen, verwende lokale Verarbeitung:', serverError);
          
          // Fallback: Lokale Base64-Verarbeitung für Offline-Betrieb
          try {
            const base64 = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = (e) => {
                if (e.target?.result) {
                  resolve(e.target.result as string);
                } else {
                  reject(new Error('FileReader Fehler'));
                }
              };
              reader.onerror = () => reject(new Error('FileReader Fehler'));
              reader.readAsDataURL(file);
            });
            
            processedPhotos.push(base64);
          } catch (localError) {
            console.error('Lokale Foto-Verarbeitung fehlgeschlagen:', localError);
            alert(`Fehler beim Verarbeiten von ${file.name}`);
          }
        }
      }

      // Füge verarbeitete Fotos hinzu
      if (processedPhotos.length > 0) {
        if (step === 2) {
          // Schritt 2: Fotos zum aktuellen Mangel hinzufügen
          setCurrentDefect(prev => ({
            ...prev,
            photos: [...prev.photos, ...processedPhotos]
          }));
        } else {
          // Andere Schritte: Zu allgemeinen Fotos hinzufügen
          setPhotos(prev => [...prev, ...processedPhotos]);
        }
      }

    } catch (error) {
      console.error('Fehler beim Foto-Upload:', error);
      alert('Fehler beim Hochladen der Fotos');
    } finally {
      setLoading(false);
      // Reset file input
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  if (!isOpen) {
    return null;
  }
  
  const handlePhotoAnnotationSave = (annotatedImageUrl: string, annotations: any[]) => {
    if (editingDefectId === 'current') {
      // Aktueller Mangel - Foto ersetzen
      setCurrentDefect(prev => ({
        ...prev,
        photos: prev.photos.map(photo => 
          photo === editingPhoto ? annotatedImageUrl : photo
        )
      }));
    } else if (editingDefectId) {
      // Bestehender Mangel - Foto ersetzen
      setDefects(prev => prev.map(defect => 
        defect.id?.toString() === editingDefectId
          ? {
              ...defect,
              photos: defect.photos.map(photo => 
                photo === editingPhoto ? annotatedImageUrl : photo
              )
            }
          : defect
      ));
    } else {
      // Allgemeine Fotos - Foto ersetzen
      setPhotos(prev => prev.map(photo => 
        photo === editingPhoto ? annotatedImageUrl : photo
      ));
    }
    
    setShowPhotoEditor(false);
    setEditingPhoto(null);
    setEditingDefectId(null);
  };

  const addDefect = () => {
    if (currentDefect.title.trim() && currentDefect.description.trim()) {
      setDefects(prev => [...prev, { ...currentDefect, id: Date.now() }]);
      setCurrentDefect({
        title: '',
        description: '',
        severity: 'MINOR',
        location: '',
        room: '',
        photos: []
      });
    }
  };

  const removeDefect = (id: number) => {
    setDefects(prev => prev.filter(defect => defect.id !== id));
  };

  // Prüfungen für intelligente Workflow-Steuerung
  const hasDefects = defects.length > 0;
  const checklistComplete = Object.values(checklist).every(Boolean);
  const hasIssues = hasDefects || !checklistComplete;
  
  // Nur finale Abnahme ohne Vorbehalt erfordert Bewertung
  const requiresRating = accepted === true && !hasIssues;

  const renderStarRating = (rating: number, setRating: (rating: number) => void, label: string) => (
    <div className="text-center">
      <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
      <div className="flex justify-center gap-1 mb-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setRating(star)}
            className={`transition-colors ${
              star <= rating ? 'text-yellow-400' : 'text-gray-600 hover:text-yellow-300'
            }`}
          >
            <Star size={24} fill={star <= rating ? 'currentColor' : 'none'} />
          </button>
        ))}
      </div>
      <span className="text-xs text-gray-400">{rating}/5 Sterne</span>
    </div>
  );

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'MAJOR': return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
      case 'MINOR': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
    }
  };

  const handleComplete = async () => {
    const data: AcceptanceData = {
      accepted: accepted || false,
      acceptanceNotes,
      contractorNotes,
      qualityRating: hasIssues ? 0 : qualityRating, // Keine Bewertung bei Vorbehalt
      timelinessRating: hasIssues ? 0 : timelinessRating, // Keine Bewertung bei Vorbehalt
      overallRating: hasIssues ? 0 : overallRating, // Keine Bewertung bei Vorbehalt
      photos,
      defects,
      reviewDate: hasIssues ? reviewDate : undefined,
      reviewNotes: hasIssues ? reviewNotes : undefined,
      checklist
    };

    // Bei Abnahme unter Vorbehalt: Erstelle automatisch einen Wiedervorlage-Termin
    if (hasIssues && reviewDate && accepted === false) {
      try {
        await createReviewAppointment();
        
        // Erfolgs-Benachrichtigung
        const reviewDateFormatted = new Date(reviewDate).toLocaleDateString('de-DE', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
        
        alert(`✅ Wiedervorlage-Termin erfolgreich erstellt!\n\n` +
              `📅 Datum: ${reviewDateFormatted} um 14:00 Uhr\n` +
              `📍 Ort: ${trade?.project?.address || 'Projektadresse'}\n\n` +
              `Sowohl Sie als auch der Dienstleister wurden automatisch eingeladen und können den Termin in ihrem Kalender einsehen.`);
        
      } catch (error) {
        console.error('❌ Fehler beim Erstellen des Wiedervorlage-Termins:', error);
        alert('⚠️ Abnahme wurde gespeichert, aber der Wiedervorlage-Termin konnte nicht automatisch erstellt werden. Bitte erstellen Sie den Termin manuell.');
      }
    }

    onComplete(data);

    // Direkt nach finaler Abnahme ohne Vorbehalt: Bewertungsdialog anstoßen
    if (!hasIssues && accepted && typeof onRequestServiceProviderRating === 'function') {
      const providerId = trade?.service_provider_id || trade?.accepted_by || null;
      if (providerId) {
        onRequestServiceProviderRating({
          serviceProviderId: providerId,
          projectId: trade?.project_id,
          milestoneId: trade?.id,
          quoteId: trade?.accepted_quote_id || undefined
        });
      }
    }
  };

  // Erstelle Wiedervorlage-Termin bei Abnahme unter Vorbehalt
  const createReviewAppointment = async () => {
    try {
      console.log('📅 Erstelle Wiedervorlage-Termin für Abnahme unter Vorbehalt...');

      // Berechne Terminzeit (standardmäßig 14:00 Uhr)
      const appointmentDate = new Date(reviewDate);
      appointmentDate.setHours(14, 0, 0, 0); // 14:00 Uhr

      // Sammle alle relevanten Informationen für den Termin
      const appointmentData = {
        title: `Wiedervorlage: ${trade?.title || 'Gewerk-Abnahme'}`,
        description: `Wiedervorlage-Termin für die finale Abnahme des Gewerks "${trade?.title}"\n\n` +
          `Grund der Wiedervorlage:\n` +
          `${defects.length > 0 ? `• ${defects.length} Mängel müssen behoben werden` : ''}` +
          `${!checklistComplete ? `• Checkliste muss vollständig erfüllt werden` : ''}` +
          `${reviewNotes ? `\n\nNotizen zur Wiedervorlage:\n${reviewNotes}` : ''}` +
          `${acceptanceNotes ? `\n\nAllgemeine Notizen:\n${acceptanceNotes}` : ''}`,
        scheduled_date: appointmentDate.toISOString(),
        duration_minutes: 120, // 2 Stunden für Wiedervorlage
        location: (project?.address || project?.location || trade?.project?.address || trade?.project?.location || 'Projektadresse'),
        location_details: 'Wiedervorlage-Termin für finale Gewerk-Abnahme',
        appointment_type: 'REVIEW' as const,
        milestone_id: trade?.id,
        project_id: (project?.id || trade?.project_id),
        contact_person: (project?.owner_name || trade?.project?.owner_name || 'Bauträger'),
        contact_phone: (project?.owner_phone || trade?.project?.owner_phone),
        preparation_notes: 'Bitte prüfen Sie die behobenen Mängel vor dem Termin',
        // KRITISCH: Verwende invited_service_provider_ids (nicht invited_service_providers)
        invited_service_provider_ids: (() => {
          const invitees: number[] = [];
          
          // Methode 1: Aus acceptedQuote (bevorzugt)
          if (acceptedQuote?.service_provider_id) {
            invitees.push(Number(acceptedQuote.service_provider_id));
            console.log('👥 Dienstleister aus acceptedQuote zur Wiedervorlage eingeladen:', acceptedQuote.service_provider_id);
          }
          
          // Methode 2: Aus trade (Fallback)
          if (trade?.accepted_service_provider_id && !invitees.includes(Number(trade.accepted_service_provider_id))) {
            invitees.push(Number(trade.accepted_service_provider_id));
            console.log('👥 Dienstleister aus trade zur Wiedervorlage eingeladen:', trade.accepted_service_provider_id);
          }
          
          // Methode 3: Aus trade.acceptedQuote (weiterer Fallback)
          if (trade?.acceptedQuote?.service_provider_id && !invitees.includes(Number(trade.acceptedQuote.service_provider_id))) {
            invitees.push(Number(trade.acceptedQuote.service_provider_id));
            console.log('👥 Dienstleister aus trade.acceptedQuote zur Wiedervorlage eingeladen:', trade.acceptedQuote.service_provider_id);
          }
          
          // Debug: Zeige alle verfügbaren Service Provider Informationen
          console.log('👥 Wiedervorlage-Termin Einladungs-Debug:', {
            tradeId: trade?.id,
            acceptedQuote: acceptedQuote,
            acceptedQuoteServiceProviderId: acceptedQuote?.service_provider_id,
            tradeAcceptedServiceProviderId: trade?.accepted_service_provider_id,
            tradeAcceptedQuote: trade?.acceptedQuote,
            project: project,
            projectOwner: project?.owner_id,
            finalInvitees: invitees
          });
          
          if (invitees.length === 0) {
            console.warn('⚠️ Keine Dienstleister für Wiedervorlage-Termin gefunden!');
          }
          
          return invitees;
        })()
      };

      console.log('📅 Wiedervorlage-Termin Daten:', appointmentData);

      // Erstelle den Termin über den appointmentService
      const { appointmentService } = await import('../api/appointmentService');
      const response = await appointmentService.createAppointment(appointmentData);

      console.log('✅ Wiedervorlage-Termin erfolgreich erstellt:', response);

      // Event für andere Komponenten auslösen
      window.dispatchEvent(new CustomEvent('appointmentCreated', {
        detail: {
          type: 'review',
          appointment: response,
          milestoneId: trade?.id
        }
      }));

      // Browser-Benachrichtigung falls erlaubt
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Wiedervorlage-Termin erstellt', {
          body: `Termin für ${new Date(reviewDate).toLocaleDateString('de-DE')} wurde erstellt`,
          icon: '/favicon.ico'
        });
      }

    } catch (error) {
      console.error('❌ Fehler beim Erstellen des Wiedervorlage-Termins:', error);
      throw error; // Weiterleiten für Fehlerbehandlung im handleComplete
    }
  };

  // Prüft ob es nicht gespeicherte Mangel-Daten gibt
  const hasUnsavedDefectData = () => {
    return currentDefect.title.trim() !== '' || 
           currentDefect.description.trim() !== '' || 
           currentDefect.room.trim() !== '' || 
           currentDefect.location.trim() !== '' ||
           currentDefect.photos.length > 0;
  };

  const canProceedFromStep = (currentStep: number) => {
    switch (currentStep) {
      case 1: return true; // Checkliste kann immer übersprungen werden
      case 2: 
        // Schritt 2: Warnen wenn nicht gespeicherte Mangel-Daten vorhanden sind
        if (hasUnsavedDefectData()) {
          return false;
        }
        
        if (hasIssues) {
          // Bei Abnahme unter Vorbehalt: Wiedervorlage-Datum erforderlich
          return reviewDate.trim() !== '';
        } else {
          // Bei vollständiger Abnahme: Gesamtbewertung erforderlich
          return overallRating > 0;
        }
      case 3: return accepted !== null; // Entscheidung ist erforderlich
      default: return false;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-[#2c3539] rounded-2xl shadow-2xl border border-white/20 max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-white/10 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <CheckCircle size={24} className="text-blue-400" />
              Abnahme: {trade?.title || 'Gewerk'}
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              Schritt {step} von {hasIssues ? 2 : 3}: {
                step === 1 ? 'Vor-Ort Prüfung' : 
                step === 2 && hasIssues ? 'Abnahme unter Vorbehalt' :
                step === 2 ? 'Bewertung & Entscheidung' :
                'Abnahme-Entscheidung'
              }
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 min-h-0">
          {/* Schritt 1: Vor-Ort Prüfung (Checkliste) */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <h3 className="text-blue-300 font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle size={20} />
                  Vor-Ort Prüfung - Checkliste
                </h3>
                <p className="text-blue-200 text-sm mb-4">
                  Prüfen Sie vor Ort alle Aspekte der Arbeiten. Diese Checkliste hilft bei einer systematischen Bewertung.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    { key: 'workCompleted', label: 'Arbeiten vollständig ausgeführt', desc: 'Alle beauftragten Arbeiten sind abgeschlossen' },
                    { key: 'qualityAcceptable', label: 'Qualität entspricht Anforderungen', desc: 'Ausführungsqualität ist zufriedenstellend' },
                    { key: 'specificationsMet', label: 'Spezifikationen eingehalten', desc: 'Technische Vorgaben wurden befolgt' },
                    { key: 'safetyCompliant', label: 'Sicherheitsvorschriften beachtet', desc: 'Alle Sicherheitsstandards wurden eingehalten' },
                    { key: 'cleanedUp', label: 'Arbeitsplatz ordnungsgemäß gereinigt', desc: 'Baustelle ist sauber hinterlassen' },
                    { key: 'documentsProvided', label: 'Erforderliche Dokumente übergeben', desc: 'Garantien, Zertifikate, Anleitungen vorhanden' }
                  ].map((item) => {
                    const checked = checklist[item.key as keyof typeof checklist];
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setChecklist(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                        className={`group text-left w-full p-4 rounded-lg border-2 transition-all cursor-pointer ${
                          checked
                            ? 'border-green-500 bg-green-500/10 shadow-[0_0_0_2px_rgba(16,185,129,0.2)]'
                            : 'border-gray-600/60 bg-white/[0.03] hover:border-green-400/70 hover:bg-white/5'
                        }`}
                        aria-pressed={checked}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`mt-1 w-5 h-5 rounded flex items-center justify-center transition-all ${
                              checked ? 'bg-green-500 text-white' : 'border border-gray-400 text-transparent group-hover:text-white/40'
                            }`}
                          >
                            <CheckCircle size={14} />
                          </div>
                          <div className="flex-1">
                            <div className={`font-medium transition-colors ${checked ? 'text-green-300' : 'text-white'}`}>
                              {item.label}
                            </div>
                            <div className="text-sm text-gray-400 mt-1">
                              {item.desc}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                
                <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-yellow-200 text-sm">
                    <strong>Hinweis:</strong> Dokumentieren Sie eventuelle Mängel im nächsten Schritt, auch wenn einzelne Punkte noch nicht erfüllt sind.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Schritt 2: Mängel dokumentieren */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                <h3 className="text-orange-300 font-semibold mb-4 flex items-center gap-2">
                  <AlertTriangle size={20} />
                  Mängel dokumentieren
                </h3>
                <p className="text-orange-200 text-sm mb-4">
                  Dokumentieren Sie alle festgestellten Mängel detailliert. Jeder Mangel sollte präzise beschrieben werden.
                </p>
                
                {/* Wichtiger Hinweis */}
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Plus size={14} className="text-white" />
                    </div>
                    <div>
                      <p className="text-blue-300 font-medium text-sm mb-1">
                        Wichtig: Mangel speichern nicht vergessen!
                      </p>
                      <p className="text-blue-200 text-xs">
                        Klicken Sie nach dem Ausfüllen der Felder unbedingt auf <span className="font-semibold text-blue-300">"+ Mangel hinzufügen"</span>, 
                        damit der Mangel gespeichert wird. Andernfalls gehen Ihre Eingaben beim Weiterklicken verloren.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Neuen Mangel hinzufügen */}
                <div className="bg-white/5 rounded-lg p-4 mb-4">
                  <h4 className="text-white font-medium mb-3">Neuen Mangel hinzufügen</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Titel <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={currentDefect.title}
                        onChange={(e) => setCurrentDefect(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="z.B. Riss in der Wand"
                        className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Schweregrad <span className="text-red-400">*</span>
                      </label>
                      <select
                        value={currentDefect.severity}
                        onChange={(e) => setCurrentDefect(prev => ({ ...prev, severity: e.target.value as 'MINOR' | 'MAJOR' | 'CRITICAL' }))}
                        className="w-full p-3 bg-[#1a1a2e] border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                        required
                      >
                        <option value="MINOR" className="bg-[#1a1a2e] text-white">Geringfügig</option>
                        <option value="MAJOR" className="bg-[#1a1a2e] text-white">Erheblich</option>
                        <option value="CRITICAL" className="bg-[#1a1a2e] text-white">Kritisch</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Raum/Bereich <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={currentDefect.room}
                        onChange={(e) => setCurrentDefect(prev => ({ ...prev, room: e.target.value }))}
                        placeholder="z.B. Wohnzimmer, Küche"
                        className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Genaue Position <span className="text-gray-400 text-xs">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={currentDefect.location}
                        onChange={(e) => setCurrentDefect(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="z.B. Südwand, 2m von links"
                        className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Beschreibung <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      value={currentDefect.description}
                      onChange={(e) => setCurrentDefect(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Detaillierte Beschreibung des Mangels..."
                      className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      rows={3}
                      required
                    />
                  </div>

                  {/* Foto-Upload für aktuellen Mangel */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Fotos zum Mangel</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                      {currentDefect.photos.map((photo, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={photo}
                            alt={`Mangel-Foto ${index + 1}`}
                            className="w-full h-20 object-cover rounded-lg border border-gray-600"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                            <button
                              onClick={() => {
                                setEditingPhoto(photo);
                                setEditingDefectId('current');
                                setShowPhotoEditor(true);
                              }}
                              className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                              <Edit3 size={12} />
                            </button>
                            <button
                              onClick={() => setCurrentDefect(prev => ({
                                ...prev,
                                photos: prev.photos.filter((_, i) => i !== index)
                              }))}
                              className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                      
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={loading}
                        className="h-20 border-2 border-dashed border-gray-500 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-orange-500 hover:text-orange-400 transition-colors"
                      >
                        <Camera size={16} />
                        <span className="text-xs mt-1">
                          {loading ? 'Lade...' : 'Foto'}
                        </span>
                      </button>
                    </div>
                    <p className="text-gray-400 text-xs">
                      Tipp: Klicken Sie auf <Edit3 size={12} className="inline" /> um Fotos zu markieren und Mängel zu kennzeichnen.
                    </p>
                  </div>

                  <button
                    onClick={addDefect}
                    disabled={!currentDefect.title.trim() || !currentDefect.description.trim()}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      hasUnsavedDefectData() && currentDefect.title.trim() && currentDefect.description.trim()
                        ? 'bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-500/30 animate-pulse'
                        : 'bg-orange-500 text-white hover:bg-orange-600'
                    }`}
                  >
                    <Plus size={16} />
                    Mangel hinzufügen
                    {hasUnsavedDefectData() && currentDefect.title.trim() && currentDefect.description.trim() && (
                      <span className="ml-1 text-xs bg-white/20 px-2 py-0.5 rounded-full">
                        Jetzt speichern!
                      </span>
                    )}
                  </button>
                </div>

                {/* Liste der dokumentierten Mängel */}
                {defects.length > 0 && (
                  <div>
                    <h4 className="text-white font-medium mb-3">Dokumentierte Mängel ({defects.length})</h4>
                    <div className="space-y-3">
                      {defects.map((defect) => (
                        <div key={defect.id} className="bg-white/5 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h5 className="font-medium text-white">{defect.title}</h5>
                                <span className={`px-2 py-1 rounded text-xs border ${getSeverityColor(defect.severity)}`}>
                                  {defect.severity === 'MINOR' ? 'Geringfügig' : 
                                   defect.severity === 'MAJOR' ? 'Erheblich' : 'Kritisch'}
                                </span>
                              </div>
                              <p className="text-gray-300 text-sm mb-2">{defect.description}</p>
                              <div className="flex items-center gap-4 text-xs text-gray-400 mb-2">
                                {defect.room && (
                                  <span className="flex items-center gap-1">
                                    <MapPin size={12} />
                                    {defect.room}
                                  </span>
                                )}
                                {defect.location && (
                                  <span>{defect.location}</span>
                                )}
                              </div>
                              
                              {/* Fotos des Mangels */}
                              {defect.photos && defect.photos.length > 0 && (
                                <div className="flex gap-2 mt-2">
                                  {defect.photos.map((photo, photoIndex) => (
                                    <div key={photoIndex} className="relative group">
                                      <img
                                        src={photo}
                                        alt={`${defect.title} Foto ${photoIndex + 1}`}
                                        className="w-16 h-16 object-cover rounded border border-gray-600"
                                      />
                                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                                        <button
                                          onClick={() => {
                                            setEditingPhoto(photo);
                                            setEditingDefectId(defect.id?.toString() || '');
                                            setShowPhotoEditor(true);
                                          }}
                                          className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                                        >
                                          <Edit3 size={10} />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => removeDefect(defect.id!)}
                              className="text-red-400 hover:text-red-300 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}



          {/* Schritt 2: Abnahme unter Vorbehalt (wenn Mängel/unvollständige Checkliste) */}
          {step === 2 && hasIssues && (
            <div className="space-y-6">
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                <h3 className="text-orange-300 font-semibold mb-4 flex items-center gap-2">
                  <AlertTriangle size={20} />
                  Abnahme unter Vorbehalt
                </h3>
                <p className="text-orange-200 text-sm mb-6">
                  Aufgrund festgestellter Mängel oder unvollständiger Arbeiten erfolgt die Abnahme unter Vorbehalt.
                </p>

                {/* Status-Übersicht */}
                <div className="bg-white/5 rounded-lg p-4 mb-6">
                  <h4 className="text-white font-medium mb-3">Status-Übersicht</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Checkliste vollständig:</span>
                      <span className={checklistComplete ? 'text-green-400' : 'text-red-400'}>
                        {checklistComplete ? '✅ Ja' : '❌ Nein'} ({Object.values(checklist).filter(Boolean).length}/6)
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Mängel dokumentiert:</span>
                      <span className={hasDefects ? 'text-red-400' : 'text-green-400'}>
                        {hasDefects ? `❌ ${defects.length} Mängel` : '✅ Keine Mängel'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Wiedervorlage-Datum */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Datum der Wiedervorlage *
                    </label>
                    <input
                      type="date"
                      value={reviewDate}
                      onChange={(e) => setReviewDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                      required
                    />
                    <p className="text-gray-400 text-xs mt-1">
                      Bis wann sollen die Mängel behoben sein?
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Notizen zur Wiedervorlage
                    </label>
                    <textarea
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Beschreiben Sie, was bis zur Wiedervorlage erledigt werden muss..."
                      className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      rows={4}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Allgemeine Notizen zur Abnahme
                    </label>
                    <textarea
                      value={acceptanceNotes}
                      onChange={(e) => setAcceptanceNotes(e.target.value)}
                      placeholder="Beschreiben Sie den aktuellen Zustand der Arbeiten..."
                      className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Allgemeine Fotos für die Abnahme */}
                <div className="mb-6">
                  <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                    <Camera size={18} />
                    Allgemeine Abnahme-Fotos
                  </h4>
                  <p className="text-orange-200 text-sm mb-4">
                    Dokumentieren Sie den Gesamtzustand der Arbeiten mit Fotos.
                  </p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                    {photos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={photo}
                          alt={`Abnahme-Foto ${index + 1}`}
                          className="w-full h-20 object-cover rounded-lg border border-gray-600"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setEditingPhoto(photo);
                              setEditingDefectId(null);
                              setShowPhotoEditor(true);
                            }}
                            className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                          >
                            <Edit3 size={12} />
                          </button>
                          <button
                            onClick={() => setPhotos(prev => prev.filter((_, i) => i !== index))}
                            className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={loading}
                      className="h-20 border-2 border-dashed border-gray-500 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-orange-500 hover:text-orange-400 transition-colors"
                    >
                      <Camera size={16} />
                      <span className="text-xs mt-1">
                        {loading ? 'Lade...' : 'Foto'}
                      </span>
                    </button>
                  </div>
                  <p className="text-gray-400 text-xs">
                    Tipp: Klicken Sie auf <Edit3 size={12} className="inline" /> um Fotos zu markieren.
                  </p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                />

                <div className="mt-4 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                  <p className="text-orange-200 text-sm">
                    <strong>Hinweis:</strong> Die Bewertung des Dienstleisters erfolgt erst nach der finalen Abnahme ohne Vorbehalt.
                  </p>
                </div>

                {/* Warnung für finale Abnahme trotz Mängel */}
                {showFinalAcceptanceWarning && (
                  <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertTriangle size={20} className="text-red-400 flex-shrink-0 mt-1" />
                      <div>
                        <h4 className="text-red-300 font-semibold mb-2">Warnung: Finale Abnahme trotz Mängeln</h4>
                        <p className="text-red-200 text-sm mb-3">
                          Sie sind dabei, das Gewerk final abzunehmen, obwohl {defects.length > 0 ? `${defects.length} Mängel dokumentiert` : 'die Checkliste unvollständig'} ist. 
                          Dies bedeutet:
                        </p>
                        <ul className="text-red-200 text-sm space-y-1 mb-4 ml-4">
                          <li>• Die Mängel gelten als akzeptiert</li>
                          <li>• Nachbesserungsansprüche können erlöschen</li>
                          <li>• Eine spätere Reklamation wird erschwert</li>
                        </ul>
                        <div className="flex gap-3">
                          <button
                            onClick={() => {
                              setAccepted(true);
                              setStep(3); // Zur Entscheidung
                              setShowFinalAcceptanceWarning(false);
                            }}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                          >
                            Trotzdem final abnehmen
                          </button>
                          <button
                            onClick={() => setShowFinalAcceptanceWarning(false)}
                            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                          >
                            Abbrechen
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}


          {/* Schritt 3: Bewertung & Abnahme-Entscheidung (nur bei vollständiger Abnahme ohne Mängel) */}
          {step === 3 && !hasIssues && (
            <div className="space-y-6">
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <h3 className="text-blue-300 font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle size={20} />
                  Bewertung & Abnahme-Entscheidung
                </h3>
                <p className="text-blue-200 text-sm mb-6">
                  Da alle Arbeiten zufriedenstellend abgeschlossen sind, können Sie nun den Dienstleister bewerten und die finale Entscheidung zur Abnahme treffen.
                </p>

                {/* Bewertung */}
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 mb-6">
                  <h4 className="text-purple-300 font-semibold mb-4 flex items-center gap-2">
                    <Star size={18} />
                    Bewertung der Arbeiten
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                    {renderStarRating(qualityRating, setQualityRating, 'Qualität der Arbeiten')}
                    {renderStarRating(timelinessRating, setTimelinessRating, 'Termintreue')}
                    {renderStarRating(overallRating, setOverallRating, 'Gesamtbewertung *')}
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Allgemeine Notizen zur Abnahme
                      </label>
                      <textarea
                        value={acceptanceNotes}
                        onChange={(e) => setAcceptanceNotes(e.target.value)}
                        placeholder="Beschreiben Sie den Zustand der Arbeiten..."
                        className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Ihre privaten Notizen
                      </label>
                      <textarea
                        value={contractorNotes}
                        onChange={(e) => setContractorNotes(e.target.value)}
                        placeholder="Private Notizen, die nur Sie sehen..."
                        className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <button
                    onClick={() => setAccepted(true)}
                    className={`p-6 rounded-lg border-2 transition-all ${
                      accepted === true 
                        ? 'border-green-500 bg-green-500/20 text-green-300' 
                        : 'border-gray-600 bg-gray-600/10 text-gray-300 hover:border-green-500'
                    }`}
                  >
                    <CheckCircle size={32} className="mx-auto mb-3" />
                    <div className="font-medium text-lg mb-2">Abnehmen</div>
                    <div className="text-sm opacity-75">
                      Arbeiten sind vollständig und zufriedenstellend ausgeführt
                    </div>
                  </button>
                  <button
                    onClick={() => setAccepted(false)}
                    className={`p-6 rounded-lg border-2 transition-all ${
                      accepted === false 
                        ? 'border-orange-500 bg-orange-500/20 text-orange-300' 
                        : 'border-gray-600 bg-gray-600/10 text-gray-300 hover:border-orange-500'
                    }`}
                  >
                    <AlertTriangle size={32} className="mx-auto mb-3" />
                    <div className="font-medium text-lg mb-2">Unter Vorbehalt</div>
                    <div className="text-sm opacity-75">
                      Mängel vorhanden, Nachbesserung erforderlich
                    </div>
                  </button>
                </div>

                {/* Zusammenfassung */}
                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-3">Zusammenfassung</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Checkliste:</span>
                      <div className="text-white">
                        {Object.values(checklist).filter(Boolean).length}/6 erfüllt
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400">Mängel:</span>
                      <div className="text-white">{defects.length} dokumentiert</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Fotos:</span>
                      <div className="text-white">{photos.length} aufgenommen</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Bewertung:</span>
                      <div className="text-white">{overallRating}/5 Sterne</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer mit Navigation */}
        <div className="flex items-center justify-between p-6 border-t border-white/10 flex-shrink-0 bg-[#2c3539]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Abbrechen
          </button>
          
          <div className="flex items-center gap-3">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Zurück
              </button>
            )}
            
            {/* Bei Mängeln/unvollständiger Checkliste: Abnahme unter Vorbehalt nach Schritt 2 */}
            {hasIssues && step === 2 ? (
              <div className="flex gap-3">
                <button
                  onClick={() => setShowFinalAcceptanceWarning(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                >
                  <CheckCircle size={16} />
                  Trotzdem final abnehmen
                </button>
                <button
                  onClick={() => {
                    setAccepted(false); // Automatisch auf "unter Vorbehalt" setzen
                    handleComplete();
                  }}
                  disabled={loading || !canProceedFromStep(step)}
                  className="flex items-center gap-2 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <AlertTriangle size={16} />
                  {loading ? 'Speichere...' : 'Abnahme unter Vorbehalt'}
                </button>
              </div>
            ) : step < (hasIssues ? 2 : 3) ? (
              <div className="flex flex-col items-end gap-2">
                <button
                  onClick={() => setStep(step + 1)}
                  disabled={!canProceedFromStep(step)}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Weiter
                </button>
                
                {/* Warnung bei nicht gespeicherten Mangel-Daten */}
                {step === 2 && hasUnsavedDefectData() && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <AlertTriangle size={14} className="text-red-400 flex-shrink-0" />
                    <p className="text-red-300 text-xs">
                      Sie haben nicht gespeicherte Mangel-Daten. Klicken Sie auf <span className="font-semibold">"+ Mangel hinzufügen"</span> um fortzufahren.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={handleComplete}
                disabled={loading || accepted === null}
                className="flex items-center gap-2 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={16} />
                {loading ? 'Speichere...' : 'Finale Abnahme'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handlePhotoUpload}
        className="hidden"
      />

      {/* Photo Annotation Editor */}
      {showPhotoEditor && editingPhoto && (
        <PhotoAnnotationEditor
          imageUrl={editingPhoto}
          onSave={handlePhotoAnnotationSave}
          onClose={() => {
            setShowPhotoEditor(false);
            setEditingPhoto(null);
            setEditingDefectId(null);
          }}
        />
      )}
    </div>
  );
};

export default AcceptanceModal;
