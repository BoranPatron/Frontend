import api from './api';

function authHeader() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getMessages(project_id: number) {
  const res = await api.get(`/messages/project/${project_id}`, { headers: authHeader() });
  return res.data;
}

export async function getMessage(id: number) {
  const res = await api.get(`/messages/${id}`, { headers: authHeader() });
  return res.data;
}

export async function createMessage(data: any) {
  const res = await api.post('/messages', data, { headers: authHeader() });
  return res.data;
}

export async function updateMessage(id: number, data: any) {
  const res = await api.put(`/messages/${id}`, data, { headers: authHeader() });
  return res.data;
}

export async function deleteMessage(id: number) {
  await api.delete(`/messages/${id}`, { headers: authHeader() });
}

export async function markMessageRead(id: number) {
  await api.post(`/messages/${id}/read`, {}, { headers: authHeader() });
}

export async function getUnreadCount(project_id?: number) {
  const params = project_id ? { project_id } : {};
  const res = await api.get('/messages/unread/count', { params, headers: authHeader() });
  return res.data.unread_count;
} 