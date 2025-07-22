import React, { useState, useEffect } from 'react';
import { financeAnalyticsService } from '../api/financeAnalyticsService';
import type {
  FinanceSummary,
  PhaseData,
  CategoryData,
  StatusData,
  CostsOverTime,
  MilestoneCosts,
  PaymentTimeline
} from '../api/financeAnalyticsService';
import { useProject } from '../context/ProjectContext';
import { useSwipeable } from 'react-swipeable';

// Chart.js Imports
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

// Registriere Chart.js Komponenten
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

interface FinanceAnalyticsProps {
  projectId: number;
}

const FinanceAnalytics: React.FC<FinanceAnalyticsProps> = ({ projectId }) => {
  const { getCurrentProject } = useProject();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentChartIndex, setCurrentChartIndex] = useState(0);
  const [timePeriod, setTimePeriod] = useState<'monthly' | 'weekly' | 'quarterly'>('monthly');
  const [months, setMonths] = useState(12);

  // State für verschiedene Daten
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [costsOverTime, setCostsOverTime] = useState<CostsOverTime | null>(null);
  const [milestoneCosts, setMilestoneCosts] = useState<MilestoneCosts | null>(null);
  const [paymentTimeline, setPaymentTimeline] = useState<PaymentTimeline | null>(null);

  // Moderne Chart-Konfigurationen mit CI-Farben
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        left: 40,
        right: 40,
        top: 20,
        bottom: 20
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 14
          },
          color: '#ffbd59'
        }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: '#51646f',
        titleColor: '#ffbd59',
        bodyColor: '#ffbd59',
        borderColor: '#ffbd59',
        borderWidth: 2,
        cornerRadius: 8,
        padding: 12,
        titleFont: {
          size: 14
        },
        bodyFont: {
          size: 12
        }
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
    elements: {
      point: {
        radius: 8,
        hoverRadius: 12,
        borderWidth: 3,
        borderColor: '#ffbd59'
      },
      line: {
        tension: 0.4,
        borderWidth: 4
      }
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: true,
          color: 'rgba(255, 189, 89, 0.3)',
          lineWidth: 1
        },
        ticks: {
          color: '#ffbd59',
          maxRotation: 45,
          minRotation: 45,
          font: {
            size: 12
          },
          maxTicksLimit: 3,
          autoSkip: true
        }
      },
      y: {
        display: true,
        grid: {
          color: 'rgba(255, 189, 89, 0.3)',
          lineWidth: 1
        },
        ticks: {
          color: '#ffbd59',
          font: {
            size: 12
          },
          callback: function(value: any) {
            return value.toLocaleString('de-DE') + '€';
          }
        }
      }
    }
  };

  // Spezielle Optionen für Timeline-Chart
  const timelineChartOptions = {
    ...chartOptions,
    scales: {
      ...chartOptions.scales,
      x: {
        ...chartOptions.scales.x,
        type: 'time' as const,
        time: {
          unit: (timePeriod === 'monthly' ? 'month' : timePeriod === 'weekly' ? 'week' : 'quarter') as any,
          displayFormats: {
            month: 'MMM yyyy',
            week: 'KW w yyyy',
            quarter: 'Qq yyyy'
          }
        }
      }
    }
  };

  // Swipe-Handler
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      setCurrentChartIndex((prev) => Math.min(prev + 1, 5));
    },
    onSwipedRight: () => {
      setCurrentChartIndex((prev) => Math.max(prev - 1, 0));
    },
    trackMouse: true
  });

  // Lade Daten beim Komponenten-Mount
  useEffect(() => {
    loadData();
  }, [projectId, timePeriod, months]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Lade alle Daten parallel
      const [summaryData, costsOverTimeData, milestoneCostsData, paymentTimelineData] = await Promise.all([
        financeAnalyticsService.getFinanceSummary(projectId),
        financeAnalyticsService.getCostsOverTime(projectId, timePeriod, months),
        financeAnalyticsService.getMilestoneCosts(projectId),
        financeAnalyticsService.getPaymentTimeline(projectId, months)
      ]);

      setSummary(summaryData);
      setCostsOverTime(costsOverTimeData);
      setMilestoneCosts(milestoneCostsData);
      setPaymentTimeline(paymentTimelineData);
    } catch (err) {
      console.error('Fehler beim Laden der Finance-Analytics:', err);
      setError('Fehler beim Laden der Finanzdaten');
    } finally {
      setLoading(false);
    }
  };

  // Kosten über Zeit Chart mit CI-Farben
  const getCostsOverTimeChartData = () => {
    if (!costsOverTime?.time_data || costsOverTime.time_data.length === 0) {
      // Fallback-Daten wenn keine Zeitdaten vorhanden
      return {
        labels: ['Keine Daten'],
        datasets: [
          {
            label: 'Gesamtkosten',
            data: [0],
            borderColor: '#ffbd59',
            backgroundColor: 'rgba(255, 189, 89, 0.3)',
            fill: true,
            tension: 0.4,
            borderWidth: 4,
          }
        ],
      };
    }

    // Begrenze die Anzahl der Datenpunkte für bessere Darstellung
    const maxDataPoints = 12;
    const timeData = costsOverTime.time_data.slice(-maxDataPoints);

    const labels = timeData.map(item => {
      if (timePeriod === 'monthly') {
        return `${item.year}-${item.period.toString().padStart(2, '0')}`;
      } else if (timePeriod === 'weekly') {
        return `KW ${item.period} ${item.year}`;
      } else {
        return `Q${item.period} ${item.year}`;
      }
    });

    return {
      labels,
      datasets: [
        {
          label: 'Gesamtkosten',
          data: timeData.map(item => item.total_amount),
          borderColor: '#ffbd59',
          backgroundColor: 'rgba(255, 189, 89, 0.3)',
          fill: true,
          tension: 0.4,
          borderWidth: 4,
        },
        {
          label: 'Bezahlte Kosten',
          data: timeData.map(item => item.total_paid),
          borderColor: '#51646f',
          backgroundColor: 'rgba(81, 100, 111, 0.3)',
          fill: true,
          tension: 0.4,
          borderWidth: 4,
        },
        {
          label: 'Verbleibende Kosten',
          data: timeData.map(item => item.remaining_amount),
          borderColor: '#ffbd59',
          backgroundColor: 'rgba(255, 189, 89, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 4,
        },
      ],
    };
  };

  // Bauphasen Chart mit CI-Farben
  const getPhasesChartData = () => {
    if (!summary?.phases?.phases || summary.phases.phases.length === 0) {
      // Fallback-Daten wenn keine Phasendaten vorhanden
      return {
        labels: ['Keine Daten'],
        datasets: [
          {
            label: 'Gesamtkosten',
            data: [0],
            backgroundColor: ['rgba(255, 189, 89, 0.9)'],
            borderWidth: 3,
            borderColor: ['rgba(255, 189, 89, 1)'],
            borderRadius: 8,
            borderSkipped: false,
          },
        ],
      };
    }

    const phases = summary.phases.phases.filter(phase => phase.total_amount > 0);
    
    if (phases.length === 0) {
      return {
        labels: ['Keine Daten'],
        datasets: [
          {
            label: 'Gesamtkosten',
            data: [0],
            backgroundColor: ['rgba(255, 189, 89, 0.9)'],
            borderWidth: 3,
            borderColor: ['rgba(255, 189, 89, 1)'],
            borderRadius: 8,
            borderSkipped: false,
          },
        ],
      };
    }
    
    // CI-Farbpalette für Bauphasen - stärkere Farben
    const phaseColors = {
      'Grundstück': 'rgba(255, 189, 89, 0.9)',      // CI-Akzent stark
      'Fundament': 'rgba(81, 100, 111, 0.9)',        // CI-Hintergrund stark
      'Rohbau': 'rgba(255, 189, 89, 0.8)',          // CI-Akzent
      'Dach': 'rgba(81, 100, 111, 0.8)',            // CI-Hintergrund
      'Fenster': 'rgba(255, 189, 89, 0.7)',         // CI-Akzent
      'Elektrik': 'rgba(81, 100, 111, 0.7)',        // CI-Hintergrund
      'Sanitär': 'rgba(255, 189, 89, 0.6)',         // CI-Akzent
      'Innenausbau': 'rgba(81, 100, 111, 0.6)',     // CI-Hintergrund
      'Außenanlagen': 'rgba(255, 189, 89, 0.5)',    // CI-Akzent
      'Fertigstellung': 'rgba(81, 100, 111, 0.5)'   // CI-Hintergrund
    };

    return {
      labels: phases.map(phase => phase.phase),
      datasets: [
        {
          label: 'Gesamtkosten',
          data: phases.map(phase => phase.total_amount),
          backgroundColor: phases.map(phase => phaseColors[phase.phase as keyof typeof phaseColors] || 'rgba(255, 189, 89, 0.9)'),
          borderWidth: 3,
          borderColor: phases.map(phase => phaseColors[phase.phase as keyof typeof phaseColors]?.replace('0.9', '1') || 'rgba(255, 189, 89, 1)'),
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    };
  };

  // Kategorien Chart mit CI-Farben
  const getCategoriesChartData = () => {
    if (!summary?.categories?.categories || summary.categories.categories.length === 0) {
      // Fallback-Daten wenn keine Kategoriendaten vorhanden
      return {
        labels: ['Keine Daten'],
        datasets: [
          {
            label: 'Kosten nach Kategorie',
            data: [0],
            backgroundColor: ['rgba(255, 189, 89, 0.9)'],
            borderWidth: 3,
            borderColor: ['rgba(255, 189, 89, 1)'],
          },
        ],
      };
    }

    const categories = summary.categories.categories.filter(cat => cat.total_amount > 0);
    
    if (categories.length === 0) {
      return {
        labels: ['Keine Daten'],
        datasets: [
          {
            label: 'Kosten nach Kategorie',
            data: [0],
            backgroundColor: ['rgba(255, 189, 89, 0.9)'],
            borderWidth: 3,
            borderColor: ['rgba(255, 189, 89, 1)'],
          },
        ],
      };
    }

    const colors = [
      'rgba(255, 189, 89, 0.9)',   // CI-Akzent stark
      'rgba(81, 100, 111, 0.9)',   // CI-Hintergrund stark
      'rgba(255, 189, 89, 0.8)',   // CI-Akzent
      'rgba(81, 100, 111, 0.8)',   // CI-Hintergrund
      'rgba(255, 189, 89, 0.7)',   // CI-Akzent
      'rgba(81, 100, 111, 0.7)',   // CI-Hintergrund
      'rgba(255, 189, 89, 0.6)',   // CI-Akzent
      'rgba(81, 100, 111, 0.6)',   // CI-Hintergrund
    ];

    return {
      labels: categories.map(cat => cat.category_name),
      datasets: [
        {
          label: 'Kosten nach Kategorie',
          data: categories.map(cat => cat.total_amount),
          backgroundColor: colors.slice(0, categories.length),
          borderWidth: 3,
          borderColor: colors.slice(0, categories.length).map(color => color.replace('0.9', '1').replace('0.8', '1').replace('0.7', '1').replace('0.6', '1')),
        },
      ],
    };
  };

  // Status Chart mit CI-Farben
  const getStatusChartData = () => {
    if (!summary?.statuses?.statuses || summary.statuses.statuses.length === 0) {
      // Fallback-Daten wenn keine Statusdaten vorhanden
      return {
        labels: ['Keine Daten'],
        datasets: [
          {
            label: 'Kosten nach Status',
            data: [0],
            backgroundColor: ['rgba(255, 189, 89, 0.9)'],
            borderWidth: 3,
            borderColor: ['rgba(255, 189, 89, 1)'],
          },
        ],
      };
    }

    const statuses = summary.statuses.statuses.filter((status: any) => status.total_amount > 0);
    
    if (statuses.length === 0) {
      return {
        labels: ['Keine Daten'],
        datasets: [
          {
            label: 'Kosten nach Status',
            data: [0],
            backgroundColor: ['rgba(255, 189, 89, 0.9)'],
            borderWidth: 3,
            borderColor: ['rgba(255, 189, 89, 1)'],
          },
        ],
      };
    }

    const colors = [
      'rgba(255, 189, 89, 0.9)',   // CI-Akzent stark
      'rgba(81, 100, 111, 0.9)',   // CI-Hintergrund stark
      'rgba(255, 189, 89, 0.8)',   // CI-Akzent
      'rgba(81, 100, 111, 0.8)',   // CI-Hintergrund
      'rgba(255, 189, 89, 0.7)',   // CI-Akzent
      'rgba(81, 100, 111, 0.7)',   // CI-Hintergrund
      'rgba(255, 189, 89, 0.6)',   // CI-Akzent
      'rgba(81, 100, 111, 0.6)',   // CI-Hintergrund
    ];

    return {
      labels: statuses.map((status: any) => status.status_name),
      datasets: [
        {
          label: 'Kosten nach Status',
          data: statuses.map((status: any) => status.total_amount),
          backgroundColor: colors.slice(0, statuses.length),
          borderWidth: 3,
          borderColor: colors.slice(0, statuses.length).map(color => color.replace('0.9', '1').replace('0.8', '1').replace('0.7', '1').replace('0.6', '1')),
        },
      ],
    };
  };

  // Milestones Chart mit CI-Farben
  const getMilestonesChartData = () => {
    if (!milestoneCosts?.milestones || milestoneCosts.milestones.length === 0) {
      // Fallback-Daten wenn keine Milestone-Daten vorhanden
      return {
        labels: ['Keine Daten'],
        datasets: [
          {
            label: 'Kosten nach Gewerken',
            data: [0],
            backgroundColor: ['rgba(255, 189, 89, 0.9)'],
            borderWidth: 3,
            borderColor: ['rgba(255, 189, 89, 1)'],
            borderRadius: 8,
            borderSkipped: false,
          },
        ],
      };
    }

    const milestones = milestoneCosts.milestones.filter(milestone => milestone.total_amount > 0);
    
    if (milestones.length === 0) {
      return {
        labels: ['Keine Daten'],
        datasets: [
          {
            label: 'Kosten nach Gewerken',
            data: [0],
            backgroundColor: ['rgba(255, 189, 89, 0.9)'],
            borderWidth: 3,
            borderColor: ['rgba(255, 189, 89, 1)'],
            borderRadius: 8,
            borderSkipped: false,
          },
        ],
      };
    }

    const colors = [
      'rgba(255, 189, 89, 0.9)',   // CI-Akzent stark
      'rgba(81, 100, 111, 0.9)',   // CI-Hintergrund stark
      'rgba(255, 189, 89, 0.8)',   // CI-Akzent
      'rgba(81, 100, 111, 0.8)',   // CI-Hintergrund
      'rgba(255, 189, 89, 0.7)',   // CI-Akzent
      'rgba(81, 100, 111, 0.7)',   // CI-Hintergrund
      'rgba(255, 189, 89, 0.6)',   // CI-Akzent
      'rgba(81, 100, 111, 0.6)',   // CI-Hintergrund
    ];

    return {
      labels: milestones.map(milestone => milestone.milestone_title),
      datasets: [
        {
          label: 'Kosten nach Gewerken',
          data: milestones.map(milestone => milestone.total_amount),
          backgroundColor: colors.slice(0, milestones.length),
          borderWidth: 3,
          borderColor: colors.slice(0, milestones.length).map(color => color.replace('0.9', '1').replace('0.8', '1').replace('0.7', '1').replace('0.6', '1')),
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    };
  };

  // Chart-Titel und Beschreibungen
  const chartConfigs = [
    {
      title: 'Finanzübersicht',
      description: 'KPI-Dashboard mit wichtigen Kennzahlen',
      icon: '📊',
      type: 'summary'
    },
    {
      title: 'Kostenentwicklung',
      description: 'Zeitverlauf der Projektkosten',
      icon: '📈',
      type: 'timeline'
    },
    {
      title: 'Bauphasen',
      description: 'Kostenverteilung nach Bauphasen',
      icon: '🏗️',
      type: 'phases'
    },
    {
      title: 'Kategorien',
      description: 'Kostenverteilung nach Kategorien',
      icon: '📋',
      type: 'categories'
    },
    {
      title: 'Gewerke',
      description: 'Kostenverteilung nach Gewerken',
      icon: '🔧',
      type: 'milestones'
    },
    {
      title: 'Status',
      description: 'Kostenverteilung nach Status',
      icon: '✅',
      type: 'status'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4" style={{ borderColor: '#51646f' }}></div>
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-transparent absolute top-0 left-0" style={{ borderColor: '#ffbd59' }}></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl p-6" style={{ backgroundColor: '#51646f' }}>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#ffbd59' }}>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#51646f' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold" style={{ color: '#ffbd59' }}>Fehler beim Laden der Finanzdaten</h3>
            <div className="mt-2 text-sm" style={{ color: '#ffbd59' }}>{error}</div>
          </div>
        </div>
      </div>
    );
  }

      return (
      <div className="rounded-2xl shadow-xl p-8 border" style={{ backgroundColor: '#51646f' }}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#ffbd59' }}>
            <span className="text-xl" style={{ color: '#51646f' }}>📊</span>
          </div>
          <div>
            <h2 className="text-3xl font-bold" style={{ color: '#ffbd59' }}>
              Finanz-Analytics
            </h2>
            <p className="mt-1" style={{ color: '#ffbd59' }}>
              Detaillierte Analyse der Projektkosten und -entwicklung
            </p>
          </div>
        </div>
      </div>

      {/* Chart Navigation */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => setCurrentChartIndex(Math.max(currentChartIndex - 1, 0))}
          disabled={currentChartIndex === 0}
          className="p-3 rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 border"
          style={{ backgroundColor: '#ffbd59', borderColor: '#ffbd59' }}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#51646f' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <span className="text-2xl">{chartConfigs[currentChartIndex].icon}</span>
            <h3 className="text-xl font-bold" style={{ color: '#ffbd59' }}>{chartConfigs[currentChartIndex].title}</h3>
          </div>
          <p className="text-sm" style={{ color: '#ffbd59' }}>{chartConfigs[currentChartIndex].description}</p>
        </div>

        <button
          onClick={() => setCurrentChartIndex(Math.min(currentChartIndex + 1, chartConfigs.length - 1))}
          disabled={currentChartIndex === chartConfigs.length - 1}
          className="p-3 rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 border"
          style={{ backgroundColor: '#ffbd59', borderColor: '#ffbd59' }}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#51646f' }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Progress Dots */}
      <div className="flex justify-center mb-8">
        <div className="flex space-x-3">
          {chartConfigs.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentChartIndex(index)}
              className={`w-4 h-4 rounded-full transition-all duration-200 ${
                index === currentChartIndex 
                  ? 'shadow-lg' 
                  : 'hover:opacity-80'
              }`}
              style={{ 
                backgroundColor: index === currentChartIndex ? '#ffbd59' : 'rgba(255, 189, 89, 0.3)' 
              }}
            />
          ))}
        </div>
      </div>

      {/* Swipeable Chart Container */}
      <div {...swipeHandlers} className="relative overflow-hidden rounded-xl" style={{ maxWidth: '100%' }}>
        <div className="flex transition-transform duration-500 ease-out" style={{
          transform: `translateX(-${currentChartIndex * 100}%)`,
          width: `${chartConfigs.length * 100}%`,
          maxWidth: '100%'
        }}>
          
          {/* Summary Chart */}
          <div className="w-full flex-shrink-0 px-2">
            {summary && (
              <div className="space-y-6">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="rounded-2xl p-6 text-white shadow-lg" style={{ backgroundColor: '#51646f' }}>
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#ffbd59' }}>
                          <span className="text-2xl" style={{ color: '#51646f' }}>💰</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium" style={{ color: '#ffbd59' }}>Gesamtkosten</p>
                        <p className="text-3xl font-bold" style={{ color: '#ffbd59' }}>
                          {summary.summary.total_amount.toLocaleString('de-DE')} €
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl p-6 text-white shadow-lg" style={{ backgroundColor: '#51646f' }}>
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#ffbd59' }}>
                          <span className="text-2xl" style={{ color: '#51646f' }}>💳</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium" style={{ color: '#ffbd59' }}>Bezahlt</p>
                        <p className="text-3xl font-bold" style={{ color: '#ffbd59' }}>
                          {summary.summary.total_paid.toLocaleString('de-DE')} €
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl p-6 text-white shadow-lg" style={{ backgroundColor: '#51646f' }}>
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#ffbd59' }}>
                          <span className="text-2xl" style={{ color: '#51646f' }}>⏳</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium" style={{ color: '#ffbd59' }}>Verbleibend</p>
                        <p className="text-3xl font-bold" style={{ color: '#ffbd59' }}>
                          {summary.summary.total_remaining.toLocaleString('de-DE')} €
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl p-6 text-white shadow-lg" style={{ backgroundColor: '#51646f' }}>
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#ffbd59' }}>
                          <span className="text-2xl" style={{ color: '#51646f' }}>📊</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium" style={{ color: '#ffbd59' }}>Fortschritt</p>
                        <p className="text-3xl font-bold" style={{ color: '#ffbd59' }}>
                          {summary.summary.completion_percentage}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Summary Chart */}
                {summary.phases?.phases && (
                  <div className="rounded-2xl border p-6 shadow-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', borderColor: '#ffbd59' }}>
                    <h3 className="text-xl font-bold mb-6" style={{ color: '#ffbd59' }}>Kosten nach Bauphasen</h3>
                    <div className="h-80 w-full overflow-hidden" style={{ maxWidth: '100%', position: 'relative' }}>
                      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                        <Doughnut data={getPhasesChartData()} options={chartOptions} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Timeline Chart */}
          <div className="w-full flex-shrink-0 px-2">
            <div className="space-y-6">
              {/* Time Period Controls */}
              <div className="rounded-2xl border p-6 shadow-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', borderColor: '#ffbd59' }}>
                <div className="flex flex-wrap gap-4 items-center">
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: '#ffbd59' }}>Zeitraum</label>
                    <select
                      value={timePeriod}
                      onChange={(e) => setTimePeriod(e.target.value as 'monthly' | 'weekly' | 'quarterly')}
                      className="rounded-xl px-4 py-2 text-sm focus:ring-2 focus:border-transparent"
                      style={{ backgroundColor: '#ffbd59', color: '#51646f', borderColor: '#ffbd59' }}
                    >
                      <option value="monthly">Monatlich</option>
                      <option value="weekly">Wöchentlich</option>
                      <option value="quarterly">Vierteljährlich</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2" style={{ color: '#ffbd59' }}>Monate</label>
                    <select
                      value={months}
                      onChange={(e) => setMonths(Number(e.target.value))}
                      className="rounded-xl px-4 py-2 text-sm focus:ring-2 focus:border-transparent"
                      style={{ backgroundColor: '#ffbd59', color: '#51646f', borderColor: '#ffbd59' }}
                    >
                      <option value={6}>6 Monate</option>
                      <option value={12}>12 Monate</option>
                      <option value={24}>24 Monate</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Timeline Chart */}
              <div className="rounded-2xl border p-6 shadow-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', borderColor: '#ffbd59' }}>
                <h3 className="text-xl font-bold mb-6" style={{ color: '#ffbd59' }}>Kostenentwicklung über Zeit</h3>
                <div className="h-80 w-full overflow-hidden" style={{ maxWidth: '100%', position: 'relative' }}>
                  <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                    <Line data={getCostsOverTimeChartData()} options={chartOptions} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Phases Chart */}
          <div className="w-full flex-shrink-0 px-2">
            <div className="rounded-2xl border p-6 shadow-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', borderColor: '#ffbd59' }}>
              <h3 className="text-xl font-bold mb-6" style={{ color: '#ffbd59' }}>Kostenverteilung nach Bauphasen</h3>
              <div className="h-80 w-full overflow-hidden" style={{ maxWidth: '100%', position: 'relative' }}>
                <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                  <Bar data={getPhasesChartData()} options={chartOptions} />
                </div>
              </div>
            </div>
          </div>

          {/* Categories Chart */}
          <div className="w-full flex-shrink-0 px-2">
            <div className="rounded-2xl border p-6 shadow-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', borderColor: '#ffbd59' }}>
              <h3 className="text-xl font-bold mb-6" style={{ color: '#ffbd59' }}>Kostenverteilung nach Kategorien</h3>
              <div className="h-80 w-full overflow-hidden" style={{ maxWidth: '100%', position: 'relative' }}>
                <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                  <Pie data={getCategoriesChartData()} options={chartOptions} />
                </div>
              </div>
            </div>
          </div>

          {/* Milestones Chart */}
          <div className="w-full flex-shrink-0 px-2">
            <div className="rounded-2xl border p-6 shadow-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', borderColor: '#ffbd59' }}>
              <h3 className="text-xl font-bold mb-6" style={{ color: '#ffbd59' }}>Kostenverteilung nach Gewerken</h3>
              <div className="h-80 w-full overflow-hidden" style={{ maxWidth: '100%', position: 'relative' }}>
                <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                  <Bar data={getMilestonesChartData()} options={chartOptions} />
                </div>
              </div>
            </div>
          </div>

          {/* Status Chart */}
          <div className="w-full flex-shrink-0 px-2">
            <div className="rounded-2xl border p-6 shadow-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', borderColor: '#ffbd59' }}>
              <h3 className="text-xl font-bold mb-6" style={{ color: '#ffbd59' }}>Kostenverteilung nach Status</h3>
              <div className="h-80 w-full overflow-hidden" style={{ maxWidth: '100%', position: 'relative' }}>
                <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                  <Doughnut data={getStatusChartData()} options={chartOptions} />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Swipe Instructions */}
      <div className="mt-8 text-center">
        <div className="inline-flex items-center space-x-2 rounded-full px-6 py-3" style={{ backgroundColor: '#ffbd59' }}>
          <span style={{ color: '#51646f' }}>💡</span>
          <p className="text-sm font-medium" style={{ color: '#51646f' }}>
            Swipe nach links/rechts oder nutzen Sie die Pfeiltasten zum Navigieren
          </p>
        </div>
      </div>
    </div>
  );
};

export default FinanceAnalytics; 