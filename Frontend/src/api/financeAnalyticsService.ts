import { api } from './api';

export interface PhaseData {
  phase: string;
  count: number;
  total_amount: number;
  total_paid: number;
  remaining_amount: number;
  avg_progress: number;
  completion_percentage: number;
}

export interface CategoryData {
  category: string;
  category_name: string;
  count: number;
  total_amount: number;
  total_paid: number;
  remaining_amount: number;
  avg_progress: number;
  percentage_of_total: number;
}

export interface StatusData {
  status: string;
  status_name: string;
  count: number;
  total_amount: number;
  total_paid: number;
  remaining_amount: number;
  avg_progress: number;
}

export interface FinanceSummary {
  project_id: number;
  project_name: string;
  summary: {
    total_cost_positions: number;
    total_amount: number;
    total_paid: number;
    total_remaining: number;
    avg_progress: number;
    completed_count: number;
    active_count: number;
    completion_percentage: number;
  };
  phases: {
    project_id: number;
    project_name: string;
    phases: PhaseData[];
    total_cost_positions: number;
    total_amount: number;
    total_paid: number;
    total_remaining: number;
  };
  categories: {
    project_id: number;
    project_name: string;
    categories: CategoryData[];
    total_amount: number;
  };
  statuses: {
    project_id: number;
    project_name: string;
    statuses: StatusData[];
  };
}

export interface TimeData {
  year: number;
  period: number;
  count: number;
  total_amount: number;
  total_paid: number;
  remaining_amount: number;
  avg_progress: number;
}

export interface CostsOverTime {
  project_id: number;
  project_name: string;
  period: string;
  time_data: TimeData[];
}

export interface MilestoneCosts {
  project_id: number;
  project_name: string;
  milestones: {
    milestone_id: number;
    milestone_title: string;
    construction_phase: string;
    cost_count: number;
    total_amount: number;
    total_paid: number;
    remaining_amount: number;
    avg_progress: number;
  }[];
}

export interface PaymentTimeline {
  project_id: number;
  project_name: string;
  timeline: {
    cost_position_id: number;
    title: string;
    amount: number;
    paid_amount: number;
    remaining_amount: number;
    start_date: string;
    completion_date: string;
    construction_phase: string;
    status: string;
  }[];
}

export interface ExpenseAnalyticsByPhase {
  total_amount: number;
  total_count: number;
  phase_breakdown: Record<string, {
    total_amount: number;
    count: number;
    percentage: number;
    categories: Record<string, number>;
    latest_expense: string | null;
  }>;
  phases_with_expenses: number;
}

export interface ComprehensiveFinanceAnalytics {
  project_info: {
    id: number;
    name: string;
    construction_phase: string | null;
    budget: number;
    progress_percentage: number;
  };
  expense_analytics: ExpenseAnalyticsByPhase;
  cost_positions: {
    total_amount: number;
    paid_amount: number;
    remaining_amount: number;
    count: number;
  };
  buildwise_fees: {
    total_amount: number;
    paid_amount: number;
    remaining_amount: number;
    count: number;
  };
  budget_analysis: {
    total_costs: number;
    budget_utilization_percentage: number;
    remaining_budget: number;
    over_budget: boolean;
  };
  phase_performance: Record<string, {
    total_amount: number;
    count: number;
    percentage: number;
    avg_daily_expense: number;
    top_category: string | null;
    category_distribution: Record<string, number>;
  }>;
}

export interface ExpenseTrendsByPhase {
  period_months: number;
  start_date: string;
  end_date: string;
  monthly_trends: Record<string, Record<string, number>>;
}

export interface PhaseComparisonAnalytics {
  total_phases: number;
  comparisons: Record<string, {
    phase1: {
      name: string;
      amount: number;
      percentage: number;
      count: number;
    };
    phase2: {
      name: string;
      amount: number;
      percentage: number;
      count: number;
    };
    differences: {
      amount_diff: number;
      percentage_diff: number;
      more_expensive_phase: string;
    };
  }>;
}

class FinanceAnalyticsService {
  private baseUrl = '/finance-analytics';

  async getFinanceSummary(projectId: number): Promise<FinanceSummary> {
    const response = await api.get(`${this.baseUrl}/project/${projectId}/summary`);
    return response.data;
  }

  async getCostsByPhase(projectId: number): Promise<{
    project_id: number;
    project_name: string;
    phases: PhaseData[];
    total_cost_positions: number;
    total_amount: number;
    total_paid: number;
    total_remaining: number;
  }> {
    const response = await api.get(`${this.baseUrl}/project/${projectId}/costs-by-phase`);
    return response.data;
  }

