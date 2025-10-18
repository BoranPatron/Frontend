/**
 * Mobile-Optimized Modal Template
 * 
 * Dieses Template zeigt Best Practices für mobile-optimierte Modals.
 * Verwende es als Vorlage für neue Modals oder zur Optimierung bestehender.
 * 
 * Features:
 * - Bottom Sheet Animation auf Mobile
 * - Collapsible Sections
 * - Touch-friendly Buttons
 * - Responsive Layout
 * - Safe Area Support
 */

import React, { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronUp, Save, AlertTriangle } from 'lucide-react';
import { useMobile } from '../../hooks/useMobile';

interface MobileModalTemplateProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: any) => void;
  title: string;
  subtitle?: string;
}

export default function MobileModalTemplate({
  isOpen,
  onClose,
  onSubmit,
  title,
  subtitle
}: MobileModalTemplateProps) {
  const { isMobile, value } = useMobile();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    section1: true,
    section2: true,
    section3: false
  });

  // Form State
  const [formData, setFormData] = useState({
    field1: '',
    field2: '',
    field3: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setFormData({ field1: '', field2: '', field3: '' });
      setErrors({});
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validation
      const newErrors: Record<string, string> = {};
      if (!formData.field1) newErrors.field1 = 'Dieses Feld ist erforderlich';
      
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      // Submit
      if (onSubmit) {
        await onSubmit(formData);
      }
      
      onClose();
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Collapsible Section Component
  const CollapsibleSection = ({
    sectionKey,
    title: sectionTitle,
    icon: Icon,
    children
  }: {
    sectionKey: string;
    title: string;
    icon: React.ElementType;
    children: React.ReactNode;
  }) => {
    const isExpanded = expandedSections[sectionKey];

    return (
      <div className="mobile-collapsible-section">
        <button
          type="button"
          onClick={() => toggleSection(sectionKey)}
          className="mobile-collapsible-header"
        >
          <div className="flex items-center gap-3">
            <Icon className="w-5 h-5 text-[#ffbd59] flex-shrink-0" />
            <h3 className="text-base md:text-lg font-semibold text-white text-left">
              {sectionTitle}
            </h3>
          </div>
          {isMobile && (
            isExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
            )
          )}
        </button>
        {(!isMobile || isExpanded) && (
          <div className="mobile-collapsible-content">
            {children}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mobile-modal-container" onClick={onClose}>
      <div
        className={`mobile-modal-content modal-slideUp`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Sticky */}
        <div className="mobile-modal-header">
          <div className="flex items-center justify-between">
            {/* Title Area */}
            <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
              <div className={`
                bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-xl 
                flex items-center justify-center flex-shrink-0
                ${isMobile ? 'w-10 h-10' : 'w-12 h-12'}
              `}>
                <Save className={`text-white ${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="mobile-modal-title">{title}</h2>
                {subtitle && (
                  <p className="mobile-modal-subtitle">{subtitle}</p>
                )}
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="mobile-icon-button"
              aria-label="Modal schließen"
            >
              <X className={`text-white ${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} />
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-3 md:p-6 space-y-3 md:space-y-6">
          {/* Section 1 */}
          <CollapsibleSection
            sectionKey="section1"
            title="Grunddaten"
            icon={AlertTriangle}
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">
                  Feld 1 *
                </label>
                <input
                  type="text"
                  value={formData.field1}
                  onChange={(e) => setFormData({ ...formData, field1: e.target.value })}
                  className="mobile-input"
                  placeholder="Geben Sie Text ein..."
                  required
                />
                {errors.field1 && (
                  <p className="text-red-400 text-xs mt-1">{errors.field1}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">
                  Feld 2
                </label>
                <select
                  value={formData.field2}
                  onChange={(e) => setFormData({ ...formData, field2: e.target.value })}
                  className="mobile-select"
                >
                  <option value="">Bitte wählen...</option>
                  <option value="option1">Option 1</option>
                  <option value="option2">Option 2</option>
                  <option value="option3">Option 3</option>
                </select>
              </div>
            </div>
          </CollapsibleSection>

          {/* Section 2 */}
          <CollapsibleSection
            sectionKey="section2"
            title="Zusätzliche Informationen"
            icon={AlertTriangle}
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">
                  Beschreibung
                </label>
                <textarea
                  value={formData.field3}
                  onChange={(e) => setFormData({ ...formData, field3: e.target.value })}
                  className="mobile-textarea"
                  placeholder="Optionale Beschreibung..."
                  rows={4}
                />
              </div>

              {/* Horizontal Scroll Example */}
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">
                  Optionen
                </label>
                <div className="mobile-horizontal-scroll">
                  {['Option A', 'Option B', 'Option C', 'Option D'].map((option) => (
                    <button
                      key={option}
                      type="button"
                      className="min-w-[120px] px-4 py-2 bg-white/10 hover:bg-white/20 
                                 text-white rounded-lg transition-colors touch-manipulation"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* Section 3 - Initially Collapsed */}
          <CollapsibleSection
            sectionKey="section3"
            title="Erweiterte Einstellungen"
            icon={AlertTriangle}
          >
            <div className="space-y-4">
              <p className="text-gray-300 text-sm">
                Weitere Einstellungen können hier konfiguriert werden.
              </p>
            </div>
          </CollapsibleSection>

          {/* Action Buttons - Sticky Bottom on Mobile */}
          <div className={`
            flex items-center justify-end gap-3
            ${isMobile ? 'sticky bottom-0 bg-[#1a1a2e]/95 backdrop-blur-lg -mx-3 px-3 py-3 border-t border-white/10' : ''}
          `}>
            <button
              type="button"
              onClick={onClose}
              className="mobile-touch-button bg-white/10 hover:bg-white/20 text-white px-4 py-2"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="mobile-touch-button bg-gradient-to-r from-[#ffbd59] to-[#ffa726] 
                         hover:from-[#ffa726] hover:to-[#ff9800] 
                         disabled:from-gray-600 disabled:to-gray-700 
                         text-white px-6 py-2 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="mobile-spinner w-4 h-4" />
                  <span>Speichere...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Speichern</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

