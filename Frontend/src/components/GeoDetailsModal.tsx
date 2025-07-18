import React from 'react';
import type { ProjectSearchResult, ServiceProviderSearchResult } from '../api/geoService';
import { formatDistance } from '../api/geoService';

interface GeoDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ProjectSearchResult | ServiceProviderSearchResult | null;
  searchMode: 'projects' | 'service_providers';
}

export default function GeoDetailsModal({ 
  isOpen, 
  onClose, 
  item, 
  searchMode 
}: GeoDetailsModalProps) {
  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {searchMode === 'projects' ? 'Projektdetails' : 'Dienstleister-Details'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6">
          {searchMode === 'projects' ? (
            <ProjectDetailsContent project={item as ProjectSearchResult} />
          ) : (
            <ServiceProviderDetailsContent provider={item as ServiceProviderSearchResult} />
          )}
        </div>
      </div>
    </div>
  );
}

// Projekt-Details Inhalt
function ProjectDetailsContent({ project }: { project: ProjectSearchResult }) {
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-gray-200 pb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{project.name}</h3>
            {project.description && (
              <p className="text-gray-600 text-lg">{project.description}</p>
            )}
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600 mb-1">
              {formatDistance(project.distance_km)}
            </div>
            <div className="text-sm text-gray-500">entfernt</div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <span className={`inline-block px-4 py-2 rounded-lg text-sm font-medium ${getTypeColor(project.project_type)}`}>
            {getProjectTypeLabel(project.project_type)}
          </span>
          <span className={`inline-block px-4 py-2 rounded-lg text-sm font-medium ${getStatusColor(project.status)}`}>
            {getProjectStatusLabel(project.status)}
          </span>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Adresse */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Adresse
          </h4>
          <div className="space-y-2">
            <p className="text-gray-900 font-medium">{project.address_street}</p>
            <p className="text-gray-600">{project.address_zip} {project.address_city}</p>
            <p className="text-sm text-gray-500">Deutschland</p>
          </div>
        </div>

        {/* Budget */}
        {project.budget && (
          <div className="bg-green-50 rounded-lg p-6">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              Budget
            </h4>
            <div className="text-2xl font-bold text-green-600">
              {project.budget.toLocaleString()}€
            </div>
            <p className="text-sm text-gray-500 mt-1">Verfügbares Budget</p>
          </div>
        )}

        {/* Erstellt */}
        {project.created_at && (
          <div className="bg-blue-50 rounded-lg p-6">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Erstellt
            </h4>
            <div className="text-lg font-semibold text-blue-600">
              {new Date(project.created_at).toLocaleDateString('de-DE', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
            <p className="text-sm text-gray-500 mt-1">Projekt erstellt</p>
          </div>
        )}

        {/* Geodaten */}
        <div className="bg-purple-50 rounded-lg p-6">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Geodaten
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Breitengrad:</span>
              <span className="font-mono">{project.address_latitude.toFixed(6)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Längengrad:</span>
              <span className="font-mono">{project.address_longitude.toFixed(6)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Entfernung:</span>
              <span className="font-semibold">{formatDistance(project.distance_km)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Aktionen */}
      <div className="border-t border-gray-200 pt-6">
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
          <button className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
            <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Projekt öffnen
          </button>
          <button className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
            <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Kontakt aufnehmen
          </button>
          <button className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium">
            <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            Zu Favoriten
          </button>
        </div>
      </div>
    </div>
  );
}

// Dienstleister-Details Inhalt
function ServiceProviderDetailsContent({ provider }: { provider: ServiceProviderSearchResult }) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-gray-200 pb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {provider.first_name} {provider.last_name}
            </h3>
            {provider.company_name && (
              <p className="text-gray-600 text-lg">{provider.company_name}</p>
            )}
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600 mb-1">
              {formatDistance(provider.distance_km)}
            </div>
            <div className="text-sm text-gray-500">entfernt</div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {provider.is_verified ? (
            <span className="inline-block px-4 py-2 rounded-lg text-sm font-medium bg-green-100 text-green-800">
              <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Verifiziert
            </span>
          ) : (
            <span className="inline-block px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-800">
              Nicht verifiziert
            </span>
          )}
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Adresse */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Adresse
          </h4>
          <div className="space-y-2">
            <p className="text-gray-900 font-medium">{provider.address_street}</p>
            <p className="text-gray-600">{provider.address_zip} {provider.address_city}</p>
            <p className="text-sm text-gray-500">Deutschland</p>
          </div>
        </div>

        {/* Verifizierung */}
        <div className={`rounded-lg p-6 ${provider.is_verified ? 'bg-green-50' : 'bg-gray-50'}`}>
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Verifizierung
          </h4>
          <div className={`text-lg font-semibold ${provider.is_verified ? 'text-green-600' : 'text-gray-600'}`}>
            {provider.is_verified ? 'Verifiziert' : 'Nicht verifiziert'}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {provider.is_verified ? 'Identität bestätigt' : 'Identität nicht bestätigt'}
          </p>
        </div>

        {/* Geodaten */}
        <div className="bg-purple-50 rounded-lg p-6">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Geodaten
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Breitengrad:</span>
              <span className="font-mono">{provider.address_latitude.toFixed(6)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Längengrad:</span>
              <span className="font-mono">{provider.address_longitude.toFixed(6)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Entfernung:</span>
              <span className="font-semibold">{formatDistance(provider.distance_km)}</span>
            </div>
          </div>
        </div>

        {/* Verfügbarkeit */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Verfügbarkeit
          </h4>
          <div className="text-lg font-semibold text-blue-600">
            Verfügbar
          </div>
          <p className="text-sm text-gray-500 mt-1">Für neue Projekte</p>
        </div>
      </div>

      {/* Aktionen */}
      <div className="border-t border-gray-200 pt-6">
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
          <button className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
            <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Profil anzeigen
          </button>
          <button className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
            <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Kontakt aufnehmen
          </button>
          <button className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium">
            <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            Zu Favoriten
          </button>
        </div>
      </div>
    </div>
  );
} 