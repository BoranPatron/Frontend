import api, { safeApiCall } from './api';
import { getApiBaseUrl } from './api';

export interface BuildWiseFee {
  id: number;
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
    const res = await api.post(`/buildwise-fees/create-from-quote/${quoteId}/${costPositionId}`, null, {
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
    console.log('🔍 Lade BuildWise-Gebühren mit Parametern:', { month, year, projectId, status, skip, limit });
    
    const params = new URLSearchParams();
    if (skip > 0) params.append('skip', skip.toString());
    if (limit !== 100) params.append('limit', limit.toString());
    if (projectId) params.append('project_id', projectId.toString());
    if (status) params.append('status', status);
    if (month) params.append('month', month.toString());
    if (year) params.append('year', year.toString());
    
    const url = `${getApiBaseUrl()}/buildwise-fees/?${params.toString()}`;
    console.log('🚀 API Request URL:', url);
    
    const response = await api.get(url);
    console.log('✅ BuildWise-Gebühren erfolgreich geladen:', response.data);
    console.log('📊 Anzahl geladener Gebühren:', response.data.length);
    
    // Debug: Zeige Details der ersten 3 Gebühren
    if (response.data.length > 0) {
      console.log('📋 Erste Gebühren:');
      response.data.slice(0, 3).forEach((fee: BuildWiseFee, index: number) => {
        console.log(`  Gebühr ${index + 1}: ID=${fee.id}, Project=${fee.project_id}, Status=${fee.status}, Amount=${fee.fee_amount}`);
      });
    }
    
    return response.data;
    
  } catch (error: any) {
    console.error('❌ Fehler beim Laden der BuildWise-Gebühren:', error);
    
    // Fallback: Versuche ohne Filter
    if (month || year || projectId || status) {
      console.log('🔄 Versuche Fallback ohne Filter...');
      try {
        const fallbackResponse = await api.get(`${getApiBaseUrl()}/buildwise-fees/?skip=${skip}&limit=${limit}`);
        console.log('✅ Fallback erfolgreich:', fallbackResponse.data);
        console.log('📊 Anzahl Gebühren im Fallback:', fallbackResponse.data.length);
        return fallbackResponse.data;
      } catch (fallbackError: any) {
        console.error('❌ Fallback fehlgeschlagen:', fallbackError);
      }
    }
    
    // Leerer Fallback
    console.log('⚠️ Verwende leeren Fallback');
    return [];
  }
}

export async function getBuildWiseFeeStatistics(): Promise<BuildWiseFeeStatistics> {
  return safeApiCall(async () => {
    const res = await api.get('/buildwise-fees/statistics');
    return res.data;
  });
}

export async function getBuildWiseFee(feeId: number): Promise<BuildWiseFee> {
  return safeApiCall(async () => {
    const res = await api.get(`/buildwise-fees/${feeId}`);
    return res.data;
  });
}

export async function updateFee(feeId: number, feeData: BuildWiseFeeUpdate): Promise<BuildWiseFee> {
  return safeApiCall(async () => {
    const res = await api.put(`/buildwise-fees/${feeId}`, feeData);
    return res.data;
  });
}

export async function markFeeAsPaid(feeId: number, paymentDate?: string): Promise<BuildWiseFee> {
  return safeApiCall(async () => {
    const params: any = {};
    if (paymentDate) params.payment_date = paymentDate;
    
    const res = await api.post(`/buildwise-fees/${feeId}/mark-as-paid`, null, { params });
    return res.data;
  });
}

export async function generateInvoice(feeId: number): Promise<{ message: string }> {
  return safeApiCall(async () => {
    const res = await api.post(`/buildwise-fees/${feeId}/generate-invoice`);
    return res.data;
  });
}

export async function downloadInvoice(feeId: number): Promise<{ download_url: string; filename: string }> {
  return safeApiCall(async () => {
    const res = await api.get(`/buildwise-fees/${feeId}/download-invoice`);
    return res.data;
  });
}

export async function getMonthlyFees(month: number, year: number): Promise<BuildWiseFee[]> {
  return safeApiCall(async () => {
    const res = await api.get(`/buildwise-fees/monthly/${month}/${year}`);
    return res.data;
  });
}

export async function checkOverdueFees(): Promise<{ message: string; overdue_count: number }> {
  return safeApiCall(async () => {
    const res = await api.post('/buildwise-fees/check-overdue');
    return res.data;
  });
}

export async function deleteFee(feeId: number): Promise<{ message: string }> {
  return safeApiCall(async () => {
    const res = await api.delete(`/buildwise-fees/${feeId}`);
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

export function calculateTaxAmount(netAmount: number, taxRate: number = 19.0): number {
  return netAmount * (taxRate / 100);
}

export function calculateGrossAmount(netAmount: number, taxAmount: number): number {
  return netAmount + taxAmount;
} 