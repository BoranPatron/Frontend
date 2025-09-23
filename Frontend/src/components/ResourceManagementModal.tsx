import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Users,
  Calendar,
  MapPin,
  Clock,
  Euro,
  Tag,
  Plus,
  Trash2,
  Save,
  AlertCircle,
  ChevronDown,
  Wrench,
  Award,
  Check,
  Settings
} from 'lucide-react';
import { resourceService, type Resource } from '../api/resourceService';
import { useAuth } from '../context/AuthContext';
import AddressAutocomplete from './AddressAutocomplete';

interface ResourceManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResourceCreated?: (resource: Resource) => void;
  editResource?: Resource | null;
}

// Kategorien - sollten mit den Ausschreibungskategorien übereinstimmen
const RESOURCE_CATEGORIES = [
  { value: 'rohbau', label: 'Rohbau', icon: '🏗️' },
  { value: 'elektro', label: 'Elektroinstallation', icon: '⚡' },
  { value: 'sanitaer', label: 'Sanitär', icon: '🚿' },
  { value: 'heizung', label: 'Heizung/Klima', icon: '🔥' },
  { value: 'trockenbau', label: 'Trockenbau', icon: '🧱' },
  { value: 'maler', label: 'Malerarbeiten', icon: '🎨' },
  { value: 'fliesen', label: 'Fliesenleger', icon: '◻' },
  { value: 'dachdecker', label: 'Dachdeckerarbeiten', icon: '🏠' },
  { value: 'fenster', label: 'Fenster & Türen', icon: '🪟' },
  { value: 'garten', label: 'Garten- & Landschaftsbau', icon: '🌳' },
  { value: 'sonstiges', label: 'Sonstige', icon: '📋' }
];

