import React, { useState, useEffect, useRef } from 'react';
import {
  MessageCircle,
  Send,
  Paperclip,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  FileText,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { apiCall, api } from '../api/api';

interface ProgressUpdate {
  id: number;
  milestone_id: number;
  user_id: number;
  user: {
    id: number;
    full_name?: string;
    company_name?: string;
    user_type: string;
  };
  update_type: string;
  message: string;
  progress_percentage?: number;
  attachments?: Array<{
    url: string;
    filename: string;
    uploaded_at: string;
  }>;
  parent_id?: number;
  defect_severity?: string;
  defect_resolved?: boolean;
  revision_deadline?: string;
  revision_completed?: boolean;
  is_internal: boolean;
  created_at: string;
  updated_at: string;
  replies: ProgressUpdate[];
}

interface TradeProgressProps {
  milestoneId: number;
  currentProgress: number;
  onProgressChange: (progress: number) => void;
  isBautraeger: boolean;
  isServiceProvider: boolean;
  completionStatus: string;
  onCompletionRequest?: () => void;
  onCompletionResponse?: (accepted: boolean, message?: string, deadline?: string) => void;
  /**
   * Wenn true, blendet die Kommandos "Abnahme bestätigen" und
   * "Nachbesserung anfordern" aus (z. B. im CostEstimateDetailsModal).
   */
  hideCompletionResponseControls?: boolean;
  /**
   * Information ob ein Angebot angenommen wurde (für Kommunikations-Hinweise)
   */
  hasAcceptedQuote?: boolean;
}

export default function TradeProgress({
  milestoneId,
  currentProgress,
  onProgressChange,
  isBautraeger,
  isServiceProvider,
  completionStatus,
  onCompletionRequest,
  onCompletionResponse,
  hideCompletionResponseControls = false,
  hasAcceptedQuote = false
}: TradeProgressProps) {
  const [updates, setUpdates] = useState<ProgressUpdate[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [showDefectModal, setShowDefectModal] = useState(false);
  const [defectSeverity, setDefectSeverity] = useState<string>('minor');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState(currentProgress);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadProgressUpdates();
  }, [milestoneId]);

  // Synchronisiere den lokalen Progress-State mit dem aktuellen Progress
  useEffect(() => {
    setProgress(currentProgress);
  }, [currentProgress]);

  // Automatisch zur neuesten Nachricht scrollen wenn Updates geladen werden
  useEffect(() => {
    if (updates.length > 0 && messagesContainerRef.current) {
      // Kurze Verzögerung um sicherzustellen, dass alle Nachrichten gerendert sind
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [updates]);

  const loadProgressUpdates = async () => {
    try {
      const response = await apiCall(`/milestones/${milestoneId}/progress/`);
      setUpdates(response);
    } catch (error) {
      console.error('Fehler beim Laden der Updates:', error);
    }
  };

  const handleSubmit = async (type: string = 'comment') => {
    if (!newMessage.trim() && selectedFiles.length === 0) return;

    setIsLoading(true);
    try {
      // Erstelle das Update
      const updateData: any = {
        update_type: type,
        message: newMessage,
        is_internal: false
      };

      // Nur definierte Werte hinzufügen - Bauträger senden niemals Fortschritt
      if (type === 'comment' && isServiceProvider && !isBautraeger) {
        updateData.progress_percentage = progress;
      }
      if (replyTo) {
        updateData.parent_id = replyTo;
      }
      if (type === 'defect' && defectSeverity) {
        updateData.defect_severity = defectSeverity;
      }

             console.log('🔍 Sende Progress Update:', JSON.stringify(updateData, null, 2));
       const response = await apiCall(`/milestones/${milestoneId}/progress/`, {
         method: 'POST',
         body: JSON.stringify(updateData)
       });

             // Upload Anhänge falls vorhanden (nur wenn normale Response)
       const responseId = response.id || response.data?.id;
       if (selectedFiles.length > 0 && responseId) {
         for (const file of selectedFiles) {
           const formData = new FormData();
           formData.append('file', file);
           
           // Debug: Zeige FormData-Inhalt
           for (let [key, value] of formData.entries()) {
             }
           
           try {
             // Jetzt den echten Attachment-Endpoint verwenden
             const uploadResponse = await apiCall(`/milestones/${milestoneId}/progress/${responseId}/attachments/`, {
               method: 'POST',
               body: formData,
               headers: {} // Lasse Content-Type automatisch setzen
             });
             } catch (uploadError) {
             console.error('❌ Attachment upload failed:', uploadError);
             console.error('❌ Error details:', uploadError.response?.data);
           }
         }
       }

      // Update lokalen State
      await loadProgressUpdates();
      setNewMessage('');
      setSelectedFiles([]);
      setReplyTo(null);
      setShowDefectModal(false);
      
      // Automatisch zur neuesten Nachricht scrollen nach dem Senden
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      }, 200);
      
      // Update Progress im Parent
      if (progress !== currentProgress) {
        onProgressChange(progress);
      }
    } catch (error) {
      console.error('Fehler beim Senden:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles([...selectedFiles, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(files => files.filter((_, i) => i !== index));
  };

  const renderUpdate = (update: ProgressUpdate, isReply: boolean = false) => {
    const isBautraegerUpdate = update.user.user_type === 'bautraeger' || 
                               update.user.user_type === 'developer' || 
                               update.user.user_type === 'PRIVATE' ||
                               update.user.user_type === 'PROFESSIONAL' ||
                               update.user.user_type === 'private' ||
                               update.user.user_type === 'professional';
    const isOwnUpdate = (isBautraeger && isBautraegerUpdate) || (isServiceProvider && !isBautraegerUpdate);
    
    return (
      <div
        key={update.id}
        className={`${isReply ? 'ml-12' : ''} mb-4`}
      >
        <div className={`flex gap-3 ${isOwnUpdate ? 'flex-row-reverse' : ''}`}>
          <div className="flex-shrink-0">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isBautraegerUpdate 
                ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
                : 'bg-gradient-to-br from-[#ffbd59] to-[#ffa726]'
            }`}>
              <User size={20} className="text-white" />
            </div>
          </div>
          
          <div className={`flex-1 ${isOwnUpdate ? 'text-right' : ''}`}>
            <div className={`inline-block p-4 rounded-xl max-w-[80%] ${
              isBautraegerUpdate
                ? (isOwnUpdate 
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' 
                    : 'bg-[#2c3539] text-white border border-blue-500/30')
                : (isOwnUpdate 
                    ? 'bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-[#1a1a2e]' 
                    : 'bg-[#2c3539] text-white border border-[#ffbd59]/30')
            } ${update.update_type === 'defect' ? 'border-2 border-red-500' : ''}`}>
              
              {/* Header */}
              <div className="flex items-center gap-2 mb-2 text-sm opacity-75">
                <span className="font-medium">
                  {update.user.company_name || 
                   update.user.full_name || 
                   `${(update.user as any).first_name || ''} ${(update.user as any).last_name || ''}`.trim() ||
                   (isBautraegerUpdate ? 'Bauträger' : 'Dienstleister')}
                </span>
                <span>•</span>
                <span>{format(new Date(update.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}</span>
                
                {/* Update Type Badge */}
                {update.update_type !== 'comment' && (
                  <>
                    <span>•</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      update.update_type === 'defect' ? 'bg-red-500/20 text-red-300' :
                      update.update_type === 'completion' ? 'bg-green-500/20 text-green-300' :
                      update.update_type === 'revision' ? 'bg-yellow-500/20 text-yellow-300' :
                      'bg-gray-500/20 text-gray-300'
                    }`}>
                      {update.update_type === 'defect' ? `Mangel (${update.defect_severity})` :
                       update.update_type === 'completion' ? 'Fertigstellung' :
                       update.update_type === 'revision' ? 'Nachbesserung' :
                       update.update_type}
                    </span>
                  </>
                )}
              </div>
              
              {/* Message */}
              <p className="mb-2">{update.message}</p>
              
              {/* Progress Update */}
              {update.progress_percentage !== null && update.progress_percentage !== undefined && (
                <div className="mt-2 p-2 bg-black/20 rounded">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>Fortschritt aktualisiert</span>
                    <span className="font-bold">{update.progress_percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-600/30 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-[#ffbd59] to-[#ffa726] h-2 rounded-full transition-all duration-300"
                      style={{ width: `${update.progress_percentage}%` }}
                    />
                  </div>
                </div>
              )}
              
              {/* Revision Deadline */}
              {update.revision_deadline && (
                <div className="mt-2 p-2 bg-red-500/20 rounded flex items-center gap-2 text-sm">
                  <Clock size={16} />
                  <span>Frist: {format(new Date(update.revision_deadline), 'dd.MM.yyyy', { locale: de })}</span>
                </div>
              )}
              
              {/* Attachments */}
              {update.attachments && update.attachments.length > 0 && (
                <div className="mt-3 space-y-2">
                  {update.attachments.map((attachment, idx) => {
                    const isImage = attachment.filename.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                    
                    // URL mit Token für authentifizierte Dateien
                    const token = localStorage.getItem('token');
                    const fullUrl = attachment.url.startsWith('http') 
                      ? attachment.url 
                      : `http://localhost:8000${attachment.url}${token ? `?token=${encodeURIComponent(token)}` : ''}`;
                    
                    if (isImage) {
                      return (
                        <div key={idx} className="space-y-2">
                          {/* Image Preview */}
                          <div className="relative group">
                            <img
                              src={fullUrl}
                              alt={attachment.filename}
                              className="max-w-full max-h-64 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => window.open(fullUrl, '_blank')}
                              onError={(e) => {
                                console.error('❌ Fehler beim Laden des Bildes:', fullUrl);
                                // Fallback: Zeige Dateilink
                                e.currentTarget.style.display = 'none';
                                const nextSibling = e.currentTarget.nextElementSibling as HTMLElement;
                                if (nextSibling) {
                                  nextSibling.style.display = 'flex';
                                }
                              }}
                            />
                            {/* Fallback Link (versteckt, wird bei Fehler angezeigt) */}
                            <a
                              href={fullUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hidden items-center gap-2 p-2 bg-black/20 rounded hover:bg-black/30 transition-colors"
                            >
                              <ImageIcon size={16} />
                              <span className="text-sm truncate">{attachment.filename}</span>
                            </a>
                          </div>
                          {/* Image Caption */}
                          <div className="text-xs text-gray-400 truncate">
                            📷 {attachment.filename}
                          </div>
                        </div>
                      );
                    } else {
                      // Non-image files
                      return (
                        <a
                          key={idx}
                          href={fullUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-2 bg-black/20 rounded hover:bg-black/30 transition-colors"
                        >
                          <FileText size={16} />
                          <span className="text-sm truncate">{attachment.filename}</span>
                        </a>
                      );
                    }
                  })}
                </div>
              )}
            </div>
            
            {/* Reply Button */}
            {!isReply && (
              <button
                onClick={() => setReplyTo(update.id)}
                className="mt-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Antworten
              </button>
            )}
          </div>
        </div>
        
        {/* Replies */}
        {update.replies && update.replies.length > 0 && (
          <div className="mt-3">
            {update.replies.map(reply => renderUpdate(reply, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-gradient-to-br from-[#1a1a2e]/50 to-[#2c3539]/50 rounded-xl border border-gray-600/30">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-6 cursor-pointer hover:bg-[#1a1a2e]/30 transition-all duration-200"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <MessageCircle size={18} className="text-[#ffbd59]" />
          Kommunikation
        </h3>
        <div className="flex items-center gap-4">
          {/* Progress Display */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">Fortschritt:</span>
            <div className="flex items-center gap-2">
              <div className="w-32 bg-gray-600/30 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-[#ffbd59] to-[#ffa726] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-white font-bold text-sm">{progress}%</span>
            </div>
          </div>
          
          <div className={`transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
            <ChevronDown size={20} className="text-[#ffbd59]" />
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-600/30">
          {/* Statusabhängige Hinweise */}
          <div className="p-6 border-b border-gray-600/30">
            {(() => {
              // Prüfe ob ein Angebot angenommen wurde
              
              if (hasAcceptedQuote) {
                // Angebot wurde angenommen - Private Kommunikation
                return (
                  <div className="mb-3 p-3 bg-gradient-to-r from-emerald-500/8 to-green-500/8 border border-emerald-500/20 rounded-lg">
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center">
                        <CheckCircle size={12} className="text-emerald-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-emerald-300 font-medium mb-1 text-sm">🔒 Private Kommunikation</h4>
                        <p className="text-xs text-gray-300 leading-relaxed">
                          <strong>Vertraulicher Austausch:</strong> Ihre Nachrichten sind nur für Sie und den beauftragten Dienstleister sichtbar. 
                          Nutzen Sie diesen Bereich für projektspezifische Absprachen, Terminkoordinationen und vertrauliche Details.
                        </p>
                      </div>
                    </div>
                  </div>
                );
              } else {
                // Noch kein Angebot angenommen - Öffentliche Kommunikation
                return (
                  <div className="mb-3 p-3 bg-gradient-to-r from-[#ffbd59]/8 to-orange-500/8 border border-[#ffbd59]/20 rounded-lg">
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 w-6 h-6 bg-[#ffbd59]/20 rounded-full flex items-center justify-center">
                        <MessageCircle size={12} className="text-[#ffbd59]" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-[#ffbd59] font-medium mb-1 text-sm">👁️ Öffentliche Kommunikation</h4>
                        <p className="text-xs text-gray-300 leading-relaxed">
                          <strong>Transparenter Austausch:</strong> Alle Nachrichten sind für interessierte Dienstleister sichtbar. 
                          Nutzen Sie diesen Bereich für allgemeine Fragen, Klärungen zur Ausschreibung und öffentliche Ankündigungen.
                        </p>
                      </div>
                    </div>
                  </div>
                );
              }
            })()}
          </div>
          

          {/* Messages */}
          <div ref={messagesContainerRef} className="p-6 max-h-96 overflow-y-auto">
            {updates.length === 0 ? (
              <p className="text-gray-400 text-center py-8">
                Noch keine Updates vorhanden. Beginnen Sie die Kommunikation!
              </p>
            ) : (
              <div className="space-y-4">
                {updates.filter(u => !u.parent_id).map(update => renderUpdate(update))}
              </div>
            )}
          </div>

          {/* Input Area */}
          {completionStatus !== 'archived' && (
            <div className="p-6 border-t border-gray-600/30">
              {replyTo && (
                <div className="mb-3 p-2 bg-gray-700/50 rounded flex items-center justify-between">
                  <span className="text-sm text-gray-400">
                    Antwort auf Nachricht #{replyTo}
                  </span>
                  <button
                    onClick={() => setReplyTo(null)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
              
              <div className="space-y-3">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Nachricht eingeben..."
                  className="w-full px-4 py-3 bg-[#1a1a2e] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffbd59] resize-none"
                  rows={3}
                />
                
                {/* Selected Files */}
                {selectedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center gap-2 px-3 py-1 bg-gray-700 rounded">
                        <FileText size={16} className="text-gray-400" />
                        <span className="text-sm text-gray-300">{file.name}</span>
                        <button
                          onClick={() => removeFile(idx)}
                          className="text-gray-400 hover:text-white"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex items-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                    title="Datei anhängen"
                  >
                    <Paperclip size={20} />
                  </button>
                  
                  {isBautraeger && (
                    <button
                      onClick={() => setShowDefectModal(true)}
                      className="p-2 text-red-400 hover:text-red-300 transition-colors"
                      title="Mangel melden"
                    >
                      <AlertTriangle size={20} />
                    </button>
                  )}
                  
                  <div className="flex-1" />
                  
                  {/* Progress Slider (nur für Dienstleister) - jetzt oberhalb des Senden-Buttons */}
                  {isServiceProvider && completionStatus !== 'completed' && (
                    <div className="flex items-center gap-2 sm:gap-3 mr-2 sm:mr-3">
                      <span className="text-xs sm:text-sm text-gray-400 hidden sm:inline">Fortschritt anpassen:</span>
                      <span className="text-xs sm:text-sm text-gray-400 sm:hidden">Fortschritt:</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={progress}
                        onChange={(e) => {
                          const newProgress = parseInt(e.target.value);
                          setProgress(newProgress);
                          onProgressChange(newProgress);
                        }}
                        className="w-28 sm:w-32 h-3 bg-gray-600 rounded-lg appearance-none cursor-pointer touch-manipulation"
                        style={{
                          background: `linear-gradient(to right, #ffbd59 0%, #ffa726 ${progress}%, #4a5568 ${progress}%, #4a5568 100%)`
                        }}
                      />
                      <span className="text-white font-bold text-sm w-8 text-right">{progress}%</span>
                    </div>
                  )}
                  
                  <button
                    onClick={() => handleSubmit('comment')}
                    disabled={isLoading || (!newMessage.trim() && selectedFiles.length === 0)}
                    className="px-6 py-2 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-[#1a1a2e] font-semibold rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Send size={18} />
                    Senden
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Fertigstellung Button für Dienstleister */}
          {isServiceProvider && hasAcceptedQuote && completionStatus !== 'completed' && (
            <div className="p-6 border-t border-gray-600/30">
              <div className="relative group">
                <button
                  onClick={progress === 100 ? onCompletionRequest : undefined}
                  disabled={progress !== 100 || completionStatus !== 'in_progress'}
                  className={`w-full font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                    progress === 100 && completionStatus === 'in_progress'
                      ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:shadow-lg cursor-pointer'
                      : 'bg-gray-500/20 text-gray-400 cursor-not-allowed border border-gray-500/30'
                  }`}
                >
                  <CheckCircle size={20} />
                  Als fertiggestellt markieren
                </button>
                
                {/* Tooltip für ausgegrauten Button */}
                {(progress !== 100 || completionStatus !== 'in_progress') && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-[#0f172a] border border-gray-500/30 rounded-xl shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition p-3 z-[100]">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle size={14} className="text-yellow-400" />
                      <span className="text-xs font-medium text-yellow-400">Voraussetzungen nicht erfüllt</span>
                    </div>
                    <p className="text-xs text-gray-300">
                      {progress !== 100 
                        ? `Der Fortschritt muss auf 100% gesetzt werden (aktuell: ${progress}%).`
                        : completionStatus !== 'in_progress'
                        ? 'Das Projekt ist bereits als fertiggestellt markiert oder befindet sich in einem anderen Status.'
                        : 'Unbekannter Grund.'
                      }
                    </p>
                  </div>
                )}
              </div>
              
              {/* Erklärung für Fortschrittsbalken */}
              <div className="mt-3 p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-xs text-blue-300 flex items-center gap-2">
                  <AlertTriangle size={12} />
                  <span>Bei 100% Fortschritt wird der Button "Als fertiggestellt markieren" aktiviert.</span>
                </p>
              </div>
            </div>
          )}
          
          {/* Completion Status Messages */}
          {completionStatus === 'completion_requested' && isBautraeger && !hideCompletionResponseControls && (
            <div className="p-6 border-t border-gray-600/30 bg-yellow-500/10">
              <p className="text-yellow-300 mb-4">
                Der Dienstleister hat das Gewerk als fertiggestellt gemeldet. Bitte prüfen Sie die Arbeiten.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => onCompletionResponse?.(true, 'Arbeiten wurden geprüft und abgenommen.')}
                  className="flex-1 bg-green-500 text-white font-semibold py-2 px-4 rounded hover:bg-green-600 transition-colors"
                >
                  Abnahme bestätigen
                </button>
                <button
                  onClick={() => {
                    const message = prompt('Begründung für Nachbesserung:');
                    if (message) {
                      // Benutzerfreundlichere Datumsauswahl
                      const today = new Date();
                      const defaultDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 Tage
                      const defaultDateString = defaultDate.toISOString().split('T')[0];
                      
                      const deadline = prompt(
                        `Wiedervorlage-Datum für finale Abnahme (YYYY-MM-DD):\n\n` +
                        `Bei Eingabe eines Datums wird automatisch ein Wiedervorlage-Termin\n` +
                        `für Sie und den Dienstleister erstellt.`,
                        defaultDateString
                      );
                      
                      if (deadline) {
                        // Validiere das Datum
                        const deadlineDate = new Date(deadline);
                        if (isNaN(deadlineDate.getTime()) || deadlineDate <= today) {
                          alert('⚠️ Bitte geben Sie ein gültiges zukünftiges Datum ein.');
                          return;
                        }
                        
                        console.log('📅 Erstelle Wiedervorlage-Termin für:', deadline);
                      }
                      
                      onCompletionResponse?.(false, message, deadline || undefined);
                    }
                  }}
                  className="flex-1 bg-red-500 text-white font-semibold py-2 px-4 rounded hover:bg-red-600 transition-colors"
                >
                  Nachbesserung anfordern
                </button>
              </div>
            </div>
          )}
          
          {completionStatus === 'completed' && (
            <div className="p-6 border-t border-gray-600/30 bg-green-500/10">
              <p className="text-green-300 flex items-center gap-2">
                <CheckCircle size={20} />
                Gewerk wurde abgenommen und archiviert.
              </p>
            </div>
          )}
        </div>
      )}
      
      {/* Defect Modal */}
      {showDefectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-[#1a1a2e] to-[#2c3539] rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">Mangel dokumentieren</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Schweregrad</label>
                <select
                  value={defectSeverity}
                  onChange={(e) => setDefectSeverity(e.target.value)}
                  className="w-full px-4 py-2 bg-[#1a1a2e] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffbd59]"
                >
                  <option value="minor" className="bg-[#1a1a2e] text-white">Gering</option>
                  <option value="major" className="bg-[#1a1a2e] text-white">Mittel</option>
                  <option value="critical" className="bg-[#1a1a2e] text-white">Kritisch</option>
                </select>
              </div>
              
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Beschreiben Sie den Mangel..."
                className="w-full px-4 py-3 bg-[#1a1a2e] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffbd59] resize-none"
                rows={4}
              />
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDefectModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={() => handleSubmit('defect')}
                  disabled={!newMessage.trim()}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  Mangel melden
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
