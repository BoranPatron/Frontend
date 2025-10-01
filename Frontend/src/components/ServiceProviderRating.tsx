import React, { useState } from 'react';
import { X, Star } from 'lucide-react';
import { apiCall } from '../api/api';

interface ServiceProviderRatingProps {
  isOpen?: boolean;
  onClose?: () => void;
  serviceProviderId: number;
  projectId?: number;
  milestoneId?: number;
  quoteId?: number;
  onRatingComplete?: () => void;
  className?: string;
}

interface RatingCategory {
  key: string;
  label: string;
  description: string;
  value: number;
}

export default function ServiceProviderRating({
  isOpen = true,
  onClose = () => {},
  serviceProviderId,
  projectId,
  milestoneId,
  quoteId,
  onRatingComplete = () => {},
  className = ''
}: ServiceProviderRatingProps) {
  const [categories, setCategories] = useState<RatingCategory[]>([
    {
      key: 'quality_rating',
      label: 'Qualität der Ausführung',
      description: 'Wie zufrieden sind Sie mit der handwerklichen Qualität des Gewerkes?',
      value: 0
    },
    {
      key: 'timeliness_rating',
      label: 'Termintreue',
      description: 'Wurde der vereinbarte Zeitrahmen eingehalten?',
      value: 0
    },
    {
      key: 'communication_rating',
      label: 'Kommunikation & Erreichbarkeit',
      description: 'Wie bewerten Sie die Kommunikation mit dem Dienstleister während der Bauphase?',
      value: 0
    },
    {
      key: 'value_rating',
      label: 'Preis-Leistungs-Verhältnis',
      description: 'Wie fair war das Preis-Leistungs-Verhältnis aus Ihrer Sicht?',
      value: 0
    }
  ]);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRatingChange = (categoryKey: string, rating: number) => {
    setCategories(prev => prev.map(cat => 
      cat.key === categoryKey ? { ...cat, value: rating } : cat
    ));
  };

  const handleSubmit = async () => {
    // Prüfe ob alle Kategorien bewertet wurden
    const allRated = categories.every(cat => cat.value > 0);
    if (!allRated) {
      alert('Bitte bewerten Sie alle Kategorien.');
      return;
    }

    setIsSubmitting(true);
    try {
      const ratingData = {
        service_provider_id: serviceProviderId,
        project_id: projectId,
        milestone_id: milestoneId,
        quote_id: quoteId,
        quality_rating: categories.find(c => c.key === 'quality_rating')?.value || 0,
        timeliness_rating: categories.find(c => c.key === 'timeliness_rating')?.value || 0,
        communication_rating: categories.find(c => c.key === 'communication_rating')?.value || 0,
        value_rating: categories.find(c => c.key === 'value_rating')?.value || 0,
        comment: comment || null,
        is_public: 1
      };

      await apiCall('/ratings', {
        method: 'POST',
        body: JSON.stringify(ratingData)
      });

      onRatingComplete();
    } catch (error) {
      console.error('Fehler beim Senden der Bewertung:', error);
      alert('Fehler beim Senden der Bewertung. Bitte versuchen Sie es erneut.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (category: RatingCategory) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => handleRatingChange(category.key, star)}
            className="p-1 transition-all hover:scale-110"
            disabled={isSubmitting}
          >
            <Star
              size={32}
              className={`${
                star <= category.value
                  ? 'fill-[#ffbd59] text-[#ffbd59]'
                  : 'fill-transparent text-gray-500'
              } transition-colors`}
            />
          </button>
        ))}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-[#1a1a2e] to-[#2c3539] rounded-2xl shadow-2xl border border-gray-600/30 max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-600/30">
          <h2 className="text-xl font-bold text-white">Dienstleister bewerten</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <p className="text-gray-400 mb-6">
            Bitte bewerten Sie den Dienstleister in den folgenden Kategorien. Ihre Bewertung hilft anderen Bauträgern bei der Auswahl qualifizierter Dienstleister.
          </p>

          <div className="space-y-6">
            {categories.map((category) => (
              <div key={category.key} className="bg-[#1a1a2e]/50 rounded-xl p-6 border border-gray-600/30">
                <h3 className="text-lg font-semibold text-white mb-2">{category.label}</h3>
                <p className="text-sm text-gray-400 mb-4">{category.description}</p>
                {renderStars(category)}
              </div>
            ))}

            <div className="bg-[#1a1a2e]/50 rounded-xl p-6 border border-gray-600/30">
              <h3 className="text-lg font-semibold text-white mb-2">Kommentar (optional)</h3>
              <p className="text-sm text-gray-400 mb-4">
                Teilen Sie Ihre Erfahrungen mit anderen Bauträgern.
              </p>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Ihre Erfahrungen mit diesem Dienstleister..."
                className="w-full px-4 py-3 bg-[#1a1a2e] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffbd59] resize-none"
                rows={4}
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-600/30 flex gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || categories.some(cat => cat.value === 0)}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-[#1a1a2e] font-semibold rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50"
          >
            {isSubmitting ? 'Wird gesendet...' : 'Bewertung abgeben'}
          </button>
        </div>
      </div>
    </div>
  );
}