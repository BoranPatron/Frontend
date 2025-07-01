import axios from 'axios';

// Dynamische API-URL basierend auf der aktuellen Host-URL
export const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  // Wenn localhost, verwende localhost für Backend
  // Ansonsten verwende die gleiche IP-Adresse wie das Frontend
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:8000/api/v1';
  }
  // Für Netzwerk-Zugriff verwende die gleiche IP wie das Frontend
  return `http://${hostname}:8000/api/v1`;
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: false,
  timeout: 10000, // 10 Sekunden Timeout
});

// Request Interceptor für Logging und Authentication
api.interceptors.request.use(
  (config) => {
    // Token aus localStorage hinzufügen
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, config.data);
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response Interceptor für bessere Fehlerbehandlung
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    console.error('❌ Response Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      data: error.response?.data,
      message: error.message
    });
    
    // Spezifische Fehlerbehandlung
    if (error.response?.status === 401) {
      console.error('🔐 Unauthorized - Token möglicherweise abgelaufen');
      // Token aus localStorage entfernen
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Zur Login-Seite weiterleiten
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default api; 