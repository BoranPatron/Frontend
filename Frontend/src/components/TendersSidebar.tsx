import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  ChevronRight,
  X,
  Search,
  Map,
  ExternalLink,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Gavel,
  Plus,
  Mail,
  Award,
  Building,
  Wrench
} from 'lucide-react';
import AddressAutocomplete from './AddressAutocomplete';
import TradeMap from './TradeMap';
import { TRADE_CATEGORIES } from '../constants/tradeCategories';
import type { TradeSearchResult } from '../api/geoService';

// Interfaces
interface TendersSidebarProps {
  currentLocation: { latitude: number; longitude: number } | null;
  setCurrentLocation: (location: { latitude: number; longitude: number } | null) => void;
  radiusKm: number;
  setRadiusKm: (radius: number) => void;
  geoTrades: TradeSearchResult[];
  trades: any[];
  allTradeQuotes: { [tradeId: number]: any[] };
  serviceProviderQuotes: any[];
  onTradeClick: (trade: any) => void;
  onCreateQuote: (trade: any) => void;
  hasServiceProviderQuote: (tradeId: number) => boolean;
  getServiceProviderQuoteStatus: (tradeId: number) => string | null;
  getServiceProviderQuote: (tradeId: number) => any | null;
  isLoading: boolean;
  error: string | null;
  isGeocoding: boolean;
  handleSelectedAddressGeocode: () => void;
  useOwnLocation: () => void;
  performGeoSearch: () => void;
  selectedAddress: {
    address_street: string;
    address_zip: string;
    address_city: string;
    address_country: string;
  };
  setSelectedAddress: (address: any) => void;
  geoTradeCategory: string;
  setGeoTradeCategory: (category: string) => void;
  getCategoryIcon: (category: string) => any;
  formatCurrency: (amount: number) => string;
  formatDate: (dateString: string) => string;
  getCompletionStatusLabel: (status: string) => string;
  getCompletionStatusColor: (status: string) => string;
  getQuoteStatusLabel: (status: string) => string;
  getQuoteStatusColor: (status: string) => string;
  truncateText: (text: string, maxLength: number) => string;
  isDescriptionExpanded: (tradeId: number) => boolean;
  toggleDescriptionExpansion: (tradeId: number) => void;
  isUserQuote: (quote: any, user: any) => boolean;
  user: any;
}

