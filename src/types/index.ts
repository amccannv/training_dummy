export type ActionCategory =
  | 'magic:basic' | 'magic:threshold' | 'magic:ultimate'
  | 'melee:basic' | 'melee:threshold' | 'melee:ultimate'
  | 'necro:basic' | 'necro:threshold' | 'necro:ultimate'
  | 'ranged:basic' | 'ranged:threshold' | 'ranged:ultimate'
  | 'constitution:basic' | 'constitution:threshold' | 'constitution:special' | 'constitution:ultimate'
  | 'defence:basic' | 'defence:threshold' | 'defence:ultimate'
  | 'utility' | 'prayer'
  | 'items:consume' | 'items:equipment' | 'items:target';

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
  isAuto?: boolean;
  iconUrl?: string;
  soundUrl?: string;
}

export interface Rotation {
  id: string;
  name: string;
  abilities: string[];
  offGcdActions?: Record<number, string[]>;
}

export interface TickEvent {
  tick: number;
  abilityId: string;
  resolved: boolean;
  result?: 'hit' | 'miss';
  duration: number;
  gcdEndTick: number;
}

// Shelved — for future prayers/supplemental support
export interface ActivationEvent {
  tick: number;
  primary: string;
  supplemental: string[];
  resolved: boolean;
  result?: 'hit' | 'miss';
  duration: number;
  gcdEndTick: number;
}

export interface TimedSession {
  rotationId: string;
  date: string;
  hits: number;
  misses: number;
  wrongPresses: number;
  events: Array<{
    actionId: string;
    tick: number;
    result: 'hit' | 'miss';
  }>;
  prayerStats?: PrayerSessionStats;
}

export type AttackStyle = 'melee' | 'magic' | 'ranged' | 'necromancy';

export interface PrayerFlickSettings {
  enabled: boolean;
  attackRate: number;
  telegraphTicks: number;
  styles: AttackStyle[];
}

export interface PrayerAttack {
  tick: number;
  style: AttackStyle;
  resolved: boolean;
  result?: 'hit' | 'miss';
}

export interface PrayerSessionStats {
  hits: number;
  misses: number;
  ssUptimeTicks: number;
  totalTicks: number;
  attacks: Array<{
    tick: number;
    style: AttackStyle;
    result: 'hit' | 'miss';
  }>;
}

export interface StoredKeybinds {
  version: 1;
  bindings: Record<string, Keybind | null>;
}

export interface StoredSessions {
  version: 2;
  sessions: TimedSession[];
}

export interface StoredUserRotations {
  version: 1;
  rotations: Rotation[];
}
