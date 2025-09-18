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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-[#ffbd59] rounded-full"></div>
          <span className="text-lg font-semibold text-white">Finanzen</span>
        </div>
        <button
          onClick={() => setShowAddExpenseModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-[#3d4952] rounded-xl hover:from-[#ffa726] hover:to-[#ff9800] transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold"
        >
          <Plus size={18} />
          Ausgabe hinzufügen
        </button>
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
      <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20">
        <div className="p-4 border-b border-white/20">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Kostenpositionen</h3>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Gesamt:</span>
                <span className="font-semibold text-white">
                  {formatCurrency(costPositions.reduce((sum, cp) => sum + cp.amount, 0))}
                </span>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-400 mt-1">Automatisch erstellt aus akzeptierten Angeboten</p>
        </div>

        <div className="p-4">
          {costPositions.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <h4 className="text-base font-medium text-white mb-2">Keine Kostenpositionen</h4>
              <p className="text-gray-400 text-sm">Akzeptieren Sie Angebote, um hier Kostenpositionen zu sehen.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left text-white/90">
                <thead className="bg-gradient-to-r from-[#1f2a33] to-[#2c3539] text-xs uppercase border border-white/10">
                  <tr>
                    <th className="px-3 py-2 text-[#ffbd59]">Erstellt</th>
                    <th className="px-3 py-2 text-[#ffbd59]">Ausschreibung</th>
                    <th className="px-3 py-2 text-[#ffbd59]">Dienstleister</th>
                    <th className="px-3 py-2 text-right text-[#ffbd59]">Betrag</th>
                  </tr>
                </thead>
                <tbody>
                  {costPositions.map((cp) => (
                    <tr key={cp.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                      <td className="px-3 py-2 text-gray-300 text-xs">
                        {cp.created_at ? new Date(cp.created_at).toLocaleDateString('de-DE') : '–'}
                      </td>
                      <td className="px-3 py-2 font-medium text-sm">
                        {cp.milestone_title || cp.title || (cp.milestone_id ? `#${cp.milestone_id}` : '–')}
                      </td>
                      <td className="px-3 py-2 text-gray-300 text-sm">
                        {cp.service_provider_name || cp.contractor_name || '–'}
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-[#ffbd59]">
                        {formatCurrency(cp.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Ausgaben */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20">
        <div className="p-4 border-b border-white/20">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Ausgaben</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Gesamt:</span>
              <span className="font-semibold text-white">
                {formatCurrency(expenses.reduce((sum, exp) => sum + exp.amount, 0))}
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-400 mt-1">Manuell erfasste Ausgaben</p>
        </div>

        <div className="p-4">
          {expenses.length === 0 ? (
            <div className="text-center py-8">
              <Receipt className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <h4 className="text-base font-medium text-white mb-2">Keine Ausgaben</h4>
              <p className="text-gray-400 text-sm">Fügen Sie Ihre erste Ausgabe hinzu.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {expenses.slice(0, 6).map((expense) => (
                <div key={expense.id} className="group bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-all duration-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-gradient-to-br from-[#ffbd59] to-[#ffa726] rounded-lg">
                        {getCategoryIcon(expense.category)}
                      </div>
                      <div>
                        <h4 className="font-medium text-white text-sm group-hover:text-[#ffbd59] transition-colors">
                          {expense.title}
                        </h4>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getCategoryColor(expense.category)}`}>
                          {getCategoryLabel(expense.category)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-white text-sm">
                        {formatCurrency(expense.amount)}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(expense.date).toLocaleDateString('de-DE')}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-300 text-xs mb-3 line-clamp-2">
                    {expense.description || 'Keine Beschreibung'}
                  </p>
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => openEditExpenseModal(expense)}
                      className="text-[#ffbd59] hover:text-[#ffa726] text-xs font-medium transition-colors"
                    >
                      Bearbeiten
                    </button>
                    <button
                      onClick={() => handleDeleteExpense(expense.id)}
                      className="text-red-400 hover:text-red-300 text-xs font-medium transition-colors"
                    >
                      Löschen
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {expenses.length > 6 && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-400">
                {expenses.length - 6} weitere Ausgaben... 
                <span className="text-[#ffbd59] ml-1 cursor-pointer hover:underline">
                  Alle anzeigen
                </span>
              </p>
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










