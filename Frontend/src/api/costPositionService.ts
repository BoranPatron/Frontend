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
  // Get all cost positions for a project (neuer Backend-Endpoint)
  getCostPositions: async (projectId: number, _category?: string, _status?: string): Promise<CostPosition[]> => {
    try {
      // Versuche zuerst echte Kostenpositionen zu laden
      const response = await api.get(`/cost-positions/project/${projectId}`);
      const costPositions = response.data || [];
      
      // Wenn keine Kostenpositionen vorhanden sind, lade angenommene Angebote
      if (costPositions.length === 0) {
        console.log('🔄 Keine Kostenpositionen gefunden, lade angenommene Angebote...');
        const quotesResponse = await api.get(`/quotes/?project_id=${projectId}`);
        const allQuotes = quotesResponse.data || [];
        
        // Filtere angenommene Angebote
        const acceptedQuotes = allQuotes.filter((quote: any) => quote.status === 'accepted');
        console.log(`✅ ${acceptedQuotes.length} angenommene Angebote gefunden`);
        
        // Konvertiere angenommene Angebote zu Kostenpositionen-Format
        return acceptedQuotes.map((quote: any) => ({
          id: quote.id,
          title: quote.title || 'Angebot ohne Titel',
          description: quote.description || '',
          amount: quote.total_amount || 0,
          currency: quote.currency || 'EUR',
          category: 'services', // Standard-Kategorie für Angebote
          cost_type: 'quote_accepted',
          status: 'active',
          contractor_name: quote.company_name,
          contractor_contact: quote.contact_person,
          contractor_phone: quote.phone,
          contractor_email: quote.email,
          contractor_website: quote.website,
          progress_percentage: 0,
          paid_amount: 0,
          payment_terms: quote.payment_terms,
          warranty_period: quote.warranty_period,
          estimated_duration: quote.estimated_duration,
          start_date: quote.start_date,
          completion_date: quote.completion_date,
          labor_cost: quote.labor_cost,
          material_cost: quote.material_cost,
          overhead_cost: quote.overhead_cost,
          risk_score: quote.risk_score,
          price_deviation: quote.price_deviation,
          ai_recommendation: quote.ai_recommendation,
          quote_id: quote.id,
          milestone_id: quote.milestone_id,
          project_id: projectId,
          service_provider_name: quote.company_name,
          milestone_title: quote.milestone_title || `Gewerk #${quote.milestone_id}`,
          created_at: quote.accepted_at || quote.created_at,
          updated_at: quote.updated_at
        }));
      }
      
      return costPositions;
    } catch (error) {
      console.error('❌ Fehler beim Laden der Kostenpositionen:', error);
      return [];
    }
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

  // Get cost positions from accepted quotes → lade angenommene Angebote als Kostenpositionen
  getCostPositionsFromAcceptedQuotes: async (projectId: number): Promise<CostPosition[]> => {
    try {
      // Versuche zuerst echte Kostenpositionen zu laden
      const response = await api.get(`/cost-positions/project/${projectId}`);
      const costPositions = response.data || [];
      
      // Wenn keine Kostenpositionen vorhanden sind, lade angenommene Angebote
      if (costPositions.length === 0) {
        console.log('🔄 Keine Kostenpositionen gefunden, lade angenommene Angebote...');
        const quotesResponse = await api.get(`/quotes/?project_id=${projectId}`);
        const allQuotes = quotesResponse.data || [];
        
        // Filtere angenommene Angebote
        const acceptedQuotes = allQuotes.filter((quote: any) => quote.status === 'accepted');
        console.log(`✅ ${acceptedQuotes.length} angenommene Angebote gefunden`);
        
        // Konvertiere angenommene Angebote zu Kostenpositionen-Format
        return acceptedQuotes.map((quote: any) => ({
          id: quote.id,
          title: quote.title || 'Angebot ohne Titel',
          description: quote.description || '',
          amount: quote.total_amount || 0,
          currency: quote.currency || 'EUR',
          category: 'services', // Standard-Kategorie für Angebote
          cost_type: 'quote_accepted',
          status: 'active',
          contractor_name: quote.company_name,
          contractor_contact: quote.contact_person,
          contractor_phone: quote.phone,
          contractor_email: quote.email,
          contractor_website: quote.website,
          progress_percentage: 0,
          paid_amount: 0,
          payment_terms: quote.payment_terms,
          warranty_period: quote.warranty_period,
          estimated_duration: quote.estimated_duration,
          start_date: quote.start_date,
          completion_date: quote.completion_date,
          labor_cost: quote.labor_cost,
          material_cost: quote.material_cost,
          overhead_cost: quote.overhead_cost,
          risk_score: quote.risk_score,
          price_deviation: quote.price_deviation,
          ai_recommendation: quote.ai_recommendation,
          quote_id: quote.id,
          milestone_id: quote.milestone_id,
          project_id: projectId,
          service_provider_name: quote.company_name,
          milestone_title: quote.milestone_title || `Gewerk #${quote.milestone_id}`,
          created_at: quote.accepted_at || quote.created_at,
          updated_at: quote.updated_at
        }));
      }
      
      return costPositions;
    } catch (error) {
      console.error('❌ Fehler beim Laden der Kostenpositionen:', error);
      return [];
    }
  },

  // Get cost position statistics for accepted quotes only
  getCostPositionStatisticsAcceptedQuotesOnly: async (projectId: number): Promise<CostPositionStatistics> => {
    const response = await api.get(`/cost-positions/project/${projectId}/statistics?accepted_quotes_only=true`);
    return response.data;
  }
}; 