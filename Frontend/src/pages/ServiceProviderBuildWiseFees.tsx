import React, { useState, useEffect } from 'react';
import { 
  Download, 
  FileText, 
  DollarSign, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Filter,
  RefreshCw,
  Plus,
  Trash2,
  Edit,
  Eye,
  Receipt,
  TrendingUp,
  ArrowLeft,
  Sparkles,
  Zap,
  Target,
  BarChart3,
  PieChart,
  Activity,
  Award,
  Star,
  TrendingDown,
  CreditCard,
  Wallet,
  Coins,
  Banknote,
  Building,
  Shield
} from 'lucide-react';
import { 
  getBuildWiseFees, 
  getBuildWiseFeeStatistics, 
  markFeeAsPaid, 
  generateInvoice, 
  generateGewerkInvoice,
  downloadInvoice,
  formatCurrency as formatCurrencyUtil,
  getStatusLabel as getStatusLabelUtil,
  getStatusColor as getStatusColorUtil
} from '../api/buildwiseFeeService';
import type { BuildWiseFee, BuildWiseFeeStatistics } from '../api/buildwiseFeeService';
import { getApiBaseUrl } from '../api/api';
import { useNavigate } from 'react-router-dom';

export default function ServiceProviderBuildWiseFees() {
  const navigate = useNavigate();
  const [fees, setFees] = useState<BuildWiseFee[]>([]);
  const [statistics, setStatistics] = useState<BuildWiseFeeStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, [selectedMonth, selectedYear]);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('🔍 Lade BuildWise-Gebühren (Dienstleister)...');
      const [feesData, statsData] = await Promise.all([
        getBuildWiseFees(selectedMonth, selectedYear),
        getBuildWiseFeeStatistics()
      ]);
      
      setFees(feesData);
      setStatistics(statsData);
      
      } catch (error) {
      console.error('❌ Fehler beim Laden der BuildWise-Gebühren:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (feeId: number) => {
    try {
      await markFeeAsPaid(feeId);
      await loadData(); // Daten neu laden
    } catch (error) {
      console.error('Fehler beim Markieren als bezahlt:', error);
    }
  };

  const handleGenerateInvoice = async (feeId: number) => {
    try {
      // Generiere PDF
      await generateInvoice(feeId);
      
      // Warte kurz und lade dann Daten neu
      setTimeout(async () => {
        await loadData();
        
        // Versuche automatisch den Download zu starten
        try {
          await handleDownloadInvoice(feeId);
        } catch (downloadError) {
          setSuccess('PDF-Rechnung wurde generiert. Sie können sie jetzt herunterladen.');
          setTimeout(() => setSuccess(''), 5000);
        }
      }, 2000); // Erhöhe Wartezeit auf 2 Sekunden
      
    } catch (error) {
      console.error('Fehler beim Generieren der Rechnung:', error);
      setError('Fehler beim Generieren der Rechnung');
    }
  };

  const handleGenerateGewerkInvoice = async (feeId: number) => {
    try {
      // Generiere PDF mit Gewerk-Daten und speichere als Dokument
      const result = await generateGewerkInvoice(feeId);
      
      if (result.success) {
        setSuccess(`✅ ${result.message}`);
        // Lade Daten neu
        await loadData();
      } else {
        setError('Fehler beim Generieren der Gewerk-Rechnung');
      }
    } catch (error) {
      console.error('Fehler beim Generieren der Gewerk-PDF-Rechnung:', error);
      setError('Fehler beim Generieren der Gewerk-PDF-Rechnung');
    }
  };

  const handleDownloadInvoice = async (feeId: number) => {
    try {
      // Hole Token für Authorization
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Kein Token verfügbar');
        setError('Kein Token verfügbar');
        return;
      }
      
      // Direkter PDF-Download ohne separate Metadaten-Abfrage
      const pdfResponse = await fetch(`${getApiBaseUrl()}/buildwise-fees/${feeId}/invoice.pdf`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('📄 PDF-Response Headers:', Object.fromEntries(pdfResponse.headers.entries()));
      
      if (pdfResponse.ok) {
        const blob = await pdfResponse.blob();
        if (blob.size > 0) {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `buildwise_invoice_${feeId}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          
          setSuccess('PDF-Rechnung erfolgreich heruntergeladen!');
          setTimeout(() => setSuccess(''), 5000);
        } else {
          throw new Error('PDF-Datei ist leer');
        }
      } else {
        const errorText = await pdfResponse.text();
        console.error('PDF-Download Fehler:', errorText);
        
        if (pdfResponse.status === 404) {
          setError('PDF-Rechnung wurde noch nicht generiert. Bitte generieren Sie zuerst die Rechnung.');
        } else if (pdfResponse.status === 401) {
          setError('Nicht autorisiert. Bitte melden Sie sich erneut an.');
        } else if (pdfResponse.status === 500) {
          setError('Server-Fehler beim PDF-Download. Bitte versuchen Sie es später erneut.');
        } else {
          throw new Error(`PDF-Download fehlgeschlagen: ${pdfResponse.status} - ${errorText}`);
        }
      }
    } catch (error: any) {
      console.error('❌ PDF-Download fehlgeschlagen:', error);
      setError(`PDF-Download fehlgeschlagen: ${error.message}`);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'overdue':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Bezahlt';
      case 'overdue':
        return 'Überfällig';
      case 'pending':
        return 'Ausstehend';
      case 'open':
        return 'Offen';
      default:
        return 'Unbekannt';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-600 bg-green-100';
      case 'overdue':
        return 'text-red-600 bg-red-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'open':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const getMonthName = (month: number) => {
    const months = [
      'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
      'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
    ];
    return months[month - 1];
  };

  const getFilteredFees = () => {
    let filtered = fees;

    if (filterStatus !== 'all') {
      filtered = filtered.filter(fee => fee.status === filterStatus);
    }

    if (selectedStatus) {
      filtered = filtered.filter(fee => fee.status === selectedStatus);
    }

    return filtered;
  };

  const filteredFees = getFilteredFees();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#51646f] via-[#3d4952] to-[#2c3539] flex items-center justify-center">
        <div className="text-center text-white">
          <div className="relative mb-8">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#ffbd59]/30 border-t-[#ffbd59] mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Coins className="w-8 h-8 text-[#ffbd59] animate-pulse" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white">Lade BuildWise-Gebühren</h3>
            <p className="text-gray-300 flex items-center justify-center space-x-2">
              <Activity className="w-4 h-4 animate-pulse" />
              <span>Daten werden abgerufen...</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#51646f] via-[#3d4952] to-[#2c3539]">
      {/* Enhanced Header */}
      <div className="relative bg-gradient-to-r from-[#1a1a2e]/90 via-[#2c3539]/90 to-[#1a1a2e]/90 backdrop-blur-xl border-b border-white/20 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-[#ffbd59]/5 via-transparent to-[#ffbd59]/5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-6">
              <button
                onClick={() => navigate('/service-provider-dashboard')}
                className="group flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-300 border border-white/20 hover:border-[#ffbd59]/50"
              >
                <ArrowLeft className="w-5 h-5 text-white group-hover:text-[#ffbd59] transition-colors" />
                <span className="text-white group-hover:text-[#ffbd59] transition-colors font-medium">Zurück</span>
              </button>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-xl shadow-lg">
                    <Coins className="w-8 h-8 text-[#2c3539]" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white flex items-center space-x-2">
                      <span>BuildWise-Gebühren</span>
                      <Sparkles className="w-6 h-6 text-[#ffbd59] animate-pulse" />
                    </h1>
                    <p className="text-sm text-gray-300 flex items-center space-x-1">
                      <Target className="w-4 h-4" />
                      <span>Vermittlungskosten & Rechnungsmanagement</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 px-4 py-2 bg-white/10 rounded-xl border border-white/20">
                <Activity className="w-5 h-5 text-[#ffbd59]" />
                <span className="text-white font-medium">Live Dashboard</span>
              </div>
              <button
                onClick={loadData}
                className="group flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-[#2c3539] rounded-xl hover:from-[#ffa726] hover:to-[#ff9800] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                <span className="font-semibold">Aktualisieren</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Error/Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-gradient-to-r from-red-500/20 to-red-600/20 border border-red-500/30 rounded-xl backdrop-blur-sm shadow-lg">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0" />
              <p className="text-red-200 font-medium">{error}</p>
            </div>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-gradient-to-r from-green-500/20 to-green-600/20 border border-green-500/30 rounded-xl backdrop-blur-sm shadow-lg">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
              <p className="text-green-200 font-medium">{success}</p>
            </div>
          </div>
        )}

        {/* Enhanced Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="group bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/20 hover:border-[#ffbd59]/50 transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-xl shadow-lg">
                  <DollarSign className="w-8 h-8 text-[#2c3539]" />
                </div>
                <TrendingUp className="w-6 h-6 text-[#ffbd59] opacity-60" />
              </div>
              <div>
                <p className="text-sm text-gray-300 mb-1">Gesamtgebühren</p>
                <p className="text-3xl font-bold text-white mb-2">{formatCurrency(statistics.total_fees)}</p>
                <div className="flex items-center space-x-1 text-xs text-gray-400">
                  <BarChart3 className="w-4 h-4" />
                  <span>Alle Zeiträume</span>
                </div>
              </div>
            </div>
            
            <div className="group bg-gradient-to-br from-green-500/20 to-green-600/20 backdrop-blur-xl rounded-2xl p-6 border border-green-500/30 hover:border-green-400/50 transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <Award className="w-6 h-6 text-green-400 opacity-60" />
              </div>
              <div>
                <p className="text-sm text-green-200 mb-1">Bezahlt</p>
                <p className="text-3xl font-bold text-green-100 mb-2">{formatCurrency(statistics.total_paid)}</p>
                <div className="flex items-center space-x-1 text-xs text-green-300">
                  <Star className="w-4 h-4" />
                  <span>Erfolgreich abgerechnet</span>
                </div>
              </div>
            </div>
            
            <div className="group bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 backdrop-blur-xl rounded-2xl p-6 border border-yellow-500/30 hover:border-yellow-400/50 transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg">
                  <Clock className="w-8 h-8 text-white" />
                </div>
                <Activity className="w-6 h-6 text-yellow-400 opacity-60" />
              </div>
              <div>
                <p className="text-sm text-yellow-200 mb-1">Offen</p>
                <p className="text-3xl font-bold text-yellow-100 mb-2">{formatCurrency(statistics.total_open)}</p>
                <div className="flex items-center space-x-1 text-xs text-yellow-300">
                  <Clock className="w-4 h-4" />
                  <span>Ausstehende Zahlungen</span>
                </div>
              </div>
            </div>
            
            <div className="group bg-gradient-to-br from-red-500/20 to-red-600/20 backdrop-blur-xl rounded-2xl p-6 border border-red-500/30 hover:border-red-400/50 transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg">
                  <AlertTriangle className="w-8 h-8 text-white" />
                </div>
                <TrendingDown className="w-6 h-6 text-red-400 opacity-60" />
              </div>
              <div>
                <p className="text-sm text-red-200 mb-1">Überfällig</p>
                <p className="text-3xl font-bold text-red-100 mb-2">{formatCurrency(statistics.total_overdue)}</p>
                <div className="flex items-center space-x-1 text-xs text-red-300">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Sofortige Aufmerksamkeit</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Filters */}
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-lg mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-lg">
              <Filter className="w-6 h-6 text-[#2c3539]" />
            </div>
            <h3 className="text-xl font-bold text-white">Filter & Suche</h3>
            <div className="flex-1 h-px bg-gradient-to-r from-white/20 to-transparent"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-300 flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Monat</span>
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent transition-all duration-300 hover:bg-white/15"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                  <option key={month} value={month} className="bg-[#2c3539]">{getMonthName(month)}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-300 flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Jahr</span>
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent transition-all duration-300 hover:bg-white/15"
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                  <option key={year} value={year} className="bg-[#2c3539]">{year}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-300 flex items-center space-x-2">
                <Target className="w-4 h-4" />
                <span>Status</span>
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent transition-all duration-300 hover:bg-white/15"
              >
                <option value="all" className="bg-[#2c3539]">Alle Status</option>
                <option value="open" className="bg-[#2c3539]">Offen</option>
                <option value="pending" className="bg-[#2c3539]">Ausstehend</option>
                <option value="paid" className="bg-[#2c3539]">Bezahlt</option>
                <option value="overdue" className="bg-[#2c3539]">Überfällig</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={loadData}
                className="w-full px-6 py-3 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-[#2c3539] rounded-xl hover:from-[#ffa726] hover:to-[#ff9800] transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
              >
                <Filter className="w-5 h-5" />
                <span>Filtern</span>
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Fees Table */}
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 shadow-lg overflow-hidden">
          <div className="px-8 py-6 border-b border-white/20 bg-gradient-to-r from-white/5 to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-lg">
                  <Receipt className="w-6 h-6 text-[#2c3539]" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Gebühren-Übersicht</h3>
                  <p className="text-sm text-gray-300 flex items-center space-x-1">
                    <PieChart className="w-4 h-4" />
                    <span>Ihre BuildWise-Vermittlungskosten im Detail</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 px-4 py-2 bg-white/10 rounded-xl border border-white/20">
                <BarChart3 className="w-5 h-5 text-[#ffbd59]" />
                <span className="text-white font-medium">{filteredFees.length} Einträge</span>
              </div>
            </div>
          </div>
          
          {filteredFees.length === 0 ? (
            <div className="p-12 text-center">
              <div className="flex flex-col items-center space-y-6">
                <div className="p-6 bg-gradient-to-br from-gray-500/20 to-gray-600/20 rounded-2xl border border-gray-500/30">
                  <Receipt className="w-16 h-16 text-gray-400" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-xl font-semibold text-gray-300">Keine Gebühren gefunden</h4>
                  <p className="text-gray-400 max-w-md">
                    Für den ausgewählten Zeitraum wurden keine BuildWise-Gebühren gefunden. 
                    Versuchen Sie einen anderen Monat oder Jahr.
                  </p>
                </div>
                <button
                  onClick={loadData}
                  className="px-6 py-3 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-[#2c3539] rounded-xl hover:from-[#ffa726] hover:to-[#ff9800] transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <RefreshCw className="w-5 h-5 inline mr-2" />
                  Erneut laden
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/10">
                <thead className="bg-gradient-to-r from-white/10 to-white/5">
                  <tr>
                    <th className="px-8 py-4 text-left text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center space-x-2">
                      <Receipt className="w-4 h-4" />
                      <span>Gebühr</span>
                    </th>
                    <th className="px-8 py-4 text-left text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center space-x-2">
                      <Building className="w-4 h-4" />
                      <span>Projekt</span>
                    </th>
                    <th className="px-8 py-4 text-left text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center space-x-2">
                      <DollarSign className="w-4 h-4" />
                      <span>Betrag</span>
                    </th>
                    <th className="px-8 py-4 text-left text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center space-x-2">
                      <Target className="w-4 h-4" />
                      <span>Status</span>
                    </th>
                    <th className="px-8 py-4 text-left text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>Datum</span>
                    </th>
                    <th className="px-8 py-4 text-left text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center space-x-2">
                      <Zap className="w-4 h-4" />
                      <span>Aktionen</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white/5 divide-y divide-white/10">
                  {filteredFees.map((fee) => (
                    <tr key={fee.id} className="group hover:bg-white/10 transition-all duration-300 border-b border-white/5">
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div className="p-3 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                              <Receipt className="w-6 h-6 text-[#2c3539]" />
                            </div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-white group-hover:text-[#ffbd59] transition-colors">
                              BW-{fee.id.toString().padStart(6, '0')}
                            </div>
                            <div className="text-sm text-gray-300 flex items-center space-x-1">
                              <Coins className="w-4 h-4" />
                              <span>Vermittlungskosten</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <Building className="w-5 h-5 text-[#ffbd59]" />
                          <span className="text-sm font-medium text-gray-300">Projekt {fee.project_id}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="text-xl font-bold text-white group-hover:text-[#ffbd59] transition-colors">
                            {formatCurrency(fee.fee_amount)}
                          </div>
                          <div className="text-xs text-gray-400 flex items-center space-x-1">
                            <PieChart className="w-3 h-3" />
                            <span>{fee.fee_percentage}% vom Angebot</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-2 rounded-xl text-sm font-semibold ${getStatusColor(fee.status)} shadow-lg`}>
                          {getStatusIcon(fee.status)}
                          <span className="ml-2">{getStatusLabel(fee.status)}</span>
                        </span>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap text-sm text-gray-300">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>{fee.created_at ? formatDate(fee.created_at) : 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-3">
                          {fee.status === 'open' && (
                            <button 
                              onClick={() => handleMarkAsPaid(fee.id)} 
                              className="group/btn p-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 hover:text-green-300 rounded-xl transition-all duration-300 border border-green-500/30 hover:border-green-400/50 hover:scale-110" 
                              title="Als bezahlt markieren"
                            >
                              <CheckCircle className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                            </button>
                          )}
                          <button 
                            onClick={() => handleGenerateGewerkInvoice(fee.id)} 
                            className="group/btn p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 hover:text-blue-300 rounded-xl transition-all duration-300 border border-blue-500/30 hover:border-blue-400/50 hover:scale-110" 
                            title="Gewerk-Rechnung erstellen und als Dokument speichern"
                          >
                            <Receipt className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                          </button>
                          <button 
                            onClick={() => fee.invoice_pdf_generated ? handleDownloadInvoice(fee.id) : handleGenerateInvoice(fee.id)} 
                            className="group/btn p-2 bg-gradient-to-r from-[#ffbd59]/20 to-[#ffa726]/20 hover:from-[#ffbd59]/30 hover:to-[#ffa726]/30 text-[#ffbd59] hover:text-[#ffa726] rounded-xl transition-all duration-300 border border-[#ffbd59]/30 hover:border-[#ffbd59]/50 hover:scale-110" 
                            title={fee.invoice_pdf_generated ? "PDF-Rechnung herunterladen" : "PDF-Rechnung generieren"}
                          >
                            {fee.invoice_pdf_generated ? <Download className="w-5 h-5 group-hover/btn:scale-110 transition-transform" /> : <FileText className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Footer */}
      <div className="mt-12 bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-xl border-t border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-lg">
                <Coins className="w-6 h-6 text-[#2c3539]" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white">BuildWise-Gebühren</h4>
                <p className="text-sm text-gray-300">Transparente Vermittlungskosten</p>
              </div>
            </div>
            <div className="flex items-center space-x-6 text-sm text-gray-300">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Sichere Abrechnung</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-blue-400" />
                <span>DSGVO-konform</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-[#ffbd59]" />
                <span>Echtzeit-Updates</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
