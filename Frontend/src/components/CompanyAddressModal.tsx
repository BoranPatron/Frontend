import React, { useState } from 'react';
import { Building2, MapPin, X, ArrowRight, Upload, Image as ImageIcon } from 'lucide-react';
import AddressAutocomplete from './AddressAutocomplete';

interface CompanyAddressModalProps {
  onComplete: (companyData: { 
    company_name: string; 
    company_address: string; 
    company_uid?: string;
    company_logo?: string;
    company_logo_advertising_consent?: boolean;
  }) => void;
  onSkip: () => void;
  userRole: 'bautraeger' | 'dienstleister';
}

export default function CompanyAddressModal({ onComplete, onSkip, userRole }: CompanyAddressModalProps) {
  const [companyName, setCompanyName] = useState('');
  const [companyUid, setCompanyUid] = useState('');
  const [addressData, setAddressData] = useState({
    address_street: '',
    address_zip: '',
    address_city: '',
    address_country: 'Deutschland'
  });
  const [companyLogo, setCompanyLogo] = useState<File | null>(null);
  const [companyLogoPreview, setCompanyLogoPreview] = useState<string | null>(null);
  const [advertisingConsent, setAdvertisingConsent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validiere Dateityp
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Ungültiger Dateityp. Erlaubt sind: JPG, PNG, SVG, WEBP');
      return;
    }

    // Validiere Dateigröße (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Datei ist zu groß. Maximal 5MB erlaubt.');
      return;
    }

    setCompanyLogo(file);

    // Erstelle Vorschau
    const reader = new FileReader();
    reader.onloadend = () => {
      setCompanyLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setCompanyLogo(null);
    setCompanyLogoPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) return;
    
    setIsLoading(true);
    
    try {
      // Vollständige Adresse zusammenstellen
      const addressParts = [
        addressData.address_street,
        [addressData.address_zip, addressData.address_city].filter(Boolean).join(' '),
        addressData.address_country
      ].filter(Boolean);
      
      const fullAddress = addressParts.join(', ');
      
      let logoPath: string | undefined;
      
      // Upload Logo falls vorhanden
      if (companyLogo) {
        const { uploadCompanyLogo } = await import('../api/userService');
        const response = await uploadCompanyLogo(companyLogo);
        logoPath = response.file_path;
      }
      
      await onComplete({
        company_name: companyName.trim(),
        company_address: fullAddress,
        company_uid: companyUid.trim() || undefined,
        company_logo: logoPath,
        company_logo_advertising_consent: advertisingConsent
      });
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      alert('Fehler beim Speichern der Daten. Bitte versuchen Sie es erneut.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    setIsLoading(true);
    await onSkip();
    setIsLoading(false);
  };

  const roleText = userRole === 'bautraeger' ? 'Bauträger/Bauherr' : 'Dienstleister';
  const RoleIcon = userRole === 'bautraeger' ? Building2 : Building2;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10000] p-2 sm:p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl sm:rounded-3xl max-w-sm sm:max-w-lg lg:max-w-2xl w-full border border-white/20 shadow-2xl max-h-[90vh] flex flex-col">
        <div className="p-4 sm:p-6 lg:p-8 pb-2 sm:pb-4 flex-shrink-0">
          <div className="text-center mb-6 sm:mb-8">
            <div className="flex items-center justify-center mb-3 sm:mb-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[#ffbd59]/20 flex items-center justify-center">
                <RoleIcon className="w-6 h-6 sm:w-8 sm:h-8 text-[#ffbd59]" />
              </div>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2">
              Firmeninformationen
            </h2>
          </div>
        </div>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Firmenname */}
          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-2 sm:mb-3">
              Firmenname *
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-800 border border-gray-600 text-white rounded-lg sm:rounded-xl focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent transition-all duration-200 placeholder-gray-400 text-sm sm:text-base"
              placeholder="z.B. Mustermann Bau GmbH"
              required
            />
          </div>

          {/* UID-Nummer */}
          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-2 sm:mb-3">
              UID-Nummer
            </label>
            <input
              type="text"
              value={companyUid}
              onChange={(e) => setCompanyUid(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-800 border border-gray-600 text-white rounded-lg sm:rounded-xl focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent transition-all duration-200 placeholder-gray-400 text-sm sm:text-base"
              placeholder="z.B. DE123456789"
            />
            <p className="text-xs text-gray-400 mt-2">
              Umsatzsteuer-Identifikationsnummer (optional)
            </p>
          </div>

          {/* Firmenadresse */}
          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-3">
              Firmenadresse
            </label>
            <AddressAutocomplete
              placeholder="Firmenadresse eingeben..."
              value={addressData}
              onChange={(next) => setAddressData({
                address_street: next.address_street,
                address_zip: next.address_zip,
                address_city: next.address_city,
                address_country: next.address_country || 'Schweiz'
              })}
              className=""
            />
            <p className="text-xs text-gray-400 mt-2">
              Diese Adresse wird für Rechnungen und offizielle Dokumente verwendet.
            </p>
          </div>

          {/* Firmenlogo Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-3">
              Firmenlogo (optional)
            </label>
            
            {companyLogoPreview ? (
              <div className="relative w-full h-40 bg-gray-800/50 rounded-xl border-2 border-gray-600 overflow-hidden">
                <img 
                  src={companyLogoPreview} 
                  alt="Logo Vorschau" 
                  className="w-full h-full object-contain p-4"
                />
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="absolute top-2 right-2 p-2 bg-red-500/80 hover:bg-red-600 rounded-full transition-colors duration-200"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-40 bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-600 hover:border-[#ffbd59] cursor-pointer transition-all duration-200 group">
                <div className="flex flex-col items-center justify-center py-6">
                  <div className="w-12 h-12 mb-3 rounded-full bg-[#ffbd59]/20 flex items-center justify-center group-hover:bg-[#ffbd59]/30 transition-all duration-200">
                    <Upload className="w-6 h-6 text-[#ffbd59]" />
                  </div>
                  <p className="text-sm text-gray-300 font-semibold mb-1">Logo hochladen</p>
                  <p className="text-xs text-gray-400">JPG, PNG, SVG, WEBP (max. 5MB)</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/jpg,image/png,image/svg+xml,image/webp"
                  onChange={handleLogoChange}
                />
              </label>
            )}
            
            <p className="text-xs text-gray-400 mt-2">
              Unterstützte Formate: JPG, PNG, SVG, WEBP (max. 5MB)
            </p>
          </div>

          {/* Werbeeinwilligung Checkbox */}
          <div className="bg-gradient-to-br from-[#ffbd59]/10 to-[#ffa726]/5 rounded-xl p-4 border border-[#ffbd59]/20">
            <label className="flex items-start cursor-pointer group">
              <input
                type="checkbox"
                checked={advertisingConsent}
                onChange={(e) => setAdvertisingConsent(e.target.checked)}
                className="mt-1 w-5 h-5 rounded border-gray-500 bg-gray-700 text-[#ffbd59] focus:ring-2 focus:ring-[#ffbd59] focus:ring-offset-0 cursor-pointer transition-all duration-200"
              />
              <div className="ml-3 flex-1">
                <span className="text-sm text-gray-200 leading-relaxed">
                  Ich möchte, dass mein Firmenlogo auf der BuildWise-Landingpage zu Werbezwecken angezeigt wird und als aktiver Nutzer der Plattform präsentiert wird.
                </span>
                <p className="text-xs text-gray-400 mt-1">
                  Diese Einstellung kann jederzeit in den Profileinstellungen geändert werden.
                </p>
              </div>
            </label>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
            <button
              type="button"
              onClick={handleSkip}
              disabled={isLoading}
              className="flex-1 px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold border-2 border-gray-600 text-gray-300 hover:bg-gray-600/20 hover:border-gray-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              Später ergänzen
            </button>
            
            <button
              type="submit"
              disabled={!companyName.trim() || isLoading}
              className={`
                flex-1 px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 text-sm sm:text-base active:scale-95
                ${companyName.trim() && !isLoading
                  ? 'bg-[#ffbd59] text-[#2c3539] hover:bg-[#ffa726] hover:scale-105' 
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              {isLoading ? (
                'Wird gespeichert...'
              ) : (
                <>
                  Speichern
                  <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
                </>
              )}
            </button>
          </div>
          </form>
        </div>

        {/* Fixed footer */}
        <div className="p-4 sm:p-6 lg:p-8 pt-2 sm:pt-4 flex-shrink-0">
          <div className="text-center">
            <p className="text-xs text-gray-400 px-2">
              Diese Informationen können jederzeit in den Profileinstellungen geändert werden.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
