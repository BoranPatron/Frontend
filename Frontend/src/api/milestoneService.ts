import api from './api';

/**
 * Robuste Implementierung für Milestone-Service mit Fallback-Mechanismen
 */

export async function getMilestones(project_id: number) {
  console.log(`🔍 [ROBUST] getMilestones aufgerufen für project_id: ${project_id}`);
  
  try {
    // Schritt 1: Validiere Eingabe
    if (!project_id || project_id <= 0) {
      console.error(`❌ [ROBUST] Ungültige project_id: ${project_id}`);
      throw new Error('Ungültige Projekt-ID');
    }

    // Schritt 2: Versuche primären Endpoint
    try {
      console.log(`📡 [ROBUST] Versuche primären Endpoint: /api/v1/milestones/?project_id=${project_id}`);
      const response = await api.get('/api/v1/milestones/', { params: { project_id } });
      
      if (response.data && Array.isArray(response.data)) {
        console.log(`✅ [ROBUST] Primärer Endpoint erfolgreich: ${response.data.length} Milestones erhalten`);
        return response.data;
      } else {
        console.warn(`⚠️ [ROBUST] Primärer Endpoint gab ungültige Daten zurück:`, response.data);
        throw new Error('Ungültige Antwort vom primären Endpoint');
      }
    } catch (primaryError: any) {
      console.warn(`⚠️ [ROBUST] Primärer Endpoint fehlgeschlagen:`, primaryError.message);
      
      // Schritt 3: Fallback auf /milestones/all mit clientseitiger Filterung
      try {
        console.log(`🔄 [ROBUST] Versuche Fallback-Endpoint: /api/v1/milestones/all`);
        const fallbackResponse = await api.get('/api/v1/milestones/all');
        
        if (fallbackResponse.data && Array.isArray(fallbackResponse.data)) {
          // Filtere clientseitig nach project_id
          const filteredMilestones = fallbackResponse.data.filter((milestone: any) => 
            milestone.project_id === project_id
          );
          
          console.log(`✅ [ROBUST] Fallback erfolgreich: ${filteredMilestones.length} Milestones für Projekt ${project_id} gefiltert`);
          return filteredMilestones;
        } else {
          console.warn(`⚠️ [ROBUST] Fallback-Endpoint gab ungültige Daten zurück:`, fallbackResponse.data);
          throw new Error('Ungültige Antwort vom Fallback-Endpoint');
        }
      } catch (fallbackError: any) {
        console.error(`❌ [ROBUST] Auch Fallback-Endpoint fehlgeschlagen:`, fallbackError.message);
        
        // Schritt 4: Letzter Fallback - leere Liste
        console.log(`🔄 [ROBUST] Verwende letzten Fallback: leere Liste`);
        return [];
      }
    }
  } catch (error: any) {
    console.error(`❌ [ROBUST] Unerwarteter Fehler in getMilestones:`, error);
    
    // Gebe leere Liste zurück statt Fehler zu werfen
    console.log(`🔄 [ROBUST] Gebe leere Liste zurück als letzter Fallback`);
    return [];
  }
}

export async function getAllMilestones() {
  console.log(`🔍 [ROBUST] getAllMilestones aufgerufen`);
  
  try {
    const res = await api.get('/api/v1/milestones/all');
    
    if (res.data && Array.isArray(res.data)) {
      console.log(`✅ [ROBUST] getAllMilestones erfolgreich: ${res.data.length} Milestones erhalten`);
      return res.data;
    } else {
      console.warn(`⚠️ [ROBUST] getAllMilestones gab ungültige Daten zurück:`, res.data);
      return [];
    }
  } catch (error: any) {
    console.error(`❌ [ROBUST] Fehler in getAllMilestones:`, error);
    return [];
  }
}

export async function getMilestone(id: number) {
  console.log(`🔍 [ROBUST] getMilestone aufgerufen für id: ${id}`);
  
  try {
    if (!id || id <= 0) {
      throw new Error('Ungültige Milestone-ID');
    }

    const res = await api.get(`/api/v1/milestones/${id}`);
    
    if (res.data) {
      console.log(`✅ [ROBUST] getMilestone erfolgreich für ID ${id}`);
      return res.data;
    } else {
      console.warn(`⚠️ [ROBUST] getMilestone gab keine Daten zurück für ID ${id}`);
      return null;
    }
  } catch (error: any) {
    console.error(`❌ [ROBUST] Fehler in getMilestone für ID ${id}:`, error);
    return null;
  }
}

interface MilestoneData {
  title: string;
  description: string;
  project_id: number;
  status: string;
  priority: string;
  planned_date: string;
  submission_deadline?: string; // Angebotsfrist (optional)
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
  const res = await api.post('/api/v1/milestones', data);
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
  formData.append('submission_deadline', data.submission_deadline || '');
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
  
  const res = await api.post('/api/v1/milestones/with-documents', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
}

export async function updateMilestone(id: number, data: Partial<MilestoneData>) {
  const res = await api.put(`/api/v1/milestones/${id}`, data);
  return res.data;
}

export async function deleteMilestone(id: number) {
  await api.delete(`/api/v1/milestones/${id}`);
}

export async function getMilestoneStatistics(project_id: number) {
  const res = await api.get(`/api/v1/milestones/project/${project_id}/statistics`);
  return res.data;
} 