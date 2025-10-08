import React, { useState, useEffect } from 'react';
import { Bell, BellOff, CheckCircle } from 'lucide-react';
import { TRADE_CATEGORIES, getCategoryLabelWithEmoji } from '../constants/tradeCategories';
import { notificationPreferenceService, type NotificationPreference } from '../api/notificationPreferenceService';
import { type Contact } from '../api/contactService';

interface NotificationPreferencesProps {
  contact: Contact;
  onUpdate?: () => void;
}

export default function NotificationPreferences({ contact, onUpdate }: NotificationPreferencesProps) {
  const [enabled, setEnabled] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [preference, setPreference] = useState<NotificationPreference | null>(null);

  // Lade bestehende Präferenzen
  useEffect(() => {
    if (contact.id) {
      loadPreferences();
    }
  }, [contact.id]);

  const loadPreferences = async () => {
    try {
      const pref = await notificationPreferenceService.getPreferenceByContactId(contact.id);
      if (pref) {
        setPreference(pref);
        setEnabled(pref.enabled);
        setSelectedCategories(pref.categories || []);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Benachrichtigungspräferenzen:', error);
    }
  };

  const handleToggleEnabled = async (newEnabled: boolean) => {
    setIsSaving(true);
    try {
      if (preference?.id && newEnabled === false) {
        // Deaktivieren
        await notificationPreferenceService.togglePreference(preference.id, false);
        setEnabled(false);
      } else {
        // Aktivieren oder erstellen
        const data = {
          contact_id: contact.id,
          service_provider_id: contact.service_provider_id!,
          enabled: newEnabled,
          categories: selectedCategories
        };
        const updated = await notificationPreferenceService.upsertPreference(data);
        setPreference(updated);
        setEnabled(newEnabled);
      }
      
      if (onUpdate) onUpdate();
      
      // Event für andere Komponenten auslösen
      window.dispatchEvent(new CustomEvent('notificationPreferenceUpdated', {
        detail: { contactId: contact.id }
      }));
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Benachrichtigungen:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleCategory = async (categoryValue: string) => {
    const newCategories = selectedCategories.includes(categoryValue)
      ? selectedCategories.filter(cat => cat !== categoryValue)
      : [...selectedCategories, categoryValue];
    
    setSelectedCategories(newCategories);
    
    // Sofort speichern
    if (!contact.service_provider_id) {
      console.warn('Kein service_provider_id vorhanden');
      return;
    }

    setIsSaving(true);
    try {
      const data = {
        contact_id: contact.id,
        service_provider_id: contact.service_provider_id,
        enabled: true, // Immer aktiviert wenn Kategorien ausgewählt sind
        categories: newCategories
      };
      const updated = await notificationPreferenceService.upsertPreference(data);
      setPreference(updated);
      
      if (onUpdate) onUpdate();
      
      // Event für andere Komponenten auslösen
      window.dispatchEvent(new CustomEvent('notificationPreferenceUpdated', {
        detail: { contactId: contact.id }
      }));
      
      console.log('✅ Kategorie direkt gespeichert:', categoryValue);
    } catch (error) {
      console.error('Fehler beim Speichern der Kategorie:', error);
      // Bei Fehler zurücksetzen
      setSelectedCategories(selectedCategories);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectAll = async () => {
    const allCategories = TRADE_CATEGORIES.map(cat => cat.value);
    setSelectedCategories(allCategories);
    
    // Sofort speichern
    if (!contact.service_provider_id) {
      console.warn('Kein service_provider_id vorhanden');
      return;
    }

    setIsSaving(true);
    try {
      const data = {
        contact_id: contact.id,
        service_provider_id: contact.service_provider_id,
        enabled: true,
        categories: allCategories
      };
      const updated = await notificationPreferenceService.upsertPreference(data);
      setPreference(updated);
      
      if (onUpdate) onUpdate();
      
      window.dispatchEvent(new CustomEvent('notificationPreferenceUpdated', {
        detail: { contactId: contact.id }
      }));
      
      console.log('✅ Alle Kategorien ausgewählt und gespeichert');
    } catch (error) {
      console.error('Fehler beim Speichern aller Kategorien:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeselectAll = async () => {
    setSelectedCategories([]);
    
    // Sofort speichern
    if (!contact.service_provider_id) {
      console.warn('Kein service_provider_id vorhanden');
      return;
    }

    setIsSaving(true);
    try {
      const data = {
        contact_id: contact.id,
        service_provider_id: contact.service_provider_id,
        enabled: false, // Deaktivieren wenn keine Kategorien ausgewählt
        categories: []
      };
      const updated = await notificationPreferenceService.upsertPreference(data);
      setPreference(updated);
      setEnabled(false);
      
      if (onUpdate) onUpdate();
      
      window.dispatchEvent(new CustomEvent('notificationPreferenceUpdated', {
        detail: { contactId: contact.id }
      }));
      
      console.log('✅ Alle Kategorien abgewählt und gespeichert');
    } catch (error) {
      console.error('Fehler beim Abwählen aller Kategorien:', error);
    } finally {
      setIsSaving(false);
    }
  };


  // Wenn kein service_provider_id vorhanden ist, zeige nichts an
  if (!contact.service_provider_id) {
    return null;
  }

  return (
    <div className="mt-6 p-4 bg-gradient-to-br from-[#2c3539]/60 to-[#1a1a2e]/60 backdrop-blur-sm rounded-lg border border-white/10">
      {/* Haupt-Checkbox */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleToggleEnabled(!enabled)}
            disabled={isSaving}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
              enabled ? 'bg-[#ffbd59]' : 'bg-gray-600'
            } ${isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          
          <div className="flex items-center gap-2">
            {enabled ? (
              <Bell size={18} className="text-[#ffbd59]" />
            ) : (
              <BellOff size={18} className="text-gray-400" />
            )}
            <span className="text-sm font-medium text-white">
              Benachrichtigungen für Ausschreibungen
            </span>
          </div>
        </div>

        {enabled && (
          <div className="text-xs text-gray-400">
            {selectedCategories.length} Kategorien ausgewählt
          </div>
        )}
      </div>

      {/* Beschreibung */}
      <p className="text-xs text-gray-400 mb-4">
        {enabled
          ? 'Dieser Dienstleister erhält Benachrichtigungen, wenn Sie eine Ausschreibung in den ausgewählten Kategorien erstellen.'
          : 'Aktivieren Sie Benachrichtigungen, um diesen Dienstleister automatisch über neue Ausschreibungen zu informieren.'}
      </p>

      {/* Direkte anklickbare Kategorien-Tags */}
      {enabled && (
        <div className="mt-4">
          <div className="text-xs text-gray-400 mb-3">
            Klicken Sie auf eine Kategorie, um sie zu aktivieren/deaktivieren:
          </div>
          
          {/* Alle Kategorien als anklickbare Tags */}
          <div className="flex flex-wrap gap-2">
            {TRADE_CATEGORIES.map(category => {
              const isSelected = selectedCategories.includes(category.value);
              return (
                <button
                  key={category.value}
                  onClick={() => handleToggleCategory(category.value)}
                  disabled={isSaving}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                    isSelected
                      ? 'bg-[#ffbd59]/20 text-[#ffbd59] border border-[#ffbd59]/30 hover:bg-[#ffbd59]/30 shadow-lg shadow-[#ffbd59]/20'
                      : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 hover:text-white hover:border-white/20'
                  } ${isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}`}
                >
                  <span>{category.emoji}</span>
                  <span>{category.label}</span>
                  {isSelected && <CheckCircle size={12} className="text-[#ffbd59]" />}
                </button>
              );
            })}
          </div>
          
          {/* Schnellauswahl-Buttons */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleSelectAll}
              disabled={isSaving}
              className="px-3 py-1.5 text-xs bg-[#ffbd59]/20 text-[#ffbd59] rounded-lg hover:bg-[#ffbd59]/30 transition-colors border border-[#ffbd59]/30 disabled:opacity-50"
            >
              Alle auswählen
            </button>
            <button
              onClick={handleDeselectAll}
              disabled={isSaving}
              className="px-3 py-1.5 text-xs bg-white/5 text-gray-300 rounded-lg hover:bg-white/10 transition-colors border border-white/10 disabled:opacity-50"
            >
              Alle abwählen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

