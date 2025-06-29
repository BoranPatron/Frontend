import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  MessageCircle,
  Building,
  ArrowRight
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
  project_id: number;
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

export default function GlobalMessages() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'read'>('all');
  const [selectedProject, setSelectedProject] = useState<number | null>(null);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      setLoading(true);
      // Mock data for demonstration
      const mockMessages: Message[] = [
        {
          id: 1,
          content: "Hallo! Ich habe eine Frage zum Bauplan.",
          sender_id: 2,
          project_id: 1,
          message_type: 'text',
          is_read: false,
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          sender: { first_name: 'Johann', last_name: 'Doe' }
        },
        {
          id: 2,
          content: "Termin für Besichtigung ist bestätigt.",
          sender_id: 3,
          project_id: 1,
          message_type: 'notification',
          is_read: true,
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          sender: { first_name: 'Maria', last_name: 'Schmidt' }
        },
        {
          id: 3,
          content: "Neues Dokument hochgeladen: Elektroplan.pdf",
          sender_id: 4,
          project_id: 2,
          message_type: 'document',
          is_read: false,
          created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          sender: { first_name: 'Peter', last_name: 'Müller' }
        }
      ];

      const mockProjects: Project[] = [
        { id: 1, name: 'Einfamilienhaus Bau', description: 'Neubau Einfamilienhaus' },
        { id: 2, name: 'Bürogebäude Renovierung', description: 'Renovierung Bürogebäude' },
        { id: 3, name: 'Gartenhaus Projekt', description: 'Gartenhaus Bau' }
      ];

      setMessages(mockMessages);
      setProjects(mockProjects);
    } catch (err) {
      setError('Fehler beim Laden der Nachrichten');
      console.error('Error loading messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (messageId: number) => {
    try {
      await markMessageRead(messageId);
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, is_read: true } : msg
      ));
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
    
    const matchesProject = !selectedProject || message.project_id === selectedProject;
    
    return matchesSearch && matchesFilter && matchesProject;
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

  const getProjectName = (projectId: number) => {
    return projects.find(p => p.id === projectId)?.name || `Projekt ${projectId}`;
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
              <span className="text-sm text-gray-500">
                {filteredMessages.length} Nachrichten
              </span>
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
                value={selectedProject || ''}
                onChange={(e) => setSelectedProject(e.target.value ? parseInt(e.target.value) : null)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
              >
                <option value="">Alle Projekte</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              
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
                  {searchTerm || filterType !== 'all' || selectedProject
                    ? 'Keine Nachrichten gefunden.' 
                    : 'Noch keine Nachrichten vorhanden.'}
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
                      
                      <div className="text-gray-700 whitespace-pre-wrap mb-2">
                        {message.content}
                      </div>
                      
                      {/* Project Info */}
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Building size={12} />
                        <span>{getProjectName(message.project_id)}</span>
                        <Link
                          to={`/messages/${message.project_id}`}
                          className="text-[#ffbd59] hover:text-[#e6a800] flex items-center gap-1"
                        >
                          Zum Projekt
                          <ArrowRight size={10} />
                        </Link>
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