import React, { useState } from 'react';
import { 
  AlertTriangle, 
  CreditCard, 
  Building2, 
  CheckCircle, 
  Clock,
  Euro,
  Calendar,
  X
} from 'lucide-react';
import { AccountStatus } from '../api/buildwiseFeeService';
import { startPaymentProcess } from '../services/stripePaymentService';
import { markFeeAsPaid } from '../api/buildwiseFeeService';

interface AccountLockedModalProps {
  accountStatus: AccountStatus;
  onPaymentSuccess: () => void;
}

export default function AccountLockedModal({ accountStatus, onPaymentSuccess }: AccountLockedModalProps) {
  const [processingPayment, setProcessingPayment] = useState<number | null>(null);
  const [markingAsPaid, setMarkingAsPaid] = useState<number | null>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const handleStripePayment = async (feeId: number) => {
    try {
      setProcessingPayment(feeId);
      setError('');
      console.log('🔷 Starte Stripe-Zahlung für Gebühr:', feeId);
      
      // Starte Zahlungsprozess - leitet automatisch zu Stripe weiter
      await startPaymentProcess(feeId);
      
    } catch (error: any) {
      console.error('❌ Fehler beim Starten der Zahlung:', error);
      setError(error.message || 'Fehler beim Starten der Zahlung');
      setProcessingPayment(null);
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleMarkAsPaid = async (feeId: number) => {
    try {
      setMarkingAsPaid(feeId);
      setError('');
      
      await markFeeAsPaid(feeId);
      
      setSuccess('Rechnung als bezahlt markiert! Account wird entsperrt...');
      
      // Warte kurz und triggere dann Reload
      setTimeout(() => {
        onPaymentSuccess();
      }, 2000);
      
    } catch (error: any) {
      console.error('❌ Fehler beim Markieren als bezahlt:', error);
      setError(error.message || 'Fehler beim Markieren als bezahlt');
      setMarkingAsPaid(null);
      setTimeout(() => setError(''), 5000);
    }
  };

  const [showBankDetails, setShowBankDetails] = useState<number | null>(null);

  const handleBankTransfer = (feeId: number) => {
    // Toggle Bank-Details Anzeige
    setShowBankDetails(showBankDetails === feeId ? null : feeId);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden border-2 border-red-500/50">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-full">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Account gesperrt</h2>
              <p className="text-red-100 text-sm">Überfällige Rechnungen müssen beglichen werden</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 bg-green-500/20 border border-green-500 text-green-200 px-4 py-3 rounded-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
            <h3 className="text-yellow-400 font-semibold mb-2 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Zugriff eingeschränkt
            </h3>
            <p className="text-gray-300 text-sm">
              Ihr Account wurde aufgrund überfälliger Rechnungen gesperrt. 
              Bitte begleichen Sie die ausstehenden Beträge, um wieder vollen Zugriff auf die Plattform zu erhalten.
            </p>
          </div>

          {/* Summary */}
          <div className="bg-white/5 rounded-lg p-4 mb-6 border border-white/10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400 text-sm">Anzahl überfälliger Rechnungen</p>
                <p className="text-2xl font-bold text-red-400">{accountStatus.overdue_fees.length}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Gesamtbetrag (brutto)</p>
                <p className="text-2xl font-bold text-red-400">
                  {formatCurrency(accountStatus.total_overdue_amount)}
                </p>
              </div>
            </div>
          </div>

          {/* Overdue Fees List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-3">Überfällige Rechnungen</h3>
            
            {accountStatus.overdue_fees.map((fee) => (
              <div 
                key={fee.id} 
                className="bg-white/5 border border-white/10 rounded-lg p-5 hover:border-white/20 transition-colors"
              >
                {/* Fee Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-white font-semibold text-lg mb-1">
                      Rechnung #{fee.invoice_number}
                    </h4>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Fällig: {formatDate(fee.due_date)}
                      </span>
                      <span className="text-red-400 font-medium">
                        {fee.days_overdue} Tage überfällig
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">
                      {formatCurrency(fee.gross_amount, fee.currency)}
                    </p>
                    <p className="text-sm text-gray-400">inkl. MwSt.</p>
                  </div>
                </div>

                {/* Payment Buttons */}
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-3">
                    {/* Stripe Payment Button */}
                    <button
                      onClick={() => handleStripePayment(fee.id)}
                      disabled={processingPayment === fee.id || markingAsPaid === fee.id}
                      className="flex-1 min-w-[200px] bg-[#635bff] hover:bg-[#5449ee] disabled:bg-gray-600 
                               text-white px-4 py-3 rounded-lg font-semibold transition-all
                               flex items-center justify-center gap-2 group"
                    >
                      {processingPayment === fee.id ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>Weiterleitung zu Stripe...</span>
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-5 h-5 group-hover:scale-110 transition-transform" />
                          <span>Mit Stripe bezahlen</span>
                        </>
                      )}
                    </button>

                    {/* Bank Transfer Button */}
                    <button
                      onClick={() => handleBankTransfer(fee.id)}
                      disabled={processingPayment === fee.id || markingAsPaid === fee.id}
                      className="flex-1 min-w-[200px] bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 
                               text-white px-4 py-3 rounded-lg font-semibold transition-all
                               flex items-center justify-center gap-2 group"
                    >
                      <Building2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      <span>Überweisung</span>
                    </button>

                    {/* Mark as Paid Button */}
                    <button
                      onClick={() => handleMarkAsPaid(fee.id)}
                      disabled={processingPayment === fee.id || markingAsPaid === fee.id}
                      className="flex-1 min-w-[200px] bg-green-600 hover:bg-green-700 disabled:bg-gray-600 
                               text-white px-4 py-3 rounded-lg font-semibold transition-all
                               flex items-center justify-center gap-2 group"
                    >
                      {markingAsPaid === fee.id ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>Wird markiert...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                          <span>Als bezahlt markieren</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Bank Details (collapsible) */}
                  {showBankDetails === fee.id && (
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 space-y-2">
                      <h5 className="font-semibold text-blue-300 mb-2">Überweisungsdetails:</h5>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="text-gray-400">Empfänger:</div>
                        <div className="text-white font-mono">BuildWise GmbH</div>
                        
                        <div className="text-gray-400">IBAN:</div>
                        <div className="text-white font-mono">CH93 0000 0000 0000 0001 2</div>
                        
                        <div className="text-gray-400">BIC/SWIFT:</div>
                        <div className="text-white font-mono">BUILDWCH</div>
                        
                        <div className="text-gray-400">Betrag:</div>
                        <div className="text-white font-mono">{formatCurrency(fee.gross_amount, fee.currency)}</div>
                        
                        <div className="text-gray-400">Verwendungszweck:</div>
                        <div className="text-white font-mono">{fee.invoice_number}</div>
                      </div>
                      <p className="text-xs text-gray-400 mt-3 italic">
                        ⚠️ Wichtig: Bitte geben Sie die Rechnungsnummer als Verwendungszweck an.
                        Nach der Überweisung klicken Sie bitte auf "Als bezahlt markieren".
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Footer Info */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-gray-400 text-sm text-center">
              Bei Fragen zur Rechnung kontaktieren Sie bitte unseren Support.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

