import React from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  MapPin,
  Calendar,
  Clock,
  Euro,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  FileText,
  Send,
  Eye,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ResourceNotificationProps {
  notification: {
    id: number;
    type: 'resource_preselection' | 'resource_invitation' | 'resource_offer_requested';
    title: string;
    message: string;
    description?: string;
    timestamp: string;
    isNew: boolean;
    tradeId?: number;
    resourceId?: number;
    allocationId?: number;
    projectName?: string;
    tradeName?: string;
    bautraegerName?: string;
    deadline?: string;
    metadata?: any;
  };
  onDismiss: (id: number) => void;
  onAction?: (type: string, data: any) => void;
}

const ResourceNotification: React.FC<ResourceNotificationProps> = ({
  notification,
  onDismiss,
  onAction
}) => {
  const navigate = useNavigate();

  const getNotificationIcon = () => {
    switch (notification.type) {
      case 'resource_preselection':
        return <Users className="w-5 h-5 text-blue-500" />;
      case 'resource_invitation':
        return <Send className="w-5 h-5 text-[#ffbd59]" />;
      case 'resource_offer_requested':
        return <FileText className="w-5 h-5 text-green-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getNotificationColor = () => {
    switch (notification.type) {
      case 'resource_preselection':
        return 'border-blue-500 bg-blue-50';
      case 'resource_invitation':
        return 'border-[#ffbd59] bg-[#ffbd59]/10';
      case 'resource_offer_requested':
        return 'border-green-500 bg-green-50';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  const handleViewDetails = () => {
    if (notification.tradeId) {
      navigate(`/project/trades/${notification.tradeId}`);
      onAction?.('view_details', { tradeId: notification.tradeId });
    }
  };

  const handleCreateOffer = () => {
    if (notification.tradeId) {
      navigate(`/quotes/create?trade=${notification.tradeId}`);
      onAction?.('create_offer', { tradeId: notification.tradeId });
    }
  };

  const handleDecline = () => {
    if (notification.allocationId) {
      onAction?.('decline_invitation', { 
        allocationId: notification.allocationId,
        resourceId: notification.resourceId 
      });
    }
    onDismiss(notification.id);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Gerade eben';
    if (diffMins < 60) return `vor ${diffMins} Minute${diffMins !== 1 ? 'n' : ''}`;
    if (diffHours < 24) return `vor ${diffHours} Stunde${diffHours !== 1 ? 'n' : ''}`;
    if (diffDays < 7) return `vor ${diffDays} Tag${diffDays !== 1 ? 'en' : ''}`;
    
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className={`relative border-l-4 rounded-lg p-4 mb-3 ${getNotificationColor()} ${
        notification.isNew ? 'shadow-lg' : 'shadow'
      }`}
    >
      {/* New Badge */}
      {notification.isNew && (
        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
          NEU
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-start space-x-3">
          <div className="mt-1">{getNotificationIcon()}</div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900">{notification.title}</h4>
            <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
          </div>
        </div>
        <button
          onClick={() => onDismiss(notification.id)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Details */}
      {notification.description && (
        <div className="mt-3 text-sm text-gray-500 bg-white/50 rounded p-2">
          {notification.description.split('\n').map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      )}

      {/* Metadata Pills */}
      <div className="flex flex-wrap gap-2 mt-3">
        {notification.projectName && (
          <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
            <MapPin className="w-3 h-3 mr-1" />
            {notification.projectName}
          </span>
        )}
        {notification.deadline && (
          <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
            <Clock className="w-3 h-3 mr-1" />
            Frist: {new Date(notification.deadline).toLocaleDateString('de-DE')}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mt-4">
        <span className="text-xs text-gray-400">
          {formatTimestamp(notification.timestamp)}
        </span>
        
        <div className="flex items-center space-x-2">
          {notification.type === 'resource_preselection' && (
            <>
              <button
                onClick={handleViewDetails}
                className="px-3 py-1 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-1"
              >
                <Eye className="w-3 h-3" />
                <span>Details ansehen</span>
              </button>
              <button
                onClick={handleCreateOffer}
                className="px-3 py-1 bg-[#ffbd59] text-black text-xs rounded-lg hover:bg-[#f59e0b] transition-colors flex items-center space-x-1"
              >
                <FileText className="w-3 h-3" />
                <span>Angebot erstellen</span>
              </button>
            </>
          )}
          
          {notification.type === 'resource_invitation' && (
            <>
              <button
                onClick={handleDecline}
                className="px-3 py-1 bg-gray-500 text-white text-xs rounded-lg hover:bg-gray-600 transition-colors"
              >
                Ablehnen
              </button>
              <button
                onClick={handleCreateOffer}
                className="px-3 py-1 bg-green-500 text-white text-xs rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-1"
              >
                <Send className="w-3 h-3" />
                <span>Angebot abgeben</span>
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ResourceNotification;