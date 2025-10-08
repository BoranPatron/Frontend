import { apiCall } from './api';
import { getUserProfile } from './userService';

export interface Contact {
  id: number;
  company_name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  website?: string;
  category?: string;
  rating?: number;
  notes?: string;
  company_address?: string;
  address_street?: string;
  address_city?: string;
  address_zip?: string;
  address_country?: string;
  milestone_id?: number;
  milestone_title?: string;
  project_id?: number;
  project_name?: string;
  service_provider_id?: number;
  created_at?: string;
  updated_at?: string;
  last_contact?: string;
  tags?: string[];
  
  // Enhanced fields for user data integration
  user_company_name?: string;
  user_company_address?: string;
  user_company_phone?: string;
  user_company_website?: string;
  user_email?: string;
  data_source?: 'contact' | 'user' | 'merged';
  last_user_sync?: string;
}

export interface CreateContactData {
  company_name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  website?: string;
  category?: string;
  rating?: number;
  notes?: string;
  company_address?: string;
  address_street?: string;
  address_city?: string;
  address_zip?: string;
  address_country?: string;
  milestone_id?: number;
  project_id?: number;
  service_provider_id?: number;
  tags?: string[];
}

class ContactService {
  private baseUrl = '/contacts';

  async getAllContacts(): Promise<Contact[]> {
    try {
      const response = await apiCall(this.baseUrl, {
        method: 'GET'
      });
      return response || [];
    } catch (error) {
      console.error('❌ Fehler beim Laden der Kontakte:', error);
      throw error;
    }
  }

  async getAllContactsWithUserData(): Promise<Contact[]> {
    const contacts = await this.getAllContacts();
    
    console.log('🔍 DEBUG: Alle Kontakte geladen:', contacts.length);
    contacts.forEach((contact, index) => {
      console.log(`👤 Kontakt ${index + 1}:`, {
        id: contact.id,
        company_name: contact.company_name,
        service_provider_id: contact.service_provider_id,
        company_address: contact.company_address,
        phone: contact.phone,
        website: contact.website,
        email: contact.email
      });
    });
    
    // Erweitere jeden Kontakt mit User-Daten
    const enrichedContacts = await Promise.all(
      contacts.map(async (contact) => {
        try {
          // Wenn service_provider_id vorhanden ist, hole User-Daten
          if (contact.service_provider_id) {
            console.log(`🔍 DEBUG: Lade User-Daten für Kontakt ${contact.id}, service_provider_id: ${contact.service_provider_id}`);
            
            const userData = await getUserProfile(contact.service_provider_id);
            
            console.log('🔍 DEBUG: User-Daten für Kontakt', {
              contactId: contact.id,
              serviceProviderId: contact.service_provider_id,
              userDataKeys: Object.keys(userData),
              userDataCompanyAddress: userData.company_address,
              userDataCompanyPhone: userData.company_phone,
              userDataCompanyWebsite: userData.company_website,
              userDataEmail: userData.email,
              userDataCompanyName: userData.company_name,
              fullUserData: userData
            });
            
            console.log('🔍 DEBUG: Kontakt vor Merge', {
              contactId: contact.id,
              originalCompanyAddress: contact.company_address,
              originalPhone: contact.phone,
              originalWebsite: contact.website
            });
            
            // Elegante Daten-Merge-Strategie
            const mergedContact = this.mergeContactWithUserData(contact, userData);
            
            console.log('🔍 DEBUG: Kontakt nach Merge', {
              contactId: contact.id,
              mergedCompanyAddress: mergedContact.company_address,
              mergedUserCompanyAddress: mergedContact.user_company_address,
              mergedPhone: mergedContact.phone,
              mergedWebsite: mergedContact.website,
              dataSource: mergedContact.data_source
            });
            
            return mergedContact;
          } else {
            console.log(`⚠️ DEBUG: Kontakt ${contact.id} hat keine service_provider_id`);
            return contact;
          }
        } catch (error) {
          console.warn(`❌ Fehler beim Laden der User-Daten für Kontakt ${contact.id}:`, error);
          return contact;
        }
      })
    );
    
    console.log('🔍 DEBUG: Alle Kontakte mit User-Daten verarbeitet:', enrichedContacts.length);
    return enrichedContacts;
  }

