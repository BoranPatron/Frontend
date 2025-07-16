import React, { createContext, useContext, useState, useEffect } from 'react';
import { getProjects } from '../api/projectService';
import { useAuth } from './AuthContext';

interface Project {
  id: number;
  name: string;
  description: string;
  project_type: string;
  status: string;
  progress_percentage: number;
  budget?: number;
  current_costs: number;
  start_date?: string;
  end_date?: string;
  address?: string;
  property_size?: number;
  construction_area?: number;
  estimated_duration?: number;
  is_public: boolean;
  allow_quotes: boolean;
  created_at: string;
  updated_at: string;
}

interface ProjectContextType {
  projects: Project[];
  selectedProject: Project | null;
  selectedProjectIndex: number;
  isLoading: boolean;
  error: string;
  setSelectedProjectIndex: (index: number) => void;
  setSelectedProject: (project: Project | null) => void;
  loadProjects: () => Promise<void>;
  getCurrentProject: () => Project | null;
  isProjectSelected: () => boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const { isInitialized, user, isAuthenticated } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedProjectIndex, setSelectedProjectIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Lade Projekte nur wenn AuthContext initialisiert ist und User authentifiziert ist
  useEffect(() => {
    if (isInitialized) {
      if (isAuthenticated() && user) {
        console.log('🔍 Benutzer authentifiziert - lade Projekte...');
        loadProjects();
      } else {
        console.log('🔍 Benutzer nicht authentifiziert - setze Loading auf false');
        setIsLoading(false);
        setProjects([]);
        setSelectedProject(null);
        setSelectedProjectIndex(0);
        setError('');
      }
    }
  }, [isInitialized, user, isAuthenticated]);

  // Persistiere Projektauswahl in localStorage
  useEffect(() => {
    if (selectedProject) {
      localStorage.setItem('selectedProjectId', selectedProject.id.toString());
      localStorage.setItem('selectedProjectIndex', selectedProjectIndex.toString());
      console.log('💾 Projektauswahl gespeichert:', {
        projectId: selectedProject.id,
        projectName: selectedProject.name,
        index: selectedProjectIndex
      });
    }
  }, [selectedProject, selectedProjectIndex]);

  // Lade gespeicherte Projektauswahl beim Start
  useEffect(() => {
    const savedProjectId = localStorage.getItem('selectedProjectId');
    const savedProjectIndex = localStorage.getItem('selectedProjectIndex');
    
    if (savedProjectId && savedProjectIndex && projects.length > 0) {
      const projectId = parseInt(savedProjectId);
      const projectIndex = parseInt(savedProjectIndex);
      
      const savedProject = projects.find(p => p.id === projectId);
      if (savedProject) {
        setSelectedProject(savedProject);
        setSelectedProjectIndex(projectIndex);
        console.log('📂 Gespeicherte Projektauswahl geladen:', {
          projectId: savedProject.id,
          projectName: savedProject.name,
          index: projectIndex
        });
      } else {
        // Fallback: erstes Projekt auswählen
        setSelectedProject(projects[0]);
        setSelectedProjectIndex(0);
        console.log('🔄 Fallback: Erstes Projekt ausgewählt');
      }
    } else if (projects.length > 0) {
      // Keine gespeicherte Auswahl: erstes Projekt auswählen
      setSelectedProject(projects[0]);
      setSelectedProjectIndex(0);
      console.log('🆕 Erstes Projekt ausgewählt:', projects[0].name);
    }
  }, [projects]);

  const loadProjects = async () => {
    // Prüfe nochmal ob User authentifiziert ist
    if (!isAuthenticated() || !user) {
      console.log('⚠️ Benutzer nicht authentifiziert - überspringe Projekt-Loading');
      setIsLoading(false);
      setProjects([]);
      setSelectedProject(null);
      setSelectedProjectIndex(0);
      setError('');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      console.log('🔍 Lade Projekte...');
      const projectsData = await getProjects();
      console.log('✅ Projekte geladen:', projectsData);
      
      setProjects(projectsData);
      
      // Wenn keine Projekte vorhanden sind
      if (projectsData.length === 0) {
        console.log('⚠️ Keine Projekte verfügbar');
        setSelectedProject(null);
        setSelectedProjectIndex(0);
      }
    } catch (err: any) {
      console.error('❌ Fehler beim Laden der Projekte:', err);
      
      // Spezielle Behandlung für 401-Fehler (nicht authentifiziert)
      if (err.response?.status === 401) {
        console.log('🔐 401 Unauthorized - Benutzer nicht authentifiziert');
        setError('Bitte melden Sie sich an, um Projekte zu laden');
        setProjects([]);
        setSelectedProject(null);
        setSelectedProjectIndex(0);
      } else {
        setError(err.message || 'Fehler beim Laden der Projekte');
        setProjects([]);
        setSelectedProject(null);
        setSelectedProjectIndex(0);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentProject = (): Project | null => {
    return selectedProject;
  };

  const isProjectSelected = (): boolean => {
    return selectedProject !== null;
  };

  // Aktualisiere Projektauswahl basierend auf Index
  const updateSelectedProject = (index: number) => {
    if (index >= 0 && index < projects.length) {
      const newSelectedProject = projects[index];
      setSelectedProject(newSelectedProject);
      setSelectedProjectIndex(index);
      console.log('🔄 Projektauswahl aktualisiert:', {
        projectId: newSelectedProject.id,
        projectName: newSelectedProject.name,
        index: index
      });
    }
  };

  // Setze Projektauswahl basierend auf Index
  const setSelectedProjectIndexHandler = (index: number) => {
    updateSelectedProject(index);
  };

  // Setze Projektauswahl direkt
  const setSelectedProjectHandler = (project: Project | null) => {
    if (project) {
      const index = projects.findIndex(p => p.id === project.id);
      if (index !== -1) {
        setSelectedProject(project);
        setSelectedProjectIndex(index);
        console.log('🎯 Projekt direkt ausgewählt:', {
          projectId: project.id,
          projectName: project.name,
          index: index
        });
      }
    } else {
      setSelectedProject(null);
      setSelectedProjectIndex(0);
      console.log('❌ Projektauswahl zurückgesetzt');
    }
  };

  return (
    <ProjectContext.Provider value={{
      projects,
      selectedProject,
      selectedProjectIndex,
      isLoading,
      error,
      setSelectedProjectIndex: setSelectedProjectIndexHandler,
      setSelectedProject: setSelectedProjectHandler,
      loadProjects,
      getCurrentProject,
      isProjectSelected
    }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProject muss innerhalb von ProjectProvider verwendet werden');
  return ctx;
} 