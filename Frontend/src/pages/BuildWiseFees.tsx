import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  FileText, 
  Download, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Calendar,
  TrendingUp,
  BarChart3,
  Receipt
} from 'lucide-react';
import { 
  getBuildWiseFees, 
  getBuildWiseFeeStatistics, 
  markFeeAsPaid, 
  generateInvoice,
  downloadInvoice
} from '../api/buildwiseFeeService';
import type { BuildWiseFee, BuildWiseFeeStatistics } from '../api/buildwiseFeeService';

export default function BuildWiseFees() {
  const [fees, setFees] = useState<BuildWiseFee[]>([]);
  const [statistics, setStatistics] = useState<BuildWiseFeeStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, [selectedMonth, selectedYear]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [feesData, statsData] = await Promise.all([
        getBuildWiseFees(selectedMonth, selectedYear),
        getBuildWiseFeeStatistics()
      ]);
      setFees(feesData);
      setStatistics(statsData);
    } catch (error) {
      console.error('Fehler beim Laden der BuildWise-Gebühren:', error);
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
      await generateInvoice(feeId);
      await loadData(); // Daten neu laden
    } catch (error) {
      console.error('Fehler beim Generieren der Rechnung:', error);
    }
  };

  const handleDownloadInvoice = async (feeId: number) => {
    try {
      const result = await downloadInvoice(feeId);
      // TODO: Implementiere tatsächlichen Download
      console.log('Download-Link:', result.download_url);
    } catch (error) {
      console.error('Fehler beim Download der Rechnung:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'open':
        return <Clock className="w-5 h-5 text-blue-500" />;
      case 'overdue':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'cancelled':
        return <AlertTriangle className="w-5 h-5 text-gray-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Bezahlt';
      case 'open':
        return 'Offen';
      case 'overdue':
        return 'Überfällig';
      case 'cancelled':
        return 'Storniert';
      default:
        return 'Unbekannt';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
    if (filterStatus === 'all') return fees;
    return fees.filter(fee => fee.status === filterStatus);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-700 rounded"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] p-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center gap-4 mb-2">
          <DollarSign className="w-9 h-9 text-[#ffbd59]" />
          <h1 className="text-3xl font-bold text-white">BuildWise-Gebühren</h1>
        </div>
        <p className="text-gray-300 text-base mb-6">Monatliche Übersicht & Rechnungen Ihrer BuildWise-Gebühren</p>
      </div>

      {/* Statistiken */}
      {statistics && (
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6 px-4">
          <div className="bg-[#2c3539] rounded-xl border border-[#ffbd59]/20 p-5 flex items-center gap-4">
            <div className="bg-[#ffbd59]/20 p-2 rounded-lg"><Receipt className="w-6 h-6 text-[#ffbd59]" /></div>
            <div>
              <div className="text-xs text-gray-400">Gesamtgebühren</div>
              <div className="text-xl font-bold text-white">{statistics.total_fees}</div>
            </div>
          </div>
          <div className="bg-[#2c3539] rounded-xl border border-[#ffbd59]/20 p-5 flex items-center gap-4">
            <div className="bg-[#ffbd59]/20 p-2 rounded-lg"><TrendingUp className="w-6 h-6 text-[#ffbd59]" /></div>
            <div>
              <div className="text-xs text-gray-400">Gesamtbetrag</div>
              <div className="text-xl font-bold text-white">{formatCurrency(statistics.total_amount)}</div>
            </div>
          </div>
          <div className="bg-[#2c3539] rounded-xl border border-[#ffbd59]/20 p-5 flex items-center gap-4">
            <div className="bg-green-500/20 p-2 rounded-lg"><CheckCircle className="w-6 h-6 text-green-400" /></div>
            <div>
              <div className="text-xs text-gray-400">Bezahlt</div>
              <div className="text-xl font-bold text-white">{formatCurrency(statistics.total_paid)}</div>
            </div>
          </div>
          <div className="bg-[#2c3539] rounded-xl border border-[#ffbd59]/20 p-5 flex items-center gap-4">
            <div className="bg-red-500/20 p-2 rounded-lg"><AlertTriangle className="w-6 h-6 text-red-400" /></div>
            <div>
              <div className="text-xs text-gray-400">Offen</div>
              <div className="text-xl font-bold text-white">{formatCurrency(statistics.total_open)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Filterleiste */}
      <div className="max-w-7xl mx-auto flex flex-wrap gap-4 items-end px-4 mb-6">
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">Monat</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="border border-gray-600 bg-[#2c3539] text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] text-sm"
          >
            {[...Array(12)].map((_, i) => (
              <option key={i + 1} value={i + 1}>{getMonthName(i + 1)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">Jahr</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="border border-gray-600 bg-[#2c3539] text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] text-sm"
          >
            {[...Array(5)].map((_, i) => {
              const year = new Date().getFullYear() - 2 + i;
              return <option key={year} value={year}>{year}</option>;
            })}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-300 mb-1">Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-600 bg-[#2c3539] text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] text-sm"
          >
            <option value="all">Alle</option>
            <option value="open">Offen</option>
            <option value="paid">Bezahlt</option>
            <option value="overdue">Überfällig</option>
            <option value="cancelled">Storniert</option>
          </select>
        </div>
        <button
          onClick={loadData}
          className="ml-auto bg-[#ffbd59] text-[#2c3539] px-4 py-2 rounded-md hover:bg-[#ffa726] focus:outline-none focus:ring-2 focus:ring-[#ffbd59] text-sm font-semibold"
        >
          Aktualisieren
        </button>
      </div>

      {/* Gebühren-Tabelle */}
      <div className="max-w-7xl mx-auto bg-[#2c3539] rounded-xl border border-[#ffbd59]/20 shadow-sm overflow-x-auto px-4 py-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-white">BuildWise-Gebühren {getMonthName(selectedMonth)} {selectedYear}</h2>
        </div>
        {getFilteredFees().length === 0 ? (
          <div className="p-8 text-center">
            <DollarSign className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Keine Gebühren für diesen Zeitraum gefunden.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-[#3d4952]">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Rechnungsnummer</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Betrag</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Rechnungsdatum</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Fälligkeitsdatum</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">Aktionen</th>
              </tr>
            </thead>
            <tbody className="bg-[#2c3539] divide-y divide-gray-700">
              {getFilteredFees().map((fee) => (
                <tr key={fee.id} className="hover:bg-[#3d4952] transition">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-white">{fee.invoice_number || `BW-${fee.id}`}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">{formatCurrency(fee.total_amount)}</div>
                    <div className="text-xs text-gray-400">{fee.fee_percentage}% von akzeptierten Angeboten</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(fee.status)}`}>{getStatusIcon(fee.status)} {getStatusLabel(fee.status)}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{fee.invoice_date ? formatDate(fee.invoice_date) : '-'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">{fee.due_date ? formatDate(fee.due_date) : '-'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {fee.status === 'open' && (
                        <button onClick={() => handleMarkAsPaid(fee.id)} className="text-green-400 hover:text-green-300" title="Als bezahlt markieren"><CheckCircle className="w-5 h-5" /></button>
                      )}
                      {!fee.invoice_pdf_generated && (
                        <button onClick={() => handleGenerateInvoice(fee.id)} className="text-[#ffbd59] hover:text-[#ffa726]" title="PDF-Rechnung generieren"><FileText className="w-5 h-5" /></button>
                      )}
                      {fee.invoice_pdf_generated && (
                        <button onClick={() => handleDownloadInvoice(fee.id)} className="text-[#ffbd59] hover:text-[#ffa726]" title="PDF-Rechnung herunterladen"><Download className="w-5 h-5" /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
} 