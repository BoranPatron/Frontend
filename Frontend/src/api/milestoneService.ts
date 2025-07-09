import api from './api';

export async function getMilestones(project_id: number) {
  const res = await api.get('/milestones', { params: { project_id } });
  return res.data;
}

export async function getAllMilestones() {
  const res = await api.get('/milestones/all');
  return res.data;
}

export async function getMilestone(id: number) {
  const res = await api.get(`/milestones/${id}`);
  return res.data;
}

interface MilestoneData {
  title: string;
  description: string;
  project_id: number;
  status: string;
  priority: string;
  planned_date: string;
  start_date?: string;
  end_date?: string;
  category?: string;
  budget?: number;
  contractor?: string;
  is_critical: boolean;
  notify_on_completion: boolean;
  notes?: string;
}

export async function createMilestone(data: MilestoneData) {
  const res = await api.post('/milestones', data);
  return res.data;
}

export async function updateMilestone(id: number, data: Partial<MilestoneData>) {
  const res = await api.put(`/milestones/${id}`, data);
  return res.data;
}

export async function deleteMilestone(id: number) {
  await api.delete(`/milestones/${id}`);
}

export async function getMilestoneStatistics(project_id: number) {
  const res = await api.get(`/milestones/project/${project_id}/statistics`);
  return res.data;
} 