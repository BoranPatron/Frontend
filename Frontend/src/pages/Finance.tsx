import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProjects } from '../api/projectService';
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
  Wallet
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
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

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

  const loadFinanceData = async () => {
    if (selectedProject === 'all') return;
    
    setLoading(true);
    try {
      // Mock data - in einer echten App würden hier API-Calls stehen
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

      const mockBudget: Budget = {
        id: 1,
        project_id: parseInt(selectedProject),
        total_budget: 50000.00,
        spent_amount: 4750.00,
        remaining_amount: 45250.00,
        currency: 'EUR',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-20T14:30:00Z'
      };

      setExpenses(mockExpenses);
      setBudgets([mockBudget]);
    } catch (err: any) {
      console.error('Error loading finance data:', err);
      setError('Fehler beim Laden der Finanzdaten');
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

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || expense.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'material': return <Building size={20} className="text-blue-600" />;
      case 'labor': return <Wrench size={20} className="text-green-600" />;
      case 'equipment': return <Truck size={20} className="text-purple-600" />;
      case 'services': return <FileText size={20} className="text-orange-600" />;
      case 'permits': return <Shield size={20} className="text-red-600" />;
      default: return <Receipt size={20} className="text-gray-600" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'material': return 'Material';
      case 'labor': return 'Arbeitskräfte';
      case 'equipment': return 'Geräte';
      case 'services': return 'Dienstleistungen';
      case 'permits': return 'Genehmigungen';
      default: return 'Sonstiges';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'material': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'labor': return 'bg-green-100 text-green-800 border-green-200';
      case 'equipment': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'services': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'permits': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
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
    return (budget.spent_amount / budget.total_budget) * 100;
  };

  const getBudgetStatus = () => {
    const progress = getBudgetProgress();
    if (progress < 50) return 'success';
    if (progress < 80) return 'warning';
    return 'danger';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#51646f] via-[#3d4952] to-[#2c3539]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#ffbd59]"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#51646f] via-[#3d4952] to-[#2c3539]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <ProjectBreadcrumb />
          <div className="flex items-center justify-between mt-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Finanzen</h1>
              <p className="text-gray-600">Verwalten Sie Budgets und Ausgaben für Ihre Projekte</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowBudgetModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl"
              >
                <Target size={20} />
                Budget setzen
              </button>
              <button
                onClick={() => setShowAddExpenseModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
              >
                <Plus size={20} />
                Ausgabe hinzufügen
              </button>
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 flex items-center justify-between mb-6 rounded-xl">
            <div className="flex items-center gap-3">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
            <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">
              <XCircle size={20} />
            </button>
          </div>
        )}

        {/* Success Banner */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-4 flex items-center justify-between mb-6 rounded-xl">
            <div className="flex items-center gap-3">
              <CheckCircle size={20} />
              <span>{success}</span>
            </div>
            <button onClick={() => setSuccess('')} className="text-green-500 hover:text-green-700">
              <XCircle size={20} />
            </button>
          </div>
        )}

        {/* Project Selector */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-8">
          <div className="flex items-center gap-4">
            <Building size={20} className="text-gray-500" />
            <label className="text-sm font-medium text-gray-700">Projekt auswählen:</label>
            <select
              value={selectedProject}
              onChange={(e) => handleProjectChange(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Alle Projekte</option>
              {projects.map(project => (
                <option key={project.id} value={project.id.toString()}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Budget Overview */}
        {budgets.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="group relative bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20 hover:border-[#ffbd59]/30 transition-all duration-500 transform hover:-translate-y-1 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-[#ffbd59]/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
                    <div className="relative w-12 h-12 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-2xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-500 transform group-hover:scale-110">
                      <Wallet size={24} className="text-white drop-shadow-lg" />
                    </div>
                  </div>
                  <span className="text-sm text-gray-400">Gesamtbudget</span>
                </div>
                <h3 className="text-3xl font-bold text-white mb-1 group-hover:text-[#ffbd59] transition-all duration-300">
                  {formatCurrency(budgets[0].total_budget)}
                </h3>
                <p className="text-sm text-gray-300">Verfügbares Budget</p>
              </div>
            </div>

            <div className="group relative bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20 hover:border-[#ffbd59]/30 transition-all duration-500 transform hover:-translate-y-1 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-[#ffbd59]/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
                    <div className="relative w-12 h-12 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-2xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-500 transform group-hover:scale-110">
                      <TrendingDown size={24} className="text-white drop-shadow-lg" />
                    </div>
                  </div>
                  <span className="text-sm text-gray-400">Ausgegeben</span>
                </div>
                <h3 className="text-3xl font-bold text-white mb-1 group-hover:text-[#ffbd59] transition-all duration-300">
                  {formatCurrency(budgets[0].spent_amount)}
                </h3>
                <p className="text-sm text-gray-300">Bereits verbraucht</p>
              </div>
            </div>

            <div className="group relative bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20 hover:border-[#ffbd59]/30 transition-all duration-500 transform hover:-translate-y-1 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-[#ffbd59]/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
                    <div className="relative w-12 h-12 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-2xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-500 transform group-hover:scale-110">
                      <TrendingUp size={24} className="text-white drop-shadow-lg" />
                    </div>
                  </div>
                  <span className="text-sm text-gray-400">Verbleibend</span>
                </div>
                <h3 className="text-3xl font-bold text-white mb-1 group-hover:text-[#ffbd59] transition-all duration-300">
                  {formatCurrency(budgets[0].remaining_amount)}
                </h3>
                <p className="text-sm text-gray-300">Noch verfügbar</p>
              </div>
            </div>

            <div className="group relative bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20 hover:border-[#ffbd59]/30 transition-all duration-500 transform hover:-translate-y-1 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-[#ffbd59]/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
                    <div className="relative w-12 h-12 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-2xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-500 transform group-hover:scale-110">
                      <BarChart3 size={24} className="text-white drop-shadow-lg" />
                    </div>
                  </div>
                  <span className="text-sm text-gray-400">Ausgaben</span>
                </div>
                <h3 className="text-3xl font-bold text-white mb-1 group-hover:text-[#ffbd59] transition-all duration-300">{expenses.length}</h3>
                <p className="text-sm text-gray-300">Anzahl Ausgaben</p>
              </div>
            </div>
          </div>
        )}

        {/* Budget Progress */}
        {budgets.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Budget-Auslastung</h3>
              <span className="text-sm text-gray-500">{getBudgetProgress().toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-300 ${
                  getBudgetStatus() === 'success' ? 'bg-green-500' :
                  getBudgetStatus() === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(getBudgetProgress(), 100)}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Ausgaben durchsuchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="pl-10 pr-8 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer shadow-sm"
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

        {/* Expenses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExpenses.map((expense) => (
            <div key={expense.id} className="group relative bg-white/10 backdrop-blur-lg rounded-3xl p-6 cursor-pointer transition-all duration-500 hover:bg-white/15 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:ring-opacity-50 border border-white/20 hover:border-[#ffbd59]/30 transform hover:-translate-y-2 hover:scale-105">
              {/* Animated Background Glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#ffbd59]/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
                    <div className="relative w-16 h-16 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-2xl flex items-center justify-center shadow-xl group-hover:shadow-2xl transition-all duration-500 transform group-hover:scale-110 group-hover:rotate-3">
                      <div className="text-white drop-shadow-lg">
                        {getCategoryIcon(expense.category)}
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg group-hover:text-[#ffbd59] transition-all duration-300">
                      {expense.title}
                    </h3>
                    <p className="text-sm text-gray-300 group-hover:text-gray-200 transition-colors">{expense.description}</p>
                  </div>
                </div>
                
                {/* Actions Menu */}
                <div className="relative">
                  <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <MoreHorizontal size={16} className="text-gray-300" />
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-48 bg-[#3d4952] rounded-xl shadow-lg border border-white/20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-10">
                    <button
                      onClick={() => openEditExpenseModal(expense)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/10 transition-colors rounded-t-xl text-white"
                    >
                      <Edit size={16} />
                      <span>Bearbeiten</span>
                    </button>
                    <button
                      onClick={() => handleDeleteExpense(expense.id)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-red-500/20 text-red-300 transition-colors rounded-b-xl"
                    >
                      <Trash2 size={16} />
                      <span>Löschen</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Expense Details */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Kategorie</span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-white shadow-lg">
                    {getCategoryLabel(expense.category)}
                  </span>
                </div>
                
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Calendar size={14} className="text-[#ffbd59]" />
                    <span className="text-gray-400">Datum:</span>
                    <span className="text-white ml-1">
                      {new Date(expense.date).toLocaleDateString('de-DE')}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <DollarSign size={14} className="text-[#ffbd59]" />
                    <span className="text-gray-400">Betrag:</span>
                    <span className="text-[#ffbd59] font-bold ml-1">
                      {formatCurrency(expense.amount)}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Hover Effect Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#ffbd59]/0 to-[#ffbd59]/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredExpenses.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 max-w-md mx-auto">
              <Receipt size={48} className="text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Keine Ausgaben gefunden</h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || filterCategory !== 'all' 
                  ? 'Versuchen Sie andere Suchkriterien oder Filter.'
                  : 'Fügen Sie Ihre erste Ausgabe hinzu, um zu beginnen.'
                }
              </p>
              {!searchTerm && filterCategory === 'all' && (
                <button
                  onClick={() => setShowAddExpenseModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
                >
                  <Plus size={20} />
                  Ausgabe hinzufügen
                </button>
              )}
            </div>
          </div>
        )}

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
      </div>
    </div>
  );
} 