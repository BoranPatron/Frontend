import { apiCall, handleApiError } from './api';

// ============================================
// Type Definitions
// ============================================

export interface Resource {
  id?: number;
  service_provider_id: number;
  project_id?: number | null;
  
  // Zeitraum
  start_date: string;
  end_date: string;
  
  // Ressourcen-Details
  title?: string;
  person_count: number;
  daily_hours?: number;
  total_hours?: number;
  
  // Kategorie
  category: string;
  subcategory?: string;
  
  // Adresse
  address_street?: string;
  address_city?: string;
  address_postal_code?: string;
  address_country?: string;
  latitude?: number;
  longitude?: number;
  
  // Status
  status?: 'available' | 'reserved' | 'allocated' | 'completed' | 'cancelled';
  visibility?: 'public' | 'private' | 'restricted';
  
  // Preise
  hourly_rate?: number;
  daily_rate?: number;
  currency?: string;
  
  // Zusätzliche Informationen
  description?: string;
  skills?: string[];
  equipment?: string[];
  
  // Timestamps
  created_at?: string;
  updated_at?: string;
  
  // Computed fields
  provider_name?: string;
  provider_email?: string;
  active_allocations?: number;
  
  // Bauträger-Zeitraum (gewünschter Zeitraum des Bauträgers)
  builder_preferred_start_date?: string;
  builder_preferred_end_date?: string;
  builder_date_range_notes?: string;
  
  // Erweiterte Dienstleister-Details
  provider_phone?: string;
  provider_company_name?: string;
  provider_company_address?: string;
  provider_company_phone?: string;
  provider_company_website?: string;
  provider_business_license?: string;
  provider_bio?: string;
  provider_region?: string;
  provider_languages?: string;
  
  // Bewertungen
  overall_rating?: number;
  rating_count?: number;
  
  // Detaillierte Bewertungskategorien
  avg_quality_rating?: number;
  avg_timeliness_rating?: number;
  avg_communication_rating?: number;
  avg_value_rating?: number;
}

export interface ResourceAllocation {
  id?: number;
  resource_id: number;
  trade_id: number;
  quote_id?: number | null;
  
  // Allokations-Details
  allocated_person_count: number;
  allocated_start_date: string;
  allocated_end_date: string;
  allocated_hours?: number;
  
  // Status
  allocation_status?: 'pre_selected' | 'invited' | 'offer_requested' | 
                     'offer_submitted' | 'accepted' | 'rejected' | 'completed';
  
  // Preise
  agreed_hourly_rate?: number;
  agreed_daily_rate?: number;
  total_cost?: number;
  
  // Benachrichtigungen
  invitation_sent_at?: string;
  invitation_viewed_at?: string;
  offer_requested_at?: string;
  offer_submitted_at?: string;
  decision_made_at?: string;
  
  // Zusätzliche Infos
  notes?: string;
  rejection_reason?: string;
  priority?: number;
  
  // Relations
  resource?: Resource;
  trade?: any;
  quote?: any;
  
  // Timestamps
  created_at?: string;
  updated_at?: string;
  created_by?: number;
}

export interface ResourceRequest {
  id?: number;
  trade_id: number;
  requested_by: number;
  
  // Anfrage-Details
  category: string;
  subcategory?: string;
  required_person_count: number;
  required_start_date: string;
  required_end_date: string;
  
  // Standort
  location_address?: string;
  location_city?: string;
  location_postal_code?: string;
  max_distance_km?: number;
  
  // Budget
  max_hourly_rate?: number;
  max_total_budget?: number;
  
  // Anforderungen
  required_skills?: string[];
  required_equipment?: string[];
  requirements_description?: string;
  
  // Status
  status?: 'open' | 'searching' | 'partially_filled' | 'filled' | 'cancelled';
  
  // Statistiken
  total_resources_found?: number;
  total_resources_selected?: number;
  total_offers_received?: number;
  
  // Timestamps
  created_at?: string;
  updated_at?: string;
  deadline_at?: string;
}

export interface ResourceCalendarEntry {
  id?: number;
  resource_id?: number;
  allocation_id?: number;
  service_provider_id: number;
  
  entry_date: string;
  person_count: number;
  hours_allocated?: number;
  
  status?: 'available' | 'tentative' | 'confirmed' | 'in_progress' | 'completed';
  
  color?: string;
  label?: string;
}

