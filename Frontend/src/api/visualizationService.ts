// Schlanker Service für Visualize-Flows per Fetch (robust gegen Axios-Header-Probleme)

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

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('token')
  return {
    'Authorization': token ? `Bearer ${token}` : '',
  }
}

export async function listVisualizations(projectId: number, category?: VisualizationCategory): Promise<VisualizationItem[]> {
  try {
    const url = new URL('/api/v1/visualizations/', window.location.origin)
    url.searchParams.set('project_id', String(projectId))
    if (category) url.searchParams.set('category', category)
    
    // Benutzer-spezifische Filterung - nur eigene Dokumente anzeigen
    url.searchParams.set('user_only', 'true')
    
    const res = await fetch(url.toString(), { headers: { ...authHeaders() } })
    if (!res.ok) return []
    return await res.json()
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
    const res = await fetch('/api/v1/visualizations/upload-plan', {
      method: 'POST',
      headers: { ...authHeaders() },
      body: form,
    })
    return res.ok
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

      const response = await fetch('/api/v1/documents/smart-upload', {
        method: 'POST',
        headers: { ...authHeaders() },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        results.processed++;
        results.results.push({
          fileName: file.name,
          category: result.category,
          subcategory: result.subcategory,
          success: true
        });
      } else {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
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



