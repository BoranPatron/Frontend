import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateMe, getMe } from '../api/userService';
import AddressAutocomplete from '../components/AddressAutocomplete';
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  MapPin, 
  Save, 
  AlertCircle, 
  CheckCircle, 
  Eye, 
  EyeOff,
  Globe,
  Calendar,
  Shield,
  Bell,
  Palette
} from 'lucide-react';

interface ProfileData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  company_name: string;
  company_address: string;
  company_uid: string;
  company_phone: string;
  company_website: string;
  bio: string;
  region: string;
  languages: string;
  // Adressfelder für Autocomplete
  address_street: string;
  address_zip: string;
  address_city: string;
  address_country: string;
  // Einstellungen
  language_preference: string;
  marketing_consent: boolean;
  email_notifications: boolean;
}

export default function Profile() {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<ProfileData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company_name: '',
    company_address: '',
    company_uid: '',
    company_phone: '',
    company_website: '',
    bio: '',
    region: '',
    languages: '',
    address_street: '',
    address_zip: '',
    address_city: '',
    address_country: 'Deutschland',
    language_preference: 'de',
    marketing_consent: false,
    email_notifications: true
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'personal' | 'company' | 'settings'>('personal');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const userData = await getMe();
      
      // Adresse aus company_address extrahieren wenn vorhanden
      let addressParts = { street: '', zip: '', city: '', country: 'Deutschland' };
      if (userData.company_address) {
        const parts = userData.company_address.split(', ');
        addressParts.street = parts[0] || '';
        if (parts[1]) {
          const zipCityMatch = parts[1].match(/^(\d+)\s+(.+)$/);
          if (zipCityMatch) {
            addressParts.zip = zipCityMatch[1];
            addressParts.city = zipCityMatch[2];
          } else {
            addressParts.city = parts[1];
          }
        }
        addressParts.country = parts[2] || 'Deutschland';
      }

      setProfileData({
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        company_name: userData.company_name || '',
        company_address: userData.company_address || '',
        company_uid: userData.company_uid || '',
        company_phone: userData.company_phone || '',
        company_website: userData.company_website || '',
        bio: userData.bio || '',
        region: userData.region || '',
        languages: userData.languages || '',
        address_street: addressParts.street,
        address_zip: addressParts.zip,
        address_city: addressParts.city,
        address_country: addressParts.country,
        language_preference: userData.language_preference || 'de',
        marketing_consent: userData.marketing_consent || false,
        email_notifications: userData.email_notifications !== false
      });
    } catch (error) {
      console.error('❌ Fehler beim Laden des Profils:', error);
      setMessage({ type: 'error', text: 'Fehler beim Laden der Profildaten' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof ProfileData, value: string | boolean) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddressChange = (addressData: any) => {
    setProfileData(prev => ({
      ...prev,
      address_street: addressData.address_street,
      address_zip: addressData.address_zip,
      address_city: addressData.address_city,
      address_country: addressData.address_country || prev.address_country
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    
    try {
      // Vollständige Adresse zusammenstellen
      const addressParts = [
        profileData.address_street,
        [profileData.address_zip, profileData.address_city].filter(Boolean).join(' '),
        profileData.address_country
      ].filter(Boolean);
      
      const updateData = {
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        phone: profileData.phone,
        company_name: profileData.company_name,
        company_address: addressParts.join(', ') || null,
        company_uid: profileData.company_uid || null,
        company_phone: profileData.company_phone,
        company_website: profileData.company_website,
        bio: profileData.bio,
        region: profileData.region,
        languages: profileData.languages,
        language_preference: profileData.language_preference,
        marketing_consent: profileData.marketing_consent,
        // Email-Benachrichtigungen können hier erweitert werden
        consent_fields: {
          marketing_consent: profileData.marketing_consent,
          email_notifications: profileData.email_notifications
        }
      };

      await updateMe(updateData);
      setMessage({ type: 'success', text: 'Profil erfolgreich gespeichert!' });
      
      // Profil nach dem Speichern neu laden
      setTimeout(() => {
        loadProfile();
      }, 1000);
    } catch (error) {
      console.error('❌ Fehler beim Speichern:', error);
      setMessage({ type: 'error', text: 'Fehler beim Speichern der Änderungen' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ffbd59] mx-auto mb-4"></div>
          <p className="text-white">Lade Profildaten...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Profil bearbeiten</h1>
          <p className="text-gray-300">Verwalten Sie Ihre persönlichen Daten und Einstellungen</p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-2 border border-white/20">
            {[
              { id: 'personal', label: 'Persönlich', icon: User },
              { id: 'company', label: 'Unternehmen', icon: Building2 },
              { id: 'settings', label: 'Einstellungen', icon: Shield }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`
                  flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300
                  ${activeTab === id 
                    ? 'bg-[#ffbd59] text-[#2c3539] shadow-lg' 
                    : 'text-white hover:bg-white/10'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl">
          {/* Success/Error Message */}
          {message && (
            <div className={`
              mb-6 p-4 rounded-xl flex items-center gap-3
              ${message.type === 'success' 
                ? 'bg-green-500/20 border border-green-500/30 text-green-300' 
                : 'bg-red-500/20 border border-red-500/30 text-red-300'
              }
            `}>
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* Personal Tab */}
          {activeTab === 'personal' && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <User className="w-6 h-6 text-[#ffbd59]" />
                Persönliche Informationen
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-3">
                    Vorname *
                  </label>
                  <input
                    type="text"
                    value={profileData.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 text-white rounded-xl focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent transition-all duration-200"
                    placeholder="Ihr Vorname"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-3">
                    Nachname *
                  </label>
                  <input
                    type="text"
                    value={profileData.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 text-white rounded-xl focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent transition-all duration-200"
                    placeholder="Ihr Nachname"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-3">
                    E-Mail-Adresse
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={profileData.email}
                      disabled
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 text-gray-300 rounded-xl cursor-not-allowed"
                    />
                    <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">E-Mail-Adresse kann nicht geändert werden</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-3">
                    Telefonnummer
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 text-white rounded-xl focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent transition-all duration-200 pl-12"
                      placeholder="+49 123 456789"
                    />
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-3">
                  Über mich
                </label>
                <textarea
                  value={profileData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 text-white rounded-xl focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent transition-all duration-200 resize-none"
                  placeholder="Erzählen Sie etwas über sich..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-3">
                    Region
                  </label>
                  <input
                    type="text"
                    value={profileData.region}
                    onChange={(e) => handleInputChange('region', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 text-white rounded-xl focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent transition-all duration-200"
                    placeholder="z.B. München, Bayern"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-3">
                    Sprachen
                  </label>
                  <input
                    type="text"
                    value={profileData.languages}
                    onChange={(e) => handleInputChange('languages', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 text-white rounded-xl focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent transition-all duration-200"
                    placeholder="z.B. Deutsch, Englisch, Französisch"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Company Tab */}
          {activeTab === 'company' && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Building2 className="w-6 h-6 text-[#ffbd59]" />
                Unternehmensinformationen
              </h3>

              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-3">
                  Firmenname
                </label>
                <input
                  type="text"
                  value={profileData.company_name}
                  onChange={(e) => handleInputChange('company_name', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 text-white rounded-xl focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent transition-all duration-200"
                  placeholder="Name Ihres Unternehmens"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-3">
                  UID-Nummer
                </label>
                <input
                  type="text"
                  value={profileData.company_uid}
                  onChange={(e) => handleInputChange('company_uid', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 text-white rounded-xl focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent transition-all duration-200"
                  placeholder="z.B. DE123456789"
                />
                <p className="text-xs text-gray-400 mt-2">
                  Umsatzsteuer-Identifikationsnummer (optional)
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-3">
                  Firmenadresse
                </label>
                <AddressAutocomplete
                  placeholder="Firmenadresse eingeben..."
                  value={{
                    address_street: profileData.address_street,
                    address_zip: profileData.address_zip,
                    address_city: profileData.address_city,
                    address_country: profileData.address_country
                  }}
                  onChange={handleAddressChange}
                />
                <p className="text-xs text-gray-400 mt-2">
                  Diese Adresse wird für Rechnungen und offizielle Dokumente verwendet.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-3">
                    Firmen-Telefon
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={profileData.company_phone}
                      onChange={(e) => handleInputChange('company_phone', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 text-white rounded-xl focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent transition-all duration-200 pl-12"
                      placeholder="+49 123 456789"
                    />
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-3">
                    Website
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={profileData.company_website}
                      onChange={(e) => handleInputChange('company_website', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 text-white rounded-xl focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent transition-all duration-200 pl-12"
                      placeholder="https://ihre-website.de"
                    />
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Shield className="w-6 h-6 text-[#ffbd59]" />
                Einstellungen & Präferenzen
              </h3>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-200 mb-3">
                    Sprache
                  </label>
                  <select
                    value={profileData.language_preference}
                    onChange={(e) => handleInputChange('language_preference', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 text-white rounded-xl focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent transition-all duration-200"
                  >
                    <option value="de">Deutsch</option>
                    <option value="en">English</option>
                    <option value="fr">Français</option>
                  </select>
                </div>

                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Bell className="w-5 h-5 text-[#ffbd59]" />
                    Benachrichtigungen
                  </h4>

                  <div className="space-y-3">
                    <label className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700 hover:bg-gray-800/70 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-white font-medium">E-Mail-Benachrichtigungen</p>
                          <p className="text-gray-400 text-sm">Erhalten Sie Updates per E-Mail</p>
                        </div>
                      </div>
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={profileData.email_notifications}
                          onChange={(e) => handleInputChange('email_notifications', e.target.checked)}
                          className="sr-only"
                        />
                        <div className={`w-12 h-6 rounded-full transition-colors ${
                          profileData.email_notifications ? 'bg-[#ffbd59]' : 'bg-gray-600'
                        }`}>
                          <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                            profileData.email_notifications ? 'translate-x-6' : 'translate-x-0.5'
                          } mt-0.5`}></div>
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700 hover:bg-gray-800/70 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <Palette className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-white font-medium">Marketing-E-Mails</p>
                          <p className="text-gray-400 text-sm">Neuigkeiten und Angebote erhalten</p>
                        </div>
                      </div>
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={profileData.marketing_consent}
                          onChange={(e) => handleInputChange('marketing_consent', e.target.checked)}
                          className="sr-only"
                        />
                        <div className={`w-12 h-6 rounded-full transition-colors ${
                          profileData.marketing_consent ? 'bg-[#ffbd59]' : 'bg-gray-600'
                        }`}>
                          <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                            profileData.marketing_consent ? 'translate-x-6' : 'translate-x-0.5'
                          } mt-0.5`}></div>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end pt-8 border-t border-white/10 mt-8">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`
                flex items-center gap-3 px-8 py-3 rounded-xl font-semibold transition-all duration-300 transform
                ${isSaving
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                  : 'bg-[#ffbd59] text-[#2c3539] hover:bg-[#ffa726] hover:scale-105 shadow-lg hover:shadow-xl'
                }
              `}
            >
              {isSaving ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400"></div>
              ) : (
                <Save className="w-5 h-5" />
              )}
              {isSaving ? 'Speichere...' : 'Änderungen speichern'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
