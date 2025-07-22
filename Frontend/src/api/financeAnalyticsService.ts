import api from './api';

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
}

export const financeAnalyticsService = new FinanceAnalyticsService(); 