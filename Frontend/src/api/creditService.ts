import { getApiBaseUrl, safeApiCall } from './api';

// Interfaces für das Credit-System
export interface CreditBalance {
  user_id: number;
  credits: number;
  plan_status: 'pro' | 'basic' | 'expired';
  remaining_pro_days: number;
  is_pro_active: boolean;
  low_credit_warning: boolean;
  can_perform_actions: boolean;
}

export interface CreditEvent {
  id: number;
  user_credits_id: number;
  event_type: string;
  credits_change: number;
  credits_before: number;
  credits_after: number;
  description: string;
  related_entity_type?: string;
  related_entity_id?: number;
  created_at: string;
}

export interface CreditPackage {
  package_type: string;
  name: string;
  credits: number;
  price: number;
  price_per_credit: number;
  description: string;
  popular: boolean;
  best_value: boolean;
}

export interface CreditPurchase {
  purchase_id: number;
  stripe_session_id: string;
  package_type: string;
  credits_amount: number;
  price_chf: number;
  checkout_url: string;
}

export interface CreditAdjustmentRequest {
  user_id: number;
  credits_change: number;
  reason: string;
}

export interface CreditSystemStatus {
  status: string;
  message: string;
}

class CreditService {
  private baseUrl = '/credits';

  // Credit-Balance abrufen
  async getCreditBalance(): Promise<CreditBalance> {
    return safeApiCall(async () => {
      const response = await fetch(`${getApiBaseUrl()}${this.baseUrl}/balance`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    });
  }

  // Credit-Events abrufen
  async getCreditEvents(limit: number = 50, offset: number = 0): Promise<CreditEvent[]> {
    return safeApiCall(async () => {
      const response = await fetch(
        `${getApiBaseUrl()}${this.baseUrl}/events?limit=${limit}&offset=${offset}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    });
  }

  // Credit-Packages abrufen
  async getCreditPackages(): Promise<CreditPackage[]> {
    return safeApiCall(async () => {
      const response = await fetch(`${getApiBaseUrl()}${this.baseUrl}/packages`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    });
  }

  // Credit-Kauf initiieren
  async initiateCreditPurchase(packageType: string): Promise<CreditPurchase> {
    return safeApiCall(async () => {
      const response = await fetch(`${getApiBaseUrl()}${this.baseUrl}/purchase/initiate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ package_type: packageType }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    });
  }

  // Admin: Manuelle Credit-Anpassung
  async adjustCredits(adjustment: CreditAdjustmentRequest): Promise<CreditSystemStatus> {
    return safeApiCall(async () => {
      const response = await fetch(`${getApiBaseUrl()}${this.baseUrl}/admin/adjust`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(adjustment),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    });
  }

  // Admin: Manuelle tägliche Abzüge auslösen
  async processDailyDeductions(): Promise<CreditSystemStatus> {
    return safeApiCall(async () => {
      const response = await fetch(`${getApiBaseUrl()}${this.baseUrl}/admin/daily-deduction`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    });
  }

  // Hilfsfunktionen
  formatCredits(credits: number): string {
    return credits.toLocaleString('de-DE');
  }

  getPlanStatusLabel(status: string): string {
    switch (status) {
      case 'pro':
        return 'Pro';
      case 'basic':
        return 'Basis';
      case 'expired':
        return 'Abgelaufen';
      default:
        return 'Unbekannt';
    }
  }

  getPlanStatusColor(status: string): string {
    switch (status) {
      case 'pro':
        return 'text-green-600';
      case 'basic':
        return 'text-yellow-600';
      case 'expired':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  }

  getEventTypeLabel(eventType: string): string {
    const labels: Record<string, string> = {
      'registration_bonus': 'Registrierungs-Bonus',
      'quote_accepted': 'Angebot angenommen',
      'invoice_received': 'Rechnung erhalten',
      'project_completed': 'Projekt abgeschlossen',
      'provider_review': 'Dienstleister bewertet',
      'milestone_completed': 'Meilenstein abgeschlossen',
      'document_uploaded': 'Dokument hochgeladen',
      'expense_added': 'Ausgabe hinzugefügt',
      'daily_deduction': 'Täglicher Abzug',
      'purchase_credits': 'Credits gekauft',
      'manual_adjustment': 'Manuelle Anpassung',
    };
    return labels[eventType] || eventType;
  }

  getEventTypeIcon(eventType: string): string {
    const icons: Record<string, string> = {
      'registration_bonus': '🎁',
      'quote_accepted': '✅',
      'invoice_received': '📄',
      'project_completed': '🏆',
      'provider_review': '⭐',
      'milestone_completed': '🎯',
      'document_uploaded': '📁',
      'expense_added': '💰',
      'daily_deduction': '⏰',
      'purchase_credits': '💳',
      'manual_adjustment': '🔧',
    };
    return icons[eventType] || '📊';
  }
}

const creditService = new CreditService();
export { creditService, CreditBalance, CreditEvent, CreditPackage, CreditPurchase, CreditAdjustmentRequest, CreditSystemStatus };
export default creditService; 