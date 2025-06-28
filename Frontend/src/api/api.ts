import axios from 'axios';

// Dynamische API-URL basierend auf der aktuellen Host-URL
const getApiBaseUrl = () => {
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
});

export default api; 