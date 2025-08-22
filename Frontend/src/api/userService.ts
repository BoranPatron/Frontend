import api from './api';

export async function getMe() {
  const res = await api.get('/users/me');
  return res.data;
}

export async function updateMe(data: any) {
  const res = await api.put('/users/me', data);
  return res.data;
}

export async function deactivateMe() {
  await api.delete('/users/me');
}

export async function getUserProfile(user_id: number) {
  const res = await api.get(`/users/profile/${user_id}`);
  return res.data;
}

export async function updateCompanyInfo(companyData: { company_name: string; company_address: string; company_uid?: string }) {
  const res = await api.post('/auth/update-company-info', companyData);
  return res.data;
}

export async function searchUsers(q: string, user_type?: string) {
  const params = user_type ? { q, user_type } : { q };
  const res = await api.get('/users/search', { params });
  return res.data;
}

export async function getServiceProviders(region?: string) {
  const params = region ? { region } : {};
  const res = await api.get('/users/service-providers', { params });
  return res.data;
} 