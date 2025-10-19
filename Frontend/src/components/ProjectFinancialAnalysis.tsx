import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  PieChart, 
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Target,
  RefreshCw,
  FileText,
  User
} from 'lucide-react';

interface ProjectFinancialAnalysisProps {
  projectId: number;
  projectName: string;
  budget?: number;
}

interface FinancialData {
  totalExpenses: number;
  remainingBudget: number;
  budgetPercentage: number;
  isOverBudget: boolean;
  categories: Array<{
    category: string;
    amount: number;
    percentage: number;
    color: string;
  }>;
  timelineData: Array<{
    month: string;
    expenses: number;
    income: number;
  }>;
  costBreakdown: Array<{
    id: number;
    type: 'invoice' | 'expense' | 'cost_position';
    description: string;
    amount: number;
    category: string;
    date: string;
    contractor_name?: number | string;
    invoice_number?: string;
    cost_type: string;
    position_order: number;
  }>;
  costAnalysis: {
    cost_by_type: Record<string, number>;
    cost_by_category: Record<string, number>;
    average_cost_position: number;
    total_cost_positions: number;
    total_expenses: number;
    total_cost_items: number;
  };
}

export default function ProjectFinancialAnalysis({ 
  projectId, 
  projectName, 
  budget = 0 
}: ProjectFinancialAnalysisProps) {
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChart, setSelectedChart] = useState<'categories' | 'timeline' | 'breakdown' | 'analysis'>('categories');
  const [refreshing, setRefreshing] = useState(false);

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

        // Lade Finanzdaten vom Backend
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
        const [summaryResponse, categoryResponse, timelineResponse, breakdownResponse, analysisResponse] = await Promise.all([
          fetch(`${baseUrl}/financial-charts/project/${projectId}/summary`, { headers }),
          fetch(`${baseUrl}/financial-charts/project/${projectId}/category-data`, { headers }),
          fetch(`${baseUrl}/financial-charts/project/${projectId}/timeline-data?months=12`, { headers }),
          fetch(`${baseUrl}/financial-charts/project/${projectId}/cost-breakdown?limit=20`, { headers }),
          fetch(`${baseUrl}/financial-charts/project/${projectId}/cost-analysis`, { headers })
        ]);

        if (!summaryResponse.ok || !categoryResponse.ok || !timelineResponse.ok || !breakdownResponse.ok || !analysisResponse.ok) {
          throw new Error('Fehler beim Laden der Finanzdaten');
        }

        const [summaryData, categoryData, timelineData, breakdownData, analysisData] = await Promise.all([
          summaryResponse.json(),
          categoryResponse.json(),
          timelineResponse.json(),
          breakdownResponse.json(),
          analysisResponse.json()
        ]);

        // Verwende echte Daten aus der API
        console.log('[Frontend] Setting financial data:', {
          summary: summaryData,
          categories: categoryData.categories,
          timeline: timelineData.data,
          breakdown: breakdownData.costs,
          analysis: analysisData
        });
        
        setFinancialData({
          totalExpenses: summaryData.total_expenses,
          remainingBudget: summaryData.remaining_budget,
          budgetPercentage: summaryData.budget_percentage,
          isOverBudget: summaryData.is_over_budget,
          categories: categoryData.categories || [],
          timelineData: timelineData.data || [],
          costBreakdown: breakdownData.costs || [],
          costAnalysis: analysisData
        });

        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Fehler beim Laden der Finanzdaten');
        console.error('Error loading financial data:', err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

  useEffect(() => {
    if (projectId) {
      loadFinancialData();
    }
  }, [projectId]);

  const renderKPICards = () => {
    if (!financialData) return null;

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        {/* Gesamtausgaben */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl blur-lg"></div>
          <div className="relative bg-gradient-to-br from-[#1a1a2e]/95 to-[#16213e]/95 backdrop-blur-lg rounded-xl border border-blue-500/30 p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-blue-400 text-xs md:text-sm font-medium">Gesamtausgaben</p>
                <p className="text-lg md:text-2xl font-bold text-white mt-1 truncate">
                  {financialData.totalExpenses.toLocaleString('de-DE')} €
                </p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0 ml-2">
                <DollarSign className="w-5 h-5 md:w-6 md:h-6 text-blue-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Budget-Status */}
        <div className="relative">
          <div className={`absolute inset-0 ${financialData.isOverBudget ? 'bg-gradient-to-r from-red-500/20 to-orange-500/20' : 'bg-gradient-to-r from-green-500/20 to-emerald-500/20'} rounded-xl blur-lg`}></div>
          <div className={`relative bg-gradient-to-br from-[#1a1a2e]/95 to-[#16213e]/95 backdrop-blur-lg rounded-xl border ${financialData.isOverBudget ? 'border-red-500/30' : 'border-green-500/30'} p-4 md:p-6`}>
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className={`${financialData.isOverBudget ? 'text-red-400' : 'text-green-400'} text-xs md:text-sm font-medium`}>
                  {financialData.isOverBudget ? 'Über Budget' : 'Verbleibendes Budget'}
                </p>
                <p className={`text-lg md:text-2xl font-bold ${financialData.isOverBudget ? 'text-red-400' : 'text-green-400'} mt-1 truncate`}>
                  {Math.abs(financialData.remainingBudget).toLocaleString('de-DE')} €
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {financialData.budgetPercentage.toFixed(1)}% des Budgets
                </p>
              </div>
              <div className={`w-10 h-10 md:w-12 md:h-12 ${financialData.isOverBudget ? 'bg-red-500/20' : 'bg-green-500/20'} rounded-xl flex items-center justify-center flex-shrink-0 ml-2`}>
                {financialData.isOverBudget ? (
                  <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-red-400" />
                ) : (
                  <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-green-400" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Kostenpositionen */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl blur-lg"></div>
          <div className="relative bg-gradient-to-br from-[#1a1a2e]/95 to-[#16213e]/95 backdrop-blur-lg rounded-xl border border-purple-500/30 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-400 text-sm font-medium">Kostenpositionen</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {financialData.costAnalysis?.total_cost_positions || 0}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Ø {financialData.costAnalysis?.average_cost_position?.toLocaleString('de-DE') || '0'} €
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Direkte Ausgaben */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-xl blur-lg"></div>
          <div className="relative bg-gradient-to-br from-[#1a1a2e]/95 to-[#16213e]/95 backdrop-blur-lg rounded-xl border border-emerald-500/30 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-400 text-sm font-medium">Direkte Ausgaben</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {financialData.costAnalysis?.total_expenses || 0}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {financialData.costAnalysis?.total_cost_items || 0} Gesamtpositionen
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCategoryChart = () => {
    if (!financialData || !financialData.categories.length) {
      return (
        <div className="text-center py-8">
          <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400">Keine Kategoriedaten verfügbar</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Kategorien-Liste */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white mb-4">Kosten nach Kategorien</h4>
          {financialData.categories.map((category, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
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

        {/* Kreisdiagramm */}
        <div className="flex items-center justify-center">
          <div className="relative w-64 h-64">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {financialData.categories.map((category, index) => {
                const circumference = 2 * Math.PI * 45;
                const strokeDasharray = `${(category.percentage / 100) * circumference} ${circumference}`;
                const strokeDashoffset = financialData.categories.slice(0, index).reduce((offset, cat) => {
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
                <div className="text-xl font-bold text-white">
                  {financialData.totalExpenses.toLocaleString('de-DE')} €
                </div>
                <div className="text-xs text-gray-400">Gesamtausgaben</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTimelineChart = () => {
    if (!financialData || !financialData.costBreakdown.length) {
      return (
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400">Keine Kostenpositionen verfügbar</p>
        </div>
      );
    }

    // Sortiere Kostenpositionen nach Datum
    const sortedCosts = [...financialData.costBreakdown].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA.getTime() - dateB.getTime();
    });

    const getTypeColor = (type: string) => {
      switch (type) {
        case 'invoice': return 'bg-blue-500';
        case 'cost_position': return 'bg-purple-500';
        case 'expense': return 'bg-emerald-500';
        default: return 'bg-gray-500';
      }
    };

    const getTypeIcon = (type: string) => {
      switch (type) {
        case 'invoice': return '📄';
        case 'cost_position': return '📋';
        case 'expense': return '💰';
        default: return '📊';
      }
    };

    const getTypeLabel = (type: string) => {
      switch (type) {
        case 'invoice': return 'Rechnung';
        case 'cost_position': return 'Kostenposition';
        case 'expense': return 'Direkte Ausgabe';
        default: return 'Sonstige';
      }
    };

    return (
      <div className="space-y-6">
        <h4 className="text-lg font-semibold text-white mb-4">Zeitstrahl der Kostenpositionen</h4>
        
        {/* Zeitstrahl - Mobile Optimized */}
        <div className="relative">
          {/* Zentrale Linie */}
          <div className="absolute left-6 md:left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-400 via-purple-400 to-emerald-400"></div>
          
          {/* Zeitstrahl-Punkte */}
          <div className="space-y-6 md:space-y-8">
            {sortedCosts.map((cost, index) => {
              const date = new Date(cost.date);
              
              return (
                <div key={cost.id} className="relative flex items-start gap-4 md:gap-6">
                  {/* Zeitstrahl-Punkt */}
                  <div className="relative z-10 flex-shrink-0">
                    <div className={`w-12 h-12 md:w-16 md:h-16 rounded-full ${getTypeColor(cost.type)} flex items-center justify-center text-white text-sm md:text-lg font-bold shadow-lg border-2 md:border-4 border-[#1a1a2e]`}>
                      {getTypeIcon(cost.type)}
                    </div>
                    {/* Datum */}
                    <div className="absolute -bottom-6 md:-bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-gray-400 whitespace-nowrap">
                      {date.toLocaleDateString('de-DE')}
                    </div>
                  </div>
                  
                  {/* Inhalt */}
                  <div className="flex-1 bg-gradient-to-r from-[#1a1a2e]/50 to-[#16213e]/50 backdrop-blur-lg rounded-xl border border-gray-700/50 p-3 md:p-4 hover:border-gray-600/50 transition-all duration-200">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2 gap-2">
                      <div className="flex flex-col md:flex-row md:items-center gap-2">
                        <h5 className="text-white font-semibold text-sm md:text-base truncate">{cost.description}</h5>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium self-start ${
                          cost.type === 'invoice' ? 'bg-blue-500/20 text-blue-300' :
                          cost.type === 'cost_position' ? 'bg-purple-500/20 text-purple-300' :
                          'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {getTypeLabel(cost.type)}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-bold text-base md:text-lg">
                          {cost.amount.toLocaleString('de-DE')} €
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-gray-400">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        cost.category === 'material' ? 'bg-blue-500/20 text-blue-300' :
                        cost.category === 'labor' ? 'bg-green-500/20 text-green-300' :
                        cost.category === 'equipment' ? 'bg-purple-500/20 text-purple-300' :
                        'bg-gray-500/20 text-gray-300'
                      }`}>
                        {cost.category}
                      </span>
                      <span>Typ: {cost.cost_type}</span>
                      {cost.invoice_number && (
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          <span className="hidden sm:inline">{cost.invoice_number}</span>
                          <span className="sm:hidden">{cost.invoice_number.substring(0, 8)}...</span>
                        </span>
                      )}
                      {cost.contractor_name && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span className="hidden sm:inline">{cost.contractor_name}</span>
                          <span className="sm:hidden">{String(cost.contractor_name).substring(0, 10)}...</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Zusammenfassung */}
        <div className="mt-8 p-4 bg-gradient-to-r from-[#1a1a2e]/30 to-[#16213e]/30 backdrop-blur-lg rounded-xl border border-gray-700/50">
          <h5 className="text-white font-semibold mb-2">Zeitraum-Zusammenfassung</h5>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Zeitraum:</span>
              <div className="text-white font-medium">
                {sortedCosts.length > 0 && (
                  <>
                    {new Date(sortedCosts[0].date).toLocaleDateString('de-DE')} - {' '}
                    {new Date(sortedCosts[sortedCosts.length - 1].date).toLocaleDateString('de-DE')}
                  </>
                )}
              </div>
            </div>
            <div>
              <span className="text-gray-400">Anzahl Einträge:</span>
              <div className="text-white font-medium">{sortedCosts.length}</div>
            </div>
            <div>
              <span className="text-gray-400">Gesamtbetrag:</span>
              <div className="text-white font-medium">
                {sortedCosts.reduce((sum, cost) => sum + cost.amount, 0).toLocaleString('de-DE')} €
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCostBreakdown = () => {
    if (!financialData || !financialData.costBreakdown.length) {
      return (
        <div className="text-center py-8">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400">Keine Kostenpositionen verfügbar</p>
        </div>
      );
    }

    // Gruppiere nach Typ für bessere Übersicht
    const groupedCosts = financialData.costBreakdown.reduce((acc, item) => {
      if (!acc[item.type]) {
        acc[item.type] = [];
      }
      acc[item.type].push(item);
      return acc;
    }, {} as Record<string, typeof financialData.costBreakdown>);

    const getTypeLabel = (type: string) => {
      switch (type) {
        case 'invoice': return 'Rechnungen';
        case 'cost_position': return 'Kostenpositionen';
        case 'expense': return 'Direkte Ausgaben';
        default: return 'Sonstige';
      }
    };

    const getTypeColor = (type: string) => {
      switch (type) {
        case 'invoice': return 'bg-blue-500';
        case 'cost_position': return 'bg-purple-500';
        case 'expense': return 'bg-emerald-500';
        default: return 'bg-gray-500';
      }
    };

    const getTypeIcon = (type: string) => {
      switch (type) {
        case 'invoice': return '📄';
        case 'cost_position': return '📋';
        case 'expense': return '💰';
        default: return '📊';
      }
    };

    return (
      <div className="space-y-6">
        <h4 className="text-lg font-semibold text-white mb-4">Detaillierte Kostenaufschlüsselung</h4>
        
        {Object.entries(groupedCosts).map(([type, items]) => (
          <div key={type} className="space-y-3">
            {/* Typ-Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-8 h-8 rounded-lg ${getTypeColor(type)} flex items-center justify-center text-white text-sm font-bold`}>
                {getTypeIcon(type)}
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">{getTypeLabel(type)}</h3>
                <p className="text-gray-400 text-sm">
                  {items.length} {items.length === 1 ? 'Eintrag' : 'Einträge'} • 
                  Gesamt: {items.reduce((sum, item) => sum + item.amount, 0).toLocaleString('de-DE')} €
                </p>
              </div>
            </div>

            {/* Liste der Einträge - Mobile Optimized */}
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={item.id} className="bg-gradient-to-r from-[#1a1a2e]/50 to-[#16213e]/50 backdrop-blur-lg rounded-xl border border-gray-700/50 p-3 md:p-4 hover:border-gray-600/50 transition-all duration-200">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex items-start gap-3 md:gap-4 flex-1">
                      {/* Nummer */}
                      <div className="w-6 h-6 md:w-8 md:h-8 bg-gray-700/50 rounded-lg flex items-center justify-center text-gray-300 text-xs md:text-sm font-medium flex-shrink-0">
                        {index + 1}
                      </div>
                      
                      {/* Hauptinhalt */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                          <h4 className="text-white font-medium text-sm md:text-base truncate">{item.description}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium self-start ${
                            item.category === 'material' ? 'bg-blue-500/20 text-blue-300' :
                            item.category === 'labor' ? 'bg-green-500/20 text-green-300' :
                            item.category === 'equipment' ? 'bg-purple-500/20 text-purple-300' :
                            'bg-gray-500/20 text-gray-300'
                          }`}>
                            {item.category}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {item.date ? new Date(item.date).toLocaleDateString('de-DE') : 'N/A'}
                          </span>
                          {item.invoice_number && (
                            <span className="flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              <span className="hidden sm:inline">{item.invoice_number}</span>
                              <span className="sm:hidden">{item.invoice_number.substring(0, 8)}...</span>
                            </span>
                          )}
                          {item.contractor_name && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              <span className="hidden sm:inline">{item.contractor_name}</span>
                              <span className="sm:hidden">{String(item.contractor_name).substring(0, 10)}...</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Betrag */}
                    <div className="text-right md:text-right">
                      <div className="text-white font-bold text-base md:text-lg">
                        {item.amount.toLocaleString('de-DE')} €
                      </div>
                      <div className="text-gray-400 text-xs">
                        {item.cost_type}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderCostAnalysis = () => {
    if (!financialData || !financialData.costAnalysis) {
      return (
        <div className="text-center py-8">
          <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400">Keine Analyse-Daten verfügbar</p>
        </div>
      );
    }

    const { costAnalysis } = financialData;

    return (
      <div className="space-y-6">
        <h4 className="text-lg font-semibold text-white mb-4">Erweiterte Kostenanalyse</h4>
        
        {/* Statistiken */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl blur-lg"></div>
            <div className="relative bg-gradient-to-br from-[#1a1a2e]/95 to-[#16213e]/95 backdrop-blur-lg rounded-xl border border-purple-500/30 p-4">
              <div className="text-center">
                <p className="text-purple-400 text-sm font-medium">Durchschnittliche Kostenposition</p>
                <p className="text-xl font-bold text-white mt-1">
                  {costAnalysis.average_cost_position.toLocaleString('de-DE')} €
                </p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl blur-lg"></div>
            <div className="relative bg-gradient-to-br from-[#1a1a2e]/95 to-[#16213e]/95 backdrop-blur-lg rounded-xl border border-cyan-500/30 p-4">
              <div className="text-center">
                <p className="text-cyan-400 text-sm font-medium">Kostenpositionen</p>
                <p className="text-xl font-bold text-white mt-1">
                  {costAnalysis.total_cost_positions}
                </p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-xl blur-lg"></div>
            <div className="relative bg-gradient-to-br from-[#1a1a2e]/95 to-[#16213e]/95 backdrop-blur-lg rounded-xl border border-emerald-500/30 p-4">
              <div className="text-center">
                <p className="text-emerald-400 text-sm font-medium">Direkte Ausgaben</p>
                <p className="text-xl font-bold text-white mt-1">
                  {costAnalysis.total_expenses}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Kosten nach Typ */}
        {Object.keys(costAnalysis.cost_by_type).length > 0 && (
          <div className="space-y-4">
            <h5 className="text-md font-semibold text-white">Kosten nach Typ</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(costAnalysis.cost_by_type).map(([type, amount]) => (
                <div key={type} className="bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300 capitalize">{type}</span>
                    <span className="text-sm font-medium text-white">
                      {amount.toLocaleString('de-DE')} €
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Kosten nach Kategorie */}
        {Object.keys(costAnalysis.cost_by_category).length > 0 && (
          <div className="space-y-4">
            <h5 className="text-md font-semibold text-white">Kosten nach Kategorie</h5>
            <div className="space-y-2">
              {Object.entries(costAnalysis.cost_by_category)
                .sort(([,a], [,b]) => b - a)
                .map(([category, amount]) => (
                <div key={category} className="flex items-center justify-between p-3 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10">
                  <span className="text-sm text-gray-300 capitalize">{category}</span>
                  <span className="text-sm font-medium text-white">
                    {amount.toLocaleString('de-DE')} €
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

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
      {/* Header - Mobile Optimized */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-[#ffbd59]/20 via-[#ffa726]/20 to-[#ffbd59]/20 rounded-2xl blur-xl"></div>
        <div className="relative bg-gradient-to-r from-[#1a1a2e]/95 to-[#16213e]/95 backdrop-blur-lg rounded-2xl border border-[#ffbd59]/30 p-4 md:p-6 shadow-2xl">
          <div className="flex items-center space-x-3 md:space-x-4">
            <div className="relative">
              <div className="absolute inset-0 bg-[#ffbd59] rounded-xl blur-lg opacity-60"></div>
              <div className="relative w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-xl flex items-center justify-center shadow-lg">
                <DollarSign size={20} className="md:w-6 md:h-6 text-[#2c3539] drop-shadow-lg" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-white via-[#ffbd59] to-white bg-clip-text text-transparent">
                Finanz-Analyse
              </h2>
              <p className="text-gray-300 text-xs md:text-sm mt-1 truncate">
                Projekt: <span className="text-[#ffbd59] font-semibold">{projectName}</span>
              </p>
            </div>
            
            {/* Refresh Button */}
            <div className="flex items-center">
              <button
                onClick={() => loadFinancialData(true)}
                disabled={refreshing}
                className="group relative overflow-hidden bg-gradient-to-r from-[#ffbd59]/20 to-[#ffa726]/20 hover:from-[#ffbd59]/30 hover:to-[#ffa726]/30 backdrop-blur-sm border border-[#ffbd59]/40 hover:border-[#ffbd59]/60 rounded-xl p-2 md:p-3 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-[#ffbd59]/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#ffbd59]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <RefreshCw className={`w-4 h-4 md:w-5 md:h-5 text-[#ffbd59] group-hover:text-white transition-colors duration-300 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      {renderKPICards()}

      {/* Chart Navigation - Mobile Optimized */}
      <div className="grid grid-cols-2 md:flex md:flex-wrap md:justify-center gap-2 md:gap-3">
        <button
          onClick={() => setSelectedChart('categories')}
          className={`px-3 py-3 md:px-4 md:py-2 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm md:text-base ${
            selectedChart === 'categories'
              ? 'bg-[#ffbd59] text-[#2c3539] shadow-lg shadow-[#ffbd59]/30'
              : 'bg-white/10 text-gray-300 hover:bg-white/20'
          }`}
        >
          <PieChart className="w-4 h-4" />
          <span className="hidden sm:inline">Kategorien</span>
          <span className="sm:hidden">Kat.</span>
        </button>
        <button
          onClick={() => setSelectedChart('timeline')}
          className={`px-3 py-3 md:px-4 md:py-2 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm md:text-base ${
            selectedChart === 'timeline'
              ? 'bg-[#ffbd59] text-[#2c3539] shadow-lg shadow-[#ffbd59]/30'
              : 'bg-white/10 text-gray-300 hover:bg-white/20'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span className="hidden sm:inline">Zeitverlauf</span>
          <span className="sm:hidden">Zeit</span>
        </button>
        <button
          onClick={() => setSelectedChart('breakdown')}
          className={`px-3 py-3 md:px-4 md:py-2 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm md:text-base ${
            selectedChart === 'breakdown'
              ? 'bg-[#ffbd59] text-[#2c3539] shadow-lg shadow-[#ffbd59]/30'
              : 'bg-white/10 text-gray-300 hover:bg-white/20'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span className="hidden sm:inline">Kostenaufschlüsselung</span>
          <span className="sm:hidden">Aufschl.</span>
        </button>
        <button
          onClick={() => setSelectedChart('analysis')}
          className={`px-3 py-3 md:px-4 md:py-2 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm md:text-base ${
            selectedChart === 'analysis'
              ? 'bg-[#ffbd59] text-[#2c3539] shadow-lg shadow-[#ffbd59]/30'
              : 'bg-white/10 text-gray-300 hover:bg-white/20'
          }`}
        >
          <TrendingDown className="w-4 h-4" />
          <span className="hidden sm:inline">Analyse</span>
          <span className="sm:hidden">Anal.</span>
        </button>
      </div>

      {/* Chart Container - Mobile Optimized */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-[#ffbd59]/10 via-[#ffa726]/10 to-[#ffbd59]/10 rounded-2xl md:rounded-3xl blur-2xl"></div>
        <div className="relative bg-gradient-to-br from-[#1a1a2e]/95 to-[#16213e]/95 backdrop-blur-xl rounded-2xl md:rounded-3xl border border-[#ffbd59]/20 p-4 md:p-8 shadow-2xl">
          {selectedChart === 'categories' && renderCategoryChart()}
          {selectedChart === 'timeline' && renderTimelineChart()}
          {selectedChart === 'breakdown' && renderCostBreakdown()}
          {selectedChart === 'analysis' && renderCostAnalysis()}
        </div>
      </div>
    </div>
  );
}