const TendersSidebar: React.FC<TendersSidebarProps> = ({
  currentLocation,
  setCurrentLocation,
  radiusKm,
  setRadiusKm,
  geoTrades,
  trades,
  allTradeQuotes,
  serviceProviderQuotes,
  onTradeClick,
  onCreateQuote,
  hasServiceProviderQuote,
  getServiceProviderQuoteStatus,
  getServiceProviderQuote,
  isLoading,
  error,
  isGeocoding,
  handleSelectedAddressGeocode,
  useOwnLocation,
  performGeoSearch,
  selectedAddress,
  setSelectedAddress,
  geoTradeCategory,
  setGeoTradeCategory,
  getCategoryIcon,
  formatCurrency,
  formatDate,
  getCompletionStatusLabel,
  getCompletionStatusColor,
  getQuoteStatusLabel,
  getQuoteStatusColor,
  truncateText,
  isDescriptionExpanded,
  toggleDescriptionExpansion,
  isUserQuote,
  user
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'rows' | 'cards' | 'map'>('map');
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  // Check if mobile/tablet/desktop
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Mobile: force rows view
  useEffect(() => {
    if (isMobile && activeTab === 'cards') {
      setActiveTab('rows');
    }
  }, [isMobile, activeTab]);

  // Combine and deduplicate trades
  const combinedTrades = React.useMemo(() => {
    const tradeMap: { [key: number]: any } = {};
    
    // Add geo trades (priority for distance info)
    geoTrades.forEach(trade => {
      tradeMap[trade.id] = {...trade, isGeoResult: true};
    });
    
    // Merge with local trades for has_unread_messages fields
    trades.forEach(trade => {
      if (tradeMap[trade.id]) {
        tradeMap[trade.id] = {
          ...tradeMap[trade.id],
          has_unread_messages_bautraeger: trade.has_unread_messages_bautraeger,
          has_unread_messages_dienstleister: trade.has_unread_messages_dienstleister,
          completion_status: trade.completion_status || tradeMap[trade.id].completion_status,
        };
      } else {
        tradeMap[trade.id] = {...trade, isGeoResult: false};
      }
    });
    
    return Object.values(tradeMap);
  }, [geoTrades, trades]);

  const handleClose = () => {
    setIsOpen(false);
    setIsExpanded(false);
  };

  const handleExpand = () => {
    setIsExpanded(true);
  };

  const handleCollapse = () => {
    setIsExpanded(false);
  };

  return (
    <>
       {/* Tab/Toggle Button */}
       <button
         onClick={() => setIsOpen(!isOpen)}
         className={`fixed right-0 lg:top-[460px] md:top-[380px] sm:bottom-[230px] sm:right-[20px] z-40 transition-all duration-300 ${
           isOpen && !isExpanded 
             ? isMobile 
               ? 'right-0' 
               : isTablet
               ? 'right-0'
               : 'right-[90vw] sm:right-[85vw] md:right-[80vw] lg:right-[75vw] xl:right-[70vw]'
             : 'right-0'
         } w-14 h-20 rounded-l-xl hover:shadow-2xl flex flex-col items-center justify-center gap-1 ${
           combinedTrades.length > 0
             ? 'bg-gradient-to-r from-emerald-500/90 to-green-600/90 shadow-lg shadow-emerald-500/50'
             : 'bg-gradient-to-r from-emerald-500/80 to-green-600/80'
         } text-white hover:from-emerald-500 hover:to-green-600 border-l border-t border-b border-white/30`}
       >
        {isOpen && !isExpanded ? (
          <ChevronRight className="w-5 h-5" />
        ) : (
          <>
            <MapPin size={20} />
            {combinedTrades.length > 0 && (
              <div className="bg-white text-emerald-600 rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold">
                {combinedTrades.length}
              </div>
            )}
          </>
        )}
      </button>

      {/* Sidebar Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className={`fixed inset-0 bg-black/30 backdrop-blur-sm ${
                isExpanded ? 'z-[99998]' : 'z-40'
              }`}
            />

             {/* Sidebar Content */}
             <motion.div
               initial={isMobile ? { y: '100%' } : { x: '100vw' }}
               animate={
                 isExpanded
                   ? { x: 0, y: 0, width: '100vw', height: '100vh' }
                   : isMobile
                   ? { y: 0, height: '85vh' }
                   : isTablet
                   ? { x: 0, width: '100vw', height: '100vh' }
                   : { x: 0 }
               }
               exit={isMobile ? { y: '100%' } : { x: '100vw' }}
               transition={{ type: 'spring', damping: 25, stiffness: 200 }}
               className={`fixed ${
                 isExpanded
                   ? 'inset-0 z-[99999]'
                   : isMobile
                   ? 'bottom-0 left-0 right-0 rounded-t-3xl z-50'
                   : isTablet
                   ? 'inset-0 z-50'
                   : 'right-0 top-0 h-full z-50'
               } ${
                 isExpanded
                   ? 'w-full'
                   : isMobile
                   ? 'w-full'
                   : isTablet
                   ? 'w-full'
                   : 'w-[90vw] sm:w-[85vw] md:w-[80vw] lg:w-[75vw] xl:w-[70vw]'
               } bg-[#1a1a1a] shadow-2xl flex flex-col overflow-hidden`}
             >
              {/* Header - Kompakter */}
              <div className="bg-gradient-to-r from-[#10b981] to-[#059669] p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-white" />
                    <div>
                      <h2 className="text-lg font-bold text-white">Ausschreibungen</h2>
                      <div className="flex items-center gap-2 text-white/90 text-xs">
                        <span className="text-emerald-300 font-semibold">
                          {combinedTrades.length} gefunden
                        </span>
                        {currentLocation && (
                          <>
                            <span>·</span>
                            <span>{radiusKm}km Radius</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                   <div className="flex items-center gap-1">
                     {!isExpanded && !isMobile && !isTablet && (
                       <button
                         onClick={handleExpand}
                         className="p-1.5 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                         title="Vollbild"
                       >
                         <ExternalLink className="w-4 h-4 text-white" />
                       </button>
                     )}
                     {isExpanded && (
                       <button
                         onClick={handleCollapse}
                         className="p-1.5 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                         title="Verkleinern"
                       >
                         <XCircle className="w-4 h-4 text-white" />
                       </button>
                     )}
                     <button
                       onClick={handleClose}
                       className="p-1.5 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                     >
                       <X className="w-4 h-4 text-white" />
                     </button>
                   </div>
                </div>
              </div>

              {/* Location Input Section - Kompakter */}
              <div className="p-3 border-b border-gray-700 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <AddressAutocomplete
                      label=""
                      placeholder="📍 Standort eingeben..."
                      value={selectedAddress}
                      onChange={(next) => setSelectedAddress({
                        address_street: next.address_street,
                        address_zip: next.address_zip,
                        address_city: next.address_city,
                        address_country: next.address_country || 'Deutschland'
                      })}
                      className=""
                    />
                  </div>
                  
                  <button
                    onClick={handleSelectedAddressGeocode}
                    disabled={isGeocoding || !selectedAddress.address_street.trim()}
                    className="px-3 py-2 bg-gradient-to-r from-[#10b981] to-[#059669] text-white rounded-lg hover:from-[#059669] hover:to-[#047857] disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all duration-300"
                  >
                    {isGeocoding ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                    ) : (
                      <Search size={14} />
                    )}
                  </button>
                  
                  <button
                    onClick={useOwnLocation}
                    disabled={isLoading}
                    className={`p-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-lg hover:from-emerald-600 hover:to-green-600 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all duration-300 ${
                      !currentLocation ? 'animate-bounce' : ''
                    }`}
                    title="Aktuellen Standort verwenden"
                  >
                    <MapPin size={14} />
                  </button>
                </div>

                {/* Radius Slider - Kompakter */}
                <div className="bg-[#2a2a2a] rounded-lg p-3 border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white text-xs font-medium">🎯 Radius</span>
                    <span className="px-2 py-0.5 bg-gradient-to-r from-[#10b981] to-[#059669] text-white rounded-full text-xs font-bold">
                      {radiusKm}km
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={radiusKm}
                    onChange={(e) => setRadiusKm(parseInt(e.target.value))}
                    className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #10b981 0%, #10b981 ${(radiusKm/50)*100}%, rgba(255,255,255,0.15) ${(radiusKm/50)*100}%, rgba(255,255,255,0.15) 100%)`
                    }}
                  />
                </div>
              </div>

              {/* Filter & View Tabs - Kompakter */}
              <div className="p-3 border-b border-gray-700 space-y-2">
                <div className="flex items-center gap-2">
                  {/* Category Filter */}
                  <select
                    value={geoTradeCategory || ''}
                    onChange={(e) => setGeoTradeCategory(e.target.value)}
                    className="flex-1 px-3 py-2 bg-[#2a2a2a] text-white rounded-lg text-xs border border-gray-600 focus:outline-none focus:border-[#10b981] transition-all duration-300 cursor-pointer hover:bg-gray-700"
                  >
                    <option value="">Alle Kategorien</option>
                    {TRADE_CATEGORIES.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.emoji} {category.label}
                      </option>
                    ))}
                  </select>

                  {/* Search Button */}
                  <button
                    onClick={performGeoSearch}
                    disabled={isLoading || !currentLocation}
                    className="p-2 rounded-lg bg-gradient-to-r from-[#10b981] to-[#059669] text-white hover:from-[#059669] hover:to-[#047857] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full border-b-2 border-white h-4 w-4"></div>
                    ) : (
                      <Search size={14} />
                    )}
                  </button>
                </div>

                {/* View Tabs */}
                <div className="flex items-center p-0.5 bg-[#2a2a2a] rounded-lg">
                  <button
                    onClick={() => setActiveTab('rows')}
                    className={`flex-1 px-3 py-2 rounded-md font-medium text-xs transition-all duration-300 flex items-center justify-center gap-1 ${
                      activeTab === 'rows'
                        ? 'bg-gradient-to-r from-[#10b981] to-[#059669] text-white shadow-lg'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z"/>
                    </svg>
                    {!isMobile && <span>Zeilen</span>}
                  </button>
                  {!isMobile && (
                    <button
                      onClick={() => setActiveTab('cards')}
                      className={`flex-1 px-3 py-2 rounded-md font-medium text-xs transition-all duration-300 flex items-center justify-center gap-1 ${
                        activeTab === 'cards'
                          ? 'bg-gradient-to-r from-[#10b981] to-[#059669] text-white shadow-lg'
                          : 'text-gray-300 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z"/>
                      </svg>
                      <span>Kacheln</span>
                    </button>
                  )}
                  <button
                    onClick={() => setActiveTab('map')}
                    className={`flex-1 px-3 py-2 rounded-md font-medium text-xs transition-all duration-300 flex items-center justify-center gap-1 ${
                      activeTab === 'map'
                        ? 'bg-gradient-to-r from-[#10b981] to-[#059669] text-white shadow-lg'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Map size={12} />
                    {!isMobile && <span>Karte</span>}
                  </button>
                </div>
              </div>

              {/* Content Area - Maximaler Platz für Karte */}
              <div className="flex-1 overflow-y-auto p-2">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#10b981] border-t-transparent mx-auto mb-4"></div>
                      <p className="text-white font-medium">Suche Gewerke...</p>
                      <p className="text-gray-400 text-sm mt-2">Dies kann einen Moment dauern</p>
                    </div>
                  </div>
                ) : error ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                      <p className="text-red-400 mb-4">{error}</p>
                      <button
                        onClick={performGeoSearch}
                        className="px-4 py-2 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-colors font-medium"
                      >
                        <RefreshCw size={16} className="inline mr-2" />
                        Erneut versuchen
                      </button>
                    </div>
                  </div>
                ) : combinedTrades.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <MapPin className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400">
                        {currentLocation
                          ? 'Keine Ausschreibungen gefunden'
                          : 'Bitte wählen Sie einen Standort aus'}
                      </p>
                    </div>
                  </div>
                ) : activeTab === 'map' ? (
                  <div className="h-full rounded-xl overflow-hidden border border-white/20">
                    <TradeMap
                      currentLocation={currentLocation}
                      trades={combinedTrades.filter(trade => 
                        trade.address_latitude != null && 
                        trade.address_longitude != null &&
                        !isNaN(trade.address_latitude) &&
                        !isNaN(trade.address_longitude)
                      )}
                      radiusKm={radiusKm}
                      onTradeClick={onTradeClick}
                      isExpanded={false}
                      hasQuoteForTrade={hasServiceProviderQuote}
                      getQuoteStatusForTrade={getServiceProviderQuoteStatus}
                    />
                  </div>
                ) : (
                  <div className={activeTab === 'cards' && !isMobile
                    ? "grid grid-cols-1 lg:grid-cols-2 gap-4"
                    : "space-y-3"
                  }>
                    {combinedTrades.map((trade: any) => {
                      const hasQuote = hasServiceProviderQuote(trade.id);
                      const userQuote = getServiceProviderQuote(trade.id);
                      const quoteStatus = userQuote?.status || null;
                      const actualCompletionStatus = trade.completion_status || 'in_progress';

                      return activeTab === 'cards' && !isMobile ? (
                        // Card View
                        <motion.div
                          key={`trade-card-${trade.id}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          whileHover={{ scale: 1.02 }}
                          onClick={() => onTradeClick(trade)}
                          className={`bg-gradient-to-br from-white/8 to-white/4 backdrop-blur-xl rounded-xl p-4 border border-white/20 hover:border-[#10b981]/50 hover:shadow-lg transition-all duration-300 cursor-pointer ${
                            hasQuote ? 'border-[#10b981]/40 shadow-md shadow-[#10b981]/10' : ''
                          }`}
                        >
                          <div className="flex items-start gap-3 mb-3">
                            <div className="relative flex-shrink-0">
                              <div className="p-2 bg-gradient-to-br from-[#10b981] to-[#059669] rounded-lg shadow-lg">
                                {React.cloneElement(getCategoryIcon(trade.category || ''), { size: 16 })}
                              </div>
                              {trade.has_unread_messages_dienstleister && (
                                <Mail 
                                  size={14} 
                                  className="absolute -top-1 -right-1 text-green-500" 
                                  style={{
                                    animation: 'mail-flash 0.5s linear infinite',
                                    filter: 'drop-shadow(0 0 8px #00ff00)',
                                  }}
                                />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-white font-bold text-sm leading-tight mb-1 line-clamp-2">
                                {trade.title}
                              </h3>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-gray-300 text-xs">{trade.category || 'Unbekannt'}</span>
                                {trade.isGeoResult && (
                                  <span className="text-blue-400 text-xs bg-blue-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <MapPin size={8} />
                                    {trade.distance_km?.toFixed(1)}km
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2 mb-3">
                            <span className={`inline-block px-2 py-1 rounded-lg text-xs font-medium ${getCompletionStatusColor(actualCompletionStatus)}`}>
                              {getCompletionStatusLabel(actualCompletionStatus)}
                            </span>
                            {hasQuote && (
                              <span className={`inline-block ml-2 px-2 py-1 rounded-lg text-xs font-medium ${
                                quoteStatus === 'accepted' ? 'bg-green-500/30 text-green-300 border border-green-500/50' :
                                quoteStatus === 'under_review' ? 'bg-yellow-500/30 text-yellow-300 border border-yellow-500/50' :
                                quoteStatus === 'rejected' ? 'bg-red-500/30 text-red-300 border border-red-500/50' :
                                'bg-blue-500/30 text-blue-300 border border-blue-500/50'
                              }`}>
                                {quoteStatus === 'accepted' ? '✓ Gewonnen' :
                                 quoteStatus === 'under_review' ? '⏳ In Prüfung' :
                                 quoteStatus === 'rejected' ? '✗ Abgelehnt' :
                                 '📋 Angebot abgegeben'}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-white/10">
                            <span className="text-xs text-gray-400">
                              📊 {(allTradeQuotes[trade.id] || []).length} Angebote
                            </span>
                            {!hasQuote ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onCreateQuote(trade);
                                }}
                                className="px-3 py-1.5 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-colors text-xs font-medium flex items-center gap-1"
                              >
                                <Plus size={12} />
                                Angebot
                              </button>
                            ) : userQuote && (
                              <div className="text-[#10b981] text-sm font-bold">
                                {formatCurrency(userQuote.total_amount)}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ) : (
                        // Row View
                        <motion.div
                          key={`trade-row-${trade.id}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          whileHover={{ scale: 1.01 }}
                          onClick={() => onTradeClick(trade)}
                          className={`bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20 hover:border-[#10b981]/50 hover:shadow-lg transition-all duration-300 cursor-pointer ${
                            hasQuote ? 'border-[#10b981]/50 shadow-md shadow-[#10b981]/10' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative flex-shrink-0">
                              <div className="p-2 bg-gradient-to-br from-[#10b981] to-[#059669] rounded-lg shadow-lg">
                                {getCategoryIcon(trade.category || '')}
                              </div>
                              {trade.has_unread_messages_dienstleister && (
                                <Mail 
                                  size={16} 
                                  className="absolute -top-2 -right-2 text-green-500" 
                                  style={{
                                    animation: 'mail-flash 0.5s linear infinite',
                                    filter: 'drop-shadow(0 0 8px #00ff00)',
                                  }}
                                />
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h3 className="text-white font-semibold text-sm line-clamp-1">
                                  {trade.title}
                                </h3>
                                {trade.isGeoResult && (
                                  <span className="text-blue-400 text-xs bg-blue-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <MapPin size={8} />
                                    {trade.distance_km?.toFixed(1)}km
                                  </span>
                                )}
                                {hasQuote && (
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    quoteStatus === 'accepted' ? 'bg-green-500/30 text-green-300' :
                                    quoteStatus === 'under_review' ? 'bg-yellow-500/30 text-yellow-300' :
                                    quoteStatus === 'rejected' ? 'bg-red-500/30 text-red-300' :
                                    'bg-blue-500/30 text-blue-300'
                                  }`}>
                                    {quoteStatus === 'accepted' ? '✓' :
                                     quoteStatus === 'under_review' ? '⏳' :
                                     quoteStatus === 'rejected' ? '✗' :
                                     '📋'}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-gray-400">
                                <span>{trade.category || 'Unbekannt'}</span>
                                <span>📊 {(allTradeQuotes[trade.id] || []).length} Angebote</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {!hasQuote ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onCreateQuote(trade);
                                  }}
                                  className="px-3 py-2 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-colors text-xs font-medium flex items-center gap-1"
                                >
                                  <Plus size={14} />
                                  Angebot
                                </button>
                              ) : userQuote && (
                                <div className="text-[#10b981] text-sm font-bold">
                                  {formatCurrency(userQuote.total_amount)}
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer Stats - Kompakter */}
              {!isLoading && !error && combinedTrades.length > 0 && (
                <div className="p-2 border-t border-gray-700 bg-[#222]">
                  <div className="grid grid-cols-3 gap-1 text-center">
                    <div>
                      <div className="text-lg font-bold text-[#10b981]">{combinedTrades.length}</div>
                      <div className="text-[10px] text-gray-400">Gefunden</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-white">{radiusKm}km</div>
                      <div className="text-[10px] text-gray-400">Radius</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-yellow-400">
                        {combinedTrades.filter(t => !hasServiceProviderQuote(t.id)).length}
                      </div>
                      <div className="text-[10px] text-gray-400">Verfügbar</div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default TendersSidebar;

