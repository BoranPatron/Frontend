// Intelligente Dokumentenkategorisierung für das DMS
// Automatische Erkennung und Zuordnung von Dokumenttypen

export interface DocumentCategory {
  id: string;
  name: string;
  description: string;
  patterns: string[];
  fileExtensions: string[];
  keywords: string[];
  priority: number; // Höhere Zahl = höhere Priorität
}

// DMS-Kategorien (erweitert für automatische Kategorisierung)
export const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  {
    id: 'planning',
    name: 'Planung & Genehmigung',
    description: 'Baupläne, Grundrisse, Genehmigungen und statische Berechnungen',
    patterns: [
      /grundriss/i,
      /bauplan/i,
      /lageplan/i,
      /schnitt/i,
      /ansicht/i,
      /detail/i,
      /genehmigung/i,
      /baugenehmigung/i,
      /bauantrag/i,
      /statik/i,
      /tragwerk/i,
      /energieausweis/i,
      /vermessung/i
    ],
    fileExtensions: ['.dwg', '.dxf', '.pdf', '.plt'],
    keywords: ['plan', 'grundriss', 'schnitt', 'ansicht', 'detail', 'genehmigung', 'statik', 'vermessung'],
    priority: 10
  },
  {
    id: 'contracts',
    name: 'Verträge & Rechtliches',
    description: 'Bauverträge, Nachträge, Versicherungen und rechtliche Dokumente',
    patterns: [
      /vertrag/i,
      /bauvertrag/i,
      /nachtrag/i,
      /versicherung/i,
      /gewährleistung/i,
      /mängel/i,
      /rüge/i,
      /rechtlich/i,
      /anwalt/i,
      /gericht/i
    ],
    fileExtensions: ['.pdf', '.doc', '.docx'],
    keywords: ['vertrag', 'nachtrag', 'versicherung', 'gewährleistung', 'mängel', 'rechtlich'],
    priority: 8
  },
  {
    id: 'finance',
    name: 'Finanzen & Abrechnung',
    description: 'Rechnungen, Kostenvoranschläge und Zahlungsbelege',
    patterns: [
      /rechnung/i,
      /invoice/i,
      /kostenvoranschlag/i,
      /angebot/i,
      /kalkulation/i,
      /leistungsverzeichnis/i,
      /zahlung/i,
      /beleg/i,
      /quittung/i,
      /schlussrechnung/i,
      /abrechnung/i,
      /budget/i
    ],
    fileExtensions: ['.pdf', '.xls', '.xlsx', '.csv'],
    keywords: ['rechnung', 'kosten', 'angebot', 'kalkulation', 'zahlung', 'beleg', 'abrechnung'],
    priority: 9
  },
  {
    id: 'execution',
    name: 'Ausführung & Handwerk',
    description: 'Lieferscheine, Materialbelege, Abnahmeprotokolle und Prüfberichte',
    patterns: [
      /lieferschein/i,
      /material/i,
      /abnahme/i,
      /protokoll/i,
      /prüfbericht/i,
      /zertifikat/i,
      /arbeitsanweisung/i,
      /ausführung/i,
      /handwerk/i,
      /montage/i,
      /installation/i
    ],
    fileExtensions: ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'],
    keywords: ['lieferung', 'material', 'abnahme', 'protokoll', 'prüfung', 'zertifikat', 'ausführung'],
    priority: 7
  },
  {
    id: 'documentation',
    name: 'Dokumentation & Medien',
    description: 'Fotos, Videos, Baustellenberichte und Bestandsdokumentation',
    patterns: [
      /foto/i,
      /photo/i,
      /bild/i,
      /video/i,
      /film/i,
      /baustelle/i,
      /bericht/i,
      /dokumentation/i,
      /bestand/i,
      /aufmaß/i,
      /fortschritt/i
    ],
    fileExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.mp4', '.mov', '.avi', '.pdf'],
    keywords: ['foto', 'bild', 'video', 'baustelle', 'bericht', 'dokumentation', 'bestand'],
    priority: 6
  },
  {
    id: 'order_confirmations',
    name: 'Auftragsbestätigungen',
    description: 'Auftragsbestätigungen, Bestellbestätigungen und Leistungsbestätigungen',
    patterns: [
      /auftrag/i,
      /bestätigung/i,
      /bestellung/i,
      /leistung/i,
      /order/i,
      /confirmation/i
    ],
    fileExtensions: ['.pdf', '.doc', '.docx'],
    keywords: ['auftrag', 'bestätigung', 'bestellung', 'leistung', 'order'],
    priority: 5
  },
  {
    id: 'technical',
    name: 'Technische Unterlagen',
    description: 'Technische Zeichnungen, Spezifikationen und Datenblätter',
    patterns: [
      /technisch/i,
      /zeichnung/i,
      /spezifikation/i,
      /datenblatt/i,
      /handbuch/i,
      /manual/i,
      /anleitung/i,
      /installation/i,
      /wartung/i
    ],
    fileExtensions: ['.pdf', '.dwg', '.dxf', '.doc', '.docx'],
    keywords: ['technisch', 'zeichnung', 'spezifikation', 'datenblatt', 'handbuch', 'anleitung'],
    priority: 7
  }
];

