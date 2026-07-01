import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Keybind } from '../types';
import { actions } from '../data/actions';
import { keybindEquals } from '../utils/keybindFormat';

type Bindings = Record<string, Keybind | null>;

export type SetBindingResult =
  | { success: true }
  | { success: false; conflictId: string };

interface KeybindStore {
  bindings: Bindings;
  capturingActionId: string | null;
  setBinding: (actionId: string, keybind: Keybind) => SetBindingResult;
  clearBinding: (actionId: string) => void;
  clearAll: () => void;
  startCapture: (actionId: string) => void;
  stopCapture: () => void;
  getBinding: (actionId: string) => Keybind | null;
}

function buildInitialBindings(): Bindings {
  const b: Bindings = {};
  for (const action of actions) {
    b[action.id] = null;
  }
  return b;
}

export const useKeybindStore = create<KeybindStore>()(
  persist(
    (set, get) => ({
      bindings: buildInitialBindings(),
      capturingActionId: null,

      setBinding: (actionId, keybind) => {
        const { bindings } = get();
        for (const [aid, kb] of Object.entries(bindings)) {
          if (!kb || aid === actionId) continue;
          if (keybindEquals(kb, keybind)) {
            return { success: false, conflictId: aid };
          }
        }
        set({
          bindings: { ...bindings, [actionId]: keybind },
          capturingActionId: null,
        });
        return { success: true };
      },

      clearBinding: (actionId) => {
        set((s) => ({
          bindings: { ...s.bindings, [actionId]: null },
        }));
      },

      clearAll: () => {
        set({ bindings: buildInitialBindings() });
      },

      startCapture: (actionId) => {
        set({ capturingActionId: actionId });
      },

      stopCapture: () => {
        set({ capturingActionId: null });
      },

      getBinding: (actionId) => {
        return get().bindings[actionId] ?? null;
      },
    }),
    {
      name: 'rs3-keybinds',
      partialize: (state) => ({ bindings: state.bindings }),
    },
  ),
);
