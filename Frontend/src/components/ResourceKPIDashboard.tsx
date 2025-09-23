import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  Euro,
  Calendar,
  Award,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Zap,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  Filter,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { resourceService, type ResourceKPIs } from '../api/resourceService';
import { useAuth } from '../context/AuthContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';
import dayjs from 'dayjs';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ResourceKPIDashboardProps {
  serviceProviderId?: number;
  className?: string;
  onResourceClick?: () => void;
}

interface KPICard {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  description?: string;
}

interface TimeRange {
  label: string;
  value: 'week' | 'month' | 'quarter' | 'year';
  days: number;
}

const TIME_RANGES: TimeRange[] = [
  { label: 'Woche', value: 'week', days: 7 },
  { label: 'Monat', value: 'month', days: 30 },
  { label: 'Quartal', value: 'quarter', days: 90 },
  { label: 'Jahr', value: 'year', days: 365 }
];

const ResourceKPIDashboard: React.FC<ResourceKPIDashboardProps> = ({
  serviceProviderId,
  className = '',
  onResourceClick
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [kpis, setKpis] = useState<ResourceKPIs | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>(TIME_RANGES[1]); // Default: Monat
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  // Lade KPI-Daten
  const loadKPIData = async () => {
    if (!serviceProviderId && !user?.id) return;

    setLoading(true);
    try {
      const providerId = serviceProviderId || user?.id || 0;
      const endDate = dayjs().format('YYYY-MM-DD');
      const startDate = dayjs().subtract(timeRange.days, 'days').format('YYYY-MM-DD');

      // Lade aktuelle KPIs
      const kpiData = await resourceService.getKPIs(providerId, startDate, endDate);
      setKpis(kpiData);

      // Simuliere historische Daten für Charts
      generateHistoricalData(kpiData);
    } catch (error) {
      console.error('Fehler beim Laden der KPIs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generiere historische Daten für Charts
  const generateHistoricalData = (currentKpis: ResourceKPIs) => {
    const data = [];
    for (let i = timeRange.days; i >= 0; i -= Math.ceil(timeRange.days / 7)) {
      const date = dayjs().subtract(i, 'days');
      // Simuliere Daten mit leichten Variationen
      const variation = 0.8 + Math.random() * 0.4;
      data.push({
        date: date.format('YYYY-MM-DD'),
        available: Math.round((currentKpis.total_resources_available || 0) * variation),
        allocated: Math.round((currentKpis.total_resources_allocated || 0) * variation),
        utilization: Math.round((currentKpis.utilization_rate || 0) * variation)
      });
    }
    setHistoricalData(data);
  };

  useEffect(() => {
    loadKPIData();
  }, [serviceProviderId, user?.id, timeRange]);

  // Berechne KPI-Karten
  const getKPICards = (): KPICard[] => {
    if (!kpis) return [];

    const utilizationStatus = (kpis.utilization_rate || 0) > 80 ? 'high' : 
                             (kpis.utilization_rate || 0) > 50 ? 'medium' : 'low';

    return [
      {
        title: 'Verfügbare Ressourcen',
        value: kpis.total_resources_available || 0,
        change: 12,
        changeLabel: 'vs. letzte Woche',
        icon: <Users className="w-5 h-5" />,
        color: '#10b981',
        bgColor: 'bg-green-500/10',
        description: 'Aktuell zur Planung freigegebene Ressourcen'
      },
      {
        title: 'Verplante Ressourcen',
        value: kpis.total_resources_allocated || 0,
        change: -5,
        changeLabel: 'vs. letzte Woche',
        icon: <Calendar className="w-5 h-5" />,
        color: '#3b82f6',
        bgColor: 'bg-blue-500/10',
        description: 'Bereits zugeteilte Ressourcen'
      },
      {
        title: 'Auslastungsrate',
        value: `${kpis.utilization_rate?.toFixed(1) || 0}%`,
        change: utilizationStatus === 'high' ? 8 : -3,
        changeLabel: 'Optimal: 70-85%',
        icon: <Activity className="w-5 h-5" />,
        color: utilizationStatus === 'high' ? '#ef4444' : 
                utilizationStatus === 'medium' ? '#f59e0b' : '#10b981',
        bgColor: utilizationStatus === 'high' ? 'bg-red-500/10' : 
                 utilizationStatus === 'medium' ? 'bg-yellow-500/10' : 'bg-green-500/10',
        description: 'Verhältnis verplant zu verfügbar'
      },
      {
        title: 'Durchschn. Stundensatz',
        value: `€${kpis.average_hourly_rate?.toFixed(2) || 0}`,
        change: 2.5,
        changeLabel: 'vs. letzte Woche',
        icon: <Euro className="w-5 h-5" />,
        color: '#ffbd59',
        bgColor: 'bg-[#ffbd59]/10',
        description: 'Mittlerer Stundensatz aller Ressourcen'
      },
      {
        title: 'Personentage verfügbar',
        value: kpis.total_person_days_available?.toFixed(0) || 0,
        icon: <Clock className="w-5 h-5" />,
        color: '#8b5cf6',
        bgColor: 'bg-purple-500/10',
        description: 'Gesamte verfügbare Personentage'
      },
      {
        title: 'Erwarteter Umsatz',
        value: `€${((kpis.total_revenue || 0) / 1000).toFixed(1)}k`,
        change: 15,
        changeLabel: 'vs. letzte Woche',
        icon: <TrendingUp className="w-5 h-5" />,
        color: '#06b6d4',
        bgColor: 'bg-cyan-500/10',
        description: 'Prognostizierter Umsatz aus Ressourcen'
      }
    ];
  };

  // Chart Konfigurationen
  const utilizationChartData = {
    labels: historicalData.map(d => dayjs(d.date).format('DD.MM')),
    datasets: [
      {
        label: 'Auslastung (%)',
        data: historicalData.map(d => d.utilization),
        borderColor: '#ffbd59',
        backgroundColor: 'rgba(255, 189, 89, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const resourceDistributionData = {
    labels: ['Verfügbar', 'Verplant', 'In Bearbeitung', 'Abgeschlossen'],
    datasets: [{
      data: [
        kpis?.total_resources_available || 0,
        kpis?.total_resources_allocated || 0,
        Math.round((kpis?.total_resources_allocated || 0) * 0.3),
        kpis?.total_resources_completed || 0
      ],
      backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#6b7280'],
      borderWidth: 0
    }]
  };

  const personDaysChartData = {
    labels: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'],
    datasets: [
      {
        label: 'Verfügbar',
        data: [45, 52, 48, 50, 55, 20, 15],
        backgroundColor: '#10b981'
      },
      {
        label: 'Verplant',
        data: [35, 42, 38, 40, 45, 10, 5],
        backgroundColor: '#3b82f6'
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: {
          color: '#9ca3af',
          padding: 10,
          font: {
            size: 11
          }
        }
      },
      tooltip: {
        backgroundColor: '#1a1a1a',
        titleColor: '#fff',
        bodyColor: '#9ca3af',
        borderColor: '#333',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        grid: {
          color: '#333',
          drawBorder: false
        },
        ticks: {
          color: '#9ca3af',
          font: {
            size: 10
          }
        }
      },
      y: {
        grid: {
          color: '#333',
          drawBorder: false
        },
        ticks: {
          color: '#9ca3af',
          font: {
            size: 10
          }
        }
      }
    }
  };

  if (loading && !kpis) {
    return (
      <div className={`bg-[#1a1a1a] rounded-2xl p-6 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ffbd59] mx-auto mb-4"></div>
            <p className="text-gray-400">Lade KPI-Daten...</p>
          </div>
        </div>
      </div>
    );
  }

  const kpiCards = getKPICards();

  return (
    <div className={`bg-[#1a1a1a] rounded-2xl p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <BarChart3 className="w-6 h-6 text-[#ffbd59]" />
          <div>
            <h2 className="text-2xl font-bold text-white">Ressourcen KPI-Dashboard</h2>
            <p className="text-sm text-gray-400 mt-1">
              Übersicht über Ihre Ressourcenauslastung und Performance
            </p>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center space-x-2">
          {TIME_RANGES.map(range => (
            <button
              key={range.value}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                timeRange.value === range.value
                  ? 'bg-[#ffbd59] text-black font-semibold'
                  : 'bg-[#2a2a2a] text-gray-400 hover:text-white'
              }`}
            >
              {range.label}
            </button>
          ))}
          <button
            onClick={loadKPIData}
            className="p-1.5 bg-[#2a2a2a] rounded-lg hover:bg-[#333] transition-colors ml-2"
          >
            <RefreshCw className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {kpiCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`${card.bgColor} rounded-xl p-5 border border-gray-700 hover:border-gray-600 transition-all cursor-pointer`}
            onClick={() => setExpandedCard(expandedCard === card.title ? null : card.title)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: `${card.color}20` }}>
                <div style={{ color: card.color }}>{card.icon}</div>
              </div>
              {card.change !== undefined && (
                <div className="flex items-center space-x-1">
                  {card.change > 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                  <span className={`text-sm font-semibold ${
                    card.change > 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {Math.abs(card.change)}%
                  </span>
                </div>
              )}
            </div>

            <div className="mb-2">
              <p className="text-gray-400 text-sm mb-1">{card.title}</p>
              <p className="text-2xl font-bold text-white">{card.value}</p>
            </div>

            {card.changeLabel && (
              <p className="text-xs text-gray-500">{card.changeLabel}</p>
            )}

            {/* Expanded Details */}
            {expandedCard === card.title && card.description && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3 pt-3 border-t border-gray-700"
              >
                <p className="text-sm text-gray-400">{card.description}</p>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Auslastungstrend */}
        <div className="bg-[#2a2a2a] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <Activity className="w-5 h-5 mr-2 text-[#ffbd59]" />
              Auslastungstrend
            </h3>
            <span className="text-xs text-gray-400">Letzte {timeRange.days} Tage</span>
          </div>
          <div className="h-64">
            <Line data={utilizationChartData} options={chartOptions} />
          </div>
        </div>

        {/* Ressourcenverteilung */}
        <div className="bg-[#2a2a2a] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <PieChart className="w-5 h-5 mr-2 text-[#ffbd59]" />
              Ressourcenverteilung
            </h3>
            <span className="text-xs text-gray-400">Aktueller Status</span>
          </div>
          <div className="h-64">
            <Doughnut 
              data={resourceDistributionData} 
              options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  legend: {
                    ...chartOptions.plugins.legend,
                    position: 'right' as const
                  }
                }
              }} 
            />
          </div>
        </div>
      </div>

      {/* Personentage Analyse */}
      <div className="bg-[#2a2a2a] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <Users className="w-5 h-5 mr-2 text-[#ffbd59]" />
            Personentage pro Wochentag
          </h3>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-xs text-gray-400">Verfügbar</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-xs text-gray-400">Verplant</span>
            </div>
          </div>
        </div>
        <div className="h-64">
          <Bar 
            data={personDaysChartData} 
            options={{
              ...chartOptions,
              scales: {
                ...chartOptions.scales,
                x: {
                  ...chartOptions.scales.x,
                  stacked: false
                },
                y: {
                  ...chartOptions.scales.y,
                  stacked: false
                }
              }
            }} 
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={onResourceClick}
            className="px-4 py-2 bg-[#ffbd59] text-black rounded-lg hover:bg-[#f59e0b] transition-colors flex items-center space-x-2"
          >
            <Zap className="w-4 h-4" />
            <span>Ressourcen optimieren</span>
          </button>
          <button className="px-4 py-2 bg-[#2a2a2a] text-white rounded-lg hover:bg-[#333] transition-colors flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm text-gray-400">System optimal</span>
          </div>
          {kpis && kpis.utilization_rate && kpis.utilization_rate > 85 && (
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-yellow-500" />
              <span className="text-sm text-gray-400">Hohe Auslastung</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResourceKPIDashboard;