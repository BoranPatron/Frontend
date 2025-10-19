import React, { useState } from 'react';
import { Building2, Wrench, X } from 'lucide-react';

interface RoleSelectionModalProps {
  onSelectRole: (role: 'bautraeger' | 'dienstleister') => void;
}

export default function RoleSelectionModal({ onSelectRole }: RoleSelectionModalProps) {
  const [selectedRole, setSelectedRole] = useState<'bautraeger' | 'dienstleister' | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    if (!selectedRole) return;
    
    setIsLoading(true);
    await onSelectRole(selectedRole);
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-40 p-2 sm:p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 max-w-sm sm:max-w-lg lg:max-w-2xl w-full border border-white/20 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2">
            Willkommen bei BuildWise!
          </h2>
          <p className="text-gray-300 text-sm sm:text-base">
            Bitte wählen Sie Ihre Rolle aus, um fortzufahren.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Bauträger/Bauherr Karte */}
          <button
            onClick={() => setSelectedRole('bautraeger')}
            className={`
              relative p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 active:scale-95
              ${selectedRole === 'bautraeger' 
                ? 'border-[#ffbd59] bg-[#ffbd59]/20' 
                : 'border-white/20 bg-white/5 hover:bg-white/10'
              }
            `}
          >
            <div className="flex flex-col items-center text-center">
              <div className={`
                w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mb-3 sm:mb-4 transition-colors
                ${selectedRole === 'bautraeger' 
                  ? 'bg-[#ffbd59]/30' 
                  : 'bg-white/10'
                }
              `}>
                <Building2 className={`
                  w-8 h-8 sm:w-10 sm:h-10 transition-colors
                  ${selectedRole === 'bautraeger' 
                    ? 'text-[#ffbd59]' 
                    : 'text-white'
                  }
                `} />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
                Bauträger/Bauherr
              </h3>
              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                Verwalten Sie Ihre Bauprojekte, erstellen Sie Ausschreibungen und koordinieren Sie Dienstleister.
              </p>
            </div>
            {selectedRole === 'bautraeger' && (
              <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-[#ffbd59] rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full" />
                </div>
              </div>
            )}
          </button>

          {/* Dienstleister Karte */}
          <button
            onClick={() => setSelectedRole('dienstleister')}
            className={`
              relative p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 active:scale-95
              ${selectedRole === 'dienstleister' 
                ? 'border-[#ffbd59] bg-[#ffbd59]/20' 
                : 'border-white/20 bg-white/5 hover:bg-white/10'
              }
            `}
          >
            <div className="flex flex-col items-center text-center">
              <div className={`
                w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mb-3 sm:mb-4 transition-colors
                ${selectedRole === 'dienstleister' 
                  ? 'bg-[#ffbd59]/30' 
                  : 'bg-white/10'
                }
              `}>
                <Wrench className={`
                  w-8 h-8 sm:w-10 sm:h-10 transition-colors
                  ${selectedRole === 'dienstleister' 
                    ? 'text-[#ffbd59]' 
                    : 'text-white'
                  }
                `} />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
                Dienstleister
              </h3>
              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                Erstellen Sie Angebote, verwalten Sie Ihre Aufträge und kommunizieren Sie mit Bauträgern.
              </p>
            </div>
            {selectedRole === 'dienstleister' && (
              <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
                <div className="w-5 h-5 sm:w-6 sm:h-6 bg-[#ffbd59] rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full" />
                </div>
              </div>
            )}
          </button>
        </div>

        <div className="text-center">
          <button
            onClick={handleConfirm}
            disabled={!selectedRole || isLoading}
            className={`
              w-full sm:w-auto px-6 sm:px-8 py-3 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 transform text-sm sm:text-base
              ${selectedRole && !isLoading
                ? 'bg-[#ffbd59] text-[#2c3539] hover:bg-[#ffa726] hover:scale-105 active:scale-95' 
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }
            `}
          >
            {isLoading ? 'Wird gespeichert...' : 'Rolle bestätigen'}
          </button>
          <p className="text-xs text-gray-400 mt-3 sm:mt-4 px-2">
            Diese Auswahl kann später vom Administrator geändert werden.
          </p>
        </div>
      </div>
    </div>
  );
} 