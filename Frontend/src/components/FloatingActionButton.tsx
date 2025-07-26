import React, { useState } from 'react';
import { Plus, FileText, CheckSquare, Euro, Users } from 'lucide-react';

interface FloatingActionButtonProps {
  onCreateProject?: () => void;
  onCreateTrade?: () => void;
  onCreateTodo?: () => void;
  onCreateExpense?: () => void;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onCreateProject,
  onCreateTrade,
  onCreateTodo,
  onCreateExpense
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleOptionClick = (action: () => void | undefined) => {
    setIsOpen(false);
    if (action) {
      action();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Action Menu */}
      {isOpen && (
        <div className="mb-4 space-y-2">
          {/* Projekt erstellen */}
          <button
            onClick={() => handleOptionClick(onCreateProject)}
            className="flex items-center gap-3 bg-gradient-to-r from-[#1a1a2e] to-[#16213e] text-white px-4 py-3 rounded-lg shadow-lg border border-gray-600 hover:border-[#ffbd59] transition-all duration-200 transform hover:scale-105"
          >
            <div className="w-10 h-10 bg-[#ffbd59] rounded-full flex items-center justify-center">
              <FileText size={20} className="text-[#1a1a2e]" />
            </div>
            <div className="text-left">
              <div className="font-medium">Projekt erstellen</div>
              <div className="text-sm text-gray-300">Neues Bauprojekt anlegen</div>
            </div>
          </button>

          {/* Gewerk erstellen */}
          <button
            onClick={() => handleOptionClick(onCreateTrade)}
            className="flex items-center gap-3 bg-gradient-to-r from-[#1a1a2e] to-[#16213e] text-white px-4 py-3 rounded-lg shadow-lg border border-gray-600 hover:border-[#ffbd59] transition-all duration-200 transform hover:scale-105"
          >
            <div className="w-10 h-10 bg-[#ffbd59] rounded-full flex items-center justify-center">
              <Users size={20} className="text-[#1a1a2e]" />
            </div>
            <div className="text-left">
              <div className="font-medium">Gewerk erstellen</div>
              <div className="text-sm text-gray-300">Neuen Dienstleister hinzufügen</div>
            </div>
          </button>

          {/* Todo erstellen */}
          <button
            onClick={() => handleOptionClick(onCreateTodo)}
            className="flex items-center gap-3 bg-gradient-to-r from-[#1a1a2e] to-[#16213e] text-white px-4 py-3 rounded-lg shadow-lg border border-gray-600 hover:border-[#ffbd59] transition-all duration-200 transform hover:scale-105"
          >
            <div className="w-10 h-10 bg-[#ffbd59] rounded-full flex items-center justify-center">
              <CheckSquare size={20} className="text-[#1a1a2e]" />
            </div>
            <div className="text-left">
              <div className="font-medium">Todo erstellen</div>
              <div className="text-sm text-gray-300">Neue Aufgabe hinzufügen</div>
            </div>
          </button>

          {/* Ausgabe erstellen */}
          <button
            onClick={() => handleOptionClick(onCreateExpense)}
            className="flex items-center gap-3 bg-gradient-to-r from-[#1a1a2e] to-[#16213e] text-white px-4 py-3 rounded-lg shadow-lg border border-gray-600 hover:border-[#ffbd59] transition-all duration-200 transform hover:scale-105"
          >
            <div className="w-10 h-10 bg-[#ffbd59] rounded-full flex items-center justify-center">
              <Euro size={20} className="text-[#1a1a2e]" />
            </div>
            <div className="text-left">
              <div className="font-medium">Ausgabe erstellen</div>
              <div className="text-sm text-gray-300">Neue Kostenposition hinzufügen</div>
            </div>
          </button>
        </div>
      )}

      {/* Main FAB Button */}
      <button
        onClick={toggleMenu}
        className="w-16 h-16 bg-gradient-to-r from-[#ffbd59] to-[#ffa726] hover:from-[#ffa726] hover:to-[#ff9800] text-[#1a1a2e] rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-110 flex items-center justify-center"
      >
        <Plus size={24} className={`transition-transform duration-200 ${isOpen ? 'rotate-45' : ''}`} />
      </button>
    </div>
  );
};

export default FloatingActionButton; 