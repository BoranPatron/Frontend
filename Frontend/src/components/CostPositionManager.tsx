import React, { useState, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  Edit3, 
  Check, 
  X, 
  ChevronDown,
  ChevronUp,
  Calculator,
  Tag
} from 'lucide-react';

interface CostPosition {
  id: number;
  description: string;
  amount: number;
  category: string;
  cost_type: string;
  status: string;
}

interface CostPositionManagerProps {
  positions: CostPosition[];
  onPositionsChange: (positions: CostPosition[]) => void;
  onTotalChange?: (total: number) => void;
}

interface CostPositionCardProps {
  position: CostPosition;
  index: number;
  onUpdate: (id: number, field: keyof CostPosition, value: string | number) => void;
  onRemove: (id: number) => void;
  isLast: boolean;
}

const CostPositionCard: React.FC<CostPositionCardProps> = ({
  position,
  index,
  onUpdate,
  onRemove,
  isLast
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [tempValues, setTempValues] = useState({
    description: position.description,
    amount: position.amount.toString(),
    category: position.category
  });
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartX = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const categories = [
    { value: 'material', label: '🔧 Material', color: 'bg-blue-100 text-blue-800' },
    { value: 'labor', label: '👷 Arbeit', color: 'bg-green-100 text-green-800' },
    { value: 'other', label: '📦 Sonstiges', color: 'bg-gray-100 text-gray-800' },
    { value: 'custom', label: '✨ Individuell', color: 'bg-purple-100 text-purple-800' }
  ];

  const getCurrentCategory = () => {
    return categories.find(cat => cat.value === position.category) || categories[3];
  };

  const handleSave = () => {
    const amount = parseFloat(tempValues.amount) || 0;
    onUpdate(position.id, 'description', tempValues.description);
    onUpdate(position.id, 'amount', amount);
    onUpdate(position.id, 'category', tempValues.category);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempValues({
      description: position.description,
      amount: position.amount.toString(),
      category: position.category
    });
    setIsEditing(false);
  };

  // Touch/Swipe handlers für mobile Geräte
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const currentX = e.touches[0].clientX;
    const deltaX = touchStartX.current - currentX;
    
    // Nur nach links wischen erlauben (zum Löschen)
    if (deltaX > 0 && deltaX <= 100) {
      setDragOffset(deltaX);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    
    // Wenn mehr als 60px nach links gewischt wurde, zeige Löschen-Option
    if (dragOffset > 60) {
      // Löschen-Animation
      if (cardRef.current) {
        cardRef.current.style.transform = 'translateX(-100%)';
        cardRef.current.style.opacity = '0';
        setTimeout(() => onRemove(position.id), 300);
      }
    } else {
      // Zurück zur ursprünglichen Position
      setDragOffset(0);
    }
  };

  return (
    <div
      ref={cardRef}
      className={`relative group transition-all duration-300 ease-in-out transform ${
        isDragging ? 'scale-105 shadow-xl' : 'hover:shadow-lg'
      } ${!isLast ? 'mb-4' : ''}`}
      style={{
        transform: `translateX(-${dragOffset}px)`,
        transition: isDragging ? 'none' : 'all 0.3s ease-in-out'
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Swipe-to-delete Hintergrund */}
      {dragOffset > 0 && (
        <div 
          className="absolute right-0 top-0 h-full bg-red-500 flex items-center justify-center rounded-r-xl transition-all duration-200"
          style={{ width: `${Math.min(dragOffset, 100)}px` }}
        >
          <Trash2 
            size={20} 
            className="text-white"
            style={{ opacity: Math.min(dragOffset / 60, 1) }}
          />
        </div>
      )}

      {/* Hauptkarte */}
      <div className="bg-gradient-to-r from-[#1a1a2e]/80 to-[#2c3539]/80 backdrop-blur-sm rounded-xl border border-gray-600/30 overflow-hidden">
        {/* Header mit Position Number und Actions */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#ffbd59]/10 to-[#ffa726]/10">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] rounded-full text-white font-semibold text-sm">
              {index + 1}
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCurrentCategory().color}`}>
                {getCurrentCategory().label}
              </span>
              {position.amount > 0 && (
                <span className="text-[#ffbd59] font-semibold">
                  {position.amount.toFixed(2)} €
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Expand/Collapse Button */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
              title={isExpanded ? 'Einklappen' : 'Erweitern'}
            >
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {/* Edit Button */}
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-2 text-gray-400 hover:text-[#ffbd59] hover:bg-[#ffbd59]/10 rounded-lg transition-all duration-200"
              title="Bearbeiten"
            >
              <Edit3 size={16} />
            </button>

            {/* Delete Button (Desktop) */}
            <button
              onClick={() => onRemove(position.id)}
              className="hidden md:flex p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-all duration-200"
              title="Position löschen"
            >
              <Trash2 size={16} />
            </button>

            {/* Drag Handle (Desktop) */}
            <div className="hidden md:flex p-2 text-gray-400 cursor-move">
              <GripVertical size={16} />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {!isEditing ? (
            /* Display Mode */
            <div>
              <p className="text-white font-medium mb-2">
                {position.description || `Position ${index + 1} - Keine Beschreibung`}
              </p>
              
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-gray-600/30">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Kategorie:</span>
                      <p className="text-white font-medium">{getCurrentCategory().label}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Betrag:</span>
                      <p className="text-[#ffbd59] font-semibold">{position.amount.toFixed(2)} €</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Edit Mode */
            <div className="space-y-4">
              {/* Beschreibung */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Beschreibung
                </label>
                <textarea
                  value={tempValues.description}
                  onChange={(e) => setTempValues(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-600/30 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent bg-[#1a1a2e]/50 text-white placeholder-gray-400 resize-none"
                  rows={2}
                  placeholder="Beschreibung der Leistung..."
                />
              </div>

              {/* Betrag und Kategorie */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Betrag (€)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      value={tempValues.amount}
                      onChange={(e) => setTempValues(prev => ({ ...prev, amount: e.target.value }))}
                      className="w-full pl-8 pr-3 py-2 border border-gray-600/30 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent bg-[#1a1a2e]/50 text-white placeholder-gray-400"
                      placeholder="0.00"
                    />
                    <Calculator className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Kategorie
                  </label>
                  <div className="relative">
                    <select
                      value={tempValues.category}
                      onChange={(e) => setTempValues(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full pl-8 pr-3 py-2 border border-gray-600/30 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent bg-[#1a1a2e]/50 text-white appearance-none"
                    >
                      {categories.map(cat => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                    <Tag className="absolute left-2 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-3">
                <button
                  onClick={handleSave}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <Check size={16} />
                  <span className="font-medium">Speichern</span>
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all duration-200"
                >
                  <X size={16} />
                  <span className="font-medium">Abbrechen</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CostPositionManager: React.FC<CostPositionManagerProps> = ({
  positions,
  onPositionsChange,
  onTotalChange
}) => {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newPositionData, setNewPositionData] = useState({
    description: '',
    amount: '',
    category: 'custom'
  });

  const openAddDialog = () => {
    setNewPositionData({
      description: '',
      amount: '',
      category: 'custom'
    });
    setShowAddDialog(true);
  };

  const handleAddPosition = () => {
    // Validierung
    if (!newPositionData.description.trim()) {
      return; // Könnte hier eine Toast-Message hinzufügen
    }

    const amount = parseFloat(newPositionData.amount) || 0;
    const newId = Math.max(...positions.map(p => p.id), 0) + 1;
    
    const newPosition: CostPosition = {
      id: newId,
      description: newPositionData.description.trim(),
      amount: amount,
      category: newPositionData.category,
      cost_type: 'standard',
      status: 'active'
    };
    
    const updatedPositions = [...positions, newPosition];
    onPositionsChange(updatedPositions);
    
    // Berechne neuen Gesamtbetrag
    if (onTotalChange) {
      const total = updatedPositions.reduce((sum, pos) => sum + (pos.amount || 0), 0);
      onTotalChange(total);
    }
    
    // Dialog schließen und Animation
    setShowAddDialog(false);
    setIsAddingNew(true);
    setTimeout(() => setIsAddingNew(false), 300);
  };

  const handleCancelAdd = () => {
    setNewPositionData({
      description: '',
      amount: '',
      category: 'custom'
    });
    setShowAddDialog(false);
  };

  const updateCostPosition = (id: number, field: keyof CostPosition, value: string | number) => {
    const updatedPositions = positions.map(pos =>
      pos.id === id ? { ...pos, [field]: value } : pos
    );
    onPositionsChange(updatedPositions);
    
    // Berechne neuen Gesamtbetrag
    if (field === 'amount' && onTotalChange) {
      const total = updatedPositions.reduce((sum, pos) => sum + (pos.amount || 0), 0);
      onTotalChange(total);
    }
  };

  const removeCostPosition = (id: number) => {
    const updatedPositions = positions.filter(pos => pos.id !== id);
    onPositionsChange(updatedPositions);
    
    if (onTotalChange) {
      const total = updatedPositions.reduce((sum, pos) => sum + (pos.amount || 0), 0);
      onTotalChange(total);
    }
  };

  const totalAmount = positions.reduce((sum, pos) => sum + (pos.amount || 0), 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h4 className="font-medium text-gray-300">Kostenpositionen</h4>
          <p className="text-sm text-gray-400">
            {positions.length} Position{positions.length !== 1 ? 'en' : ''} • Gesamt: {totalAmount.toFixed(2)} €
          </p>
        </div>
      </div>

      {/* Position Cards */}
      <div className="space-y-0">
        {positions.length === 0 ? (
          /* Empty State */
          <div className="text-center py-12 px-6 bg-gradient-to-r from-[#1a1a2e]/50 to-[#2c3539]/50 rounded-xl border border-gray-600/30 border-dashed">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-[#ffbd59]/20 to-[#ffa726]/20 rounded-full flex items-center justify-center">
              <Plus size={32} className="text-[#ffbd59]" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Noch keine Kostenpositionen
            </h3>
            <p className="text-gray-400 text-sm mb-6">
              Füge die Kostenposition hinzu, um mit der Rechnungsstellung zu beginnen.
            </p>
            <button
              onClick={openAddDialog}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-white rounded-lg hover:from-[#ffa726] hover:to-[#ff9500] transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
            >
              <Plus size={20} />
              <span className="font-medium">Erste Position hinzufügen</span>
            </button>
          </div>
        ) : (
          positions.map((position, index) => (
            <CostPositionCard
              key={position.id}
              position={position}
              index={index}
              onUpdate={updateCostPosition}
              onRemove={removeCostPosition}
              isLast={index === positions.length - 1}
            />
          ))
        )}
      </div>

      {/* Add Button - Mobile-optimierter Floating Action Button (nur wenn bereits Positionen vorhanden) */}
      {positions.length > 0 && (
        <div className="relative">
          <button
            onClick={openAddDialog}
            className={`w-full flex items-center justify-center gap-3 py-4 px-6 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-white rounded-xl hover:from-[#ffa726] hover:to-[#ff9500] transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-[#ffbd59]/30 active:scale-95 ${
              isAddingNew ? 'scale-95 shadow-inner' : 'hover:scale-105'
            }`}
            disabled={isAddingNew}
          >
            <div className={`p-2 rounded-full bg-white/20 transition-all duration-300 ${
              isAddingNew ? 'rotate-45' : ''
            }`}>
              <Plus size={20} />
            </div>
            <span className="font-semibold text-lg">
              {isAddingNew ? 'Wird hinzugefügt...' : 'Weitere Position hinzufügen'}
            </span>
          </button>
        </div>
      )}

      {/* Mobile-Hinweis für Swipe-to-delete */}
      {positions.length > 0 && (
        <div className="md:hidden mt-4 p-3 bg-gradient-to-r from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-lg">
          <p className="text-blue-300 text-sm text-center">
            💡 Tipp: Nach links wischen um eine Position zu löschen
          </p>
        </div>
      )}

      {/* Add Position Dialog */}
      {showAddDialog && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={handleCancelAdd}
        >
          <div 
            className="bg-gradient-to-r from-[#1a1a2e] to-[#2c3539] rounded-xl border border-gray-600/30 max-w-md w-full mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Dialog Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-600/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-[#ffbd59]/20 to-[#ffa726]/20 rounded-lg">
                  <Plus size={20} className="text-[#ffbd59]" />
                </div>
                <h3 className="text-lg font-semibold text-white">
                  Neue Kostenposition hinzufügen
                </h3>
              </div>
              <button
                onClick={handleCancelAdd}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
              >
                <X size={20} />
              </button>
            </div>

            {/* Dialog Content */}
            <div className="p-6 space-y-4">
              {/* Beschreibung */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Beschreibung *
                </label>
                <textarea
                  value={newPositionData.description}
                  onChange={(e) => setNewPositionData(prev => ({ ...prev, description: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && newPositionData.description.trim()) {
                      e.preventDefault();
                      handleAddPosition();
                    }
                    if (e.key === 'Escape') {
                      handleCancelAdd();
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-600/30 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent bg-[#1a1a2e]/50 text-white placeholder-gray-400 resize-none"
                  rows={2}
                  placeholder="z.B. Materialkosten für Dachziegel..."
                  autoFocus
                />
              </div>

              {/* Betrag und Kategorie */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Betrag (€)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      value={newPositionData.amount}
                      onChange={(e) => setNewPositionData(prev => ({ ...prev, amount: e.target.value }))}
                      className="w-full pl-8 pr-3 py-2 border border-gray-600/30 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent bg-[#1a1a2e]/50 text-white placeholder-gray-400"
                      placeholder="0.00"
                    />
                    <Calculator className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Kategorie
                  </label>
                  <div className="relative">
                    <select
                      value={newPositionData.category}
                      onChange={(e) => setNewPositionData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full pl-8 pr-3 py-2 border border-gray-600/30 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-transparent bg-[#1a1a2e]/50 text-white appearance-none"
                    >
                      <option value="material">🔧 Material</option>
                      <option value="labor">👷 Arbeit</option>
                      <option value="other">📦 Sonstiges</option>
                      <option value="custom">✨ Individuell</option>
                    </select>
                    <Tag className="absolute left-2 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Dialog Actions */}
            <div className="flex gap-3 p-6 border-t border-gray-600/30">
              <button
                onClick={handleCancelAdd}
                className="flex-1 px-4 py-3 border border-gray-600/30 text-gray-300 rounded-lg hover:bg-gray-600/20 hover:border-gray-500/50 transition-all duration-200"
              >
                Abbrechen
              </button>
              <button
                onClick={handleAddPosition}
                disabled={!newPositionData.description.trim()}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  newPositionData.description.trim()
                    ? 'bg-gradient-to-r from-[#ffbd59] to-[#ffa726] text-white hover:from-[#ffa726] hover:to-[#ff9500] shadow-lg hover:shadow-xl'
                    : 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
                }`}
              >
                Position hinzufügen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CostPositionManager;