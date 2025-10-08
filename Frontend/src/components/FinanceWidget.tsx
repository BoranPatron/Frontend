import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { costPositionService } from '../api/costPositionService';
import { expenseService } from '../api/expenseService';
import { 
  DollarSign, 
  Plus, 
  Receipt,
  CreditCard,
  Target,
  Wallet,
  Edit,
  Trash2,
  XCircle,
  CheckCircle,
  AlertTriangle,
  Truck,
  Wrench,
  FileText,
  Shield,
  Building
} from 'lucide-react';

// CSS Animation für fadeInUp
const fadeInUpStyle = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

// Inject CSS
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = fadeInUpStyle;
  document.head.appendChild(styleSheet);
}

interface Expense {
  id: number;
  title: string;
  description?: string;
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
  milestone_title?: string;
  service_provider_name?: string;
  created_at: string;
  updated_at: string;
}

interface FinanceWidgetProps {
  projectId: number;
}

export default function FinanceWidget({ projectId }: FinanceWidgetProps) {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [costPositions, setCostPositions] = useState<CostPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showEditExpenseModal, setShowEditExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Form state
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    description: '',
    amount: '',
    category: 'other' as 'material' | 'labor' | 'equipment' | 'services' | 'permits' | 'other',
    date: '',
    receipt_url: ''
  });

  useEffect(() => {
    if (projectId) {
      loadFinanceData();
    }
  }, [projectId]);

  const loadFinanceData = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Lade Ausgaben
      try {
        const expensesData = await expenseService.getExpenses(projectId);
        setExpenses(expensesData);
      } catch (error: any) {
        console.error('❌ Fehler beim Laden der Ausgaben:', error);
        setExpenses([]);
      }

      // Lade Kostenpositionen
      try {
        const costPositionsData = await costPositionService.getCostPositions(projectId);
        console.log(`✅ FinanceWidget: ${costPositionsData.length} Kostenpositionen geladen`);
        setCostPositions(costPositionsData);
      } catch (error: any) {
        console.error('❌ Fehler beim Laden der Kostenpositionen:', error);
        setCostPositions([]);
      }

    } catch (error: any) {
      console.error('💥 Allgemeiner Fehler beim Laden der Finanzdaten:', error);
      setError('Fehler beim Laden der Finanzdaten');
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.title || !expenseForm.amount) return;

    try {
      const newExpense = await expenseService.createExpense({
        title: expenseForm.title,
        description: expenseForm.description || undefined,
        amount: parseFloat(expenseForm.amount),
        category: expenseForm.category,
        project_id: projectId,
        date: expenseForm.date || new Date().toISOString().split('T')[0],
        receipt_url: expenseForm.receipt_url || undefined
      });

      setExpenses(prev => [newExpense, ...prev]);
      setSuccess('Ausgabe erfolgreich hinzugefügt');
      setShowAddExpenseModal(false);
      resetExpenseForm();
    } catch (err: any) {
      console.error('Error adding expense:', err);
      setError(err.message || 'Fehler beim Hinzufügen der Ausgabe');
    }
  };

  const handleUpdateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;

    try {
      const updatedExpense = await expenseService.updateExpense(editingExpense.id, {
        title: expenseForm.title,
        description: expenseForm.description || undefined,
        amount: parseFloat(expenseForm.amount),
        category: expenseForm.category,
        date: expenseForm.date,
        receipt_url: expenseForm.receipt_url || undefined
      });

      setExpenses(prev => prev.map(exp => exp.id === editingExpense.id ? updatedExpense : exp));
      setSuccess('Ausgabe erfolgreich aktualisiert');
      setShowEditExpenseModal(false);
      setEditingExpense(null);
      resetExpenseForm();
    } catch (err: any) {
      console.error('Error updating expense:', err);
      setError(err.message || 'Fehler beim Aktualisieren der Ausgabe');
    }
  };

  const handleDeleteExpense = async (expenseId: number) => {
    if (!confirm('Sind Sie sicher, dass Sie diese Ausgabe löschen möchten?')) return;

    try {
      await expenseService.deleteExpense(expenseId);
      setExpenses(prev => prev.filter(exp => exp.id !== expenseId));
      setSuccess('Ausgabe erfolgreich gelöscht');
    } catch (err: any) {
      console.error('Error deleting expense:', err);
      setError(err.message || 'Fehler beim Löschen der Ausgabe');
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

  const openEditExpenseModal = (expense: Expense) => {
    setEditingExpense(expense);
    setExpenseForm({
      title: expense.title,
      description: expense.description || '',
      amount: expense.amount.toString(),
      category: expense.category,
      date: expense.date,
      receipt_url: expense.receipt_url || ''
    });
    setShowEditExpenseModal(true);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#ffbd59]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="w-3 h-3 bg-[#ffbd59] rounded-full"></div>
        <span className="text-lg font-semibold text-white">Finanzen</span>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 flex items-center justify-between rounded-xl">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} />
            <span className="text-sm">{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-red-300 hover:text-red-100">
            <XCircle size={16} />
          </button>
        </div>
      )}

      {/* Success Banner */}
      {success && (
        <div className="bg-green-500/20 border border-green-500/30 text-green-300 px-4 py-3 flex items-center justify-between rounded-xl">
          <div className="flex items-center gap-2">
            <CheckCircle size={16} />
            <span className="text-sm">{success}</span>
          </div>
          <button onClick={() => setSuccess('')} className="text-green-300 hover:text-green-100">
            <XCircle size={16} />
          </button>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg">
              <CreditCard size={20} className="text-white" />
            </div>
            <span className="text-xs text-gray-400">Kostenpositionen</span>
          </div>
          <h3 className="text-xl font-bold text-white mb-1">{costPositions.length}</h3>
          <p className="text-xs text-gray-400">Aus akzeptierten Angeboten</p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-gradient-to-br from-green-400 to-green-600 rounded-lg">
              <Receipt size={20} className="text-white" />
            </div>
            <span className="text-xs text-gray-400">Ausgaben</span>
          </div>
          <h3 className="text-xl font-bold text-white mb-1">{expenses.length}</h3>
          <p className="text-xs text-gray-400">Manuell erfasst</p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg">
              <Target size={20} className="text-white" />
            </div>
            <span className="text-xs text-gray-400">Gesamtkosten</span>
          </div>
          <h3 className="text-xl font-bold text-white mb-1">
            {formatCurrency(
              costPositions.reduce((sum, cp) => sum + cp.amount, 0) + 
              expenses.reduce((sum, exp) => sum + exp.amount, 0)
            )}
          </h3>
          <p className="text-xs text-gray-400">Kostenpositionen + Ausgaben</p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg">
              <Wallet size={20} className="text-white" />
            </div>
            <span className="text-xs text-gray-400">Bezahlt</span>
          </div>
          <h3 className="text-xl font-bold text-white mb-1">
            {formatCurrency(costPositions.reduce((sum, cp) => sum + cp.paid_amount, 0))}
          </h3>
          <p className="text-xs text-gray-400">Bereits bezahlt</p>
        </div>
      </div>

      {/* Kostenpositionen */}
      <div className="bg-gradient-to-br from-white/10 via-white/5 to-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl shadow-[#ffbd59]/10">
        <div className="p-6 border-b border-white/20 bg-gradient-to-r from-white/5 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/30">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                  Kostenpositionen
                </h3>
                <p className="text-sm text-gray-300 mt-1">Echte Kostenpositionen aus angenommenen Angeboten</p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-xl border border-blue-500/30 backdrop-blur-sm">
              <span className="text-sm text-gray-300">Gesamt:</span>
              <span className="font-bold text-white text-lg">
                {formatCurrency(costPositions.reduce((sum, cp) => sum + cp.amount, 0))}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6">
          {costPositions.length === 0 ? (
            <div className="text-center py-12">
              <div className="relative">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-blue-500/30 shadow-lg shadow-blue-500/20">
                  <CreditCard className="w-10 h-10 text-blue-400" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full animate-pulse"></div>
              </div>
              <h4 className="text-xl font-bold text-white mb-3 bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                Keine Kostenpositionen verfügbar
              </h4>
              <p className="text-gray-400 text-sm max-w-md mx-auto leading-relaxed">
                Akzeptieren Sie Angebote, um hier automatisch Kostenpositionen zu sehen.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {costPositions.map((cp, index) => (
                <div 
                  key={cp.id} 
                  className="group relative bg-gradient-to-br from-white/10 via-white/5 to-white/10 backdrop-blur-xl rounded-lg p-3 border border-white/20 hover:border-blue-500/40 transition-all duration-500 transform hover:scale-[1.005] hover:shadow-lg hover:shadow-blue-500/20"
                  style={{
                    animationDelay: `${index * 100}ms`,
                    animation: 'fadeInUp 0.6s ease-out forwards'
                  }}
                >
                  {/* Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-blue-600/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  {/* Content */}
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <div className="p-1.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-md shadow-md shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-all duration-300">
                            <CreditCard className="w-3 h-3 text-white" />
                          </div>
                          <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full border border-white/20 animate-pulse"></div>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-white text-xs group-hover:text-blue-400 transition-colors duration-300 mb-0.5">
                            {cp.title || 'Kostenposition'}
                          </h4>
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className={`px-1.5 py-0.5 text-xs font-medium rounded-full backdrop-blur-sm border ${
                              cp.category === 'painting' ? 'bg-purple-500/20 text-purple-300 border-purple-400/30' :
                              cp.category === 'electrical' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30' :
                              cp.category === 'plumbing' ? 'bg-blue-500/20 text-blue-300 border-blue-400/30' :
                              cp.category === 'heating' ? 'bg-red-500/20 text-red-300 border-red-400/30' :
                              cp.category === 'roofing' ? 'bg-gray-500/20 text-gray-300 border-gray-400/30' :
                              cp.category === 'flooring' ? 'bg-green-500/20 text-green-300 border-green-400/30' :
                              'bg-gray-500/20 text-gray-300 border-gray-400/30'
                            }`}>
                              {cp.category === 'painting' ? '🎨 Maler' :
                               cp.category === 'electrical' ? '⚡ Elektro' :
                               cp.category === 'plumbing' ? '🚿 Sanitär' :
                               cp.category === 'heating' ? '🔥 Heizung' :
                               cp.category === 'roofing' ? '🏠 Dach' :
                               cp.category === 'flooring' ? '🏗️ Boden' :
                               '📋 Sonstige'}
                            </span>
                            <div className="flex items-center gap-1 text-xs text-gray-400">
                              <div className="w-0.5 h-0.5 bg-gray-400 rounded-full"></div>
                              <span>{cp.created_at ? new Date(cp.created_at).toLocaleDateString('de-DE') : '–'}</span>
                            </div>
                          </div>
                          {cp.service_provider_name || cp.contractor_name ? (
                            <div className="flex items-center gap-1 text-xs text-gray-300">
                              <div className="w-1 h-1 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full"></div>
                              <span className="font-medium">{cp.service_provider_name || cp.contractor_name}</span>
                            </div>
                          ) : null}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-white text-sm group-hover:text-blue-400 transition-colors duration-300">
                          {formatCurrency(cp.amount)}
                        </div>
                        <div className="text-xs text-gray-400">
                          {cp.paid_amount > 0 ? `Bezahlt: ${formatCurrency(cp.paid_amount)}` : 'Offen'}
                        </div>
                        {cp.progress_percentage > 0 && (
                          <div className="mt-0.5">
                            <div className="flex items-center justify-between text-xs text-gray-400 mb-0.5">
                              <span>Fortschritt</span>
                              <span>{cp.progress_percentage}%</span>
                            </div>
                            <div className="w-16 h-0.5 bg-gray-700 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                                style={{ width: `${cp.progress_percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {cp.description && (
                      <p className="text-gray-300 text-xs mb-2 leading-relaxed bg-white/5 rounded-md p-1.5 backdrop-blur-sm border border-white/10 line-clamp-1">
                        {cp.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between pt-1.5 border-t border-white/10">
                      <div className="flex items-center gap-1.5">
                        {cp.milestone_title && (
                          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-gradient-to-r from-[#ffbd59]/20 to-[#ffa726]/20 rounded-md border border-[#ffbd59]/30 backdrop-blur-sm">
                            <div className="w-1 h-1 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] rounded-full"></div>
                            <span className="text-xs text-[#ffbd59] font-medium">{cp.milestone_title}</span>
                          </div>
                        )}
                        {cp.payment_terms && (
                          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-md border border-green-500/30 backdrop-blur-sm">
                            <div className="w-1 h-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
                            <span className="text-xs text-green-400 font-medium">{cp.payment_terms}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <div className="w-1 h-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full animate-pulse"></div>
                        <span>#{cp.id}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Ausgaben */}
      <div className="bg-gradient-to-br from-white/10 via-white/5 to-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl shadow-[#ffbd59]/10">
        <div className="p-6 border-b border-white/20 bg-gradient-to-r from-white/5 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-xl shadow-lg shadow-[#ffbd59]/30">
                <Receipt className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                  Ausgaben
                </h3>
                <p className="text-sm text-gray-300 mt-1">Manuell erfasste Ausgaben</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-[#ffbd59]/20 to-[#ffa726]/20 rounded-xl border border-[#ffbd59]/30 backdrop-blur-sm">
                <span className="text-sm text-gray-300">Gesamt:</span>
                <span className="font-bold text-white text-lg">
                  {formatCurrency(expenses.reduce((sum, exp) => sum + exp.amount, 0))}
                </span>
              </div>
              <button
                onClick={() => setShowAddExpenseModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-[#3d4952] rounded-xl hover:from-[#ffa726] hover:to-[#ff9800] transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold"
              >
                <Plus size={18} />
                Ausgabe hinzufügen
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {expenses.length === 0 ? (
            <div className="text-center py-12">
              <div className="relative">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-[#ffbd59]/20 to-[#ffa726]/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-[#ffbd59]/30 shadow-lg shadow-[#ffbd59]/20">
                  <Receipt className="w-10 h-10 text-[#ffbd59]" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-full animate-pulse"></div>
              </div>
              <h4 className="text-xl font-bold text-white mb-3 bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                Keine Ausgaben erfasst
              </h4>
              <p className="text-gray-400 text-sm max-w-md mx-auto leading-relaxed">
                Fügen Sie Ihre erste Ausgabe hinzu, um den Überblick über Ihre Projektkosten zu behalten.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {expenses.slice(0, 6).map((expense, index) => (
                <div 
                  key={expense.id} 
                  className="group relative bg-gradient-to-br from-white/10 via-white/5 to-white/10 backdrop-blur-xl rounded-lg p-3 border border-white/20 hover:border-[#ffbd59]/40 transition-all duration-500 transform hover:scale-[1.005] hover:shadow-lg hover:shadow-[#ffbd59]/20"
                  style={{
                    animationDelay: `${index * 100}ms`,
                    animation: 'fadeInUp 0.6s ease-out forwards'
                  }}
                >
                  {/* Content */}
                  <div className="relative z-20">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <div className="p-1.5 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-md shadow-md shadow-[#ffbd59]/30 group-hover:shadow-[#ffbd59]/50 transition-all duration-300">
                            {getCategoryIcon(expense.category)}
                          </div>
                          <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full border border-white/20 animate-pulse"></div>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-white text-xs group-hover:text-[#ffbd59] transition-colors duration-300 mb-0.5">
                            {expense.title}
                          </h4>
                          <div className="flex items-center gap-1.5">
                            <span className={`px-1.5 py-0.5 text-xs font-medium rounded-full backdrop-blur-sm border ${
                              expense.category === 'material' ? 'bg-blue-500/20 text-blue-300 border-blue-400/30' :
                              expense.category === 'labor' ? 'bg-green-500/20 text-green-300 border-green-400/30' :
                              expense.category === 'equipment' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30' :
                              expense.category === 'services' ? 'bg-purple-500/20 text-purple-300 border-purple-400/30' :
                              expense.category === 'permits' ? 'bg-red-500/20 text-red-300 border-red-400/30' :
                              'bg-gray-500/20 text-gray-300 border-gray-400/30'
                            }`}>
                              {getCategoryLabel(expense.category)}
                            </span>
                            <div className="flex items-center gap-1 text-xs text-gray-400">
                              <div className="w-0.5 h-0.5 bg-gray-400 rounded-full"></div>
                              <span>{new Date(expense.date).toLocaleDateString('de-DE')}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-white text-sm group-hover:text-[#ffbd59] transition-colors duration-300">
                          {formatCurrency(expense.amount)}
                        </div>
                        <div className="text-xs text-gray-400">
                          {expense.category === 'material' ? 'Material' :
                           expense.category === 'labor' ? 'Arbeit' :
                           expense.category === 'equipment' ? 'Gerät' :
                           expense.category === 'services' ? 'Service' :
                           expense.category === 'permits' ? 'Genehm.' :
                           'Sonstiges'}
                        </div>
                      </div>
                    </div>
                    
                    {expense.description && (
                      <p className="text-gray-300 text-xs mb-3 leading-relaxed bg-white/5 rounded-md p-1.5 backdrop-blur-sm border border-white/10 line-clamp-1">
                        {expense.description}
                      </p>
                    )}
                    
                    {/* Action Buttons - Im normalen Flow */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/10">
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <div className="w-1 h-1 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] rounded-full animate-pulse"></div>
                        <span>#{expense.id}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            console.log('Edit button clicked for expense:', expense.id);
                            openEditExpenseModal(expense);
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-white rounded-lg hover:from-[#ffa726] hover:to-[#ff9800] transition-all duration-300 transform hover:scale-105 shadow-lg font-medium text-xs"
                        >
                          <Edit className="w-3 h-3" />
                          Bearbeiten
                        </button>
                        <button
                          onClick={() => {
                            console.log('Delete button clicked for expense:', expense.id);
                            handleDeleteExpense(expense.id);
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-300 transform hover:scale-105 shadow-lg font-medium text-xs"
                        >
                          <Trash2 className="w-3 h-3" />
                          Löschen
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {expenses.length > 6 && (
            <div className="mt-6 text-center">
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-[#ffbd59]/10 to-[#ffa726]/10 rounded-xl border border-[#ffbd59]/30 backdrop-blur-sm hover:from-[#ffbd59]/20 hover:to-[#ffa726]/20 transition-all duration-300 cursor-pointer group">
                <div className="w-2 h-2 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                  {expenses.length - 6} weitere Ausgaben verfügbar
                </span>
                <span className="text-[#ffbd59] font-semibold group-hover:text-[#ffa726] transition-colors">
                  Alle anzeigen →
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Expense Modal */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-[#2c3539] to-[#3d4952] rounded-2xl shadow-2xl max-w-md w-full border border-white/20">
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-4">Ausgabe hinzufügen</h2>
              <form onSubmit={handleAddExpense} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Titel</label>
                  <input
                    type="text"
                    value={expenseForm.title}
                    onChange={(e) => setExpenseForm({...expenseForm, title: e.target.value})}
                    className="w-full px-3 py-2 bg-[#1a1a2e]/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] text-white placeholder-gray-400"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Beschreibung</label>
                  <textarea
                    value={expenseForm.description}
                    onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                    className="w-full px-3 py-2 bg-[#1a1a2e]/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] text-white placeholder-gray-400"
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">Betrag (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={expenseForm.amount}
                      onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                      className="w-full px-3 py-2 bg-[#1a1a2e]/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] text-white placeholder-gray-400"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">Kategorie</label>
                    <select
                      value={expenseForm.category}
                      onChange={(e) => setExpenseForm({...expenseForm, category: e.target.value as any})}
                      className="w-full px-3 py-2 bg-[#1a1a2e]/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] text-white"
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
                  <label className="block text-sm font-medium text-gray-200 mb-2">Datum</label>
                  <input
                    type="date"
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm({...expenseForm, date: e.target.value})}
                    className="w-full px-3 py-2 bg-[#1a1a2e]/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] text-white"
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddExpenseModal(false);
                      resetExpenseForm();
                    }}
                    className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-[#ffbd59] text-[#3d4952] rounded-lg hover:bg-[#ffa726] transition-colors font-semibold"
                  >
                    Hinzufügen
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Expense Modal */}
      {showEditExpenseModal && editingExpense && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-[#2c3539] to-[#3d4952] rounded-2xl shadow-2xl max-w-md w-full border border-white/20">
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-4">Ausgabe bearbeiten</h2>
              <form onSubmit={handleUpdateExpense} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Titel</label>
                  <input
                    type="text"
                    value={expenseForm.title}
                    onChange={(e) => setExpenseForm({...expenseForm, title: e.target.value})}
                    className="w-full px-3 py-2 bg-[#1a1a2e]/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] text-white placeholder-gray-400"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">Beschreibung</label>
                  <textarea
                    value={expenseForm.description}
                    onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                    className="w-full px-3 py-2 bg-[#1a1a2e]/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] text-white placeholder-gray-400"
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">Betrag (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={expenseForm.amount}
                      onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                      className="w-full px-3 py-2 bg-[#1a1a2e]/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] text-white placeholder-gray-400"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">Kategorie</label>
                    <select
                      value={expenseForm.category}
                      onChange={(e) => setExpenseForm({...expenseForm, category: e.target.value as any})}
                      className="w-full px-3 py-2 bg-[#1a1a2e]/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] text-white"
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
                  <label className="block text-sm font-medium text-gray-200 mb-2">Datum</label>
                  <input
                    type="date"
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm({...expenseForm, date: e.target.value})}
                    className="w-full px-3 py-2 bg-[#1a1a2e]/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] text-white"
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
                    className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-[#ffbd59] text-[#3d4952] rounded-lg hover:bg-[#ffa726] transition-colors font-semibold"
                  >
                    Speichern
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}










