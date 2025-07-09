import api from './api';

export async function getMessages(project_id: number) {
  const res = await api.get(`/messages/project/${project_id}`);
  return res.data;
}

export async function getMessage(id: number) {
  const res = await api.get(`/messages/${id}`);
  return res.data;
}

export async function createMessage(data: any) {
  const res = await api.post('/messages', data);
  return res.data;
}

export async function updateMessage(id: number, data: any) {
  const res = await api.put(`/messages/${id}`, data);
  return res.data;
}

export async function deleteMessage(id: number) {
  await api.delete(`/messages/${id}`);
}

export async function markMessageRead(id: number) {
  await api.post(`/messages/${id}/read`, {});
}

export async function getUnreadCount(project_id?: number) {
  const params = project_id ? { project_id } : {};
  const res = await api.get('/messages/unread/count', { params });
  return res.data.unread_count;
} 