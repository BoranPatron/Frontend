import api from './api';

export async function getMessages(project_id: number) {
  const res = await api.get(`/api/v1/messages/project/${project_id}`);
  return res.data;
}

export async function getMessage(id: number) {
  const res = await api.get(`/api/v1/messages/${id}`);
  return res.data;
}

export async function createMessage(data: any) {
  const res = await api.post('/api/v1/messages', data);
  return res.data;
}

export async function updateMessage(id: number, data: any) {
  const res = await api.put(`/api/v1/messages/${id}`, data);
  return res.data;
}

export async function deleteMessage(id: number) {
  await api.delete(`/api/v1/messages/${id}`);
}

export async function markMessageRead(id: number) {
  await api.post(`/api/v1/messages/${id}/read`, {});
}

export async function getUnreadCount(project_id?: number) {
  const params = project_id ? { project_id } : {};
  const res = await api.get('/api/v1/messages/unread/count', { params });
  return res.data.unread_count;
} 