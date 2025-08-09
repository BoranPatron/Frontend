import React, { useState, useEffect } from 'react';
import { 
  X, 
  ArrowLeft, 
  ArrowRight, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Download,
  Maximize2,
  Move,
  Eye,
  FileText,
  Image as ImageIcon,
  Play
} from 'lucide-react';

interface Document {
  id: number;
  title: string;
  plan_url?: string;
  result_url?: string;
  created_at?: string;
  uploaded_at?: string;
  uploader_name?: string;
  category?: string;
}

interface DocumentComparisonProps {
  isOpen: boolean;
  onClose: () => void;
  uploadedDocuments: Document[];
  visualizationResults: Document[];
  projectId: number;
}

interface ComparisonState {
  leftDocument: Document | null;
  rightDocument: Document | null;
  leftZoom: number;
  rightZoom: number;
  leftRotation: number;
  rightRotation: number;
  syncZoom: boolean;
  syncPan: boolean;
}

export default function DocumentComparison({
  isOpen,
  onClose,
  uploadedDocuments,
  visualizationResults,
  projectId
}: DocumentComparisonProps) {
  const [step, setStep] = useState<'selection' | 'comparison'>('selection');
  const [comparison, setComparison] = useState<ComparisonState>({
    leftDocument: null,
    rightDocument: null,
    leftZoom: 1,
    rightZoom: 1,
    leftRotation: 0,
    rightRotation: 0,
    syncZoom: true,
    syncPan: false
  });

  const [selectedLeft, setSelectedLeft] = useState<Document | null>(null);
  const [selectedRight, setSelectedRight] = useState<Document | null>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setStep('selection');
      setSelectedLeft(null);
      setSelectedRight(null);
      setComparison({
        leftDocument: null,
        rightDocument: null,
        leftZoom: 1,
        rightZoom: 1,
        leftRotation: 0,
        rightRotation: 0,
        syncZoom: true,
        syncPan: false
      });
    }
  }, [isOpen]);

  const handleCompareClick = () => {
    if (selectedLeft && selectedRight) {
      setComparison(prev => ({
        ...prev,
        leftDocument: selectedLeft,
        rightDocument: selectedRight
      }));
      setStep('comparison');
    }
  };

  const handleZoom = (side: 'left' | 'right', delta: number) => {
    const newZoom = Math.max(0.1, Math.min(5, (side === 'left' ? comparison.leftZoom : comparison.rightZoom) + delta));
    
    if (comparison.syncZoom) {
      setComparison(prev => ({
        ...prev,
        leftZoom: newZoom,
        rightZoom: newZoom
      }));
    } else {
      setComparison(prev => ({
        ...prev,
        [side === 'left' ? 'leftZoom' : 'rightZoom']: newZoom
      }));
    }
  };

  const handleRotate = (side: 'left' | 'right') => {
    const currentRotation = side === 'left' ? comparison.leftRotation : comparison.rightRotation;
    const newRotation = (currentRotation + 90) % 360;
    
    setComparison(prev => ({
      ...prev,
      [side === 'left' ? 'leftRotation' : 'rightRotation']: newRotation
    }));
  };

  const getDocumentIcon = (doc: Document) => {
    const url = doc.plan_url || doc.result_url || '';
    const extension = url.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <ImageIcon className="w-5 h-5" />;
      case 'mp4':
      case 'mov':
      case 'avi':
        return <Play className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const renderDocumentPreview = (doc: Document, side: 'left' | 'right') => {
    const url = doc.plan_url || doc.result_url || '';
    const extension = url.split('.').pop()?.toLowerCase();
    const zoom = side === 'left' ? comparison.leftZoom : comparison.rightZoom;
    const rotation = side === 'left' ? comparison.leftRotation : comparison.rightRotation;
    
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif'];
    const videoExtensions = ['mp4', 'mov', 'avi'];
    
    if (imageExtensions.includes(extension || '')) {
      return (
        <div className="w-full h-full flex items-center justify-center overflow-hidden bg-gray-100">
          <img
            src={url}
            alt={doc.title}
            className="max-w-none object-contain transition-transform duration-200"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              maxHeight: '100%',
              maxWidth: '100%'
            }}
          />
        </div>
      );
    } else if (videoExtensions.includes(extension || '')) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
          <video
            src={url}
            controls
            className="max-w-full max-h-full"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`
            }}
          />
        </div>
      );
    } else if (extension === 'pdf') {
      return (
        <div className="w-full h-full bg-gray-100">
          <iframe
            src={url}
            className="w-full h-full border-0"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`
            }}
            title={doc.title}
          />
        </div>
      );
    } else {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500">
          <div className="text-center">
            <FileText className="w-16 h-16 mx-auto mb-4" />
            <p className="text-lg font-medium">{doc.title}</p>
            <p className="text-sm">Vorschau nicht verfügbar</p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-[#51636f] text-white rounded-lg hover:bg-[#5a6f7f] transition-colors"
            >
              <Download className="w-4 h-4" />
              Dokument öffnen
            </a>
          </div>
        </div>
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl shadow-2xl w-full h-full max-w-none max-h-none m-4 overflow-hidden border border-white/10">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#51636f]/95 to-[#3a4a57]/95 backdrop-blur-lg px-6 py-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {step === 'comparison' && (
                <button
                  onClick={() => setStep('selection')}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-white" />
                </button>
              )}
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {step === 'selection' ? 'Dokumente für Vergleich auswählen' : 'Dokumentenvergleich'}
                </h2>
                <p className="text-gray-300 text-sm">
                  {step === 'selection' 
                    ? 'Wählen Sie ein Dokument von jeder Seite für den Vergleich aus'
                    : `${comparison.leftDocument?.title} ⟷ ${comparison.rightDocument?.title}`
                  }
                </p>
              </div>
            </div>
            
            {step === 'comparison' && (
              <div className="flex items-center gap-2">
                {/* Zoom Controls */}
                <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-lg">
                  <button
                    onClick={() => handleZoom('left', -0.2)}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                  >
                    <ZoomOut className="w-4 h-4 text-white" />
                  </button>
                  <span className="text-white text-sm font-mono min-w-[3rem] text-center">
                    {Math.round(comparison.leftZoom * 100)}%
                  </span>
                  <button
                    onClick={() => handleZoom('left', 0.2)}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                  >
                    <ZoomIn className="w-4 h-4 text-white" />
                  </button>
                </div>
                
                {/* Sync Controls */}
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 text-sm text-gray-300">
                    <input
                      type="checkbox"
                      checked={comparison.syncZoom}
                      onChange={(e) => setComparison(prev => ({ ...prev, syncZoom: e.target.checked }))}
                      className="rounded"
                    />
                    Sync Zoom
                  </label>
                </div>
              </div>
            )}
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {step === 'selection' ? (
            // Selection Step
            <div className="h-full flex">
              {/* Left Side - Uploaded Documents */}
              <div className="w-1/2 border-r border-white/10 flex flex-col">
                <div className="px-6 py-4 bg-white/5 border-b border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-2">Hochgeladene Dokumente</h3>
                  <p className="text-gray-400 text-sm">Wählen Sie einen Plan oder ein Dokument aus</p>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="grid grid-cols-1 gap-3">
                    {uploadedDocuments.map((doc) => (
                      <button
                        key={doc.id}
                        onClick={() => setSelectedLeft(doc)}
                        className={`p-4 rounded-xl border transition-all text-left ${
                          selectedLeft?.id === doc.id
                            ? 'border-[#ffbd59] bg-[#ffbd59]/10 shadow-[0_0_20px_rgba(255,189,89,0.3)]'
                            : 'border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/30'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${
                            selectedLeft?.id === doc.id ? 'bg-[#ffbd59]/20' : 'bg-white/10'
                          }`}>
                            {getDocumentIcon(doc)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-white truncate">{doc.title}</h4>
                            <p className="text-sm text-gray-400 mt-1">
                              {doc.uploaded_at 
                                ? new Date(doc.uploaded_at).toLocaleDateString('de-DE')
                                : 'Kein Datum'
                              }
                            </p>
                            {doc.uploader_name && (
                              <p className="text-xs text-gray-500 mt-1">
                                von {doc.uploader_name}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Side - Visualization Results */}
              <div className="w-1/2 flex flex-col">
                <div className="px-6 py-4 bg-white/5 border-b border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-2">Visualisierungsergebnisse</h3>
                  <p className="text-gray-400 text-sm">Wählen Sie eine Visualisierung zum Vergleichen aus</p>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="grid grid-cols-1 gap-3">
                    {visualizationResults.map((doc) => (
                      <button
                        key={doc.id}
                        onClick={() => setSelectedRight(doc)}
                        className={`p-4 rounded-xl border transition-all text-left ${
                          selectedRight?.id === doc.id
                            ? 'border-[#51636f] bg-[#51636f]/10 shadow-[0_0_20px_rgba(81,99,111,0.3)]'
                            : 'border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/30'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${
                            selectedRight?.id === doc.id ? 'bg-[#51636f]/20' : 'bg-white/10'
                          }`}>
                            {getDocumentIcon(doc)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-white truncate">{doc.title}</h4>
                            <p className="text-sm text-gray-400 mt-1">
                              {doc.created_at 
                                ? new Date(doc.created_at).toLocaleDateString('de-DE')
                                : 'Kein Datum'
                              }
                            </p>
                            {doc.category && (
                              <span className="inline-block mt-2 px-2 py-1 bg-[#51636f]/20 text-[#51636f] text-xs rounded-full">
                                {doc.category}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Comparison Step
            <div className="h-full flex">
              {/* Left Document */}
              <div className="w-1/2 border-r border-white/10 flex flex-col">
                <div className="px-4 py-3 bg-white/5 border-b border-white/10 flex items-center justify-between">
                  <h3 className="font-medium text-white">{comparison.leftDocument?.title}</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRotate('left')}
                      className="p-1 hover:bg-white/10 rounded transition-colors"
                      title="Drehen"
                    >
                      <RotateCw className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-hidden">
                  {comparison.leftDocument && renderDocumentPreview(comparison.leftDocument, 'left')}
                </div>
              </div>

              {/* Right Document */}
              <div className="w-1/2 flex flex-col">
                <div className="px-4 py-3 bg-white/5 border-b border-white/10 flex items-center justify-between">
                  <h3 className="font-medium text-white">{comparison.rightDocument?.title}</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRotate('right')}
                      className="p-1 hover:bg-white/10 rounded transition-colors"
                      title="Drehen"
                    >
                      <RotateCw className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-hidden">
                  {comparison.rightDocument && renderDocumentPreview(comparison.rightDocument, 'right')}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'selection' && (
          <div className="px-6 py-4 bg-white/5 border-t border-white/10 flex items-center justify-between">
            <div className="text-sm text-gray-400">
              {selectedLeft && selectedRight 
                ? 'Beide Dokumente ausgewählt - bereit zum Vergleichen'
                : `${selectedLeft ? '1' : '0'} von 2 Dokumenten ausgewählt`
              }
            </div>
            <button
              onClick={handleCompareClick}
              disabled={!selectedLeft || !selectedRight}
              className="px-6 py-2 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-[#1a1a2e] font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:from-[#ffa726] hover:to-[#ff9800] transition-all transform hover:scale-105"
            >
              Vergleichen
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