const ResourceManagementModal: React.FC<ResourceManagementModalProps> = ({
  isOpen,
  onClose,
  onResourceCreated,
  editResource
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<Resource>>({
    service_provider_id: user?.id,
    start_date: '',
    end_date: '',
    person_count: 1,
    daily_hours: 8,
    category: '',
    subcategory: '',
    address_street: '',
    address_city: '',
    address_postal_code: '',
    address_country: 'Deutschland',
    hourly_rate: undefined,
    daily_rate: undefined,
    currency: 'EUR',
    description: '',
    skills: [],
    equipment: [],
    status: 'available',
    visibility: 'public'
  });

  // Skills und Equipment Input
  const [skillInput, setSkillInput] = useState('');
  const [equipmentInput, setEquipmentInput] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (editResource) {
      setFormData({
        ...editResource,
        start_date: editResource.start_date?.split('T')[0] || '',
        end_date: editResource.end_date?.split('T')[0] || ''
      });
      if (editResource.skills?.length || editResource.equipment?.length) {
        setShowAdvanced(true);
      }
    }
  }, [editResource]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validierung
      if (!formData.start_date || !formData.end_date) {
        throw new Error('Bitte geben Sie einen Zeitraum an');
      }
      if (!formData.category) {
        throw new Error('Bitte wählen Sie eine Kategorie');
      }
      if (!formData.person_count || formData.person_count < 1) {
        throw new Error('Bitte geben Sie mindestens eine Person an');
      }

      // Berechne total_hours
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const totalHours = daysDiff * (formData.daily_hours || 8) * formData.person_count;

      const resourceData: Resource = {
        ...formData as Resource,
        total_hours: totalHours,
        service_provider_id: user?.id || 0
      };

      let result: Resource;
      if (editResource?.id) {
        result = await resourceService.updateResource(editResource.id, resourceData);
      } else {
        result = await resourceService.createResource(resourceData);
      }

      setSuccess(true);
      setTimeout(() => {
        onResourceCreated?.(result);
        onClose();
        resetForm();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Fehler beim Speichern der Ressource');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      service_provider_id: user?.id,
      start_date: '',
      end_date: '',
      person_count: 1,
      daily_hours: 8,
      category: '',
      subcategory: '',
      address_street: '',
      address_city: '',
      address_postal_code: '',
      address_country: 'Deutschland',
      hourly_rate: undefined,
      daily_rate: undefined,
      currency: 'EUR',
      description: '',
      skills: [],
      equipment: [],
      status: 'available',
      visibility: 'public'
    });
    setSkillInput('');
    setEquipmentInput('');
    setShowAdvanced(false);
    setError(null);
    setSuccess(false);
  };

  const addSkill = () => {
    if (skillInput.trim()) {
      setFormData(prev => ({
        ...prev,
        skills: [...(prev.skills || []), skillInput.trim()]
      }));
      setSkillInput('');
    }
  };

  const removeSkill = (index: number) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills?.filter((_, i) => i !== index) || []
    }));
  };

  const addEquipment = () => {
    if (equipmentInput.trim()) {
      setFormData(prev => ({
        ...prev,
        equipment: [...(prev.equipment || []), equipmentInput.trim()]
      }));
      setEquipmentInput('');
    }
  };

  const removeEquipment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      equipment: prev.equipment?.filter((_, i) => i !== index) || []
    }));
  };

  const handleAddressSelect = (address: any) => {
    setFormData(prev => ({
      ...prev,
      address_street: address.street || '',
      address_city: address.city || '',
      address_postal_code: address.postal_code || '',
      address_country: address.country || 'Deutschland',
      latitude: address.latitude,
      longitude: address.longitude
    }));
  };

  const calculateTotalDays = () => {
    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return days > 0 ? days : 0;
    }
    return 0;
  };

  const calculateTotalHours = () => {
    const days = calculateTotalDays();
    return days * (formData.daily_hours || 8) * (formData.person_count || 1);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-[#1a1a1a] rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#ffbd59] to-[#f59e0b] p-6 relative">
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            <div className="flex items-center space-x-3">
              <Users className="w-8 h-8 text-white" />
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {editResource ? 'Ressource bearbeiten' : 'Neue Ressource erfassen'}
                </h2>
                <p className="text-white/80 mt-1">
                  Geben Sie Ihre verfügbaren Ressourcen an
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {/* Success Message */}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-green-500/10 border border-green-500 rounded-lg p-4 flex items-center space-x-3"
              >
                <Check className="w-5 h-5 text-green-500" />
                <span className="text-green-400">
                  Ressource wurde erfolgreich {editResource ? 'aktualisiert' : 'erstellt'}!
                </span>
              </motion.div>
            )}

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/10 border border-red-500 rounded-lg p-4 flex items-center space-x-3"
              >
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span className="text-red-400">{error}</span>
              </motion.div>
            )}

            {/* Zeitraum */}
            <div className="bg-[#2a2a2a] rounded-xl p-5">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-[#ffbd59]" />
                Zeitraum
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Von</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    className="w-full bg-[#333] text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#ffbd59]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Bis</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    min={formData.start_date}
                    className="w-full bg-[#333] text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#ffbd59]"
                    required
                  />
                </div>
              </div>
              {calculateTotalDays() > 0 && (
                <div className="mt-3 text-sm text-gray-400">
                  Gesamt: {calculateTotalDays()} {calculateTotalDays() === 1 ? 'Tag' : 'Tage'}
                </div>
              )}
            </div>

            {/* Ressourcen-Details */}
            <div className="bg-[#2a2a2a] rounded-xl p-5">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-[#ffbd59]" />
                Ressourcen-Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Anzahl Personen</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.person_count}
                    onChange={(e) => setFormData(prev => ({ ...prev, person_count: parseInt(e.target.value) }))}
                    className="w-full bg-[#333] text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#ffbd59]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Stunden pro Tag</label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    step="0.5"
                    value={formData.daily_hours}
                    onChange={(e) => setFormData(prev => ({ ...prev, daily_hours: parseFloat(e.target.value) }))}
                    className="w-full bg-[#333] text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#ffbd59]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Gesamtstunden</label>
                  <div className="bg-[#333] text-[#ffbd59] font-semibold rounded-lg px-4 py-2.5">
                    {calculateTotalHours()} h
                  </div>
                </div>
              </div>
            </div>

            {/* Kategorie */}
            <div className="bg-[#2a2a2a] rounded-xl p-5">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Tag className="w-5 h-5 mr-2 text-[#ffbd59]" />
                Kategorie
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {RESOURCE_CATEGORIES.map(category => (
                  <button
                    key={category.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, category: category.value }))}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      formData.category === category.value
                        ? 'border-[#ffbd59] bg-[#ffbd59]/10'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    <div className="text-2xl mb-1">{category.icon}</div>
                    <div className="text-sm text-white">{category.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Standort */}
            <div className="bg-[#2a2a2a] rounded-xl p-5">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-[#ffbd59]" />
                Standort
              </h3>
              <AddressAutocomplete
                value={{
                  address_street: formData.address_street || '',
                  address_zip: formData.address_postal_code || '',
                  address_city: formData.address_city || '',
                  address_country: formData.address_country || 'Deutschland'
                }}
                onChange={(address) => {
                  setFormData(prev => ({
                    ...prev,
                    address_street: address.address_street,
                    address_city: address.address_city,
                    address_postal_code: address.address_zip,
                    address_country: address.address_country || 'Deutschland'
                  }));
                }}
                placeholder="Straße, PLZ, Stadt eingeben..."
                className="mb-4"
              />
              {formData.latitude && formData.longitude && (
                <div className="text-sm text-gray-400 mt-2">
                  Koordinaten: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                </div>
              )}
            </div>

            {/* Preise */}
            <div className="bg-[#2a2a2a] rounded-xl p-5">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Euro className="w-5 h-5 mr-2 text-[#ffbd59]" />
                Preisgestaltung (optional)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Stundensatz (€)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.hourly_rate || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      hourly_rate: e.target.value ? parseFloat(e.target.value) : undefined 
                    }))}
                    placeholder="z.B. 45.00"
                    className="w-full bg-[#333] text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#ffbd59]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Tagessatz (€)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.daily_rate || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      daily_rate: e.target.value ? parseFloat(e.target.value) : undefined 
                    }))}
                    placeholder="z.B. 360.00"
                    className="w-full bg-[#333] text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#ffbd59]"
                  />
                </div>
              </div>
            </div>

            {/* Erweiterte Optionen */}
            <div className="bg-[#2a2a2a] rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full p-5 flex items-center justify-between hover:bg-[#333] transition-colors"
              >
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <Settings className="w-5 h-5 mr-2 text-[#ffbd59]" />
                  Erweiterte Optionen
                </h3>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${
                  showAdvanced ? 'rotate-180' : ''
                }`} />
              </button>
              
              {showAdvanced && (
                <div className="p-5 pt-0 space-y-4">
                  {/* Beschreibung */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Beschreibung</label>
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Zusätzliche Informationen zu Ihren Ressourcen..."
                      rows={3}
                      className="w-full bg-[#333] text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#ffbd59]"
                    />
                  </div>

                  {/* Skills */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2 flex items-center">
                      <Award className="w-4 h-4 mr-1" />
                      Fähigkeiten & Zertifikate
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                        placeholder="z.B. Schweißerschein, Kranführerschein..."
                        className="flex-1 bg-[#333] text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#ffbd59]"
                      />
                      <button
                        type="button"
                        onClick={addSkill}
                        className="px-4 py-2.5 bg-[#ffbd59] text-black rounded-lg hover:bg-[#f59e0b] transition-colors"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.skills?.map((skill, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-[#333] text-white rounded-full text-sm"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => removeSkill(index)}
                            className="hover:text-red-400"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Equipment */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2 flex items-center">
                      <Wrench className="w-4 h-4 mr-1" />
                      Verfügbare Geräte & Werkzeuge
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={equipmentInput}
                        onChange={(e) => setEquipmentInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addEquipment())}
                        placeholder="z.B. Kran, Betonmischer..."
                        className="flex-1 bg-[#333] text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#ffbd59]"
                      />
                      <button
                        type="button"
                        onClick={addEquipment}
                        className="px-4 py-2.5 bg-[#ffbd59] text-black rounded-lg hover:bg-[#f59e0b] transition-colors"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.equipment?.map((item, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-[#333] text-white rounded-full text-sm"
                        >
                          {item}
                          <button
                            type="button"
                            onClick={() => removeEquipment(index)}
                            className="hover:text-red-400"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Status & Sichtbarkeit */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          status: e.target.value as Resource['status'] 
                        }))}
                        className="w-full bg-[#333] text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#ffbd59]"
                      >
                        <option value="available">Verfügbar</option>
                        <option value="reserved">Reserviert</option>
                        <option value="allocated">Zugeteilt</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Sichtbarkeit</label>
                      <select
                        value={formData.visibility}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          visibility: e.target.value as Resource['visibility'] 
                        }))}
                        className="w-full bg-[#333] text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#ffbd59]"
                      >
                        <option value="public">Öffentlich</option>
                        <option value="private">Privat</option>
                        <option value="restricted">Eingeschränkt</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={loading || success}
                className="px-6 py-2.5 bg-[#ffbd59] text-black rounded-lg hover:bg-[#f59e0b] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent" />
                    <span>Speichern...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{editResource ? 'Aktualisieren' : 'Ressource erstellen'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ResourceManagementModal;