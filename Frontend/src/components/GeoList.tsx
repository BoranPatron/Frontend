import React, { useState, useMemo } from 'react';
import type { ProjectSearchResult, ServiceProviderSearchResult } from '../api/geoService';
import { formatDistance } from '../api/geoService';

interface GeoListProps {
  projects: ProjectSearchResult[];
  serviceProviders: ServiceProviderSearchResult[];
  searchMode: 'projects' | 'service_providers';
  onItemClick: (item: ProjectSearchResult | ServiceProviderSearchResult) => void;
}

type SortField = 'distance' | 'name' | 'budget' | 'created_at';
type SortDirection = 'asc' | 'desc';

export default function GeoList({ 
  projects, 
  serviceProviders, 
  searchMode, 
  onItemClick 
}: GeoListProps) {
  const [sortField, setSortField] = useState<SortField>('distance');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [searchTerm, setSearchTerm] = useState('');

  // Sortierte und gefilterte Ergebnisse
  const sortedResults = useMemo(() => {
    const items = searchMode === 'projects' ? projects : serviceProviders;
    
    // Filtern nach Suchbegriff
    let filtered = items.filter(item => {
      if (searchMode === 'projects') {
        const project = item as ProjectSearchResult;
        return (
          project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          project.address_city.toLowerCase().includes(searchTerm.toLowerCase())
        );
      } else {
        const provider = item as ServiceProviderSearchResult;
        return (
          `${provider.first_name} ${provider.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
          provider.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          provider.address_city.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
    });

    // Sortieren
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortField) {
        case 'distance':
          aValue = a.distance_km;
          bValue = b.distance_km;
          break;
        case 'name':
          if (searchMode === 'projects') {
            aValue = (a as ProjectSearchResult).name;
            bValue = (b as ProjectSearchResult).name;
          } else {
            aValue = `${(a as ServiceProviderSearchResult).first_name} ${(a as ServiceProviderSearchResult).last_name}`;
            bValue = `${(b as ServiceProviderSearchResult).first_name} ${(b as ServiceProviderSearchResult).last_name}`;
          }
          break;
        case 'budget':
          if (searchMode === 'projects') {
            aValue = (a as ProjectSearchResult).budget || 0;
            bValue = (b as ProjectSearchResult).budget || 0;
          } else {
            return 0; // Kein Budget für Dienstleister
          }
          break;
        case 'created_at':
          aValue = new Date((a as ProjectSearchResult).created_at || '').getTime();
          bValue = new Date((b as ProjectSearchResult).created_at || '').getTime();
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
  }, [projects, serviceProviders, searchMode, sortField, sortDirection, searchTerm]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  const getProjectTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      'new_build': 'Neubau',
      'renovation': 'Renovierung',
      'extension': 'Anbau',
      'refurbishment': 'Sanierung'
    };
    return labels[type] || type;
  };

  const getProjectStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      'planning': 'Planung',
      'preparation': 'Vorbereitung',
      'execution': 'Ausführung',
      'completion': 'Fertigstellung'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'planning': 'bg-blue-100 text-blue-800',
      'preparation': 'bg-yellow-100 text-yellow-800',
      'execution': 'bg-green-100 text-green-800',
      'completion': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'new_build': 'bg-purple-100 text-purple-800',
      'renovation': 'bg-orange-100 text-orange-800',
      'extension': 'bg-indigo-100 text-indigo-800',
      'refurbishment': 'bg-teal-100 text-teal-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  if (sortedResults.length === 0) {
    return (
      <div className="h-full bg-gray-50 rounded-lg flex items-center justify-center">
        <div className="text-center text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-lg font-medium">Keine Ergebnisse gefunden</p>
          <p className="text-sm">Versuchen Sie andere Suchkriterien</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Suchleiste und Sortierung */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder={`${searchMode === 'projects' ? 'Projekte' : 'Dienstleister'} durchsuchen...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div className="text-sm text-gray-600">
            {sortedResults.length} von {searchMode === 'projects' ? projects.length : serviceProviders.length} Ergebnissen
          </div>
        </div>

        {/* Sortierung */}
        <div className="flex items-center space-x-4 text-sm">
          <span className="text-gray-600">Sortieren nach:</span>
          <button
            onClick={() => handleSort('distance')}
            className={`px-3 py-1 rounded transition-colors ${
              sortField === 'distance' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Entfernung {getSortIcon('distance')}
          </button>
          <button
            onClick={() => handleSort('name')}
            className={`px-3 py-1 rounded transition-colors ${
              sortField === 'name' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Name {getSortIcon('name')}
          </button>
          {searchMode === 'projects' && (
            <button
              onClick={() => handleSort('budget')}
              className={`px-3 py-1 rounded transition-colors ${
                sortField === 'budget' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Budget {getSortIcon('budget')}
            </button>
          )}
          {searchMode === 'projects' && (
            <button
              onClick={() => handleSort('created_at')}
              className={`px-3 py-1 rounded transition-colors ${
                sortField === 'created_at' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Datum {getSortIcon('created_at')}
            </button>
          )}
        </div>
      </div>

      {/* Ergebnisliste */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-2 p-4">
          {sortedResults.map((item, index) => (
            <div
              key={index}
              onClick={() => onItemClick(item)}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
            >
              {searchMode === 'projects' ? (
                <ProjectListItem project={item as ProjectSearchResult} />
              ) : (
                <ServiceProviderListItem provider={item as ServiceProviderSearchResult} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Projekt-Listenelement
function ProjectListItem({ project }: { project: ProjectSearchResult }) {
  return (
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center space-x-2 mb-2">
          <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getTypeColor(project.project_type)}`}>
            {getProjectTypeLabel(project.project_type)}
          </span>
          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColor(project.status)}`}>
            {getProjectStatusLabel(project.status)}
          </span>
        </div>
        
        {project.description && (
          <p className="text-gray-600 text-sm mb-2">{project.description}</p>
        )}
        
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <span>📍 {project.address_street}, {project.address_zip} {project.address_city}</span>
          <span>📏 {formatDistance(project.distance_km)}</span>
          {project.budget && <span>💰 {project.budget.toLocaleString()}€</span>}
        </div>
      </div>
      
      <div className="text-right text-sm text-gray-500">
        <div className="text-lg font-semibold text-blue-600">
          {formatDistance(project.distance_km)}
        </div>
        <div>entfernt</div>
      </div>
    </div>
  );
}

// Dienstleister-Listenelement
function ServiceProviderListItem({ provider }: { provider: ServiceProviderSearchResult }) {
  return (
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center space-x-2 mb-2">
          <h3 className="text-lg font-semibold text-gray-900">
            {provider.first_name} {provider.last_name}
          </h3>
          {provider.is_verified && (
            <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
              ✓ Verifiziert
            </span>
          )}
        </div>
        
        {provider.company_name && (
          <p className="text-gray-600 text-sm mb-2">{provider.company_name}</p>
        )}
        
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <span>📍 {provider.address_street}, {provider.address_zip} {provider.address_city}</span>
          <span>📏 {formatDistance(provider.distance_km)}</span>
        </div>
      </div>
      
      <div className="text-right text-sm text-gray-500">
        <div className="text-lg font-semibold text-blue-600">
          {formatDistance(provider.distance_km)}
        </div>
        <div>entfernt</div>
      </div>
    </div>
  );
}

// Helper-Funktionen (wiederholt für bessere Organisation)
function getTypeColor(type: string) {
  const colors: { [key: string]: string } = {
    'new_build': 'bg-purple-100 text-purple-800',
    'renovation': 'bg-orange-100 text-orange-800',
    'extension': 'bg-indigo-100 text-indigo-800',
    'refurbishment': 'bg-teal-100 text-teal-800'
  };
  return colors[type] || 'bg-gray-100 text-gray-800';
}

function getStatusColor(status: string) {
  const colors: { [key: string]: string } = {
    'planning': 'bg-blue-100 text-blue-800',
    'preparation': 'bg-yellow-100 text-yellow-800',
    'execution': 'bg-green-100 text-green-800',
    'completion': 'bg-gray-100 text-gray-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
} 