import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Phone, 
  FileText, 
  AlertCircle,
  CheckCircle,
  Eye,
  Send,
  Users,
  Clipboard
} from 'lucide-react';
import { appointmentService, formatAppointmentDateTime, type AppointmentCreate } from '../api/appointmentService';
import { getMe } from '../api/userService';

interface CreateInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  trade: any;
  selectedQuotes: any[];
  project: any;
  onCreateInspection: (inspectionData: any) => void;
}

export default function CreateInspectionModal({
  isOpen,
  onClose,
  trade,
  selectedQuotes,
  project,
  onCreateInspection
}: CreateInspectionModalProps) {
  const [formData, setFormData] = useState({
    title: `Besichtigung: ${trade?.title || ''}`,
    description: `Vor-Ort-Besichtigung für ${trade?.title || ''} im Projekt ${project?.name || ''}`,
    scheduled_date: '',
    scheduled_time_start: '14:00',
    scheduled_time_end: '16:00',
    location_address: project?.address || '',
    location_notes: '',
    contact_person: '',
    contact_phone: '',
    preparation_notes: '',
    duration_minutes: 120
  });

  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [userDataLoaded, setUserDataLoaded] = useState(false);

  // Lade Benutzerdaten beim Öffnen des Modals
  useEffect(() => {
    if (isOpen && !userDataLoaded) {
      loadUserData();
    }
  }, [isOpen, userDataLoaded]);

  const loadUserData = async () => {
    try {
      const userData = await getMe();
      if (userData) {
        // Automatisches Befüllen der Kontaktdaten
        const fullName = `${userData.first_name} ${userData.last_name}`.trim();
        setFormData(prev => ({
          ...prev,
          contact_person: fullName,
          contact_phone: userData.phone || ''
        }));
        setUserDataLoaded(true);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Benutzerdaten:', error);
      // Bei Fehler trotzdem als geladen markieren, um wiederholte Anfragen zu vermeiden
      setUserDataLoaded(true);
    }
  };

  if (!isOpen) return null;

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    // Validierung
    if (!formData.scheduled_date || !formData.scheduled_time_start || !formData.scheduled_time_end) {
      alert('Bitte füllen Sie alle Pflichtfelder aus.');
      return;
    }

    if (!formData.contact_person || !formData.contact_phone) {
      alert('Bitte geben Sie Kontaktinformationen an.');
      return;
    }

    setLoading(true);
    
    try {
      // Debug: Zeige aktuelle formData
      console.log('🎯 DEBUG: Aktuelle formData vor API-Call:', {
        contact_person: formData.contact_person,
        contact_phone: formData.contact_phone,
        preparation_notes: formData.preparation_notes,
        title: formData.title,
        location_address: formData.location_address
      });
      
      // Erstelle Appointment über neues API
      const appointmentCreateData: AppointmentCreate = {
        project_id: project.id,
        milestone_id: trade.id,
        title: formData.title,
        description: formData.description,
        appointment_type: 'INSPECTION',
        scheduled_date: formatAppointmentDateTime(formData.scheduled_date, formData.scheduled_time_start),
        duration_minutes: formData.duration_minutes,
        location: formData.location_address,
        location_details: formData.location_notes,
        // Erweiterte Besichtigungsdetails
        contact_person: formData.contact_person,
        contact_phone: formData.contact_phone,
        preparation_notes: formData.preparation_notes,
        invited_service_provider_ids: selectedQuotes.map(q => q.service_provider_id || q.user_id).filter(id => id)
      };

      // Erstelle Appointment - OHNE RETRY!
      console.log('📅 Erstelle Appointment (OHNE RETRY)...');
      console.log('📝 DEBUG: Sende folgende Kontaktdaten an Backend:', {
        contact_person: appointmentCreateData.contact_person,
        contact_phone: appointmentCreateData.contact_phone,
        preparation_notes: appointmentCreateData.preparation_notes
      });
      const createdAppointment = await appointmentService.createAppointment(appointmentCreateData);
      
      // Prüfe explizit auf erfolgreiche Antwort
      if (!createdAppointment || !createdAppointment.id) {
        throw new Error('Keine gültige Antwort vom Server erhalten');
      }
      
      console.log('✅ Appointment erfolgreich erstellt:', createdAppointment);
      
      // Rufe Parent-Handler auf - aber fange Fehler ab
      try {
        const selectedQuoteIds = selectedQuotes.map(q => q.id);
        await onCreateInspection({
          ...createdAppointment,
          selectedQuoteIds,
          invitations_count: selectedQuotes.length
        });
        console.log('✅ Parent-Handler erfolgreich aufgerufen');
      } catch (parentError) {
        console.warn('⚠️ Parent-Handler Fehler (Appointment wurde trotzdem erstellt):', parentError);
        // Appointment wurde erfolgreich erstellt, auch wenn Parent-Handler fehlschlägt
      }
      
      // Erfolgreich - Modal schließen
      setLoading(false);
      onClose();
        
    } catch (error: any) {
      console.error('❌ Fehler beim Erstellen des Termins:', error);
      
      // Bestimme Fehlertyp
      let errorMessage = 'Unbekannter Fehler';
      
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        errorMessage = 'Zeitüberschreitung - Die Anfrage dauert zu lange.';
      } else if (error.response?.status === 422) {
        errorMessage = 'Ungültige Daten - Bitte überprüfen Sie Ihre Eingaben.';
      } else if (error.response?.status === 400) {
        errorMessage = error.response?.data?.detail || 'Ungültige Anfrage.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server-Fehler - Bitte versuchen Sie es später erneut.';
      } else {
        errorMessage = error.response?.data?.detail || error.message || 'Unbekannter Fehler';
      }
      
      alert(`Fehler beim Erstellen des Termins: ${errorMessage}`);
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return amount.toLocaleString('de-DE', { style: 'currency', currency });
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="p-3 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <Eye size={24} className="text-white" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Besichtigung planen</h3>
        <p className="text-gray-400">
          Planen Sie eine Vor-Ort-Besichtigung mit {selectedQuotes.length} ausgewählten Dienstleistern
        </p>
      </div>

      {/* Ausgewählte Angebote */}
      <div className="bg-white/5 rounded-lg p-4">
        <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
          <Users size={16} className="text-[#ffbd59]" />
          Eingeladene Dienstleister ({selectedQuotes.length})
        </h4>
        
        <div className="space-y-2">
          {selectedQuotes.map((quote: any, index: number) => (
            <div key={quote.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div>
                <div className="text-white font-medium">{quote.company_name || quote.title}</div>
                <div className="text-sm text-gray-400">{quote.contact_person || 'Kontakt nicht verfügbar'}</div>
              </div>
              <div className="text-right">
                <div className="text-[#ffbd59] font-bold">
                  {formatCurrency(quote.total_amount, quote.currency)}
                </div>
                <div className="text-sm text-gray-400">{quote.estimated_duration} Tage</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grundinformationen */}
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Titel der Besichtigung *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
            placeholder="z.B. Besichtigung: Elektroinstallation"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Beschreibung
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={3}
            className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
            placeholder="Zusätzliche Informationen zur Besichtigung..."
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => setCurrentStep(2)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-white rounded-lg font-semibold hover:from-[#ffa726] hover:to-[#ff9800] transition-all duration-300"
        >
          Weiter zu Terminplanung
          <Calendar size={16} />
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="p-3 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <Calendar size={24} className="text-white" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Terminplanung</h3>
        <p className="text-gray-400">
          Legen Sie Datum, Uhrzeit und Ort der Besichtigung fest
        </p>
      </div>

      {/* Datum und Zeit */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Datum *
          </label>
          <input
            type="date"
            value={formData.scheduled_date}
            onChange={(e) => handleInputChange('scheduled_date', e.target.value)}
            min={getTomorrowDate()}
            className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Startzeit *
          </label>
          <input
            type="time"
            value={formData.scheduled_time_start}
            onChange={(e) => handleInputChange('scheduled_time_start', e.target.value)}
            className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Endzeit *
          </label>
          <input
            type="time"
            value={formData.scheduled_time_end}
            onChange={(e) => handleInputChange('scheduled_time_end', e.target.value)}
            className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
          />
        </div>
      </div>

      {/* Ort */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Adresse *
          </label>
          <input
            type="text"
            value={formData.location_address}
            onChange={(e) => handleInputChange('location_address', e.target.value)}
            className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
            placeholder="Vollständige Adresse der Besichtigung"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Zusätzliche Ortsangaben
          </label>
          <textarea
            value={formData.location_notes}
            onChange={(e) => handleInputChange('location_notes', e.target.value)}
            rows={2}
            className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
            placeholder="z.B. Eingang über Hof, Parkplätze verfügbar..."
          />
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => setCurrentStep(1)}
          className="px-6 py-3 text-gray-400 hover:text-white transition-colors"
        >
          Zurück
        </button>
        <button
          onClick={() => setCurrentStep(3)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-white rounded-lg font-semibold hover:from-[#ffa726] hover:to-[#ff9800] transition-all duration-300"
        >
          Weiter zu Kontaktdaten
          <User size={16} />
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="p-3 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <User size={24} className="text-white" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Kontaktinformationen</h3>
        <p className="text-gray-400">
          Geben Sie Ihre Kontaktdaten für die Dienstleister an
        </p>
      </div>

      {/* Kontaktdaten */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Ansprechpartner *
          </label>
          <input
            type="text"
            value={formData.contact_person}
            onChange={(e) => handleInputChange('contact_person', e.target.value)}
            className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
            placeholder="Ihr Name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Telefonnummer *
          </label>
          <input
            type="tel"
            value={formData.contact_phone}
            onChange={(e) => handleInputChange('contact_phone', e.target.value)}
            className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
            placeholder="+41 XX XXX XX XX"
          />
        </div>
      </div>

      {/* Vorbereitungshinweise */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Vorbereitungshinweise für Dienstleister
        </label>
        <textarea
          value={formData.preparation_notes}
          onChange={(e) => handleInputChange('preparation_notes', e.target.value)}
          rows={3}
          className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
          placeholder="z.B. Bitte Werkzeug mitbringen, Sicherheitsschuhe erforderlich, Zugang über..."
        />
      </div>

      {/* Zusammenfassung */}
      <div className="bg-white/5 rounded-lg p-4">
        <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
          <Clipboard size={16} className="text-[#ffbd59]" />
          Zusammenfassung
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Datum:</span>
            <div className="text-white">{formData.scheduled_date || '—'}</div>
          </div>
          <div>
            <span className="text-gray-400">Zeit:</span>
            <div className="text-white">
              {formData.scheduled_time_start} - {formData.scheduled_time_end}
            </div>
          </div>
          <div>
            <span className="text-gray-400">Dienstleister:</span>
            <div className="text-white">{selectedQuotes.length} eingeladen</div>
          </div>
          <div>
            <span className="text-gray-400">Kontakt:</span>
            <div className="text-white">{formData.contact_person || '—'}</div>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => setCurrentStep(2)}
          className="px-6 py-3 text-gray-400 hover:text-white transition-colors"
        >
          Zurück
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <Send size={16} />
          )}
          Besichtigung erstellen & Einladungen versenden
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#2c3539] rounded-2xl shadow-2xl border border-white/20 max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-xl">
              <Eye size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Neue Besichtigung</h2>
              <p className="text-sm text-gray-400">Schritt {currentStep} von 3</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 bg-white/5">
          <div className="flex items-center justify-between mb-2">
            <div className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-[#ffbd59]' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= 1 ? 'bg-[#ffbd59]' : 'bg-gray-600'
              }`}>
                {currentStep > 1 ? <CheckCircle size={16} className="text-white" /> : '1'}
              </div>
              <span className="text-sm font-medium">Grunddaten</span>
            </div>
            <div className={`flex items-center gap-2 ${currentStep >= 2 ? 'text-[#ffbd59]' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= 2 ? 'bg-[#ffbd59]' : 'bg-gray-600'
              }`}>
                {currentStep > 2 ? <CheckCircle size={16} className="text-white" /> : '2'}
              </div>
              <span className="text-sm font-medium">Terminplanung</span>
            </div>
            <div className={`flex items-center gap-2 ${currentStep >= 3 ? 'text-[#ffbd59]' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= 3 ? 'bg-[#ffbd59]' : 'bg-gray-600'
              }`}>
                3
              </div>
              <span className="text-sm font-medium">Abschluss</span>
            </div>
          </div>
          <div className="w-full bg-gray-600 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-[#ffbd59] to-[#ffa726] h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="p-6">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
          </div>
        </div>
      </div>
    </div>
  );
} 
