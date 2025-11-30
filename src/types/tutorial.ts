/**
 * Tutorial System Types
 * Defines the structure for step-by-step YAML learning
 */

export type TutorialStepStatus = 'locked' | 'current' | 'completed';

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  resourceType: 'deployment' | 'service' | 'ingress' | 'configmap' | 'secret';
  fields: TutorialField[];
  explanation: string;
  eli5?: string; // Explain Like I'm 5 - simple analogy
  tips?: string[];
}

export interface TutorialField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'keyvalue' | 'toggle';
  required: boolean;
  placeholder?: string;
  defaultValue?: any;
  options?: { value: string; label: string }[];
  helpText: string;
  example?: string;
}

export interface TutorialState {
  currentStepIndex: number;
  completedSteps: Set<string>;
  formData: Record<string, any>;
}

// Tutorial scenarios - different learning paths
export type TutorialScenario = 'simple-web-app' | 'api-with-db' | 'microservices';

export interface TutorialScenarioDefinition {
  id: TutorialScenario;
  title: string;
  description: string;
  duration: string;
  steps: TutorialStep[];
}
