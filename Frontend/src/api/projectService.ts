import { getApiBaseUrl } from './api';

function authHeader(): Record<string, string> {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getProjects() {
  const response = await fetch(`${getApiBaseUrl()}/projects/`, {
    headers: { ...authHeader(), 'Content-Type': 'application/json' }
  });
  return response.json();
}

export async function getProject(id: number) {
  const response = await fetch(`${getApiBaseUrl()}/projects/${id}`, {
    headers: { ...authHeader(), 'Content-Type': 'application/json' }
  });
  return response.json();
}

export async function createProject(data: any) {
  const response = await fetch(`${getApiBaseUrl()}/projects/`, {
    method: 'POST',
    headers: { ...authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return response.json();
}

export async function updateProject(id: number, data: any) {
  const response = await fetch(`${getApiBaseUrl()}/projects/${id}`, {
    method: 'PUT',
    headers: { ...authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return response.json();
}

export async function setProjectPhase(id: number, phase: string) {
  const response = await fetch(`${getApiBaseUrl()}/projects/${id}/phase`, {
    method: 'POST',
    headers: { ...authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ phase })
  });
  return response.json();
}

export async function deleteProject(id: number) {
  const response = await fetch(`${getApiBaseUrl()}/projects/${id}`, {
    method: 'DELETE',
    headers: authHeader()
  });
  return response.ok;
}

export async function getProjectDashboard(id: number) {
  const response = await fetch(`${getApiBaseUrl()}/projects/${id}/dashboard`, {
    headers: { ...authHeader(), 'Content-Type': 'application/json' }
  });
  return response.json();
} 