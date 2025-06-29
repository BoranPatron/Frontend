import api from './api';

function authHeader() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getDocuments(project_id: number) {
  try {
    console.log('📋 Fetching documents for project:', project_id);
    const res = await api.get('/documents', { params: { project_id }, headers: authHeader() });
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

export async function getDocument(id: number) {
  try {
    console.log('📋 Fetching document:', id);
    const res = await api.get(`/documents/${id}`, { headers: authHeader() });
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
    
    const tags = formData.get('tags');
    if (tags) {
      uploadFormData.append('tags', tags.toString());
    }
    
    const category = formData.get('category');
    if (category) {
      uploadFormData.append('category', category.toString());
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
      tags: tags?.toString(),
      category: category?.toString(),
      is_public: is_public?.toString(),
      file: file instanceof File ? `${file.name} (${file.size} bytes)` : 'No file'
    });
    
    const res = await api.post('/documents/upload', uploadFormData, { 
      headers: { 
        ...authHeader(), 
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
      throw new Error('Datei ist zu groß. Maximale Größe: 10MB');
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
    const res = await api.put(`/documents/${id}`, data, { headers: authHeader() });
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
    await api.delete(`/documents/${id}`, { headers: authHeader() });
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