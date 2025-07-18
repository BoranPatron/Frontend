/**
 * Geo-Service für BuildWise Frontend
 * Handhabt Umkreissuche, Geocoding und Standortverwaltung
 */

import { getApiBaseUrl, safeApiCall } from './api';

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
  // Projekt-Informationen
  project_id: number;
  project_name: string;
  project_type: string;
  project_status: string;
  // Adress-Informationen (vom übergeordneten Projekt)
  address_street: string;
  address_zip: string;
  address_city: string;
  address_latitude: number;
  address_longitude: number;
  distance_km: number;
  created_at?: string;
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
    const response = await fetch(`${getApiBaseUrl()}/geo/geocode`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(address)
    });

    if (!response.ok) {
      throw new Error(`Geocoding fehlgeschlagen: ${response.statusText}`);
    }

    return response.json();
  });
}

export async function reverseGeocode(location: Location): Promise<Address> {
  return safeApiCall(async () => {
    const response = await fetch(`${getApiBaseUrl()}/geo/reverse-geocode`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(location)
    });

    if (!response.ok) {
      throw new Error(`Reverse-Geocoding fehlgeschlagen: ${response.statusText}`);
    }

    return response.json();
  });
}

// Projekt-Suche
export async function searchProjectsInRadius(searchRequest: ProjectSearchRequest): Promise<ProjectSearchResult[]> {
  return safeApiCall(async () => {
    const response = await fetch(`${getApiBaseUrl()}/geo/search-projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(searchRequest)
    });

    if (!response.ok) {
      throw new Error(`Projekt-Suche fehlgeschlagen: ${response.statusText}`);
    }

    return response.json();
  });
}

// Gewerk-Suche (für Dienstleister)
export async function searchTradesInRadius(searchRequest: TradeSearchRequest): Promise<TradeSearchResult[]> {
  return safeApiCall(async () => {
    const response = await fetch(`${getApiBaseUrl()}/geo/search-trades`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(searchRequest)
    });

    if (!response.ok) {
      throw new Error(`Gewerk-Suche fehlgeschlagen: ${response.statusText}`);
    }

    return response.json();
  });
}

// Dienstleister-Suche
export async function searchServiceProvidersInRadius(searchRequest: ServiceProviderSearchRequest): Promise<ServiceProviderSearchResult[]> {
  return safeApiCall(async () => {
    const response = await fetch(`${getApiBaseUrl()}/geo/search-service-providers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(searchRequest)
    });

    if (!response.ok) {
      throw new Error(`Dienstleister-Suche fehlgeschlagen: ${response.statusText}`);
    }

    return response.json();
  });
}

// Geocoding-Updates
export async function updateUserGeocoding(userId: number): Promise<{ message: string }> {
  return safeApiCall(async () => {
    const response = await fetch(`${getApiBaseUrl()}/geo/update-user-geocoding/${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error(`User-Geocoding-Update fehlgeschlagen: ${response.statusText}`);
    }

    return response.json();
  });
}

export async function updateProjectGeocoding(projectId: number): Promise<{ message: string }> {
  return safeApiCall(async () => {
    const response = await fetch(`${getApiBaseUrl()}/geo/update-project-geocoding/${projectId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error(`Projekt-Geocoding-Update fehlgeschlagen: ${response.statusText}`);
    }

    return response.json();
  });
}

// Aktuelle Position abrufen
export async function getCurrentLocation(): Promise<UserLocation> {
  return safeApiCall(async () => {
    const response = await fetch(`${getApiBaseUrl()}/geo/get-current-location`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error(`Aktuelle Position konnte nicht abgerufen werden: ${response.statusText}`);
    }

    return response.json();
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