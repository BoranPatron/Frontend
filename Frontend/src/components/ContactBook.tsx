import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Search, 
  Plus, 
  Star, 
  Phone, 
  Mail, 
  Globe, 
  MapPin, 
  Building, 
  User, 
  Edit, 
  Trash2, 
  Filter, 
  SortAsc, 
  SortDesc,
  Tag,
  Calendar,
  MessageCircle,
  ExternalLink,
  Heart,
  Briefcase,
  FileText,
  Settings,
  ChevronDown,
  ChevronUp,
  Grid,
  List,
  UserPlus,
  Download,
  Upload,
  Zap,
  TrendingUp,
  Award,
  Target,
  Eye,
  Bell,
  BellOff,
  X as XIcon
} from 'lucide-react';
import { contactService, type Contact } from '../api/contactService';
import { useAuth } from '../context/AuthContext';
import { TRADE_CATEGORIES, getCategoryLabel, getCategoryLabelWithEmoji } from '../constants/tradeCategories';
import { notificationPreferenceService, type NotificationPreference } from '../api/notificationPreferenceService';
import NotificationPreferences from './NotificationPreferences';

interface ContactBookProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedContact?: Contact;
}

type ViewMode = 'grid' | 'list';
type SortField = 'name' | 'category' | 'rating' | 'created_at' | 'last_contact';
type SortDirection = 'asc' | 'desc';

