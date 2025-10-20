import api from './api';

export async function getQuotes(project_id?: number) {
  const params = project_id ? { project_id } : {};
  const response = await api.get('/api/v1/quotes/', { params });
  return response.data;
}

export async function getQuotesForMilestone(milestone_id: number) {
  console.log('🔍 getQuotesForMilestone: API-Aufruf für milestone_id:', milestone_id);
  try {
    const response = await api.get(`/api/v1/quotes/milestone/${milestone_id}`);
    console.log('🔍 getQuotesForMilestone: Response für milestone_id', milestone_id, ':', response.data);
    console.log('🔍 getQuotesForMilestone: Response Status:', response.status);
    console.log('🔍 getQuotesForMilestone: Response Headers:', response.headers);
    
    // Zusätzliche Debug-Info
    if (response.data && Array.isArray(response.data)) {
      console.log(`✅ getQuotesForMilestone: ${response.data.length} Angebote erhalten`);
      response.data.forEach((quote: any, index: number) => {
        console.log(`   Quote ${index + 1}: ID=${quote.id}, Status=${quote.status}, Amount=${quote.total_amount}`);
      });
    } else {
      console.warn('⚠️ getQuotesForMilestone: Keine oder ungültige Daten erhalten');
    }
    
    return response.data;
  } catch (error: any) {
    console.error('❌ getQuotesForMilestone: Fehler beim API-Aufruf:', error);
    console.error('   Error Response:', error.response?.data);
    console.error('   Error Status:', error.response?.status);
    throw error;
  }
}

export async function createMockQuotesForMilestone(milestone_id: number, project_id: number) {
  const response = await api.post(`/api/v1/quotes/milestone/${milestone_id}/mock?project_id=${project_id}`);
  return response.data;
}

export async function getQuote(id: number) {
  const response = await api.get(`/api/v1/quotes/${id}`);
  return response.data;
}

export interface QuoteData {
  title: string;
  description: string;
  project_id: number;
  milestone_id?: number;
  // service_provider_id wird vom Backend automatisch gesetzt
  total_amount: number;
  currency?: string;
  valid_until?: string;
  labor_cost?: number;
  material_cost?: number;
  overhead_cost?: number;
  estimated_duration?: number;
  start_date?: string;
  completion_date?: string;
  payment_terms?: string;
  warranty_period?: number;
  company_name?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  website?: string;
  // Neue Felder für erweiterte Angebote
  quote_number?: string;
  qualifications?: string;
  references?: string;
  certifications?: string;
  technical_approach?: string;
  quality_standards?: string;
  safety_measures?: string;
  environmental_compliance?: string;
  risk_assessment?: string;
  contingency_plan?: string;
  additional_notes?: string;
  // Revisions-Felder für überarbeitete Angebote
  revised_after_inspection?: boolean;
  revision_count?: number;
  last_revised_at?: string;
  is_revised_quote?: boolean;
}

export async function createQuote(data: QuoteData) {
  const response = await api.post('/api/v1/quotes/', data);
  
  // Event für Bautraeger-Benachrichtigung auslösen (sofort, ohne Backend-Abfrage)
  if (response.data && response.data.id) {
    console.log('📢 quoteService: Angebot erstellt, erstelle Event für Bautraeger...');
    
    // Erstelle Event mit verfügbaren Daten (ohne Backend-Abfrage)
    const event = new CustomEvent('quoteSubmittedForBautraeger', {
      detail: {
        trade: {
          id: data.milestone_id,
          title: 'Gewerk', // Fallback-Titel
          project_id: data.project_id
        },
        quote: response.data,
        tradeData: {
          id: data.milestone_id,
          title: 'Gewerk',
          project_id: data.project_id
        }
      }
    });
    
    console.log('📢 quoteService: Event-Objekt erstellt:', event);
    console.log('📢 quoteService: Event-Detail:', event.detail);
    
    window.dispatchEvent(event);
    
    // Zusätzlich: Speichere Benachrichtigung in localStorage für Bautraeger
    const notificationData = {
      id: `quote_${response.data.id}_${Date.now()}`,
      type: 'quote_submitted',
      title: 'Neues Angebot eingegangen! 📋',
      message: `Ein Dienstleister hat ein Angebot für "Gewerk" eingereicht.`,
      timestamp: new Date().toISOString(),
      tradeId: data.milestone_id,
      quoteId: response.data.id,
      projectId: data.project_id,
      quoteAmount: response.data.total_amount,
      quoteCurrency: response.data.currency
    };
    
    // Speichere in localStorage für Bautraeger
    const existingNotifications = JSON.parse(localStorage.getItem('pendingBautraegerNotifications') || '[]');
    existingNotifications.push(notificationData);
    localStorage.setItem('pendingBautraegerNotifications', JSON.stringify(existingNotifications));
    
    console.log('📢 quoteService: Benachrichtigung in localStorage gespeichert:', notificationData);
    console.log('📢 quoteService: quoteSubmittedForBautraeger Event AUSGELÖST!');
  }
  
  return response.data;
}

export async function updateQuote(id: number, data: Partial<QuoteData>) {
  const response = await api.put(`/api/v1/quotes/${id}`, data);
  return response.data;
}

export async function deleteQuote(id: number) {
  const response = await api.delete(`/api/v1/quotes/${id}`);
  return response.data;
}

export async function submitQuote(id: number) {
  const response = await api.post(`/api/v1/quotes/${id}/submit`);
  return response.data;
}

export async function acceptQuote(id: number) {
  const response = await api.post(`/api/v1/quotes/${id}/accept`);
  return response.data;
}

export async function rejectQuote(id: number, rejectionReason?: string) {
  const response = await api.post(`/api/v1/quotes/${id}/reject`, {
    rejection_reason: rejectionReason
  });
  return response.data;
}

export async function resetQuote(id: number) {
  const response = await api.post(`/api/v1/quotes/${id}/reset`);
  return response.data;
}

export async function withdrawQuote(id: number) {
  // Dienstleister können ihre Angebote zurückziehen (löschen)
  const response = await api.delete(`/api/v1/quotes/${id}`);
  return response.data;
}

export async function analyzeQuote(id: number) {
  const response = await api.get(`/api/v1/quotes/${id}/analysis`);
  return response.data;
}

export async function getQuoteStatistics(project_id: number) {
  const response = await api.get(`/api/v1/quotes/project/${project_id}/statistics`);
  return response.data;
}

export async function createQuoteWithPdf(formData: FormData) {
  // Erwartet: alle Angebotsdaten + 'pdf' als Datei im FormData
  const response = await api.post('/quotes/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
}

export async function reviseQuoteAfterInspection(quoteId: number, data: Partial<QuoteData>) {
  // Überarbeitet ein bestehendes Angebot nach Besichtigung
  const response = await api.put(`/api/v1/quotes/${quoteId}/revise-after-inspection`, data);
  return response.data;
}

// Export als Objekt für konsistente Nutzung
export const quoteService = {
  getQuotes,
  getQuotesForMilestone,
  createMockQuotesForMilestone,
  getQuote,
  createQuote,
  updateQuote,
  deleteQuote,
  submitQuote,
  acceptQuote,
  rejectQuote,
  resetQuote,
  withdrawQuote,
  analyzeQuote,
  getQuoteStatistics,
  createQuoteWithPdf,
  reviseQuoteAfterInspection
}; 