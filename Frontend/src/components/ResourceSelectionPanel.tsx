import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ChevronLeft,
  ChevronRight,
  Users,
  Search,
  Filter,
  MapPin,
  Calendar,
  Clock,
  Euro,
  Star,
  CheckCircle,
  AlertCircle,
  X,
  Plus,
  Trash2,
  GripVertical,
  Eye,
  EyeOff,
  Send,
  Info,
  Building,
  Phone,
  Mail,
  Settings,
  ChevronDown
} from 'lucide-react';
import { resourceService, type Resource, type ResourceAllocation } from '../api/resourceService';
import { useAuth } from '../context/AuthContext';
import dayjs from 'dayjs';

interface ResourceSelectionPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  tradeId: number;
  category: string;
  onResourcesSelected?: (allocations: ResourceAllocation[]) => void;
  className?: string;
}

interface DraggableResourceProps {
  resource: Resource;
  isSelected: boolean;
  onToggleSelect: () => void;
  onRemove: () => void;
}

// Sortable Resource Item
const SortableResourceItem: React.FC<DraggableResourceProps & { id: string }> = ({
  id,
  resource,
  isSelected,
  onToggleSelect,
  onRemove
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-[#333] rounded-lg p-3 border transition-all ${
        isSelected ? 'border-[#ffbd59] bg-[#ffbd59]/10' : 'border-gray-700'
      } ${isDragging ? 'shadow-xl z-50' : ''}`}
    >
      <div className="flex items-start space-x-3">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="mt-1 cursor-move hover:text-[#ffbd59] transition-colors"
        >
          <GripVertical className="w-4 h-4 text-gray-500" />
        </div>

        {/* Resource Info */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4 className="text-sm font-semibold text-white">
                {resource.provider_name || 'Dienstleister'}
              </h4>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  resource.status === 'available' 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-gray-500/20 text-gray-400'
                }`}>
                  {resource.status === 'available' ? 'Verfügbar' : 'Reserviert'}
                </span>
                <span className="text-xs text-gray-400">
                  {resource.category}
                </span>
              </div>
            </div>
            <button
              onClick={onRemove}
              className="p-1 hover:bg-red-500/20 rounded transition-colors"
            >
              <X className="w-4 h-4 text-red-400" />
            </button>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center space-x-1">
              <Users className="w-3 h-3 text-gray-400" />
              <span className="text-gray-300">{resource.person_count} Personen</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3 text-gray-400" />
              <span className="text-gray-300">{resource.total_hours}h</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="w-3 h-3 text-gray-400" />
              <span className="text-gray-300">
                {dayjs(resource.start_date).format('DD.MM')} - 
                {dayjs(resource.end_date).format('DD.MM')}
              </span>
            </div>
            {resource.hourly_rate && (
              <div className="flex items-center space-x-1">
                <Euro className="w-3 h-3 text-gray-400" />
                <span className="text-gray-300">{resource.hourly_rate}€/h</span>
              </div>
            )}
          </div>

          {/* Location */}
          {resource.address_city && (
            <div className="mt-2 flex items-center space-x-1">
              <MapPin className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-300">
                {resource.address_city}, {resource.address_postal_code}
              </span>
            </div>
          )}
        </div>

        {/* Selection Checkbox */}
        <div className="mt-1">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            className="rounded border-gray-600 text-[#ffbd59] focus:ring-[#ffbd59]"
          />
        </div>
      </div>
    </div>
  );
};

