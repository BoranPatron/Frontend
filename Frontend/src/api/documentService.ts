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
    console.log('📋 Fetching documents for project:', project_id, 'with params:', params);
    
    const searchParams = {
      project_id,
      ...params
    };
    
    const res = await api.get('/documents', { params: searchParams });
    console.log('✅ Documents loaded successfully:', res.data);
    return res.data;
  } catch (error: any) {
    console.error('❌ Error fetching documents:', error);
    console.error('Error details:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    throw new Error(error.response?.data?.detail || error.message || 'Fehler beim Laden der Dokumente');
  }
}

export async function searchDocumentsFulltext(query: string, project_id?: number, category?: string, limit: number = 50) {
  try {
    console.log('🔍 Full-text search for:', query, 'in project:', project_id);
    
    const params: any = { q: query, limit };
    if (project_id) params.project_id = project_id;
    if (category) params.category = category;
    
    const res = await api.get('/documents/search/fulltext', { params });
    console.log('✅ Full-text search completed:', res.data);
    return res.data;
  } catch (error: any) {
    console.error('❌ Error in full-text search:', error);
    throw new Error(error.response?.data?.detail || error.message || 'Fehler bei der Volltextsuche');
  }
}

export async function toggleDocumentFavorite(documentId: number) {
  try {
    console.log('⭐ Toggling favorite for document:', documentId);
    const res = await api.post(`/documents/${documentId}/favorite`);
    console.log('✅ Favorite toggled successfully:', res.data);
    return res.data;
  } catch (error: any) {
    console.error('❌ Error toggling favorite:', error);
    throw new Error(error.response?.data?.detail || error.message || 'Fehler beim Favoriten-Update');
  }
}

export async function updateDocumentStatus(documentId: number, newStatus: string) {
  try {
    console.log('📝 Updating document status:', documentId, 'to:', newStatus);
    const res = await api.put(`/documents/${documentId}/status`, null, {
      params: { new_status: newStatus }
    });
    console.log('✅ Status updated successfully:', res.data);
    return res.data;
  } catch (error: any) {
    console.error('❌ Error updating status:', error);
    throw new Error(error.response?.data?.detail || error.message || 'Fehler beim Status-Update');
  }
}

export async function getCategoryStatistics(project_id?: number): Promise<CategoryStats> {
  try {
    console.log('📊 Fetching category statistics for project:', project_id);
    
    const params = project_id ? { project_id } : {};
    const res = await api.get('/documents/categories/stats', { params });
    console.log('✅ Category statistics loaded:', res.data);
    return res.data;
  } catch (error: any) {
    console.error('❌ Error fetching category statistics:', error);
    throw new Error(error.response?.data?.detail || error.message || 'Fehler beim Laden der Statistiken');
  }
}

export async function trackDocumentAccess(documentId: number) {
  try {
    console.log('📈 Tracking access for document:', documentId);
    const res = await api.get(`/documents/${documentId}/access`);
    console.log('✅ Access tracked successfully:', res.data);
    return res.data;
  } catch (error: any) {
    console.error('❌ Error tracking access:', error);
    // Don't throw error for tracking - it's not critical
    return null;
  }
}

export async function getRecentDocuments(project_id?: number, limit: number = 10) {
  try {
    console.log('🕒 Fetching recent documents for project:', project_id);
    
    const params: any = { limit };
    if (project_id) params.project_id = project_id;
    
    const res = await api.get('/documents/recent', { params });
    console.log('✅ Recent documents loaded:', res.data);
    return res.data;
  } catch (error: any) {
    console.error('❌ Error fetching recent documents:', error);
    throw new Error(error.response?.data?.detail || error.message || 'Fehler beim Laden der letzten Dokumente');
  }
}

export async function getDocument(id: number) {
  try {
    console.log('📋 Fetching document:', id);
    const res = await api.get(`/documents/${id}`);
    
    // Track access when viewing document
    trackDocumentAccess(id);
    
    console.log('✅ Document loaded successfully:', res.data);
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

export async function uploadDocument(formData: FormData) {
  try {
    console.log('🚀 Uploading document with formData:', formData);
    
    // Validiere erforderliche Felder
    const title = formData.get('title');
    const project_id = formData.get('project_id');
    const file = formData.get('file');
    
    if (!title || !title.toString().trim()) {
      throw new Error('Dokumententitel ist erforderlich');
    }
    
    if (!project_id) {
      throw new Error('Projekt-ID ist erforderlich');
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
    
    const res = await api.post('/documents/upload', uploadFormData, { 
      headers: { 
        'Content-Type': 'multipart/form-data' 
      } 
    });
    
    console.log('✅ Document uploaded successfully:', res.data);
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
    console.log('🔄 Updating document:', id, 'with data:', data);
    const res = await api.put(`/documents/${id}`, data);
    console.log('✅ Document updated successfully:', res.data);
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
    console.log('🗑️ Deleting document:', id);
    await api.delete(`/documents/${id}`);
    console.log('✅ Document deleted successfully');
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
    console.log('⬇️ Downloading document:', id);
    
    // Track access when downloading
    trackDocumentAccess(id);
    
    const res = await api.get(`/documents/${id}/download`, {
      responseType: 'blob'
    });
    
    console.log('✅ Document downloaded successfully');
    return res.data;
  } catch (error: any) {
    console.error('❌ Error downloading document:', error);
    throw new Error(error.response?.data?.detail || error.message || 'Fehler beim Herunterladen des Dokuments');
  }
} 