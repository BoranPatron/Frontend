import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProjects } from '../api/projectService';
import { costPositionService } from '../api/costPositionService';
import ProjectBreadcrumb from '../components/ProjectBreadcrumb';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  Calendar,
  Receipt,
  Building,
  Wrench,
  Truck,
  FileText,
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
  MoreHorizontal,
  BarChart3,
  PieChart,
  Target,
  Wallet,
  CreditCard,
  Phone,
  Mail,
  Globe,
  Clock,
  Award,
  Droplets,
  Flame,
  Home,
  Square,
  Palette,
  Layers,
  TreePine,
  Utensils,
  Bath,
  ArrowLeft,
  AlertTriangle,
  Handshake,
  Eye,
  Zap,
  Thermometer,
  Hammer
} from 'lucide-react';

interface Expense {
  id: number;
  title: string;
  description: string;
  amount: number;
  category: 'material' | 'labor' | 'equipment' | 'services' | 'permits' | 'other';
  project_id: number;
  date: string;
  receipt_url?: string;
  created_at: string;
}

interface CostPosition {
  id: number;
  title: string;
  description: string;
  amount: number;
  currency: string;
  category: string;
  cost_type: string;
  status: string;
  contractor_name?: string;
  contractor_contact?: string;
  contractor_phone?: string;
  contractor_email?: string;
  contractor_website?: string;
  progress_percentage: number;
  paid_amount: number;
  payment_terms?: string;
  warranty_period?: number;
  estimated_duration?: number;
  start_date?: string;
  completion_date?: string;
  labor_cost?: number;
  material_cost?: number;
  overhead_cost?: number;
  risk_score?: number;
  price_deviation?: number;
  ai_recommendation?: string;
  quote_id?: number;
  milestone_id?: number;
  created_at: string;
  updated_at: string;
}

