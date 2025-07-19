import React, { useState } from 'react';
import { Plus, X, AlertTriangle } from 'lucide-react';
import { createProject } from '../api/projectService';

interface FloatingActionButtonProps {
  isServiceProvider: boolean;
}

export default function FloatingActionButton({ isServiceProvider }: FloatingActionButtonProps) {
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [createProjectError, setCreateProjectError] = useState<string | null>(null);
  const [projectForm, setProjectForm] = useState({
    name: '',
    description: '',
    project_type: 'new_build',
    address: '',
    address_street: '',
    address_zip: '',
    address_city: '',
    address_country: 'Deutschland',
    property_size: '',
    construction_area: '',
    start_date: '',
    end_date: '',
    budget: '',
    is_public: false,
    allow_quotes: true
  });

  // Nur für Bauträger anzeigen
  if (isServiceProvider) {
    return null;
  }

  const handleCreateProjectClick = () => {
    setShowCreateProjectModal(true);
    setCreateProjectError(null);
  };

  const handleCloseCreateProjectModal = () => {
    setShowCreateProjectModal(false);
    setProjectForm({
      name: '',
      description: '',
      project_type: 'new_build',
      address: '',
      address_street: '',
      address_zip: '',
      address_city: '',
      address_country: 'Deutschland',
      property_size: '',
      construction_area: '',
      start_date: '',
      end_date: '',
      budget: '',
      is_public: false,
      allow_quotes: true
    });
  };

  const handleProjectFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setProjectForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingProject(true);
    setCreateProjectError(null);

    try {
      // Formatiere die Daten für die API
      const projectData = {
        name: projectForm.name.trim(),
        description: projectForm.description.trim() || '',
        project_type: projectForm.project_type,
        status: 'planning', // Standard-Status für neue Projekte
        address: projectForm.address.trim() || undefined,
        address_street: projectForm.address_street?.trim() || undefined,
        address_zip: projectForm.address_zip?.trim() || undefined,
        address_city: projectForm.address_city?.trim() || undefined,
        address_country: projectForm.address_country?.trim() || 'Deutschland',
        property_size: projectForm.property_size ? parseFloat(projectForm.property_size) : undefined,
        construction_area: projectForm.construction_area ? parseFloat(projectForm.construction_area) : undefined,
        start_date: projectForm.start_date || undefined,
        end_date: projectForm.end_date || undefined,
        budget: projectForm.budget ? parseFloat(projectForm.budget) : undefined,
        is_public: projectForm.is_public,
        allow_quotes: projectForm.allow_quotes
      };

      console.log('🚀 Erstelle neues Projekt mit Daten:', projectData);
      const newProject = await createProject(projectData);
      console.log('✅ Neues Projekt erstellt:', newProject);

      // Schließe Modal und navigiere zum neuen Projekt
      handleCloseCreateProjectModal();
      window.location.href = `/project/${newProject.id}`;

    } catch (error) {
      console.error('❌ Fehler beim Erstellen des Projekts:', error);
      setCreateProjectError(error instanceof Error ? error.message : 'Unbekannter Fehler beim Erstellen des Projekts');
    } finally {
      setIsCreatingProject(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={handleCreateProjectClick}
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#ffbd59] hover:bg-[#ffa726] text-[#2c3539] rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-110 z-40 flex items-center justify-center"
        title="Neues Projekt erstellen"
      >
        <Plus size={24} />
      </button>

      {/* Projekt-Erstellungs-Modal */}
      {showCreateProjectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-[#2c3539] to-[#3d4952] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#ffbd59]/20">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Neues Projekt erstellen</h2>
                <button
                  onClick={handleCloseCreateProjectModal}
                  className="text-gray-400 hover:text-[#ffbd59] transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleCreateProject} className="space-y-6">
                {/* Grundinformationen */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Projektname *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={projectForm.name}
                      onChange={handleProjectFormChange}
                      required
                      className="w-full px-3 py-2 bg-[#1a1a2e]/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] text-white placeholder-gray-400"
                      placeholder="z.B. Einfamilienhaus München"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Projekttyp *
                    </label>
                    <select
                      name="project_type"
                      value={projectForm.project_type}
                      onChange={handleProjectFormChange}
                      required
                      className="w-full px-3 py-2 bg-[#1a1a2e]/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] text-white"
                    >
                      <option value="new_build">Neubau</option>
                      <option value="renovation">Renovierung</option>
                      <option value="extension">Anbau</option>
                      <option value="refurbishment">Sanierung</option>
                    </select>
                  </div>
                </div>

                {/* Beschreibung */}
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    Beschreibung
                  </label>
                  <textarea
                    name="description"
                    value={projectForm.description}
                    onChange={handleProjectFormChange}
                    rows={3}
                    className="w-full px-3 py-2 bg-[#1a1a2e]/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] text-white placeholder-gray-400"
                    placeholder="Beschreiben Sie Ihr Projekt..."
                  />
                </div>

                {/* Adresse */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Vollständige Adresse
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={projectForm.address}
                      onChange={handleProjectFormChange}
                      className="w-full px-3 py-2 bg-[#1a1a2e]/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] text-white placeholder-gray-400"
                      placeholder="z.B. Musterstraße 123, 80331 München"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-2">
                        Straße & Hausnummer
                      </label>
                      <input
                        type="text"
                        name="address_street"
                        value={projectForm.address_street}
                        onChange={handleProjectFormChange}
                        className="w-full px-3 py-2 bg-[#1a1a2e]/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] text-white placeholder-gray-400"
                        placeholder="z.B. Musterstraße 123"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-2">
                        PLZ
                      </label>
                      <input
                        type="text"
                        name="address_zip"
                        value={projectForm.address_zip}
                        onChange={handleProjectFormChange}
                        className="w-full px-3 py-2 bg-[#1a1a2e]/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] text-white placeholder-gray-400"
                        placeholder="z.B. 80331"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-200 mb-2">
                        Ort
                      </label>
                      <input
                        type="text"
                        name="address_city"
                        value={projectForm.address_city}
                        onChange={handleProjectFormChange}
                        className="w-full px-3 py-2 bg-[#1a1a2e]/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] text-white placeholder-gray-400"
                        placeholder="z.B. München"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Land
                    </label>
                    <select
                      name="address_country"
                      value={projectForm.address_country}
                      onChange={handleProjectFormChange}
                      className="w-full px-3 py-2 bg-[#1a1a2e]/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] text-white"
                    >
                      <option value="Deutschland">Deutschland</option>
                      <option value="Schweiz">Schweiz</option>
                      <option value="Österreich">Österreich</option>
                    </select>
                  </div>
                </div>

                {/* Projektdetails */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Grundstücksgröße (m²)
                    </label>
                    <input
                      type="number"
                      name="property_size"
                      value={projectForm.property_size}
                      onChange={handleProjectFormChange}
                      className="w-full px-3 py-2 bg-[#1a1a2e]/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] text-white placeholder-gray-400"
                      placeholder="z.B. 500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Wohnfläche (m²)
                    </label>
                    <input
                      type="number"
                      name="construction_area"
                      value={projectForm.construction_area}
                      onChange={handleProjectFormChange}
                      className="w-full px-3 py-2 bg-[#1a1a2e]/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] text-white placeholder-gray-400"
                      placeholder="z.B. 150"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Budget (€)
                    </label>
                    <input
                      type="number"
                      name="budget"
                      value={projectForm.budget}
                      onChange={handleProjectFormChange}
                      className="w-full px-3 py-2 bg-[#1a1a2e]/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] text-white placeholder-gray-400"
                      placeholder="z.B. 500000"
                    />
                  </div>
                </div>

                {/* Zeitplan */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Startdatum
                    </label>
                    <input
                      type="date"
                      name="start_date"
                      value={projectForm.start_date}
                      onChange={handleProjectFormChange}
                      className="w-full px-3 py-2 bg-[#1a1a2e]/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-200 mb-2">
                      Enddatum
                    </label>
                    <input
                      type="date"
                      name="end_date"
                      value={projectForm.end_date}
                      onChange={handleProjectFormChange}
                      className="w-full px-3 py-2 bg-[#1a1a2e]/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-[#ffbd59] focus:border-[#ffbd59] text-white"
                    />
                  </div>
                </div>

                {/* Einstellungen */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      name="is_public"
                      checked={projectForm.is_public}
                      onChange={handleProjectFormChange}
                      className="w-4 h-4 text-[#ffbd59] bg-[#1a1a2e]/50 border-gray-600 rounded focus:ring-[#ffbd59] focus:ring-2"
                    />
                    <label className="text-sm text-gray-200">
                      Projekt für Dienstleister sichtbar machen
                    </label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      name="allow_quotes"
                      checked={projectForm.allow_quotes}
                      onChange={handleProjectFormChange}
                      className="w-4 h-4 text-[#ffbd59] bg-[#1a1a2e]/50 border-gray-600 rounded focus:ring-[#ffbd59] focus:ring-2"
                    />
                    <label className="text-sm text-gray-200">
                      Angebote für dieses Projekt erlauben
                    </label>
                  </div>
                </div>

                {/* Fehler-Anzeige */}
                {createProjectError && (
                  <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle size={16} />
                      <span>{createProjectError}</span>
                    </div>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex items-center justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseCreateProjectModal}
                    className="px-6 py-2 text-gray-300 hover:text-white transition-colors"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingProject}
                    className="flex items-center space-x-2 bg-[#ffbd59] hover:bg-[#ffa726] disabled:bg-gray-600 text-[#2c3539] px-6 py-2 rounded-lg font-semibold transition-colors duration-200"
                  >
                    {isCreatingProject ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#2c3539]"></div>
                        <span>Erstelle...</span>
                      </>
                    ) : (
                      <>
                        <Plus size={16} />
                        <span>Projekt erstellen</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 