import React, { useState } from 'react';
import type { CollaborationArea } from '../../api/canvasService';

interface ExportModalProps {
  onExport: (exportData: any) => void;
  onClose: () => void;
  selectedAreas: CollaborationArea[];
}

const ExportModal: React.FC<ExportModalProps> = ({
  onExport,
  onClose,
  selectedAreas
}) => {
  const [format, setFormat] = useState<'png' | 'pdf'>('png');
  const [area, setArea] = useState<'full' | 'selected'>('full');
  const [exportType, setExportType] = useState<'download' | 'docs'>('download');
  const [selectedAreaId, setSelectedAreaId] = useState<string>('');

  const handleExport = () => {
    const exportData = {
      format,
      area,
      area_id: area === 'selected' && selectedAreaId ? selectedAreaId : undefined,
      export_type: exportType
    };
    onExport(exportData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Canvas Export</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {/* Format */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Format
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="png"
                  checked={format === 'png'}
                  onChange={(e) => setFormat(e.target.value as 'png' | 'pdf')}
                  className="mr-2"
                />
                PNG
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="pdf"
                  checked={format === 'pdf'}
                  onChange={(e) => setFormat(e.target.value as 'png' | 'pdf')}
                  className="mr-2"
                />
                PDF
              </label>
            </div>
          </div>

          {/* Bereich */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Export-Bereich
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="full"
                  checked={area === 'full'}
                  onChange={(e) => setArea(e.target.value as 'full' | 'selected')}
                  className="mr-2"
                />
                Gesamtes Canvas
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="selected"
                  checked={area === 'selected'}
                  onChange={(e) => setArea(e.target.value as 'full' | 'selected')}
                  className="mr-2"
                  disabled={selectedAreas.length === 0}
                />
                Ausgewählte Bereiche ({selectedAreas.length})
              </label>
            </div>
          </div>

          {/* Bereichsauswahl */}
          {area === 'selected' && selectedAreas.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bereich auswählen
              </label>
              <select
                value={selectedAreaId}
                onChange={(e) => setSelectedAreaId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Alle ausgewählten Bereiche</option>
                {selectedAreas.map((area) => (
                  <option key={area.area_id} value={area.area_id}>
                    {area.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Export-Typ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Export-Typ
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="download"
                  checked={exportType === 'download'}
                  onChange={(e) => setExportType(e.target.value as 'download' | 'docs')}
                  className="mr-2"
                />
                Download
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="docs"
                  checked={exportType === 'docs'}
                  onChange={(e) => setExportType(e.target.value as 'download' | 'docs')}
                  className="mr-2"
                />
                Als Dokument speichern
              </label>
            </div>
          </div>

          {/* Vorschau */}
          <div className="bg-gray-50 p-3 rounded-md">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Vorschau</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <div>Format: {format.toUpperCase()}</div>
              <div>Bereich: {area === 'full' ? 'Gesamtes Canvas' : 'Ausgewählte Bereiche'}</div>
              <div>Export: {exportType === 'download' ? 'Download' : 'Als Dokument speichern'}</div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
          >
            Abbrechen
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Exportieren
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal; 