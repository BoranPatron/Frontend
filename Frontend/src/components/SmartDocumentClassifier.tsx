import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  FileText, 
  Tag, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Sparkles,
  Eye,
  Edit3
} from 'lucide-react';

interface DocumentAnalysis {
  suggestedType: 'plan' | 'permit' | 'quote' | 'invoice' | 'contract' | 'photo' | 'other';
  confidence: number;
  suggestedTags: string[];
  extractedText?: string;
  keyPhrases: string[];
  projectPhase?: string;
  urgency?: 'low' | 'medium' | 'high';
  complianceStatus?: 'compliant' | 'needs_review' | 'non_compliant';
}

interface SmartDocumentClassifierProps {
  file: File | null;
  onAnalysisComplete: (analysis: DocumentAnalysis) => void;
  onManualOverride: () => void;
}

export default function SmartDocumentClassifier({ 
  file, 
  onAnalysisComplete, 
  onManualOverride 
}: SmartDocumentClassifierProps) {
  const [analysis, setAnalysis] = useState<DocumentAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (file) {
      analyzeDocument(file);
    }
  }, [file]);

  const analyzeDocument = async (documentFile: File) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      // Simuliere AI-Analyse (in Produktion würde hier echte AI-API aufgerufen)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Intelligente Analyse basierend auf Dateiname und Typ
      const fileName = documentFile.name.toLowerCase();
      const fileType = documentFile.type;
      
      let suggestedType: DocumentAnalysis['suggestedType'] = 'other';
      let confidence = 0.7;
      let suggestedTags: string[] = [];
      let keyPhrases: string[] = [];
      let projectPhase = 'planning';
      let urgency: 'low' | 'medium' | 'high' = 'medium';
      let complianceStatus: 'compliant' | 'needs_review' | 'non_compliant' = 'needs_review';

      // Intelligente Typ-Erkennung
      if (fileName.includes('plan') || fileName.includes('zeichnung') || fileName.includes('drawing')) {
        suggestedType = 'plan';
        confidence = 0.95;
        suggestedTags = ['Architektur', 'Planung', 'Zeichnung'];
        projectPhase = 'planning';
      } else if (fileName.includes('genehmigung') || fileName.includes('permit') || fileName.includes('bauantrag')) {
        suggestedType = 'permit';
        confidence = 0.9;
        suggestedTags = ['Genehmigung', 'Behörde', 'Antrag'];
        urgency = 'high';
        complianceStatus = 'needs_review';
      } else if (fileName.includes('angebot') || fileName.includes('quote') || fileName.includes('kalkulation')) {
        suggestedType = 'quote';
        confidence = 0.85;
        suggestedTags = ['Angebot', 'Kosten', 'Kalkulation'];
        projectPhase = 'tendering';
      } else if (fileName.includes('rechnung') || fileName.includes('invoice') || fileName.includes('bill')) {
        suggestedType = 'invoice';
        confidence = 0.9;
        suggestedTags = ['Rechnung', 'Zahlung', 'Finanzen'];
        urgency = 'high';
      } else if (fileName.includes('vertrag') || fileName.includes('contract') || fileName.includes('vereinbarung')) {
        suggestedType = 'contract';
        confidence = 0.95;
        suggestedTags = ['Vertrag', 'Rechtlich', 'Vereinbarung'];
        complianceStatus = 'needs_review';
      } else if (fileType.startsWith('image/')) {
        suggestedType = 'photo';
        confidence = 0.8;
        suggestedTags = ['Foto', 'Dokumentation', 'Fortschritt'];
        projectPhase = 'construction';
      }

      // Zusätzliche Tags basierend auf Projektphase
      if (projectPhase === 'planning') {
        suggestedTags.push('Planungsphase');
      } else if (projectPhase === 'construction') {
        suggestedTags.push('Bauphase');
      } else if (projectPhase === 'tendering') {
        suggestedTags.push('Ausschreibung');
      }

      const analysisResult: DocumentAnalysis = {
        suggestedType,
        confidence,
        suggestedTags,
        keyPhrases,
        projectPhase,
        urgency,
        complianceStatus
      };

      setAnalysis(analysisResult);
      onAnalysisComplete(analysisResult);
    } catch (err) {
      setError('Fehler bei der Dokumentenanalyse');
      console.error('Analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-500';
    if (confidence >= 0.6) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'text-red-500 bg-red-500/20 border-red-500/30';
      case 'medium': return 'text-yellow-500 bg-yellow-500/20 border-yellow-500/30';
      case 'low': return 'text-green-500 bg-green-500/20 border-green-500/30';
      default: return 'text-gray-500 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getComplianceColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'text-green-500 bg-green-500/20 border-green-500/30';
      case 'needs_review': return 'text-yellow-500 bg-yellow-500/20 border-yellow-500/30';
      case 'non_compliant': return 'text-red-500 bg-red-500/20 border-red-500/30';
      default: return 'text-gray-500 bg-gray-500/20 border-gray-500/30';
    }
  };

  if (isAnalyzing) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#ffbd59]"></div>
          <div>
            <h3 className="text-lg font-semibold text-white">KI-Analyse läuft...</h3>
            <p className="text-sm text-gray-300">Dokument wird intelligent klassifiziert</p>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <Brain size={16} className="text-[#ffbd59]" />
            <span>Dokumententyp wird erkannt...</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <Tag size={16} className="text-[#ffbd59]" />
            <span>Tags werden vorgeschlagen...</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <Eye size={16} className="text-[#ffbd59]" />
            <span>Inhalt wird analysiert...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-6 py-4 rounded-xl backdrop-blur-lg">
        <div className="flex items-center gap-3">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#ffbd59]/20 rounded-xl">
            <Sparkles size={20} className="text-[#ffbd59]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">KI-Analyse abgeschlossen</h3>
            <p className="text-sm text-gray-300">Intelligente Vorschläge für Ihr Dokument</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${getConfidenceColor(analysis.confidence)}`}>
            {Math.round(analysis.confidence * 100)}% Sicherheit
          </span>
          <CheckCircle size={16} className="text-green-500" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-white mb-2">Vorgeschlagener Typ</label>
            <div className="flex items-center gap-2 p-3 bg-white/10 rounded-xl border border-white/20">
              <FileText size={16} className="text-[#ffbd59]" />
              <span className="text-white font-medium capitalize">
                {analysis.suggestedType === 'plan' ? 'Plan' :
                 analysis.suggestedType === 'permit' ? 'Genehmigung' :
                 analysis.suggestedType === 'quote' ? 'Angebot' :
                 analysis.suggestedType === 'invoice' ? 'Rechnung' :
                 analysis.suggestedType === 'contract' ? 'Vertrag' :
                 analysis.suggestedType === 'photo' ? 'Foto' : 'Sonstiges'}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Dringlichkeit</label>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getUrgencyColor(analysis.urgency)}`}>
              {analysis.urgency === 'high' ? 'Hoch' :
               analysis.urgency === 'medium' ? 'Mittel' : 'Niedrig'}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-white mb-2">Compliance-Status</label>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getComplianceColor(analysis.complianceStatus)}`}>
              {analysis.complianceStatus === 'compliant' ? 'Konform' :
               analysis.complianceStatus === 'needs_review' ? 'Prüfung erforderlich' : 'Nicht konform'}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Projektphase</label>
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
              {analysis.projectPhase === 'planning' ? 'Planung' :
               analysis.projectPhase === 'construction' ? 'Bauphase' :
               analysis.projectPhase === 'tendering' ? 'Ausschreibung' : 'Unbekannt'}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-white mb-2">Vorgeschlagene Tags</label>
        <div className="flex flex-wrap gap-2">
          {analysis.suggestedTags.map((tag, index) => (
            <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#ffbd59]/20 text-[#ffbd59] border border-[#ffbd59]/30">
              <Tag size={14} className="mr-1" />
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onManualOverride}
          className="flex items-center gap-2 px-4 py-2 border border-white/20 text-white rounded-xl hover:bg-white/10 transition-colors"
        >
          <Edit3 size={16} />
          Manuell anpassen
        </button>
        
        <div className="flex-1 text-right">
          <span className="text-xs text-gray-400">
            Diese Analyse hilft bei der automatischen Kategorisierung und Organisation Ihrer Dokumente
          </span>
        </div>
      </div>
    </div>
  );
}