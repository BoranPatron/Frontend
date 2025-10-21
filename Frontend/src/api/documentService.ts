import api from './api';

// DMS Interfaces
export interface DocumentSearchParams {
  project_id: number;
  category?: string;
  subcategory?: string;
  document_type?: string;
  status_filter?: string;
  is_favorite?: boolean;
  search?: string;
  sort_by?: 'title' | 'created_at' | 'file_size' | 'accessed_at';
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
  service_provider_documents?: boolean;
  milestone_id?: number;
  quote_status_filter?: 'accepted' | 'own' | 'all'; // Neu: Filter für Quote-Status
}

export interface Milestone {
  id: number;
  title: string;
  description?: string;
  status: string;
  category?: string;
  planned_date?: string;
  created_at?: string;
}

export interface CategoryStats {
  [category: string]: {
    total_documents: number;
    total_size: number;
    favorite_count: number;
    subcategories: {
      [subcategory: string]: {
        document_count: number;
        total_size: number;
        avg_size: number;
        favorite_count: number;
      };
    };
  };
}

export async function getDocuments(project_id: number, params?: Partial<DocumentSearchParams>) {
  try {
    const searchParams = {
      project_id,
      ...params
    };
    
    // Für Dienstleister-Dokumente: Verwende speziellen Endpunkt
    if (params?.service_provider_documents) {
      // Verwende speziellen Service-Provider-Endpunkt
      console.log('🔍 Service Provider Request:', {
        url: '/documents/sp/documents',
        params: {},
        originalParams: params
      });
      
      const res = await api.get('/api/v1/documents/sp/documents');
      console.log('🔍 Service Provider Response:', {
        status: res.status,
        dataLength: res.data?.length || 0,
        data: res.data,
        headers: res.headers
      });
      return res.data;
    }
    
    const res = await api.get('/api/v1/documents/', { params: searchParams });
    return res.data;
  } catch (error: any) {
    console.error('❌ Error fetching documents:', error);
    console.error('Error details:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      url: error.config?.url,
      method: error.config?.method
    });
    
    // Detaillierte Fehlerbehandlung für 422-Fehler
    if (error.response?.status === 422) {
      const details = error.response?.data?.detail;
      if (Array.isArray(details) && details.length > 0) {
        console.error('Validation errors:', details);
        throw new Error(`Validierungsfehler: ${details.map(d => d.msg || d).join(', ')}`);
      } else if (typeof details === 'string') {
        throw new Error(`Validierungsfehler: ${details}`);
      }
    }
    
    throw new Error(error.response?.data?.detail || error.message || 'Fehler beim Laden der Dokumente');
  }
}

export async function searchDocumentsFulltext(query: string, project_id?: number, category?: string, limit: number = 50) {
  try {
    const params: any = { q: query, limit };
    if (project_id) params.project_id = project_id;
    if (category) params.category = category;
    
    const res = await api.get('/api/v1/documents/search/fulltext', { params });
    return res.data;
  } catch (error: any) {
    console.error('❌ Error in full-text search:', error);
    throw new Error(error.response?.data?.detail || error.message || 'Fehler bei der Volltextsuche');
  }
}

export async function toggleDocumentFavorite(documentId: number) {
  try {
    const res = await api.post(`/api/v1/documents/${documentId}/favorite`);
    return res.data;
  } catch (error: any) {
    console.error('❌ Error toggling favorite:', error);
    throw new Error(error.response?.data?.detail || error.message || 'Fehler beim Favoriten-Update');
  }
}

export async function updateDocumentStatus(documentId: number, newStatus: string) {
  try {
    const res = await api.put(`/api/v1/documents/${documentId}/status`, null, {
      params: { new_status: newStatus }
    });
    return res.data;
  } catch (error: any) {
    console.error('❌ Error updating status:', error);
    throw new Error(error.response?.data?.detail || error.message || 'Fehler beim Status-Update');
  }
}

export async function getCategoryStatistics(project_id?: number, service_provider_documents?: boolean, quote_status_filter?: 'accepted' | 'own' | 'all'): Promise<CategoryStats> {
  try {
    const params = project_id ? { project_id } : {};
    
    // Für Dienstleister-Dokumente: Verwende speziellen Endpunkt
    if (service_provider_documents) {
      // Verwende speziellen Service-Provider-Endpunkt
      console.log('🔍 Service Provider Stats Request:', {
        url: '/documents/sp/stats',
        params: {},
        originalParams: { project_id, service_provider_documents, quote_status_filter }
      });
      
      const res = await api.get('/api/v1/documents/sp/stats');
      return res.data;
    }
    
    const res = await api.get('/api/v1/documents/categories/stats', { params });
    return res.data;
  } catch (error: any) {
    console.error('❌ Error fetching category statistics:', error);
    throw new Error(error.response?.data?.detail || error.message || 'Fehler beim Laden der Statistiken');
  }
}

export async function trackDocumentAccess(documentId: number) {
  try {
    const res = await api.get(`/api/v1/documents/${documentId}/access`);
    return res.data;
  } catch (error: any) {
    console.error('❌ Error tracking access:', error);
    // Don't throw error for tracking - it's not critical
    return null;
  }
}

export async function getRecentDocuments(project_id?: number, limit: number = 10) {
  try {
    const params: any = { limit };
    if (project_id) params.project_id = project_id;
    
    const res = await api.get('/api/v1/documents/recent', { params });
    return res.data;
  } catch (error: any) {
    console.error('❌ Error fetching recent documents:', error);
    throw new Error(error.response?.data?.detail || error.message || 'Fehler beim Laden der letzten Dokumente');
  }
}

