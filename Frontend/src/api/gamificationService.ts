/**
 * Service für Gamification und Rang-System
 * Bietet API-Zugriff auf Benutzer-Ränge und Gamification-Features
 */

import api from './api';

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

/**
 * Lädt den aktuellen Rang des eingeloggten Benutzers
 */
export async function getMyRank(): Promise<UserRankResponse> {
  try {
    const response = await api.get('/api/v1/user/my-rank');
    return response.data;
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
    const response = await api.get(`/api/v1/gamification/leaderboard?limit=${limit}`);
    return response.data.leaderboard || [];
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
    const response = await api.get('/api/v1/gamification/ranks');
    return response.data;
  } catch (error) {
    console.error('Fehler beim Laden der Rang-System-Informationen:', error);
    throw error;
  }
}
