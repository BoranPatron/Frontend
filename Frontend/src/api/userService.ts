import api from './api';

export async function getMe() {
  const res = await api.get('/api/v1/users/me');
  return res.data;
}

export async function updateMe(data: any) {
  const res = await api.put('/api/v1/users/me', data);
  return res.data;
}

export async function deactivateMe() {
  await api.delete('/api/v1/users/me');
}

export async function getUserProfile(user_id: number) {
  const res = await api.get(`/api/v1/users/profile/${user_id}`);
  return res.data;
}

export async function getUserCompanyLogo(user_id: number) {
  const res = await api.get(`/api/v1/users/${user_id}/company-logo`);
  return res.data;
}

export async function uploadCompanyLogo(file: File): Promise<{ file_path: string }> {
  const formData = new FormData();
  formData.append('file', file);
  
  const res = await api.post('/api/v1/auth/upload-company-logo', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
}

export async function updateCompanyInfo(companyData: { 
  company_name: string; 
  company_address: string; 
  company_uid?: string;
  company_logo?: string;
  company_logo_advertising_consent?: boolean;
}): Promise<{
  message: string;
  company_name: string;
  company_address: string;
  company_uid?: string;
  show_welcome_notification?: boolean;
  welcome_credits?: number;
}> {
  const res = await api.post('/api/v1/auth/update-company-info', companyData);
  return res.data;
}

export async function searchUsers(q: string, user_type?: string) {
  const params = user_type ? { q, user_type } : { q };
  const res = await api.get('/api/v1/users/search', { params });
  return res.data;
}

export async function getServiceProviders(region?: string) {
  const params = region ? { region } : {};
  const res = await api.get('/api/v1/users/service-providers', { params });
  return res.data;
} 