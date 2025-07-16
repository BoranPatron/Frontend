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
  ArrowLeft
} from 'lucide-react';
import { 
  getBuildWiseFees, 
  getBuildWiseFeeStatistics, 
  markFeeAsPaid, 
  generateInvoice, 
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
      console.log('📅 Ausgewählter Monat/Year:', selectedMonth, selectedYear);
      
      const [feesData, statsData] = await Promise.all([
        getBuildWiseFees(selectedMonth, selectedYear),
        getBuildWiseFeeStatistics()
      ]);
      
      console.log('📊 Geladene Gebühren:', feesData);
      console.log('📈 Statistiken:', statsData);
      
      setFees(feesData);
      setStatistics(statsData);
      
      console.log('✅ BuildWise-Gebühren erfolgreich geladen');
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
      console.log('📄 Generiere PDF-Rechnung für Gebühr:', feeId);
      
      // Generiere PDF
      await generateInvoice(feeId);
      
      // Warte kurz und lade dann Daten neu
      setTimeout(async () => {
        await loadData();
        
        // Versuche automatisch den Download zu starten
        try {
          await handleDownloadInvoice(feeId);
        } catch (downloadError) {
          console.log('Automatischer Download fehlgeschlagen, aber PDF wurde generiert');
        }
      }, 1000);
      
    } catch (error) {
      console.error('Fehler beim Generieren der Rechnung:', error);
      setError('Fehler beim Generieren der Rechnung');
    }
  };

  const handleDownloadInvoice = async (feeId: number) => {
    try {
      console.log('📥 Starte PDF-Download für Gebühr:', feeId);
      
      // Hole Token für Authorization
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('Kein Token verfügbar');
        setError('Kein Token verfügbar');
        return;
      }
      
      // Versuche Backend-Download
      const response = await fetch(`${getApiBaseUrl()}/buildwise-fees/${feeId}/download-invoice`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Backend-Download erfolgreich:', data);
        
        // Lade PDF vom Backend
        const pdfResponse = await fetch(`${getApiBaseUrl()}/buildwise-fees/${feeId}/invoice.pdf`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (pdfResponse.ok) {
          const blob = await pdfResponse.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = data.filename || `buildwise_invoice_${feeId}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          
          setSuccess('PDF-Rechnung erfolgreich heruntergeladen!');
          setTimeout(() => setSuccess(''), 5000);
        } else {
          throw new Error(`PDF-Download fehlgeschlagen: ${pdfResponse.status}`);
        }
      } else {
        throw new Error(`Download fehlgeschlagen: ${response.status}`);
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ffbd59] mx-auto mb-4"></div>
          <p>Lade BuildWise-Gebühren...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#51646f] via-[#3d4952] to-[#2c3539]">
      {/* Header */}
      <div className="bg-white/5 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/service-provider-dashboard')}
                className="text-white hover:text-[#ffbd59] transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-2xl font-bold text-white">BuildWise-Gebühren</h1>
              <span className="text-sm text-gray-300">Vermittlungskosten</span>
            </div>
            <div className="flex items-center space-x-4">
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
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-300">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-300">
            {success}
          </div>
        )}

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/5 backdrop-blur-lg rounded-lg p-6 border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-300">Gesamtgebühren</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(statistics.total_fees)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-[#ffbd59]" />
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-lg rounded-lg p-6 border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-300">Bezahlt</p>
                  <p className="text-2xl font-bold text-green-400">{formatCurrency(statistics.paid_fees)}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-lg rounded-lg p-6 border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-300">Ausstehend</p>
                  <p className="text-2xl font-bold text-yellow-400">{formatCurrency(statistics.pending_fees)}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-400" />
              </div>
            </div>
            <div className="bg-white/5 backdrop-blur-lg rounded-lg p-6 border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-300">Überfällig</p>
                  <p className="text-2xl font-bold text-red-400">{formatCurrency(statistics.overdue_fees)}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white/5 backdrop-blur-lg rounded-lg p-6 border border-white/10 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Monat</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59]"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                  <option key={month} value={month}>{getMonthName(month)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Jahr</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59]"
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59]"
              >
                <option value="all">Alle Status</option>
                <option value="open">Offen</option>
                <option value="pending">Ausstehend</option>
                <option value="paid">Bezahlt</option>
                <option value="overdue">Überfällig</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={loadData}
                className="w-full px-4 py-2 bg-[#ffbd59] text-[#2c3539] rounded-lg hover:bg-[#ffa726] transition-colors flex items-center justify-center space-x-2"
              >
                <Filter className="w-4 h-4" />
                <span>Filtern</span>
              </button>
            </div>
          </div>
        </div>

        {/* Fees Table */}
        <div className="bg-white/5 backdrop-blur-lg rounded-lg border border-white/10 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10">
            <h3 className="text-lg font-semibold text-white">Gebühren-Übersicht</h3>
            <p className="text-sm text-gray-300">Ihre BuildWise-Vermittlungskosten</p>
          </div>
          
          {filteredFees.length === 0 ? (
            <div className="p-8 text-center text-gray-300">
              <Receipt className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>Keine Gebühren für den ausgewählten Zeitraum gefunden.</p>
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
                      Datum
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Aktionen
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white/5 divide-y divide-white/10">
                  {filteredFees.map((fee) => (
                    <tr key={fee.id} className="hover:bg-white/5">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <Receipt className="w-8 h-8 text-[#ffbd59]" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-white">
                              BW-{fee.id.toString().padStart(6, '0')}
                            </div>
                            <div className="text-sm text-gray-300">
                              Vermittlungskosten
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        Projekt {fee.project_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">
                          {formatCurrency(fee.fee_amount)}
                        </div>
                        <div className="text-xs text-gray-300">
                          {fee.fee_percentage}% vom Angebot
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(fee.status)}`}>
                          {getStatusIcon(fee.status)}
                          <span className="ml-1">{getStatusLabel(fee.status)}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {fee.created_at ? formatDate(fee.created_at) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {fee.status === 'open' && (
                            <button 
                              onClick={() => handleMarkAsPaid(fee.id)} 
                              className="text-green-400 hover:text-green-300" 
                              title="Als bezahlt markieren"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                          )}
                          {/* Zeige immer einen Download-Button */}
                          <button 
                            onClick={() => fee.invoice_pdf_generated ? handleDownloadInvoice(fee.id) : handleGenerateInvoice(fee.id)} 
                            className="text-[#ffbd59] hover:text-[#ffa726]" 
                            title={fee.invoice_pdf_generated ? "PDF-Rechnung herunterladen" : "PDF-Rechnung generieren"}
                          >
                            {fee.invoice_pdf_generated ? <Download className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
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
    </div>
  );
} 