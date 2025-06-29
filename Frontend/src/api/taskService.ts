import api from './api';

function authHeader() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getTasks(project_id?: number) {
  try {
    console.log('📋 Fetching tasks...', { project_id });
    const params = project_id ? { project_id } : {};
    const res = await api.get('/tasks', { params, headers: authHeader() });
    console.log('✅ Tasks loaded successfully:', res.data);
    return res.data;
  } catch (error: any) {
    console.error('❌ Error fetching tasks:', error);
    console.error('Error details:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    throw new Error(error.response?.data?.detail || error.message || 'Fehler beim Laden der Aufgaben');
  }
}

export async function getTask(id: number) {
  try {
    console.log('📋 Fetching task:', id);
    const res = await api.get(`/tasks/${id}`, { headers: authHeader() });
    console.log('✅ Task loaded successfully:', res.data);
    return res.data;
  } catch (error: any) {
    console.error('❌ Error fetching task:', error);
    console.error('Error details:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    throw new Error(error.response?.data?.detail || error.message || 'Fehler beim Laden der Aufgabe');
  }
}

export async function createTask(data: any) {
  try {
    console.log('🚀 Creating task with data:', data);
    
    // Validiere erforderliche Felder
    if (!data.title) {
      throw new Error('Aufgabentitel ist erforderlich');
    }
    if (!data.project_id) {
      throw new Error('Projekt-ID ist erforderlich');
    }
    
    // Bereite Daten für API vor
    const taskData = {
      title: data.title,
      description: data.description || '',
      status: data.status || 'todo',
      priority: data.priority || 'medium',
      project_id: parseInt(data.project_id),
      assigned_to: data.assigned_to ? parseInt(data.assigned_to) : null,
      due_date: data.due_date || null,
      estimated_hours: data.estimated_hours ? parseInt(data.estimated_hours) : null,
      is_milestone: data.is_milestone || false
    };
    
    console.log('📤 Sending task data to API:', taskData);
    const res = await api.post('/tasks', taskData, { headers: authHeader() });
    console.log('✅ Task created successfully:', res.data);
    return res.data;
  } catch (error: any) {
    console.error('❌ Error creating task:', error);
    console.error('Error details:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      config: error.config
    });
    
    // Spezifische Fehlermeldungen
    if (error.response?.status === 422) {
      throw new Error('Ungültige Daten für die Aufgabe. Bitte überprüfen Sie alle Felder.');
    } else if (error.response?.status === 401) {
      throw new Error('Nicht autorisiert. Bitte melden Sie sich erneut an.');
    } else if (error.response?.status === 404) {
      throw new Error('Projekt nicht gefunden.');
    } else if (error.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    } else {
      throw new Error(error.message || 'Fehler beim Erstellen der Aufgabe');
    }
  }
}

export async function updateTask(id: number, data: any) {
  try {
    console.log('🔄 Updating task:', id, 'with data:', data);
    const res = await api.put(`/tasks/${id}`, data, { headers: authHeader() });
    console.log('✅ Task updated successfully:', res.data);
    return res.data;
  } catch (error: any) {
    console.error('❌ Error updating task:', error);
    console.error('Error details:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    throw new Error(error.response?.data?.detail || error.message || 'Fehler beim Aktualisieren der Aufgabe');
  }
}

export async function deleteTask(id: number) {
  try {
    console.log('🗑️ Deleting task:', id);
    await api.delete(`/tasks/${id}`, { headers: authHeader() });
    console.log('✅ Task deleted successfully');
  } catch (error: any) {
    console.error('❌ Error deleting task:', error);
    console.error('Error details:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    throw new Error(error.response?.data?.detail || error.message || 'Fehler beim Löschen der Aufgabe');
  }
}

export async function getTaskStatistics(project_id: number) {
  try {
    console.log('📊 Fetching task statistics for project:', project_id);
    const res = await api.get(`/tasks/project/${project_id}/statistics`, { headers: authHeader() });
    console.log('✅ Task statistics loaded successfully:', res.data);
    return res.data;
  } catch (error: any) {
    console.error('❌ Error fetching task statistics:', error);
    console.error('Error details:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    throw new Error(error.response?.data?.detail || error.message || 'Fehler beim Laden der Statistiken');
  }
} 