export class DocumentCategorizer {
  /**
   * Kategorisiert ein Dokument basierend auf Dateiname, Erweiterung und Inhalt
   */
  static categorizeDocument(fileName: string, fileExtension: string, content?: string): DocumentCategory | null {
    const normalizedFileName = fileName.toLowerCase();
    const normalizedExtension = fileExtension.toLowerCase();
    
    let bestMatch: { category: DocumentCategory; score: number } | null = null;
    
    for (const category of DOCUMENT_CATEGORIES) {
      let score = 0;
      
      // Pattern-Matching im Dateinamen
      for (const pattern of category.patterns) {
        if (pattern.test(normalizedFileName)) {
          score += 3 * category.priority;
        }
      }
      
      // Keyword-Matching im Dateinamen
      for (const keyword of category.keywords) {
        if (normalizedFileName.includes(keyword)) {
          score += 2 * category.priority;
        }
      }
      
      // Dateierweiterung-Matching
      if (category.fileExtensions.includes(normalizedExtension)) {
        score += 1 * category.priority;
      }
      
      // Content-basierte Analyse (falls verfügbar)
      if (content) {
        const normalizedContent = content.toLowerCase();
        for (const pattern of category.patterns) {
          if (pattern.test(normalizedContent)) {
            score += 2 * category.priority;
          }
        }
      }
      
      // Beste Übereinstimmung speichern
      if (score > 0 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { category, score };
      }
    }
    
    return bestMatch ? bestMatch.category : null;
  }
  
  /**
   * Schlägt eine Subkategorie basierend auf der Hauptkategorie vor
   */
  static suggestSubcategory(category: DocumentCategory, fileName: string): string | null {
    const normalizedFileName = fileName.toLowerCase();
    
    // Spezifische Subkategorie-Zuordnungen
    const subcategoryMappings: Record<string, Record<string, string[]>> = {
      'planning': {
        'Baupläne & Grundrisse': ['grundriss', 'plan', 'lageplan'],
        'Baugenehmigungen': ['genehmigung', 'bauantrag', 'behörde'],
        'Statische Berechnungen': ['statik', 'tragwerk', 'berechnung'],
        'Energieausweise': ['energie', 'ausweis', 'effizienz'],
        'Vermessungsunterlagen': ['vermessung', 'aufmaß', 'kataster']
      },
      'contracts': {
        'Bauverträge': ['bauvertrag', 'hauptvertrag', 'werkvertrag'],
        'Nachträge': ['nachtrag', 'änderung', 'zusatz'],
        'Versicherungen': ['versicherung', 'police', 'haftung'],
        'Gewährleistungen': ['gewährleistung', 'garantie', 'mängel'],
        'Mängelrügen': ['mängel', 'rüge', 'beanstandung']
      },
      'finance': {
        'Rechnungen': ['rechnung', 'invoice', 'faktura'],
        'Kostenvoranschläge': ['kostenvoranschlag', 'angebot', 'kalkulation'],
        'Leistungsverzeichnisse': ['leistungsverzeichnis', 'lv', 'ausschreibung'],
        'Zahlungsbelege': ['zahlung', 'beleg', 'quittung', 'überweisung'],
        'Änderungsaufträge': ['änderung', 'nachtrag', 'zusatz'],
        'Schlussrechnungen': ['schlussrechnung', 'endabrechnung', 'final']
      }
    };
    
    const categoryMappings = subcategoryMappings[category.id];
    if (!categoryMappings) return null;
    
    for (const [subcategory, keywords] of Object.entries(categoryMappings)) {
      for (const keyword of keywords) {
        if (normalizedFileName.includes(keyword)) {
          return subcategory;
        }
      }
    }
    
    return null;
  }
  
  /**
   * Analysiert mehrere Dateien und gibt Kategorisierungsstatistiken zurück
   */
  static analyzeDocuments(files: { name: string; type: string }[]): {
    categorized: number;
    uncategorized: number;
    categories: Record<string, number>;
    suggestions: Array<{ fileName: string; category: string; subcategory?: string; confidence: number }>;
  } {
    const stats = {
      categorized: 0,
      uncategorized: 0,
      categories: {} as Record<string, number>,
      suggestions: [] as Array<{ fileName: string; category: string; subcategory?: string; confidence: number }>
    };
    
    for (const file of files) {
      const extension = '.' + file.type.split('/').pop();
      const category = this.categorizeDocument(file.name, extension);
      
      if (category) {
        stats.categorized++;
        stats.categories[category.name] = (stats.categories[category.name] || 0) + 1;
        
        const subcategory = this.suggestSubcategory(category, file.name);
        const confidence = this.calculateConfidence(file.name, extension, category);
        
        stats.suggestions.push({
          fileName: file.name,
          category: category.name,
          subcategory: subcategory || undefined,
          confidence
        });
      } else {
        stats.uncategorized++;
        stats.suggestions.push({
          fileName: file.name,
          category: 'Unbekannt',
          confidence: 0
        });
      }
    }
    
    return stats;
  }
  
  /**
   * Berechnet die Konfidenz der Kategorisierung (0-100)
   */
  private static calculateConfidence(fileName: string, extension: string, category: DocumentCategory): number {
    let confidence = 0;
    const normalizedFileName = fileName.toLowerCase();
    
    // Pattern-Matches erhöhen Konfidenz stark
    for (const pattern of category.patterns) {
      if (pattern.test(normalizedFileName)) {
        confidence += 30;
      }
    }
    
    // Keyword-Matches erhöhen Konfidenz moderat
    for (const keyword of category.keywords) {
      if (normalizedFileName.includes(keyword)) {
        confidence += 15;
      }
    }
    
    // Passende Dateierweiterung erhöht Konfidenz leicht
    if (category.fileExtensions.includes(extension.toLowerCase())) {
      confidence += 10;
    }
    
    // Priorität der Kategorie fließt ein
    confidence += category.priority;
    
    return Math.min(100, confidence);
  }
}
