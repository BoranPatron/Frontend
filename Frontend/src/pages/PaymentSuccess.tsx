import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  CheckCircle, 
  CreditCard, 
  FileText, 
  ArrowRight, 
  Download,
  Home,
  Receipt,
  Sparkles
} from 'lucide-react';
import { markFeeAsPaidManually, getPaymentStatus } from '../services/stripePaymentService';

interface PaymentDetails {
  fee_id: number;
  amount: number;
  currency: string;
  invoice_number: string;
  payment_method?: string;
  status: string;
}

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [error, setError] = useState<string>('');

  const feeId = searchParams.get('fee_id');

  useEffect(() => {
    const processPayment = async () => {
      if (!feeId) {
        setError('Keine Gebühren-ID gefunden');
        setLoading(false);
        return;
      }

      try {
        console.log('🎉 Verarbeite erfolgreiche Zahlung für Gebühr:', feeId);
        
        // Markiere als bezahlt (Fallback für Webhook)
        await markFeeAsPaidManually(parseInt(feeId));
        
        // Hole aktuelle Zahlungsdetails
        const details = await getPaymentStatus(parseInt(feeId));
        setPaymentDetails({
          fee_id: details.fee_id,
          amount: details.gross_amount || details.amount,
          currency: details.currency,
          invoice_number: `BW-${details.fee_id.toString().padStart(6, '0')}`,
          payment_method: details.payment_method,
          status: details.status
        });
        
      } catch (error: any) {
        console.error('Fehler bei Zahlungsverarbeitung:', error);
        setError('Fehler beim Verarbeiten der Zahlung. Bitte kontaktieren Sie den Support.');
      } finally {
        setLoading(false);
      }
    };

    processPayment();
  }, [feeId]);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const getPaymentMethodLabel = (method?: string) => {
    switch (method) {
      case 'card': return 'Kreditkarte';
      case 'sepa_debit': return 'SEPA-Lastschrift';
      default: return 'Kreditkarte';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-500 border-t-transparent mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Zahlung wird verarbeitet...</h2>
          <p className="text-gray-600">Bitte warten Sie einen Moment.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-rose-100 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Fehler aufgetreten</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/buildwise-fees')}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Zurück zu Gebühren
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100">
      {/* Success Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Zahlung erfolgreich!</h1>
              <p className="text-gray-600">Ihre BuildWise-Gebühr wurde erfolgreich bezahlt.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Payment Confirmation Card */}
          <div className="bg-white rounded-xl shadow-lg border border-green-200 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
              <div className="flex items-center space-x-3">
                <Sparkles className="w-8 h-8" />
                <div>
                  <h2 className="text-xl font-bold">Zahlungsbestätigung</h2>
                  <p className="text-green-100">Transaktion abgeschlossen</p>
                </div>
              </div>
            </div>
            
            {paymentDetails && (
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Rechnungsnummer</label>
                    <p className="text-lg font-semibold text-gray-900">{paymentDetails.invoice_number}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Bezahlt
                    </span>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Betrag:</span>
                    <span className="text-2xl font-bold text-gray-900">
                      {formatCurrency(paymentDetails.amount, paymentDetails.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-gray-600">Zahlungsmethode:</span>
                    <div className="flex items-center space-x-2">
                      <CreditCard className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-900">{getPaymentMethodLabel(paymentDetails.payment_method)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Next Steps Card */}
          <div className="bg-white rounded-xl shadow-lg border overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
              <div className="flex items-center space-x-3">
                <ArrowRight className="w-8 h-8" />
                <div>
                  <h2 className="text-xl font-bold">Nächste Schritte</h2>
                  <p className="text-blue-100">Was Sie jetzt tun können</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/buildwise-fees')}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
                >
                  <div className="flex items-center space-x-3">
                    <Receipt className="w-5 h-5 text-gray-600" />
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Alle Gebühren anzeigen</p>
                      <p className="text-sm text-gray-600">Übersicht Ihrer BuildWise-Gebühren</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                </button>
                
                <button
                  onClick={() => navigate('/service-provider-dashboard')}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
                >
                  <div className="flex items-center space-x-3">
                    <Home className="w-5 h-5 text-gray-600" />
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Zum Dashboard</p>
                      <p className="text-sm text-gray-600">Zurück zur Hauptübersicht</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-12 bg-white rounded-xl shadow-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Wichtige Informationen</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Rechnung & Belege</h4>
              <p>Eine Rechnung wird automatisch generiert und kann in der Gebühren-Übersicht heruntergeladen werden.</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Support</h4>
              <p>Bei Fragen zur Zahlung kontaktieren Sie uns über das Support-Center oder per E-Mail.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
