/**
 * Geo-Service für BuildWise Frontend
 * Handhabt Umkreissuche, Geocoding und Standortverwaltung
 */

import { getApiBaseUrl, safeApiCall, apiCall } from './api';

// Interfaces für Geo-basierte Suche
export interface Address {
  street: string;
  zip_code: string;
  city: string;
  country: string;
}

export interface Location {
  latitude: number;
  longitude: number;
  radius_km?: number;
}

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  display_name: string;
  confidence: number;
}

export interface ProjectSearchRequest {
  latitude: number;
  longitude: number;
  radius_km: number;
  project_type?: string;
  status?: string;
  min_budget?: number;
  max_budget?: number;
  limit?: number;
}

export interface ProjectSearchResult {
  id: number;
  name: string;
  description?: string;
  project_type: string;
  status: string;
  address_street: string;
  address_zip: string;
  address_city: string;
  address_latitude: number;
  address_longitude: number;
  budget?: number;
  distance_km: number;
  created_at?: string;
}

export interface TradeSearchRequest {
  latitude: number;
  longitude: number;
  radius_km: number;
  category?: string;
  status?: string;
  priority?: string;
  min_budget?: number;
  max_budget?: number;
  limit?: number;
}

export interface TradeSearchResult {
  id: number;
  title: string;
  description?: string;
  category: string;
  status: string;
  priority: string;
  budget?: number;
  planned_date: string;
  start_date?: string;
  end_date?: string;
  progress_percentage: number;
  contractor?: string;
  // Besichtigungssystem
  requires_inspection?: boolean;
  // Benachrichtigungssystem
  has_unread_messages_bautraeger?: boolean;
  has_unread_messages_dienstleister?: boolean;
  // Legacy: Behalten für Rückwärtskompatibilität
  has_unread_messages?: boolean;
  // Projekt-Informationen
  project_id: number;
  project_name: string;
  project_type: string;
  project_status: string;
  // Adress-Informationen (vom übergeordneten Projekt)
  project_address: string;  // Vollständige Projektadresse
  address_street: string;
  address_zip: string;
  address_city: string;
  address_latitude: number;
  address_longitude: number;
  distance_km: number;
  created_at?: string;
  // Dokumente
  documents?: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
  // Badge-System Daten
  quote_stats: {
    total_quotes: number;
    accepted_quotes: number;
    pending_quotes: number;
    rejected_quotes: number;
    has_accepted_quote: boolean;
    has_pending_quotes: boolean;
    has_rejected_quotes: boolean;
  };
  // Neue Felder für erweiterte Features
  completion_status?: string;
  invoice_generated?: boolean;
  invoice_amount?: number;
  invoice_due_date?: string;
  invoice_pdf_url?: string;
}

export interface ServiceProviderSearchRequest {
  latitude: number;
  longitude: number;
  radius_km: number;
  user_type?: string;
  limit?: number;
}

export interface ServiceProviderSearchResult {
  id: number;
  first_name: string;
  last_name: string;
  company_name?: string;
  address_street: string;
  address_zip: string;
  address_city: string;
  address_latitude: number;
  address_longitude: number;
  distance_km: number;
  is_verified: boolean;
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  address: Address;
  geocoded: boolean;
}

// Geocoding-Funktionen
export async function geocodeAddress(address: Address): Promise<GeocodingResult> {
  return safeApiCall(async () => {
    const response = await apiCall<GeocodingResult>('/api/v1/geo/geocode', {
      method: 'POST',
      body: JSON.stringify(address)
    });

    return response;
  });
}

export async function reverseGeocode(location: Location): Promise<Address> {
  return safeApiCall(async () => {
    const response = await apiCall<Address>('/api/v1/geo/reverse-geocode', {
      method: 'POST',
      body: JSON.stringify(location)
    });

    return response;
  });
}

// Projekt-Suche
export async function searchProjectsInRadius(searchRequest: ProjectSearchRequest): Promise<ProjectSearchResult[]> {
  return safeApiCall(async () => {
    const response = await apiCall<ProjectSearchResult[]>('/api/v1/geo/search-projects', {
      method: 'POST',
      body: JSON.stringify(searchRequest)
    });

    return response;
  });
}

// Gewerk-Suche (für Dienstleister)
export async function searchTradesInRadius(searchRequest: TradeSearchRequest): Promise<TradeSearchResult[]> {
  return safeApiCall(async () => {
    const response = await apiCall<TradeSearchResult[]>('/api/v1/geo/search-trades', {
      method: 'POST',
      body: JSON.stringify(searchRequest)
    });

    return response;
  });
}

// Dienstleister-Suche
export async function searchServiceProvidersInRadius(searchRequest: ServiceProviderSearchRequest): Promise<ServiceProviderSearchResult[]> {
  return safeApiCall(async () => {
    const response = await apiCall<ServiceProviderSearchResult[]>('/api/v1/geo/search-service-providers', {
      method: 'POST',
      body: JSON.stringify(searchRequest)
    });

    return response;
  });
}

// Geocoding-Updates
export async function updateUserGeocoding(userId: number): Promise<{ message: string }> {
  return safeApiCall(async () => {
    const response = await apiCall<{ message: string }>(`/api/v1/geo/update-user-geocoding/${userId}`, {
      method: 'POST'
    });

    return response;
  });
}

export async function updateProjectGeocoding(projectId: number): Promise<{ message: string }> {
  return safeApiCall(async () => {
    const response = await apiCall<{ message: string }>(`/api/v1/geo/update-project-geocoding/${projectId}`, {
      method: 'POST'
    });

    return response;
  });
}

// Aktuelle Position abrufen
export async function getCurrentLocation(): Promise<UserLocation> {
  return safeApiCall(async () => {
    const response = await apiCall<UserLocation>('/api/v1/geo/get-current-location');

    return response;
  });
}

// Browser-Geolocation
export async function getBrowserLocation(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation wird von diesem Browser nicht unterstützt'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        reject(new Error(`Geolocation-Fehler: ${error.message}`));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  });
}

// Hilfsfunktionen
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Erdradius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  } else if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)}km`;
  } else {
    return `${Math.round(distanceKm)}km`;
  }
}

export function validateAddress(address: Address): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!address.street || address.street.trim().length === 0) {
    errors.push('Straße ist erforderlich');
  }
  
  if (!address.zip_code || address.zip_code.trim().length === 0) {
    errors.push('PLZ ist erforderlich');
  }
  
  if (!address.city || address.city.trim().length === 0) {
    errors.push('Ort ist erforderlich');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function formatAddress(address: Address): string {
  return `${address.street}, ${address.zip_code} ${address.city}, ${address.country}`;
}

export function formatShortAddress(address: Address): string {
  return `${address.street}, ${address.zip_code} ${address.city}`;
} 