  /**
   * Elegante Methode zum Zusammenführen von Kontakt- und User-Daten
   * Priorität: Kontakt-Daten > User-Daten > Fallback
   */
  private mergeContactWithUserData(contact: Contact, userData: any): Contact {
    const now = new Date().toISOString();
    
    // Einfache und direkte Feldzuordnung - identisch mit Bauträger-Logik
    const userAddress = userData.company_address || userData.address;
    const userPhone = userData.company_phone || userData.phone;
    const userWebsite = userData.company_website || userData.website;
    const userEmail = userData.email;
    const userCompanyName = userData.company_name;
    
    console.log('🔍 DEBUG: User-Daten-Merge', {
      contactId: contact.id,
      userDataKeys: Object.keys(userData),
      userAddress,
      userPhone,
      userWebsite,
      userEmail,
      userCompanyName,
      userDataCompanyAddress: userData.company_address,
      userDataAddress: userData.address
    });
    
    // Bestimme die Datenquelle basierend auf Verfügbarkeit
    const hasContactData = !!(contact.company_address || contact.phone || contact.website);
    const hasUserData = !!(userAddress || userPhone || userWebsite);
    
    let dataSource: 'contact' | 'user' | 'merged' = 'contact';
    if (hasContactData && hasUserData) {
      dataSource = 'merged';
    } else if (hasUserData && !hasContactData) {
      dataSource = 'user';
    }

    // Intelligente Daten-Merge-Strategie - identisch mit Bauträger
    const mergedAddress = contact.company_address || userAddress;
    
    return {
      ...contact,
      // Intelligente Daten-Merge-Strategie
      company_address: mergedAddress,
      phone: contact.phone || userPhone,
      website: contact.website || userWebsite,
      email: contact.email || userEmail,
      
      // Zusätzliche User-Daten für bessere Anzeige und Synchronisation
      user_company_name: userCompanyName,
      user_company_address: userAddress,
      user_company_phone: userPhone,
      user_company_website: userWebsite,
      user_email: userEmail,
      
      // Metadaten für Datenverwaltung
      data_source: dataSource,
      last_user_sync: now
    };
  }

  async getContact(id: number): Promise<Contact> {
    try {
      const response = await apiCall(`${this.baseUrl}/${id}`, {
        method: 'GET'
      });
      return response;
    } catch (error) {
      console.error(`❌ Fehler beim Laden des Kontakts ${id}:`, error);
      throw error;
    }
  }

  async createContact(contactData: CreateContactData): Promise<Contact> {
    try {
      const response = await apiCall(this.baseUrl, {
        method: 'POST',
        body: JSON.stringify(contactData)
      });
      console.log('✅ Kontakt erstellt:', response);
      
      // Trigger event für UI-Updates
      window.dispatchEvent(new CustomEvent('contactCreated', { 
        detail: response 
      }));
      
      return response;
    } catch (error) {
      console.error('❌ Fehler beim Erstellen des Kontakts:', error);
      throw error;
    }
  }

