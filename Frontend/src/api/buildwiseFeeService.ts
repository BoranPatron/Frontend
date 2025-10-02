import api, { safeApiCall } from './api';
import { getApiBaseUrl } from './api';

export interface BuildWiseFee {
  id: number;
  project_id: number;
  quote_id: number;
  quote_title?: string;  // Neues Feld für den echten Ausschreibungsnamen
  cost_position_id: number;
  service_provider_id: number;
  fee_amount: number;
  fee_percentage: number;
  quote_amount: number;
  currency: string;
  invoice_number?: string;
  invoice_date?: string;
  due_date?: string;
  payment_date?: string;
  status: 'open' | 'paid' | 'overdue' | 'cancelled';
  invoice_pdf_path?: string;
  invoice_pdf_generated: boolean;
  tax_rate: number;
  tax_amount?: number;
  net_amount?: number;
  gross_amount?: number;
  fee_details?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface BuildWiseFeeItem {
  id: number;
  buildwise_fee_id: number;
  quote_id: number;
  cost_position_id: number;
  quote_amount: number;
  fee_amount: number;
  fee_percentage: number;
  description?: string;
  created_at: string;
}

export interface BuildWiseFeeStatistics {
  total_fees: number;
  total_amount: number;
  total_paid: number;
  total_open: number;
  total_overdue: number;
  monthly_breakdown: Array<{
    month: number;
    year: number;
    amount: number;
    count: number;
  }>;
  status_breakdown: Record<string, {
    count: number;
    amount: number;
  }>;
}

export interface BuildWiseFeeCreate {
  project_id: number;
  quote_id: number;
  cost_position_id: number;
  service_provider_id: number;
  fee_amount: number;
  fee_percentage: number;
  quote_amount: number;
  currency: string;
  invoice_number?: string;
  invoice_date?: string;
  due_date?: string;
  payment_date?: string;
  status: 'open' | 'paid' | 'overdue' | 'cancelled';
  invoice_pdf_path?: string;
  invoice_pdf_generated: boolean;
  tax_rate: number;
  tax_amount?: number;
  net_amount?: number;
  gross_amount?: number;
  fee_details?: string;
  notes?: string;
}

export interface BuildWiseFeeUpdate {
  fee_amount?: number;
  fee_percentage?: number;
  quote_amount?: number;
  currency?: string;
  invoice_number?: string;
  invoice_date?: string;
  due_date?: string;
  payment_date?: string;
  status?: 'open' | 'paid' | 'overdue' | 'cancelled';
  invoice_pdf_path?: string;
  invoice_pdf_generated?: boolean;
  tax_rate?: number;
  tax_amount?: number;
  net_amount?: number;
  gross_amount?: number;
  fee_details?: string;
  notes?: string;
}

// Hauptfunktionen
export async function createFeeFromQuote(
  quoteId: number, 
  costPositionId: number, 
  feePercentage: number = 1.0
): Promise<BuildWiseFee> {
  return safeApiCall(async () => {
    const url = `${getApiBaseUrl()}/buildwise-fees/create-from-quote/${quoteId}/${costPositionId}`;
    const res = await api.post(url, null, {
      params: { fee_percentage: feePercentage }
    });
    return res.data;
  });
}

export async function getBuildWiseFees(
  month?: number, 
  year?: number,
  projectId?: number,
  status?: string,
  skip: number = 0,
  limit: number = 100
): Promise<BuildWiseFee[]> {
  try {
    const params = new URLSearchParams();
    if (skip > 0) params.append('skip', skip.toString());
    if (limit !== 100) params.append('limit', limit.toString());
    if (projectId) params.append('project_id', projectId.toString());
    if (status) params.append('status', status);
    if (month) params.append('month', month.toString());
    if (year) params.append('year', year.toString());
    
    const url = `${getApiBaseUrl()}/buildwise-fees/?${params.toString()}`;
    const response = await api.get(url);
    // Debug: Zeige Details der ersten 3 Gebühren
    if (response.data.length > 0) {
      response.data.slice(0, 3).forEach((fee: BuildWiseFee, index: number) => {
        });
    }
    
    return response.data;
    
  } catch (error: any) {
    console.error('❌ Fehler beim Laden der BuildWise-Gebühren:', error);
    
    // Fallback: Versuche ohne Filter
    if (month || year || projectId || status) {
      try {
        const fallbackResponse = await api.get(`${getApiBaseUrl()}/buildwise-fees/?skip=${skip}&limit=${limit}`);
        return fallbackResponse.data;
      } catch (fallbackError: any) {
        console.error('❌ Fallback fehlgeschlagen:', fallbackError);
      }
    }
    
    // Leerer Fallback
    return [];
  }
}

export async function getBuildWiseFeeStatistics(): Promise<BuildWiseFeeStatistics> {
  return safeApiCall(async () => {
    const url = `${getApiBaseUrl()}/buildwise-fees/statistics`;
    const res = await api.get(url);
    return res.data;
  });
}

export async function getBuildWiseFee(feeId: number): Promise<BuildWiseFee> {
  return safeApiCall(async () => {
    const url = `${getApiBaseUrl()}/buildwise-fees/${feeId}`;
    const res = await api.get(url);
    return res.data;
  });
}

export async function updateFee(feeId: number, feeData: BuildWiseFeeUpdate): Promise<BuildWiseFee> {
  return safeApiCall(async () => {
    const url = `${getApiBaseUrl()}/buildwise-fees/${feeId}`;
    const res = await api.put(url, feeData);
    return res.data;
  });
}

export async function markFeeAsPaid(feeId: number, paymentDate?: string): Promise<BuildWiseFee> {
  return safeApiCall(async () => {
    const params: any = {};
    if (paymentDate) params.payment_date = paymentDate;
    
    const url = `${getApiBaseUrl()}/buildwise-fees/${feeId}/mark-as-paid`;
    const res = await api.post(url, null, { params });
    return res.data;
  });
}

export async function generateInvoice(feeId: number): Promise<{ message: string }> {
  return safeApiCall(async () => {
    const url = `${getApiBaseUrl()}/buildwise-fees/${feeId}/generate-invoice`;
    const res = await api.post(url);
    return res.data;
  });
}

export async function generateGewerkInvoice(feeId: number): Promise<{ 
  success: boolean; 
  message: string; 
  document_id?: number; 
  document_path?: string; 
}> {
  return safeApiCall(async () => {
    const url = `${getApiBaseUrl()}/buildwise-fees/${feeId}/generate-gewerk-invoice`;
    const res = await api.post(url);
    return res.data;
  });
}

export async function downloadInvoice(feeId: number): Promise<{ download_url: string; filename: string }> {
  return safeApiCall(async () => {
    const url = `${getApiBaseUrl()}/buildwise-fees/${feeId}/download-invoice`;
    const res = await api.get(url);
    return res.data;
  });
}

export async function getMonthlyFees(month: number, year: number): Promise<BuildWiseFee[]> {
  return safeApiCall(async () => {
    const url = `${getApiBaseUrl()}/buildwise-fees/monthly/${month}/${year}`;
    const res = await api.get(url);
    return res.data;
  });
}

export async function checkOverdueFees(): Promise<{ message: string; overdue_count: number }> {
  return safeApiCall(async () => {
    const url = `${getApiBaseUrl()}/buildwise-fees/check-overdue`;
    const res = await api.post(url);
    return res.data;
  });
}

export async function deleteFee(feeId: number): Promise<{ message: string }> {
  return safeApiCall(async () => {
    const url = `${getApiBaseUrl()}/buildwise-fees/${feeId}`;
    const res = await api.delete(url);
    return res.data;
  });
}

// Hilfsfunktionen
export function formatCurrency(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: currency
  }).format(amount);
}

