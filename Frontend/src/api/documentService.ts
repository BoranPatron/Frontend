import api from './api';

function authHeader() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getDocuments(project_id: number) {
  const res = await api.get('/documents', { params: { project_id }, headers: authHeader() });
  return res.data;
}

export async function getDocument(id: number) {
  const res = await api.get(`/documents/${id}`, { headers: authHeader() });
  return res.data;
}

export async function uploadDocument(formData: FormData) {
  const res = await api.post('/documents/upload', formData, { headers: { ...authHeader(), 'Content-Type': 'multipart/form-data' } });
  return res.data;
}

export async function updateDocument(id: number, data: any) {
  const res = await api.put(`/documents/${id}`, data, { headers: authHeader() });
  return res.data;
}

export async function deleteDocument(id: number) {
  await api.delete(`/documents/${id}`, { headers: authHeader() });
} 