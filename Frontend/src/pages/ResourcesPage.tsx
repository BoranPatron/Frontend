import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Plus,
  Calendar,
  BarChart3,
  Map,
  Settings,
  ChevronRight,
  TrendingUp,
  Clock,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ResourceManagementModal from '../components/ResourceManagementModal';
import ResourceCalendar from '../components/ResourceCalendar';
import ResourceKPIDashboard from '../components/ResourceKPIDashboard';
import ResourceGeoSearch from '../components/ResourceGeoSearch';
import { Resource } from '../api/resourceService';

type ViewMode = 'dashboard' | 'calendar' | 'map' | 'list';

const ResourcesPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);

  // Check if user is a service provider
  const isServiceProvider = user?.role === 'service_provider';
  const isBautraeger = user?.role === 'bautraeger' || user?.role === 'admin';

  // View mode options based on user role
  const viewOptions = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: BarChart3, 
      color: '#ffbd59',
      available: isServiceProvider 
    },
    { 
      id: 'calendar', 
      label: 'Kalender', 
      icon: Calendar, 
      color: '#10b981',
      available: isServiceProvider 
    },
    { 
      id: 'map', 
      label: 'Kartenansicht', 
      icon: Map, 
      color: '#3b82f6',
      available: isBautraeger 
    },
    { 
      id: 'list', 
      label: 'Listenansicht', 
      icon: Users, 
      color: '#8b5cf6',
      available: true 
    }
  ].filter(option => option.available);

  const handleResourceCreated = (resource: Resource) => {
    setShowResourceModal(false);
    // Optionally refresh data or show success message
  };

  const handleResourceEdit = (resource: Resource) => {
    setSelectedResource(resource);
    setShowResourceModal(true);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1a1a1a] to-[#2a2a2a] border-b border-gray-800">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3">
                <Users className="w-8 h-8 text-[#ffbd59]" />
                <h1 className="text-3xl font-bold">Ressourcen-Management</h1>
              </div>
              <p className="text-gray-400 mt-2">
                {isServiceProvider 
                  ? 'Verwalten Sie Ihre verfügbaren Ressourcen und Kapazitäten'
                  : 'Finden Sie passende Ressourcen für Ihre Projekte'
                }
              </p>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-1">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  <span className="text-2xl font-bold text-white">87%</span>
                </div>
                <span className="text-xs text-gray-400">Auslastung</span>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-1">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <span className="text-2xl font-bold text-white">245h</span>
                </div>
                <span className="text-xs text-gray-400">Verfügbar</span>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 mb-1">
                  <CheckCircle className="w-5 h-5 text-[#ffbd59]" />
                  <span className="text-2xl font-bold text-white">12</span>
                </div>
                <span className="text-xs text-gray-400">Aktive</span>
              </div>
            </div>
          </div>

          {/* View Mode Tabs */}
          <div className="flex items-center space-x-2 mt-6">
            {viewOptions.map(option => (
              <button
                key={option.id}
                onClick={() => setViewMode(option.id as ViewMode)}
                className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-all ${
                  viewMode === option.id
                    ? 'bg-[#ffbd59] text-black'
                    : 'bg-[#2a2a2a] text-gray-400 hover:text-white hover:bg-[#333]'
                }`}
              >
                <option.icon className="w-4 h-4" />
                <span>{option.label}</span>
              </button>
            ))}

            <div className="flex-1" />

            {/* Action Buttons */}
            {isServiceProvider && (
              <button
                onClick={() => setShowResourceModal(true)}
                className="px-4 py-2 bg-[#ffbd59] text-black rounded-lg hover:bg-[#f59e0b] transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Neue Ressource</span>
              </button>
            )}

            <button
              onClick={() => navigate('/settings/resources')}
              className="p-2 bg-[#2a2a2a] text-gray-400 rounded-lg hover:text-white hover:bg-[#333] transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <motion.div
          key={viewMode}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {viewMode === 'dashboard' && isServiceProvider && (
            <div className="space-y-6">
              {/* KPI Dashboard */}
              <ResourceKPIDashboard 
                serviceProviderId={user?.id}
                onResourceClick={() => setShowResourceModal(true)}
              />

              {/* Calendar Preview */}
              <div className="bg-[#1a1a1a] rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-[#ffbd59]" />
                    Aktuelle Woche
                  </h2>
                  <button
                    onClick={() => setViewMode('calendar')}
                    className="text-sm text-[#ffbd59] hover:text-[#f59e0b] flex items-center"
                  >
                    Vollansicht
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
                <ResourceCalendar 
                  serviceProviderId={user?.id}
                  onAddResource={() => setShowResourceModal(true)}
                />
              </div>
            </div>
          )}

          {viewMode === 'calendar' && isServiceProvider && (
            <ResourceCalendar 
              serviceProviderId={user?.id}
              onResourceClick={handleResourceEdit}
              onAddResource={() => setShowResourceModal(true)}
            />
          )}

          {viewMode === 'map' && isBautraeger && (
            <ResourceGeoSearch 
              onResourceSelect={(resources) => {
                console.log('Selected resources:', resources);
                // Handle resource selection
              }}
            />
          )}

          {viewMode === 'list' && (
            <div className="bg-[#1a1a1a] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">
                  {isServiceProvider ? 'Meine Ressourcen' : 'Verfügbare Ressourcen'}
                </h2>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Suchen..."
                    className="px-4 py-2 bg-[#2a2a2a] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffbd59]"
                  />
                  <button className="p-2 bg-[#2a2a2a] rounded-lg hover:bg-[#333] transition-colors">
                    <Settings className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Resource List */}
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((item) => (
                  <motion.div
                    key={item}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: item * 0.1 }}
                    className="bg-[#2a2a2a] rounded-lg p-4 hover:bg-[#333] transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold">Ressource #{item}</h3>
                          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs">
                            Verfügbar
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-4 text-sm text-gray-400">
                          <div>
                            <span className="block text-xs text-gray-500">Personen</span>
                            <span className="text-white">5</span>
                          </div>
                          <div>
                            <span className="block text-xs text-gray-500">Zeitraum</span>
                            <span className="text-white">01.02 - 28.02</span>
                          </div>
                          <div>
                            <span className="block text-xs text-gray-500">Kategorie</span>
                            <span className="text-white">Elektro</span>
                          </div>
                          <div>
                            <span className="block text-xs text-gray-500">Stundensatz</span>
                            <span className="text-white">45€</span>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleResourceEdit({} as Resource)}
                        className="p-2 hover:bg-[#444] rounded-lg transition-colors"
                      >
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Resource Management Modal */}
      {showResourceModal && (
        <ResourceManagementModal
          isOpen={showResourceModal}
          onClose={() => {
            setShowResourceModal(false);
            setSelectedResource(null);
          }}
          onResourceCreated={handleResourceCreated}
          editResource={selectedResource}
        />
      )}
    </div>
  );
};

export default ResourcesPage;