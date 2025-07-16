import React, { useState } from 'react';

interface CanvasToolbarProps {
  onObjectAdd: (objectData: any) => void;
  onAreaAdd: (areaData: any) => void;
  onExport: () => void;
  onCollaborationToggle: () => void;
  selectedObjects: string[];
  selectedAreas: string[];
  onDeleteObjects: () => void;
  onDeleteAreas: () => void;
  activeUsers: any[];
}

const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  onObjectAdd,
  onAreaAdd,
  onExport,
  onCollaborationToggle,
  selectedObjects,
  selectedAreas,
  onDeleteObjects,
  onDeleteAreas,
  activeUsers
}) => {
  const [showObjectMenu, setShowObjectMenu] = useState(false);
  const [showAreaMenu, setShowAreaMenu] = useState(false);

  const handleObjectAdd = (type: string) => {
    const objectData = {
      type,
      x: 100,
      y: 100,
      width: type === 'text' ? 200 : 150,
      height: type === 'text' ? 100 : 150,
      content: type === 'text' ? 'Text eingeben...' : '',
      color: type === 'sticky' ? '#ffbd59' : '#3b82f6'
    };
    onObjectAdd(objectData);
    setShowObjectMenu(false);
  };

  const handleAreaAdd = () => {
    const areaData = {
      name: 'Neuer Bereich',
      x: 100,
      y: 100,
      width: 300,
      height: 200,
      color: '#3b82f6',
      assigned_users: []
    };
    onAreaAdd(areaData);
    setShowAreaMenu(false);
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
      {/* Linke Seite - Werkzeuge */}
      <div className="flex items-center space-x-2">
        {/* Objekte hinzufügen */}
        <div className="relative">
          <button
            onClick={() => setShowObjectMenu(!showObjectMenu)}
            className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
          >
            <span>+</span>
            <span>Objekt</span>
          </button>
          
          {showObjectMenu && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50">
              <button
                onClick={() => handleObjectAdd('sticky')}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100"
              >
                📝 Sticky Note
              </button>
              <button
                onClick={() => handleObjectAdd('rectangle')}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100"
              >
                ⬜ Rechteck
              </button>
              <button
                onClick={() => handleObjectAdd('circle')}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100"
              >
                ⭕ Kreis
              </button>
              <button
                onClick={() => handleObjectAdd('line')}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100"
              >
                ➖ Linie
              </button>
              <button
                onClick={() => handleObjectAdd('text')}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100"
              >
                📝 Text
              </button>
              <button
                onClick={() => handleObjectAdd('image')}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100"
              >
                🖼️ Bild
              </button>
            </div>
          )}
        </div>

        {/* Kollaborationsbereich hinzufügen */}
        <div className="relative">
          <button
            onClick={() => setShowAreaMenu(!showAreaMenu)}
            className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center space-x-2"
          >
            <span>+</span>
            <span>Bereich</span>
          </button>
          
          {showAreaMenu && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50">
              <button
                onClick={handleAreaAdd}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100"
              >
                📋 Kollaborationsbereich
              </button>
            </div>
          )}
        </div>

        {/* Löschen */}
        {(selectedObjects.length > 0 || selectedAreas.length > 0) && (
          <button
            onClick={() => {
              if (selectedObjects.length > 0) onDeleteObjects();
              if (selectedAreas.length > 0) onDeleteAreas();
            }}
            className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            🗑️ Löschen
          </button>
        )}
      </div>

      {/* Mittlere Seite - Status */}
      <div className="flex items-center space-x-4">
        <div className="text-sm text-gray-600">
          {selectedObjects.length > 0 && (
            <span className="mr-4">{selectedObjects.length} Objekt(e) ausgewählt</span>
          )}
          {selectedAreas.length > 0 && (
            <span className="mr-4">{selectedAreas.length} Bereich(e) ausgewählt</span>
          )}
        </div>
        
        {/* Aktive Nutzer */}
        {activeUsers.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Aktive Nutzer:</span>
            <div className="flex space-x-1">
              {activeUsers.map((user, index) => (
                <div
                  key={user.user_id}
                  className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs text-white"
                  title={user.user_name}
                >
                  {user.user_name.charAt(0)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Rechte Seite - Aktionen */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onCollaborationToggle}
          className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
        >
          👥 Kollaboration
        </button>
        
        <button
          onClick={onExport}
          className="px-3 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
        >
          📤 Export
        </button>
      </div>
    </div>
  );
};

export default CanvasToolbar; 