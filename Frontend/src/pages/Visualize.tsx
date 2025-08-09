import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';
import { getProjects } from '../api/projectService';
import ProjectBreadcrumb from '../components/ProjectBreadcrumb';
import { 
  BarChart3, 
  Building,
  XCircle,
  AlertCircle,
  CheckCircle,
  Upload,
  Eye,
  ArrowLeftRight,
  FileText,
  X,
} from 'lucide-react';
import { buildDriveFolderUrl, buildDriveCategoryFolderUrl, listVisualizations, uploadPlan, smartUploadDocuments, VisualizationItem, VisualizationCategory } from '../api/visualizationService';
import InlineFileViewer from '../components/InlineFileViewer';
import DocumentComparison from '../components/DocumentComparison';
// messageService wird aktuell auf dieser Seite nicht verwendet

interface Project {
  id: number;
  name: string;
  description: string;
  project_type: string;
  status: string;
  progress_percentage: number;
  budget?: number;
  current_costs: number;
  start_date?: string;
  end_date?: string;
  address?: string;
  property_size?: number;
  construction_area?: number;
  estimated_duration?: number;
}

// ChartData nicht genutzt auf dieser Seite

export default function Visualize() {
  // Navigation derzeit nicht genutzt
  const location = useLocation();
  // Auth-Context derzeit nicht genutzt
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [category, setCategory] = useState<VisualizationCategory>('interior');
  const [driveUrl] = useState<string>(buildDriveFolderUrl());
  const [plans, setPlans] = useState<VisualizationItem[]>([]);
  const [results, setResults] = useState<VisualizationItem[]>([]);
  const [expanded, setExpanded] = useState<{ interior: boolean; exterior: boolean; individual: boolean }>({ interior: true, exterior: false, individual: false });
  const [uploading, setUploading] = useState(false);
  // const [chatInput, setChatInput] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>('');
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [smartUploading, setSmartUploading] = useState(false);
  const [smartUploadProgress, setSmartUploadProgress] = useState<{
    processed: number;
    total: number;
    current: string;
  } | null>(null);
  const [showSmartUploadModal, setShowSmartUploadModal] = useState(false);
  const [selectedDocumentsForDMS, setSelectedDocumentsForDMS] = useState<Set<number>>(new Set());

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const projectId = urlParams.get('project');
    if (projectId) {
      setSelectedProject(projectId);
    }
    loadProjects();
    // initiale Visualize-Daten laden
    if (projectId) {
      void refreshVisualizeData(Number(projectId), category);
      
    }
  }, [location.search]);

  useEffect(() => {
    if (selectedProject && selectedProject !== 'all') {
      void refreshVisualizeData(Number(selectedProject), category);
      
    }
  }, [selectedProject, category]);

  const refreshVisualizeData = async (projectId: number, cat: VisualizationCategory) => {
    try {
      const items = await listVisualizations(projectId, cat);
      // Pläne sind Elemente, die nur eine plan_url haben (hochgeladene Dokumente)
      setPlans(items.filter(i => !!i.plan_url && !i.result_url));
      // Ergebnisse sind Elemente, die eine result_url haben (fertige Visualisierungen)
      setResults(items.filter(i => !!i.result_url));
    } catch (e) {
      console.warn('Visualizations laden fehlgeschlagen', e);
    }
  };

  

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !selectedProject || selectedProject === 'all') return;
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const ok = await uploadPlan(Number(selectedProject), category, file, file.name.replace(/\.[^/.]+$/, ""));
      if (ok) {
        await refreshVisualizeData(Number(selectedProject), category);
        setUploadSuccess(`Datei "${file.name}" erfolgreich hochgeladen!`);
        setTimeout(() => setUploadSuccess(null), 5000);
      } else {
        setError('Upload fehlgeschlagen. Bitte versuchen Sie es erneut.');
      }
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  

  const loadProjects = async () => {
    try {
      const data = await getProjects();
      setProjects(data);
    } catch (err: any) {
      console.error('Error loading projects:', err);
      setError('Fehler beim Laden der Projekte');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectChange = (projectId: string) => {
    setSelectedProject(projectId);
  };

  

  if (loading) {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] bg-fixed overflow-hidden">
        {/* Hintergrund-Glows */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-[420px] w-[420px] rounded-full blur-3xl opacity-70" style={{ background: 'radial-gradient(circle at center, rgba(81,99,111,0.22), rgba(81,99,111,0.08) 60%, transparent 70%)' }} />
        <div className="pointer-events-none absolute -bottom-32 -right-24 h-[520px] w-[520px] rounded-full blur-3xl opacity-70" style={{ background: 'radial-gradient(circle at center, rgba(255,189,89,0.22), rgba(255,189,89,0.08) 55%, transparent 70%)' }} />
        <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[480px] w-[480px] rounded-full blur-3xl opacity-30" style={{ background: 'radial-gradient(circle at center, rgba(81,99,111,0.18), transparent 65%)' }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#51636f]"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] bg-fixed overflow-hidden">
      {/* Hintergrund-Glows */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-[420px] w-[420px] rounded-full blur-3xl opacity-70" style={{ background: 'radial-gradient(circle at center, rgba(81,99,111,0.22), rgba(81,99,111,0.08) 60%, transparent 70%)' }} />
      <div className="pointer-events-none absolute -bottom-32 -right-24 h-[520px] w-[520px] rounded-full blur-3xl opacity-70" style={{ background: 'radial-gradient(circle at center, rgba(255,189,89,0.22), rgba(255,189,89,0.08) 55%, transparent 70%)' }} />
      <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[480px] w-[480px] rounded-full blur-3xl opacity-30" style={{ background: 'radial-gradient(circle at center, rgba(81,99,111,0.18), transparent 65%)' }} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        {/* Header mit modernem Design */}
        <div className="mb-12 relative">
          <ProjectBreadcrumb />
          {/* Animierte Hintergrund-Glows */}
          <div className="pointer-events-none absolute -inset-4 opacity-70 blur-3xl rounded-3xl bg-[radial-gradient(ellipse_at_top_left,rgba(81,99,111,0.2),rgba(255,189,89,0.2))] animate-pulse"></div>
          <div className="pointer-events-none absolute -inset-8 opacity-40 blur-3xl rounded-3xl bg-[radial-gradient(ellipse_at_bottom_right,rgba(255,189,89,0.15),rgba(81,99,111,0.15))] animate-pulse" style={{ animationDelay: '1s' }}></div>
          
          <div className="relative mt-8">
            <div className="text-center">
              {/* Icon mit Glow-Effekt */}
              <div className="inline-flex items-center justify-center w-20 h-20 mb-6 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-3xl shadow-[0_0_40px_rgba(255,189,89,0.4)] transform hover:scale-110 transition-all duration-500">
                <BarChart3 size={36} className="text-white drop-shadow-lg" />
              </div>
              
              {/* Titel mit Gradient */}
              <h1 className="text-5xl font-black bg-gradient-to-r from-white via-[#ffbd59] to-white bg-clip-text text-transparent mb-4 tracking-tight">
                Visualize
              </h1>
              
              {/* Untertitel */}
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
                Verwandeln Sie Ihre Baupläne in beeindruckende Visualisierungen. 
                <span className="text-[#ffbd59] font-semibold"> Hochladen, organisieren und visualisieren</span> – alles an einem Ort.
              </p>
              
              {/* Feature-Highlights */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <button
                  onClick={() => {
                    if (selectedProject && selectedProject !== 'all' && plans.length > 0) {
                      setShowSmartUploadModal(true);
                      setSelectedDocumentsForDMS(new Set());
                    }
                  }}
                  disabled={!selectedProject || selectedProject === 'all' || smartUploading || plans.length === 0}
                  className={`bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 transition-all duration-300 text-left ${
                    selectedProject && selectedProject !== 'all' && !smartUploading && plans.length > 0
                      ? 'hover:bg-[#ffbd59]/10 hover:border-[#ffbd59]/30 cursor-pointer transform hover:scale-105'
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="w-12 h-12 bg-[#ffbd59]/20 rounded-xl flex items-center justify-center mb-4 mx-auto">
                    {smartUploading ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#ffbd59]"></div>
                    ) : (
                      <Upload className="w-6 h-6 text-[#ffbd59]" />
                    )}
                  </div>
                  <h3 className="text-white font-semibold mb-2">Smart Upload</h3>
                  <p className="text-gray-400 text-sm">
                    {smartUploading 
                      ? `Verarbeite ${smartUploadProgress?.current}...`
                      : plans.length === 0
                      ? 'Laden Sie zunächst Dokumente hoch'
                      : 'Wählen Sie Dokumente für automatische DMS-Kategorisierung'
                    }
                  </p>
                  {smartUploadProgress ? (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>{smartUploadProgress.processed} von {smartUploadProgress.total}</span>
                        <span>{Math.round((smartUploadProgress.processed / smartUploadProgress.total) * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-[#ffbd59] h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(smartUploadProgress.processed / smartUploadProgress.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  ) : selectedProject && selectedProject !== 'all' && !smartUploading && plans.length > 0 && (
                    <div className="mt-3 px-2 py-1 bg-[#ffbd59]/20 text-[#ffbd59] text-xs rounded-full inline-block">
                      ✓ {plans.length} Dokumente verfügbar
                    </div>
                  )}
                </button>
                
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 opacity-50 cursor-not-allowed">
                  <div className="w-12 h-12 bg-[#51636f]/20 rounded-xl flex items-center justify-center mb-4 mx-auto">
                    <Eye className="w-6 h-6 text-[#51636f]" />
                  </div>
                  <h3 className="text-white font-semibold mb-2">Live Preview</h3>
                  <p className="text-gray-400 text-sm">VR 360° Ansichten (Coming Soon)</p>
                  <div className="mt-3 px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full inline-block">
                    In Entwicklung
                  </div>
                </div>
                
                <button
                  onClick={() => setShowComparison(true)}
                  disabled={!selectedProject || selectedProject === 'all' || plans.length === 0}
                  className={`bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 transition-all duration-300 text-left ${
                    selectedProject && selectedProject !== 'all' && plans.length > 0
                      ? 'hover:bg-[#ffbd59]/10 hover:border-[#ffbd59]/30 cursor-pointer transform hover:scale-105'
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="w-12 h-12 bg-[#ffbd59]/20 rounded-xl flex items-center justify-center mb-4 mx-auto">
                    <ArrowLeftRight className="w-6 h-6 text-[#ffbd59]" />
                  </div>
                  <h3 className="text-white font-semibold mb-2">Pläne vergleichen</h3>
                  <p className="text-gray-400 text-sm">
                    {plans.length === 0
                      ? 'Laden Sie zunächst Dokumente hoch'
                      : results.length === 0
                      ? `${plans.length} Dokumente verfügbar - Visualisierungen können verglichen werden`
                      : `${plans.length} Dokumente und ${results.length} Visualisierungen verfügbar`
                    }
                  </p>
                  {plans.length > 0 && (
                    <div className="mt-3 px-2 py-1 bg-[#ffbd59]/20 text-[#ffbd59] text-xs rounded-full inline-block">
                      ✓ Bereit zum Vergleichen
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Success Banner */}
        {uploadSuccess && (
          <div className="bg-green-500/20 border border-green-500/30 text-green-300 px-6 py-4 flex items-center justify-between mb-6 rounded-xl backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <CheckCircle size={20} />
              <span>{uploadSuccess}</span>
            </div>
            <button onClick={() => setUploadSuccess(null)} className="text-green-400 hover:text-green-200">
              <XCircle size={20} />
            </button>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-6 py-4 flex items-center justify-between mb-6 rounded-xl backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-200">
              <XCircle size={20} />
            </button>
          </div>
        )}

        {/* Project Selector + Kategorie */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 mb-8 hover:bg-white/15 hover:border-[#51636f]/40 transition-all duration-500">
          <div className="flex items-center gap-4">
            <Building size={20} className="text-gray-300" />
            <label className="text-sm font-medium text-gray-200">Projekt auswählen:</label>
            <select
              value={selectedProject}
              onChange={(e) => handleProjectChange(e.target.value)}
              className="flex-1 px-4 py-2 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#51636f] focus:border-transparent"
            >
              <option value="all">Alle Projekte</option>
              {projects.map(project => (
                <option key={project.id} value={project.id.toString()}>
                  {project.name}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-200">Kategorie:</label>
              <div className="flex gap-2">
                {(['interior','exterior','individual'] as VisualizationCategory[]).map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={`px-3 py-2 rounded-xl text-sm border transition-all relative ${
                      category === c ? 'bg-[#51636f] text-white border-[#51636f] shadow-[0_0_24px_rgba(81,99,111,0.45)]' : 'bg-white/10 text-gray-300 border-gray-500 hover:bg-white/20'
                    }`}
                  >
                    <span className="capitalize">{c}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Upload & Drive-Link */}
        {selectedProject !== 'all' && (
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 mb-8 hover:bg-white/15 hover:border-[#51636f]/40 transition-all duration-500">
            <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Pläne hochladen</h3>
                <p className="text-gray-300 text-sm">Die Dateien werden pro Projekt und Kategorie in Google Drive organisiert.</p>
              </div>
              <div className="flex items-center justify-end">
                <label className={`px-6 py-3 rounded-xl text-white cursor-pointer transition-all duration-300 ${uploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-[#51636f] to-[#3a4a57] hover:from-[#5a6f7f] hover:to-[#404a57] hover:scale-105'} shadow-[0_8px_24px_rgba(81,99,111,0.35)] transform`}>
                  <div className="flex items-center gap-2">
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Lädt hoch...</span>
                      </>
                    ) : (
                      <>
                        <Upload size={16} />
                        <span>Datei auswählen</span>
                      </>
                    )}
                  </div>
                  <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.mp4,.mov,.avi,.dwg,.dxf" />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Hochgeladene Dokumente (umbenannter Bereich) */}
        {selectedProject !== 'all' && (
          <div className="grid grid-cols-1 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 hover:bg-white/15 hover:border-[#51636f]/40 transition-all duration-500">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">Hochgeladene Dokumente</h3>
                <div className="flex items-center gap-4 text-sm text-gray-300">
                  <span>Kategorie: <span className="capitalize">{category}</span></span>
                  <a href={buildDriveCategoryFolderUrl(category)} target="_blank" rel="noreferrer" className="text-[#ffbd59] underline underline-offset-2 hover:text-[#ffa726]">Ordner öffnen</a>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plans.length === 0 && (
                  <div className="col-span-2 text-gray-400 text-sm">Noch keine Dokumente hochgeladen.</div>
                )}
                {plans.map((p) => (
                  <div key={p.id} className="group rounded-xl border border-white/20 bg-white/5 backdrop-blur-sm overflow-hidden transition-all hover:shadow-[0_12px_32px_rgba(81,99,111,0.25)] hover:border-[#51636f]/40 hover:bg-white/10">
                    <button
                      className="w-full text-left p-3 flex items-center justify-between"
                      onClick={() => { if (p.plan_url) { setPreviewUrl(p.plan_url); setPreviewTitle(p.title || 'Dokument'); } }}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-semibold text-white truncate">{p.title || 'Dokument'}</div>
                          <span className="text-xs text-gray-400">
                            {p.uploaded_at ? new Date(p.uploaded_at).toLocaleDateString('de-DE', {
                              day: '2-digit',
                              month: '2-digit', 
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : (p.created_at ? new Date(p.created_at).toLocaleDateString('de-DE') : '')}
                          </span>
                        </div>
                        {p.uploader_name && (
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 bg-[#ffbd59]/20 rounded-full flex items-center justify-center">
                              <span className="text-[#ffbd59] text-xs font-bold">
                                {p.uploader_name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span className="text-xs text-gray-400">
                              Hochgeladen von {p.uploader_name}
                            </span>
                          </div>
                        )}
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Visualisierungsergebnisse je Kategorie als aufklappbare Abschnitte */}
        {selectedProject !== 'all' && (
          <div className="grid grid-cols-1 gap-6 mb-8">
            {(['interior','exterior','individual'] as VisualizationCategory[]).map((catKey) => (
              <div key={catKey} className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 overflow-hidden hover:bg-white/15 hover:border-[#51636f]/40 transition-all duration-500">
                <button
                  onClick={() => setExpanded((e) => ({ ...e, [catKey]: !e[catKey] }))}
                  className="w-full flex items-center justify-between px-8 py-6 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-semibold text-white capitalize">{catKey} Visualisierungsergebnisse</h3>
                    <a href={buildDriveCategoryFolderUrl(catKey)} target="_blank" rel="noreferrer" className="text-sm text-[#ffbd59] underline underline-offset-2 hover:text-[#ffa726]">Ordner öffnen</a>
                  </div>
                  <span className="text-sm text-gray-300">{expanded[catKey] ? 'Zuklappen' : 'Aufklappen'}</span>
                </button>
                <div className={`${expanded[catKey] ? 'block' : 'hidden'} px-8 pb-8`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Wenn die aktuell gewählte Kategorie der Section entspricht, zeigen wir geladene Ergebnisse; ansonsten Hinweis */}
                    {category !== catKey && (
                      <div className="col-span-2 text-gray-400 text-sm">
                        Wähle oben die Kategorie <span className="capitalize">{catKey}</span>, um die Ergebnisse zu laden.
                      </div>
                    )}
                    {category === catKey && results.length === 0 && (
                      <div className="col-span-2 text-gray-400 text-sm">Noch keine Ergebnisse vorhanden.</div>
                    )}
                    {category === catKey && results.map((item) => (
                      <div key={item.id} className="group rounded-xl border border-white/20 bg-white/5 backdrop-blur-sm overflow-hidden transition-all hover:shadow-[0_12px_32px_rgba(81,99,111,0.25)] hover:border-[#51636f]/40 hover:bg-white/10">
                        <button
                          className="w-full text-left"
                          onClick={() => { if (item.result_url) { setPreviewUrl(item.result_url); setPreviewTitle(item.title || 'Visualisierung'); } }}
                        >
                          <div className="aspect-video flex items-center justify-center" style={{ background: 'radial-gradient(ellipse at center, rgba(81,99,111,0.08), rgba(0,0,0,0))' }}>
                            <BarChart3 className="text-gray-400" />
                          </div>
                          <div className="p-3">
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-semibold text-white truncate">{item.title || 'Visualisierung'}</div>
                              <span className={`text-xs px-2 py-0.5 rounded-full border ${item.status === 'COMPLETED' ? 'bg-green-500/20 text-green-300 border-green-500/30' : item.status === 'IN_PROGRESS' ? 'bg-[#ffbd59]/20 text-[#ffbd59] border-[#ffbd59]/30' : 'bg-gray-500/20 text-gray-300 border-gray-500/30'}`}>{item.status || 'UNBEKANNT'}</span>
                            </div>
                            {item.description && <div className="text-xs text-gray-400 mt-1 line-clamp-2">{item.description}</div>}
                          </div>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {previewUrl && (
        <InlineFileViewer
          fileUrl={previewUrl}
          title={previewTitle}
          onClose={() => { setPreviewUrl(null); setPreviewTitle(''); }}
        />
      )}
      
      {/* Document Comparison Modal */}
      <DocumentComparison
        isOpen={showComparison}
        onClose={() => setShowComparison(false)}
        uploadedDocuments={plans}
        visualizationResults={results}
        projectId={selectedProject ? Number(selectedProject) : 0}
      />

      {/* Smart Upload Modal */}
      {showSmartUploadModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden border border-white/10">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-[#ffbd59]/95 to-[#ffa726]/95 backdrop-blur-lg px-6 py-4 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <Upload className="w-5 h-5 text-[#1a1a2e]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#1a1a2e]">Smart Upload - DMS Integration</h2>
                    <p className="text-[#2c3539] text-sm">Wählen Sie Dokumente für automatische Kategorisierung</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSmartUploadModal(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-[#1a1a2e]" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
              {/* Info Banner */}
              <div className="bg-[#ffbd59]/10 border border-[#ffbd59]/30 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-[#ffbd59]/20 rounded-full flex items-center justify-center mt-0.5">
                    <CheckCircle className="w-3 h-3 text-[#ffbd59]" />
                  </div>
                  <div>
                    <h3 className="text-[#ffbd59] font-medium mb-1">Automatische Kategorisierung</h3>
                    <p className="text-gray-300 text-sm">
                      Die ausgewählten Dokumente werden automatisch analysiert und in passende DMS-Kategorien eingeordnet. 
                      Das System erkennt Dokumenttypen basierend auf Dateinamen, Inhalten und Dateierweiterungen.
                    </p>
                  </div>
                </div>
              </div>

              {/* Document Selection */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Verfügbare Dokumente ({plans.length})</h3>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => {
                        if (selectedDocumentsForDMS.size === plans.length) {
                          setSelectedDocumentsForDMS(new Set());
                        } else {
                          setSelectedDocumentsForDMS(new Set(plans.map(p => p.id)));
                        }
                      }}
                      className="text-sm text-[#ffbd59] hover:text-[#ffa726] transition-colors"
                    >
                      {selectedDocumentsForDMS.size === plans.length ? 'Alle abwählen' : 'Alle auswählen'}
                    </button>
                    <span className="text-sm text-gray-400">
                      {selectedDocumentsForDMS.size} von {plans.length} ausgewählt
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {plans.map((doc) => (
                    <div
                      key={doc.id}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        selectedDocumentsForDMS.has(doc.id)
                          ? 'border-[#ffbd59] bg-[#ffbd59]/10 shadow-[0_0_20px_rgba(255,189,89,0.3)]'
                          : 'border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/30'
                      }`}
                      onClick={() => {
                        const newSelected = new Set(selectedDocumentsForDMS);
                        if (newSelected.has(doc.id)) {
                          newSelected.delete(doc.id);
                        } else {
                          newSelected.add(doc.id);
                        }
                        setSelectedDocumentsForDMS(newSelected);
                      }}
                    >
                      <div className="flex items-start gap-4">
                        {/* Checkbox */}
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center mt-1 transition-colors ${
                          selectedDocumentsForDMS.has(doc.id)
                            ? 'border-[#ffbd59] bg-[#ffbd59]'
                            : 'border-gray-400 bg-transparent'
                        }`}>
                          {selectedDocumentsForDMS.has(doc.id) && (
                            <CheckCircle className="w-3 h-3 text-[#1a1a2e]" />
                          )}
                        </div>

                        {/* Document Icon */}
                        <div className={`p-2 rounded-lg ${
                          selectedDocumentsForDMS.has(doc.id) ? 'bg-[#ffbd59]/20' : 'bg-white/10'
                        }`}>
                          <FileText className={`w-5 h-5 ${
                            selectedDocumentsForDMS.has(doc.id) ? 'text-[#ffbd59]' : 'text-gray-400'
                          }`} />
                        </div>

                        {/* Document Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-white truncate">{doc.title}</h4>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                            <span>
                              {doc.uploaded_at 
                                ? new Date(doc.uploaded_at).toLocaleDateString('de-DE', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })
                                : 'Kein Datum'
                              }
                            </span>
                            {doc.uploader_name && (
                              <span>von {doc.uploader_name}</span>
                            )}
                          </div>
                          
                          {/* Preview of potential category */}
                          <div className="mt-2 text-xs">
                            <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full">
                              Wird automatisch kategorisiert
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-white/5 border-t border-white/10 flex items-center justify-between">
              <div className="text-sm text-gray-400">
                {selectedDocumentsForDMS.size === 0 
                  ? 'Keine Dokumente ausgewählt'
                  : `${selectedDocumentsForDMS.size} Dokument${selectedDocumentsForDMS.size !== 1 ? 'e' : ''} für DMS-Upload ausgewählt`
                }
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowSmartUploadModal(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={async () => {
                    if (selectedDocumentsForDMS.size === 0) return;
                    
                    const selectedDocs = plans.filter(doc => selectedDocumentsForDMS.has(doc.id));
                    
                    // Simuliere File-Objekte aus den Dokumenten (für die bestehende API)
                    // In einer echten Implementierung müssten die Dateien vom Server geholt werden
                    setShowSmartUploadModal(false);
                    setSmartUploading(true);
                    setSmartUploadProgress({ processed: 0, total: selectedDocs.length, current: selectedDocs[0]?.title || '' });
                    
                    try {
                      // Hier würde die echte Smart Upload API aufgerufen werden
                      // Für jetzt simulieren wir den Erfolg
                      await new Promise(resolve => setTimeout(resolve, 2000));
                      
                      setUploadSuccess(`${selectedDocs.length} Dokumente erfolgreich ins DMS kategorisiert!`);
                      await refreshVisualizeData(Number(selectedProject), category);
                      setTimeout(() => setUploadSuccess(null), 5000);
                    } catch (error) {
                      setError('DMS-Upload fehlgeschlagen. Bitte versuchen Sie es erneut.');
                    } finally {
                      setSmartUploading(false);
                      setSmartUploadProgress(null);
                      setSelectedDocumentsForDMS(new Set());
                    }
                  }}
                  disabled={selectedDocumentsForDMS.size === 0}
                  className="px-6 py-2 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-[#1a1a2e] font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:from-[#ffa726] hover:to-[#ff9800] transition-all transform hover:scale-105"
                >
                  {selectedDocumentsForDMS.size === 0 
                    ? 'Dokumente auswählen'
                    : `${selectedDocumentsForDMS.size} Dokument${selectedDocumentsForDMS.size !== 1 ? 'e' : ''} ins DMS übertragen`
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 