import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Send, 
  MessageSquare, 
  User, 
  Clock, 
  FileText,
  Plus,
  Search,
  Filter
} from 'lucide-react';
import { getMessages, createMessage } from '../api/messageService';
import { getProject } from '../api/projectService';

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
}

interface Project {
  id: number;
  name: string;
  description: string;
}

export default function ProjectMessages() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const [messagesData, projectData] = await Promise.all([
        getMessages(parseInt(id)),
        getProject(parseInt(id))
      ]);
      
      setMessages(messagesData.messages || []);
      setProject(projectData);
    } catch (e: any) {
      console.error('Error loading messages:', e);
      setError(e.message || 'Fehler beim Laden der Nachrichten');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !id) return;

    try {
      setSending(true);
      await createMessage({
        project_id: parseInt(id),
        content: newMessage.trim(),
        message_type: 'text'
      });
      
      setNewMessage('');
      await loadData(); // Lade Nachrichten neu
    } catch (e: any) {
      console.error('Error sending message:', e);
      setError('Fehler beim Senden der Nachricht');
    } finally {
      setSending(false);
    }
  };

  const filteredMessages = messages.filter(message =>
    message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.sender?.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.sender?.last_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#51646f] via-[#3d4952] to-[#2c3539] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ffbd59] mx-auto mb-4"></div>
          <p className="text-white text-lg">Lade Nachrichten...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#51646f] via-[#3d4952] to-[#2c3539] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-lg">{error || 'Projekt nicht gefunden'}</p>
          <button
            onClick={() => navigate('/projects')}
            className="mt-4 px-6 py-2 bg-[#ffbd59] text-[#3d4952] rounded-lg font-semibold hover:bg-[#ffa726] transition"
          >
            Zurück zu Projekten
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#51646f] via-[#3d4952] to-[#2c3539]">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#3d4952]/95 to-[#51646f]/95 backdrop-blur-lg text-white px-8 py-6 shadow-2xl border-b border-[#ffbd59]/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(`/projects/${id}`)}
              className="p-2 bg-[#51646f] hover:bg-[#607583] rounded-xl transition-colors duration-300"
            >
              <ArrowLeft size={20} className="text-[#ffbd59]" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-[#ffbd59] flex items-center gap-2">
                <MessageSquare size={28} />
                Nachrichten
              </h1>
              <p className="text-gray-300">{project.name}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-col h-[calc(100vh-120px)]">
        {/* Search Bar */}
        <div className="p-6 pb-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Nachrichten durchsuchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
            />
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 p-6 pt-4 overflow-hidden">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 h-full flex flex-col">
            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-6">
              {filteredMessages.length === 0 ? (
                <div className="text-center text-gray-400 py-12">
                  <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Noch keine Nachrichten</p>
                  <p className="text-sm">Senden Sie die erste Nachricht für dieses Projekt</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${message.sender_id === 1 ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl p-4 ${
                          message.sender_id === 1
                            ? 'bg-[#ffbd59] text-[#3d4952]'
                            : 'bg-white/20 text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <User size={16} className="opacity-70" />
                          <span className="text-sm font-medium">
                            {message.sender?.first_name} {message.sender?.last_name}
                          </span>
                          <Clock size={14} className="opacity-70" />
                          <span className="text-xs opacity-70">
                            {formatDate(message.created_at)}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed">{message.content}</p>
                        {message.message_type === 'document' && (
                          <div className="mt-2 flex items-center gap-2 text-xs opacity-70">
                            <FileText size={14} />
                            <span>Dokument angehängt</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="p-6 border-t border-white/20">
              <form onSubmit={handleSendMessage} className="flex gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Nachricht eingeben..."
                    className="w-full px-4 py-3 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                    disabled={sending}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-white/10 rounded-lg transition"
                  >
                    <Plus size={20} className="text-gray-400" />
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="px-6 py-3 bg-[#ffbd59] text-[#3d4952] rounded-xl font-semibold hover:bg-[#ffa726] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Send size={18} />
                  {sending ? 'Sende...' : 'Senden'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 