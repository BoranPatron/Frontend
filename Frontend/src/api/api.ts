import axios from 'axios';
import { cacheManager, withCache } from '../utils/cacheManager';

// Dynamische API-URL basierend auf Environment und Host
export const getApiBaseUrl = () => {
  // 1. Check for environment variable (Vite uses VITE_ prefix)
  const envApiUrl = import.meta.env.VITE_API_URL;
  if (envApiUrl) {
    console.log('🌍 Using API URL from environment:', envApiUrl);
    return envApiUrl;
  }
  
  // 2. Production detection (Render.com or custom domain)
  const hostname = window.location.hostname;
  const isProduction = hostname.includes('onrender.com') || 
                       (!hostname.includes('localhost') && !hostname.includes('127.0.0.1'));
  
  if (isProduction) {
    // Production: try to construct API URL from hostname
    if (hostname.includes('onrender.com')) {
      // Render: replace frontend subdomain with api subdomain
      const apiUrl = `https://buildwise-api.onrender.com`;
      console.log('🚀 Production mode (Render):', apiUrl);
      return apiUrl;
    } else {
      // Custom domain: assume API is on same domain with /api path
      const apiUrl = `${window.location.protocol}//${hostname}`;
      console.log('🚀 Production mode (Custom domain):', apiUrl);
      return apiUrl;
    }
  }
  
  // 3. Development fallback
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const baseUrl = 'http://localhost:8000';
    console.log('💻 Development mode (localhost):', baseUrl);
    return baseUrl;
  }
  
  // 4. Local network (mobile testing)
  const baseUrl = `http://${hostname}:8000`;
  console.log('📱 Local network mode:', baseUrl);
  return baseUrl;
};

// Hilfsfunktion um auf AuthContext-Initialisierung zu warten
export const waitForAuth = async (maxWaitTime = 5000): Promise<boolean> => {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitTime) {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      return true;
    }
    
    // Warte 100ms bevor nächster Check
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return false;
};

