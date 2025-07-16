import api, { safeApiCall } from './api';

export async function getProjects() {
  return safeApiCall(async () => {
    try {
      const res = await api.get('/projects');
      return res.data;
    } catch (error: any) {
      // Spezielle Behandlung für Authentifizierungsfehler
      if (error.name === 'AuthenticationError' || error.response?.status === 401) {
        console.log('🔐 Authentifizierung erforderlich für Projekte');
        throw new Error('Bitte melden Sie sich an, um Projekte zu laden');
      }
      throw error;
    }
  });
}

export async function getProject(id: number) {
  try {
    const res = await api.get(`/projects/${id}`);
    return res.data;
  } catch (error: any) {
    // Spezielle Behandlung für Authentifizierungsfehler
    if (error.name === 'AuthenticationError' || error.response?.status === 401) {
      console.log('🔐 Authentifizierung erforderlich für Projekt-Details');
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
}

export async function createProject(data: ProjectData) {
  try {
    const res = await api.post('/projects', data);
    return res.data;
  } catch (error: any) {
    // Spezielle Behandlung für Authentifizierungsfehler
    if (error.name === 'AuthenticationError' || error.response?.status === 401) {
      console.log('🔐 Authentifizierung erforderlich für Projekt-Erstellung');
      throw new Error('Bitte melden Sie sich an, um Projekte zu erstellen');
    }
    throw error;
  }
}

export async function updateProject(id: number, data: Partial<ProjectData>) {
  try {
    const res = await api.put(`/projects/${id}`, data);
    return res.data;
  } catch (error: any) {
    // Spezielle Behandlung für Authentifizierungsfehler
    if (error.name === 'AuthenticationError' || error.response?.status === 401) {
      console.log('🔐 Authentifizierung erforderlich für Projekt-Updates');
      throw new Error('Bitte melden Sie sich an, um Projekte zu bearbeiten');
    }
    throw error;
  }
}

export async function deleteProject(id: number) {
  try {
    await api.delete(`/projects/${id}`);
  } catch (error: any) {
    // Spezielle Behandlung für Authentifizierungsfehler
    if (error.name === 'AuthenticationError' || error.response?.status === 401) {
      console.log('🔐 Authentifizierung erforderlich für Projekt-Löschung');
      throw new Error('Bitte melden Sie sich an, um Projekte zu löschen');
    }
    throw error;
  }
}

export async function getProjectDashboard(id: number) {
  try {
    const res = await api.get(`/projects/${id}/dashboard`);
    return res.data;
  } catch (error: any) {
    // Spezielle Behandlung für Authentifizierungsfehler
    if (error.name === 'AuthenticationError' || error.response?.status === 401) {
      console.log('🔐 Authentifizierung erforderlich für Projekt-Dashboard');
      throw new Error('Bitte melden Sie sich an, um das Projekt-Dashboard zu laden');
    }
    throw error;
  }
} 