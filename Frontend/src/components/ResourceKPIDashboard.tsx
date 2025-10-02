import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  Users,
  Clock,
  Euro,
  MapPin,
  Calendar,
  Activity,
  Target,
  X,
  RefreshCw,
  Download,
  Filter,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { resourceService } from '../api/resourceService';
import { useAuth } from '../context/AuthContext';
import dayjs from 'dayjs';

interface KPIDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

interface KPIData {
  overview: {
    total_resources: number;
    available_resources: number;
    allocated_resources: number;
    completed_resources: number;
    total_person_days: number;
    allocated_person_days: number;
    utilization_rate: number;
    average_hourly_rate: number;
    total_revenue: number;
    offer_rate: number;
    average_response_time: number;
  };
  category_performance: Record<string, {
    total: number;
    allocated: number;
    revenue: number;
    person_days: number;
  }>;
  geographic_distribution: Record<string, number>;
  monthly_trends: Record<string, {
    resources_created: number;
    allocations_created: number;
    revenue: number;
  }>;
  period: {
    start: string;
    end: string;
  };
}

const ResourceKPIDashboard: React.FC<KPIDashboardProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'6m' | '1y' | 'custom'>('6m');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview', 'utilization', 'revenue']));

  // Lade KPI-Daten
  const loadKPIData = async () => {
    if (!user?.id) {
      console.log('❌ No user ID available');
      return;
    }
    
    console.log('🔄 Loading KPI data for user:', user.id);
    setLoading(true);
    setError(null);
    
    try {
      let periodStart: string | undefined;
      let periodEnd: string | undefined;
      
      if (selectedPeriod === '6m') {
        periodStart = dayjs().subtract(6, 'months').format('YYYY-MM-DD');
        periodEnd = dayjs().format('YYYY-MM-DD');
      } else if (selectedPeriod === '1y') {
        periodStart = dayjs().subtract(1, 'year').format('YYYY-MM-DD');
        periodEnd = dayjs().format('YYYY-MM-DD');
      } else if (selectedPeriod === 'custom' && customStartDate && customEndDate) {
        periodStart = customStartDate;
        periodEnd = customEndDate;
      }
      
      console.log('📅 Period:', { periodStart, periodEnd, selectedPeriod });
      
      const data = await resourceService.getDetailedKPIs(user.id, periodStart, periodEnd);
      console.log('✅ KPI data loaded:', data);
      setKpiData(data);
    } catch (err) {
      console.error('❌ Error loading KPI data:', err);
      setError('Fehler beim Laden der KPI-Daten');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🔄 KPI Dashboard useEffect:', { isOpen, userId: user?.id });
    if (isOpen && user?.id) {
      loadKPIData();
    }
  }, [isOpen, user?.id, selectedPeriod, customStartDate, customEndDate]);

  // Toggle Section Expansion
  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  // Format Currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  // Format Percentage
  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Format Hours
  const formatHours = (hours: number) => {
    if (hours < 24) {
      return `${hours.toFixed(1)}h`;
    } else {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return `${days}d ${remainingHours.toFixed(1)}h`;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#1a1a1a] rounded-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden border border-gray-700"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-[#ffbd59]" />
            <div>
              <h2 className="text-2xl font-bold text-white">KPI Dashboard</h2>
              <p className="text-gray-400 text-sm">Ressourcen-Performance und -Analysen</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Period Selector */}
            <div className="flex items-center gap-2">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as any)}
                className="px-3 py-2 bg-[#2a2a2a] text-white rounded-lg border border-gray-600 text-sm"
              >
                <option value="6m">Letzte 6 Monate</option>
                <option value="1y">Letztes Jahr</option>
                <option value="custom">Benutzerdefiniert</option>
              </select>
              
              {selectedPeriod === 'custom' && (
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="px-3 py-2 bg-[#2a2a2a] text-white rounded-lg border border-gray-600 text-sm"
                  />
                  <span className="text-gray-400">bis</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="px-3 py-2 bg-[#2a2a2a] text-white rounded-lg border border-gray-600 text-sm"
                  />
                </div>
              )}
            </div>
            
            <button
              onClick={loadKPIData}
              disabled={loading}
              className="p-2 text-gray-400 hover:text-white hover:bg-[#333] rounded-lg transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-[#333] rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(95vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ffbd59]"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-400 mb-4">{error}</div>
              <button
                onClick={loadKPIData}
                className="px-4 py-2 bg-[#ffbd59] text-black rounded-lg hover:bg-[#f59e0b] transition-colors"
              >
                Erneut versuchen
              </button>
            </div>
          ) : kpiData ? (
            <div className="space-y-6">
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#2a2a2a] rounded-lg p-4 border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-400">Gesamtressourcen</h3>
                    <Users className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">
                    {kpiData.overview.total_resources}
                  </div>
                  <div className="text-xs text-gray-500">
                    {kpiData.overview.available_resources} verfügbar, {kpiData.overview.allocated_resources} zugewiesen
                  </div>
                </div>

                <div className="bg-[#2a2a2a] rounded-lg p-4 border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-400">Auslastungsgrad</h3>
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">
                    {formatPercentage(kpiData.overview.utilization_rate)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {kpiData.overview.allocated_person_days} von {kpiData.overview.total_person_days} Personentagen
                  </div>
                </div>

                <div className="bg-[#2a2a2a] rounded-lg p-4 border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-400">Gesamtumsatz</h3>
                    <Euro className="w-5 h-5 text-[#ffbd59]" />
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">
                    {formatCurrency(kpiData.overview.total_revenue)}
                  </div>
                  <div className="text-xs text-gray-500">
                    Ø {formatCurrency(kpiData.overview.average_hourly_rate)}/h
                  </div>
                </div>

                <div className="bg-[#2a2a2a] rounded-lg p-4 border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-400">Angebotsquote</h3>
                    <Target className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">
                    {formatPercentage(kpiData.overview.offer_rate)}
                  </div>
                  <div className="text-xs text-gray-500">
                    Ø Antwortzeit: {formatHours(kpiData.overview.average_response_time)}
                  </div>
                </div>
              </div>

              {/* Debug Info */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <h3 className="text-blue-300 font-medium mb-2">Debug Information</h3>
                <div className="text-sm text-blue-200 space-y-1">
                  <div>User ID: {user?.id}</div>
                  <div>Period: {selectedPeriod}</div>
                  <div>Data loaded: {kpiData ? 'Yes' : 'No'}</div>
                  <div>Loading: {loading ? 'Yes' : 'No'}</div>
                  <div>Error: {error || 'None'}</div>
                </div>
              </div>

              {/* Simple Data Display */}
              {kpiData && (
                <div className="bg-[#2a2a2a] rounded-lg p-6 border border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Rohdaten</h3>
                  <pre className="text-sm text-gray-300 overflow-auto">
                    {JSON.stringify(kpiData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">Keine Daten verfügbar</div>
              <button
                onClick={loadKPIData}
                className="px-4 py-2 bg-[#ffbd59] text-black rounded-lg hover:bg-[#f59e0b] transition-colors"
              >
                Daten laden
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ResourceKPIDashboard;