import api from './api';

// Canvas-Objekte Typen
export interface CanvasObject {
  id: number;
  object_id: string;
  canvas_id: number;
  type: 'sticky' | 'rectangle' | 'circle' | 'line' | 'text' | 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  content?: string;
  color: string;
  font_size?: number;
  font_family?: string;
  image_url?: string;
  points?: { x: number; y: number }[];
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface CollaborationArea {
  id: number;
  area_id: string;
  canvas_id: number;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  assigned_users: number[];
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface Canvas {
  id: number;
  project_id: number;
  name: string;
  description?: string;
  viewport_x: number;
  viewport_y: number;
  viewport_scale: number;
  created_by: number;
  created_at: string;
  updated_at: string;
  objects: CanvasObject[];
  areas: CollaborationArea[];
}

export interface CanvasState {
  objects: CanvasObject[];
  areas: CollaborationArea[];
  viewport: {
    x: number;
    y: number;
    scale: number;
  };
}

export interface CanvasObjectCreate {
  type: 'sticky' | 'rectangle' | 'circle' | 'line' | 'text' | 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  content?: string;
  color?: string;
  font_size?: number;
  font_family?: string;
  image_url?: string;
  points?: { x: number; y: number }[];
}

export interface CanvasObjectUpdate {
  type?: 'sticky' | 'rectangle' | 'circle' | 'line' | 'text' | 'image';
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  content?: string;
  color?: string;
  font_size?: number;
  font_family?: string;
  image_url?: string;
  points?: { x: number; y: number }[];
}

export interface CollaborationAreaCreate {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  assigned_users?: number[];
}

export interface CollaborationAreaUpdate {
  name?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  color?: string;
  assigned_users?: number[];
}

export interface CanvasExportRequest {
  format: 'png' | 'pdf';
  area: 'full' | 'selected';
  area_id?: string;
  export_type: 'download' | 'docs';
}

export interface CanvasExportResponse {
  success: boolean;
  message: string;
  file_url?: string;
  document_id?: number;
}

export interface UserCursor {
  user_id: number;
  user_name: string;
  cursor_x: number;
  cursor_y: number;
}

export interface ActiveUsersResponse {
  users: UserCursor[];
  total: number;
}

export interface CanvasStatistics {
  total_objects: number;
  total_areas: number;
  active_users: number;
  last_activity: string;
  canvas_size: {
    min_x: number;
    max_x: number;
    min_y: number;
    max_y: number;
  };
}

// Canvas Service
export class CanvasService {
  private static instance: CanvasService;
  private wsConnections: Map<number, WebSocket> = new Map();

  private constructor() {}

  static getInstance(): CanvasService {
    if (!CanvasService.instance) {
      CanvasService.instance = new CanvasService();
    }
    return CanvasService.instance;
  }

  // Canvas CRUD
  async getCanvas(projectId: number): Promise<Canvas> {
    const response = await api.get(`/canvas/${projectId}`);
    return response.data;
  }

  async createCanvas(projectId: number, canvasData: any): Promise<Canvas> {
    const response = await api.post(`/canvas/${projectId}`, canvasData);
    return response.data;
  }

  async updateCanvas(canvasId: number, canvasData: any): Promise<Canvas> {
    const response = await api.put(`/canvas/${canvasId}`, canvasData);
    return response.data;
  }

  async deleteCanvas(canvasId: number): Promise<void> {
    await api.delete(`/canvas/${canvasId}`);
  }

  // Canvas State Management
  async saveCanvasState(canvasId: number, state: CanvasState): Promise<void> {
    await api.post(`/canvas/${canvasId}/save`, state);
  }

  async loadCanvasState(canvasId: number): Promise<CanvasState> {
    const response = await api.get(`/canvas/${canvasId}/load`);
    return response.data;
  }

  // Canvas Objects
  async createCanvasObject(canvasId: number, objectData: CanvasObjectCreate): Promise<CanvasObject> {
    const response = await api.post(`/canvas/${canvasId}/objects`, objectData);
    return response.data;
  }

  async updateCanvasObject(objectId: string, objectData: CanvasObjectUpdate): Promise<CanvasObject> {
    const response = await api.put(`/canvas/objects/${objectId}`, objectData);
    return response.data;
  }

  async deleteCanvasObject(objectId: string): Promise<void> {
    await api.delete(`/canvas/objects/${objectId}`);
  }

  // Collaboration Areas
  async createCollaborationArea(canvasId: number, areaData: CollaborationAreaCreate): Promise<CollaborationArea> {
    const response = await api.post(`/canvas/${canvasId}/areas`, areaData);
    return response.data;
  }

  async updateCollaborationArea(areaId: string, areaData: CollaborationAreaUpdate): Promise<CollaborationArea> {
    const response = await api.put(`/canvas/areas/${areaId}`, areaData);
    return response.data;
  }

  async deleteCollaborationArea(areaId: string): Promise<void> {
    await api.delete(`/canvas/areas/${areaId}`);
  }

  async assignUserToArea(areaId: string, userId: number): Promise<void> {
    await api.post(`/canvas/areas/${areaId}/assign/${userId}`);
  }

  async removeUserFromArea(areaId: string, userId: number): Promise<void> {
    await api.delete(`/canvas/areas/${areaId}/assign/${userId}`);
  }

  // Active Users
  async getActiveUsers(canvasId: number): Promise<ActiveUsersResponse> {
    const response = await api.get(`/canvas/${canvasId}/active-users`);
    return response.data;
  }

  // Export
  async exportCanvas(canvasId: number, exportRequest: CanvasExportRequest): Promise<CanvasExportResponse> {
    const response = await api.post(`/canvas/${canvasId}/export`, exportRequest);
    return response.data;
  }

  // Statistics
  async getCanvasStatistics(canvasId: number): Promise<CanvasStatistics> {
    const response = await api.get(`/canvas/${canvasId}/statistics`);
    return response.data;
  }

  // WebSocket Connection
  connectWebSocket(canvasId: number, onMessage: (data: any) => void): WebSocket {
    const token = localStorage.getItem('token');
    const wsUrl = `${window.location.origin.replace('http', 'ws')}/api/v1/canvas/ws/${canvasId}?token=${token}`;
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('WebSocket connected for canvas:', canvasId);
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    ws.onclose = () => {
      console.log('WebSocket disconnected for canvas:', canvasId);
      this.wsConnections.delete(canvasId);
    };
    
    this.wsConnections.set(canvasId, ws);
    return ws;
  }

  disconnectWebSocket(canvasId: number): void {
    const ws = this.wsConnections.get(canvasId);
    if (ws) {
      ws.close();
      this.wsConnections.delete(canvasId);
    }
  }

  sendWebSocketMessage(canvasId: number, message: any): void {
    const ws = this.wsConnections.get(canvasId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  // Cursor Movement
  sendCursorMove(canvasId: number, sessionId: string, x: number, y: number): void {
    this.sendWebSocketMessage(canvasId, {
      type: 'cursor_move',
      session_id: sessionId,
      data: { x, y },
      timestamp: new Date().toISOString()
    });
  }

  // Object Operations via WebSocket
  sendObjectAdd(canvasId: number, object: CanvasObject): void {
    this.sendWebSocketMessage(canvasId, {
      type: 'object_add',
      data: object,
      timestamp: new Date().toISOString()
    });
  }

  sendObjectUpdate(canvasId: number, objectId: string, updates: CanvasObjectUpdate): void {
    this.sendWebSocketMessage(canvasId, {
      type: 'object_update',
      data: { object_id: objectId, updates },
      timestamp: new Date().toISOString()
    });
  }

  sendObjectDelete(canvasId: number, objectId: string): void {
    this.sendWebSocketMessage(canvasId, {
      type: 'object_delete',
      data: { object_id: objectId },
      timestamp: new Date().toISOString()
    });
  }

  // Area Operations via WebSocket
  sendAreaAdd(canvasId: number, area: CollaborationArea): void {
    this.sendWebSocketMessage(canvasId, {
      type: 'area_add',
      data: area,
      timestamp: new Date().toISOString()
    });
  }

  sendAreaUpdate(canvasId: number, areaId: string, updates: CollaborationAreaUpdate): void {
    this.sendWebSocketMessage(canvasId, {
      type: 'area_update',
      data: { area_id: areaId, updates },
      timestamp: new Date().toISOString()
    });
  }

  sendAreaDelete(canvasId: number, areaId: string): void {
    this.sendWebSocketMessage(canvasId, {
      type: 'area_delete',
      data: { area_id: areaId },
      timestamp: new Date().toISOString()
    });
  }

  // User Join/Leave
  sendUserJoin(canvasId: number, userId: number, userName: string): void {
    this.sendWebSocketMessage(canvasId, {
      type: 'user_join',
      data: { user_id: userId, user_name: userName },
      timestamp: new Date().toISOString()
    });
  }

  sendUserLeave(canvasId: number, userId: number): void {
    this.sendWebSocketMessage(canvasId, {
      type: 'user_leave',
      data: { user_id: userId },
      timestamp: new Date().toISOString()
    });
  }
}

export const canvasService = CanvasService.getInstance(); 