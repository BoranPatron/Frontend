// Service für Visualize-Flows mit Axios für konsistente API-Kommunikation

import api from './api';

export type VisualizationCategory = 'interior' | 'exterior' | 'individual'

export interface VisualizationItem {
  id: number
  project_id: number
  category: VisualizationCategory
  title?: string
  description?: string
  plan_url?: string
  result_url?: string
  status?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED'
  created_at?: string
  uploaded_at?: string
  uploader_id?: number
  uploader_name?: string
  uploader_email?: string
}

export async function listVisualizations(projectId: number, category?: VisualizationCategory): Promise<VisualizationItem[]> {
  try {
    const params: any = { 
      project_id: projectId, 
      user_only: 'true' 
    };
    if (category) params.category = category;
    
    const response = await api.get('/api/v1/visualizations/', { params });
    return response.data || [];
  } catch {
    return []
  }
}

export async function uploadPlan(projectId: number, category: VisualizationCategory, file: File, title?: string, description?: string): Promise<boolean> {
  const form = new FormData()
  form.append('project_id', String(projectId))
  form.append('category', category)
  form.append('file', file)
  if (title) form.append('title', title)
  if (description) form.append('description', description)
  
  // Zeitstempel hinzufügen
  form.append('uploaded_at', new Date().toISOString())
  
  // Benutzer-ID aus dem Token extrahieren oder aus localStorage
  const token = localStorage.getItem('token')
  if (token) {
    try {
      // JWT Token dekodieren um Benutzer-ID zu erhalten
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (payload.user_id || payload.sub) {
        form.append('uploader_id', String(payload.user_id || payload.sub))
      }
    } catch (e) {
      console.warn('Token konnte nicht dekodiert werden:', e)
    }
  }

  try {
    await api.post('/api/v1/visualizations/upload-plan', form);
    return true;
  } catch {
    return false
  }
}

export function buildDriveFolderUrl(): string {
  return 'https://drive.google.com/drive/folders/1dgjIm0Jtl0cBIWCHBOK9yTUnq0J_tq1L?usp=sharing'
}

export function buildDriveCategoryFolderUrl(category: VisualizationCategory): string {
  const interior = (import.meta as any).env?.VITE_DRIVE_FOLDER_INTERIOR as string | undefined
  const exterior = (import.meta as any).env?.VITE_DRIVE_FOLDER_EXTERIOR as string | undefined
  const individual = (import.meta as any).env?.VITE_DRIVE_FOLDER_INDIVIDUAL as string | undefined

  const map: Record<VisualizationCategory, string | undefined> = {
    interior,
    exterior,
    individual,
  }

  const folderId = map[category]
  if (!folderId) return buildDriveFolderUrl()
  return `https://drive.google.com/drive/folders/${folderId}?usp=sharing`
}

// Smart Upload: Automatische Kategorisierung und DMS-Upload
export async function smartUploadDocuments(projectId: number, files: File[]): Promise<{
  success: boolean;
  processed: number;
  failed: number;
  results: Array<{
    fileName: string;
    category?: string;
    subcategory?: string;
    success: boolean;
    error?: string;
  }>;
}> {
  const results = {
    success: true,
    processed: 0,
    failed: 0,
    results: [] as Array<{
      fileName: string;
      category?: string;
      subcategory?: string;
      success: boolean;
      error?: string;
    }>
  };

  for (const file of files) {
    try {
      const formData = new FormData();
      formData.append('project_id', String(projectId));
      formData.append('file', file);
      formData.append('title', file.name.replace(/\.[^/.]+$/, ""));
      formData.append('smart_categorize', 'true'); // Flag für automatische Kategorisierung
      
      // Zeitstempel hinzufügen
      formData.append('uploaded_at', new Date().toISOString());
      
      // Benutzer-ID aus dem Token extrahieren
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload.user_id || payload.sub) {
            formData.append('uploader_id', String(payload.user_id || payload.sub));
          }
        } catch (e) {
          console.warn('Token konnte nicht dekodiert werden:', e);
        }
      }

      const response = await api.post('/api/v1/documents/smart-upload', formData);
      
      results.processed++;
      results.results.push({
        fileName: file.name,
        category: response.data.category,
        subcategory: response.data.subcategory,
        success: true
      });
    } catch (error) {
      results.failed++;
      results.success = false;
      results.results.push({
        fileName: file.name,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return results;
}



