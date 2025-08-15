import React from 'react';
import { Building } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, right }: PageHeaderProps) {
  const { selectedProject } = useProject();

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3 min-w-0">
        <h1 className="text-3xl font-bold text-white truncate">{title}</h1>
        {selectedProject && (
          <Link
            to={`/project/${selectedProject.id}`}
            className="flex items-center gap-2 px-3 py-1 rounded-full border border-white/20 bg-white/10 hover:bg-white/15 text-sm text-gray-200 transition-colors"
            title={`Zum Projekt: ${selectedProject.name}`}
          >
            <Building size={16} className="text-[#ffbd59]" />
            <span className="max-w-[240px] truncate">{selectedProject.name}</span>
          </Link>
        )}
      </div>
      <div className="flex items-center gap-3">
        {subtitle && (
          <span className="hidden sm:inline text-gray-300 truncate">{subtitle}</span>
        )}
        {right}
      </div>
    </div>
  );
}


