export type ActionCategory =
  | 'ranged:basic'
  | 'ranged:threshold'
  | 'ranged:ultimate'
  | 'ranged:utility'
  | 'constitution:basic'
  | 'constitution:threshold'
  | 'constitution:special'
  | 'constitution:ultimate'
  | 'defence:basic'
  | 'defence:threshold'
  | 'defence:ultimate'
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
  targetTimeMs: number;
}

export interface Rotation {
  id: string;
  name: string;
  steps: RotationStep[];
}

export type ActionQuality = 'instant' | 'perfect' | 'early';

export interface TimedAction {
  actionId: string;
  pressTimeMs: number;
  offsetMs: number;
  quality: ActionQuality;
}

export interface PrayerConfig {
  enabledIds: string[];
  checkIntervalTicks: number;
}

export interface PrayerCheckEvent {
  targetTimeMs: number;
  requiredPrayerId: string;
  state: 'pending' | 'hit' | 'missed';
}

export interface TimedSession {
  rotationId: string;
  date: string;
  completed: TimedAction[];
  missed: string[];
  wrongPresses: number;
  prayerHits?: number;
  prayerMisses?: number;
  prayerChecks?: PrayerCheckEvent[];
}

export interface StoredKeybinds {
  version: 1;
  bindings: Record<string, Keybind | null>;
}

export interface StoredSessions {
  version: 2;
  sessions: TimedSession[];
}