// Sichere API-Aufrufe mit AuthContext-Wartezeit
export const safeApiCall = async <T>(
  apiCall: () => Promise<T>,
  maxWaitTime = 10000 // Erhöht auf 10 Sekunden für OAuth-Login-Situationen
): Promise<T> => {
  const authReady = await waitForAuth(maxWaitTime);
  
  if (!authReady) {
    console.log('⚠️ AuthContext nicht bereit - versuche API-Call trotzdem (für OAuth-Login)');
    
    // Bei OAuth-Login kann es sein, dass der AuthContext noch nicht bereit ist
    // Versuche den API-Call trotzdem, falls Token im localStorage vorhanden ist
    const token = localStorage.getItem('token');
    if (token) {
      return apiCall();
    }
    
    throw new Error('AuthContext nicht bereit - Token oder User fehlt');
  }
  
  return apiCall();
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: false,
  timeout: 30000, // Erhöht auf 30 Sekunden für komplexe Operationen wie Terminerstellung
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Spezielle Funktion für authentifizierte Datei-URLs
export const getAuthenticatedFileUrl = (filePath: string): string => {
  const baseUrl = getApiBaseUrl();
  const token = localStorage.getItem('token');
  
  // Entferne führende Slashes und "storage/" aus dem Pfad
  const cleanPath = filePath.replace(/^\/+/, '').replace(/^storage\//, '');
  
  if (!token) {
    console.error('❌ Kein Token verfügbar für Datei-Zugriff');
    return '#';
  }
  
  // Verwende den documents/content Endpoint mit Token als Query-Parameter
  const documentId = extractDocumentIdFromPath(cleanPath);
  if (documentId) {
    const contentUrl = `${baseUrl}/api/v1/documents/${documentId}/content?token=${encodeURIComponent(token)}`;
    return contentUrl;
  }
  
  // Fallback: Verwende files/serve mit Token als Query-Parameter
  const serveUrl = `${baseUrl}/files/serve/${cleanPath}?token=${encodeURIComponent(token)}`;
  return serveUrl;
};

// Hilfsfunktion um Document-ID aus Pfad zu extrahieren
const extractDocumentIdFromPath = (filePath: string): string | null => {
  // Versuche Document-ID aus Pfad zu extrahieren
  // Beispiel: "uploads/project_7/document_123.pdf" -> "123"
  const match = filePath.match(/document_(\d+)/);
  if (match) {
    return match[1];
  }
  
  // Alternative: Versuche ID aus Dateinamen zu extrahieren
  const filenameMatch = filePath.match(/(\d+)\.(pdf|doc|docx|txt)$/);
  if (filenameMatch) {
    return filenameMatch[1];
  }
  
  return null;
};

// Token-Refresh-Mechanismus
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
};

// Error Handler für API-Fehler
export const handleApiError = (error: any): Error => {
  if (error.response) {
    // Server hat mit einem Fehlercode geantwortet
    const message = error.response.data?.detail || 
                    error.response.data?.message || 
                    `Fehler ${error.response.status}: ${error.response.statusText}`;
    return new Error(message);
  } else if (error.request) {
    // Anfrage wurde gesendet, aber keine Antwort erhalten
    return new Error('Keine Antwort vom Server erhalten');
  } else {
    // Ein Fehler beim Aufbau der Anfrage
    return new Error(error.message || 'Ein unbekannter Fehler ist aufgetreten');
  }
};

// Request Interceptor für Logging und Token-Handling
api.interceptors.request.use(
  (config) => {
    // Token automatisch hinzufügen (außer bei Login-Endpunkten)
    const token = localStorage.getItem('token');
    if (token && !config.url?.includes('/auth/login')) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`🔑 Token hinzugefügt für: ${config.method?.toUpperCase()} ${config.url}`);
    } else if (!config.url?.includes('/auth/login')) {
      console.log(`⚠️ Kein Token verfügbar für: ${config.method?.toUpperCase()} ${config.url}`);
      
      // Für kritische Endpunkte wie quotes, prüfe ob Token wirklich fehlt
      if (config.url?.includes('/quotes/') && config.method === 'POST') {
        console.error('❌ KRITISCH: Kein Token für Angebotserstellung verfügbar!');
      }
    }
    
    // Spezielle Behandlung für FormData
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
    }
    
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, config.data);
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response Interceptor für bessere Fehlerbehandlung und Token-Refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    console.error('❌ Response Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      data: error.response?.data,
      message: error.message
    });
    
    // Token-Refresh bei 401 Fehlern (außer bei Login-Anfragen)
    if (error.response?.status === 401 && 
        !originalRequest._retry && 
        !error.config?.url?.includes('/auth/login') &&
        !error.config?.url?.includes('/auth/refresh')) {
      
      if (isRefreshing) {
        // Warte auf laufenden Refresh
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Prüfe ob Refresh-Token verfügbar ist
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          try {
            const response = await axios.post(`${getApiBaseUrl()}/api/v1/auth/refresh`, {
              refresh_token: refreshToken
            });
            
            const newToken = response.data.access_token;
            localStorage.setItem('token', newToken);
            processQueue(null, newToken);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            
            return api(originalRequest);
          } catch (refreshRequestError) {
            console.error('🔐 Token-Refresh Request fehlgeschlagen:', refreshRequestError);
            // Refresh-Token ist ungültig, entferne ihn
            localStorage.removeItem('refreshToken');
            throw new Error('Refresh token is invalid');
          }
        } else {
          // Kein Refresh-Token verfügbar - das ist normal bei diesem Backend
          // Behandle dies nicht als Fehler, sondern als normalen 401
          processQueue(null, null);
          return Promise.reject(error);
        }
      } catch (refreshError) {
        console.error('🔐 Token-Refresh fehlgeschlagen:', refreshError);
        processQueue(refreshError, null);
        
        // Token aus localStorage entfernen
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        
        // Benutzerfreundliche Weiterleitung zur Login-Seite
        if (!window.location.pathname.includes('/login')) {
          const currentPath = window.location.pathname + window.location.search;
          localStorage.setItem('redirectAfterLogin', currentPath);
          window.location.href = '/login?message=session_expired';
        }
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    // Andere Fehlerbehandlung
    if (error.response?.status === 401) {
      // Token aus localStorage entfernen
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      // Benutzerfreundliche Weiterleitung zur Login-Seite
      if (!window.location.pathname.includes('/login')) {
        const currentPath = window.location.pathname + window.location.search;
        localStorage.setItem('redirectAfterLogin', currentPath);
        window.location.href = '/login?message=session_expired';
      }
      
      // Bei 401-Fehlern nicht als kritischer Fehler behandeln, sondern als normale Authentifizierungsaufforderung
      const authError = new Error('Authentication required');
      authError.name = 'AuthenticationError';
      (authError as any).response = error.response;
      return Promise.reject(authError);
    } else if (error.response?.status === 403) {
      console.error('🚫 Forbidden - Keine Berechtigung');
    } else if (error.response?.status === 404) {
      console.error('🔍 Not Found - Endpunkt nicht gefunden');
    } else if (error.response?.status >= 500) {
      console.error('💥 Server Error - Backend-Problem');
    }
    
    return Promise.reject(error);
  }
);

// Helper function for API calls with proper typing
export const apiCall = async <T = any>(url: string, options?: any): Promise<T> => {
  // Convert body to data for Axios, but not for FormData
  if (options?.body && !(options.body instanceof FormData)) {
    options.data = options.body;
    delete options.body;
  } else if (options?.body instanceof FormData) {
    // For FormData, keep as is but rename body to data
    options.data = options.body;
    delete options.body;
    
    // Wichtig: Bei FormData KEINE Content-Type Header setzen!
    // Axios soll das automatisch mit Boundary machen
    if (options.headers) {
      delete options.headers['Content-Type'];
    }
    
    // Debug: Zeige FormData-Inhalt
    for (let [key, value] of options.data.entries()) {
      }
    
    // Wichtig: Bei FormData auch Accept-Header entfernen
    if (options.headers) {
      delete options.headers['Accept'];
    }
  }
  
  const response = await api({
    url,
    ...options
  });
  return response.data;
};

export { api };
export default api; 
