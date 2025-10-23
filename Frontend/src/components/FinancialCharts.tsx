import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { getApiBaseUrl } from '../api/api';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3, 
  PieChart, 
  Calendar,
  Target,
  AlertTriangle,
  CheckCircle,
  Info,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from 'lucide-react';

interface FinancialData {
  date: string;
  amount: number;
  category: string;
  description: string;
  type: 'income' | 'expense';
}

interface FinancialChartsProps {
  projectId: number;
  projectName: string;
  budget?: number;
  currentCosts: number;
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string[];
    borderColor: string[];
    borderWidth: number;
  }[];
}

export default function FinancialCharts({ 
  projectId, 
  projectName, 
  budget = 0, 
  currentCosts 
}: FinancialChartsProps) {
  const [financialData, setFinancialData] = useState<FinancialData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'month' | 'quarter' | 'year'>('month');
  const [selectedChart, setSelectedChart] = useState<'timeline' | 'volume' | 'category'>('timeline');
  const [timelineData, setTimelineData] = useState<any>(null);
  const [volumeData, setVolumeData] = useState<any>(null);
  const [categoryData, setCategoryData] = useState<any>(null);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Refs für bessere Performance und Cleanup
  const isMountedRef = useRef(true);

  // Cleanup beim Unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadFinancialData = async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Kein Authentifizierungstoken gefunden');
        }

        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        // Lade alle Finanzdaten parallel
        const baseUrl = getApiBaseUrl();
        const [timelineResponse, volumeResponse, categoryResponse, summaryResponse] = await Promise.all([
          fetch(`${baseUrl}/api/v1/financial-charts/project/${projectId}/timeline-data?months=12`, { headers }),
          fetch(`${baseUrl}/api/v1/financial-charts/project/${projectId}/volume-data?limit=10`, { headers }),
          fetch(`${baseUrl}/api/v1/financial-charts/project/${projectId}/category-data`, { headers }),
          fetch(`${baseUrl}/api/v1/financial-charts/project/${projectId}/summary`, { headers })
        ]);

        if (!timelineResponse.ok || !volumeResponse.ok || !categoryResponse.ok || !summaryResponse.ok) {
          throw new Error('Fehler beim Laden der Finanzdaten');
        }

        const [timelineData, volumeData, categoryData, summaryData] = await Promise.all([
          timelineResponse.json(),
          volumeResponse.json(),
          categoryResponse.json(),
          summaryResponse.json()
        ]);

        // Nur State aktualisieren wenn Komponente noch gemountet ist
        if (isMountedRef.current) {
          setTimelineData(timelineData);
          setVolumeData(volumeData);
          setCategoryData(categoryData);
          setSummaryData(summaryData);
          setError(null);
        }
      } catch (err) {
        if (isMountedRef.current) {
          setError(err instanceof Error ? err.message : 'Fehler beim Laden der Finanzdaten');
          console.error('Error loading financial data:', err);
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

  useEffect(() => {
    if (projectId && isMountedRef.current) {
      loadFinancialData();
    }
  }, [projectId]);

  // Berechne Budget-Status
  const budgetStatus = useMemo(() => {
    if (!summaryData) {
      return {
        totalExpenses: currentCosts,
        remaining: budget - currentCosts,
        percentage: budget > 0 ? (currentCosts / budget) * 100 : 0,
        isOverBudget: currentCosts > budget
      };
    }
    
    return {
      totalExpenses: summaryData.total_expenses,
      remaining: summaryData.remaining_budget,
      percentage: summaryData.budget_percentage,
      isOverBudget: summaryData.is_over_budget
    };
  }, [summaryData, budget, currentCosts]);

  const renderTimelineChart = () => (
    <div className="relative">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-2 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-blue-400" />
          Kostenverlauf über Zeit
        </h3>
        <p className="text-gray-400 text-sm">Monatliche Ausgabenentwicklung (Direkte Ausgaben & Rechnungspositionen)</p>
      </div>
      
      <div className="bg-gradient-to-br from-[#1a1a2e]/90 to-[#16213e]/90 rounded-xl p-6 border border-white/10">
        {timelineData && timelineData.data && timelineData.data.length > 0 ? (
          <div className="space-y-4">
            {timelineData.data.map((item: any, index: number) => {
              const maxExpense = Math.max(...timelineData.data.map((d: any) => d.expenses));
              const percentage = maxExpense > 0 ? (item.expenses / maxExpense) * 100 : 0;
              
              return (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">{item.month}</span>
                    <span className="text-sm font-medium text-white">
                      {item.expenses.toLocaleString('de-DE')} €
                    </span>
                  </div>
                  <div className="w-full bg-gray-700/50 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-blue-400 to-cyan-400 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">Keine zeitbasierten Daten verfügbar</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderVolumeChart = () => (
    <div className="relative">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-2 flex items-center">
          <BarChart3 className="w-5 h-5 mr-2 text-green-400" />
          Top Ausgaben nach Volumen
        </h3>
        <p className="text-gray-400 text-sm">Größte Kostenpositionen (Ausgaben & Rechnungen)</p>
      </div>
      
      <div className="bg-gradient-to-br from-[#1a1a2e]/90 to-[#16213e]/90 rounded-xl p-6 border border-white/10">
        {volumeData && volumeData.data && volumeData.data.length > 0 ? (
          <div className="space-y-4">
            {volumeData.data.map((item: any, index: number) => {
              const maxAmount = Math.max(...volumeData.data.map((d: any) => d.amount));
              const percentage = maxAmount > 0 ? (item.amount / maxAmount) * 100 : 0;
              
              const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd'];
              const color = colors[index % colors.length];
              
              // Unterscheide zwischen direkten Ausgaben und Rechnungspositionen
              const isInvoiceCost = item.type === 'invoice';
              const typeLabel = isInvoiceCost ? 'Rechnung' : 'Direkte Ausgabe';
              const typeColor = isInvoiceCost ? 'text-blue-400' : 'text-green-400';
              
              return (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: color }}
                      ></div>
                      <span className="text-sm text-gray-300">{item.description}</span>
                      <span className="text-xs text-gray-500 bg-gray-700/50 px-2 py-1 rounded">
                        {item.category}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${isInvoiceCost ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>
                        {typeLabel}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-white">
                      {item.amount.toLocaleString('de-DE')} €
                    </span>
                  </div>
                  <div className="w-full bg-gray-700/50 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: color
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">Keine Volumendaten verfügbar</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderCategoryChart = () => (
    <div className="relative">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-2 flex items-center">
          <PieChart className="w-5 h-5 mr-2 text-purple-400" />
          Kostenverteilung nach Kategorien
        </h3>
        <p className="text-gray-400 text-sm">Anteilige Aufteilung der Ausgaben (Direkte Ausgaben & Rechnungspositionen)</p>
      </div>
      
      <div className="bg-gradient-to-br from-[#1a1a2e]/90 to-[#16213e]/90 rounded-xl p-6 border border-white/10">
        {categoryData && categoryData.categories && categoryData.categories.length > 0 ? (
          <div className="space-y-6">
            {/* Legende für Kostenarten */}
            <div className="flex items-center justify-center space-x-6 mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="text-sm text-gray-300">Direkte Ausgaben</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                <span className="text-sm text-gray-300">Rechnungspositionen</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Kategorien-Liste */}
              <div className="space-y-3">
                {categoryData.categories.map((category: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: category.color }}
                      ></div>
                      <span className="text-sm text-gray-300">{category.category}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-white">
                        {category.amount.toLocaleString('de-DE')} €
                      </div>
                      <div className="text-xs text-gray-400">
                        {category.percentage}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Kreisdiagramm-Visualisierung */}
              <div className="flex items-center justify-center">
                <div className="relative w-48 h-48">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    {categoryData.categories.map((category: any, index: number) => {
                      const circumference = 2 * Math.PI * 45; // Radius 45
                      const strokeDasharray = `${(category.percentage / 100) * circumference} ${circumference}`;
                      const strokeDashoffset = categoryData.categories.slice(0, index).reduce((offset: number, cat: any) => {
                        return offset - (cat.percentage / 100) * circumference;
                      }, 0);
                      
                      return (
                        <circle
                          key={index}
                          cx="50"
                          cy="50"
                          r="45"
                          fill="none"
                          stroke={category.color}
                          strokeWidth="8"
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                          className="transition-all duration-500"
                        />
                      );
                    })}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-lg font-bold text-white">
                        {categoryData.total_amount.toLocaleString('de-DE')} €
                      </div>
                      <div className="text-xs text-gray-400">Gesamtausgaben</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">Keine Kategoriedaten verfügbar</p>
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-[#1a1a2e]/90 to-[#16213e]/90 rounded-2xl p-8 border border-white/10">
        <div className="flex items-center justify-center">
          <RefreshCw className="w-8 h-8 text-[#ffbd59] animate-spin mr-3" />
          <span className="text-white">Lade Finanzdaten...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-[#1a1a2e]/90 to-[#16213e]/90 rounded-2xl p-8 border border-red-500/30">
        <div className="flex items-center justify-center text-red-400">
          <AlertTriangle className="w-8 h-8 mr-3" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header mit Budget-Status */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-[#ffbd59]/20 via-[#ffa726]/20 to-[#ffbd59]/20 rounded-2xl blur-xl"></div>
        <div className="relative bg-gradient-to-r from-[#1a1a2e]/95 to-[#16213e]/95 backdrop-blur-lg rounded-2xl border border-[#ffbd59]/30 p-6 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="absolute inset-0 bg-[#ffbd59] rounded-xl blur-lg opacity-60"></div>
                <div className="relative w-12 h-12 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-xl flex items-center justify-center shadow-lg">
                  <DollarSign size={24} className="text-[#2c3539] drop-shadow-lg" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-white via-[#ffbd59] to-white bg-clip-text text-transparent">
                  Finanz-Analyse
                </h2>
                <p className="text-gray-300 text-sm mt-1">
                  Detaillierte Kostenanalyse für <span className="text-[#ffbd59] font-semibold">{projectName}</span>
                  <br />
                  <span className="text-xs text-gray-400">Inklusive direkter Ausgaben und Rechnungspositionen</span>
                </p>
              </div>
            </div>
            
            {/* Budget-Status und Refresh-Button */}
            <div className="text-right">
              <div className="flex items-center justify-end space-x-4 mb-4">
                <button
                  onClick={() => loadFinancialData(true)}
                  disabled={refreshing}
                  className="group relative overflow-hidden bg-gradient-to-r from-[#ffbd59]/20 to-[#ffa726]/20 hover:from-[#ffbd59]/30 hover:to-[#ffa726]/30 backdrop-blur-sm border border-[#ffbd59]/40 hover:border-[#ffbd59]/60 rounded-xl p-3 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-[#ffbd59]/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#ffbd59]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <RefreshCw className={`w-5 h-5 text-[#ffbd59] group-hover:text-white transition-colors duration-300 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
              <div className={`text-2xl font-bold ${budgetStatus.isOverBudget ? 'text-red-400' : 'text-white'}`}>
                {budgetStatus.totalExpenses.toLocaleString('de-DE')} €
              </div>
              <div className="text-sm text-gray-400">
                von {budget.toLocaleString('de-DE')} € Budget
              </div>
              <div className={`text-xs ${budgetStatus.isOverBudget ? 'text-red-400' : 'text-green-400'}`}>
                {budgetStatus.isOverBudget ? 'Über Budget!' : `${budgetStatus.remaining.toLocaleString('de-DE')} € verbleibend`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chart-Navigation */}
      <div className="flex items-center justify-center space-x-2">
        <button
          onClick={() => setSelectedChart('timeline')}
          className={`px-4 py-2 rounded-lg transition-all duration-300 ${
            selectedChart === 'timeline'
              ? 'bg-[#ffbd59] text-[#2c3539] shadow-lg shadow-[#ffbd59]/30'
              : 'bg-white/10 text-gray-300 hover:bg-white/20'
          }`}
        >
          <TrendingUp className="w-4 h-4 mr-2 inline" />
          Zeitverlauf
        </button>
        <button
          onClick={() => setSelectedChart('volume')}
          className={`px-4 py-2 rounded-lg transition-all duration-300 ${
            selectedChart === 'volume'
              ? 'bg-[#ffbd59] text-[#2c3539] shadow-lg shadow-[#ffbd59]/30'
              : 'bg-white/10 text-gray-300 hover:bg-white/20'
          }`}
        >
          <BarChart3 className="w-4 h-4 mr-2 inline" />
          Volumen
        </button>
        <button
          onClick={() => setSelectedChart('category')}
          className={`px-4 py-2 rounded-lg transition-all duration-300 ${
            selectedChart === 'category'
              ? 'bg-[#ffbd59] text-[#2c3539] shadow-lg shadow-[#ffbd59]/30'
              : 'bg-white/10 text-gray-300 hover:bg-white/20'
          }`}
        >
          <PieChart className="w-4 h-4 mr-2 inline" />
          Kategorien
        </button>
      </div>

      {/* Chart-Container */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-[#ffbd59]/10 via-[#ffa726]/10 to-[#ffbd59]/10 rounded-3xl blur-2xl"></div>
        <div className="relative bg-gradient-to-br from-[#1a1a2e]/95 to-[#16213e]/95 backdrop-blur-xl rounded-3xl border border-[#ffbd59]/20 p-8 shadow-2xl">
          {selectedChart === 'timeline' && renderTimelineChart()}
          {selectedChart === 'volume' && renderVolumeChart()}
          {selectedChart === 'category' && renderCategoryChart()}
        </div>
      </div>
    </div>
  );
}
