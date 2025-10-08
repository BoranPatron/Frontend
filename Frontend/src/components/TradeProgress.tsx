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
  /**
   * Callback der aufgerufen wird, wenn eine Nachricht gesendet wurde
   */
  onMessageSent?: () => void;
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
  hasAcceptedQuote = false,
  onMessageSent
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
      
      // Markiere Nachrichten als ungelesen für den jeweils anderen
      // - Wenn Dienstleister schreibt: Markiere für Bauträger als ungelesen
      // - Wenn Bauträger schreibt: Markiere für Dienstleister als ungelesen
      console.log('🔍 [NOTIFICATION] Prüfe ob Benachrichtigung gesendet werden soll:', {
        isServiceProvider,
        isBautraeger,
        condition1: isServiceProvider && !isBautraeger,
        condition2: isBautraeger && !isServiceProvider,
        shouldSendNotification: (isServiceProvider && !isBautraeger) || (isBautraeger && !isServiceProvider)
      });
      
      if (true) { // Temporär: Immer Benachrichtigung senden
        try {
          console.log('📧 [NOTIFICATION] Sende Benachrichtigung...');
          await apiCall(`/milestones/${milestoneId}/mark-messages-unread`, {
            method: 'POST'
          });
          const recipient = isBautraeger ? 'Dienstleister' : 'Bauträger';
          console.log(`✅ Nachrichten als ungelesen markiert für ${recipient}`);
        } catch (error) {
          console.error('❌ Fehler beim Markieren der Nachrichten als ungelesen:', error);
          // Fehler soll den normalen Ablauf nicht blockieren
        }
      } else {
        console.log('⚠️ [NOTIFICATION] Benachrichtigung wird NICHT gesendet (Bedingung nicht erfüllt)');
      }
      
      // Benachrichtige Parent-Komponente, dass eine Nachricht gesendet wurde
      if (onMessageSent) {
        onMessageSent();
      }
      
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

  // Status badges helper
  const getStatusBadge = () => {
    switch (completionStatus) {
      case 'in_progress':
        return { text: 'In Bearbeitung', color: 'blue', icon: Clock };
      case 'completion_requested':
        return { text: 'Abnahme angefordert', color: 'yellow', icon: AlertTriangle };
      case 'under_review':
        return { text: 'Nachbesserung erforderlich', color: 'orange', icon: AlertTriangle };
      case 'completed':
        return { text: 'Abgeschlossen', color: 'green', icon: CheckCircle };
      case 'completed_with_defects':
        return { text: 'Mit Mängeln abgenommen', color: 'yellow', icon: AlertTriangle };
      default:
        return { text: 'In Bearbeitung', color: 'gray', icon: Clock };
    }
  };

  const statusBadge = getStatusBadge();
  const StatusIcon = statusBadge.icon;

  return (
    <div className="space-y-6">
      {/* Status Card - Always visible at top */}
      <div className="bg-gradient-to-br from-[#1a1a2e]/80 to-[#2c3539]/80 rounded-xl border border-gray-600/30 p-6 shadow-xl">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">Projektstatus</h3>
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 ${
                statusBadge.color === 'blue' ? 'bg-blue-500/20 border-blue-500/50 text-blue-300' :
                statusBadge.color === 'yellow' ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300' :
                statusBadge.color === 'orange' ? 'bg-orange-500/20 border-orange-500/50 text-orange-300' :
                statusBadge.color === 'green' ? 'bg-green-500/20 border-green-500/50 text-green-300' :
                'bg-gray-500/20 border-gray-500/50 text-gray-300'
              }`}>
                <StatusIcon size={18} />
                <span className="font-semibold">{statusBadge.text}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar - Large and prominent */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-300">Gesamtfortschritt</span>
            <span className="text-2xl font-bold text-[#ffbd59]">{progress}%</span>
          </div>
          <div className="relative w-full h-4 bg-gray-700/50 rounded-full overflow-hidden shadow-inner">
            <div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#ffbd59] via-[#ffa726] to-[#ff9800] rounded-full transition-all duration-500 ease-out shadow-lg"
              style={{ 
                width: `${progress}%`,
                boxShadow: progress > 0 ? '0 0 20px rgba(255, 189, 89, 0.5)' : 'none'
              }}
            >
              {progress > 10 && (
                <div className="absolute inset-0 flex items-center justify-end pr-2">
                  <span className="text-xs font-bold text-[#1a1a2e]">{progress}%</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Progress Milestones */}
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span className={progress >= 0 ? 'text-[#ffbd59] font-medium' : ''}>Start</span>
            <span className={progress >= 25 ? 'text-[#ffbd59] font-medium' : ''}>25%</span>
            <span className={progress >= 50 ? 'text-[#ffbd59] font-medium' : ''}>50%</span>
            <span className={progress >= 75 ? 'text-[#ffbd59] font-medium' : ''}>75%</span>
            <span className={progress >= 100 ? 'text-green-400 font-medium' : ''}>Fertig</span>
          </div>
        </div>
      </div>

      {/* Communication Section */}
      <div className="bg-gradient-to-br from-[#1a1a2e]/50 to-[#2c3539]/50 rounded-xl border border-gray-600/30 shadow-xl">
        {/* Header */}
        <div 
          className="flex items-center justify-between p-6 cursor-pointer hover:bg-[#1a1a2e]/30 transition-all duration-200 group"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#ffbd59]/20 rounded-lg group-hover:bg-[#ffbd59]/30 transition-colors">
              <MessageCircle size={20} className="text-[#ffbd59]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Baustand & Kommunikation</h3>
              <p className="text-sm text-gray-400">
                {updates.length} {updates.length === 1 ? 'Nachricht' : 'Nachrichten'}
                {updates.filter(u => u.attachments && u.attachments.length > 0).length > 0 && 
                  ` • ${updates.filter(u => u.attachments && u.attachments.length > 0).reduce((sum, u) => sum + (u.attachments?.length || 0), 0)} Anhänge`
                }
              </p>
            </div>
          </div>
          
          <div className={`transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
            <ChevronDown size={24} className="text-[#ffbd59]" />
          </div>
        </div>

        {isExpanded && (
          <div className="border-t border-gray-600/30">
            {/* Context Banner */}
            <div className="p-6 border-b border-gray-600/30">
              {hasAcceptedQuote ? (
                <div className="p-4 bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/30 rounded-xl backdrop-blur-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 p-2 bg-emerald-500/20 rounded-lg">
                      <CheckCircle size={20} className="text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-emerald-300 font-semibold mb-1 flex items-center gap-2">
                        🔒 Private Kommunikation
                      </h4>
                      <p className="text-sm text-gray-300 leading-relaxed">
                        Vertraulicher Austausch zwischen Ihnen und dem beauftragten Dienstleister. 
                        Dokumentieren Sie hier den Baustand mit Fotos und Updates.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-gradient-to-r from-[#ffbd59]/10 to-orange-500/10 border border-[#ffbd59]/30 rounded-xl backdrop-blur-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 p-2 bg-[#ffbd59]/20 rounded-lg">
                      <MessageCircle size={20} className="text-[#ffbd59]" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-[#ffbd59] font-semibold mb-1 flex items-center gap-2">
                        👁️ Öffentliche Kommunikation
                      </h4>
                      <p className="text-sm text-gray-300 leading-relaxed">
                        Öffentlicher Bereich für allgemeine Fragen zur Ausschreibung. 
                        Alle interessierten Dienstleister können diese Nachrichten sehen.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Messages Area */}
            <div 
              ref={messagesContainerRef} 
              className="p-6 max-h-96 overflow-y-auto custom-scrollbar"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#ffbd59 #1a1a2e'
              }}
            >
              {updates.length === 0 ? (
                <div className="text-center py-12">
                  <div className="inline-block p-4 bg-[#1a1a2e]/50 rounded-full mb-4">
                    <MessageCircle size={32} className="text-gray-500" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-300 mb-2">Noch keine Nachrichten</h4>
                  <p className="text-sm text-gray-400">
                    Beginnen Sie die Kommunikation und dokumentieren Sie den Baufortschritt!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {updates.filter(u => !u.parent_id).map(update => renderUpdate(update))}
                </div>
              )}
            </div>

            {/* Input Area */}
            {completionStatus !== 'archived' && (
              <div className="p-6 border-t border-gray-600/30 bg-gradient-to-br from-[#1a1a2e]/30 to-[#2c3539]/30">
                {replyTo && (
                  <div className="mb-3 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-center justify-between">
                    <span className="text-sm text-blue-300 font-medium">
                      💬 Antwort auf Nachricht #{replyTo}
                    </span>
                    <button
                      onClick={() => setReplyTo(null)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>
                )}
                
                <div className="space-y-4">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={hasAcceptedQuote ? "Baustand dokumentieren, Fragen stellen oder Updates teilen..." : "Frage zur Ausschreibung stellen..."}
                    className="w-full px-4 py-3 bg-[#1a1a2e] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffbd59] resize-none border border-gray-600/50 hover:border-[#ffbd59]/50 transition-colors placeholder-gray-500"
                    rows={3}
                  />
                  
                  {/* Selected Files Preview */}
                  {selectedFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedFiles.map((file, idx) => {
                        const isImage = file.type.startsWith('image/');
                        return (
                          <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-[#1a1a2e] border border-gray-600/50 rounded-lg group hover:border-[#ffbd59]/50 transition-colors">
                            {isImage ? (
                              <ImageIcon size={16} className="text-[#ffbd59]" />
                            ) : (
                              <FileText size={16} className="text-gray-400" />
                            )}
                            <span className="text-sm text-gray-300 max-w-[150px] truncate">{file.name}</span>
                            <button
                              onClick={() => removeFile(idx)}
                              className="text-gray-400 hover:text-red-400 transition-colors"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3 flex-wrap">
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
                      className="flex items-center gap-2 px-4 py-2 bg-[#1a1a2e] border border-gray-600/50 text-gray-300 hover:text-[#ffbd59] hover:border-[#ffbd59]/50 rounded-lg transition-colors"
                      title="Fotos oder Dokumente anhängen"
                    >
                      <Paperclip size={18} />
                      <span className="text-sm font-medium hidden sm:inline">Anhängen</span>
                    </button>
                    
                    {isBautraeger && (
                      <button
                        onClick={() => setShowDefectModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                        title="Mangel dokumentieren"
                      >
                        <AlertTriangle size={18} />
                        <span className="text-sm font-medium hidden sm:inline">Mangel melden</span>
                      </button>
                    )}
                    
                    <div className="flex-1" />
                    
                    {/* Progress Slider for Service Provider */}
                    {isServiceProvider && hasAcceptedQuote && completionStatus !== 'completed' && (
                      <div className="flex items-center gap-3 px-4 py-2 bg-[#1a1a2e] border border-gray-600/50 rounded-lg">
                        <span className="text-xs sm:text-sm text-gray-400 font-medium">Fortschritt:</span>
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
                          className="w-24 sm:w-32"
                          style={{
                            background: `linear-gradient(to right, #ffbd59 0%, #ffa726 ${progress}%, #4a5568 ${progress}%, #4a5568 100%)`
                          }}
                        />
                        <span className="text-white font-bold text-sm min-w-[3rem] text-right">{progress}%</span>
                      </div>
                    )}
                    
                    <button
                      onClick={() => handleSubmit('comment')}
                      disabled={isLoading || (!newMessage.trim() && selectedFiles.length === 0)}
                      className="px-6 py-2.5 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-[#1a1a2e] font-bold rounded-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#1a1a2e]"></div>
                          <span>Wird gesendet...</span>
                        </>
                      ) : (
                        <>
                          <Send size={18} />
                          <span>Senden</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Completion Workflow Section - Service Provider */}
      {isServiceProvider && hasAcceptedQuote && completionStatus !== 'completed' && (
        <div className="bg-gradient-to-br from-[#1a1a2e]/80 to-[#2c3539]/80 rounded-xl border border-gray-600/30 p-6 shadow-xl">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <CheckCircle size={20} className="text-green-400" />
              Fertigstellung melden
            </h3>
            <p className="text-sm text-gray-400">
              Wenn Sie alle Arbeiten abgeschlossen haben, können Sie das Gewerk als fertiggestellt markieren.
            </p>
          </div>

          <div className="relative">
            <button
              onClick={progress === 100 ? onCompletionRequest : undefined}
              disabled={progress !== 100 || completionStatus !== 'in_progress'}
              className={`w-full font-bold py-4 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-3 text-lg ${
                progress === 100 && completionStatus === 'in_progress'
                  ? 'bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 text-white hover:shadow-2xl hover:shadow-green-500/50 hover:scale-105 active:scale-95 cursor-pointer'
                  : 'bg-gray-600/20 text-gray-500 cursor-not-allowed border-2 border-gray-600/30'
              }`}
            >
              <CheckCircle size={24} className={progress === 100 && completionStatus === 'in_progress' ? 'animate-pulse' : ''} />
              <span>Als fertiggestellt markieren</span>
            </button>
            
            {/* Info Box */}
            <div className={`mt-4 p-4 rounded-xl border-2 transition-all duration-300 ${
              progress === 100 && completionStatus === 'in_progress'
                ? 'bg-green-500/10 border-green-500/30'
                : 'bg-blue-500/10 border-blue-500/30'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`flex-shrink-0 p-2 rounded-lg ${
                  progress === 100 && completionStatus === 'in_progress'
                    ? 'bg-green-500/20'
                    : 'bg-blue-500/20'
                }`}>
                  {progress === 100 && completionStatus === 'in_progress' ? (
                    <CheckCircle size={20} className="text-green-400" />
                  ) : (
                    <AlertTriangle size={20} className="text-blue-400" />
                  )}
                </div>
                <div className="flex-1">
                  {progress === 100 && completionStatus === 'in_progress' ? (
                    <>
                      <h4 className="text-green-300 font-semibold mb-1">Bereit zur Fertigstellung!</h4>
                      <p className="text-sm text-gray-300">
                        Der Fortschritt steht auf 100%. Sie können das Gewerk jetzt als fertiggestellt markieren. 
                        Der Bauträger wird benachrichtigt und führt die Abnahme durch.
                      </p>
                    </>
                  ) : progress !== 100 ? (
                    <>
                      <h4 className="text-blue-300 font-semibold mb-1">Noch {100 - progress}% zu erledigen</h4>
                      <p className="text-sm text-gray-300">
                        Setzen Sie den Fortschritt auf 100%, um die Fertigstellung zu melden. 
                        Aktuell: <span className="font-bold text-[#ffbd59]">{progress}%</span>
                      </p>
                    </>
                  ) : (
                    <>
                      <h4 className="text-blue-300 font-semibold mb-1">Status: {statusBadge.text}</h4>
                      <p className="text-sm text-gray-300">
                        Das Gewerk befindet sich bereits in einem anderen Status und kann nicht erneut als fertiggestellt markiert werden.
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bauträger: Completion Response Actions */}
      {completionStatus === 'completion_requested' && isBautraeger && !hideCompletionResponseControls && (
        <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-xl border border-yellow-500/30 p-6 shadow-xl">
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <AlertTriangle size={20} className="text-yellow-400" />
              </div>
              <h3 className="text-lg font-bold text-yellow-300">Abnahme erforderlich</h3>
            </div>
            <p className="text-gray-300">
              Der Dienstleister hat das Gewerk als fertiggestellt gemeldet. Bitte prüfen Sie die Arbeiten vor Ort 
              und entscheiden Sie über die Abnahme.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => onCompletionResponse?.(true, 'Arbeiten wurden geprüft und abgenommen.')}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-3 px-6 rounded-xl hover:shadow-xl hover:shadow-green-500/30 hover:scale-105 active:scale-95 transition-all duration-200"
            >
              <CheckCircle size={20} />
              Abnahme bestätigen
            </button>
            <button
              onClick={() => {
                const message = prompt('Begründung für Nachbesserung:');
                if (message) {
                  const today = new Date();
                  const defaultDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
                  const defaultDateString = defaultDate.toISOString().split('T')[0];
                  
                  const deadline = prompt(
                    `Wiedervorlage-Datum für finale Abnahme (YYYY-MM-DD):\n\n` +
                    `Bei Eingabe eines Datums wird automatisch ein Wiedervorlage-Termin erstellt.`,
                    defaultDateString
                  );
                  
                  if (deadline) {
                    const deadlineDate = new Date(deadline);
                    if (isNaN(deadlineDate.getTime()) || deadlineDate <= today) {
                      alert('⚠️ Bitte geben Sie ein gültiges zukünftiges Datum ein.');
                      return;
                    }
                  }
                  
                  onCompletionResponse?.(false, message, deadline || undefined);
                }
              }}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold py-3 px-6 rounded-xl hover:shadow-xl hover:shadow-red-500/30 hover:scale-105 active:scale-95 transition-all duration-200"
            >
              <AlertTriangle size={20} />
              Nachbesserung anfordern
            </button>
          </div>
        </div>
      )}
      
      {/* Completed Status Display */}
      {completionStatus === 'completed' && (
        <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl border border-green-500/30 p-6 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <CheckCircle size={24} className="text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-green-300">Gewerk abgeschlossen</h3>
              <p className="text-sm text-gray-300">Das Gewerk wurde erfolgreich abgenommen und archiviert.</p>
            </div>
          </div>
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