export async function getDocument(id: number) {
  try {
    const res = await api.get(`/api/v1/documents/${id}`);
    
    // Track access when viewing document
    trackDocumentAccess(id);
    
    return res.data;
  } catch (error: any) {
    console.error('❌ Error fetching document:', error);
    console.error('Error details:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    throw new Error(error.response?.data?.detail || error.message || 'Fehler beim Laden des Dokuments');
  }
}

export async function deleteDocumentForServiceProvider(documentId: number) {
  try {
    console.log(`🗑️ Deleting document ${documentId} for service provider...`);
    
    const res = await api.delete(`/api/v1/documents/sp/documents/${documentId}`);
    
    console.log('✅ Document deleted successfully:', res.data);
    return res.data;
  } catch (error: any) {
    console.error('❌ Error deleting document:', error);
    console.error('Error details:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    throw new Error(error.response?.data?.detail || error.message || 'Fehler beim Löschen des Dokuments');
  }
}

export async function uploadDocument(formData: FormData) {
  try {
    // Validiere erforderliche Felder
    const title = formData.get('title');
    const project_id = formData.get('project_id');
    const file = formData.get('file');
    
    if (!title || !title.toString().trim()) {
      throw new Error('Dokumententitel ist erforderlich');
    }
    
    
    if (!file || (file instanceof File && file.size === 0)) {
      throw new Error('Datei ist erforderlich');
    }
    
    // Bereite FormData für API vor
    const uploadFormData = new FormData();
    
    // Datei hinzufügen
    if (file instanceof File) {
      uploadFormData.append('file', file);
    }
    
    // Andere Felder als Form-Parameter hinzufügen
    uploadFormData.append('project_id', project_id.toString());
    uploadFormData.append('title', title.toString());
    
    // Optionale Felder
    const description = formData.get('description');
    if (description) {
      uploadFormData.append('description', description.toString());
    }
    
    const document_type = formData.get('document_type');
    if (document_type) {
      uploadFormData.append('document_type', document_type.toString());
    }
    
    const category = formData.get('category');
    if (category) {
      uploadFormData.append('category', category.toString());
    }
    
    const subcategory = formData.get('subcategory');
    if (subcategory) {
      uploadFormData.append('subcategory', subcategory.toString());
    }
    
    const tags = formData.get('tags');
    if (tags) {
      uploadFormData.append('tags', tags.toString());
    }
    
    const is_public = formData.get('is_public');
    if (is_public !== null) {
      uploadFormData.append('is_public', is_public.toString());
    }
    
    console.log('📤 Sending document data to API:', {
      project_id: project_id.toString(),
      title: title.toString(),
      description: description?.toString(),
      document_type: document_type?.toString(),
      category: category?.toString(),
      subcategory: subcategory?.toString(),
      tags: tags?.toString(),
      is_public: is_public?.toString(),
      file: file instanceof File ? `${file.name} (${file.size} bytes)` : 'No file'
    });
    
    const res = await api.post('/api/v1/documents/upload', uploadFormData, { 
      headers: { 
        'Content-Type': 'multipart/form-data' 
      } 
    });
    
    return res.data;
  } catch (error: any) {
    console.error('❌ Error uploading document:', error);
    console.error('Error details:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      config: error.config
    });
    
    // Spezifische Fehlermeldungen
    if (error.response?.status === 422) {
      const validationErrors = error.response.data?.detail;
      if (Array.isArray(validationErrors)) {
        const errorMessages = validationErrors.map((err: any) => 
          `${err.loc?.join('.')}: ${err.msg}`
        ).join(', ');
        throw new Error(`Validierungsfehler: ${errorMessages}`);
      } else if (typeof validationErrors === 'string') {
        throw new Error(`Validierungsfehler: ${validationErrors}`);
      } else {
        throw new Error('Ungültige Daten für das Dokument. Bitte überprüfen Sie alle Felder.');
      }
    } else if (error.response?.status === 401) {
      throw new Error('Nicht autorisiert. Bitte melden Sie sich erneut an.');
    } else if (error.response?.status === 413) {
      throw new Error('Datei ist zu groß. Maximale Größe: 50MB');
    } else if (error.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    } else {
      throw new Error(error.message || 'Fehler beim Hochladen des Dokuments');
    }
  }
}

export async function updateDocument(id: number, data: any) {
  try {
    const res = await api.put(`/api/v1/documents/${id}`, data);
    return res.data;
  } catch (error: any) {
    console.error('❌ Error updating document:', error);
    console.error('Error details:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    throw new Error(error.response?.data?.detail || error.message || 'Fehler beim Aktualisieren des Dokuments');
  }
}

export async function deleteDocument(id: number) {
  try {
    await api.delete(`/api/v1/documents/${id}`);
    } catch (error: any) {
    console.error('❌ Error deleting document:', error);
    console.error('Error details:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    throw new Error(error.response?.data?.detail || error.message || 'Fehler beim Löschen des Dokuments');
  }
}

export async function downloadDocument(id: number) {
  try {
    // Track access when downloading
    trackDocumentAccess(id);
    
    const res = await api.get(`/api/v1/documents/${id}/download`, {
      responseType: 'blob'
    });
    
    return res.data;
  } catch (error: any) {
    console.error('❌ Error downloading document:', error);
    throw new Error(error.response?.data?.detail || error.message || 'Fehler beim Herunterladen des Dokuments');
  }
}

export async function getProjectMilestones(project_id: number): Promise<Milestone[]> {
  try {
    const res = await api.get(`/api/v1/documents/project/${project_id}/milestones`);
    return res.data;
  } catch (error) {
    console.error('Error fetching project milestones:', error);
    throw error;
  }
}
