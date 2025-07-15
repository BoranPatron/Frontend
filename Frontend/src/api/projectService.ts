import api, { safeApiCall } from './api';

export async function getProjects() {
  return safeApiCall(async () => {
    const res = await api.get('/projects');
    return res.data;
  });
}

export async function getProject(id: number) {
  const res = await api.get(`/projects/${id}`);
  return res.data;
}

interface ProjectData {
  name: string;
  description: string;
  project_type: string;
  status: string;
  budget?: number;
  start_date?: string;
  end_date?: string;
  address?: string;
  property_size?: number;
  construction_area?: number;
  estimated_duration?: number;
  is_public: boolean;
  allow_quotes: boolean;
}

export async function createProject(data: ProjectData) {
  const res = await api.post('/projects', data);
  return res.data;
}

export async function updateProject(id: number, data: Partial<ProjectData>) {
  const res = await api.put(`/projects/${id}`, data);
  return res.data;
}

export async function deleteProject(id: number) {
  await api.delete(`/projects/${id}`);
}

export async function getProjectDashboard(id: number) {
  const res = await api.get(`/projects/${id}/dashboard`);
  return res.data;
} 