interface Budget {
  id: number;
  project_id: number;
  total_budget: number;
  spent_amount: number;
  remaining_amount: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

interface Project {
  id: number;
  name: string;
  description: string;
  budget?: number;
  current_costs: number;
}

export default function Finance() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [costPositions, setCostPositions] = useState<CostPosition[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showEditExpenseModal, setShowEditExpenseModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showCostPositionModal, setShowCostPositionModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [selectedCostPosition, setSelectedCostPosition] = useState<CostPosition | null>(null);
  const [activeTab, setActiveTab] = useState<'expenses' | 'cost-positions' | 'budget'>('cost-positions');

  // Form state
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    description: '',
    amount: '',
    category: 'other' as 'material' | 'labor' | 'equipment' | 'services' | 'permits' | 'other',
    date: '',
    receipt_url: ''
  });

  const [budgetForm, setBudgetForm] = useState({
    total_budget: '',
    currency: 'EUR'
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const projectId = urlParams.get('project');
    if (projectId) {
      setSelectedProject(projectId);
    }
    loadProjects();
  }, [location.search]);

  useEffect(() => {
    if (selectedProject !== 'all') {
      loadFinanceData();
    }
  }, [selectedProject]);

  // Filtered expenses based on search and category
  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || expense.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const loadFinanceData = async () => {
    if (selectedProject === 'all') return;
    
    setLoading(true);
    try {
      // Mock data für Ausgaben
      const mockExpenses: Expense[] = [
        {
          id: 1,
          title: 'Bauholz',
          description: 'Kiefernholz für Dachstuhl',
          amount: 2500.00,
          category: 'material',
          project_id: parseInt(selectedProject),
          date: '2024-01-15',
          created_at: '2024-01-15T10:00:00Z'
        },
        {
          id: 2,
          title: 'Elektriker',
          description: 'Elektroinstallation',
          amount: 1800.00,
          category: 'labor',
          project_id: parseInt(selectedProject),
          date: '2024-01-20',
          created_at: '2024-01-20T14:30:00Z'
        },
        {
          id: 3,
          title: 'Baugenehmigung',
          description: 'Gebühren für Baugenehmigung',
          amount: 450.00,
          category: 'permits',
          project_id: parseInt(selectedProject),
          date: '2024-01-10',
          created_at: '2024-01-10T09:15:00Z'
        }
      ];
      setExpenses(mockExpenses);

      // Lade Kostenpositionen aus akzeptierten Angeboten
      try {
        console.log('🔍 Lade Kostenpositionen aus akzeptierten Angeboten für Projekt:', selectedProject);
        const costPositionsData = await costPositionService.getCostPositionsFromAcceptedQuotes(parseInt(selectedProject));
        console.log('✅ Kostenpositionen geladen:', costPositionsData);
        setCostPositions(costPositionsData);
      } catch (error) {
        console.log('Keine Kostenpositionen gefunden, verwende leere Liste:', error);
        setCostPositions([]);
      }

      // Mock data für Budgets
      const mockBudgets: Budget[] = [
        {
          id: 1,
          project_id: parseInt(selectedProject),
          total_budget: 50000.00,
          spent_amount: 4750.00,
          remaining_amount: 45250.00,
          currency: 'EUR',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-20T00:00:00Z'
        }
      ];
      setBudgets(mockBudgets);

      setSuccess('Finanzdaten erfolgreich geladen');
    } catch (error: any) {
      console.error('Fehler beim Laden der Finanzdaten:', error);
      setError('Fehler beim Laden der Finanzdaten: ' + (error?.message || error));
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const data = await getProjects();
      setProjects(data);
    } catch (err: any) {
      console.error('Error loading projects:', err);
      setProjects([]);
    }
  };

  const handleProjectChange = (projectId: string) => {
    setSelectedProject(projectId);
    if (projectId === 'all') {
      setExpenses([]);
      setCostPositions([]);
      setBudgets([]);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.title || !expenseForm.amount || selectedProject === 'all') return;

    try {
      const newExpense: Expense = {
        id: Date.now(),
        title: expenseForm.title,
        description: expenseForm.description,
        amount: parseFloat(expenseForm.amount),
        category: expenseForm.category,
        project_id: parseInt(selectedProject),
        date: expenseForm.date || new Date().toISOString().split('T')[0],
        receipt_url: expenseForm.receipt_url,
        created_at: new Date().toISOString()
      };

      setExpenses(prev => [...prev, newExpense]);
      setSuccess('Ausgabe erfolgreich hinzugefügt');
      setShowAddExpenseModal(false);
      resetExpenseForm();
    } catch (err: any) {
      console.error('Error adding expense:', err);
      setError('Fehler beim Hinzufügen der Ausgabe');
    }
  };

  const handleUpdateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;

    try {
      const updatedExpense: Expense = {
        ...editingExpense,
        title: expenseForm.title,
        description: expenseForm.description,
        amount: parseFloat(expenseForm.amount),
        category: expenseForm.category,
        date: expenseForm.date,
        receipt_url: expenseForm.receipt_url
      };

      setExpenses(prev => prev.map(exp => exp.id === editingExpense.id ? updatedExpense : exp));
      setSuccess('Ausgabe erfolgreich aktualisiert');
      setShowEditExpenseModal(false);
      setEditingExpense(null);
      resetExpenseForm();
    } catch (err: any) {
      console.error('Error updating expense:', err);
      setError('Fehler beim Aktualisieren der Ausgabe');
    }
  };

  const handleDeleteExpense = async (expenseId: number) => {
    if (!confirm('Sind Sie sicher, dass Sie diese Ausgabe löschen möchten?')) return;

    try {
      setExpenses(prev => prev.filter(exp => exp.id !== expenseId));
      setSuccess('Ausgabe erfolgreich gelöscht');
    } catch (err: any) {
      console.error('Error deleting expense:', err);
      setError('Fehler beim Löschen der Ausgabe');
    }
  };

  const handleUpdateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!budgetForm.total_budget || selectedProject === 'all') return;

    try {
      const newBudget: Budget = {
        id: Date.now(),
        project_id: parseInt(selectedProject),
        total_budget: parseFloat(budgetForm.total_budget),
        spent_amount: expenses.reduce((sum, exp) => sum + exp.amount, 0),
        remaining_amount: parseFloat(budgetForm.total_budget) - expenses.reduce((sum, exp) => sum + exp.amount, 0),
        currency: budgetForm.currency,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setBudgets([newBudget]);
      setSuccess('Budget erfolgreich aktualisiert');
      setShowBudgetModal(false);
      resetBudgetForm();
    } catch (err: any) {
      console.error('Error updating budget:', err);
      setError('Fehler beim Aktualisieren des Budgets');
    }
  };

  const resetExpenseForm = () => {
    setExpenseForm({
      title: '',
      description: '',
      amount: '',
      category: 'other',
      date: '',
      receipt_url: ''
    });
  };

  const resetBudgetForm = () => {
    setBudgetForm({
      total_budget: '',
      currency: 'EUR'
    });
  };

  const openEditExpenseModal = (expense: Expense) => {
    setEditingExpense(expense);
    setExpenseForm({
      title: expense.title,
      description: expense.description,
      amount: expense.amount.toString(),
      category: expense.category,
      date: expense.date,
      receipt_url: expense.receipt_url || ''
    });
    setShowEditExpenseModal(true);
  };

  const getBudgetStatus = () => {
    const budget = budgets[0];
    if (!budget) return { status: 'no-budget', color: 'text-gray-500' };
    
    const percentage = (budget.spent_amount / budget.total_budget) * 100;
    if (percentage > 90) return { status: 'critical', color: 'text-red-600' };
    if (percentage > 75) return { status: 'warning', color: 'text-yellow-600' };
    return { status: 'good', color: 'text-green-600' };
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'electrical':
        return <Zap size={16} className="text-white" />;
      case 'plumbing':
        return <Droplets size={16} className="text-white" />;
      case 'heating':
        return <Thermometer size={16} className="text-white" />;
      case 'roofing':
        return <Building size={16} className="text-white" />;
      case 'masonry':
        return <Building size={16} className="text-white" />;
      case 'drywall':
        return <Square size={16} className="text-white" />;
      case 'painting':
        return <Palette size={16} className="text-white" />;
      case 'flooring':
        return <Layers size={16} className="text-white" />;
      case 'landscaping':
        return <TreePine size={16} className="text-white" />;
      case 'kitchen':
        return <Utensils size={16} className="text-white" />;
      case 'bathroom':
        return <Bath size={16} className="text-white" />;
      case 'material':
        return <Truck size={16} className="text-white" />;
      case 'labor':
        return <Wrench size={16} className="text-white" />;
      case 'equipment':
        return <Truck size={16} className="text-white" />;
      case 'services':
        return <FileText size={16} className="text-white" />;
      case 'permits':
        return <Shield size={16} className="text-white" />;
      default:
        return <Building size={16} className="text-white" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'electrical':
        return 'Elektro';
      case 'plumbing':
        return 'Sanitär';
      case 'heating':
        return 'Heizung';
      case 'roofing':
        return 'Dach';
      case 'masonry':
        return 'Mauerwerk';
      case 'drywall':
        return 'Trockenbau';
      case 'painting':
        return 'Malerarbeiten';
      case 'flooring':
        return 'Bodenbeläge';
      case 'landscaping':
        return 'Außenanlagen';
      case 'kitchen':
        return 'Küche';
      case 'bathroom':
        return 'Bad';
      case 'material':
        return 'Material';
      case 'labor':
        return 'Arbeitskräfte';
      case 'equipment':
        return 'Geräte';
      case 'services':
        return 'Dienstleistungen';
      case 'permits':
        return 'Genehmigungen';
      case 'other':
        return 'Sonstiges';
      default:
        return category || 'Nicht kategorisiert';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'electrical':
        return 'bg-blue-100 text-blue-800';
      case 'plumbing':
        return 'bg-cyan-100 text-cyan-800';
      case 'heating':
        return 'bg-orange-100 text-orange-800';
      case 'roofing':
        return 'bg-gray-100 text-gray-800';
      case 'masonry':
        return 'bg-stone-100 text-stone-800';
      case 'drywall':
        return 'bg-slate-100 text-slate-800';
      case 'painting':
        return 'bg-purple-100 text-purple-800';
      case 'flooring':
        return 'bg-amber-100 text-amber-800';
      case 'landscaping':
        return 'bg-green-100 text-green-800';
      case 'kitchen':
        return 'bg-red-100 text-red-800';
      case 'bathroom':
        return 'bg-blue-100 text-blue-800';
      case 'material':
        return 'bg-blue-100 text-blue-800';
      case 'labor':
        return 'bg-green-100 text-green-800';
      case 'equipment':
        return 'bg-yellow-100 text-yellow-800';
      case 'services':
        return 'bg-purple-100 text-purple-800';
      case 'permits':
        return 'bg-red-100 text-red-800';
      case 'other':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'on_hold':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Aktiv';
      case 'completed':
        return 'Abgeschlossen';
      case 'cancelled':
        return 'Abgebrochen';
      case 'on_hold':
        return 'Pausiert';
      default:
        return status || 'Unbekannt';
    }
  };

  const getRiskColor = (riskScore: number) => {
    if (riskScore <= 15) return 'text-green-400';
    if (riskScore <= 25) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getPriceDeviationColor = (deviation: number) => {
    if (deviation < -10) return 'text-green-400';
    if (deviation < 10) return 'text-yellow-400';
    return 'text-red-400';
  };

  const openCostPositionModal = (costPosition: CostPosition) => {
    setSelectedCostPosition(costPosition);
    setShowCostPositionModal(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getBudgetProgress = () => {
    if (budgets.length === 0) return 0;
    const budget = budgets[0];
    const totalSpent = costPositions.reduce((sum, cp) => sum + cp.amount, 0) + 
                      expenses.reduce((sum, exp) => sum + exp.amount, 0);
    return (totalSpent / budget.total_budget) * 100;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ffbd59]"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} className="text-[#ffbd59]" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-[#ffbd59]">Finanzen</h1>
                <p className="text-gray-300">
                  Budget- und Kostenverwaltung für Ihre Projekte
                  {selectedProject !== 'all' && (
                    <span className="block text-sm text-[#ffbd59] mt-1">
                      Projekt-ID: {selectedProject}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowBudgetModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold"
              >
                <Target size={20} />
                Budget setzen
              </button>
              <button
                onClick={() => setShowAddExpenseModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-[#3d4952] rounded-xl hover:from-[#ffa726] hover:to-[#ff9800] transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold"
              >
                <Plus size={20} />
                Ausgabe hinzufügen
              </button>
            </div>
          </div>
        </header>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-6 py-4 flex items-center justify-between mb-6 rounded-xl">
            <div className="flex items-center gap-3">
              <AlertTriangle size={20} />
              <span>{error}</span>
            </div>
            <button onClick={() => setError('')} className="text-red-300 hover:text-red-100">
              <XCircle size={20} />
            </button>
          </div>
        )}

        {/* Success Banner */}
        {success && (
          <div className="bg-green-500/20 border border-green-500/30 text-green-300 px-6 py-4 flex items-center justify-between mb-6 rounded-xl">
            <div className="flex items-center gap-3">
              <CheckCircle size={20} />
              <span>{success}</span>
            </div>
            <button onClick={() => setSuccess('')} className="text-green-300 hover:text-green-100">
              <XCircle size={20} />
            </button>
          </div>
        )}

        <div className="max-w-7xl mx-auto">
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl">
                  <CreditCard size={24} className="text-white" />
                </div>
                <span className="text-sm text-gray-400">Kostenpositionen</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">{costPositions.length}</h3>
              <p className="text-sm text-gray-400">Aus akzeptierten Angeboten</p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-green-400 to-green-600 rounded-xl">
                  <Receipt size={24} className="text-white" />
                </div>
                <span className="text-sm text-gray-400">Ausgaben</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">{expenses.length}</h3>
              <p className="text-sm text-gray-400">Einzelne Ausgaben</p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl">
                  <Target size={24} className="text-white" />
                </div>
                <span className="text-sm text-gray-400">Gesamtbudget</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">
                {formatCurrency(budgets.length > 0 ? budgets[0].total_budget : 0)}
              </h3>
              <p className="text-sm text-gray-400">Verfügbares Budget</p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl">
                  <Wallet size={24} className="text-white" />
                </div>
                <span className="text-sm text-gray-400">Bezahlt</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">
                {formatCurrency(costPositions.reduce((sum, cp) => sum + cp.paid_amount, 0))}
              </h3>
              <p className="text-sm text-gray-400">Bereits bezahlt</p>
            </div>
          </div>

          {/* Project Selector */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Projekt auswählen</h2>
              <div className="flex items-center gap-3">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Projekte durchsuchen..."
                  className="px-4 py-2 bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div
                onClick={() => handleProjectChange('all')}
                className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  selectedProject === 'all'
                    ? 'border-[#ffbd59] bg-[#ffbd59]/10'
                    : 'border-white/20 hover:border-white/30 bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Building className="w-6 h-6 text-[#ffbd59]" />
                  <div>
                    <h3 className="font-medium text-white">Alle Projekte</h3>
                    <p className="text-sm text-gray-400">Gesamtübersicht</p>
                  </div>
                </div>
              </div>
              {projects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => handleProjectChange(project.id.toString())}
                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    selectedProject === project.id.toString()
                      ? 'border-[#ffbd59] bg-[#ffbd59]/10'
                      : 'border-white/20 hover:border-white/30 bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Building className="w-6 h-6 text-[#ffbd59]" />
                    <div>
                      <h3 className="font-medium text-white">{project.name}</h3>
                      <p className="text-sm text-gray-400">
                        Budget: {formatCurrency(project.budget || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl mb-6 border border-white/20">
            <div className="border-b border-white/20">
              <nav className="flex space-x-8 px-6" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('cost-positions')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'cost-positions'
                      ? 'border-[#ffbd59] text-[#ffbd59]'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Kostenpositionen
                    {costPositions.length > 0 && (
                      <span className="bg-[#ffbd59]/20 text-[#ffbd59] text-xs font-medium px-2 py-1 rounded-full">
                        {costPositions.length}
                      </span>
                    )}
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('expenses')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'expenses'
                      ? 'border-[#ffbd59] text-[#ffbd59]'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4" />
                    Ausgaben
                    {expenses.length > 0 && (
                      <span className="bg-white/20 text-white text-xs font-medium px-2 py-1 rounded-full">
                        {expenses.length}
                      </span>
                    )}
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('budget')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'budget'
                      ? 'border-[#ffbd59] text-[#ffbd59]'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Budget
                  </div>
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'cost-positions' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-white">Kostenpositionen aus akzeptierten Angeboten</h3>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400">Gesamt:</span>
                        <span className="font-semibold text-lg text-white">
                          {formatCurrency(costPositions.reduce((sum, cp) => sum + cp.amount, 0))}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400">Bezahlt:</span>
                        <span className="font-semibold text-lg text-green-400">
                          {formatCurrency(costPositions.reduce((sum, cp) => sum + cp.paid_amount, 0))}
                        </span>
                      </div>
                    </div>
                  </div>

                  {costPositions.length === 0 ? (
                    <div className="text-center py-12">
                      <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-white mb-2">Keine Kostenpositionen</h3>
                      <p className="text-gray-400">Akzeptieren Sie Angebote, um hier Kostenpositionen zu sehen.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {costPositions.map((costPosition) => (
                        <div
                          key={costPosition.id}
                          className="group bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl cursor-pointer"
                          onClick={() => openCostPositionModal(costPosition)}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-xl">
                                {getCategoryIcon(costPosition.category)}
                              </div>
                              <div>
                                <h4 className="font-semibold text-white group-hover:text-[#ffbd59] transition-colors">{costPosition.title}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(costPosition.category)}`}>
                                    {getCategoryLabel(costPosition.category)}
                                  </span>
                                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(costPosition.status)}`}>
                                    {getStatusLabel(costPosition.status)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-lg text-white">
                                {formatCurrency(costPosition.amount)}
                              </div>
                              <div className="text-sm text-gray-400">
                                {costPosition.currency}
                              </div>
                            </div>
                          </div>

                          <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                            {costPosition.description}
                          </p>

                          {/* Contractor Info */}
                          {costPosition.contractor_name && (
                            <div className="bg-white/5 rounded-lg p-3 mb-4">
                              <div className="flex items-center gap-2 mb-2">
                                <Building className="w-4 h-4 text-[#ffbd59]" />
                                <span className="font-medium text-sm text-white">{costPosition.contractor_name}</span>
                              </div>
                              {costPosition.contractor_contact && (
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                  <span>👤 {costPosition.contractor_contact}</span>
                                </div>
                              )}
                              {costPosition.contractor_phone && (
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                  <Phone className="w-3 h-3" />
                                  <span>{costPosition.contractor_phone}</span>
                                </div>
                              )}
                              {costPosition.contractor_email && (
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                  <Mail className="w-3 h-3" />
                                  <span>{costPosition.contractor_email}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Progress and Payment */}
                          <div className="space-y-3">
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-400">Fortschritt</span>
                                <span className="font-medium text-white">{costPosition.progress_percentage}%</span>
                              </div>
                              <div className="w-full bg-white/20 rounded-full h-2">
                                <div
                                  className="bg-[#ffbd59] h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${costPosition.progress_percentage}%` }}
                                ></div>
                              </div>
                            </div>

                            <div className="flex justify-between items-center">
                              <div className="text-sm">
                                <span className="text-gray-400">Bezahlt:</span>
                                <span className="font-medium text-green-400 ml-1">
                                  {formatCurrency(costPosition.paid_amount)}
                                </span>
                              </div>
                              <div className="text-sm">
                                <span className="text-gray-400">Verbleibend:</span>
                                <span className="font-medium text-red-400 ml-1">
                                  {formatCurrency(costPosition.amount - costPosition.paid_amount)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* AI Analysis */}
                          {costPosition.risk_score && costPosition.price_deviation && (
                            <div className="mt-4 pt-4 border-t border-white/20">
                              <div className="flex items-center gap-2 mb-2">
                                <Award className="w-4 h-4 text-[#ffbd59]" />
                                <span className="text-sm font-medium text-white">KI-Analyse</span>
                              </div>
                              <div className="grid grid-cols-2 gap-3 text-xs">
                                <div>
                                  <span className="text-gray-400">Risiko:</span>
                                  <span className={`ml-1 font-medium ${getRiskColor(costPosition.risk_score)}`}>
                                    {costPosition.risk_score}/100
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-400">Preisabweichung:</span>
                                  <span className={`ml-1 font-medium ${getPriceDeviationColor(costPosition.price_deviation)}`}>
                                    {costPosition.price_deviation > 0 ? '+' : ''}{costPosition.price_deviation.toFixed(1)}%
                                  </span>
                                </div>
                              </div>
                              {costPosition.ai_recommendation && (
                                <div className="mt-2 text-xs text-gray-400 italic">
                                  "{costPosition.ai_recommendation}"
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'expenses' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-white">Ausgaben</h3>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Ausgaben durchsuchen..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 pr-4 py-2 bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                        />
                      </div>
                      <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="px-4 py-2 bg-white/10 backdrop-blur-lg border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                      >
                        <option value="all">Alle Kategorien</option>
                        <option value="material">Material</option>
                        <option value="labor">Arbeitskräfte</option>
                        <option value="equipment">Geräte</option>
                        <option value="services">Dienstleistungen</option>
                        <option value="permits">Genehmigungen</option>
                        <option value="other">Sonstiges</option>
                      </select>
                    </div>
                  </div>

                  {filteredExpenses.length === 0 ? (
                    <div className="text-center py-12">
                      <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-white mb-2">Keine Ausgaben</h3>
                      <p className="text-gray-400">Fügen Sie Ihre erste Ausgabe hinzu.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredExpenses.map((expense) => (
                        <div key={expense.id} className="group bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-xl">
                                {getCategoryIcon(expense.category)}
                              </div>
                              <div>
                                <h4 className="font-semibold text-white group-hover:text-[#ffbd59] transition-colors">{expense.title}</h4>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(expense.category)}`}>
                                  {getCategoryLabel(expense.category)}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-lg text-white">
                                {formatCurrency(expense.amount)}
                              </div>
                              <div className="text-sm text-gray-400">
                                {new Date(expense.date).toLocaleDateString('de-DE')}
                              </div>
                            </div>
                          </div>
                          <p className="text-gray-300 text-sm mb-4">{expense.description}</p>
                          <div className="flex items-center justify-between">
                            <button
                              onClick={() => openEditExpenseModal(expense)}
                              className="text-[#ffbd59] hover:text-[#ffa726] text-sm font-medium transition-colors"
                            >
                              Bearbeiten
                            </button>
                            <button
                              onClick={() => handleDeleteExpense(expense.id)}
                              className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                            >
                              Löschen
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'budget' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-white">Budget & Finanzübersicht</h3>
                  </div>

                  {budgets.length === 0 ? (
                    <div className="text-center py-12">
                      <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-white mb-2">Kein Budget gesetzt</h3>
                      <p className="text-gray-400">Setzen Sie ein Budget für Ihr Projekt.</p>
                      <button
                        onClick={() => setShowBudgetModal(true)}
                        className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-medium rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
                      >
                        <Target size={20} />
                        Budget setzen
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Budget Overview */}
                      <div className="bg-gradient-to-br from-blue-500/20 to-indigo-500/20 backdrop-blur-lg rounded-2xl p-6 border border-blue-500/30">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl">
                            <Target className="w-6 h-6 text-white" />
                          </div>
                          <h4 className="text-lg font-semibold text-white">Budget-Übersicht</h4>
                        </div>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">Gesamtbudget:</span>
                            <span className="font-bold text-lg text-white">{formatCurrency(budgets[0].total_budget)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">Ausgegeben:</span>
                            <span className="font-bold text-lg text-red-400">{formatCurrency(budgets[0].spent_amount)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">Verbleibend:</span>
                            <span className="font-bold text-lg text-green-400">{formatCurrency(budgets[0].remaining_amount)}</span>
                          </div>
                          <div className="pt-4">
                            <div className="flex justify-between text-sm mb-2">
                              <span className="text-gray-300">Budget-Auslastung</span>
                              <span className="font-medium text-white">{getBudgetProgress().toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-white/20 rounded-full h-3">
                              <div
                                className={`h-3 rounded-full transition-all duration-300 ${
                                  getBudgetStatus().status === 'critical' ? 'bg-red-500' :
                                  getBudgetStatus().status === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                                }`}
                                style={{ width: `${Math.min(getBudgetProgress(), 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Cost Breakdown */}
                      <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-lg rounded-2xl p-6 border border-green-500/30">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 bg-gradient-to-br from-green-400 to-green-600 rounded-xl">
                            <PieChart className="w-6 h-6 text-white" />
                          </div>
                          <h4 className="text-lg font-semibold text-white">Kostenaufschlüsselung</h4>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">Kostenpositionen:</span>
                            <span className="font-bold text-white">{formatCurrency(costPositions.reduce((sum, cp) => sum + cp.amount, 0))}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">Einzelausgaben:</span>
                            <span className="font-bold text-white">{formatCurrency(expenses.reduce((sum, exp) => sum + exp.amount, 0))}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-300">Bezahlt:</span>
                            <span className="font-bold text-green-400">
                              {formatCurrency(costPositions.reduce((sum, cp) => sum + cp.paid_amount, 0))}
                            </span>
                          </div>
                          <div className="pt-3 border-t border-white/20">
                            <div className="flex justify-between items-center font-semibold">
                              <span className="text-white">Gesamtkosten:</span>
                              <span className="text-lg text-white">
                                {formatCurrency(
                                  costPositions.reduce((sum, cp) => sum + cp.amount, 0) +
                                  expenses.reduce((sum, exp) => sum + exp.amount, 0)
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Expense Modal */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Ausgabe hinzufügen</h2>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Titel</label>
                <input
                  type="text"
                  value={expenseForm.title}
                  onChange={(e) => setExpenseForm({...expenseForm, title: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Beschreibung</label>
                <textarea
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Betrag (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kategorie</label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({...expenseForm, category: e.target.value as any})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="other">Sonstiges</option>
                    <option value="material">Material</option>
                    <option value="labor">Arbeitskräfte</option>
                    <option value="equipment">Geräte</option>
                    <option value="services">Dienstleistungen</option>
                    <option value="permits">Genehmigungen</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Datum</label>
                <input
                  type="date"
                  value={expenseForm.date}
                  onChange={(e) => setExpenseForm({...expenseForm, date: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddExpenseModal(false);
                    resetExpenseForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Hinzufügen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Expense Modal */}
      {showEditExpenseModal && editingExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Ausgabe bearbeiten</h2>
            <form onSubmit={handleUpdateExpense} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Titel</label>
                <input
                  type="text"
                  value={expenseForm.title}
                  onChange={(e) => setExpenseForm({...expenseForm, title: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Beschreibung</label>
                <textarea
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Betrag (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kategorie</label>
                  <select
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({...expenseForm, category: e.target.value as any})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="other">Sonstiges</option>
                    <option value="material">Material</option>
                    <option value="labor">Arbeitskräfte</option>
                    <option value="equipment">Geräte</option>
                    <option value="services">Dienstleistungen</option>
                    <option value="permits">Genehmigungen</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Datum</label>
                <input
                  type="date"
                  value={expenseForm.date}
                  onChange={(e) => setExpenseForm({...expenseForm, date: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditExpenseModal(false);
                    setEditingExpense(null);
                    resetExpenseForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Speichern
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Budget Modal */}
      {showBudgetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Budget setzen</h2>
            <form onSubmit={handleUpdateBudget} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gesamtbudget (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={budgetForm.total_budget}
                  onChange={(e) => setBudgetForm({...budgetForm, total_budget: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Währung</label>
                <select
                  value={budgetForm.currency}
                  onChange={(e) => setBudgetForm({...budgetForm, currency: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="EUR">Euro (€)</option>
                  <option value="USD">US Dollar ($)</option>
                  <option value="CHF">Schweizer Franken (CHF)</option>
                </select>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowBudgetModal(false);
                    resetBudgetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                >
                  Speichern
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cost Position Details Modal */}
      {showCostPositionModal && selectedCostPosition && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">Kostenposition Details</h3>
                <button
                  onClick={() => setShowCostPositionModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle size={24} />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Grundinformationen</h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div>
                        <span className="text-sm text-gray-600">Titel:</span>
                        <p className="font-medium">{selectedCostPosition.title}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Beschreibung:</span>
                        <p className="text-sm">{selectedCostPosition.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Kategorie:</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(selectedCostPosition.category)}`}>
                          {getCategoryLabel(selectedCostPosition.category)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Status:</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedCostPosition.status)}`}>
                          {getStatusLabel(selectedCostPosition.status)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Financial Information */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Finanzielle Details</h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Gesamtbetrag:</span>
                        <span className="font-bold text-lg">{formatCurrency(selectedCostPosition.amount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Bezahlt:</span>
                        <span className="font-medium text-green-600">{formatCurrency(selectedCostPosition.paid_amount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Verbleibend:</span>
                        <span className="font-medium text-red-600">
                          {formatCurrency(selectedCostPosition.amount - selectedCostPosition.paid_amount)}
                        </span>
                      </div>
                      {selectedCostPosition.payment_terms && (
                        <div>
                          <span className="text-sm text-gray-600">Zahlungsbedingungen:</span>
                          <p className="text-sm">{selectedCostPosition.payment_terms}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Fortschritt</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Fortschritt</span>
                        <span className="font-medium">{selectedCostPosition.progress_percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${selectedCostPosition.progress_percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contractor Information */}
                <div className="space-y-4">
                  {selectedCostPosition.contractor_name && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Auftragnehmer</h4>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        <div>
                          <span className="text-sm text-gray-600">Firma:</span>
                          <p className="font-medium">{selectedCostPosition.contractor_name}</p>
                        </div>
                        {selectedCostPosition.contractor_contact && (
                          <div>
                            <span className="text-sm text-gray-600">Ansprechpartner:</span>
                            <p className="text-sm">{selectedCostPosition.contractor_contact}</p>
                          </div>
                        )}
                        {selectedCostPosition.contractor_phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-gray-500" />
                            <span className="text-sm">{selectedCostPosition.contractor_phone}</span>
                          </div>
                        )}
                        {selectedCostPosition.contractor_email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-500" />
                            <span className="text-sm">{selectedCostPosition.contractor_email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Cost Breakdown */}
                  {(selectedCostPosition.labor_cost || selectedCostPosition.material_cost || selectedCostPosition.overhead_cost) && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Kostenaufschlüsselung</h4>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        {selectedCostPosition.labor_cost && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Arbeitskosten:</span>
                            <span className="font-medium">{formatCurrency(selectedCostPosition.labor_cost)}</span>
                          </div>
                        )}
                        {selectedCostPosition.material_cost && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Materialkosten:</span>
                            <span className="font-medium">{formatCurrency(selectedCostPosition.material_cost)}</span>
                          </div>
                        )}
                        {selectedCostPosition.overhead_cost && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Gemeinkosten:</span>
                            <span className="font-medium">{formatCurrency(selectedCostPosition.overhead_cost)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* AI Analysis */}
                  {(selectedCostPosition.risk_score || selectedCostPosition.price_deviation || selectedCostPosition.ai_recommendation) && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">KI-Analyse</h4>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        {selectedCostPosition.risk_score && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Risiko-Score:</span>
                            <span className={`font-medium ${getRiskColor(selectedCostPosition.risk_score)}`}>
                              {selectedCostPosition.risk_score}/100
                            </span>
                          </div>
                        )}
                        {selectedCostPosition.price_deviation && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Preisabweichung:</span>
                            <span className={`font-medium ${getPriceDeviationColor(selectedCostPosition.price_deviation)}`}>
                              {selectedCostPosition.price_deviation > 0 ? '+' : ''}{selectedCostPosition.price_deviation.toFixed(1)}%
                            </span>
                          </div>
                        )}
                        {selectedCostPosition.ai_recommendation && (
                          <div>
                            <span className="text-sm text-gray-600">Empfehlung:</span>
                            <p className="text-sm italic mt-1">"{selectedCostPosition.ai_recommendation}"</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Dates */}
                  {(selectedCostPosition.start_date || selectedCostPosition.completion_date) && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Termine</h4>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        {selectedCostPosition.start_date && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">Start:</span>
                            <span className="text-sm font-medium">
                              {new Date(selectedCostPosition.start_date).toLocaleDateString('de-DE')}
                            </span>
                          </div>
                        )}
                        {selectedCostPosition.completion_date && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">Fertigstellung:</span>
                            <span className="text-sm font-medium">
                              {new Date(selectedCostPosition.completion_date).toLocaleDateString('de-DE')}
                            </span>
                          </div>
                        )}
                        {selectedCostPosition.warranty_period && (
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">Gewährleistung:</span>
                            <span className="text-sm font-medium">{selectedCostPosition.warranty_period} Monate</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 