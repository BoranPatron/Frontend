import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Euro,
  TrendingUp,
  TrendingDown,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowLeft,
  PlusCircle,
  RefreshCw,
  Search,
  Filter,
  BarChart3,
  PieChart,
  Calendar,
  DollarSign,
  CreditCard,
  Receipt,
  Calculator,
  Target,
  AlertCircle,
  Eye,
  EyeOff,
  Download,
  Upload,
  Settings,
  MoreHorizontal,
  User,
  FileText,
  Wallet
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ProjectBreadcrumb from '../components/ProjectBreadcrumb';

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

export default function Finance() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<number | null>(null);
  const [selectedProject, setSelectedProject] = useState<number>(1);

  // Form state für Ausgaben
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    description: '',
    amount: '',
    category: 'other' as 'material' | 'labor' | 'equipment' | 'services' | 'permits' | 'other',
    date: new Date().toISOString().split('T')[0]
  });

  // Form state für Budget
  const [budgetForm, setBudgetForm] = useState({
    total_budget: '',
    currency: 'EUR'
  });

  // Mock-Daten für Demo
  useEffect(() => {
    loadFinanceData();
  }, [selectedProject]);

  const loadFinanceData = async () => {
    try {
      setLoading(true);
      // Mock-Daten für Demo
      const mockExpenses: Expense[] = [
        {
          id: 1,
          title: 'Beton für Fundament',
          description: '40m³ Beton C25/30 für das Fundament',
          amount: 2800.00,
          category: 'material',
          project_id: 1,
          date: '2024-01-15',
          created_at: '2024-01-15T10:30:00Z'
        },
        {
          id: 2,
          title: 'Bauantrag',
          description: 'Gebühren für den Bauantrag',
          amount: 450.00,
          category: 'permits',
          project_id: 1,
          date: '2024-01-10',
          created_at: '2024-01-10T14:20:00Z'
        },
        {
          id: 3,
          title: 'Baggerarbeiten',
          description: 'Aushubarbeiten für das Fundament',
          amount: 1200.00,
          category: 'services',
          project_id: 1,
          date: '2024-01-12',
          created_at: '2024-01-12T08:15:00Z'
        }
      ];

      const mockBudget: Budget = {
        id: 1,
        project_id: 1,
        total_budget: 280000.00,
        spent_amount: 4450.00,
        remaining_amount: 275550.00,
        currency: 'EUR',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-15T10:30:00Z'
      };

      setExpenses(mockExpenses);
      setBudget(mockBudget);
      setError('');
    } catch (err: any) {
      setError('Fehler beim Laden der Finanzdaten: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newExpense: Expense = {
        id: Date.now(),
        title: expenseForm.title,
        description: expenseForm.description,
        amount: parseFloat(expenseForm.amount),
        category: expenseForm.category,
        project_id: selectedProject,
        date: expenseForm.date,
        created_at: new Date().toISOString()
      };

      setExpenses([...expenses, newExpense]);
      
      // Update budget
      if (budget) {
        const newSpent = budget.spent_amount + newExpense.amount;
        setBudget({
          ...budget,
          spent_amount: newSpent,
          remaining_amount: budget.total_budget - newSpent,
          updated_at: new Date().toISOString()
        });
      }

      setShowExpenseModal(false);
      resetExpenseForm();
    } catch (err: any) {
      setError('Fehler beim Hinzufügen der Ausgabe: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleUpdateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;
    
    try {
      const updatedExpenses = expenses.map(expense => 
        expense.id === editingExpense.id 
          ? {
              ...expense,
              title: expenseForm.title,
              description: expenseForm.description,
              amount: parseFloat(expenseForm.amount),
              category: expenseForm.category,
              date: expenseForm.date
            }
          : expense
      );

      setExpenses(updatedExpenses);
      
      // Recalculate budget
      if (budget) {
        const totalSpent = updatedExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        setBudget({
          ...budget,
          spent_amount: totalSpent,
          remaining_amount: budget.total_budget - totalSpent,
          updated_at: new Date().toISOString()
        });
      }

      setShowExpenseModal(false);
      setEditingExpense(null);
      resetExpenseForm();
    } catch (err: any) {
      setError('Fehler beim Aktualisieren der Ausgabe: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleDeleteExpense = async (expenseId: number) => {
    try {
      const expenseToDelete = expenses.find(exp => exp.id === expenseId);
      const updatedExpenses = expenses.filter(exp => exp.id !== expenseId);
      setExpenses(updatedExpenses);
      
      // Recalculate budget
      if (budget && expenseToDelete) {
        const newSpent = budget.spent_amount - expenseToDelete.amount;
        setBudget({
          ...budget,
          spent_amount: newSpent,
          remaining_amount: budget.total_budget - newSpent,
          updated_at: new Date().toISOString()
        });
      }

      setDeletingExpense(null);
    } catch (err: any) {
      setError('Fehler beim Löschen der Ausgabe: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleUpdateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newBudget: Budget = {
        id: budget?.id || Date.now(),
        project_id: selectedProject,
        total_budget: parseFloat(budgetForm.total_budget),
        spent_amount: budget?.spent_amount || 0,
        remaining_amount: parseFloat(budgetForm.total_budget) - (budget?.spent_amount || 0),
        currency: budgetForm.currency,
        created_at: budget?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setBudget(newBudget);
      setShowBudgetModal(false);
      resetBudgetForm();
    } catch (err: any) {
      setError('Fehler beim Aktualisieren des Budgets: ' + (err.response?.data?.detail || err.message));
    }
  };

  const resetExpenseForm = () => {
    setExpenseForm({
      title: '',
      description: '',
      amount: '',
      category: 'other',
      date: new Date().toISOString().split('T')[0]
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
      category: expense.category as 'material' | 'labor' | 'equipment' | 'services' | 'permits' | 'other',
      date: expense.date
    });
    setShowExpenseModal(true);
  };

  // Filtere und suche Ausgaben
  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterCategory === 'all' || expense.category === filterCategory;
    
    return matchesSearch && matchesFilter;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'material': return <BarChart3 size={20} />;
      case 'labor': return <User size={20} />;
      case 'equipment': return <Settings size={20} />;
      case 'services': return <Receipt size={20} />;
      case 'permits': return <FileText size={20} />;
      case 'other': return <MoreHorizontal size={20} />;
      default: return <Euro size={20} />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'material': return 'Material';
      case 'labor': return 'Arbeitskräfte';
      case 'equipment': return 'Geräte';
      case 'services': return 'Dienstleistungen';
      case 'permits': return 'Genehmigungen';
      case 'other': return 'Sonstiges';
      default: return category;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'material': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'labor': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'equipment': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'services': return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'permits': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'other': return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getBudgetProgress = () => {
    if (!budget) return 0;
    return (budget.spent_amount / budget.total_budget) * 100;
  };

  const getBudgetStatus = () => {
    if (!budget) return 'neutral';
    const progress = getBudgetProgress();
    if (progress > 90) return 'critical';
    if (progress > 75) return 'warning';
    return 'good';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Lade Finanzdaten...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6">
            <h2 className="text-xl font-bold text-red-800 mb-4">Fehler beim Laden</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Seite neu laden
            </button>
          </div>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Zurück zum Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ProjectBreadcrumb />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Finanzen</h1>
                <p className="text-gray-600">
                  Budgetverwaltung & Ausgabenkontrolle
                  {selectedProject && (
                    <span className="block text-sm text-blue-600 mt-1">
                      Projekt-ID: {selectedProject}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowExpenseModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold"
            >
              <Plus size={20} />
              Ausgabe hinzufügen
            </button>
          </div>
        </header>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 flex items-center justify-between mb-6 rounded-xl">
            <div className="flex items-center gap-3">
              <AlertTriangle size={20} />
              <span>{error}</span>
            </div>
            <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">
              <XCircle size={20} />
            </button>
          </div>
        )}

        {/* Success Banner */}
        {/* {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-4 flex items-center justify-between mb-6 rounded-xl">
            <div className="flex items-center gap-3">
              <CheckCircle size={20} />
              <span>{success}</span>
            </div>
            <button onClick={() => setSuccess('')} className="text-green-500 hover:text-green-700">
              <XCircle size={20} />
            </button>
          </div>
        )} */}

        <div className="max-w-7xl mx-auto">
          {/* Budget Overview */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Budget Übersicht</h2>
              <button
                onClick={() => setShowBudgetModal(true)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              >
                <Edit size={16} className="inline mr-2" />
                Bearbeiten
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-2">Gesamtbudget</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(budget?.total_budget || 0)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-2">Ausgegeben</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(budget?.spent_amount || 0)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-2">Verbleibend</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(budget?.remaining_amount || 0)}</p>
              </div>
            </div>
            
            <div className="mt-6">
              <div className="flex justify-between text-sm text-gray-500 mb-2">
                <span>Budgetauslastung</span>
                <span>{getBudgetProgress()}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${getBudgetStatus()}`}
                  style={{ width: `${getBudgetProgress()}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-red-100 rounded-xl">
                  <Euro size={24} className="text-red-600" />
                </div>
                <span className="text-sm text-gray-500">Gesamt</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">{expenses.length}</h3>
              <p className="text-sm text-gray-500">Ausgaben</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <BarChart3 size={24} className="text-blue-600" />
                </div>
                <span className="text-sm text-gray-500">Durchschnitt</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                {expenses.length > 0 ? formatCurrency(expenses.reduce((sum, exp) => sum + exp.amount, 0) / expenses.length) : '0,00 €'}
              </h3>
              <p className="text-sm text-gray-500">Pro Ausgabe</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-100 rounded-xl">
                  <TrendingUp size={24} className="text-green-600" />
                </div>
                <span className="text-sm text-gray-500">Höchste</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                {expenses.length > 0 ? formatCurrency(Math.max(...expenses.map(exp => exp.amount))) : '0,00 €'}
              </h3>
              <p className="text-sm text-gray-500">Einzelausgabe</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <Calendar size={24} className="text-purple-600" />
                </div>
                <span className="text-sm text-gray-500">Dieser Monat</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                {formatCurrency(expenses.filter(exp => {
                  const expDate = new Date(exp.date);
                  const now = new Date();
                  return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
                }).reduce((sum, exp) => sum + exp.amount, 0))}
              </h3>
              <p className="text-sm text-gray-500">Ausgaben</p>
            </div>
          </div>

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
                <option value="labor">Arbeitskosten</option>
                <option value="equipment">Geräte</option>
                <option value="services">Dienstleistungen</option>
                <option value="permits">Genehmigungen</option>
                <option value="other">Sonstige</option>
              </select>
            </div>
          </div>

          {/* Expenses List */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Ausgaben</h3>
            </div>
            
            <div className="divide-y divide-gray-200">
              {filteredExpenses.map((expense) => (
                <div key={expense.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-gray-100 rounded-xl">
                        {getCategoryIcon(expense.category)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{expense.title}</h4>
                        <p className="text-sm text-gray-500">{expense.description}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-xs text-gray-400">
                            {new Date(expense.date).toLocaleDateString('de-DE')}
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(expense.category)}`}>
                            {getCategoryLabel(expense.category)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-bold text-gray-900">{formatCurrency(expense.amount)}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditExpenseModal(expense)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Edit size={16} className="text-gray-400" />
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} className="text-red-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {filteredExpenses.length === 0 && (
              <div className="text-center py-12">
                <Euro size={48} className="text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Keine Ausgaben gefunden</h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm || filterCategory !== 'all' 
                    ? 'Versuchen Sie andere Suchkriterien oder Filter.'
                    : 'Fügen Sie Ihre erste Ausgabe hinzu, um zu beginnen.'
                  }
                </p>
                {!searchTerm && filterCategory === 'all' && (
                  <button
                    onClick={() => setShowExpenseModal(true)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-300 font-semibold"
                  >
                    Erste Ausgabe hinzufügen
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#3d4952] rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                {editingExpense ? 'Ausgabe bearbeiten' : 'Neue Ausgabe hinzufügen'}
              </h2>
              <button
                onClick={() => {
                  setShowExpenseModal(false);
                  setEditingExpense(null);
                  resetExpenseForm();
                }}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <XCircle size={24} className="text-gray-400" />
              </button>
            </div>
            
            <form onSubmit={editingExpense ? handleUpdateExpense : handleAddExpense} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Titel *</label>
                  <input
                    type="text"
                    required
                    value={expenseForm.title}
                    onChange={(e) => setExpenseForm({...expenseForm, title: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                    placeholder="z.B. Beton für Fundament"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Kategorie *</label>
                  <select
                    required
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({...expenseForm, category: e.target.value as any})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                  >
                    <option value="material">Material</option>
                    <option value="labor">Arbeitskräfte</option>
                    <option value="equipment">Geräte</option>
                    <option value="services">Dienstleistungen</option>
                    <option value="permits">Genehmigungen</option>
                    <option value="other">Sonstiges</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Beschreibung</label>
                <textarea
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                  placeholder="Beschreiben Sie die Ausgabe..."
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Betrag (€) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Datum *</label>
                  <input
                    type="date"
                    required
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm({...expenseForm, date: e.target.value})}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="flex gap-4 pt-6">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-[#3d4952] font-bold py-3 rounded-xl hover:from-[#ffa726] hover:to-[#ff9800] transition-all duration-300 transform hover:scale-105"
                >
                  {editingExpense ? 'Änderungen speichern' : 'Ausgabe hinzufügen'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowExpenseModal(false);
                    setEditingExpense(null);
                    resetExpenseForm();
                  }}
                  className="flex-1 bg-white/10 text-white font-bold py-3 rounded-xl hover:bg-white/20 transition-all duration-300"
                >
                  Abbrechen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Budget Modal */}
      {showBudgetModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#3d4952] rounded-2xl p-8 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Budget bearbeiten</h2>
              <button
                onClick={() => {
                  setShowBudgetModal(false);
                  resetBudgetForm();
                }}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <XCircle size={24} className="text-gray-400" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateBudget} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Gesamtbudget (€) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={budgetForm.total_budget}
                  onChange={(e) => setBudgetForm({...budgetForm, total_budget: e.target.value})}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                  placeholder="280000.00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Währung</label>
                <select
                  value={budgetForm.currency}
                  onChange={(e) => setBudgetForm({...budgetForm, currency: e.target.value})}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent"
                >
                  <option value="EUR">EUR (€)</option>
                  <option value="USD">USD ($)</option>
                  <option value="CHF">CHF (CHF)</option>
                </select>
              </div>
              
              <div className="flex gap-4 pt-6">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-[#3d4952] font-bold py-3 rounded-xl hover:from-[#ffa726] hover:to-[#ff9800] transition-all duration-300 transform hover:scale-105"
                >
                  Budget speichern
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowBudgetModal(false);
                    resetBudgetForm();
                  }}
                  className="flex-1 bg-white/10 text-white font-bold py-3 rounded-xl hover:bg-white/20 transition-all duration-300"
                >
                  Abbrechen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingExpense && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#3d4952] rounded-2xl p-8 w-full max-w-md">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 size={32} className="text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Ausgabe löschen</h3>
              <p className="text-gray-400 mb-6">
                Sind Sie sicher, dass Sie diese Ausgabe löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => handleDeleteExpense(deletingExpense)}
                  className="flex-1 bg-red-500 text-white font-bold py-3 rounded-xl hover:bg-red-600 transition-all duration-300"
                >
                  Löschen
                </button>
                <button
                  onClick={() => setDeletingExpense(null)}
                  className="flex-1 bg-white/10 text-white font-bold py-3 rounded-xl hover:bg-white/20 transition-all duration-300"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 