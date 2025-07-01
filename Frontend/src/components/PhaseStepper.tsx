import React from 'react';

interface PhaseStepperProps {
  currentPhase: any;
  projectId: number;
  onPhaseChange: (newPhase: any) => Promise<void>;
  className?: string;
}

export default function PhaseStepper(_props: PhaseStepperProps) {
  // Diese Komponente wurde durch PhaseCard ersetzt
  return null;
} 