export interface ResourceKPIs {
  service_provider_id: number;
  calculation_date?: string;
  
  total_resources_available: number;
  total_resources_allocated: number;
  total_resources_completed: number;
  
  total_person_days_available: number;
  total_person_days_allocated: number;
  total_person_days_completed: number;
  
  utilization_rate?: number;
  average_hourly_rate?: number;
  total_revenue?: number;
  
  period_start: string;
  period_end: string;
}

export interface ResourceSearchParams {
  category?: string;
  subcategory?: string;
  start_date?: string;
  end_date?: string;
  min_persons?: number;
  latitude?: number;
  longitude?: number;
  radius_km?: number;
  max_hourly_rate?: number;
  skills?: string[];
  equipment?: string[];
  status?: string;
  service_provider_id?: number;
  project_id?: number;
}

export interface SubmitQuoteFromAllocationData {
  title: string;
  description?: string;
  labor_cost?: number;
  material_cost?: number;
  overhead_cost?: number;
  total_amount: number;
  currency?: string;
  estimated_duration?: number;
  start_date?: string;
  notes?: string;
}

// ============================================
// Resource Service
// ============================================

class ResourceService {
  private baseUrl = '/api/v1/resources';

  // Helper method to construct URLs properly
  private buildUrl(path: string = ''): string {
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return cleanPath ? `${this.baseUrl}/${cleanPath}` : this.baseUrl;
  }

  // ==================== Resources CRUD ====================
  
