import React from 'react';
import { ProjectPhase } from '../constants/phases';

interface ProjectInfoCardProps {
  project: {
    id: number;
    name: string;
    project_type: string;
    status: string;
    phase: string;
    budget?: number;
    current_costs: number;
    progress_percentage: number;
    start_date?: string;
    end_date?: string;
    address?: string;
    property_size?: number;
    construction_area?: number;
    estimated_duration?: number;
  };
  className?: string;
}

export default function ProjectInfoCard({ project, className = '' }: ProjectInfoCardProps) {
  const getProjectTypeLabel = (type: string) => {
    switch (type) {
      case 'new_build': return 'Neubau';
      case 'renovation': return 'Renovierung';
      case 'extension': return 'Anbau';
      case 'refurbishment': return 'Sanierung';
      default: return type;
    }
  };

  const getProjectTypeIcon = (type: string) => {
    switch (type) {
      case 'new_build': return '🏗️';
      case 'renovation': return '🔨';
      case 'extension': return '➕';
      case 'refurbishment': return '🛠️';
      default: return '📋';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'planning': return 'Planung';
      case 'preparation': return 'Vorbereitung';
      case 'execution': return 'Ausführung';
      case 'completion': return 'Fertigstellung';
      case 'completed': return 'Abgeschlossen';
      case 'on_hold': return 'Pausiert';
      case 'cancelled': return 'Abgebrochen';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'preparation': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'execution': return 'bg-green-100 text-green-800 border-green-200';
      case 'completion': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'on_hold': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getBudgetStatus = () => {
    if (!project.budget) return { status: 'no-budget', color: 'text-gray-500', label: 'Kein Budget' };
    
    const percentage = (project.current_costs / project.budget) * 100;
    if (percentage < 70) return { status: 'good', color: 'text-green-600', label: 'Im Budget' };
    if (percentage < 90) return { status: 'warning', color: 'text-yellow-600', label: 'Achtung' };
    return { status: 'over', color: 'text-red-600', label: 'Über Budget' };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const budgetStatus = getBudgetStatus();

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
      <div className="space-y-4">
        {/* Projekt-Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">{getProjectTypeIcon(project.project_type)}</div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {project.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {getProjectTypeLabel(project.project_type)}
              </p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(project.status)}`}>
            {getStatusLabel(project.status)}
          </div>
        </div>

        {/* Fortschritt */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Fortschritt</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {Math.round(project.progress_percentage)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${project.progress_percentage}%` }}
            />
          </div>
        </div>

        {/* Budget-Informationen */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-gray-500 dark:text-gray-400">Budget</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {project.budget ? formatCurrency(project.budget) : 'Nicht gesetzt'}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-gray-500 dark:text-gray-400">Aktuelle Kosten</p>
            <p className={`text-lg font-semibold ${budgetStatus.color}`}>
              {formatCurrency(project.current_costs)}
            </p>
          </div>
        </div>

        {/* Budget-Status */}
        {project.budget && (
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                budgetStatus.status === 'good' ? 'bg-green-500' :
                budgetStatus.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {budgetStatus.label}
              </span>
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {Math.round((project.current_costs / project.budget) * 100)}% verbraucht
            </span>
          </div>
        )}

        {/* Projekt-Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          {project.address && (
            <div>
              <p className="text-gray-500 dark:text-gray-400">Adresse</p>
              <p className="font-medium text-gray-900 dark:text-white truncate">
                {project.address}
              </p>
            </div>
          )}
          
          {project.property_size && (
            <div>
              <p className="text-gray-500 dark:text-gray-400">Grundstücksgröße</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {project.property_size} m²
              </p>
            </div>
          )}

          {project.construction_area && (
            <div>
              <p className="text-gray-500 dark:text-gray-400">Baufläche</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {project.construction_area} m²
              </p>
            </div>
          )}

          {project.estimated_duration && (
            <div>
              <p className="text-gray-500 dark:text-gray-400">Geschätzte Dauer</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {project.estimated_duration} Tage
              </p>
            </div>
          )}

          {project.start_date && (
            <div>
              <p className="text-gray-500 dark:text-gray-400">Startdatum</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {formatDate(project.start_date)}
              </p>
            </div>
          )}

          {project.end_date && (
            <div>
              <p className="text-gray-500 dark:text-gray-400">Enddatum</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {formatDate(project.end_date)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 