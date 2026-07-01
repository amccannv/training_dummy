import { create } from 'zustand';
import type {
  Rotation,
  TimedAction,
  TimedSession,
  ActionQuality,
  PrayerConfig,
  PrayerCheckEvent,
} from '../types';
import { actions } from '../data/actions';
import { keybindEquals } from '../utils/keybindFormat';
import { setItem } from '../utils/storage';

export type KeypressResult =
  | { type: 'hit'; actionId: string; offsetMs: number; quality: ActionQuality }
  | { type: 'prayer-toggle'; actionId: string; newState: 'activated' | 'deactivated' }
  | { type: 'miss'; reason: 'wrong-action' | 'wrong-timing' }
  | { type: 'ignored' };

interface GCDWindow {
  gcdIndex: number;
  windowStartMs: number;
  windowEndMs: number;
  expectedActionIds: string[];
  lastPressedId: string | null;
  lastPressTimeMs: number;
  resolved: boolean;
}

interface PrayerFeedbackEvent {
  type: 'hit' | 'miss';
  actionId: string;
  id: number;
}

interface PracticeStore {
  rotation: Rotation | null;
  sessionActive: boolean;
  startTimeMs: number;
  currentActive: string[];
  completed: TimedAction[];
  missed: string[];
  wrongPresses: number;
  gcdWindows: GCDWindow[];
  currentGcdIndex: number;
  // Prayer state
  activePrayerId: string | null;
  prayerConfig: PrayerConfig | null;
  prayerChecks: PrayerCheckEvent[];
  prayerHits: number;
  prayerMisses: number;
  prayerFeedback: PrayerFeedbackEvent | null;

  startPractice: (rotation: Rotation, prayerConfig?: PrayerConfig | null) => void;
  handleKeypress: (
    pressed: { code: string; ctrl: boolean; shift: boolean; alt: boolean; meta: boolean },
    getBinding: (actionId: string) => { code: string; ctrl: boolean; shift: boolean; alt: boolean; meta: boolean } | null,
  ) => KeypressResult;
  processExpired: (nowMs: number) => void;
  finishSession: () => void;
  reset: () => void;
}

const TIMING_WINDOW_MS = 300;
const GCD_MS = 1800;
let fbIdCounter = 0;

const PRAYER_IDS = new Set(
  actions.filter((a) => a.category === 'prayer').map((a) => a.id),
);

function isAuthor(aId: string): boolean {
  return PRAYER_IDS.has(aId);
}

function isInstant(actionId: string): boolean {
  const def = actions.find((a) => a.id === actionId);
  return def ? def.durationTicks === 0 : true;
}

function buildGcdWindows(rotation: Rotation): GCDWindow[] {
  const windows = new Map<number, GCDWindow>();

  for (const step of rotation.steps) {
    for (const aId of step.actions) {
      if (isInstant(aId)) continue;

      const gcdIdx = Math.round(step.targetTimeMs / GCD_MS);
      if (!windows.has(gcdIdx)) {
        const startMs = gcdIdx * GCD_MS;
        windows.set(gcdIdx, {
          gcdIndex: gcdIdx,
          windowStartMs: startMs,
          windowEndMs: startMs + GCD_MS,
          expectedActionIds: [],
          lastPressedId: null,
          lastPressTimeMs: 0,
          resolved: false,
        });
      }
      windows.get(gcdIdx)!.expectedActionIds.push(aId);
    }
  }

  return Array.from(windows.values()).sort((a, b) => a.gcdIndex - b.gcdIndex);
}

function generatePrayerChecks(
  config: PrayerConfig,
  totalMs: number,
): PrayerCheckEvent[] {
  const checks: PrayerCheckEvent[] = [];
  const intervalMs = config.checkIntervalTicks * 600;
  const pool = config.enabledIds;
  if (pool.length === 0) return checks;

  for (let t = 0; t <= totalMs; t += intervalMs) {
    checks.push({
      targetTimeMs: t,
      requiredPrayerId: pool[Math.floor(Math.random() * pool.length)],
      state: 'pending',
    });
  }
  return checks;
}

function matchKeybind(
  actionId: string,
  pressed: { code: string; ctrl: boolean; shift: boolean; alt: boolean; meta: boolean },
  getBinding: (actionId: string) => { code: string; ctrl: boolean; shift: boolean; alt: boolean; meta: boolean } | null,
): boolean {
  const binding = getBinding(actionId);
  if (!binding) return false;
  return keybindEquals(
    { code: binding.code, ctrl: binding.ctrl, shift: binding.shift, alt: binding.alt, meta: binding.meta },
    { code: pressed.code, ctrl: pressed.ctrl, shift: pressed.shift, alt: pressed.alt, meta: pressed.meta },
  );
}

