import api from './api';

export interface CreditBalance {
  credits: number;
  plan_status: 'BASIC' | 'PRO';
  remaining_pro_days: number | null;
  is_pro_active: boolean;
  low_credit_warning: boolean;
  can_perform_actions: boolean;
}

export interface CreditEvent {
  id: number;
  event_type: string;
  credits_change: number;
  credits_before: number;
  credits_after: number;
  description: string;
  created_at: string;
}

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  savings?: number;
  popular?: boolean;
  package_type?: string;
  best_value?: boolean;
  price_per_credit?: number;
  description?: string;
}

export const getCreditBalance = async (): Promise<CreditBalance> => {
  try {
    const response = await api.get('/credits/balance');
    return response.data;
  } catch (error) {
    console.error('Fehler beim Abrufen der Credit-Balance:', error);
    throw error;
  }
};

export const getCreditHistory = async (): Promise<CreditEvent[]> => {
  try {
    const response = await api.get('/credits/history');
    return response.data;
  } catch (error) {
    console.error('Fehler beim Abrufen der Credit-Historie:', error);
    throw error;
  }
};

export const getCreditPackages = async (): Promise<CreditPackage[]> => {
  try {
    const response = await api.get('/credits/packages');
    return response.data;
  } catch (error) {
    console.error('Fehler beim Abrufen der Credit-Pakete:', error);
    throw error;
  }
};

export const purchaseCredits = async (packageId: string): Promise<any> => {
  try {
    const response = await api.post('/credits/purchase', { package_id: packageId });
    return response.data;
  } catch (error) {
    console.error('Fehler beim Kauf von Credits:', error);
    throw error;
  }
};

export const confirmPurchase = async (purchaseId: number, paymentDetails: any): Promise<any> => {
  try {
    const response = await api.post(`/credits/purchase/${purchaseId}/confirm`, paymentDetails);
    return response.data;
  } catch (error) {
    console.error('Fehler bei der Bestätigung des Credit-Kaufs:', error);
    throw error;
  }
};