import api from './api';

function authHeader() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getProjects() {
  const res = await api.get('/projects', { headers: authHeader() });
  return res.data;
}

export async function getProject(id: number) {
  const res = await api.get(`/projects/${id}`, { headers: authHeader() });
  return res.data;
}

export async function createProject(data: any) {
  const res = await api.post('/projects', data, { headers: authHeader() });
  return res.data;
}

export async function updateProject(id: number, data: any) {
  const res = await api.put(`/projects/${id}`, data, { headers: authHeader() });
  return res.data;
}

export async function deleteProject(id: number) {
  await api.delete(`/projects/${id}`, { headers: authHeader() });
}

export async function getProjectDashboard(id: number) {
  const res = await api.get(`/projects/${id}/dashboard`, { headers: authHeader() });
  return res.data;
} 