  async createResource(resource: Resource): Promise<Resource> {
    try {
      const response = await apiCall<Resource>(this.buildUrl(), {
        method: 'POST',
        body: JSON.stringify(resource),
      });
      return response;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  async getResource(id: number): Promise<Resource> {
    try {
      const response = await apiCall<Resource>(this.buildUrl(`${id}`));
      return response;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  async updateResource(id: number, resource: Partial<Resource>): Promise<Resource> {
    try {
      const response = await apiCall<Resource>(this.buildUrl(`${id}`), {
        method: 'PUT',
        body: JSON.stringify(resource),
      });
      return response;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  async updateBuilderPreferredDates(
    id: number, 
    builderPreferredStartDate?: string, 
    builderPreferredEndDate?: string, 
    builderDateRangeNotes?: string
  ): Promise<Resource> {
    try {
      const updateData: Partial<Resource> = {};
      
      if (builderPreferredStartDate) {
        updateData.builder_preferred_start_date = builderPreferredStartDate;
      }
      if (builderPreferredEndDate) {
        updateData.builder_preferred_end_date = builderPreferredEndDate;
      }
      if (builderDateRangeNotes !== undefined) {
        updateData.builder_date_range_notes = builderDateRangeNotes;
      }
      
      const response = await apiCall<Resource>(this.buildUrl(`${id}`), {
        method: 'PUT',
        body: JSON.stringify(updateData),
      });
      return response;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  async deleteResource(id: number): Promise<void> {
    try {
      await apiCall(this.buildUrl(`${id}`), {
        method: 'DELETE',
      });
    } catch (error) {
      throw handleApiError(error);
    }
  }

  async listResources(params?: ResourceSearchParams): Promise<Resource[]> {
    try {
      const queryParams = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              queryParams.append(key, value.join(','));
            } else {
              queryParams.append(key, String(value));
            }
          }
        });
      }
      
      const url = queryParams.toString() 
        ? `${this.buildUrl()}?${queryParams.toString()}`
        : this.buildUrl();
        
      const response = await apiCall<Resource[]>(url);
      return response;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  async searchResourcesGeo(params: ResourceSearchParams): Promise<Resource[]> {
    try {
      const response = await apiCall<Resource[]>(this.buildUrl('search/geo'), {
        method: 'POST',
        body: JSON.stringify(params),
      });
      return response;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  async getMyResources(): Promise<Resource[]> {
    try {
      // Get user ID from localStorage
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const userId = user?.id;
      
      // Add user_id as query parameter if available
      const url = userId ? `${this.buildUrl('my')}?user_id=${userId}` : this.buildUrl('my');
      
      const response = await apiCall<Resource[]>(url);
      return response;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // ==================== Allocations ====================

  async createAllocation(allocation: ResourceAllocation): Promise<ResourceAllocation> {
    try {
      const response = await apiCall<ResourceAllocation>(this.buildUrl('allocations'), {
        method: 'POST',
        body: JSON.stringify(allocation),
      });
      return response;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  async updateAllocation(id: number, allocation: Partial<ResourceAllocation>): Promise<ResourceAllocation> {
    try {
      const response = await apiCall<ResourceAllocation>(this.buildUrl(`allocations/${id}`), {
        method: 'PUT',
        body: JSON.stringify(allocation),
      });
      return response;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  async deleteAllocation(id: number): Promise<void> {
    try {
      await apiCall(this.buildUrl(`allocations/${id}`), {
        method: 'DELETE',
      });
    } catch (error) {
      throw handleApiError(error);
    }
  }

  async getAllocationsByTrade(tradeId: number): Promise<ResourceAllocation[]> {
    try {
      const response = await apiCall<ResourceAllocation[]>(this.buildUrl(`allocations/trade/${tradeId}`));
      return response;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  async getMyAllocations(): Promise<ResourceAllocation[]> {
    try {
      // Get user ID from localStorage
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const userId = user?.id;
      
      // Add user_id as query parameter if available
      const url = userId ? `${this.buildUrl('allocations/my')}?user_id=${userId}` : this.buildUrl('allocations/my');
      
      const response = await apiCall<ResourceAllocation[]>(url);
      return response;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  async getMyPendingAllocations(): Promise<ResourceAllocation[]> {
    try {
      const response = await apiCall<ResourceAllocation[]>(this.buildUrl('allocations/my-pending'));
      return response;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  async getAllocationsByResource(resourceId: number): Promise<ResourceAllocation[]> {
    try {
      const response = await apiCall<ResourceAllocation[]>(this.buildUrl(`allocations/resource/${resourceId}`));
      return response;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  async updateAllocationStatus(
    id: number, 
    status: ResourceAllocation['allocation_status'],
    notes?: string
  ): Promise<ResourceAllocation> {
    try {
      const response = await apiCall<ResourceAllocation>(this.buildUrl(`allocations/${id}/status`), {
        method: 'PUT',
        body: JSON.stringify({ status, notes }),
      });
      return response;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  async submitQuoteFromAllocation(
    allocationId: number,
    quoteData: SubmitQuoteFromAllocationData
  ): Promise<{ message: string; quote_id: number; allocation_id: number; status: string }> {
    try {
      const response = await apiCall<{ message: string; quote_id: number; allocation_id: number; status: string }>(
        this.buildUrl(`allocations/${allocationId}/submit-quote`),
        {
          method: 'POST',
          body: JSON.stringify(quoteData),
        }
      );
      return response;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  async rejectAllocation(
    allocationId: number,
    rejectionReason: string
  ): Promise<{ message: string; allocation_id: number; status: string }> {
    try {
      const response = await apiCall<{ message: string; allocation_id: number; status: string }>(
        this.buildUrl(`allocations/${allocationId}/reject`),
        {
          method: 'POST',
          body: JSON.stringify({ rejection_reason: rejectionReason }),
        }
      );
      return response;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // ==================== Requests ====================

  async createRequest(request: ResourceRequest): Promise<ResourceRequest> {
    try {
      const response = await apiCall<ResourceRequest>(this.buildUrl('requests'), {
        method: 'POST',
        body: JSON.stringify(request),
      });
      return response;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  async updateRequest(id: number, request: Partial<ResourceRequest>): Promise<ResourceRequest> {
    try {
      const response = await apiCall<ResourceRequest>(this.buildUrl(`requests/${id}`), {
        method: 'PUT',
        body: JSON.stringify(request),
      });
      return response;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  async getRequestsByTrade(tradeId: number): Promise<ResourceRequest[]> {
    try {
      const response = await apiCall<ResourceRequest[]>(this.buildUrl(`requests/trade/${tradeId}`));
      return response;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  async matchResourcesForRequest(requestId: number): Promise<Resource[]> {
    try {
      const response = await apiCall<Resource[]>(this.buildUrl(`requests/${requestId}/match`));
      return response;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // ==================== Calendar ====================

  async getCalendarEntries(
    serviceProviderId: number,
    startDate: string,
    endDate: string
  ): Promise<ResourceCalendarEntry[]> {
    try {
      const params = new URLSearchParams({
        service_provider_id: String(serviceProviderId),
        start_date: startDate,
        end_date: endDate,
      });
      
      const response = await apiCall<ResourceCalendarEntry[]>(
        `${this.buildUrl('calendar')}?${params.toString()}`
      );
      return response;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  async createCalendarEntry(entry: ResourceCalendarEntry): Promise<ResourceCalendarEntry> {
    try {
      const response = await apiCall<ResourceCalendarEntry>(this.buildUrl('calendar'), {
        method: 'POST',
        body: JSON.stringify(entry),
      });
      return response;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  async updateCalendarEntry(id: number, entry: Partial<ResourceCalendarEntry>): Promise<ResourceCalendarEntry> {
    try {
      const response = await apiCall<ResourceCalendarEntry>(this.buildUrl(`calendar/${id}`), {
        method: 'PUT',
        body: JSON.stringify(entry),
      });
      return response;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // ==================== KPIs ====================

  async getKPIs(
    serviceProviderId: number,
    periodStart?: string,
    periodEnd?: string
  ): Promise<ResourceKPIs> {
    try {
      const params = new URLSearchParams({
        service_provider_id: String(serviceProviderId),
      });
      
      if (periodStart) params.append('period_start', periodStart);
      if (periodEnd) params.append('period_end', periodEnd);
      
      const response = await apiCall<ResourceKPIs>(
        `${this.buildUrl('kpis')}?${params.toString()}`
      );
      return response;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  async calculateKPIs(serviceProviderId: number): Promise<ResourceKPIs> {
    try {
      const response = await apiCall<ResourceKPIs>(this.buildUrl('kpis/calculate'), {
        method: 'POST',
        body: JSON.stringify({ service_provider_id: serviceProviderId }),
      });
      return response;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // ==================== Bulk Operations ====================

  async bulkCreateAllocations(allocations: ResourceAllocation[]): Promise<ResourceAllocation[]> {
    try {
      const response = await apiCall<ResourceAllocation[]>(this.buildUrl('allocations/bulk'), {
        method: 'POST',
        body: JSON.stringify({ allocations }),
      });
      return response;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  async bulkUpdateAllocationStatus(
    allocationIds: number[],
    status: ResourceAllocation['allocation_status']
  ): Promise<void> {
    try {
      await apiCall(this.buildUrl('allocations/bulk/status'), {
        method: 'PUT',
        body: JSON.stringify({ allocation_ids: allocationIds, status }),
      });
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // ==================== Notifications ====================

  async sendInvitationNotification(allocationId: number): Promise<void> {
    try {
      await apiCall(this.buildUrl(`allocations/${allocationId}/invite`), {
        method: 'POST',
      });
    } catch (error) {
      throw handleApiError(error);
    }
  }

  async markInvitationViewed(allocationId: number): Promise<void> {
    try {
      await apiCall(this.buildUrl(`allocations/${allocationId}/view`), {
        method: 'POST',
      });
    } catch (error) {
      throw handleApiError(error);
    }
  }

  // ==================== Statistics ====================

  async getResourceStatistics(serviceProviderId?: number): Promise<any> {
    try {
      const params = serviceProviderId 
        ? `?service_provider_id=${serviceProviderId}`
        : '';
      
      const response = await apiCall(`${this.buildUrl('statistics')}${params}`);
      return response;
    } catch (error) {
      throw handleApiError(error);
    }
  }

  async getDetailedKPIs(
    serviceProviderId?: number,
    periodStart?: string,
    periodEnd?: string
  ): Promise<any> {
    try {
      const params = new URLSearchParams();
      if (serviceProviderId) params.append('service_provider_id', String(serviceProviderId));
      if (periodStart) params.append('period_start', periodStart);
      if (periodEnd) params.append('period_end', periodEnd);
      
      const url = `${this.buildUrl('kpis/detailed')}?${params.toString()}`;
      console.log('🌐 API Call:', url);
      console.log('📊 Params:', { serviceProviderId, periodStart, periodEnd });
      
      const response = await apiCall(url);
      console.log('✅ API Response:', response);
      return response;
    } catch (error) {
      console.error('❌ API Error:', error);
      throw handleApiError(error);
    }
  }

  async getAvailabilityMatrix(
    category: string,
    startDate: string,
    endDate: string
  ): Promise<any> {
    try {
      const params = new URLSearchParams({
        category,
        start_date: startDate,
        end_date: endDate,
      });
      
      const response = await apiCall(
        `${this.buildUrl('availability-matrix')}?${params.toString()}`
      );
      return response;
    } catch (error) {
      throw handleApiError(error);
    }
  }
}

export const resourceService = new ResourceService();
