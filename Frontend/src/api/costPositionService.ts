import api from './api';

export interface CostPosition {
  id: number;
  title: string;
  description: string;
  amount: number;
  currency: string;
  category: string;
  cost_type: string;
  status: string;
  contractor_name?: string;
  contractor_contact?: string;
  contractor_phone?: string;
  contractor_email?: string;
  contractor_website?: string;
  progress_percentage: number;
  paid_amount: number;
  payment_terms?: string;
  warranty_period?: number;
  estimated_duration?: number;
  start_date?: string;
  completion_date?: string;
  labor_cost?: number;
  material_cost?: number;
  overhead_cost?: number;
  risk_score?: number;
  price_deviation?: number;
  ai_recommendation?: string;
  quote_id?: number;
  milestone_id?: number;
  project_id: number;
  created_at: string;
  updated_at: string;
}

export interface CostPositionCreate {
  title: string;
  description?: string;
  amount: number;
  currency?: string;
  category: string;
  cost_type?: string;
  status?: string;
  contractor_name?: string;
  contractor_contact?: string;
  contractor_phone?: string;
  contractor_email?: string;
  contractor_website?: string;
  payment_terms?: string;
  warranty_period?: number;
  estimated_duration?: number;
  start_date?: string;
  completion_date?: string;
  labor_cost?: number;
  material_cost?: number;
  overhead_cost?: number;
  risk_score?: number;
  price_deviation?: number;
  ai_recommendation?: string;
  quote_id?: number;
  milestone_id?: number;
  project_id: number;
}

export interface CostPositionUpdate {
  title?: string;
  description?: string;
  amount?: number;
  currency?: string;
  category?: string;
  cost_type?: string;
  status?: string;
  contractor_name?: string;
  contractor_contact?: string;
  contractor_phone?: string;
  contractor_email?: string;
  contractor_website?: string;
  progress_percentage?: number;
  paid_amount?: number;
  payment_terms?: string;
  warranty_period?: number;
  estimated_duration?: number;
  start_date?: string;
  completion_date?: string;
  labor_cost?: number;
  material_cost?: number;
  overhead_cost?: number;
  risk_score?: number;
  price_deviation?: number;
  ai_recommendation?: string;
}

export interface CostPositionStatistics {
  total_cost_positions: number;
  total_amount: number;
  total_paid: number;
  total_remaining: number;
  average_risk_score: number;
  average_price_deviation: number;
  category_breakdown: {
    category: string;
    count: number;
    amount: number;
  }[];
  status_breakdown: {
    status: string;
    count: number;
    amount: number;
  }[];
}

export const costPositionService = {
  // Get all cost positions for a project
  getCostPositions: async (projectId: number, category?: string, status?: string): Promise<CostPosition[]> => {
    const params = new URLSearchParams();
    params.append('project_id', projectId.toString());
    if (category) params.append('category', category);
    if (status) params.append('status', status);
    
    const response = await api.get(`/cost-positions/?${params.toString()}`);
    return response.data;
  },

  // Get a specific cost position
  getCostPosition: async (costPositionId: number): Promise<CostPosition> => {
    const response = await api.get(`/cost-positions/${costPositionId}`);
    return response.data;
  },

  // Create a new cost position
  createCostPosition: async (costPosition: CostPositionCreate): Promise<CostPosition> => {
    const response = await api.post('/cost-positions/', costPosition);
    return response.data;
  },

  // Update a cost position
  updateCostPosition: async (costPositionId: number, costPosition: CostPositionUpdate): Promise<CostPosition> => {
    const response = await api.put(`/cost-positions/${costPositionId}`, costPosition);
    return response.data;
  },

  // Delete a cost position
  deleteCostPosition: async (costPositionId: number): Promise<void> => {
    await api.delete(`/cost-positions/${costPositionId}`);
  },

  // Get cost position statistics for a project
  getCostPositionStatistics: async (projectId: number): Promise<CostPositionStatistics> => {
    const response = await api.get(`/cost-positions/project/${projectId}/statistics`);
    return response.data;
  },

  // Update progress of a cost position
  updateProgress: async (costPositionId: number, progressPercentage: number): Promise<{ message: string; cost_position_id: number; progress_percentage: number }> => {
    const response = await api.post(`/cost-positions/${costPositionId}/progress`, null, {
      params: { progress_percentage: progressPercentage }
    });
    return response.data;
  },

  // Record a payment for a cost position
  recordPayment: async (costPositionId: number, paymentAmount: number): Promise<{ message: string; cost_position_id: number; payment_amount: number; total_paid: number }> => {
    const response = await api.post(`/cost-positions/${costPositionId}/payment`, null, {
      params: { payment_amount: paymentAmount }
    });
    return response.data;
  },

  // Get cost positions from accepted quotes
  getCostPositionsFromAcceptedQuotes: async (projectId: number): Promise<CostPosition[]> => {
    const params = new URLSearchParams();
    params.append('project_id', projectId.toString());
    params.append('accepted_quotes_only', 'true');
    
    const response = await api.get(`/cost-positions/?${params.toString()}`);
    return response.data;
  },

  // Get cost position statistics for accepted quotes only
  getCostPositionStatisticsAcceptedQuotesOnly: async (projectId: number): Promise<CostPositionStatistics> => {
    const response = await api.get(`/cost-positions/project/${projectId}/statistics?accepted_quotes_only=true`);
    return response.data;
  }
}; 