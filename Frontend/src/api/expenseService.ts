import { api } from './api';

export interface Expense {
  id: number;
  title: string;
  description?: string;
  amount: number;
  category: 'material' | 'labor' | 'equipment' | 'services' | 'permits' | 'other';
  project_id: number;
  date: string;
  receipt_url?: string;
  construction_phase?: string;  // Bauphase zum Zeitpunkt der Ausgabe
  created_at: string;
  updated_at?: string;
}

export interface ExpenseCreate {
  title: string;
  description?: string;
  amount: number;
  category: 'material' | 'labor' | 'equipment' | 'services' | 'permits' | 'other';
  project_id: number;
  date: string;
  receipt_url?: string;
  construction_phase?: string;  // Wird automatisch vom Backend gesetzt
}

export interface ExpenseUpdate {
  title?: string;
  description?: string;
  amount?: number;
  category?: 'material' | 'labor' | 'equipment' | 'services' | 'permits' | 'other';
  date?: string;
  receipt_url?: string;
  construction_phase?: string;
}

export interface ExpenseSummary {
  total_amount: number;
  expense_count: number;
  category_totals: Record<string, number>;
  phase_totals: Record<string, number>;  // Neue Bauphasen-Gruppierung
  latest_expense?: string;
}

class ExpenseService {
  private baseUrl = '/expenses';

  async getExpenses(projectId: number): Promise<Expense[]> {
    try {
      console.log('🔍 Lade Ausgaben für Projekt:', projectId);
      const response = await api.get(`${this.baseUrl}/project/${projectId}`);
      console.log('✅ Ausgaben geladen:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Fehler beim Laden der Ausgaben:', error);
      throw this.handleError(error);
    }
  }

  async getExpense(expenseId: number): Promise<Expense> {
    try {
      const response = await api.get(`${this.baseUrl}/${expenseId}`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Fehler beim Laden der Ausgabe:', error);
      throw this.handleError(error);
    }
  }

  async createExpense(expenseData: ExpenseCreate): Promise<Expense> {
    try {
      console.log('🚀 Erstelle neue Ausgabe:', expenseData);
      const response = await api.post(this.baseUrl, expenseData);
      console.log('✅ Ausgabe erstellt:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Fehler beim Erstellen der Ausgabe:', error);
      throw this.handleError(error);
    }
  }

  async updateExpense(expenseId: number, expenseData: ExpenseUpdate): Promise<Expense> {
    try {
      console.log('🔄 Aktualisiere Ausgabe:', expenseId, expenseData);
      const response = await api.put(`${this.baseUrl}/${expenseId}`, expenseData);
      console.log('✅ Ausgabe aktualisiert:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Fehler beim Aktualisieren der Ausgabe:', error);
      throw this.handleError(error);
    }
  }

  async deleteExpense(expenseId: number): Promise<void> {
    try {
      console.log('🗑️ Lösche Ausgabe:', expenseId);
      await api.delete(`${this.baseUrl}/${expenseId}`);
      console.log('✅ Ausgabe gelöscht');
    } catch (error: any) {
      console.error('❌ Fehler beim Löschen der Ausgabe:', error);
      throw this.handleError(error);
    }
  }

  async getExpenseSummary(projectId: number): Promise<ExpenseSummary> {
    try {
      const response = await api.get(`${this.baseUrl}/project/${projectId}/summary`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Fehler beim Laden der Ausgaben-Zusammenfassung:', error);
      throw this.handleError(error);
    }
  }

  private handleError(error: any): Error {
    if (error.response) {
      const message = error.response.data?.detail || error.response.data?.message || 'Unbekannter Fehler';
      return new Error(message);
    } else if (error.request) {
      return new Error('Verbindungsfehler. Bitte prüfen Sie Ihre Internetverbindung.');
    } else {
      return new Error(`Unerwarteter Fehler: ${error.message}`);
    }
  }
}

export const expenseService = new ExpenseService(); 