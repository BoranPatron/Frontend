import React, { useState } from 'react';
import { Building2, MapPin, X, ArrowRight } from 'lucide-react';
import AddressAutocomplete from './AddressAutocomplete';

interface CompanyAddressModalProps {
  onComplete: (companyData: { company_name: string; company_address: string; company_uid?: string }) => void;
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
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) return;
    
    setIsLoading(true);
    
    // Vollständige Adresse zusammenstellen
    const addressParts = [
      addressData.address_street,
      [addressData.address_zip, addressData.address_city].filter(Boolean).join(' '),
      addressData.address_country
    ].filter(Boolean);
    
    const fullAddress = addressParts.join(', ');
    
    await onComplete({
      company_name: companyName.trim(),
      company_address: fullAddress,
      company_uid: companyUid.trim() || undefined
    });
    
    setIsLoading(false);
  };

  const handleSkip = async () => {
    setIsLoading(true);
    await onSkip();
    setIsLoading(false);
  };

  const roleText = userRole === 'bautraeger' ? 'Bauträger/Bauherr' : 'Dienstleister';
  const RoleIcon = userRole === 'bautraeger' ? Building2 : Building2;

  return (
    <div className="fixed top-16 left-0 right-0 bottom-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10000] p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 max-w-2xl w-full border border-white/20 shadow-2xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-[#ffbd59]/20 flex items-center justify-center">
              <RoleIcon className="w-8 h-8 text-[#ffbd59]" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">
            Firmeninformationen
          </h2>
          <p className="text-gray-300">
            Ergänzen Sie Ihre Firmenadresse als {roleText} (optional)
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Firmenname */}
          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-3">
              Firmenname *
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 text-white rounded-xl focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent transition-all duration-200 placeholder-gray-400"
              placeholder="z.B. Mustermann Bau GmbH"
              required
            />
          </div>

          {/* UID-Nummer */}
          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-3">
              UID-Nummer
            </label>
            <input
              type="text"
              value={companyUid}
              onChange={(e) => setCompanyUid(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 text-white rounded-xl focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent transition-all duration-200 placeholder-gray-400"
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
              onChange={setAddressData}
              className=""
            />
            <p className="text-xs text-gray-400 mt-2">
              Diese Adresse wird für Rechnungen und offizielle Dokumente verwendet.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button
              type="button"
              onClick={handleSkip}
              disabled={isLoading}
              className="flex-1 px-6 py-3 rounded-xl font-semibold border-2 border-gray-600 text-gray-300 hover:bg-gray-600/20 hover:border-gray-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Später ergänzen
            </button>
            
            <button
              type="submit"
              disabled={!companyName.trim() || isLoading}
              className={`
                flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2
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
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">
            Diese Informationen können jederzeit in den Profileinstellungen geändert werden.
          </p>
        </div>
      </div>
    </div>
  );
}
