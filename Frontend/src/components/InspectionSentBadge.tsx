import React from 'react';
import { Calendar, Clock, Send, CheckCircle, AlertCircle } from 'lucide-react';

interface InspectionSentBadgeProps {
  inspectionSent: boolean;
  inspectionSentAt?: string;
  appointmentCount?: number;
  pendingResponses?: number;
  className?: string;
}

export default function InspectionSentBadge({ 
  inspectionSent, 
  inspectionSentAt, 
  appointmentCount = 0,
  pendingResponses = 0,
  className = '' 
}: InspectionSentBadgeProps) {
  
  if (!inspectionSent) {
    return null;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const hasPendingResponses = pendingResponses > 0;

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      
      {/* Main Badge */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
        hasPendingResponses 
          ? 'bg-orange-100 text-orange-800 border border-orange-200 animate-pulse' 
          : 'bg-green-100 text-green-800 border border-green-200'
      }`}>
        
        {/* Icon */}
        <div className="flex items-center">
          {hasPendingResponses ? (
            <AlertCircle size={16} className="animate-bounce" />
          ) : (
            <CheckCircle size={16} />
          )}
        </div>

        {/* Text */}
        <span>
          {hasPendingResponses 
            ? `Besichtigung versendet (${pendingResponses} ausstehend)` 
            : 'Besichtigung versendet'
          }
        </span>

        {/* Appointment Count */}
        {appointmentCount > 0 && (
          <div className="bg-white bg-opacity-50 rounded-full px-2 py-1 text-xs font-bold">
            {appointmentCount}
          </div>
        )}
      </div>

      {/* Timestamp */}
      {inspectionSentAt && (
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Clock size={12} />
          {formatDate(inspectionSentAt)}
        </div>
      )}

      {/* Status Indicator */}
      {hasPendingResponses && (
        <div className="flex items-center gap-1 text-xs text-orange-600 animate-pulse">
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-ping"></div>
          Warten auf Antworten
        </div>
      )}
    </div>
  );
} 