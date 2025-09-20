// Centralized glass style utility for consistent frosted UI across the app
// Usage: import { glass } from '../styles/glass'; and apply to className

export const glass = {
  // Layout containers
  sidebar:
    'bg-gradient-to-b from-[#2c3539]/70 to-[#1a1a2e]/70 backdrop-blur-md border-gray-700/50 border-r',
  headerBar:
    'bg-gradient-to-r from-[#3d4952]/80 to-[#51646f]/80 backdrop-blur-md border-b border-gray-700/50',
  footerBar: 'border-t border-gray-700/50 bg-black/10 backdrop-blur-sm',
  panel:
    'bg-black/10 border border-gray-700/50 backdrop-blur-md rounded-xl',

  // Surfaces
  card:
    'bg-gradient-to-br from-[#2c3539]/60 to-[#1a1a2e]/60 backdrop-blur-md rounded-xl border border-gray-700/50',
  modalOverlay:
    'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4',
  modal:
    'bg-gradient-to-br from-[#2c3539]/80 to-[#1a1a2e]/80 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden border border-gray-700/50',

  // Controls
  input:
    'bg-[#2c3539]/50 border border-gray-600/60 backdrop-blur-sm rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59]',
  select:
    'bg-[#2c3539]/50 border border-gray-600/60 backdrop-blur-sm rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59]',

  // Buttons
  buttonPrimary:
    'bg-[#ffbd59] hover:bg-[#ffa726] text-[#1a1a2e] font-medium rounded-lg',
  buttonSecondary:
    'bg-[#2c3539] hover:bg-[#3d4952] border border-gray-600 text-white rounded-lg font-medium',

  // Badges/Labels
  badge:
    'text-xs bg-[#ffbd59]/20 text-[#ffbd59] px-2 py-1 rounded-full',
};
