import api from './api';

function authHeader() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getMe() {
  const res = await api.get('/users/me', { headers: authHeader() });
  return res.data;
}

export async function updateMe(data: any) {
  const res = await api.put('/users/me', data, { headers: authHeader() });
  return res.data;
}

export async function deactivateMe() {
  await api.delete('/users/me', { headers: authHeader() });
}

export async function getUserProfile(user_id: number) {
  const res = await api.get(`/users/profile/${user_id}`, { headers: authHeader() });
  return res.data;
}

export async function searchUsers(q: string, user_type?: string) {
  const params = user_type ? { q, user_type } : { q };
  const res = await api.get('/users/search', { params, headers: authHeader() });
  return res.data;
}

export async function getServiceProviders(region?: string) {
  const params = region ? { region } : {};
  const res = await api.get('/users/service-providers', { params, headers: authHeader() });
  return res.data;
} 