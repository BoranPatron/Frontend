import api, { safeApiCall } from './api';

export async function getProjects() {
  return safeApiCall(async () => {
    try {
      // WICHTIG: Trailing slash verwenden um 307-Redirect zu vermeiden
      // iOS Safari verliert Authorization-Header bei 307-Redirects
      const res = await api.get('/api/v1/projects/');
      return res.data;
    } catch (error: any) {
      // Spezielle Behandlung für Authentifizierungsfehler
      if (error.name === 'AuthenticationError' || error.response?.status === 401) {
        throw new Error('Bitte melden Sie sich an, um Projekte zu laden');
      }
      throw error;
    }
  });
}

export async function getProject(id: number) {
  try {
    const res = await api.get(`/api/v1/projects/${id}`);
    return res.data;
  } catch (error: any) {
    // Spezielle Behandlung für Authentifizierungsfehler
    if (error.name === 'AuthenticationError' || error.response?.status === 401) {
      throw new Error('Bitte melden Sie sich an, um Projekt-Details zu laden');
    }
    throw error;
  }
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
  // Neue Felder für Bauphasen
  construction_phase?: string;
  address_country?: string;
}

export async function createProject(data: ProjectData) {
  try {
    // WICHTIG: Trailing slash verwenden um 307-Redirect zu vermeiden
    const res = await api.post('/api/v1/projects/', data);
    return res.data;
  } catch (error: any) {
    // Spezielle Behandlung für Authentifizierungsfehler
    if (error.name === 'AuthenticationError' || error.response?.status === 401) {
      throw new Error('Bitte melden Sie sich an, um Projekte zu erstellen');
    }
    throw error;
  }
}

export async function updateProject(id: number, data: Partial<ProjectData>) {
  try {
    const res = await api.put(`/api/v1/projects/${id}`, data);
    return res.data;
  } catch (error: any) {
    // Spezielle Behandlung für Authentifizierungsfehler
    if (error.name === 'AuthenticationError' || error.response?.status === 401) {
      throw new Error('Bitte melden Sie sich an, um Projekte zu bearbeiten');
    }
    throw error;
  }
}

export async function deleteProject(id: number) {
  try {
    await api.delete(`/api/v1/projects/${id}`);
  } catch (error: any) {
    // Spezielle Behandlung für Authentifizierungsfehler
    if (error.name === 'AuthenticationError' || error.response?.status === 401) {
      throw new Error('Bitte melden Sie sich an, um Projekte zu löschen');
    }
    throw error;
  }
}

export async function getProjectDashboard(id: number) {
  try {
    const res = await api.get(`/api/v1/projects/${id}/dashboard`);
    return res.data;
  } catch (error: any) {
    // Spezielle Behandlung für Authentifizierungsfehler
    if (error.name === 'AuthenticationError' || error.response?.status === 401) {
      throw new Error('Bitte melden Sie sich an, um das Projekt-Dashboard zu laden');
    }
    throw error;
  }
} 
