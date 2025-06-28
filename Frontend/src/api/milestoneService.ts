import api from './api';

function authHeader() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getMilestones(project_id: number) {
  const res = await api.get('/milestones', { params: { project_id }, headers: authHeader() });
  return res.data;
}

export async function getMilestone(id: number) {
  const res = await api.get(`/milestones/${id}`, { headers: authHeader() });
  return res.data;
}

export async function createMilestone(data: any) {
  const res = await api.post('/milestones', data, { headers: authHeader() });
  return res.data;
}

export async function updateMilestone(id: number, data: any) {
  const res = await api.put(`/milestones/${id}`, data, { headers: authHeader() });
  return res.data;
}

export async function deleteMilestone(id: number) {
  await api.delete(`/milestones/${id}`, { headers: authHeader() });
}

export async function getMilestoneStatistics(project_id: number) {
  const res = await api.get(`/milestones/project/${project_id}/statistics`, { headers: authHeader() });
  return res.data;
} 