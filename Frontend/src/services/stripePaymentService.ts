/**
 * Stripe Payment Service für BuildWise Gebühren
 * Verwaltet die Integration mit Stripe Payment Links
 */

import { getApiBaseUrl } from '../api/api';

// Stripe Public Key
export const STRIPE_PUBLIC_KEY = 'pk_test_51RmqhBD1cfnpqPDcdZxBM4ZNiPrqhu6w4oiTMQGbTnxfbAzN0Lq6Q0yJOmtags79C2R8SLUmLd4n3oUurQ71ryBp00yCLKw9UK';

export interface PaymentLinkResponse {
  success: boolean;
  payment_link_url: string;
  payment_link_id: string;
  amount: number;
  currency: string;
  message: string;
}

export interface PaymentStatusResponse {
  fee_id: number;
  status: string;
  payment_link_id: string | null;
  payment_link_url: string | null;
  payment_intent_id: string | null;
  payment_date: string | null;
  payment_method: string | null;
  amount: number;
  gross_amount: number | null;
  currency: string;
}

/**
 * Erstellt einen Stripe Payment Link für eine BuildWise-Gebühr
 * @param feeId ID der BuildWise-Gebühr
 * @returns Payment Link URL und weitere Informationen
 */
export async function createPaymentLink(feeId: number): Promise<PaymentLinkResponse> {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Nicht authentifiziert');
    }

    console.log(`[StripeService] Erstelle Payment Link für Gebühr ${feeId}`);

    const response = await fetch(`${getApiBaseUrl()}/buildwise-fees/${feeId}/create-payment-link`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Fehler beim Erstellen des Payment Links');
    }

    const data = await response.json();
    console.log('[StripeService] Payment Link erfolgreich erstellt:', data);
    
    return data;
  } catch (error: any) {
    console.error('[StripeService] Fehler beim Erstellen des Payment Links:', error);
    throw error;
  }
}

/**
 * Holt den aktuellen Zahlungsstatus einer Gebühr
 * @param feeId ID der BuildWise-Gebühr
 * @returns Zahlungsstatus und Details
 */
export async function getPaymentStatus(feeId: number): Promise<PaymentStatusResponse> {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Nicht authentifiziert');
    }

    const response = await fetch(`${getApiBaseUrl()}/buildwise-fees/${feeId}/payment-status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Fehler beim Abrufen des Zahlungsstatus');
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('[StripeService] Fehler beim Abrufen des Zahlungsstatus:', error);
    throw error;
  }
}

/**
 * Startet den Zahlungsprozess für eine Gebühr
 * Erstellt einen Payment Link und leitet den Benutzer zu Stripe weiter
 * @param feeId ID der BuildWise-Gebühr
 */
export async function startPaymentProcess(feeId: number): Promise<void> {
  try {
    console.log(`[StripeService] Starte Zahlungsprozess für Gebühr ${feeId}`);
    
    // Erstelle Payment Link
    const paymentData = await createPaymentLink(feeId);
    
    if (!paymentData.success || !paymentData.payment_link_url) {
      throw new Error('Payment Link konnte nicht erstellt werden');
    }
    
    console.log('[StripeService] Leite zu Stripe weiter:', paymentData.payment_link_url);
    
    // Leite zu Stripe Checkout weiter
    window.location.href = paymentData.payment_link_url;
  } catch (error: any) {
    console.error('[StripeService] Fehler beim Starten des Zahlungsprozesses:', error);
    throw error;
  }
}

/**
 * Prüft ob eine Zahlung erfolgreich war (basierend auf URL-Parametern)
 * @returns true wenn Zahlung erfolgreich, false wenn abgebrochen
 */
export function checkPaymentSuccess(): { success: boolean; feeId: number | null } {
  const urlParams = new URLSearchParams(window.location.search);
  const paymentStatus = urlParams.get('payment');
  const feeId = urlParams.get('fee_id');
  
  return {
    success: paymentStatus === 'success',
    feeId: feeId ? parseInt(feeId, 10) : null
  };
}

/**
 * Markiert eine Gebühr manuell als bezahlt (Fallback wenn Webhook nicht funktioniert)
 * @param feeId ID der BuildWise-Gebühr
 */
export async function markFeeAsPaidManually(feeId: number): Promise<void> {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Nicht authentifiziert');
    }

    console.log(`[StripeService] Markiere Gebühr ${feeId} manuell als bezahlt`);

    const response = await fetch(`${getApiBaseUrl()}/buildwise-fees/${feeId}/mark-as-paid`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Fehler beim Markieren als bezahlt');
    }

    console.log('[StripeService] Gebühr erfolgreich als bezahlt markiert');
  } catch (error: any) {
    console.error('[StripeService] Fehler beim manuellen Markieren:', error);
    throw error;
  }
}

/**
 * Entfernt Payment-Parameter aus der URL
 */
export function clearPaymentParams(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete('payment');
  url.searchParams.delete('fee_id');
  window.history.replaceState({}, '', url.toString());
}

