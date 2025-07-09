import api from './api';

export async function getQuotes(project_id?: number) {
  const params = project_id ? { project_id } : {};
  const response = await api.get('/quotes/', { params });
  return response.data;
}

export async function getQuotesForMilestone(milestone_id: number) {
  const response = await api.get(`/quotes/milestone/${milestone_id}`);
  return response.data;
}

export async function createMockQuotesForMilestone(milestone_id: number, project_id: number) {
  const response = await api.post(`/quotes/milestone/${milestone_id}/mock?project_id=${project_id}`);
  return response.data;
}

export async function getQuote(id: number) {
  const response = await api.get(`/quotes/${id}`);
  return response.data;
}

interface QuoteData {
  title: string;
  description: string;
  project_id: number;
  milestone_id?: number;
  service_provider_id: number;
  total_amount: number;
  currency: string;
  valid_until: string;
  labor_cost: number;
  material_cost: number;
  overhead_cost: number;
  estimated_duration: number;
  start_date: string;
  completion_date: string;
  payment_terms: string;
  warranty_period: number;
  company_name?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  website?: string;
}

export async function createQuote(data: QuoteData) {
  const response = await api.post('/quotes/', data);
  return response.data;
}

export async function updateQuote(id: number, data: Partial<QuoteData>) {
  const response = await api.put(`/quotes/${id}`, data);
  return response.data;
}

export async function deleteQuote(id: number) {
  const response = await api.delete(`/quotes/${id}`);
  return response.data;
}

export async function submitQuote(id: number) {
  const response = await api.post(`/quotes/${id}/submit`);
  return response.data;
}

export async function acceptQuote(id: number) {
  const response = await api.post(`/quotes/${id}/accept`);
  return response.data;
}

export async function resetQuote(id: number) {
  const response = await api.post(`/quotes/${id}/reset`);
  return response.data;
}

export async function analyzeQuote(id: number) {
  const response = await api.get(`/quotes/${id}/analysis`);
  return response.data;
}

export async function getQuoteStatistics(project_id: number) {
  const response = await api.get(`/quotes/project/${project_id}/statistics`);
  return response.data;
} 