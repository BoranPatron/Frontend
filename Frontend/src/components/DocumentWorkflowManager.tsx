import React, { useState, useEffect } from 'react';
import { 
  Workflow, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  User, 
  Calendar,
  ArrowRight,
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Bell,
  Users,
  FileText,
  Shield,
  Eye
} from 'lucide-react';

interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'blocked';
  assignedTo?: string;
  dueDate?: string;
  estimatedDuration?: number;
  isRequired: boolean;
  canSkip: boolean;
  dependencies?: string[];
  actions: WorkflowAction[];
}

interface WorkflowAction {
  id: string;
  name: string;
  type: 'approve' | 'review' | 'sign' | 'upload' | 'notify' | 'custom';
  icon: React.ReactNode;
  color: string;
}

interface DocumentWorkflow {
  id: string;
  name: string;
  documentType: string;
  projectPhase: string;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  steps: WorkflowStep[];
  createdAt: string;
  updatedAt: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedCompletion?: string;
  actualCompletion?: string;
}

interface DocumentWorkflowManagerProps {
  documentType: string;
  projectPhase: string;
  documentId: number;
  onWorkflowCreated: (workflow: DocumentWorkflow) => void;
  onWorkflowUpdated: (workflow: DocumentWorkflow) => void;
}

export default function DocumentWorkflowManager({
  documentType,
  projectPhase,
  documentId,
  onWorkflowCreated,
  onWorkflowUpdated
}: DocumentWorkflowManagerProps) {
  const [workflow, setWorkflow] = useState<DocumentWorkflow | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showWorkflowDetails, setShowWorkflowDetails] = useState(false);

  useEffect(() => {
    if (documentType && projectPhase) {
      createIntelligentWorkflow();
    }
  }, [documentType, projectPhase]);

  const createIntelligentWorkflow = async () => {
    setIsCreating(true);
    
    try {
      // Simuliere Workflow-Erstellung basierend auf Dokumententyp und Projektphase
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const workflowSteps = generateWorkflowSteps(documentType, projectPhase);
      const priority = determinePriority(documentType, projectPhase);
      
      const newWorkflow: DocumentWorkflow = {
        id: `wf_${Date.now()}`,
        name: `Workflow für ${getDocumentTypeLabel(documentType)}`,
        documentType,
        projectPhase,
        status: 'active',
        steps: workflowSteps,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        priority,
        estimatedCompletion: calculateEstimatedCompletion(workflowSteps)
      };
      
      setWorkflow(newWorkflow);
      onWorkflowCreated(newWorkflow);
    } catch (error) {
      console.error('Fehler beim Erstellen des Workflows:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const generateWorkflowSteps = (docType: string, phase: string): WorkflowStep[] => {
    const steps: WorkflowStep[] = [];
    
    switch (docType) {
      case 'permit':
        steps.push(
          {
            id: 'upload',
            name: 'Dokument hochgeladen',
            description: 'Dokument wurde erfolgreich hochgeladen',
            status: 'completed',
            isRequired: true,
            canSkip: false,
            actions: []
          },
          {
            id: 'ai_analysis',
            name: 'KI-Analyse',
            description: 'Automatische Analyse und Kategorisierung',
            status: 'completed',
            isRequired: true,
            canSkip: false,
            actions: []
          },
          {
            id: 'compliance_check',
            name: 'Compliance-Prüfung',
            description: 'Automatische Prüfung auf Vollständigkeit und Konformität',
            status: 'in_progress',
            isRequired: true,
            canSkip: false,
            actions: [
              {
                id: 'review_compliance',
                name: 'Prüfen',
                type: 'review',
                icon: <Eye size={16} />,
                color: 'text-blue-500'
              }
            ]
          },
          {
            id: 'bautraeger_review',
            name: 'Bauträger-Prüfung',
            description: 'Prüfung durch Bauträger erforderlich',
            status: 'pending',
            isRequired: true,
            canSkip: false,
            assignedTo: 'Bauträger',
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            estimatedDuration: 2,
            actions: [
              {
                id: 'approve',
                name: 'Genehmigen',
                type: 'approve',
                icon: <CheckCircle size={16} />,
                color: 'text-green-500'
              },
              {
                id: 'reject',
                name: 'Ablehnen',
                type: 'custom',
                icon: <AlertCircle size={16} />,
                color: 'text-red-500'
              }
            ]
          },
          {
            id: 'behoerde_submission',
            name: 'Behörden-Einreichung',
            description: 'Einreichung bei zuständiger Behörde',
            status: 'pending',
            isRequired: true,
            canSkip: false,
            dependencies: ['bautraeger_review'],
            estimatedDuration: 5,
            actions: [
              {
                id: 'submit',
                name: 'Einreichen',
                type: 'custom',
                icon: <ArrowRight size={16} />,
                color: 'text-blue-500'
              }
            ]
          }
        );
        break;
        
      case 'contract':
        steps.push(
          {
            id: 'upload',
            name: 'Vertrag hochgeladen',
            description: 'Vertragsdokument wurde hochgeladen',
            status: 'completed',
            isRequired: true,
            canSkip: false,
            actions: []
          },
          {
            id: 'legal_review',
            name: 'Rechtliche Prüfung',
            description: 'Prüfung durch Rechtsabteilung',
            status: 'pending',
            isRequired: true,
            canSkip: false,
            assignedTo: 'Rechtsabteilung',
            dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
            estimatedDuration: 3,
            actions: [
              {
                id: 'review_legal',
                name: 'Prüfen',
                type: 'review',
                icon: <Shield size={16} />,
                color: 'text-purple-500'
              }
            ]
          },
          {
            id: 'stakeholder_approval',
            name: 'Stakeholder-Genehmigung',
            description: 'Genehmigung durch alle Beteiligten',
            status: 'pending',
            isRequired: true,
            canSkip: false,
            dependencies: ['legal_review'],
            estimatedDuration: 2,
            actions: [
              {
                id: 'approve_stakeholders',
                name: 'Genehmigen',
                type: 'approve',
                icon: <Users size={16} />,
                color: 'text-green-500'
              }
            ]
          },
          {
            id: 'signature',
            name: 'Unterschrift',
            description: 'Digitale oder physische Unterschrift',
            status: 'pending',
            isRequired: true,
            canSkip: false,
            dependencies: ['stakeholder_approval'],
            estimatedDuration: 1,
            actions: [
              {
                id: 'sign',
                name: 'Unterschreiben',
                type: 'sign',
                icon: <FileText size={16} />,
                color: 'text-blue-500'
              }
            ]
          }
        );
        break;
        
      case 'quote':
        steps.push(
          {
            id: 'upload',
            name: 'Angebot hochgeladen',
            description: 'Angebot wurde hochgeladen',
            status: 'completed',
            isRequired: true,
            canSkip: false,
            actions: []
          },
          {
            id: 'cost_analysis',
            name: 'Kostenanalyse',
            description: 'Automatische Analyse der Kostenpositionen',
            status: 'in_progress',
            isRequired: true,
            canSkip: false,
            actions: [
              {
                id: 'review_costs',
                name: 'Kosten prüfen',
                type: 'review',
                icon: <Eye size={16} />,
                color: 'text-blue-500'
              }
            ]
          },
          {
            id: 'bautraeger_review',
            name: 'Bauträger-Prüfung',
            description: 'Prüfung und Bewertung des Angebots',
            status: 'pending',
            isRequired: true,
            canSkip: false,
            estimatedDuration: 2,
            actions: [
              {
                id: 'approve_quote',
                name: 'Annehmen',
                type: 'approve',
                icon: <CheckCircle size={16} />,
                color: 'text-green-500'
              },
              {
                id: 'reject_quote',
                name: 'Ablehnen',
                type: 'custom',
                icon: <AlertCircle size={16} />,
                color: 'text-red-500'
              }
            ]
          }
        );
        break;
        
      default:
        steps.push(
          {
            id: 'upload',
            name: 'Dokument hochgeladen',
            description: 'Dokument wurde erfolgreich hochgeladen',
            status: 'completed',
            isRequired: true,
            canSkip: false,
            actions: []
          },
          {
            id: 'basic_review',
            name: 'Grundprüfung',
            description: 'Basis-Prüfung des Dokuments',
            status: 'pending',
            isRequired: false,
            canSkip: true,
            estimatedDuration: 1,
            actions: [
              {
                id: 'review_basic',
                name: 'Prüfen',
                type: 'review',
                icon: <Eye size={16} />,
                color: 'text-blue-500'
              }
            ]
          }
        );
    }
    
    return steps;
  };

  const determinePriority = (docType: string, phase: string): 'low' | 'medium' | 'high' | 'urgent' => {
    if (docType === 'permit' || docType === 'contract') return 'high';
    if (docType === 'invoice') return 'urgent';
    if (docType === 'quote') return 'medium';
    return 'low';
  };

  const calculateEstimatedCompletion = (steps: WorkflowStep[]): string => {
    const totalDays = steps.reduce((sum, step) => sum + (step.estimatedDuration || 0), 0);
    const completionDate = new Date(Date.now() + totalDays * 24 * 60 * 60 * 1000);
    return completionDate.toISOString();
  };

  const getDocumentTypeLabel = (type: string): string => {
    switch (type) {
      case 'plan': return 'Plan';
      case 'permit': return 'Genehmigung';
      case 'quote': return 'Angebot';
      case 'invoice': return 'Rechnung';
      case 'contract': return 'Vertrag';
      case 'photo': return 'Foto';
      default: return 'Dokument';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return 'text-green-500 bg-green-500/20 border-green-500/30';
      case 'in_progress': return 'text-blue-500 bg-blue-500/20 border-blue-500/30';
      case 'pending': return 'text-yellow-500 bg-yellow-500/20 border-yellow-500/30';
      case 'blocked': return 'text-red-500 bg-red-500/20 border-red-500/30';
      case 'skipped': return 'text-gray-500 bg-gray-500/20 border-gray-500/30';
      default: return 'text-gray-500 bg-gray-500/20 border-gray-500/30';
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'urgent': return 'text-red-500 bg-red-500/20 border-red-500/30';
      case 'high': return 'text-orange-500 bg-orange-500/20 border-orange-500/30';
      case 'medium': return 'text-yellow-500 bg-yellow-500/20 border-yellow-500/30';
      case 'low': return 'text-green-500 bg-green-500/20 border-green-500/30';
      default: return 'text-gray-500 bg-gray-500/20 border-gray-500/30';
    }
  };

  const handleStepAction = (stepId: string, actionId: string) => {
    if (!workflow) return;
    
    const updatedWorkflow = { ...workflow };
    const step = updatedWorkflow.steps.find(s => s.id === stepId);
    
    if (step) {
      if (actionId === 'approve' || actionId === 'approve_quote' || actionId === 'approve_stakeholders') {
        step.status = 'completed';
      } else if (actionId === 'reject' || actionId === 'reject_quote') {
        step.status = 'blocked';
      } else if (actionId === 'review_compliance' || actionId === 'review_legal' || actionId === 'review_costs' || actionId === 'review_basic') {
        step.status = 'in_progress';
      }
      
      updatedWorkflow.updatedAt = new Date().toISOString();
      setWorkflow(updatedWorkflow);
      onWorkflowUpdated(updatedWorkflow);
    }
  };

  if (isCreating) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#ffbd59]"></div>
          <div>
            <h3 className="text-lg font-semibold text-white">Workflow wird erstellt...</h3>
            <p className="text-sm text-gray-300">Intelligenter Workflow wird generiert</p>
          </div>
        </div>
      </div>
    );
  }

  if (!workflow) {
    return null;
  }

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#ffbd59]/20 rounded-xl">
            <Workflow size={20} className="text-[#ffbd59]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{workflow.name}</h3>
            <p className="text-sm text-gray-300">Intelligenter Dokumenten-Workflow</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(workflow.priority)}`}>
            {workflow.priority === 'urgent' ? 'Dringend' :
             workflow.priority === 'high' ? 'Hoch' :
             workflow.priority === 'medium' ? 'Mittel' : 'Niedrig'}
          </span>
          
          <button
            onClick={() => setShowWorkflowDetails(!showWorkflowDetails)}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <Eye size={16} className="text-white" />
          </button>
        </div>
      </div>

      {showWorkflowDetails && (
        <div className="space-y-4">
          {workflow.steps.map((step, index) => (
            <div key={step.id} className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step.status === 'completed' ? 'bg-green-500 text-white' :
                    step.status === 'in_progress' ? 'bg-blue-500 text-white' :
                    step.status === 'pending' ? 'bg-yellow-500 text-white' :
                    'bg-gray-500 text-white'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-medium text-white">{step.name}</h4>
                    <p className="text-sm text-gray-300">{step.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(step.status)}`}>
                    {step.status === 'completed' ? 'Abgeschlossen' :
                     step.status === 'in_progress' ? 'In Bearbeitung' :
                     step.status === 'pending' ? 'Ausstehend' :
                     step.status === 'blocked' ? 'Blockiert' : 'Übersprungen'}
                  </span>
                  
                  {step.dueDate && (
                    <div className="flex items-center gap-1 text-xs text-gray-300">
                      <Calendar size={12} />
                      <span>{new Date(step.dueDate).toLocaleDateString('de-DE')}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {step.assignedTo && (
                <div className="flex items-center gap-2 mb-3">
                  <User size={14} className="text-gray-400" />
                  <span className="text-sm text-gray-300">Zugewiesen an: {step.assignedTo}</span>
                </div>
              )}
              
              {step.actions.length > 0 && step.status === 'pending' && (
                <div className="flex gap-2">
                  {step.actions.map(action => (
                    <button
                      key={action.id}
                      onClick={() => handleStepAction(step.id, action.id)}
                      className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        action.color.includes('green') ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30' :
                        action.color.includes('red') ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30' :
                        action.color.includes('blue') ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30' :
                        action.color.includes('purple') ? 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30' :
                        'bg-gray-500/20 text-gray-300 hover:bg-gray-500/30'
                      }`}
                    >
                      {action.icon}
                      {action.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <Clock size={14} />
              <span>Geschätzte Fertigstellung: {new Date(workflow.estimatedCompletion!).toLocaleDateString('de-DE')}</span>
            </div>
            
            <div className="flex gap-2">
              <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <Pause size={16} className="text-white" />
              </button>
              <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <SkipForward size={16} className="text-white" />
              </button>
              <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <RotateCcw size={16} className="text-white" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}