import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Building, ChevronRight, Home } from 'lucide-react';
import { getProject } from '../api/projectService';

interface ProjectBreadcrumbProps {
  showHome?: boolean;
  className?: string;
}

export default function ProjectBreadcrumb({ showHome = true, className = '' }: ProjectBreadcrumbProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadProject();
    }
  }, [id]);

  const loadProject = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const projectData = await getProject(parseInt(id));
      setProject(projectData);
    } catch (error) {
      console.error('Fehler beim Laden des Projekts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!id) return null;

  return (
    <div className={`bg-white border-b border-gray-200 px-6 py-3 ${className}`}>
      <div className="flex items-center gap-2 text-sm text-gray-600">
        {showHome && (
          <>
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1 hover:text-[#ffbd59] transition-colors"
            >
              <Home size={14} />
              <span>Dashboard</span>
            </button>
            <ChevronRight size={14} />
          </>
        )}
        
        <div className="flex items-center gap-2">
          <Building size={14} className="text-[#ffbd59]" />
          <span>Projekt:</span>
          {loading ? (
            <div className="animate-pulse bg-gray-200 h-4 w-24 rounded"></div>
          ) : project ? (
            <button
              onClick={() => navigate(`/project/${id}`)}
              className="font-medium text-[#ffbd59] hover:text-[#e6a800] transition-colors"
            >
              {project.name}
            </button>
          ) : (
            <span className="font-medium text-gray-400">#{id}</span>
          )}
        </div>
      </div>
    </div>
  );
} 