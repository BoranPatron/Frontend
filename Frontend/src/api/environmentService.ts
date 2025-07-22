import { apiClient } from './api';

export interface EnvironmentStatus {
  current_mode: string;
  fee_percentage: number;
  is_beta: boolean;
  is_production: boolean;
  last_switch?: string;
}

export interface EnvironmentSwitchRequest {
  target_mode: string;
  confirm: boolean;
}

export interface FeeConfiguration {
  current_fee_percentage: number;
  environment_mode: string;
  is_beta_mode: boolean;
  is_production_mode: boolean;
}

export interface EnvironmentInfo {
  application: string;
  environment_mode: string;
  fee_percentage: number;
  features: {
    beta_mode: {
      description: string;
      fee_percentage: number;
      features: string[];
    };
    production_mode: {
      description: string;
      fee_percentage: number;
      features: string[];
    };
  };
}

class EnvironmentService {
  /**
   * Holt den aktuellen Environment-Status (nur für Admins)
   */
  async getEnvironmentStatus(): Promise<EnvironmentStatus> {
    const response = await apiClient.get('/api/v1/environment/status');
    return response.data;
  }

  /**
   * Wechselt den Environment-Modus (nur für Admins)
   */
  async switchEnvironment(targetMode: string, confirm: boolean = false): Promise<any> {
    const response = await apiClient.post('/api/v1/environment/switch', {
      target_mode: targetMode,
      confirm: confirm
    });
    return response.data;
  }

  /**
   * Holt die aktuelle Gebühren-Konfiguration
   */
  async getFeeConfiguration(): Promise<FeeConfiguration> {
    const response = await apiClient.get('/api/v1/environment/fee-config');
    return response.data;
  }

  /**
   * Holt allgemeine Environment-Informationen
   */
  async getEnvironmentInfo(): Promise<EnvironmentInfo> {
    const response = await apiClient.get('/api/v1/environment/info');
    return response.data;
  }

  /**
   * Wechselt zu Beta-Modus
   */
  async switchToBeta(): Promise<any> {
    return this.switchEnvironment('beta');
  }

  /**
   * Wechselt zu Production-Modus
   */
  async switchToProduction(confirm: boolean = true): Promise<any> {
    return this.switchEnvironment('production', confirm);
  }

  /**
   * Prüft ob das System im Beta-Modus läuft
   */
  async isBetaMode(): Promise<boolean> {
    try {
      const config = await this.getFeeConfiguration();
      return config.is_beta_mode;
    } catch (error) {
      console.error('Fehler beim Prüfen des Beta-Modus:', error);
      return false;
    }
  }

  /**
   * Prüft ob das System im Production-Modus läuft
   */
  async isProductionMode(): Promise<boolean> {
    try {
      const config = await this.getFeeConfiguration();
      return config.is_production_mode;
    } catch (error) {
      console.error('Fehler beim Prüfen des Production-Modus:', error);
      return false;
    }
  }

  /**
   * Holt den aktuellen Gebühren-Prozentsatz
   */
  async getCurrentFeePercentage(): Promise<number> {
    try {
      const config = await this.getFeeConfiguration();
      return config.current_fee_percentage;
    } catch (error) {
      console.error('Fehler beim Abrufen des Gebühren-Prozentsatzes:', error);
      return 0.0;
    }
  }
}

export const environmentService = new EnvironmentService(); 