export function getStatusLabel(status: string): string {
  const statusLabels: Record<string, string> = {
    'open': 'Offen',
    'paid': 'Bezahlt',
    'overdue': 'Überfällig',
    'cancelled': 'Storniert'
  };
  return statusLabels[status] || status;
}

export function getStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    'open': 'bg-blue-100 text-blue-800',
    'paid': 'bg-green-100 text-green-800',
    'overdue': 'bg-red-100 text-red-800',
    'cancelled': 'bg-gray-100 text-gray-800'
  };
  return statusColors[status] || 'bg-gray-100 text-gray-800';
}

export function calculateFeeAmount(quoteAmount: number, feePercentage: number = 1.0): number {
  return quoteAmount * (feePercentage / 100);
}

export function calculateTaxAmount(netAmount: number, taxRate: number = 8.1): number {
  return netAmount * (taxRate / 100);
}

export function calculateGrossAmount(netAmount: number, taxAmount: number): number {
  return netAmount + taxAmount;
}

// Account Status für Dienstleister
export interface AccountStatus {
  account_locked: boolean;
  has_overdue_fees: boolean;
  overdue_fees: Array<{
    id: number;
    invoice_number: string;
    due_date: string | null;
    fee_amount: number;
    gross_amount: number;
    currency: string;
    days_overdue: number;
    stripe_payment_link_url: string | null;
  }>;
  total_overdue_amount: number;
  message: string;
}

export async function checkAccountStatus(): Promise<AccountStatus> {
  return safeApiCall(async () => {
    try {
      const url = `${getApiBaseUrl()}/buildwise-fees/check-account-status`;
      const res = await api.get(url);
      return res.data;
    } catch (error: any) {
      console.error('❌ [checkAccountStatus] API-Fehler:', error);
      
      // Bei 422 oder anderen Server-Fehlern: Fallback-Response
      if (error.response?.status === 422 || error.response?.status >= 500) {
        console.log('🔄 [checkAccountStatus] Verwende Fallback wegen Server-Fehler');
        return {
          account_locked: false,
          has_overdue_fees: false,
          overdue_fees: [],
          total_overdue_amount: 0,
          message: 'Account-Status konnte nicht geprüft werden - Account gilt als aktiv'
        };
      }
      
      // Andere Fehler weiterwerfen
      throw error;
    }
  });
} 
