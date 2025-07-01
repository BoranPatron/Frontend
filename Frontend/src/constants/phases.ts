export enum ProjectPhase {
  PREPARATION = 'preparation',
  PLANNING = 'planning',
  QUOTES = 'quotes',
  EXECUTION = 'execution',
  COMPLETION = 'completion',
  HANDOVER = 'handover'
}

export interface PhaseInfo {
  id: ProjectPhase;
  label: string;
  description: string;
  color: string;
  icon: string;
  order: number;
}

export const PHASES: Record<ProjectPhase, PhaseInfo> = {
  [ProjectPhase.PREPARATION]: {
    id: ProjectPhase.PREPARATION,
    label: 'Vorbereitung',
    description: 'Grundlegende Projektvorbereitung, Zieldefinition und Machbarkeitsprüfung',
    color: 'bg-blue-500',
    icon: '📋',
    order: 1
  },
  [ProjectPhase.PLANNING]: {
    id: ProjectPhase.PLANNING,
    label: 'Planung',
    description: 'Detaillierte Planung, Architektur, Genehmigungen und Finanzierung',
    color: 'bg-green-500',
    icon: '📐',
    order: 2
  },
  [ProjectPhase.QUOTES]: {
    id: ProjectPhase.QUOTES,
    label: 'Angebote',
    description: 'Angebote einholen, vergleichen und Auftragnehmer auswählen',
    color: 'bg-yellow-500',
    icon: '💰',
    order: 3
  },
  [ProjectPhase.EXECUTION]: {
    id: ProjectPhase.EXECUTION,
    label: 'Umsetzung',
    description: 'Bauausführung, Qualitätskontrolle und Projektmanagement',
    color: 'bg-orange-500',
    icon: '🏗️',
    order: 4
  },
  [ProjectPhase.COMPLETION]: {
    id: ProjectPhase.COMPLETION,
    label: 'Abschluss',
    description: 'Finale Arbeiten, Abnahmen und Dokumentation',
    color: 'bg-purple-500',
    icon: '✅',
    order: 5
  },
  [ProjectPhase.HANDOVER]: {
    id: ProjectPhase.HANDOVER,
    label: 'Übergabe',
    description: 'Projektübergabe an Kunden und finale Abrechnung',
    color: 'bg-red-500',
    icon: '🎉',
    order: 6
  }
};

export function getPhaseInfo(phase: ProjectPhase): PhaseInfo {
  return PHASES[phase];
}

export function getPhaseIndex(phase: ProjectPhase): number {
  return PHASES[phase].order;
}

export function getNextPhase(currentPhase: ProjectPhase): ProjectPhase | null {
  const currentIndex = getPhaseIndex(currentPhase);
  const nextIndex = currentIndex + 1;
  const nextPhase = Object.values(PHASES).find(p => p.order === nextIndex);
  return nextPhase ? nextPhase.id : null;
}

export function getPreviousPhase(currentPhase: ProjectPhase): ProjectPhase | null {
  const currentIndex = getPhaseIndex(currentPhase);
  const prevIndex = currentIndex - 1;
  const prevPhase = Object.values(PHASES).find(p => p.order === prevIndex);
  return prevPhase ? prevPhase.id : null;
}

export function isPhaseCompleted(currentPhase: ProjectPhase, targetPhase: ProjectPhase): boolean {
  return getPhaseIndex(currentPhase) >= getPhaseIndex(targetPhase);
}

export function getPhaseProgress(currentPhase: ProjectPhase): number {
  const currentIndex = getPhaseIndex(currentPhase);
  const totalPhases = Object.keys(PHASES).length;
  return Math.round((currentIndex / totalPhases) * 100);
} 