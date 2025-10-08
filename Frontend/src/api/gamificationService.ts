/**
 * Service für Gamification und Rang-System
 * Bietet API-Zugriff auf Benutzer-Ränge und Gamification-Features
 */

export interface RankInfo {
  key: string;
  title: string;
  emoji: string;
  description: string;
  min_count: number;
}

export interface ProgressInfo {
  current: number;
  needed: number;
  progress_percentage: number;
}

export interface UserRankResponse {
  user_id: number;
  user_name: string;
  company_name?: string;
  completed_count: number;
  current_rank: RankInfo;
  next_rank?: RankInfo;
  progress: ProgressInfo;
  rank_updated_at?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Lädt den aktuellen Rang des eingeloggten Benutzers
 */
export async function getMyRank(): Promise<UserRankResponse> {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Kein Authentifizierungstoken gefunden');
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/api/user/my-rank`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Fehler beim Laden des Benutzer-Rangs:', error);
    throw error;
  }
}

/**
 * Lädt die Rangliste der besten Dienstleister
 */
export async function getLeaderboard(limit: number = 10): Promise<any[]> {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Kein Authentifizierungstoken gefunden');
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/gamification/leaderboard?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.leaderboard || [];
  } catch (error) {
    console.error('Fehler beim Laden der Rangliste:', error);
    throw error;
  }
}

/**
 * Lädt Informationen über das Rang-System
 */
export async function getRankSystemInfo(): Promise<any> {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Kein Authentifizierungstoken gefunden');
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/gamification/ranks`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Fehler beim Laden der Rang-System-Informationen:', error);
    throw error;
  }
}