const ResourceSelectionPanel: React.FC<ResourceSelectionPanelProps> = ({
  isOpen,
  onToggle,
  tradeId,
  category,
  onResourcesSelected,
  className = ''
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedResourceIds, setSelectedResourceIds] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  
  // Filter states
  const [minPersons, setMinPersons] = useState<number | undefined>();
  const [maxRate, setMaxRate] = useState<number | undefined>();
  const [dateRange, setDateRange] = useState({
    start: dayjs().format('YYYY-MM-DD'),
    end: dayjs().add(30, 'days').format('YYYY-MM-DD')
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load resources
  const loadResources = async () => {
    setLoading(true);
    try {
      const results = await resourceService.searchResourcesGeo({
        category,
        start_date: dateRange.start,
        end_date: dateRange.end,
        min_persons: minPersons,
        max_hourly_rate: maxRate,
        status: 'available'
      });
      setResources(results);
    } catch (error) {
      console.error('Fehler beim Laden der Ressourcen:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadResources();
    }
  }, [isOpen, category]);

  // Handle drag events
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setResources((items) => {
        const oldIndex = items.findIndex((i) => i.id?.toString() === active.id);
        const newIndex = items.findIndex((i) => i.id?.toString() === over?.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
    setActiveId(null);
  };

  // Toggle resource selection
  const toggleResourceSelection = (resourceId: string) => {
    setSelectedResourceIds(prev =>
      prev.includes(resourceId)
        ? prev.filter(id => id !== resourceId)
        : [...prev, resourceId]
    );
  };

  // Remove resource from list
  const removeResource = (resourceId: string) => {
    setResources(prev => prev.filter(r => r.id?.toString() !== resourceId));
    setSelectedResourceIds(prev => prev.filter(id => id !== resourceId));
  };

  // Send invitations
  const sendInvitations = async () => {
    if (selectedResourceIds.length === 0) return;

    setLoading(true);
    try {
      const allocations: ResourceAllocation[] = selectedResourceIds.map((resourceId, index) => ({
        resource_id: parseInt(resourceId),
        trade_id: tradeId,
        allocated_person_count: resources.find(r => r.id?.toString() === resourceId)?.person_count || 1,
        allocated_start_date: dateRange.start,
        allocated_end_date: dateRange.end,
        allocation_status: 'pre_selected',
        priority: index
      }));

      const createdAllocations = await resourceService.bulkCreateAllocations(allocations);
      
      // Send notifications
      await Promise.all(
        createdAllocations.map(allocation =>
          allocation.id ? resourceService.sendInvitationNotification(allocation.id) : null
        )
      );

      onResourcesSelected?.(createdAllocations);
      
      // Reset
      setSelectedResourceIds([]);
      
      // Success feedback
      alert('Einladungen wurden erfolgreich versendet!');
    } catch (error) {
      console.error('Fehler beim Senden der Einladungen:', error);
      alert('Fehler beim Senden der Einladungen');
    } finally {
      setLoading(false);
    }
  };

  // Filter resources
  const filteredResources = resources.filter(resource => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        resource.provider_name?.toLowerCase().includes(query) ||
        resource.address_city?.toLowerCase().includes(query) ||
        resource.category?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Calculate stats
  const totalPersons = selectedResourceIds.reduce((sum, id) => {
    const resource = resources.find(r => r.id?.toString() === id);
    return sum + (resource?.person_count || 0);
  }, 0);

  const avgRate = selectedResourceIds.length > 0
    ? selectedResourceIds.reduce((sum, id) => {
        const resource = resources.find(r => r.id?.toString() === id);
        return sum + (resource?.hourly_rate || 0);
      }, 0) / selectedResourceIds.length
    : 0;

  const activeResource = activeId 
    ? resources.find(r => r.id?.toString() === activeId)
    : null;

  return (
    <>
      {/* Toggle Button */}
      <motion.button
        onClick={onToggle}
        className={`fixed left-0 top-1/2 -translate-y-1/2 z-[60] bg-[#ffbd59] text-black p-3 rounded-r-lg shadow-lg hover:bg-[#f59e0b] transition-all ${
          isOpen ? 'translate-x-96' : 'translate-x-0'
        }`}
        animate={{ x: isOpen ? 384 : 0 }}
      >
        {isOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: -384 }}
            animate={{ x: 0 }}
            exit={{ x: -384 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`fixed left-0 top-0 h-full w-96 bg-[#1a1a1a] border-r border-gray-700 shadow-2xl z-50 flex flex-col ${className}`}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#ffbd59] to-[#f59e0b] p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-white" />
                  <h3 className="text-lg font-bold text-white">Ressourcen-Vorauswahl</h3>
                </div>
                <button
                  onClick={onToggle}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white/20 rounded p-2 text-center">
                  <div className="text-xl font-bold text-white">{filteredResources.length}</div>
                  <div className="text-xs text-white/80">Verfügbar</div>
                </div>
                <div className="bg-white/20 rounded p-2 text-center">
                  <div className="text-xl font-bold text-white">{selectedResourceIds.length}</div>
                  <div className="text-xs text-white/80">Ausgewählt</div>
                </div>
                <div className="bg-white/20 rounded p-2 text-center">
                  <div className="text-xl font-bold text-white">{totalPersons}</div>
                  <div className="text-xs text-white/80">Personen</div>
                </div>
              </div>
            </div>

            {/* Search & Filter */}
            <div className="p-4 border-b border-gray-700">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Suche nach Name, Ort..."
                  className="w-full pl-10 pr-4 py-2 bg-[#2a2a2a] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffbd59]"
                />
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="w-full px-3 py-2 bg-[#2a2a2a] text-white rounded-lg hover:bg-[#333] transition-colors flex items-center justify-between"
              >
                <span className="flex items-center space-x-2">
                  <Filter className="w-4 h-4" />
                  <span>Filter</span>
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>

              {/* Filter Options */}
              {showFilters && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  className="mt-3 space-y-3 overflow-hidden"
                >
                  <div>
                    <label className="text-xs text-gray-400">Min. Personen</label>
                    <input
                      type="number"
                      min="1"
                      value={minPersons || ''}
                      onChange={(e) => setMinPersons(e.target.value ? parseInt(e.target.value) : undefined)}
                      className="w-full px-3 py-1.5 bg-[#2a2a2a] text-white rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Max. Stundensatz (€)</label>
                    <input
                      type="number"
                      min="0"
                      value={maxRate || ''}
                      onChange={(e) => setMaxRate(e.target.value ? parseFloat(e.target.value) : undefined)}
                      className="w-full px-3 py-1.5 bg-[#2a2a2a] text-white rounded text-sm"
                    />
                  </div>
                  <button
                    onClick={loadResources}
                    className="w-full px-3 py-1.5 bg-[#ffbd59] text-black rounded text-sm hover:bg-[#f59e0b] transition-colors"
                  >
                    Filter anwenden
                  </button>
                </motion.div>
              )}
            </div>

            {/* Resource List with Drag & Drop */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ffbd59]"></div>
                </div>
              ) : filteredResources.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">Keine Ressourcen gefunden</p>
                  <button
                    onClick={loadResources}
                    className="mt-3 px-4 py-2 bg-[#2a2a2a] text-white rounded-lg hover:bg-[#333] transition-colors"
                  >
                    Neu laden
                  </button>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={filteredResources.map(r => r.id?.toString() || '')}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {filteredResources.map(resource => (
                        <SortableResourceItem
                          key={resource.id}
                          id={resource.id?.toString() || ''}
                          resource={resource}
                          isSelected={selectedResourceIds.includes(resource.id?.toString() || '')}
                          onToggleSelect={() => toggleResourceSelection(resource.id?.toString() || '')}
                          onRemove={() => removeResource(resource.id?.toString() || '')}
                        />
                      ))}
                    </div>
                  </SortableContext>

                  <DragOverlay>
                    {activeResource && (
                      <div className="bg-[#333] rounded-lg p-3 border border-[#ffbd59] shadow-xl">
                        <div className="text-sm font-semibold text-white">
                          {activeResource.provider_name}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {activeResource.person_count} Personen
                        </div>
                      </div>
                    )}
                  </DragOverlay>
                </DndContext>
              )}
            </div>

            {/* Actions */}
            {selectedResourceIds.length > 0 && (
              <motion.div
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                className="p-4 border-t border-gray-700 bg-[#2a2a2a]"
              >
                <div className="mb-3 text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-400">Ausgewählt:</span>
                    <span className="text-white font-semibold">
                      {selectedResourceIds.length} Ressourcen
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-400">Gesamt Personen:</span>
                    <span className="text-white font-semibold">{totalPersons}</span>
                  </div>
                  {avgRate > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Ø Stundensatz:</span>
                      <span className="text-white font-semibold">{avgRate.toFixed(2)}€</span>
                    </div>
                  )}
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedResourceIds([])}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Auswahl aufheben
                  </button>
                  <button
                    onClick={sendInvitations}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-[#ffbd59] text-black rounded-lg hover:bg-[#f59e0b] transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>Einladen</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* Info Box */}
            <div className="p-4 border-t border-gray-700">
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <Info className="w-4 h-4 text-blue-400 mt-0.5" />
                  <div className="text-xs text-blue-300">
                    <p className="font-semibold mb-1">So funktioniert's:</p>
                    <ul className="space-y-1">
                      <li>• Wählen Sie passende Ressourcen aus</li>
                      <li>• Sortieren Sie per Drag & Drop nach Priorität</li>
                      <li>• Senden Sie Einladungen an ausgewählte Dienstleister</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ResourceSelectionPanel;