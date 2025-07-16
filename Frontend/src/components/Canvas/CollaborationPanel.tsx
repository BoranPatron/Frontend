import React, { useState } from 'react';
import type { CollaborationArea } from '../../api/canvasService';

interface CollaborationPanelProps {
  areas: CollaborationArea[];
  activeUsers: any[];
  onAreaUpdate: (areaId: string, updates: any) => void;
  onAreaDelete: (areaId: string) => void;
  onClose: () => void;
}

const CollaborationPanel: React.FC<CollaborationPanelProps> = ({
  areas,
  activeUsers,
  onAreaUpdate,
  onAreaDelete,
  onClose
}) => {
  const [editingArea, setEditingArea] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleEditArea = (area: CollaborationArea) => {
    setEditingArea(area.area_id);
    setEditName(area.name);
  };

  const handleSaveArea = (areaId: string) => {
    onAreaUpdate(areaId, { name: editName });
    setEditingArea(null);
    setEditName('');
  };

  const handleCancelEdit = () => {
    setEditingArea(null);
    setEditName('');
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Kollaboration</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Aktive Nutzer */}
      <div className="p-4 border-b border-gray-200">
        <h4 className="font-medium mb-2">Aktive Nutzer ({activeUsers.length})</h4>
        <div className="space-y-2">
          {activeUsers.map((user) => (
            <div key={user.user_id} className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs text-white">
                {user.user_name.charAt(0)}
              </div>
              <span className="text-sm">{user.user_name}</span>
            </div>
          ))}
          {activeUsers.length === 0 && (
            <p className="text-sm text-gray-500">Keine aktiven Nutzer</p>
          )}
        </div>
      </div>

      {/* Kollaborationsbereiche */}
      <div className="flex-1 p-4">
        <h4 className="font-medium mb-2">Kollaborationsbereiche ({areas.length})</h4>
        <div className="space-y-3">
          {areas.map((area) => (
            <div
              key={area.area_id}
              className="border border-gray-200 rounded-md p-3"
            >
              {editingArea === area.area_id ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveArea(area.area_id);
                      } else if (e.key === 'Escape') {
                        handleCancelEdit();
                      }
                    }}
                    autoFocus
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleSaveArea(area.area_id)}
                      className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                    >
                      Speichern
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                    >
                      Abbrechen
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: area.color }}
                      />
                      <span className="font-medium">{area.name}</span>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleEditArea(area)}
                        className="text-gray-500 hover:text-gray-700 text-xs"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => onAreaDelete(area.area_id)}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-2 text-xs text-gray-500">
                    <div>Position: ({Math.round(area.x)}, {Math.round(area.y)})</div>
                    <div>Größe: {Math.round(area.width)} × {Math.round(area.height)}</div>
                    <div>Zugewiesene Nutzer: {area.assigned_users.length}</div>
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {areas.length === 0 && (
            <p className="text-sm text-gray-500">Keine Kollaborationsbereiche vorhanden</p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          <p>• Klicken Sie auf einen Bereich, um ihn auszuwählen</p>
          <p>• Nutzer können nur ihre zugewiesenen Bereiche bearbeiten</p>
          <p>• Bereiche dürfen sich nicht überlappen</p>
        </div>
      </div>
    </div>
  );
};

export default CollaborationPanel; 