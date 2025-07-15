import axios from 'axios';

// Dynamische API-URL basierend auf der aktuellen Host-URL
export const getApiBaseUrl = () => {
  // Prüfe zuerst Environment-Variable (für Render.com)
  const envApiUrl = import.meta.env.VITE_API_BASE_URL;
  if (envApiUrl) {
    console.log('🔧 API Base URL (Environment):', envApiUrl);
    return envApiUrl;
  }
  
  // Fallback: Lokale Entwicklung
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const baseUrl = 'http://localhost:8000/api/v1';
    console.log('🔧 API Base URL (Local):', baseUrl);
    return baseUrl;
  }
  
  // Für Render.com oder andere Produktionsumgebungen
  // Verwende die gleiche Domain wie das Frontend, aber mit Backend-Port/Path
  if (hostname.includes('onrender.com')) {
    // Für Render.com: Verwende die Backend-URL von Render.com
    const backendUrl = 'https://buildwise-backend.onrender.com/api/v1';
    console.log('🔧 API Base URL (Render.com):', backendUrl);
    return backendUrl;
  }
  
  // Für andere Produktionsumgebungen
  const baseUrl = `https://${hostname}/api/v1`;
  console.log('🔧 API Base URL (Production):', baseUrl);
  return baseUrl;
};

// Hilfsfunktion um auf AuthContext-Initialisierung zu warten
export const waitForAuth = async (maxWaitTime = 5000): Promise<boolean> => {
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitTime) {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      console.log('✅ AuthContext bereit - Token und User verfügbar');
      return true;
    }
    
    // Warte 100ms bevor nächster Check
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('⚠️ Timeout: AuthContext nicht bereit nach', maxWaitTime, 'ms');
  return false;
};

// Sichere API-Aufrufe mit AuthContext-Wartezeit
export const safeApiCall = async <T>(
  apiCall: () => Promise<T>,
  maxWaitTime = 5000
): Promise<T> => {
  const authReady = await waitForAuth(maxWaitTime);
  
  if (!authReady) {
    throw new Error('AuthContext nicht bereit - Token oder User fehlt');
  }
  
  return apiCall();
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: false,
  timeout: 15000, // Erhöht auf 15 Sekunden für bessere Stabilität
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

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
    console.log(`✅ API Response: ${response.status} ${response.config.url}`, response.data);
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
            console.log('🔄 Versuche Token-Refresh...');
            const response = await axios.post(`${getApiBaseUrl()}/auth/refresh`, {
              refresh_token: refreshToken
            });
            
            const newToken = response.data.access_token;
            localStorage.setItem('token', newToken);
            console.log('✅ Token erfolgreich erneuert');
            
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
          console.log('ℹ️ Kein Refresh-Token verfügbar - normal bei diesem Backend');
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
          // Verwende window.location.replace für bessere Navigation
          window.location.replace('/login?message=session_expired');
        }
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    // Andere Fehlerbehandlung
    if (error.response?.status === 401) {
      console.log('ℹ️ 401 Unauthorized - Token abgelaufen oder ungültig');
      // Bei 401-Fehlern nicht als kritischer Fehler behandeln
      return Promise.reject(error);
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

export default api; 