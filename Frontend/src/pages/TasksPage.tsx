import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import KanbanBoard from '../components/KanbanBoard';
import { 
  CheckSquare, 
  Filter, 
  User, 
  Building,
  ToggleLeft,
  ToggleRight,
  Archive
} from 'lucide-react';

const TasksPage: React.FC = () => {
  const { user, userRole } = useAuth();
  const { projects, selectedProject } = useProject();
  const [showOnlyAssignedToMe, setShowOnlyAssignedToMe] = useState(true);
  const [showArchived, setShowArchived] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>(
    selectedProject?.id
  );

  const isServiceProvider = userRole === 'dienstleister' || user?.user_role === 'DIENSTLEISTER';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {isServiceProvider ? 'Meine Aufgaben' : 'Aufgaben-Management'}
            </h1>
            <p className="text-gray-300">
              {isServiceProvider 
                ? 'Verwalten Sie Ihre zugewiesenen Aufgaben'
                : 'Erstellen und verwalten Sie Aufgaben für Ihr Bauprojekt'
              }
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowOnlyAssignedToMe(!showOnlyAssignedToMe)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                showOnlyAssignedToMe 
                  ? 'bg-[#ffbd59] text-[#2c3539]' 
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <User size={16} />
              {isServiceProvider ? 'Meine Aufgaben' : 'Nur mir zugewiesene'}
            </button>
            
            <button
              onClick={() => setShowArchived(!showArchived)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                showArchived 
                  ? 'bg-[#ffbd59] text-[#2c3539]' 
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Archive size={16} />
              Archivierte Tasks
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 p-4 bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 mb-6">
            {/* Project Filter */}
            {!isServiceProvider && projects.length > 0 && (
              <div className="flex items-center gap-2">
                <Building size={16} className="text-gray-300" />
                <select
                  value={selectedProjectId || ''}
                  onChange={(e) => setSelectedProjectId(e.target.value ? parseInt(e.target.value) : undefined)}
                  className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                >
                  <option value="">Alle Projekte</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id} className="bg-gray-800">
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Info */}
            <div className="ml-auto text-sm text-gray-300">
              <div className="flex items-center gap-2">
                <Filter size={14} />
                <span>
                  {showArchived ? 'Archivierte' : (showOnlyAssignedToMe ? 'Meine' : 'Alle')} Aufgaben
                  {selectedProjectId && !isServiceProvider ? ' im ausgewählten Projekt' : ''}
                </span>
              </div>
            </div>
          </div>

        {/* Kanban Board */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6 mobile-container">
          <KanbanBoard
            projectId={isServiceProvider ? undefined : selectedProjectId}
            showOnlyAssignedToMe={showOnlyAssignedToMe}
            showArchived={showArchived}
            className="h-full mobile-scroll"
            mobileViewMode="auto"
          />
        </div>
      </div>
    </div>
  );
};

export default TasksPage;