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
  // Get all cost positions for a project (lädt echte Kostenpositionen aus der Datenbank)
  getCostPositions: async (projectId: number, _category?: string, _status?: string): Promise<CostPosition[]> => {
    try {
      console.log(`🔄 Lade echte Kostenpositionen für Projekt ${projectId}...`);
      
      // Lade echte Kostenpositionen aus der Datenbank
      const response = await api.get(`/api/v1/cost-positions/project/${projectId}`);
      const costPositions = response.data || [];
      
      console.log(`✅ ${costPositions.length} echte Kostenpositionen geladen`);
      
      // Debug: Zeige Details der Kostenpositionen
      console.log('📋 Details der Kostenpositionen:', costPositions.map(cp => ({
        id: cp.id,
        title: cp.title,
        amount: cp.amount,
        contractor_name: cp.contractor_name,
        category: cp.category,
        quote_id: cp.quote_id,
        milestone_id: cp.milestone_id
      })));
      
      return costPositions;
      
    } catch (error) {
      console.error('❌ Fehler beim Laden der Kostenpositionen:', error);
      return [];
    }
  },

  // Get a specific cost position
  getCostPosition: async (costPositionId: number): Promise<CostPosition> => {
    const response = await api.get(`/api/v1/cost-positions/${costPositionId}`);
    return response.data;
  },

  // Create a new cost position
  createCostPosition: async (costPosition: CostPositionCreate): Promise<CostPosition> => {
    const response = await api.post('/api/v1/cost-positions/', costPosition);
    return response.data;
  },

  // Update a cost position
  updateCostPosition: async (costPositionId: number, costPosition: CostPositionUpdate): Promise<CostPosition> => {
    const response = await api.put(`/api/v1/cost-positions/${costPositionId}`, costPosition);
    return response.data;
  },

  // Delete a cost position
  deleteCostPosition: async (costPositionId: number): Promise<void> => {
    await api.delete(`/api/v1/cost-positions/${costPositionId}`);
  },

  // Get cost position statistics for a project
  getCostPositionStatistics: async (projectId: number): Promise<CostPositionStatistics> => {
    const response = await api.get(`/api/v1/cost-positions/project/${projectId}/statistics`);
    return response.data;
  },

  // Update progress of a cost position
  updateProgress: async (costPositionId: number, progressPercentage: number): Promise<{ message: string; cost_position_id: number; progress_percentage: number }> => {
    const response = await api.post(`/api/v1/cost-positions/${costPositionId}/progress`, null, {
      params: { progress_percentage: progressPercentage }
    });
    return response.data;
  },

  // Record a payment for a cost position
  recordPayment: async (costPositionId: number, paymentAmount: number): Promise<{ message: string; cost_position_id: number; payment_amount: number; total_paid: number }> => {
    const response = await api.post(`/api/v1/cost-positions/${costPositionId}/payment`, null, {
      params: { payment_amount: paymentAmount }
    });
    return response.data;
  },

  // Get cost positions from accepted quotes → lade angenommene Angebote als Kostenpositionen
  getCostPositionsFromAcceptedQuotes: async (projectId: number): Promise<CostPosition[]> => {
    // Diese Funktion ist jetzt identisch mit getCostPositions
    return costPositionService.getCostPositions(projectId);
  },

  // Get cost position statistics for accepted quotes only
  getCostPositionStatisticsAcceptedQuotesOnly: async (projectId: number): Promise<CostPositionStatistics> => {
    const response = await api.get(`/cost-positions/project/${projectId}/statistics?accepted_quotes_only=true`);
    return response.data;
  }
}; 