import api from './api';

export interface InspectionCreate {
  milestone_id: number;
  scheduled_date: string;
  title: string;
  description?: string;
  scheduled_time_start?: string;
  scheduled_time_end?: string;
  duration_minutes?: number;
  location_address?: string;
  location_notes?: string;
  contact_person?: string;
  contact_phone?: string;
  preparation_notes?: string;
}

export interface InspectionRead {
  id: number;
  milestone_id: number;
  title: string;
  description?: string;
  scheduled_date: string;
  scheduled_time_start?: string;
  scheduled_time_end?: string;
  duration_minutes: number;
  location_address?: string;
  location_notes?: string;
  contact_person?: string;
  contact_phone?: string;
  preparation_notes?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface InspectionInvitationRead {
  id: number;
  inspection_id: number;
  service_provider_id: number;
  quote_id: number;
  status: 'pending' | 'accepted' | 'declined' | 'alternative_suggested';
  response_message?: string;
  alternative_dates?: string[];
  invited_at: string;
  responded_at?: string;
  inspection: InspectionRead;
}

export interface InspectionInvitationUpdate {
  status: 'accepted' | 'declined' | 'alternative_suggested';
  response_message?: string;
  alternative_dates?: string[];
}

export interface QuoteRevisionCreate {
  original_quote_id: number;
  title: string;
  description?: string;
  revision_reason: string;
  total_amount: number;
  currency?: string;
  valid_until?: string;
  labor_cost?: number;
  material_cost?: number;
  overhead_cost?: number;
  estimated_duration?: string;
  start_date?: string;
  completion_date?: string;
  pdf_upload_path?: string;
  additional_documents?: string;
}

export interface QuoteRevisionRead {
  id: number;
  original_quote_id: number;
  inspection_id: number;
  service_provider_id: number;
  title: string;
  description?: string;
  revision_reason: string;
  total_amount: number;
  currency: string;
  valid_until?: string;
  labor_cost?: number;
  material_cost?: number;
  overhead_cost?: number;
  estimated_duration?: string;
  start_date?: string;
  completion_date?: string;
  pdf_upload_path?: string;
  additional_documents?: string;
  status: 'draft' | 'submitted' | 'confirmed' | 'rejected';
  created_at: string;
  updated_at: string;
  confirmed_at?: string;
  rejected_at?: string;
  confirmed_by?: number;
  rejected_by?: number;
  rejection_reason?: string;
}

// Besichtigung erstellen
export const createInspection = async (inspectionData: InspectionCreate): Promise<InspectionRead> => {
  const response = await api.post('/inspections/', inspectionData);
  return response.data;
};

// Dienstleister zur Besichtigung einladen
export const inviteServiceProviders = async (inspectionId: number, quoteIds: number[]): Promise<{ message: string; invitations_count: number }> => {
  const response = await api.post(`/inspections/${inspectionId}/invitations`, quoteIds);
  return response.data;
};

// Besichtigungen laden
export const getInspections = async (milestoneId?: number): Promise<InspectionRead[]> => {
  const params = milestoneId ? { milestone_id: milestoneId } : {};
  const response = await api.get('/inspections/', { params });
  return response.data;
};

// Meine Einladungen laden (für Dienstleister)
export const getMyInvitations = async (): Promise<InspectionInvitationRead[]> => {
  const response = await api.get('/inspections/invitations');
  return response.data;
};

// Auf Einladung antworten
export const respondToInvitation = async (invitationId: number, responseData: InspectionInvitationUpdate): Promise<{ message: string }> => {
  const response = await api.put(`/inspections/invitations/${invitationId}/respond`, responseData);
  return response.data;
};

// Quote-Revision erstellen
export const createQuoteRevision = async (inspectionId: number, revisionData: QuoteRevisionCreate): Promise<QuoteRevisionRead> => {
  const response = await api.post(`/inspections/${inspectionId}/quote-revisions`, revisionData);
  return response.data;
};

// Quote-Revisionen laden
export const getQuoteRevisions = async (inspectionId: number): Promise<QuoteRevisionRead[]> => {
  const response = await api.get(`/inspections/${inspectionId}/quote-revisions`);
  return response.data;
};

// Quote-Revision bestätigen
export const confirmQuoteRevision = async (revisionId: number): Promise<{ message: string }> => {
  const response = await api.post(`/inspections/quote-revisions/${revisionId}/confirm`);
  return response.data;
};

// Quote-Revision ablehnen
export const rejectQuoteRevision = async (revisionId: number, rejectionReason?: string): Promise<{ message: string }> => {
  const response = await api.post(`/inspections/quote-revisions/${revisionId}/reject`, { rejection_reason: rejectionReason });
  return response.data;
};

// Besichtigung abschließen
export const completeInspection = async (inspectionId: number, completionNotes?: string): Promise<{ message: string }> => {
  const response = await api.post(`/inspections/${inspectionId}/complete`, { completion_notes: completionNotes });
  return response.data;
};

// Besichtigung abbrechen
export const cancelInspection = async (inspectionId: number, cancellationReason?: string): Promise<{ message: string }> => {
  const response = await api.post(`/inspections/${inspectionId}/cancel`, { cancellation_reason: cancellationReason });
  return response.data;
};

// Besichtigungspflichtige Gewerke laden
export const getInspectionRequiredMilestones = async (): Promise<any[]> => {
  const response = await api.get('/inspections/milestones/inspection-required');
  return response.data;
}; 