import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1', // Passe ggf. die URL an
  withCredentials: false,
});

export default api; 