export const usePracticeStore = create<PracticeStore>()((set, get) => ({
  rotation: null,
  sessionActive: false,
  startTimeMs: 0,
  currentActive: [],
  completed: [],
  missed: [],
  wrongPresses: 0,
  gcdWindows: [],
  currentGcdIndex: 0,
  activePrayerId: null,
  prayerConfig: null,
  prayerChecks: [],
  prayerHits: 0,
  prayerMisses: 0,
  prayerFeedback: null,

  startPractice: (rotation, prayerConfig = null) => {
    const totalMs = rotation.steps[rotation.steps.length - 1].targetTimeMs + 600;
    set({
      rotation,
      sessionActive: true,
      startTimeMs: Date.now(),
      currentActive: [],
      completed: [],
      missed: [],
      wrongPresses: 0,
      gcdWindows: buildGcdWindows(rotation),
      currentGcdIndex: 0,
      activePrayerId: null,
      prayerConfig,
      prayerChecks: prayerConfig
        ? generatePrayerChecks(prayerConfig, totalMs)
        : [],
      prayerHits: 0,
      prayerMisses: 0,
      prayerFeedback: null,
    });
  },

  handleKeypress: (pressed, getBinding) => {
    const state = get();
    if (!state.rotation || !state.sessionActive) return { type: 'ignored' };
    const elapsed = Date.now() - state.startTimeMs;

    // 1. Instant actions in active windows
    for (const aId of state.currentActive) {
      if (matchKeybind(aId, pressed, getBinding)) {
        const step = state.rotation.steps.find((s) => s.actions.includes(aId));
        if (!step) continue;
        const offset = elapsed - step.targetTimeMs;
        const isPrayer = isAuthor(aId);
        const newPrayer = isPrayer
          ? state.activePrayerId === aId ? null : aId
          : state.activePrayerId;
        set({
          currentActive: state.currentActive.filter((a) => a !== aId),
          completed: [
            ...state.completed,
            { actionId: aId, pressTimeMs: elapsed, offsetMs: Math.round(offset), quality: 'instant' as ActionQuality },
          ],
          activePrayerId: newPrayer,
        });
        return { type: 'hit', actionId: aId, offsetMs: Math.round(offset), quality: 'instant' };
      }
    }

    // 2. GCD-gated actions in current window
    const currentWindow = state.gcdWindows[state.currentGcdIndex];
    if (currentWindow && !currentWindow.resolved) {
      for (const aId of currentWindow.expectedActionIds) {
        if (matchKeybind(aId, pressed, getBinding)) {
          const quality: ActionQuality =
            elapsed >= currentWindow.windowEndMs - 600 ? 'perfect' : 'early';
          const isPrayer = isAuthor(aId);
          const newPrayer = isPrayer
            ? state.activePrayerId === aId ? null : aId
            : state.activePrayerId;
          const updated = state.gcdWindows.map((w, i) =>
            i === state.currentGcdIndex
              ? { ...w, lastPressedId: aId, lastPressTimeMs: elapsed }
              : w,
          );
          set({ gcdWindows: updated, activePrayerId: newPrayer });
          return { type: 'hit', actionId: aId, offsetMs: Math.round(elapsed - currentWindow.windowEndMs), quality };
        }
      }
    }

    // 3. Pure prayer toggle (key matches a prayer, not in any window)
    for (const aId of PRAYER_IDS) {
      if (matchKeybind(aId, pressed, getBinding)) {
        const newState = state.activePrayerId === aId ? null : aId;
        set({ activePrayerId: newState });
        return {
          type: 'prayer-toggle',
          actionId: aId,
          newState: newState ? 'activated' : 'deactivated',
        };
      }
    }

    // 4. Press matches an action but not in expected window
    for (const step of state.rotation.steps) {
      for (const aId of step.actions) {
        if (
          state.completed.some((c) => c.actionId === aId) ||
          state.missed.includes(aId)
        )
          continue;
        if (matchKeybind(aId, pressed, getBinding)) {
          set({ wrongPresses: state.wrongPresses + 1 });
          return { type: 'miss', reason: 'wrong-timing' };
        }
      }
    }

    // 5. No match at all
    set({ wrongPresses: state.wrongPresses + 1 });
    return { type: 'miss', reason: 'wrong-action' };
  },

  processExpired: (nowMs: number) => {
    const state = get();
    if (!state.rotation || !state.sessionActive) return;
    const elapsed = nowMs - state.startTimeMs;

    let currentActive = [...state.currentActive];
    let missed = [...state.missed];
    let completed = [...state.completed];
    let gcdWindows = state.gcdWindows.map((w) => ({ ...w }));
    let currentGcdIndex = state.currentGcdIndex;
    let prayerChecks = state.prayerChecks.map((c) => ({ ...c }));
    let prayerHits = state.prayerHits;
    let prayerMisses = state.prayerMisses;
    let prayerFeedback: PrayerFeedbackEvent | null = state.prayerFeedback;
    let changed = false;

    // --- Instant action windows ---
    for (const step of state.rotation.steps) {
      for (const aId of step.actions) {
        if (!isInstant(aId)) continue;
        if (completed.some((c) => c.actionId === aId) || missed.includes(aId)) continue;

        const wStart = step.targetTimeMs - TIMING_WINDOW_MS;
        const wEnd = step.targetTimeMs + TIMING_WINDOW_MS;

        if (elapsed >= wStart && elapsed <= wEnd && !currentActive.includes(aId)) {
          currentActive.push(aId);
          changed = true;
        }

        if (elapsed > wEnd) {
          missed.push(aId);
          currentActive = currentActive.filter((a) => a !== aId);
          changed = true;
        }
      }
    }

    // --- Resolve GCD windows ---
    while (currentGcdIndex < gcdWindows.length) {
      const win = gcdWindows[currentGcdIndex];
      if (win.resolved) { currentGcdIndex++; continue; }

      if (elapsed >= win.windowEndMs) {
        if (
          win.lastPressedId &&
          win.expectedActionIds.includes(win.lastPressedId)
        ) {
          const quality: ActionQuality =
            win.lastPressTimeMs >= win.windowEndMs - 600 ? 'perfect' : 'early';
          completed.push({
            actionId: win.lastPressedId,
            pressTimeMs: win.lastPressTimeMs,
            offsetMs: Math.round(win.lastPressTimeMs - win.windowEndMs),
            quality,
          });
        } else {
          for (const aId of win.expectedActionIds) {
            if (!missed.includes(aId) && !completed.some((c) => c.actionId === aId)) {
              missed.push(aId);
            }
          }
        }
        gcdWindows[currentGcdIndex] = { ...win, resolved: true };
        currentGcdIndex++;
        changed = true;
      } else {
        break;
      }
    }

    // --- Resolve prayer check events ---
    for (let i = 0; i < prayerChecks.length; i++) {
      const check = prayerChecks[i];
      if (check.state !== 'pending') continue;

      if (elapsed >= check.targetTimeMs) {
        if (state.activePrayerId === check.requiredPrayerId) {
          prayerChecks[i] = { ...check, state: 'hit' };
          prayerHits++;
        } else {
          prayerChecks[i] = { ...check, state: 'missed' };
          prayerMisses++;
          const id = ++fbIdCounter;
          prayerFeedback = { type: 'miss', actionId: check.requiredPrayerId, id };
        }
        changed = true;
      }
    }

    if (changed) {
      const allIds = state.rotation.steps.flatMap((s) => s.actions);
      const allDone = allIds.every(
        (id) =>
          completed.some((c) => c.actionId === id) || missed.includes(id),
      );

      if (allDone) {
        set({
          currentActive,
          missed,
          completed,
          gcdWindows,
          prayerChecks,
          prayerHits,
          prayerMisses,
          prayerFeedback,
          sessionActive: false,
        });
        setTimeout(() => get().finishSession(), 50);
      } else {
        set({
          currentActive,
          missed,
          completed,
          gcdWindows,
          currentGcdIndex,
          prayerChecks,
          prayerHits,
          prayerMisses,
          prayerFeedback,
        });
      }
    }
  },

  finishSession: () => {
    const state = get();
    if (!state.rotation) return;

    const session: TimedSession = {
      rotationId: state.rotation.id,
      date: new Date().toISOString(),
      completed: state.completed,
      missed: state.missed,
      wrongPresses: state.wrongPresses,
      prayerHits: state.prayerHits,
      prayerMisses: state.prayerMisses,
      prayerChecks: state.prayerChecks,
    };

    const raw = localStorage.getItem('rs3-sessions');
    const sessions: TimedSession[] = raw ? JSON.parse(raw) : [];
    sessions.push(session);
    setItem('sessions', sessions);
  },

  reset: () => {
    set({
      rotation: null,
      sessionActive: false,
      startTimeMs: 0,
      currentActive: [],
      completed: [],
      missed: [],
      wrongPresses: 0,
      gcdWindows: [],
      currentGcdIndex: 0,
      activePrayerId: null,
      prayerConfig: null,
      prayerChecks: [],
      prayerHits: 0,
      prayerMisses: 0,
      prayerFeedback: null,
    });
  },
}));
