import api from './api';

function authHeader() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getTasks(project_id?: number) {
  const params = project_id ? { project_id } : {};
  const res = await api.get('/tasks', { params, headers: authHeader() });
  return res.data;
}

export async function getTask(id: number) {
  const res = await api.get(`/tasks/${id}`, { headers: authHeader() });
  return res.data;
}

export async function createTask(data: any) {
  const res = await api.post('/tasks', data, { headers: authHeader() });
  return res.data;
}

export async function updateTask(id: number, data: any) {
  const res = await api.put(`/tasks/${id}`, data, { headers: authHeader() });
  return res.data;
}

export async function deleteTask(id: number) {
  await api.delete(`/tasks/${id}`, { headers: authHeader() });
}

export async function getTaskStatistics(project_id: number) {
  const res = await api.get(`/tasks/project/${project_id}/statistics`, { headers: authHeader() });
  return res.data;
} 