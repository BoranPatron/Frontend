import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Send, 
  Search, 
  Filter, 
  MoreHorizontal, 
  User, 
  Clock, 
  FileText,
  Check,
  X,
  MessageCircle
} from 'lucide-react';
import { getMessages, createMessage, markMessageRead } from '../api/messageService';
import { useAuth } from '../context/AuthContext';

interface Message {
  id: number;
  content: string;
  sender_id: number;
  recipient_id?: number;
  message_type: 'text' | 'document' | 'system' | 'notification';
  is_read: boolean;
  created_at: string;
  sender?: {
    first_name: string;
    last_name: string;
  };
  recipient?: {
    first_name: string;
    last_name: string;
  };
}

interface Project {
  id: number;
  name: string;
  description: string;
}

export default function Messages() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'read'>('all');

  useEffect(() => {
    if (projectId) {
      loadMessages();
    }
  }, [projectId]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await getMessages(parseInt(projectId!));
      setMessages(response.messages || []);
      setProject({
        id: parseInt(projectId!),
        name: `Projekt ${projectId}`,
        description: 'Projektbeschreibung'
      });
    } catch (err) {
      setError('Fehler beim Laden der Nachrichten');
      console.error('Error loading messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !projectId) return;

    try {
      const messageData = {
        project_id: parseInt(projectId),
        content: newMessage.trim(),
        message_type: 'text' as const
      };

      await createMessage(messageData);
      setNewMessage('');
      await loadMessages(); // Reload messages
    } catch (err) {
      setError('Fehler beim Senden der Nachricht');
      console.error('Error sending message:', err);
    }
  };

  const handleMarkAsRead = async (messageId: number) => {
    try {
      await markMessageRead(messageId);
      await loadMessages(); // Reload messages
    } catch (err) {
      console.error('Error marking message as read:', err);
    }
  };

  const filteredMessages = messages.filter(message => {
    const matchesSearch = message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.sender?.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.sender?.last_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || 
                         (filterType === 'unread' && !message.is_read) ||
                         (filterType === 'read' && message.is_read);
    
    return matchesSearch && matchesFilter;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Gerade eben';
    } else if (diffInHours < 24) {
      return `Vor ${Math.floor(diffInHours)} Stunden`;
    } else {
      return date.toLocaleDateString('de-DE');
    }
  };

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'document':
        return <FileText size={16} className="text-blue-500" />;
      case 'system':
        return <Check size={16} className="text-green-500" />;
      case 'notification':
        return <X size={16} className="text-red-500" />;
      default:
        return <User size={16} className="text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ffbd59] mx-auto"></div>
          <p className="mt-4 text-gray-600">Lade Nachrichten...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">Nachrichten</h1>
              {project && (
                <div className="text-sm text-gray-500">
                  Projekt: <span className="font-medium text-gray-700">{project.name}</span>
                </div>
              )}
            </div>
            
            {/* Search and Filter */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Nachrichten durchsuchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                />
              </div>
              
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
              >
                <option value="all">Alle Nachrichten</option>
                <option value="unread">Ungelesen</option>
                <option value="read">Gelesen</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Messages List */}
          <div className="h-96 overflow-y-auto p-6">
            {filteredMessages.length === 0 ? (
              <div className="text-center py-12">
                <MessageCircle className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Keine Nachrichten</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || filterType !== 'all' 
                    ? 'Keine Nachrichten gefunden.' 
                    : 'Noch keine Nachrichten in diesem Projekt.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-4 p-4 rounded-lg border ${
                      message.is_read ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'
                    } ${message.sender_id === user?.id ? 'flex-row-reverse' : ''}`}
                  >
                    {/* Avatar */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full bg-[#ffbd59] flex items-center justify-center ${
                      message.sender_id === user?.id ? 'order-2' : ''
                    }`}>
                      <span className="text-white font-medium text-sm">
                        {message.sender?.first_name?.[0]}{message.sender?.last_name?.[0]}
                      </span>
                    </div>

                    {/* Message Content */}
                    <div className={`flex-1 ${message.sender_id === user?.id ? 'text-right' : ''}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">
                          {message.sender?.first_name} {message.sender?.last_name}
                        </span>
                        {getMessageTypeIcon(message.message_type)}
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock size={12} />
                          {formatDate(message.created_at)}
                        </span>
                        {!message.is_read && message.sender_id !== user?.id && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            Neu
                          </span>
                        )}
                      </div>
                      
                      <div className="text-gray-700 whitespace-pre-wrap">
                        {message.content}
                      </div>
                      
                      {!message.is_read && message.sender_id !== user?.id && (
                        <button
                          onClick={() => handleMarkAsRead(message.id)}
                          className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                        >
                          Als gelesen markieren
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Message Input */}
          <div className="border-t border-gray-200 p-6">
            <form onSubmit={handleSendMessage} className="flex gap-4">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Nachricht eingeben..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                disabled={!projectId}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || !projectId}
                className="px-6 py-3 bg-[#ffbd59] text-white rounded-lg hover:bg-[#e6a800] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <Send size={16} />
                Senden
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg">
          {error}
        </div>
      )}
    </div>
  );
} 