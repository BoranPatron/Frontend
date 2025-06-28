import api from './api';

function authHeader() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getQuotes(project_id?: number) {
  const params = project_id ? { project_id } : {};
  const res = await api.get('/quotes', { params, headers: authHeader() });
  return res.data;
}

export async function getQuote(id: number) {
  const res = await api.get(`/quotes/${id}`, { headers: authHeader() });
  return res.data;
}

export async function createQuote(data: any) {
  const res = await api.post('/quotes', data, { headers: authHeader() });
  return res.data;
}

export async function updateQuote(id: number, data: any) {
  const res = await api.put(`/quotes/${id}`, data, { headers: authHeader() });
  return res.data;
}

export async function deleteQuote(id: number) {
  await api.delete(`/quotes/${id}`, { headers: authHeader() });
}

export async function submitQuote(id: number) {
  const res = await api.post(`/quotes/${id}/submit`, {}, { headers: authHeader() });
  return res.data;
}

export async function acceptQuote(id: number) {
  const res = await api.post(`/quotes/${id}/accept`, {}, { headers: authHeader() });
  return res.data;
}

export async function analyzeQuote(id: number) {
  const res = await api.get(`/quotes/${id}/analysis`, { headers: authHeader() });
  return res.data;
}

export async function getQuoteStatistics(project_id: number) {
  const res = await api.get(`/quotes/project/${project_id}/statistics`, { headers: authHeader() });
  return res.data;
} 