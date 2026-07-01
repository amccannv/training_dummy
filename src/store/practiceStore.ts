import { create } from 'zustand';
import type {
  Rotation,
  StepResult,
  ActionResult,
  PracticeSession,
} from '../types';
import { keybindEquals } from '../utils/keybindFormat';
import { setItem } from '../utils/storage';

export type KeypressResult =
  | { type: 'hit'; actionId: string }
  | { type: 'miss' }
  | { type: 'ignored' };

interface PracticeStore {
  rotation: Rotation | null;
  currentStepIndex: number;
  completedActions: string[];
  allResults: StepResult[];
  extraMisses: number;
  sessionActive: boolean;

  startPractice: (rotation: Rotation) => void;
  handleKeypress: (
    pressed: { code: string; ctrl: boolean; shift: boolean; alt: boolean; meta: boolean },
    getBinding: (actionId: string) => { code: string; ctrl: boolean; shift: boolean; alt: boolean; meta: boolean } | null,
  ) => KeypressResult;
  advanceStep: () => void;
  finishSession: () => void;
  reset: () => void;
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
  currentStepIndex: 0,
  completedActions: [],
  allResults: [],
  extraMisses: 0,
  sessionActive: false,

  startPractice: (rotation) => {
    set({
      rotation,
      currentStepIndex: 0,
      completedActions: [],
      allResults: [],
      extraMisses: 0,
      sessionActive: true,
    });
  },

  handleKeypress: (pressed, getBinding) => {
    const state = get();
    if (!state.rotation || !state.sessionActive) return { type: 'ignored' };
    const step = state.rotation.steps[state.currentStepIndex];
    if (!step) return { type: 'ignored' };

    const remaining = step.actions.filter(
      (aId) => !state.completedActions.includes(aId) && getBinding(aId) !== null,
    );

    if (remaining.length === 0) return { type: 'ignored' };

    const matched = remaining.find((aId) =>
      matchKeybind(aId, pressed, getBinding),
    );

    if (matched) {
      const currentMisses = state.extraMisses;
      set({
        completedActions: [...state.completedActions, matched],
        allResults: [
          ...state.allResults,
          {
            step: step.step,
            actions: [{ actionId: matched, hit: true } as ActionResult],
            extraMisses: currentMisses,
          },
        ],
        extraMisses: 0,
      });

      return { type: 'hit', actionId: matched };
    }

    set({ extraMisses: state.extraMisses + 1 });
    return { type: 'miss' };
  },

  advanceStep: () => {
    const state = get();
    if (!state.rotation) return;
    const nextIndex = state.currentStepIndex + 1;

    if (nextIndex >= state.rotation.steps.length) {
      get().finishSession();
    } else {
      set({
        currentStepIndex: nextIndex,
        completedActions: [],
        extraMisses: 0,
      });
    }
  },

  finishSession: () => {
    const state = get();
    if (!state.rotation) return;

    const session: PracticeSession = {
      rotationId: state.rotation.id,
      date: new Date().toISOString(),
      stepResults: state.allResults,
      completed: true,
    };

    const stored = localStorage.getItem('rs3-sessions');
    const sessions: PracticeSession[] = stored ? JSON.parse(stored) : [];
    sessions.push(session);
    setItem('sessions', sessions);

    set({ sessionActive: false });
  },

  reset: () => {
    set({
      rotation: null,
      currentStepIndex: 0,
      completedActions: [],
      allResults: [],
      extraMisses: 0,
      sessionActive: false,
    });
  },
}));
