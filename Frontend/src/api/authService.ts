import { api } from './api';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  user_type: string;
  data_processing_consent: boolean;
  privacy_policy_accepted: boolean;
  terms_accepted: boolean;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    user_type: string;
    auth_provider: string;
    consents: {
      data_processing: boolean;
      marketing: boolean;
      privacy_policy: boolean;
      terms: boolean;
    };
  };
}

export interface ConsentRequest {
  consent_type: string;
  granted: boolean;
}

export interface ConsentStatus {
  data_processing: boolean;
  marketing: boolean;
  privacy_policy: boolean;
  terms: boolean;
  consent_fields: Record<string, any>;
  consent_history: Array<any>;
}

export interface MFASetupResponse {
  secret: string;
  qr_code: string;
  backup_codes: string[];
}

export interface SecurityReport {
  user_id: number;
  email: string;
  mfa_enabled: boolean;
  last_login_at: string | null;
  failed_login_attempts: number;
  account_locked_until: string | null;
  recent_activities: Array<{
    action: string;
    description: string;
    created_at: string;
    ip_address: string | null;
    risk_level: string | null;
  }>;
}

class AuthService {
  private baseUrl = '/auth';

  // Standard E-Mail/Passwort Login
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const formData = new FormData();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    const response = await api.post(`${this.baseUrl}/login`, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  }

  // Registrierung
  async register(userData: RegisterRequest): Promise<LoginResponse> {
    const response = await api.post(`${this.baseUrl}/register`, userData);
    return response.data;
  }

  // Social-Login URLs generieren
  async getOAuthUrl(provider: 'google' | 'microsoft', state?: string): Promise<{ oauth_url: string; provider: string }> {
    const params = new URLSearchParams();
    if (state) params.append('state', state);
    
    const response = await api.get(`/api/v1/auth/oauth/${provider}/url`, { params });
    return response.data;
  }

  // Social-Login Callback verarbeiten
  async processOAuthCallback(provider: 'google' | 'microsoft', code: string, state?: string): Promise<LoginResponse> {
    const data: any = { code };
    if (state) data.state = state;

    const response = await api.post(`/api/v1/auth/oauth/${provider}/callback`, data);
    return response.data;
  }

  // Social-Account verknüpfen
  async linkSocialAccount(provider: 'google' | 'microsoft', code: string): Promise<{ message: string }> {
    const response = await api.post(`/api/v1/auth/link-social-account/${provider}`, { code });
    return response.data;
  }

  // Passwort ändern
  async changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const response = await api.post(`${this.baseUrl}/password-change`, {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return response.data;
  }

  // Passwort-Reset anfordern
  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const response = await api.post(`${this.baseUrl}/password-reset`, { email });
    return response.data;
  }

  // Token erneuern
  async refreshToken(): Promise<{ access_token: string; token_type: string }> {
    const response = await api.post(`${this.baseUrl}/refresh-token`);
    return response.data;
  }

  // Logout
  async logout(): Promise<{ message: string }> {
    const response = await api.post(`${this.baseUrl}/logout`);
    return response.data;
  }

  // E-Mail verifizieren
  async verifyEmail(token: string): Promise<{ message: string }> {
    const response = await api.post(`${this.baseUrl}/verify-email/${token}`);
    return response.data;
  }

  // DSGVO-Funktionen
  async updateConsent(consentType: string, granted: boolean): Promise<{ message: string; consent_type: string; granted: boolean }> {
    const response = await api.post('/api/v1/gdpr/consent', { consent_type: consentType, granted });
    return response.data;
  }

  async getConsentStatus(): Promise<ConsentStatus> {
    const response = await api.get('/api/v1/gdpr/consent-status');
    return response.data;
  }

  async requestDataDeletion(): Promise<{ message: string; deletion_requested_at: string; estimated_deletion_date: string }> {
    const response = await api.post('/api/v1/gdpr/data-deletion-request');
    return response.data;
  }

  async anonymizeData(): Promise<{ message: string; anonymized_at: string }> {
    const response = await api.post('/api/v1/gdpr/data-anonymization');
    return response.data;
  }

  async exportData(): Promise<Blob> {
    const response = await api.get('/api/v1/gdpr/data-export', {
      responseType: 'blob',
    });
    return response.data;
  }

  async generateExportToken(): Promise<{ message: string; token_expires_in_hours: number }> {
    const response = await api.post('/api/v1/gdpr/data-export-token');
    return response.data;
  }

  async downloadDataWithToken(token: string): Promise<Blob> {
    const response = await api.get(`/api/v1/gdpr/data-export/${token}`, {
      responseType: 'blob',
    });
    return response.data;
  }

  // Multi-Factor Authentication
  async setupMFA(): Promise<MFASetupResponse> {
    const response = await api.post('/auth/mfa/setup');
    return response.data;
  }

  async verifyAndEnableMFA(token: string): Promise<{ message: string }> {
    const response = await api.post('/auth/mfa/verify', { token });
    return response.data;
  }

  async verifyMFALogin(token: string): Promise<{ message: string }> {
    const response = await api.post('/auth/mfa/login', { token });
    return response.data;
  }

  async disableMFA(): Promise<{ message: string }> {
    const response = await api.post('/auth/mfa/disable');
    return response.data;
  }

  // Security-Funktionen
  async getSecurityReport(): Promise<SecurityReport> {
    const response = await api.get('/auth/security/report');
    return response.data;
  }

  async invalidateSessions(): Promise<{ message: string }> {
    const response = await api.post('/auth/sessions/invalidate');
    return response.data;
  }

  // Hilfsfunktionen
  redirectToOAuth(provider: 'google' | 'microsoft', state?: string): void {
    this.getOAuthUrl(provider, state).then(({ oauth_url }) => {
      window.location.href = oauth_url;
    });
  }

  handleOAuthCallback(provider: 'google' | 'microsoft'): Promise<LoginResponse> {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');

    if (error) {
      throw new Error(`OAuth error: ${error}`);
    }

    if (!code) {
      throw new Error('No authorization code received');
    }

    return this.processOAuthCallback(provider, code, state || undefined);
  }

  // Token-Management
  setAuthToken(token: string): void {
    localStorage.setItem('access_token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  getAuthToken(): string | null {
    return localStorage.getItem('access_token');
  }

  removeAuthToken(): void {
    localStorage.removeItem('access_token');
    delete api.defaults.headers.common['Authorization'];
  }

  isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }
}

export const authService = new AuthService(); 