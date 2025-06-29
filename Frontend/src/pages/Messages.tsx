import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Send, 
  MessageCircle, 
  Clock, 
  Search, 
  Filter, 
  Check, 
  X, 
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  User
} from 'lucide-react';
import { getMessages, createMessage, markMessageRead } from '../api/messageService';
import { useAuth } from '../context/AuthContext';
import ProjectBreadcrumb from '../components/ProjectBreadcrumb';

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
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Lade Nachrichten...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6">
            <h2 className="text-xl font-bold text-red-800 mb-4">Fehler beim Laden</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Seite neu laden
            </button>
          </div>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Zurück zum Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ProjectBreadcrumb />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Nachrichten</h1>
                <p className="text-gray-600">
                  Projektkommunikation & Chat
                  {projectId && (
                    <span className="block text-sm text-blue-600 mt-1">
                      Projekt-ID: {projectId}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 flex items-center justify-between mb-6 rounded-xl">
            <div className="flex items-center gap-3">
              <AlertTriangle size={20} />
              <span>{error}</span>
            </div>
            <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">
              <XCircle size={20} />
            </button>
          </div>
        )}

        {/* Success Banner */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-4 flex items-center justify-between mb-6 rounded-xl">
            <div className="flex items-center gap-3">
              <CheckCircle size={20} />
              <span>{success}</span>
            </div>
            <button onClick={() => setSuccess('')} className="text-green-500 hover:text-green-700">
              <XCircle size={20} />
            </button>
          </div>
        )}

        <div className="max-w-4xl mx-auto">
          {/* Chat Container */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Chat Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Projekt Chat</h2>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Online</span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="h-96 overflow-y-auto p-6 space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md ${message.sender_id === user?.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'} rounded-2xl px-4 py-2 shadow-sm`}>
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0">
                        {getMessageTypeIcon(message.message_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{message.content}</p>
                        <div className={`flex items-center gap-2 mt-1 text-xs ${message.sender_id === user?.id ? 'text-blue-100' : 'text-gray-500'}`}>
                          <span>{formatDate(message.created_at)}</span>
                          {message.is_read && (
                            <CheckCircle size={12} className="text-green-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <MessageCircle size={48} className="text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Keine Nachrichten</h3>
                  <p className="text-gray-500">Senden Sie die erste Nachricht, um zu beginnen.</p>
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="px-6 py-4 border-t border-gray-200">
              <form onSubmit={handleSendMessage} className="flex gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Nachricht eingeben..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  <Send size={20} />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 