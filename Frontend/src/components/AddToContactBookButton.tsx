import React, { useState } from 'react';
import { UserPlus, Check } from 'lucide-react';
import { contactService } from '../api/contactService';

interface AddToContactBookButtonProps {
  companyName: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  website?: string;
  companyAddress?: string;
  category?: string;
  rating?: number;
  milestoneId?: number;
  milestoneTitle?: string;
  projectId?: number;
  projectName?: string;
  serviceProviderId?: number;
  className?: string;
  onContactAdded?: () => void;
  onOpenContactBook?: () => void;
}

export default function AddToContactBookButton({
  companyName,
  contactPerson,
  email,
  phone,
  website,
  companyAddress,
  category,
  rating,
  milestoneId,
  milestoneTitle,
  projectId,
  projectName,
  serviceProviderId,
  className = '',
  onContactAdded,
  onOpenContactBook
}: AddToContactBookButtonProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToContactBook = async () => {
    setIsAdding(true);
    
    try {
      const contactData = {
        company_name: companyName,
        contact_person: contactPerson,
        email: email,
        phone: phone,
        website: website,
        company_address: companyAddress,
        category: category,
        rating: rating,
        milestone_id: milestoneId,
        project_id: projectId,
        service_provider_id: serviceProviderId
      };

      console.log('🔍 DEBUG: Kontakt-Daten vor Erstellung', {
        contactData,
        serviceProviderId,
        companyAddress,
        phone,
        website
      });

      // Verwende die neue elegante Methode für User-Daten-Integration
      await contactService.createContactWithUserData(contactData);
      
      setIsAdded(true);
      
      // Success message
      console.log('✅ Kontakt erfolgreich zum Kontaktbuch hinzugefügt');
      
      // Call the callbacks if provided
      if (onContactAdded) {
        onContactAdded();
      }
      if (onOpenContactBook) {
        onOpenContactBook();
      }
      
      // Reset after 3 seconds
      setTimeout(() => {
        setIsAdded(false);
      }, 3000);
      
    } catch (error) {
      console.error('❌ Fehler beim Hinzufügen zum Kontaktbuch:', error);
      alert('Fehler beim Hinzufügen zum Kontaktbuch. Möglicherweise existiert dieser Kontakt bereits.');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <button
      onClick={handleAddToContactBook}
      disabled={isAdding || isAdded}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 shadow-lg
        ${isAdded 
          ? 'bg-green-600 text-white cursor-default' 
          : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white hover:shadow-xl transform hover:scale-105'
        }
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      title={isAdded ? 'Zum Kontaktbuch hinzugefügt' : 'Zum Kontaktbuch hinzufügen'}
    >
      {isAdding ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          <span>Hinzufügen...</span>
        </>
      ) : isAdded ? (
        <>
          <Check size={18} />
          <span>Hinzugefügt!</span>
        </>
      ) : (
        <>
          <UserPlus size={18} />
          <span>Zum Kontaktbuch</span>
        </>
      )}
    </button>
  );
}