export default function ContactBook({ isOpen, onClose, preselectedContact }: ContactBookProps) {
  const { user } = useAuth();
  
  // State Management
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(preselectedContact || null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);

  // Load contacts on mount
  useEffect(() => {
    if (isOpen) {
      loadContacts();
    }
  }, [isOpen]);

  // Event listeners for contact updates
  useEffect(() => {
    const handleContactUpdate = () => {
      loadContacts();
    };

    window.addEventListener('contactCreated', handleContactUpdate);
    window.addEventListener('contactUpdated', handleContactUpdate);
    window.addEventListener('contactDeleted', handleContactUpdate);

    return () => {
      window.removeEventListener('contactCreated', handleContactUpdate);
      window.removeEventListener('contactUpdated', handleContactUpdate);
      window.removeEventListener('contactDeleted', handleContactUpdate);
    };
  }, []);

  // Load contacts from API
  const loadContacts = async () => {
    setLoading(true);
    try {
      const data = await contactService.getAllContactsWithElegantUserData();
      console.log('📋 Kontakte geladen:', data.length);
      
      // Debug: Zeige Details für jeden Kontakt
      data.forEach((contact, index) => {
        console.log(`👤 Kontakt ${index + 1}:`, {
          id: contact.id,
          company_name: contact.company_name,
          company_address: contact.company_address,
          user_company_address: contact.user_company_address,
          phone: contact.phone,
          website: contact.website,
          service_provider_id: contact.service_provider_id,
          data_source: contact.data_source,
          hasAddress: !!(contact.company_address || contact.user_company_address),
          allFields: Object.keys(contact)
        });
      });
      
      setContacts(data);
    } catch (error) {
      console.error('Fehler beim Laden der Kontakte:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort contacts
  const filteredAndSortedContacts = useMemo(() => {
    let filtered = [...contacts];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(contact => 
        contact.company_name?.toLowerCase().includes(query) ||
        contact.contact_person?.toLowerCase().includes(query) ||
        contact.email?.toLowerCase().includes(query) ||
        contact.phone?.toLowerCase().includes(query) ||
        contact.category?.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(contact => contact.category === selectedCategory);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortField) {
        case 'name':
          aValue = a.company_name?.toLowerCase() || '';
          bValue = b.company_name?.toLowerCase() || '';
          break;
        case 'category':
          aValue = a.category || '';
          bValue = b.category || '';
          break;
        case 'rating':
          aValue = a.rating || 0;
          bValue = b.rating || 0;
          break;
        case 'created_at':
          aValue = a.created_at ? new Date(a.created_at).getTime() : 0;
          bValue = b.created_at ? new Date(b.created_at).getTime() : 0;
          break;
        case 'last_contact':
          aValue = a.last_contact ? new Date(a.last_contact).getTime() : 0;
          bValue = b.last_contact ? new Date(b.last_contact).getTime() : 0;
          break;
        default:
          return 0;
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [contacts, searchQuery, selectedCategory, sortField, sortDirection]);

  // Get unique categories
  const categories = useMemo(() => {
    const uniqueCategories = new Set(contacts.map(c => c.category).filter(Boolean));
    return Array.from(uniqueCategories);
  }, [contacts]);


  // Handle delete contact
  const handleDeleteContact = async () => {
    if (!contactToDelete) return;
    
    try {
      await contactService.deleteContact(contactToDelete.id);
      setShowDeleteConfirm(false);
      setContactToDelete(null);
      setSelectedContact(null);
      await loadContacts();
    } catch (error) {
      console.error('Fehler beim Löschen des Kontakts:', error);
    }
  };

  // Get category color
  const getCategoryColor = (category?: string) => {
    if (!category) return 'bg-gray-500';
    
    const colors: Record<string, string> = {
      'electrical': 'bg-yellow-500',
      'plumbing': 'bg-blue-500',
      'heating': 'bg-orange-500',
      'carpentry': 'bg-amber-600',
      'painting': 'bg-purple-500',
      'flooring': 'bg-teal-500',
      'roofing': 'bg-red-500',
      'insulation': 'bg-green-500',
      'windows_doors': 'bg-indigo-500',
      'landscaping': 'bg-emerald-500'
    };
    
    return colors[category] || 'bg-gray-500';
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-lg flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-[#1a1a2e]/95 to-[#2c3539]/95 backdrop-blur-xl rounded-2xl shadow-[0_0_60px_rgba(255,189,89,0.15)] border border-white/20 w-full max-w-7xl h-[90vh] overflow-hidden relative flex flex-col">
        
        {/* Header */}
        <div className="relative flex items-center justify-between p-6 border-b border-white/10 bg-gradient-to-r from-[#3d4952]/95 to-[#51646f]/95 backdrop-blur-lg">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#ffbd59]/5 via-transparent to-[#ffa726]/5 opacity-50"></div>
          <div className="absolute inset-0 rounded-t-2xl bg-gradient-to-r from-[#ffbd59]/10 to-[#ffa726]/10 blur-xl opacity-30"></div>
          
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-xl flex items-center justify-center text-white font-bold shadow-[0_0_20px_rgba(255,189,89,0.4)]">
              <User size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white leading-tight">
                Kontaktbuch
              </h2>
              <p className="text-sm text-gray-300">
                {filteredAndSortedContacts.length} {filteredAndSortedContacts.length === 1 ? 'Kontakt' : 'Kontakte'}
              </p>
            </div>
          </div>
          
          <div className="relative flex items-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] hover:from-[#ffa726] hover:to-[#ff9800] text-[#2c3539] rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-[0_0_20px_rgba(255,189,89,0.3)] hover:shadow-[0_0_30px_rgba(255,189,89,0.5)]"
            >
              <UserPlus size={18} />
              <span className="hidden sm:inline">Neuer Kontakt</span>
            </button>
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-all duration-200 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]"
              title="Schließen"
            >
              <X size={24} className="text-gray-300 hover:text-white transition-colors" />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center gap-4 p-4 border-b border-white/10 bg-gradient-to-r from-[#2c3539]/50 to-[#3d4952]/50 backdrop-blur-sm flex-shrink-0">
          {/* Subtle glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#ffbd59]/3 via-transparent to-[#ffa726]/3 opacity-60"></div>
          
          {/* Search */}
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-300" />
            <input
              type="text"
              placeholder="Kontakte durchsuchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg focus:ring-2 focus:ring-[#ffbd59]/50 focus:border-[#ffbd59]/50 text-white placeholder-gray-300 transition-all duration-200 hover:bg-white/10 hover:border-white/20"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg focus:ring-2 focus:ring-[#ffbd59]/50 focus:border-[#ffbd59]/50 text-white transition-all duration-200 hover:bg-white/10 hover:border-white/20"
          >
            <option value="all">Alle Kategorien</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {getCategoryLabel(cat)}
              </option>
            ))}
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded transition-all duration-200 ${
                viewMode === 'grid' 
                  ? 'bg-[#ffbd59] text-[#2c3539] shadow-[0_0_15px_rgba(255,189,89,0.3)]' 
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
              title="Kachelansicht"
            >
              <Grid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded transition-all duration-200 ${
                viewMode === 'list' 
                  ? 'bg-[#ffbd59] text-[#2c3539] shadow-[0_0_15px_rgba(255,189,89,0.3)]' 
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
              title="Listenansicht"
            >
              <List size={18} />
            </button>
          </div>

        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ffbd59] mx-auto mb-4 shadow-[0_0_20px_rgba(255,189,89,0.3)]"></div>
                <p className="text-gray-300">Lade Kontakte...</p>
              </div>
            </div>
          ) : filteredAndSortedContacts.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="relative mb-6">
                  <User size={64} className="text-gray-400 mx-auto mb-4" />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#ffbd59]/10 to-[#ffa726]/10 blur-xl opacity-50"></div>
                </div>
                <h3 className="text-xl font-semibold text-gray-200 mb-2">
                  {searchQuery || selectedCategory !== 'all' 
                    ? 'Keine Kontakte gefunden' 
                    : 'Noch keine Kontakte'}
                </h3>
                <p className="text-gray-300 mb-4">
                  {searchQuery || selectedCategory !== 'all' 
                    ? 'Versuchen Sie andere Suchkriterien' 
                    : 'Fügen Sie Ihren ersten Kontakt hinzu'}
                </p>
                {!searchQuery && selectedCategory === 'all' && (
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] hover:from-[#ffa726] hover:to-[#ff9800] text-[#2c3539] rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-[0_0_20px_rgba(255,189,89,0.3)] hover:shadow-[0_0_30px_rgba(255,189,89,0.5)] mx-auto"
                  >
                    <UserPlus size={18} />
                    Neuer Kontakt
                  </button>
                )}
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            // Grid View
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredAndSortedContacts.map(contact => (
                <div
                  key={contact.id}
                  className="group relative bg-gradient-to-br from-[#2c3539]/60 to-[#1a1a2e]/60 backdrop-blur-sm rounded-xl border border-white/10 p-4 hover:border-[#ffbd59]/50 transition-all duration-300 cursor-pointer hover:shadow-[0_0_25px_rgba(255,189,89,0.15)] hover:scale-[1.02]"
                  onClick={() => setSelectedContact(contact)}
                >
                  {/* Glow effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#ffbd59]/5 via-transparent to-[#ffa726]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#ffbd59]/10 to-[#ffa726]/10 blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                  <div className="relative flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-lg ${getCategoryColor(contact.category)}`}>
                        <Building size={20} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white truncate group-hover:text-[#ffbd59] transition-colors duration-200">
                          {contact.company_name}
                        </h3>
                        {contact.category && (
                          <p className="text-xs text-gray-300 truncate">
                            {getCategoryLabel(contact.category)}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Benachrichtigungs-Status anzeigen */}
                    {contact.service_provider_id && (
                      <NotificationStatusIndicator contactId={contact.id} />
                    )}
                  </div>

                  {contact.contact_person && (
                    <div className="flex items-center gap-2 text-sm text-gray-200 mb-2">
                      <User size={14} className="text-gray-300" />
                      <span className="truncate">{contact.contact_person}</span>
                    </div>
                  )}

                  {contact.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-200 mb-2">
                      <Phone size={14} className="text-gray-300" />
                      <span className="truncate">{contact.phone}</span>
                    </div>
                  )}

                   {contact.email && (
                     <div className="flex items-center gap-2 text-sm text-gray-200 mb-3">
                       <Mail size={14} className="text-gray-300" />
                       <span className="truncate">{contact.email}</span>
                     </div>
                   )}

                   {/* Adresse */}
                   {(contact.company_address || contact.user_company_address) && (
                     <div className="flex items-center gap-2 text-sm text-gray-200 mb-2">
                       <MapPin size={14} className="text-gray-300" />
                       <span className="truncate">
                         {contact.company_address || contact.user_company_address}
                       </span>
                     </div>
                   )}
                   {(contact.address_street || contact.address_city) && (
                     <div className="flex items-center gap-2 text-sm text-gray-200 mb-2">
                       <MapPin size={14} className="text-gray-300" />
                       <span className="truncate">
                         {contact.address_street && contact.address_city 
                           ? `${contact.address_street}, ${contact.address_city}`
                           : contact.address_street || contact.address_city
                         }
                       </span>
                     </div>
                   )}
                   {/* Fallback für fehlende Adresse */}
                   {!contact.company_address && !contact.user_company_address && !contact.address_street && !contact.address_city && (
                     <div className="flex items-center gap-2 text-gray-400 text-xs">
                       <MapPin size={12} className="text-gray-400" />
                       <span>Adresse wird geladen...</span>
                       <button
                         onClick={(e) => {
                           e.stopPropagation();
                           setSelectedContact(contact);
                           setShowEditModal(true);
                         }}
                         className="ml-2 px-2 py-1 bg-[#ffbd59]/20 text-[#ffbd59] rounded text-xs hover:bg-[#ffbd59]/30 transition-colors"
                       >
                         Bearbeiten
                       </button>
                     </div>
                   )}
                 </div>
              ))}
            </div>
          ) : (
            // List View
            <div className="space-y-3">
              {filteredAndSortedContacts.map(contact => (
                <div
                  key={contact.id}
                  className="group relative bg-gradient-to-br from-[#2c3539]/60 to-[#1a1a2e]/60 backdrop-blur-sm rounded-lg border border-white/10 p-4 hover:border-[#ffbd59]/50 transition-all duration-300 cursor-pointer hover:shadow-[0_0_25px_rgba(255,189,89,0.15)] hover:scale-[1.01]"
                  onClick={() => setSelectedContact(contact)}
                >
                  {/* Glow effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#ffbd59]/5 via-transparent to-[#ffa726]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#ffbd59]/10 to-[#ffa726]/10 blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${getCategoryColor(contact.category)}`}>
                      <Building size={24} className="text-white" />
                    </div>

                    <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div>
                        <h3 className="font-semibold text-white mb-1">{contact.company_name}</h3>
                        {contact.category && (
                          <p className="text-xs text-gray-400">
                            {getCategoryLabel(contact.category)}
                          </p>
                        )}
                      </div>

                      <div className="text-sm text-gray-300">
                        {contact.contact_person && (
                          <div className="flex items-center gap-2 mb-1">
                            <User size={14} className="text-gray-400" />
                            <span>{contact.contact_person}</span>
                          </div>
                        )}
                      </div>

                      <div className="text-sm text-gray-300">
                        {contact.phone && (
                          <div className="flex items-center gap-2 mb-1">
                            <Phone size={14} className="text-gray-400" />
                            <span>{contact.phone}</span>
                          </div>
                        )}
                        {contact.email && (
                          <div className="flex items-center gap-2">
                            <Mail size={14} className="text-gray-400" />
                            <span className="truncate">{contact.email}</span>
                          </div>
                        )}
                      </div>

                        <div className="text-sm text-gray-300">
                          {(contact.company_address || contact.user_company_address) && (
                            <div className="mb-1">
                              <div className="flex items-center gap-2">
                                <MapPin size={14} className="text-gray-400" />
                                <span className="text-xs text-gray-500">
                                  Adresse:
                                </span>
                                {contact.data_source && (
                                  <span className="text-xs text-gray-500">
                                    ({contact.data_source === 'user' ? 'User' : contact.data_source === 'merged' ? 'Merged' : 'Contact'})
                                  </span>
                                )}
                              </div>
                              <div className="mt-1 ml-6">
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.company_address || contact.user_company_address)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {contact.company_address || contact.user_company_address}
                                </a>
                              </div>
                            </div>
                          )}
                        {(contact.address_street || contact.address_city) && (
                          <div className="flex items-center gap-2">
                            <MapPin size={14} className="text-gray-400" />
                            <span className="truncate">
                              {contact.address_street && contact.address_city 
                                ? `${contact.address_street}, ${contact.address_city}`
                                : contact.address_street || contact.address_city
                              }
                            </span>
                          </div>
                        )}
                          {/* Fallback für fehlende Adresse */}
                          {!contact.company_address && !contact.user_company_address && !contact.address_street && !contact.address_city && (
                          <div className="flex items-center gap-2 text-gray-400 text-xs">
                            <MapPin size={12} className="text-gray-400" />
                            <span>Adresse wird geladen...</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedContact(contact);
                                setShowEditModal(true);
                              }}
                              className="ml-2 px-2 py-1 bg-[#ffbd59]/20 text-[#ffbd59] rounded text-xs hover:bg-[#ffbd59]/30 transition-colors"
                            >
                              Bearbeiten
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-end">
                        {/* Benachrichtigungs-Status anzeigen */}
                        {contact.service_provider_id && (
                          <NotificationStatusIndicator contactId={contact.id} />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Contact Details Modal */}
      {selectedContact && !showEditModal && (
        <ContactDetailsModal
          contact={selectedContact}
          onClose={() => setSelectedContact(null)}
          onEdit={() => setShowEditModal(true)}
          onDelete={() => {
            setContactToDelete(selectedContact);
            setShowDeleteConfirm(true);
          }}
          onUpdate={loadContacts}
        />
      )}

      {/* Add/Edit Contact Modal */}
      {(showAddModal || showEditModal) && (
        <ContactFormModal
          isOpen={showAddModal || showEditModal}
          onClose={() => {
            setShowAddModal(false);
            setShowEditModal(false);
            setSelectedContact(null);
          }}
          contact={showEditModal ? selectedContact : undefined}
          onSuccess={loadContacts}
        />
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && contactToDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-60 p-4">
          <div className="bg-[#2c3539] rounded-2xl shadow-2xl border border-white/20 max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Kontakt löschen</h3>
            <p className="text-gray-300 mb-6">
              Möchten Sie den Kontakt <strong>{contactToDelete.company_name}</strong> wirklich löschen?
              Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setContactToDelete(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg font-medium transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleDeleteContact}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Contact Details Modal Component
interface ContactDetailsModalProps {
  contact: Contact;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onUpdate: () => void;
}

function ContactDetailsModal({ contact, onClose, onEdit, onDelete, onUpdate }: ContactDetailsModalProps) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-lg flex items-center justify-center z-60 p-4">
      <div className="bg-gradient-to-br from-[#1a1a2e]/95 to-[#2c3539]/95 backdrop-blur-xl rounded-2xl shadow-[0_0_60px_rgba(255,189,89,0.15)] border border-white/20 max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="relative p-6 border-b border-white/10 bg-gradient-to-r from-[#3d4952]/95 to-[#51646f]/95 backdrop-blur-lg">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#ffbd59]/5 via-transparent to-[#ffa726]/5 opacity-50"></div>
          <div className="absolute inset-0 rounded-t-2xl bg-gradient-to-r from-[#ffbd59]/10 to-[#ffa726]/10 blur-xl opacity-30"></div>
          
          <div className="relative flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-xl flex items-center justify-center text-white font-bold shadow-[0_0_20px_rgba(255,189,89,0.4)]">
                <Building size={32} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">{contact.company_name}</h2>
                {contact.category && (
                  <p className="text-sm text-gray-300">
                    {getCategoryLabel(contact.category)}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-all duration-200 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]"
              >
                <X size={20} className="text-gray-300 hover:text-white transition-colors" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="space-y-6">
            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Kontaktinformationen</h3>
              <div className="space-y-3">
                {contact.contact_person && (
                  <div className="flex items-center gap-3 text-gray-300">
                    <User size={18} className="text-gray-400" />
                    <span>{contact.contact_person}</span>
                  </div>
                )}
                {contact.phone && (
                  <a
                    href={`tel:${contact.phone}`}
                    className="flex items-center gap-3 text-gray-300 hover:text-[#ffbd59] transition-colors"
                  >
                    <Phone size={18} className="text-gray-400" />
                    <span>{contact.phone}</span>
                  </a>
                )}
                {contact.email && (
                  <a
                    href={`mailto:${contact.email}`}
                    className="flex items-center gap-3 text-gray-300 hover:text-[#ffbd59] transition-colors"
                  >
                    <Mail size={18} className="text-gray-400" />
                    <span>{contact.email}</span>
                  </a>
                )}
                {contact.website && (
                  <a
                    href={contact.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 text-gray-300 hover:text-[#ffbd59] transition-colors"
                  >
                    <Globe size={18} className="text-gray-400" />
                    <span>{contact.website}</span>
                  </a>
                )}
              </div>
            </div>

              {/* Address */}
              {(contact.company_address || contact.user_company_address || contact.address_street || contact.address_city) && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Adresse</h3>
                  <div className="flex items-start gap-3 text-gray-300">
                    <MapPin size={18} className="text-gray-400 mt-1" />
                    <div>
                      {(contact.company_address || contact.user_company_address) && (
                        <div className="mb-3">
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin size={16} className="text-gray-400" />
                            <span className="text-sm text-gray-400">Adresse:</span>
                            {contact.data_source && (
                              <span className="text-xs text-gray-500">
                                ({contact.data_source === 'user' ? 'aus User-Daten' : contact.data_source === 'merged' ? 'gemerged' : 'aus Kontakt'})
                              </span>
                            )}
                          </div>
                          <div className="ml-6">
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.company_address || contact.user_company_address)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-400 hover:text-blue-300 hover:underline transition-colors font-medium"
                            >
                              {contact.company_address || contact.user_company_address}
                            </a>
                          </div>
                        </div>
                      )}
                    {contact.address_street && <div>{contact.address_street}</div>}
                    {contact.address_zip || contact.address_city ? (
                      <div>{contact.address_zip} {contact.address_city}</div>
                    ) : null}
                    {contact.address_country && <div>{contact.address_country}</div>}
                  </div>
                </div>
              </div>
            )}


            {/* Project/Milestone Info */}
            {(contact.project_name || contact.milestone_title) && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Zuordnung</h3>
                <div className="space-y-2">
                  {contact.project_name && (
                    <div className="flex items-center gap-3 text-gray-300">
                      <Building size={18} className="text-gray-400" />
                      <span>Projekt: {contact.project_name}</span>
                    </div>
                  )}
                  {contact.milestone_title && (
                    <div className="flex items-center gap-3 text-gray-300">
                      <Briefcase size={18} className="text-gray-400" />
                      <span>Gewerk: {contact.milestone_title}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* Benachrichtigungs-Präferenzen */}
          <NotificationPreferences 
            contact={contact} 
            onUpdate={onUpdate}
          />
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-600/30 flex items-center justify-between">
          <button
            onClick={onDelete}
            className="flex items-center gap-2 px-4 py-2 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-lg font-medium transition-colors"
          >
            <Trash2 size={16} />
            Löschen
          </button>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg font-medium transition-colors"
            >
              Schließen
            </button>
            <button
              onClick={onEdit}
              className="flex items-center gap-2 px-4 py-2 bg-[#ffbd59] hover:bg-[#ffa726] text-[#2c3539] rounded-lg font-medium transition-colors"
            >
              <Edit size={16} />
              Bearbeiten
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Contact Form Modal Component
interface ContactFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact?: Contact | null;
  onSuccess: () => void;
}

function ContactFormModal({ isOpen, onClose, contact, onSuccess }: ContactFormModalProps) {
  const [formData, setFormData] = useState({
    company_name: contact?.company_name || '',
    contact_person: contact?.contact_person || '',
    email: contact?.email || '',
    phone: contact?.phone || '',
    website: contact?.website || '',
    category: contact?.category || '',
    company_address: contact?.company_address || '',
    address_country: contact?.address_country || 'Deutschland'
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (contact) {
        await contactService.updateContact(contact.id, formData);
      } else {
        await contactService.createContact(formData);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Fehler beim Speichern des Kontakts:', error);
      alert('Fehler beim Speichern des Kontakts');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-lg flex items-center justify-center z-70 p-4">
      <div className="bg-gradient-to-br from-[#1a1a2e]/95 to-[#2c3539]/95 backdrop-blur-xl rounded-2xl shadow-[0_0_60px_rgba(255,189,89,0.15)] border border-white/20 max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="relative p-6 border-b border-white/10 bg-gradient-to-r from-[#3d4952]/95 to-[#51646f]/95 backdrop-blur-lg">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#ffbd59]/5 via-transparent to-[#ffa726]/5 opacity-50"></div>
          <div className="absolute inset-0 rounded-t-2xl bg-gradient-to-r from-[#ffbd59]/10 to-[#ffa726]/10 blur-xl opacity-30"></div>
          
          <div className="relative flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">
              {contact ? 'Kontakt bearbeiten' : 'Neuer Kontakt'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-all duration-200 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]"
            >
              <X size={20} className="text-gray-300 hover:text-white transition-colors" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Firmenname *
                </label>
                <input
                  type="text"
                  required
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg focus:ring-2 focus:ring-[#ffbd59]/50 focus:border-[#ffbd59]/50 text-white placeholder-gray-300 transition-all duration-200 hover:bg-white/10 hover:border-white/20"
                  placeholder="z.B. Müller Elektro GmbH"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Ansprechpartner
                </label>
                <input
                  type="text"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg focus:ring-2 focus:ring-[#ffbd59]/50 focus:border-[#ffbd59]/50 text-white placeholder-gray-300 transition-all duration-200 hover:bg-white/10 hover:border-white/20"
                  placeholder="Max Mustermann"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Kategorie
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg focus:ring-2 focus:ring-[#ffbd59]/50 focus:border-[#ffbd59]/50 text-white transition-all duration-200 hover:bg-white/10 hover:border-white/20"
                >
                  <option value="">Kategorie wählen...</option>
                  {TRADE_CATEGORIES.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  E-Mail
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-[#1a1a2e]/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] text-white placeholder-gray-400"
                  placeholder="info@firma.de"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Telefon
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-[#1a1a2e]/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] text-white placeholder-gray-400"
                  placeholder="+49 123 456789"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full px-3 py-2 bg-[#1a1a2e]/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] text-white placeholder-gray-400"
                  placeholder="https://www.firma.de"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Firmenadresse
                </label>
                <input
                  type="text"
                  value={formData.company_address}
                  onChange={(e) => setFormData({ ...formData, company_address: e.target.value })}
                  className="w-full px-3 py-2 bg-[#1a1a2e]/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] text-white placeholder-gray-400"
                  placeholder="z.B. Hauptstraße 123, 12345 München"
                />
              </div>
            </div>




          </div>
        </form>

        {/* Footer */}
        <div className="relative p-6 border-t border-white/10 bg-gradient-to-r from-[#2c3539]/50 to-[#3d4952]/50 backdrop-blur-sm flex items-center justify-end gap-3">
          {/* Subtle glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#ffbd59]/3 via-transparent to-[#ffa726]/3 opacity-60"></div>
          
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg font-medium transition-all duration-200 hover:border-white/20"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !formData.company_name}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] hover:from-[#ffa726] hover:to-[#ff9800] disabled:bg-gray-600 text-[#2c3539] rounded-lg font-medium transition-all duration-200 transform hover:scale-105 shadow-[0_0_20px_rgba(255,189,89,0.3)] hover:shadow-[0_0_30px_rgba(255,189,89,0.5)] disabled:transform-none disabled:shadow-none"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#2c3539]"></div>
                <span>Speichern...</span>
              </>
            ) : (
              <>
                <span>{contact ? 'Aktualisieren' : 'Erstellen'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Notification Status Indicator Component
interface NotificationStatusIndicatorProps {
  contactId: number;
}

function NotificationStatusIndicator({ contactId }: NotificationStatusIndicatorProps) {
  const [preference, setPreference] = useState<NotificationPreference | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPreference();
    
    // Event Listener für Änderungen an Benachrichtigungspräferenzen
    const handlePreferenceUpdate = (event: CustomEvent) => {
      if (event.detail.contactId === contactId) {
        loadPreference();
      }
    };

    window.addEventListener('notificationPreferenceUpdated', handlePreferenceUpdate as EventListener);
    
    return () => {
      window.removeEventListener('notificationPreferenceUpdated', handlePreferenceUpdate as EventListener);
    };
  }, [contactId]);

  const loadPreference = async () => {
    try {
      const pref = await notificationPreferenceService.getPreferenceByContactId(contactId);
      setPreference(pref);
    } catch (error) {
      console.error('Fehler beim Laden der Benachrichtigungspräferenzen:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-6 h-6 rounded-full bg-gray-600/50 animate-pulse"></div>
    );
  }

  if (!preference || !preference.enabled) {
    return (
      <div className="flex items-center gap-1" title="Benachrichtigungen deaktiviert">
        <BellOff size={16} className="text-gray-400" />
      </div>
    );
  }

  const allCategoriesText = preference.categories?.map(cat => {
    const category = TRADE_CATEGORIES.find(c => c.value === cat);
    return category ? `${category.emoji} ${category.label}` : cat;
  }).join(', ') || '';

  return (
    <div className="flex items-center gap-2 group relative">
      {/* Haupt-Tooltip - nach unten zeigend */}
      <div className="absolute top-full left-0 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 max-w-xs break-words">
        🔔 Benachrichtigungen aktiv für: {allCategoriesText}
        <div className="absolute bottom-full left-4 border-4 border-transparent border-b-gray-900"></div>
      </div>
      
      <Bell size={16} className="text-[#ffbd59]" />
      {preference.categories && preference.categories.length > 0 && (
        <div className="flex items-center gap-1">
          <span className="text-xs text-[#ffbd59] font-medium">
            {preference.categories.length}
          </span>
          {/* Desktop: Zeige Tags */}
          <div className="hidden sm:flex gap-1 flex-wrap">
            {preference.categories.slice(0, 2).map(categoryValue => {
              const category = TRADE_CATEGORIES.find(cat => cat.value === categoryValue);
              if (!category) return null;
              return (
                <span
                  key={categoryValue}
                  className="inline-flex items-center px-2 py-1 bg-[#ffbd59]/20 text-[#ffbd59] border border-[#ffbd59]/30 rounded-full text-xs font-medium cursor-help"
                  title={`${category.emoji} ${category.label}`}
                >
                  {category.label}
                </span>
              );
            })}
            {preference.categories.length > 2 && (
              <span className="text-xs text-[#ffbd59] font-medium px-1">
                +{preference.categories.length - 2}
              </span>
            )}
          </div>
          
          {/* Mobile: Zeige nur Emojis */}
          <div className="flex sm:hidden gap-1">
            {preference.categories.slice(0, 4).map(categoryValue => {
              const category = TRADE_CATEGORIES.find(cat => cat.value === categoryValue);
              if (!category) return null;
              return (
                <span
                  key={categoryValue}
                  className="text-sm cursor-help"
                  title={`${category.label}`}
                >
                  {category.emoji}
                </span>
              );
            })}
            {preference.categories.length > 4 && (
              <span className="text-xs text-[#ffbd59] font-medium">
                +{preference.categories.length - 4}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

