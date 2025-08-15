import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';
import { canvasService } from '../../api/canvasService';
import type { CanvasState, CanvasObject, CollaborationArea } from '../../api/canvasService';
import CanvasToolbar from './CanvasToolbar';
import CanvasViewport from './CanvasViewport';
import CollaborationPanel from './CollaborationPanel';
import ExportModal from './ExportModal';

interface CanvasEditorProps {
  projectId: number;
}

const CanvasEditor: React.FC<CanvasEditorProps> = ({ projectId }) => {
  const { user } = useAuth();
  const { currentProject } = useProject();
  const [canvasState, setCanvasState] = useState<CanvasState>({
    objects: [],
    areas: [],
    viewport: { x: 0, y: 0, scale: 1 }
  });
  const [selectedObjects, setSelectedObjects] = useState<string[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [canvasId, setCanvasId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showCollaborationPanel, setShowCollaborationPanel] = useState(false);
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [sessionId, setSessionId] = useState<string>('');
  const autoSaveInterval = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Canvas laden
  useEffect(() => {
    loadCanvas();
  }, [projectId]);

  // WebSocket-Verbindung
  useEffect(() => {
    if (canvasId && user) {
      connectWebSocket();
      return () => {
        disconnectWebSocket();
      };
    }
  }, [canvasId, user]);

  // Auto-Save
  useEffect(() => {
    if (canvasId) {
      autoSaveInterval.current = setInterval(() => {
        saveCanvasState();
      }, 30000); // Alle 30 Sekunden

      return () => {
        if (autoSaveInterval.current) {
          clearInterval(autoSaveInterval.current);
        }
      };
    }
  }, [canvasId]);

  const loadCanvas = async () => {
    try {
      setIsLoading(true);
      const canvas = await canvasService.getCanvas(projectId);
      setCanvasId(canvas.id);
      
      // Lade Canvas-Zustand
      const state = await canvasService.loadCanvasState(canvas.id);
      setCanvasState(state);
      
      // Generiere Session-ID
      setSessionId(`session_${Date.now()}_${user?.id}`);
    } catch (error) {
      console.error('Fehler beim Laden des Canvas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const connectWebSocket = () => {
    if (!canvasId || !user) return;

    wsRef.current = canvasService.connectWebSocket(canvasId, (message) => {
      handleWebSocketMessage(message);
    });

    // Sende User-Join-Nachricht
    canvasService.sendUserJoin(canvasId, user.id, `${user.first_name} ${user.last_name}`);
  };

  const disconnectWebSocket = () => {
    if (wsRef.current) {
      canvasService.disconnectWebSocket(canvasId!);
      wsRef.current = null;
    }
  };

  const handleWebSocketMessage = (message: any) => {
    switch (message.type) {
      case 'object_add':
        setCanvasState(prev => ({
          ...prev,
          objects: [...prev.objects, message.data]
        }));
        break;
      case 'object_update':
        setCanvasState(prev => ({
          ...prev,
          objects: prev.objects.map(obj => 
            obj.object_id === message.data.object_id 
              ? { ...obj, ...message.data.updates }
              : obj
          )
        }));
        break;
      case 'object_delete':
        setCanvasState(prev => ({
          ...prev,
          objects: prev.objects.filter(obj => obj.object_id !== message.data.object_id)
        }));
        break;
      case 'area_add':
        setCanvasState(prev => ({
          ...prev,
          areas: [...prev.areas, message.data]
        }));
        break;
      case 'area_update':
        setCanvasState(prev => ({
          ...prev,
          areas: prev.areas.map(area => 
            area.area_id === message.data.area_id 
              ? { ...area, ...message.data.updates }
              : area
          )
        }));
        break;
      case 'area_delete':
        setCanvasState(prev => ({
          ...prev,
          areas: prev.areas.filter(area => area.area_id !== message.data.area_id)
        }));
        break;
      case 'cursor_move':
        // Aktualisiere Cursor-Positionen
        break;
      case 'user_join':
      case 'user_leave':
        // Aktualisiere aktive Nutzer
        updateActiveUsers();
        break;
    }
  };

  const updateActiveUsers = async () => {
    if (!canvasId) return;
    try {
      const response = await canvasService.getActiveUsers(canvasId);
      setActiveUsers(response.users);
    } catch (error) {
      console.error('Fehler beim Laden aktiver Nutzer:', error);
    }
  };

  const saveCanvasState = async () => {
    if (!canvasId) return;
    try {
      await canvasService.saveCanvasState(canvasId, canvasState);
      } catch (error) {
      console.error('Fehler beim Auto-Save:', error);
    }
  };

  const handleViewportChange = (viewport: { x: number; y: number; scale: number }) => {
    setCanvasState(prev => ({
      ...prev,
      viewport
    }));
  };

  const handleObjectAdd = async (objectData: any) => {
    if (!canvasId) return;
    try {
      const newObject = await canvasService.createCanvasObject(canvasId, objectData);
      setCanvasState(prev => ({
        ...prev,
        objects: [...prev.objects, newObject]
      }));
      
      // Sende über WebSocket
      canvasService.sendObjectAdd(canvasId, newObject);
      
      } catch (error) {
      console.error('Fehler beim Hinzufügen des Objekts:', error);
    }
  };

  const handleObjectUpdate = async (objectId: string, updates: any) => {
    if (!canvasId) return;
    try {
      const updatedObject = await canvasService.updateCanvasObject(objectId, updates);
      setCanvasState(prev => ({
        ...prev,
        objects: prev.objects.map(obj => 
          obj.object_id === objectId ? updatedObject : obj
        )
      }));
      
      // Sende über WebSocket
      canvasService.sendObjectUpdate(canvasId, objectId, updates);
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Objekts:', error);
    }
  };

  const handleObjectDelete = async (objectId: string) => {
    if (!canvasId) return;
    try {
      await canvasService.deleteCanvasObject(objectId);
      setCanvasState(prev => ({
        ...prev,
        objects: prev.objects.filter(obj => obj.object_id !== objectId)
      }));
      
      // Sende über WebSocket
      canvasService.sendObjectDelete(canvasId, objectId);
      
      } catch (error) {
      console.error('Fehler beim Löschen des Objekts:', error);
    }
  };

  const handleAreaAdd = async (areaData: any) => {
    if (!canvasId) return;
    try {
      const newArea = await canvasService.createCollaborationArea(canvasId, areaData);
      setCanvasState(prev => ({
        ...prev,
        areas: [...prev.areas, newArea]
      }));
      
      // Sende über WebSocket
      canvasService.sendAreaAdd(canvasId, newArea);
      
      } catch (error) {
      console.error('Fehler beim Hinzufügen des Bereichs:', error);
    }
  };

  const handleAreaUpdate = async (areaId: string, updates: any) => {
    if (!canvasId) return;
    try {
      const updatedArea = await canvasService.updateCollaborationArea(areaId, updates);
      setCanvasState(prev => ({
        ...prev,
        areas: prev.areas.map(area => 
          area.area_id === areaId ? updatedArea : area
        )
      }));
      
      // Sende über WebSocket
      canvasService.sendAreaUpdate(canvasId, areaId, updates);
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Bereichs:', error);
    }
  };

  const handleAreaDelete = async (areaId: string) => {
    if (!canvasId) return;
    try {
      await canvasService.deleteCollaborationArea(areaId);
      setCanvasState(prev => ({
        ...prev,
        areas: prev.areas.filter(area => area.area_id !== areaId)
      }));
      
      // Sende über WebSocket
      canvasService.sendAreaDelete(canvasId, areaId);
      
      } catch (error) {
      console.error('Fehler beim Löschen des Bereichs:', error);
    }
  };

  const handleSelectionChange = (objectIds: string[], areaIds: string[]) => {
    setSelectedObjects(objectIds);
    setSelectedAreas(areaIds);
  };

  const handleExport = async (exportData: any) => {
    if (!canvasId) return;
    try {
      const result = await canvasService.exportCanvas(canvasId, exportData);
      if (result.success) {
        if (result.file_url) {
          // Download
          const link = document.createElement('a');
          link.href = result.file_url;
          link.download = `canvas_export.${exportData.format}`;
          link.click();
        } else if (result.document_id) {
          }
      } else {
        console.error('Fehler beim Export:', result.message);
      }
    } catch (error) {
      console.error('Fehler beim Export:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Toolbar */}
      <CanvasToolbar
        onObjectAdd={handleObjectAdd}
        onAreaAdd={handleAreaAdd}
        onExport={() => setShowExportModal(true)}
        onCollaborationToggle={() => setShowCollaborationPanel(!showCollaborationPanel)}
        selectedObjects={selectedObjects}
        selectedAreas={selectedAreas}
        onDeleteObjects={() => {
          selectedObjects.forEach(handleObjectDelete);
          setSelectedObjects([]);
        }}
        onDeleteAreas={() => {
          selectedAreas.forEach(handleAreaDelete);
          setSelectedAreas([]);
        }}
        activeUsers={activeUsers}
      />

      <div className="flex-1 flex">
        {/* Haupt-Canvas */}
        <div className="flex-1 relative">
          <CanvasViewport
            canvasState={canvasState}
            onViewportChange={handleViewportChange}
            onObjectUpdate={handleObjectUpdate}
            onSelectionChange={handleSelectionChange}
            sessionId={sessionId}
            onCursorMove={(x, y) => {
              if (canvasId && sessionId) {
                canvasService.sendCursorMove(canvasId, sessionId, x, y);
              }
            }}
          />
        </div>

        {/* Kollaborations-Panel */}
        {showCollaborationPanel && (
          <CollaborationPanel
            areas={canvasState.areas}
            activeUsers={activeUsers}
            onAreaUpdate={handleAreaUpdate}
            onAreaDelete={handleAreaDelete}
            onClose={() => setShowCollaborationPanel(false)}
          />
        )}
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <ExportModal
          onExport={handleExport}
          onClose={() => setShowExportModal(false)}
          selectedAreas={canvasState.areas.filter(area => selectedAreas.includes(area.area_id))}
        />
      )}
    </div>
  );
};

export default CanvasEditor; 
