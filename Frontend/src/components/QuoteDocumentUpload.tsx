import React, { useState } from 'react';
import { Upload, FileText, X, CheckCircle, AlertTriangle } from 'lucide-react';

interface QuoteDocumentUploadProps {
  quoteId: number;
  onUploadSuccess?: (updatedQuote: any) => void;
  onUploadError?: (error: string) => void;
}

export default function QuoteDocumentUpload({ 
  quoteId, 
  onUploadSuccess, 
  onUploadError 
}: QuoteDocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');

  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  const maxSize = 10 * 1024 * 1024; // 10MB

  const validateFile = (file: File): string | null => {
    if (!allowedTypes.includes(file.type)) {
      return 'Nicht unterstützter Dateityp. Erlaubt sind: PDF, JPEG, PNG, DOC, DOCX';
    }
    
    if (file.size > maxSize) {
      return 'Datei zu groß. Maximum: 10MB';
    }
    
    return null;
  };

  const uploadFile = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setUploadStatus('error');
      setUploadMessage(validationError);
      onUploadError?.(validationError);
      return;
    }

    setIsUploading(true);
    setUploadStatus('idle');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/v1/quotes/${quoteId}/upload-document`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Upload fehlgeschlagen');
      }

      const updatedQuote = await response.json();
      setUploadStatus('success');
      setUploadMessage(`Dokument "${file.name}" erfolgreich hochgeladen`);
      onUploadSuccess?.(updatedQuote);

    } catch (error) {
      console.error('Upload-Fehler:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      setUploadStatus('error');
      setUploadMessage(errorMessage);
      onUploadError?.(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      uploadFile(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadFile(files[0]);
    }
    // Reset input
    e.target.value = '';
  };

  const clearStatus = () => {
    setUploadStatus('idle');
    setUploadMessage('');
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-6 transition-all duration-200 ${
          isDragging
            ? 'border-[#ffbd59] bg-[#ffbd59]/10'
            : isUploading
            ? 'border-blue-400 bg-blue-400/10'
            : 'border-gray-600 hover:border-gray-500'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          onChange={handleFileSelect}
          disabled={isUploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />

        <div className="text-center">
          {isUploading ? (
            <div className="space-y-3">
              <div className="animate-spin mx-auto w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full" />
              <p className="text-blue-400 font-medium">Dokument wird hochgeladen...</p>
            </div>
          ) : (
            <div className="space-y-3">
              <Upload size={48} className={`mx-auto ${isDragging ? 'text-[#ffbd59]' : 'text-gray-400'}`} />
              <div>
                <p className="text-white font-medium mb-1">
                  {isDragging ? 'Datei hier ablegen' : 'Dokument hochladen'}
                </p>
                <p className="text-gray-400 text-sm">
                  Ziehen Sie eine Datei hierher oder klicken Sie zum Auswählen
                </p>
                <p className="text-gray-500 text-xs mt-2">
                  Unterstützte Formate: PDF, JPEG, PNG, DOC, DOCX (max. 10MB)
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Message */}
      {uploadStatus !== 'idle' && (
        <div className={`flex items-start gap-3 p-4 rounded-lg border ${
          uploadStatus === 'success' 
            ? 'bg-green-500/10 border-green-500/30 text-green-400'
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          <div className="flex-shrink-0 mt-0.5">
            {uploadStatus === 'success' ? (
              <CheckCircle size={18} />
            ) : (
              <AlertTriangle size={18} />
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">{uploadMessage}</p>
          </div>
          <button
            onClick={clearStatus}
            className="flex-shrink-0 hover:opacity-70 transition-opacity"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Upload Guidelines */}
      <div className="bg-gray-500/10 border border-gray-500/30 rounded-lg p-4">
        <h4 className="text-white font-medium mb-2 flex items-center gap-2">
          <FileText size={16} className="text-[#ffbd59]" />
          Upload-Richtlinien
        </h4>
        <ul className="text-gray-300 text-sm space-y-1">
          <li>• PDF-Dateien werden als Hauptdokument gespeichert</li>
          <li>• Andere Formate werden als zusätzliche Dokumente hinzugefügt</li>
          <li>• Dokumente sind nur für Sie und den Bauträger sichtbar</li>
          <li>• Maximale Dateigröße: 10MB</li>
        </ul>
      </div>
    </div>
  );
}