  async updateContact(id: number, contactData: Partial<CreateContactData>): Promise<Contact> {
    try {
      const response = await apiCall(`${this.baseUrl}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(contactData)
      });
      console.log('✅ Kontakt aktualisiert:', response);
      
      // Trigger event für UI-Updates
      window.dispatchEvent(new CustomEvent('contactUpdated', { 
        detail: response 
      }));
      
      return response;
    } catch (error) {
      console.error(`❌ Fehler beim Aktualisieren des Kontakts ${id}:`, error);
      throw error;
    }
  }

  async deleteContact(id: number): Promise<void> {
    try {
      await apiCall(`${this.baseUrl}/${id}`, {
        method: 'DELETE'
      });
      console.log('✅ Kontakt gelöscht:', id);
      
      // Trigger event für UI-Updates
      window.dispatchEvent(new CustomEvent('contactDeleted', { 
        detail: { id } 
      }));
    } catch (error) {
      console.error(`❌ Fehler beim Löschen des Kontakts ${id}:`, error);
      throw error;
    }
  }


  async getContactsByProject(projectId: number): Promise<Contact[]> {
    try {
      const response = await apiCall(`${this.baseUrl}/project/${projectId}`, {
        method: 'GET'
      });
      return response || [];
    } catch (error) {
      console.error(`❌ Fehler beim Laden der Kontakte für Projekt ${projectId}:`, error);
      throw error;
    }
  }

  async getContactsByCategory(category: string): Promise<Contact[]> {
    try {
      const response = await apiCall(`${this.baseUrl}/category/${category}`, {
        method: 'GET'
      });
      return response || [];
    } catch (error) {
      console.error(`❌ Fehler beim Laden der Kontakte für Kategorie ${category}:`, error);
      throw error;
    }
  }

  async searchContacts(query: string): Promise<Contact[]> {
    try {
      const response = await apiCall(`${this.baseUrl}/search?q=${encodeURIComponent(query)}`, {
        method: 'GET'
      });
      return response || [];
    } catch (error) {
      console.error('❌ Fehler bei der Kontaktsuche:', error);
      throw error;
    }
  }

  /**
   * Elegante Lösung: Kombiniert users + contacts Tabellen intelligent
   * Priorität: Kontakt-Daten > User-Daten > Fallback
   */
  async getAllContactsWithElegantUserData(): Promise<Contact[]> {
    const contacts = await this.getAllContacts();
    
    const enrichedContacts = await Promise.all(
      contacts.map(async (contact) => {
        try {
          // Versuche User-Daten zu laden, auch wenn service_provider_id null ist
          let userData = null;
          
          if (contact.service_provider_id) {
            userData = await getUserProfile(contact.service_provider_id);
            console.log('🔍 DEBUG: User-Daten über service_provider_id geladen', {
              contactId: contact.id,
              serviceProviderId: contact.service_provider_id,
              userDataKeys: Object.keys(userData),
              userCompanyAddress: userData.company_address,
              userCompanyPhone: userData.company_phone,
              userCompanyWebsite: userData.company_website
            });
          } else {
            console.log('⚠️ DEBUG: Kontakt hat keine service_provider_id - verwende Fallback', {
              contactId: contact.id,
              companyName: contact.company_name,
              companyAddress: contact.company_address,
              phone: contact.phone,
              website: contact.website
            });
            
            // Fallback: Erstelle ein Mock-User-Objekt mit den verfügbaren Kontakt-Daten
            userData = {
              company_address: contact.company_address || `Adresse für ${contact.company_name}`,
              company_phone: contact.phone,
              company_website: contact.website,
              email: contact.email
            };
          }
          
          // Wenn User-Daten vorhanden sind, merge sie
          if (userData) {
            const mergedContact = this.elegantMergeContactWithUserData(contact, userData);
            return mergedContact;
          }
          
          // Fallback: Verwende nur Kontakt-Daten
          return contact;
        } catch (error) {
          console.warn(`Fehler beim Laden der User-Daten für Kontakt ${contact.id}:`, error);
          return contact;
        }
      })
    );
    
    return enrichedContacts;
  }

  /**
   * Elegante Merge-Strategie: Kontakt-Daten > User-Daten > Fallback
   */
  private elegantMergeContactWithUserData(contact: Contact, userData: any): Contact {
    const now = new Date().toISOString();
    
    // Elegante Feldzuordnung mit Priorität
    const mergedAddress = contact.company_address || userData.company_address || userData.address;
    const mergedPhone = contact.phone || userData.company_phone || userData.phone;
    const mergedWebsite = contact.website || userData.company_website || userData.website;
    const mergedEmail = contact.email || userData.email;
    
    // Bestimme die Datenquelle
    const hasContactData = !!(contact.company_address || contact.phone || contact.website);
    const hasUserData = !!(userData.company_address || userData.company_phone || userData.company_website);
    
    let dataSource: 'contact' | 'user' | 'merged' = 'contact';
    if (hasContactData && hasUserData) {
      dataSource = 'merged';
    } else if (hasUserData && !hasContactData) {
      dataSource = 'user';
    }
    
    console.log('🔍 DEBUG: Elegante Merge-Ergebnis', {
      contactId: contact.id,
      mergedAddress,
      mergedPhone,
      mergedWebsite,
      mergedEmail,
      dataSource,
      contactHasData: hasContactData,
      userHasData: hasUserData
    });
    
    return {
      ...contact,
      // Elegante Daten-Merge-Strategie
      company_address: mergedAddress,
      phone: mergedPhone,
      website: mergedWebsite,
      email: mergedEmail,
      
      // Zusätzliche User-Daten für Transparenz
      user_company_address: userData.company_address,
      user_company_phone: userData.company_phone,
      user_company_website: userData.company_website,
      user_email: userData.email,
      
      // Metadaten
      data_source: dataSource,
      last_user_sync: now
    };
  }

  /**
   * Synchronisiert alle Kontakte mit aktuellen User-Daten
   * Nützlich für eine einmalige Aktualisierung aller Kontakte
   */
  async syncAllContactsWithUserData(): Promise<Contact[]> {
    const contacts = await this.getAllContacts();
    
    const syncedContacts = await Promise.all(
      contacts.map(async (contact) => {
        if (contact.service_provider_id) {
          try {
            return await this.syncContactWithUserData(contact.id);
          } catch (error) {
            console.warn(`Fehler beim Synchronisieren von Kontakt ${contact.id}:`, error);
            return contact;
          }
        }
        return contact;
      })
    );
    
    console.log('✅ Alle Kontakte mit User-Daten synchronisiert');
    return syncedContacts;
  }

  /**
   * Synchronisiert Kontakt-Daten mit aktuellen User-Daten
   * Nützlich wenn User ihre Firmeninformationen aktualisiert haben
   */
  async syncContactWithUserData(contactId: number): Promise<Contact> {
    try {
      const contact = await this.getContact(contactId);
      
      if (contact.service_provider_id) {
        const userData = await getUserProfile(contact.service_provider_id);
        const mergedContact = this.mergeContactWithUserData(contact, userData);
        
        // Aktualisiere den Kontakt mit den neuen Daten
        const updatedContact = await this.updateContact(contactId, {
          company_address: mergedContact.company_address,
          phone: mergedContact.phone,
          website: mergedContact.website,
          email: mergedContact.email
        });
        
        console.log('✅ Kontakt mit User-Daten synchronisiert:', updatedContact);
        return updatedContact;
      }
      
      return contact;
    } catch (error) {
      console.error(`❌ Fehler beim Synchronisieren des Kontakts ${contactId}:`, error);
      throw error;
    }
  }

  /**
   * Erstellt einen Kontakt mit intelligenter User-Daten-Integration
   * Verwendet die gleiche elegante Merge-Strategie
   */
  async createContactWithUserData(contactData: CreateContactData): Promise<Contact> {
    try {
      let enrichedData = { ...contactData };
      
      // Wenn service_provider_id vorhanden ist, hole User-Daten
      if (contactData.service_provider_id) {
        console.log('🔍 DEBUG: Lade User-Daten für neuen Kontakt', {
          serviceProviderId: contactData.service_provider_id,
          companyAddress: contactData.company_address
        });
        
        try {
          const userData = await getUserProfile(contactData.service_provider_id);
          
          console.log('🔍 DEBUG: User-Daten geladen', {
            userDataKeys: Object.keys(userData),
            userCompanyAddress: userData.company_address,
            userCompanyPhone: userData.company_phone,
            userCompanyWebsite: userData.company_website
          });
          
          // Verwende die elegante Merge-Strategie
          const tempContact = this.elegantMergeContactWithUserData(contactData as Contact, userData);
          
          enrichedData = {
            ...enrichedData,
            company_address: tempContact.company_address,
            phone: tempContact.phone,
            website: tempContact.website,
            email: tempContact.email
          };
          
          console.log('🔍 DEBUG: Kontakt-Daten nach elegante Merge', {
            finalCompanyAddress: enrichedData.company_address,
            finalPhone: enrichedData.phone,
            finalWebsite: enrichedData.website
          });
        } catch (error) {
          console.warn('Fehler beim Laden der User-Daten beim Erstellen:', error);
          // Verwende Fallback-Adresse
          enrichedData.company_address = contactData.company_address || `Adresse für ${contactData.company_name}`;
        }
      } else {
        console.log('⚠️ DEBUG: Keine service_provider_id beim Erstellen des Kontakts', {
          contactData,
          companyAddress: contactData.company_address
        });
        
        // Fallback: Generiere eine Adresse wenn keine vorhanden ist
        if (!contactData.company_address) {
          enrichedData.company_address = `Adresse für ${contactData.company_name}`;
          console.log('🔧 DEBUG: Fallback-Adresse generiert:', enrichedData.company_address);
        }
      }
      
      const response = await this.createContact(enrichedData);
      console.log('✅ Kontakt mit User-Daten-Integration erstellt:', response);
      
      return response;
    } catch (error) {
      console.error('❌ Fehler beim Erstellen des Kontakts mit User-Daten:', error);
      throw error;
    }
  }
}

export const contactService = new ContactService();