  async getCostsOverTime(
    projectId: number,
    period: 'monthly' | 'weekly' | 'quarterly' = 'monthly',
    months: number = 12
  ): Promise<CostsOverTime> {
    const response = await api.get(
      `${this.baseUrl}/project/${projectId}/costs-over-time?period=${period}&months=${months}`
    );
    return response.data;
  }

  async getCostsByCategory(projectId: number): Promise<{
    project_id: number;
    project_name: string;
    categories: CategoryData[];
    total_amount: number;
  }> {
    const response = await api.get(`${this.baseUrl}/project/${projectId}/costs-by-category`);
    return response.data;
  }

  async getCostsByStatus(projectId: number): Promise<{
    project_id: number;
    project_name: string;
    statuses: StatusData[];
  }> {
    const response = await api.get(`${this.baseUrl}/project/${projectId}/costs-by-status`);
    return response.data;
  }

  async getMilestoneCosts(projectId: number): Promise<MilestoneCosts> {
    const response = await api.get(`${this.baseUrl}/project/${projectId}/milestone-costs`);
    return response.data;
  }

  async getPaymentTimeline(projectId: number, months: number = 6): Promise<PaymentTimeline> {
    const response = await api.get(
      `${this.baseUrl}/project/${projectId}/payment-timeline?months=${months}`
    );
    return response.data;
  }

  async getExpenseAnalyticsByPhase(projectId: number): Promise<ExpenseAnalyticsByPhase> {
    try {
      console.log('🔍 Lade Ausgaben-Analytics nach Bauphasen für Projekt:', projectId);
      const response = await api.get(`${this.baseUrl}/project/${projectId}/expense-analytics`);
      console.log('✅ Ausgaben-Analytics geladen:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Fehler beim Laden der Ausgaben-Analytics:', error);
      throw this.handleError(error);
    }
  }

  async getComprehensiveFinanceAnalytics(projectId: number): Promise<ComprehensiveFinanceAnalytics> {
    try {
      console.log('🔍 Lade umfassende Finanz-Analytics für Projekt:', projectId);
      const response = await api.get(`${this.baseUrl}/project/${projectId}/comprehensive`);
      console.log('✅ Umfassende Finanz-Analytics geladen:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Fehler beim Laden der umfassenden Finanz-Analytics:', error);
      throw this.handleError(error);
    }
  }

  async getExpenseTrendsByPhase(projectId: number, months: number = 6): Promise<ExpenseTrendsByPhase> {
    try {
      console.log('🔍 Lade Ausgaben-Trends nach Bauphasen für Projekt:', projectId);
      const response = await api.get(`${this.baseUrl}/project/${projectId}/expense-trends?months=${months}`);
      console.log('✅ Ausgaben-Trends geladen:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Fehler beim Laden der Ausgaben-Trends:', error);
      throw this.handleError(error);
    }
  }

  async getPhaseComparisonAnalytics(projectId: number): Promise<PhaseComparisonAnalytics> {
    try {
      console.log('🔍 Lade Phasen-Vergleichs-Analytics für Projekt:', projectId);
      const response = await api.get(`${this.baseUrl}/project/${projectId}/phase-comparison`);
      console.log('✅ Phasen-Vergleichs-Analytics geladen:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Fehler beim Laden der Phasen-Vergleichs-Analytics:', error);
      throw this.handleError(error);
    }
  }

  // Hilfsfunktionen für die Datenverarbeitung
  formatCurrency(amount: number, currency: string = 'EUR'): string {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  getPhaseColor(phase: string): string {
    const phaseColors: Record<string, string> = {
      'planning': 'bg-blue-500',
      'preparation': 'bg-yellow-500',
      'foundation': 'bg-orange-500',
      'structure': 'bg-red-500',
      'roofing': 'bg-purple-500',
      'electrical': 'bg-indigo-500',
      'plumbing': 'bg-cyan-500',
      'interior': 'bg-pink-500',
      'landscaping': 'bg-green-500',
      'completion': 'bg-emerald-500',
      'Unbekannt': 'bg-gray-500'
    };
    return phaseColors[phase] || 'bg-gray-500';
  }

  getPhaseLabel(phase: string): string {
    const phaseLabels: Record<string, string> = {
      'planning': 'Planung',
      'preparation': 'Vorbereitung',
      'foundation': 'Fundament',
      'structure': 'Rohbau',
      'roofing': 'Dach',
      'electrical': 'Elektrik',
      'plumbing': 'Sanitär',
      'interior': 'Innenausbau',
      'landscaping': 'Außenanlagen',
      'completion': 'Fertigstellung',
      'Unbekannt': 'Unbekannt'
    };
    return phaseLabels[phase] || phase;
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

export const financeAnalyticsService = new FinanceAnalyticsService(); 