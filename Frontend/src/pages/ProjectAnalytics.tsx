import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  DollarSign,
  Users,
  Clock,
  Target,
  CheckCircle,
  AlertTriangle,
  XCircle,
  PieChart,
  Activity,
  FileText,
  Receipt,
  ListTodo
} from 'lucide-react';
import { getProject, getProjectDashboard } from '../api/projectService';
import { getTasks } from '../api/taskService';
import { getDocuments } from '../api/documentService';
import { getQuotes } from '../api/quoteService';

interface Project {
  id: number;
  name: string;
  description: string;
  progress_percentage: number;
  budget?: number;
  current_costs: number;
  start_date?: string;
  end_date?: string;
}

interface Task {
  id: number;
  title: string;
  status: string;
  priority: string;
  progress_percentage: number;
  due_date?: string;
}

interface AnalyticsData {
  project: Project;
  task_count: number;
  completed_tasks: number;
  document_count: number;
  quote_count: number;
  tasks: Task[];
  documents: any[];
  quotes: any[];
}

export default function ProjectAnalytics() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const projectId = parseInt(id);
      
      const [project, dashboard, tasks, documents, quotes] = await Promise.all([
        getProject(projectId),
        getProjectDashboard(projectId),
        getTasks(projectId),
        getDocuments(projectId),
        getQuotes(projectId)
      ]);
      
      setData({
        project,
        task_count: dashboard.task_count,
        completed_tasks: dashboard.completed_tasks,
        document_count: dashboard.document_count,
        quote_count: dashboard.quote_count,
        tasks,
        documents,
        quotes
      });
    } catch (e: any) {
      console.error('Error loading analytics:', e);
      setError(e.message || 'Fehler beim Laden der Analytics');
    } finally {
      setLoading(false);
    }
  };

  const getTaskStatusCount = (status: string) => {
    return data?.tasks.filter(task => task.status === status).length || 0;
  };

  const getTaskPriorityCount = (priority: string) => {
    return data?.tasks.filter(task => task.priority === priority).length || 0;
  };

  const getOverdueTasks = () => {
    if (!data?.tasks) return 0;
    const today = new Date();
    return data.tasks.filter(task => {
      if (!task.due_date || task.status === 'completed') return false;
      return new Date(task.due_date) < today;
    }).length;
  };

  const getUpcomingTasks = () => {
    if (!data?.tasks) return 0;
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return data.tasks.filter(task => {
      if (!task.due_date || task.status === 'completed') return false;
      const dueDate = new Date(task.due_date);
      return dueDate >= today && dueDate <= nextWeek;
    }).length;
  };

  const getBudgetUtilization = () => {
    if (!data?.project.budget || data.project.budget === 0) return 0;
    return (data.project.current_costs / data.project.budget) * 100;
  };

  const getProjectTimeline = () => {
    if (!data?.project.start_date || !data.project.end_date) return null;
    
    const start = new Date(data.project.start_date);
    const end = new Date(data.project.end_date);
    const today = new Date();
    
    const totalDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    const elapsedDays = (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    
    return {
      totalDays: Math.round(totalDays),
      elapsedDays: Math.round(Math.max(0, elapsedDays)),
      remainingDays: Math.round(Math.max(0, totalDays - elapsedDays)),
      progress: Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100))
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#51646f] via-[#3d4952] to-[#2c3539] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ffbd59] mx-auto mb-4"></div>
          <p className="text-white text-lg">Lade Analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#51646f] via-[#3d4952] to-[#2c3539] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-lg">{error || 'Projekt nicht gefunden'}</p>
          <button
            onClick={() => navigate('/projects')}
            className="mt-4 px-6 py-2 bg-[#ffbd59] text-[#3d4952] rounded-lg font-semibold hover:bg-[#ffa726] transition"
          >
            Zurück zu Projekten
          </button>
        </div>
      </div>
    );
  }

  const timeline = getProjectTimeline();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#51646f] via-[#3d4952] to-[#2c3539]">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#3d4952]/95 to-[#51646f]/95 backdrop-blur-lg text-white px-8 py-6 shadow-2xl border-b border-[#ffbd59]/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(`/projects/${id}`)}
              className="p-2 bg-[#51646f] hover:bg-[#607583] rounded-xl transition-colors duration-300"
            >
              <ArrowLeft size={20} className="text-[#ffbd59]" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-[#ffbd59] flex items-center gap-2">
                <BarChart3 size={28} />
                Analytics
              </h1>
              <p className="text-gray-300">{data.project.name}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="p-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/20 rounded-xl">
                <Target size={24} className="text-blue-300" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Projektfortschritt</p>
                <p className="text-white text-2xl font-bold">{data.project.progress_percentage}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-500/20 rounded-xl">
                <CheckCircle size={24} className="text-green-300" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Aufgaben abgeschlossen</p>
                <p className="text-white text-2xl font-bold">{data.completed_tasks}/{data.task_count}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-500/20 rounded-xl">
                <DollarSign size={24} className="text-yellow-300" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Budget genutzt</p>
                <p className="text-white text-2xl font-bold">{getBudgetUtilization().toFixed(1)}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-500/20 rounded-xl">
                <FileText size={24} className="text-purple-300" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Dokumente</p>
                <p className="text-white text-2xl font-bold">{data.document_count}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Task Analytics */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <ListTodo size={20} className="text-[#ffbd59]" />
              Aufgaben-Analytics
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Status-Verteilung</span>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-white">Abgeschlossen</span>
                  </div>
                  <span className="text-white font-semibold">{getTaskStatusCount('completed')}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-white">In Bearbeitung</span>
                  </div>
                  <span className="text-white font-semibold">{getTaskStatusCount('in_progress')}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-white">Offen</span>
                  </div>
                  <span className="text-white font-semibold">{getTaskStatusCount('todo')}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-white">Überfällig</span>
                  </div>
                  <span className="text-white font-semibold">{getOverdueTasks()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Project Timeline */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Calendar size={20} className="text-[#ffbd59]" />
              Projekt-Zeitplan
            </h3>
            
            {timeline ? (
              <div className="space-y-4">
                <div className="flex justify-between text-sm text-gray-300">
                  <span>Start: {new Date(data.project.start_date!).toLocaleDateString('de-DE')}</span>
                  <span>Ende: {new Date(data.project.end_date!).toLocaleDateString('de-DE')}</span>
                </div>
                
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-[#ffbd59] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${timeline.progress}%` }}
                  ></div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-white">{timeline.elapsedDays}</p>
                    <p className="text-sm text-gray-400">Vergangene Tage</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{timeline.remainingDays}</p>
                    <p className="text-sm text-gray-400">Verbleibende Tage</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{timeline.totalDays}</p>
                    <p className="text-sm text-gray-400">Gesamt</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-400">Keine Zeitplan-Daten verfügbar</p>
            )}
          </div>

          {/* Budget Analytics */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <DollarSign size={20} className="text-[#ffbd59]" />
              Budget-Analytics
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Budget</span>
                <span className="text-white font-semibold">
                  {data.project.budget ? `${data.project.budget.toLocaleString('de-DE')} €` : 'Nicht gesetzt'}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Aktuelle Kosten</span>
                <span className="text-white font-semibold">
                  {data.project.current_costs.toLocaleString('de-DE')} €
                </span>
              </div>
              
              {data.project.budget && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Verbleibend</span>
                    <span className="text-white font-semibold">
                      {(data.project.budget - data.project.current_costs).toLocaleString('de-DE')} €
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        getBudgetUtilization() > 100 ? 'bg-red-500' : 'bg-[#ffbd59]'
                      }`}
                      style={{ width: `${Math.min(100, getBudgetUtilization())}%` }}
                    ></div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Quote Analytics */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Receipt size={20} className="text-[#ffbd59]" />
              Angebote-Analytics
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Gesamtangebote</span>
                <span className="text-white font-semibold">{data.quote_count}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Durchschnittspreis</span>
                <span className="text-white font-semibold">
                  {data.quotes.length > 0 
                    ? `${(data.quotes.reduce((sum, quote) => sum + quote.total_amount, 0) / data.quotes.length).toLocaleString('de-DE')} €`
                    : 'Keine Angebote'
                  }
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Niedrigstes Angebot</span>
                <span className="text-white font-semibold">
                  {data.quotes.length > 0 
                    ? `${Math.min(...data.quotes.map(q => q.total_amount)).toLocaleString('de-DE')} €`
                    : 'Keine Angebote'
                  }
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Höchstes Angebot</span>
                <span className="text-white font-semibold">
                  {data.quotes.length > 0 
                    ? `${Math.max(...data.quotes.map(q => q.total_amount)).toLocaleString('de-DE')} €`
                    : 'Keine Angebote'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 