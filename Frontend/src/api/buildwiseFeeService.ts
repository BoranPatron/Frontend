import api from './api';

export interface BuildWiseFee {
  id: number;
  user_id: number;
  project_id: number;
  fee_month: number;
  fee_year: number;
  total_amount: number;
  fee_percentage: number;
  invoice_number?: string;
  invoice_date?: string;
  due_date?: string;
  status: 'open' | 'paid' | 'overdue' | 'cancelled';
  payment_date?: string;
  invoice_pdf_path?: string;
  invoice_pdf_generated: boolean;
  fee_details?: string;
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

export async function getBuildWiseFees(month?: number, year?: number) {
  const params = new URLSearchParams();
  if (month) params.append('month', month.toString());
  if (year) params.append('year', year.toString());
  
  const response = await api.get(`/buildwise-fees/?${params.toString()}`);
  return response.data;
}

export async function getBuildWiseFeeStatistics() {
  const response = await api.get('/buildwise-fees/statistics');
  return response.data;
}

export async function getBuildWiseFee(feeId: number) {
  const response = await api.get(`/buildwise-fees/${feeId}`);
  return response.data;
}

export async function updateFeeStatus(feeId: number, status: string, paymentDate?: string) {
  const response = await api.put(`/buildwise-fees/${feeId}/status`, {
    status,
    payment_date: paymentDate
  });
  return response.data;
}

export async function markFeeAsPaid(feeId: number) {
  const response = await api.post(`/buildwise-fees/${feeId}/mark-paid`);
  return response.data;
}

export async function generateInvoice(feeId: number) {
  const response = await api.post(`/buildwise-fees/${feeId}/generate-invoice`);
  return response.data;
}

export async function downloadInvoice(feeId: number) {
  const response = await api.get(`/buildwise-fees/${feeId}/download-invoice`);
  return response.data;
}

export async function getMonthlyFees(month: number, year: number) {
  const response = await api.get(`/buildwise-fees/monthly/${month}/${year}`);
  return response.data;
} 