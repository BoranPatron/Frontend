import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  FileText, 
  X, 
  Save,
  AlertTriangle,
  CheckCircle,
  Info,
  MoreVertical,
  Building,
  Calendar,
  Euro,
  Users,
  FileCheck,
  Clock,
  Target,
  Shield,
  Leaf
} from 'lucide-react';

interface TradeCreationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (tradeData: any) => void;
  projectId: number;
}

export default function TradeCreationForm({ isOpen, onClose, onSubmit, projectId }: TradeCreationFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium',
    planned_date: '',
    notes: '',
    requires_inspection: false
  });
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDetailsDropdown, setShowDetailsDropdown] = useState(false);
  const [projectInfo, setProjectInfo] = useState<any>(null);

  // Lade Projekt-Informationen
  useEffect(() => {
    const loadProjectInfo = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch(`http://localhost:8000/api/v1/projects/${projectId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setProjectInfo(data);
        }
      } catch (error) {
        console.error('Fehler beim Laden der Projekt-Informationen:', error);
      }
    };

    if (isOpen && projectId) {
      loadProjectInfo();
    }
  }, [isOpen, projectId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Fehler zurücksetzen
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      ];
      
      if (file.size > maxSize) {
        alert(`Datei ${file.name} ist zu groß. Maximale Größe: 10MB`);
        return false;
      }
      
      if (!allowedTypes.includes(file.type)) {
        alert(`Dateityp ${file.type} wird nicht unterstützt. Nur PDF, Word und PowerPoint-Dateien sind erlaubt.`);
        return false;
      }
      
      return true;
    });
    
    setUploadedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) newErrors.title = 'Titel ist erforderlich';
    if (!formData.description.trim()) newErrors.description = 'Beschreibung ist erforderlich';
    if (!formData.category) newErrors.category = 'Kategorie ist erforderlich';
    if (!formData.planned_date) newErrors.planned_date = 'Geplantes Datum ist erforderlich';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Verwende den Milestone-Service mit Dokumenten
      const { createMilestoneWithDocuments } = await import('../api/milestoneService');
      
      const milestoneData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        priority: formData.priority,
        planned_date: formData.planned_date,
        notes: formData.notes,
        project_id: projectId,
        status: 'cost_estimate', // Standard-Status für neue Gewerke
        is_critical: false, // Standard-Wert
        notify_on_completion: false,
        requires_inspection: formData.requires_inspection,
        documents: uploadedFiles
      };
      
      const result = await createMilestoneWithDocuments(milestoneData);
      console.log('✅ Gewerk mit Dokumenten erstellt:', result);
      
      // Schließe das Modal und rufe onSubmit auf
      await onSubmit(result);
      handleClose();
    } catch (error) {
      console.error('❌ Fehler beim Erstellen des Gewerks:', error);
      setErrors(prev => ({
        ...prev,
        submit: 'Fehler beim Erstellen des Gewerks'
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      category: '',
      priority: 'medium',
      planned_date: '',
      notes: '',
      requires_inspection: false
    });
    setUploadedFiles([]);
    setErrors({});
    setShowDetailsDropdown(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-[#ffbd59]/20">
        <div className="p-6 border-b border-[#ffbd59]/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold text-white">Neues Gewerk erstellen</h2>
              
              {/* Projekt-Informationen */}
              {projectInfo && (
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Building className="h-4 w-4 text-[#ffbd59]" />
                  <span>{projectInfo.name}</span>
                  <span className="text-gray-500">|</span>
                  <Calendar className="h-4 w-4 text-[#ffbd59]" />
                  <span>Projekt #{projectInfo.id}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {/* Details Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowDetailsDropdown(!showDetailsDropdown)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
                  title="Details einsehen"
                >
                  <MoreVertical size={20} />
                </button>
                
                {showDetailsDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-[#3d4952] rounded-xl shadow-2xl border border-white/20 z-50">
                    <div className="p-2">
                      <div className="p-3 border-b border-white/10">
                        <h4 className="font-medium text-white text-sm">Details einsehen</h4>
                      </div>
                      
                      <div className="p-2 space-y-1">
                        <button className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors text-white w-full text-left">
                          <FileCheck size={16} className="text-[#ffbd59]" />
                          <span className="text-sm">Kostenvoranschlag-Prozess</span>
                        </button>
                        
                        <button className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors text-white w-full text-left">
                          <Users size={16} className="text-[#ffbd59]" />
                          <span className="text-sm">Verfügbare Dienstleister</span>
                        </button>
                        
                        <button className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors text-white w-full text-left">
                          <Clock size={16} className="text-[#ffbd59]" />
                          <span className="text-sm">Zeitplan & Termine</span>
                        </button>
                        
                        <button className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors text-white w-full text-left">
                          <Euro size={16} className="text-[#ffbd59]" />
                          <span className="text-sm">Budget & Kosten</span>
                        </button>
                        
                        <button className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors text-white w-full text-left">
                          <Target size={16} className="text-[#ffbd59]" />
                          <span className="text-sm">Qualitätsstandards</span>
                        </button>
                        
                        <button className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors text-white w-full text-left">
                          <Shield size={16} className="text-[#ffbd59]" />
                          <span className="text-sm">Sicherheitsrichtlinien</span>
                        </button>
                        
                        <button className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors text-white w-full text-left">
                          <Leaf size={16} className="text-[#ffbd59]" />
                          <span className="text-sm">Umweltstandards</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <button
                onClick={handleClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
              >
                <X size={24} />
              </button>
            </div>
          </div>
          
          {/* Kostenvoranschlag-Info */}
          <div className="mt-4 p-4 bg-[#ffbd59]/10 border border-[#ffbd59]/20 rounded-lg">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-[#ffbd59] mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-300">
                <p className="font-medium text-white mb-1">💡 Kostenvoranschlag-Prozess</p>
                <p className="text-gray-400">
                  Durch die detaillierte Spezifikation erhalten Dienstleister alle notwendigen Informationen für präzise Kostenvoranschläge. 
                  Dies reduziert Nachfragen und beschleunigt die Vergabe.
                </p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Grunddaten */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Titel *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 bg-[#2c3539] border rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent text-white placeholder-gray-400 ${
                  errors.title ? 'border-red-500' : 'border-[#ffbd59]/30'
                }`}
                placeholder="z.B. Elektroinstallation Erdgeschoss"
              />
              {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Kategorie *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 bg-[#2c3539] border rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent text-white ${
                  errors.category ? 'border-red-500' : 'border-[#ffbd59]/30'
                }`}
              >
                <option value="">Bitte wählen...</option>
                <option value="elektro">Elektro</option>
                <option value="sanitaer">Sanitär</option>
                <option value="heizung">Heizung</option>
                <option value="dach">Dach</option>
                <option value="fenster_tueren">Fenster/Türen</option>
                <option value="boden">Boden</option>
                <option value="wand">Wand</option>
                <option value="fundament">Fundament</option>
                <option value="garten">Garten/Landschaft</option>
                <option value="eigene">Eigene</option>
              </select>
              {errors.category && <p className="text-red-400 text-sm mt-1">{errors.category}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Geplantes Datum *
              </label>
              <input
                type="date"
                name="planned_date"
                value={formData.planned_date}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 bg-[#2c3539] border rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent text-white ${
                  errors.planned_date ? 'border-red-500' : 'border-[#ffbd59]/30'
                }`}
              />
              {errors.planned_date && <p className="text-red-400 text-sm mt-1">{errors.planned_date}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Priorität
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-[#2c3539] border border-[#ffbd59]/30 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent text-white"
              >
                <option value="low">Niedrig</option>
                <option value="medium">Mittel</option>
                <option value="high">Hoch</option>
                <option value="critical">Kritisch</option>
              </select>
            </div>
          </div>

          {/* Besichtigungsoption */}
          <div className="border-t border-[#ffbd59]/20 pt-6">
            <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-[#ffbd59]/5 to-[#ffa726]/5 border border-[#ffbd59]/20 rounded-lg">
              <div className="flex items-center mt-1">
                <input
                  type="checkbox"
                  name="requires_inspection"
                  id="requires_inspection"
                  checked={formData.requires_inspection}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-[#ffbd59] bg-[#2c3539] border-[#ffbd59]/30 rounded focus:ring-[#ffbd59] focus:ring-2"
                />
              </div>
              <div className="flex-1">
                <label htmlFor="requires_inspection" className="text-white font-medium cursor-pointer flex items-center gap-2">
                  <Building className="h-5 w-5 text-[#ffbd59]" />
                  Vor-Ort-Besichtigung erforderlich
                </label>
                <p className="text-sm text-gray-300 mt-2">
                  Aktivieren Sie diese Option, wenn eine Besichtigung vor Ort notwendig ist. 
                  Sie können dann aus den eingegangenen Angeboten Dienstleister zur Besichtigung einladen 
                  und erhalten nach der Besichtigung überarbeitete Angebote.
                </p>
                {formData.requires_inspection && (
                  <div className="mt-3 p-3 bg-[#ffbd59]/10 border border-[#ffbd59]/20 rounded-lg">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="text-green-300 font-medium">Besichtigungsprozess aktiviert</p>
                        <p className="text-gray-300 mt-1">
                          Nach Eingang der ersten Angebote können Sie Dienstleister zur Besichtigung einladen. 
                          Bei Annahme eines überarbeiteten Angebots erhalten Sie zusätzliche Credits als Belohnung.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Beschreibung *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className={`w-full px-3 py-2 bg-[#2c3539] border rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent text-white placeholder-gray-400 ${
                errors.description ? 'border-red-500' : 'border-[#ffbd59]/30'
              }`}
              placeholder="Detaillierte Beschreibung des Gewerks..."
            />
            {errors.description && <p className="text-red-400 text-sm mt-1">{errors.description}</p>}
          </div>

          {/* Dokumente und Dateien */}
          <div className="border-t border-[#ffbd59]/20 pt-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Dokumente und Dateien
            </h3>
            <p className="text-sm text-gray-300 mb-4">
              Laden Sie Leistungsverzeichnisse und Bauinformationen in PDF, Word oder PowerPoint-Format hoch. 
              Diese werden Dienstleistern in einer Inline-Ansicht zur Verfügung gestellt.
            </p>
            <div className="border-2 border-dashed border-[#ffbd59]/30 rounded-lg p-6 text-center bg-[#2c3539]/50">
              <Upload className="mx-auto h-12 w-12 text-[#ffbd59] mb-4" />
              <div className="text-sm text-gray-300 mb-4">
                <p>Ziehen Sie Dateien hierher oder klicken Sie zum Auswählen</p>
                <p className="text-xs text-gray-400 mt-1">
                  Unterstützte Formate: PDF, Word, PowerPoint (max. 10MB pro Datei)
                </p>
              </div>
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                accept=".pdf,.doc,.docx,.ppt,.pptx"
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer bg-[#ffbd59] text-[#2c3539] px-4 py-2 rounded-lg hover:bg-[#ffa726] transition-colors font-medium"
              >
                Dateien auswählen
              </label>
            </div>
            
            {uploadedFiles.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-white mb-2">Hochgeladene Dateien:</h4>
                <div className="space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-[#2c3539] rounded-lg border border-[#ffbd59]/20">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-[#ffbd59] mr-3" />
                        <div>
                          <p className="text-sm font-medium text-white">{file.name}</p>
                          <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="p-1 hover:bg-red-500/20 rounded"
                      >
                        <X className="h-4 w-4 text-red-400" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Notizen */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Notizen
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 bg-[#2c3539] border border-[#ffbd59]/30 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent text-white placeholder-gray-400"
              placeholder="Zusätzliche Notizen..."
            />
          </div>

          {/* Fehleranzeige */}
          {errors.submit && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-400 mr-3" />
              <p className="text-red-300">{errors.submit}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-[#ffbd59]/20">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 border border-[#ffbd59]/30 rounded-lg text-white hover:bg-white/10 transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-[#ffbd59] text-[#2c3539] rounded-lg hover:bg-[#ffa726] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center font-medium"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#2c3539] mr-2"></div>
                  Erstelle...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Gewerk erstellen
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      
      {/* Click outside to close dropdown */}
      {showDetailsDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowDetailsDropdown(false)}
        />
      )}
    </div>
  );
} 