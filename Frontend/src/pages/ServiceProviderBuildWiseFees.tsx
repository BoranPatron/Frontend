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
  Info,
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
  Shield,
  X,
  ExternalLink
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
import { 
  startPaymentProcess, 
  checkPaymentSuccess, 
  clearPaymentParams 
} from '../services/stripePaymentService';

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
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedFeeDetails, setSelectedFeeDetails] = useState<BuildWiseFee | null>(null);
  const [processingPayment, setProcessingPayment] = useState<number | null>(null);

  // Prüfe URL-Parameter beim ersten Laden
  useEffect(() => {
    // Prüfe URL direkt (nicht über Service-Funktion)
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const feeIdParam = urlParams.get('fee_id');
    
    console.log('🔍 URL Parameter:', { paymentStatus, feeIdParam });
    
    if (paymentStatus === 'success' && feeIdParam) {
      console.log('✅ Zahlung erfolgreich erkannt!');
      setSuccess(`🎉 Zahlung erfolgreich! Gebühr #${feeIdParam} wurde bezahlt.`);
      
      // Entferne Parameter aus URL
      const url = new URL(window.location.href);
      url.searchParams.delete('payment');
      url.searchParams.delete('fee_id');
      window.history.replaceState({}, '', url.toString());
      
      // Auto-dismiss nach 8 Sekunden
      setTimeout(() => {
        setSuccess('');
      }, 8000);
    } else if (paymentStatus === 'cancelled' && feeIdParam) {
      console.log('❌ Zahlung abgebrochen erkannt!');
      setError('❌ Zahlung wurde abgebrochen.');
      
      // Entferne Parameter aus URL
      const url = new URL(window.location.href);
      url.searchParams.delete('payment');
      url.searchParams.delete('fee_id');
      window.history.replaceState({}, '', url.toString());
      
      // Auto-dismiss nach 5 Sekunden
      setTimeout(() => {
        setError('');
      }, 5000);
    }
    
    // Lade Daten
    loadData();
  }, []);

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
      setSuccess('Gebühr wurde als bezahlt markiert.');
      await loadData(); // Daten neu laden
    } catch (error) {
      console.error('Fehler beim Markieren als bezahlt:', error);
      setError('Fehler beim Markieren als bezahlt.');
    }
  };

  const handlePayWithStripe = async (fee: BuildWiseFee) => {
    try {
      setProcessingPayment(fee.id);
      setError('');
      
      console.log('🔷 Starte Stripe-Zahlung für Gebühr:', fee.id);
      
      // Starte Zahlungsprozess - leitet automatisch zu Stripe weiter
      await startPaymentProcess(fee.id);
      
      // Falls die Weiterleitung nicht automatisch erfolgt
      // (wird normalerweise nicht erreicht, da startPaymentProcess zu Stripe weiterleitet)
      setProcessingPayment(null);
      
    } catch (error: any) {
      console.error('❌ Fehler beim Starten der Zahlung:', error);
      setError(error.message || 'Fehler beim Starten der Zahlung. Bitte versuchen Sie es erneut.');
      setProcessingPayment(null);
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleGenerateInvoice = async (feeId: number) => {
    try {
      // Generiere PDF mit nur Gewerk-Daten (ohne Projekt-Informationen)
      const result = await generateGewerkInvoice(feeId);
      
      if (result.success) {
        console.log('✅ PDF-Rechnung erfolgreich generiert:', result.message);
        
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
        }, 1000);
      } else {
        throw new Error(result.message || 'PDF-Generierung fehlgeschlagen');
      }
      
    } catch (error: any) {
      console.error('Fehler beim Generieren der Rechnung:', error);
      setError(`Fehler beim Generieren der Rechnung: ${error.message || 'Unbekannter Fehler'}`);
      setTimeout(() => setError(''), 5000);
    }
  };


  const handleShowDetails = (fee: BuildWiseFee) => {
    setSelectedFeeDetails(fee);
    setShowDetailsModal(true);
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
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const getDueDateStyle = (dueDateString: string | null, status: string) => {
    if (!dueDateString || status === 'paid') {
      return 'text-gray-300';
    }
    
    const dueDate = new Date(dueDateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    
    if (dueDate < today) {
      return 'text-red-400 font-semibold'; // Überfällig
    } else if (dueDate <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)) {
      return 'text-yellow-400 font-medium'; // Fällig in den nächsten 7 Tagen
    }
    
    return 'text-gray-300';
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
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#ffbd59]/30 border-t-[#ffbd59] mx-auto mb-4"></div>
          <p className="text-gray-300">Lade Gebühren...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#51646f] via-[#3d4952] to-[#2c3539]">
      {/* Simplified Header */}
      <div className="bg-white/10 backdrop-blur border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/service-provider-dashboard')}
                className="flex items-center space-x-2 px-3 py-2 text-white hover:text-[#ffbd59] transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Zurück</span>
              </button>
              <h1 className="text-2xl font-bold text-white">Gebühren-Übersicht</h1>
            </div>
            <button
              onClick={loadData}
              className="flex items-center space-x-2 px-4 py-2 bg-[#ffbd59] text-[#2c3539] rounded-lg hover:bg-[#ffa726] transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Aktualisieren</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-white/95 backdrop-blur-sm border border-red-200 rounded-lg shadow-lg">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mt-0.5">
                <XCircle className="w-4 h-4 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{error}</p>
                <p className="text-xs text-gray-500 mt-1">Bitte versuchen Sie es erneut oder kontaktieren Sie den Support.</p>
              </div>
              <button
                onClick={() => setError('')}
                className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Schließen"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-white/95 backdrop-blur-sm border border-green-200 rounded-lg shadow-lg">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{success}</p>
                <p className="text-xs text-gray-500 mt-1">Die Gebührenübersicht wird automatisch aktualisiert.</p>
              </div>
              <button
                onClick={() => setSuccess('')}
                className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Schließen"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Simplified Statistics */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white/10 rounded-lg p-4 border border-white/20">
              <p className="text-sm text-gray-300 mb-1">Gesamt</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(statistics.total_amount)}</p>
            </div>
            <div className="bg-green-500/20 rounded-lg p-4 border border-green-500/30">
              <p className="text-sm text-green-200 mb-1">Bezahlt</p>
              <p className="text-2xl font-bold text-green-100">{formatCurrency(statistics.total_paid)}</p>
            </div>
            <div className="bg-yellow-500/20 rounded-lg p-4 border border-yellow-500/30">
              <p className="text-sm text-yellow-200 mb-1">Offen</p>
              <p className="text-2xl font-bold text-yellow-100">{formatCurrency(statistics.total_open)}</p>
            </div>
            <div className="bg-red-500/20 rounded-lg p-4 border border-red-500/30">
              <p className="text-sm text-red-200 mb-1">Überfällig</p>
              <p className="text-2xl font-bold text-red-100">{formatCurrency(statistics.total_overdue)}</p>
            </div>
          </div>
        )}

        {/* Simplified Filters */}
        <div className="bg-white/10 rounded-lg p-4 border border-white/20 mb-6">
          <div className="flex items-center space-x-4">
            <div className="space-y-1">
              <label className="block text-sm text-gray-300">Monat</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59]"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                  <option key={month} value={month} className="bg-[#2c3539]">{getMonthName(month)}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-1">
              <label className="block text-sm text-gray-300">Jahr</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59]"
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                  <option key={year} value={year} className="bg-[#2c3539]">{year}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-1">
              <label className="block text-sm text-gray-300">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59]"
              >
                <option value="all" className="bg-[#2c3539]">Alle</option>
                <option value="open" className="bg-[#2c3539]">Offen</option>
                <option value="pending" className="bg-[#2c3539]">Ausstehend</option>
                <option value="paid" className="bg-[#2c3539]">Bezahlt</option>
                <option value="overdue" className="bg-[#2c3539]">Überfällig</option>
              </select>
            </div>
          </div>
        </div>

        {/* Simplified Table */}
        <div className="bg-white/10 rounded-lg border border-white/20 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/20">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Gebühren ({filteredFees.length})</h3>
            </div>
          </div>
          
          {filteredFees.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-300 mb-4">Keine Gebühren für den ausgewählten Zeitraum gefunden.</p>
              <button
                onClick={loadData}
                className="px-4 py-2 bg-[#ffbd59] text-[#2c3539] rounded-lg hover:bg-[#ffa726] transition-colors"
              >
                Erneut laden
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-white/10">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Gebühr
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Projekt
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Betrag
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Erstellt
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Fälligkeitsdatum
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Aktionen
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white/5 divide-y divide-white/10">
                  {filteredFees.map((fee) => (
                    <tr key={fee.id} className="hover:bg-white/10 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">
                          BW-{fee.id.toString().padStart(6, '0')}
                        </div>
                        <div className="text-xs text-gray-400">
                          Vermittlungskosten
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-300">{fee.quote_title || `Quote ${fee.quote_id}`}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-white">
                          Brutto: {formatCurrency(fee.gross_amount || fee.fee_amount)}
                        </div>
                        <div className="text-sm text-gray-300">
                          Netto: {formatCurrency(fee.net_amount || (fee.fee_amount / (1 + (fee.tax_rate || 8.1) / 100)))}
                        </div>
                        <div className="text-xs text-gray-400">
                          {fee.fee_percentage}% vom Angebot
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(fee.status)}`}>
                          {getStatusIcon(fee.status)}
                          <span className="ml-1">{getStatusLabel(fee.status)}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {fee.created_at ? formatDate(fee.created_at) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={getDueDateStyle(fee.due_date, fee.status)}>
                          {fee.due_date ? formatDate(fee.due_date) : 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleShowDetails(fee)} 
                            className="p-1 text-blue-400 hover:text-blue-300 transition-colors" 
                            title="Details anzeigen"
                          >
                            <Info className="w-4 h-4" />
                          </button>
                          
                          {/* Stripe Zahlungs-Button - nur für offene oder überfällige Gebühren */}
                          {(fee.status === 'open' || fee.status === 'overdue') && (
                            <button 
                              onClick={() => handlePayWithStripe(fee)}
                              disabled={processingPayment === fee.id}
                              className="flex items-center space-x-1 px-3 py-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                              title="Jetzt mit Stripe bezahlen"
                            >
                              {processingPayment === fee.id ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                  <span className="text-xs font-medium">Lädt...</span>
                                </>
                              ) : (
                                <>
                                  <CreditCard className="w-4 h-4" />
                                  <span className="text-xs font-medium">Bezahlen</span>
                                  <ExternalLink className="w-3 h-3" />
                                </>
                              )}
                            </button>
                          )}
                          
                          {fee.status === 'open' && (
                            <button 
                              onClick={() => handleMarkAsPaid(fee.id)} 
                              className="p-1 text-green-400 hover:text-green-300 transition-colors" 
                              title="Manuell als bezahlt markieren"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          
                          <button 
                            onClick={() => fee.invoice_pdf_generated ? handleDownloadInvoice(fee.id) : handleGenerateInvoice(fee.id)} 
                            className="p-1 text-[#ffbd59] hover:text-[#ffa726] transition-colors" 
                            title={fee.invoice_pdf_generated ? "PDF herunterladen" : "PDF generieren"}
                          >
                            {fee.invoice_pdf_generated ? <Download className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
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

      {/* Details Modal */}
      {showDetailsModal && selectedFeeDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-[#2c3539] to-[#1a1a2e] rounded-xl border border-white/20 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                  <Info className="w-6 h-6 text-[#ffbd59]" />
                  <span>Gebühren-Details</span>
                </h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/10 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Gebühren-ID</h4>
                    <p className="text-white font-semibold">BW-{selectedFeeDetails.id.toString().padStart(6, '0')}</p>
                  </div>
                  <div className="bg-white/10 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Ausschreibung</h4>
                    <p className="text-white font-semibold">{selectedFeeDetails.quote_title || `Quote ${selectedFeeDetails.quote_id}`}</p>
                  </div>
                </div>
                
                <div className="bg-white/10 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Finanzielle Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Angebotsbetrag:</span>
                      <span className="text-white ml-2 font-semibold">{formatCurrency(selectedFeeDetails.quote_amount)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Gebührensatz:</span>
                      <span className="text-white ml-2 font-semibold">{selectedFeeDetails.fee_percentage}%</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Nettobetrag:</span>
                      <span className="text-white ml-2 font-semibold">{formatCurrency(selectedFeeDetails.net_amount || (selectedFeeDetails.fee_amount / (1 + (selectedFeeDetails.tax_rate || 8.1) / 100)))}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Steuersatz:</span>
                      <span className="text-white ml-2 font-semibold">{selectedFeeDetails.tax_rate || 8.1}%</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Steuerbetrag:</span>
                      <span className="text-white ml-2 font-semibold">{formatCurrency(selectedFeeDetails.tax_amount || ((selectedFeeDetails.fee_amount / (1 + (selectedFeeDetails.tax_rate || 8.1) / 100)) * (selectedFeeDetails.tax_rate || 8.1) / 100))}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Bruttobetrag:</span>
                      <span className="text-white ml-2 font-semibold">{formatCurrency(selectedFeeDetails.gross_amount || selectedFeeDetails.fee_amount)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/10 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Status & Termine</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Status:</span>
                      <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${getStatusColor(selectedFeeDetails.status)}`}>
                        {getStatusLabel(selectedFeeDetails.status)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Erstellt am:</span>
                      <span className="text-white ml-2">{formatDate(selectedFeeDetails.created_at)}</span>
                    </div>
                    {selectedFeeDetails.invoice_date && (
                      <div>
                        <span className="text-gray-400">Rechnungsdatum:</span>
                        <span className="text-white ml-2">{formatDate(selectedFeeDetails.invoice_date)}</span>
                      </div>
                    )}
                    {selectedFeeDetails.due_date && (
                      <div>
                        <span className="text-gray-400">Fälligkeitsdatum:</span>
                        <span className="text-white ml-2">{formatDate(selectedFeeDetails.due_date)}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {selectedFeeDetails.notes && (
                  <div className="bg-white/10 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Notizen</h4>
                    <p className="text-white text-sm">{selectedFeeDetails.notes}</p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 bg-[#ffbd59] text-[#2c3539] rounded-lg hover:bg-[#ffa726] transition-colors font-medium"
                >
                  Schließen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
