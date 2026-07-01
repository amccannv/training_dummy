export type ActionCategory =
  | 'ranged:basic'
  | 'ranged:threshold'
  | 'ranged:ultimate'
  | 'eof'
  | 'special'
  | 'prayer';

export interface Keybind {
  code: string;
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  meta: boolean;
}

export interface ActionDefinition {
  id: string;
  name: string;
  category: ActionCategory;
  durationTicks: number;
  isChanneled: boolean;
  iconUrl?: string;
}

export interface RotationStep {
  step: number;
  actions: string[];
}

export interface Rotation {
  id: string;
  name: string;
  steps: RotationStep[];
}

export interface ActionResult {
  actionId: string;
  hit: boolean;
}

export interface StepResult {
  step: number;
  actions: ActionResult[];
  extraMisses: number;
}

export interface PracticeSession {
  rotationId: string;
  date: string;
  stepResults: StepResult[];
  completed: boolean;
}

export interface StoredKeybinds {
  version: 1;
  bindings: Record<string, Keybind | null>;
}

export interface StoredSessions {
  version: 1;
  sessions: PracticeSession[];
}
