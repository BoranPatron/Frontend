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

export async function createMilestoneWithDocuments(data: MilestoneData & { 
  documents?: File[]; 
  requires_inspection?: boolean;
  document_ids?: number[];
  shared_document_ids?: number[];
  resource_allocations?: any[];
}) {
  const formData = new FormData();
  
  // Füge alle Felder als FormData hinzu
  formData.append('title', data.title);
  formData.append('description', data.description);
  formData.append('category', data.category || '');
  formData.append('priority', data.priority);
  formData.append('planned_date', data.planned_date);
  formData.append('notes', data.notes || '');
  formData.append('requires_inspection', String(data.requires_inspection || false));
  formData.append('project_id', String(data.project_id));
  
  // Füge Dokument-IDs hinzu
  if (data.document_ids && data.document_ids.length > 0) {
    formData.append('document_ids', JSON.stringify(data.document_ids));
  }
  
  // Füge geteilte Dokument-IDs hinzu
  if (data.shared_document_ids && data.shared_document_ids.length > 0) {
    formData.append('shared_document_ids', JSON.stringify(data.shared_document_ids));
  }
  
  // Füge Ressourcen-Zuordnungen hinzu
  if (data.resource_allocations && data.resource_allocations.length > 0) {
    formData.append('resource_allocations', JSON.stringify(data.resource_allocations));
  }
  
  // Füge Dokumente hinzu
  if (data.documents && data.documents.length > 0) {
    data.documents.forEach((file) => {
      formData.append('documents', file);
    });
  }
  
  const res = await api.post('/milestones/with-documents', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
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