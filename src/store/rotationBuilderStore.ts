import { create } from 'zustand';
import type { Rotation } from '../types';
import { rotations as builtInRotations } from '../data/rotations';
import { saveUserRotation, deleteUserRotation, getUserRotations } from '../utils/storage';

interface RotationBuilderState {
  name: string;
  abilities: string[];
  offGcdActions: Record<number, string[]>;
  isDirty: boolean;
  loadedRotationId: string | null;

  setName: (name: string) => void;
  setAbility: (index: number, abilityId: string) => void;
  insertAbility: (index: number, abilityId: string) => void;
  removeAbility: (index: number) => void;
  moveAbility: (fromIndex: number, toIndex: number) => void;
  addOffGcdAction: (abilityIndex: number, actionId: string) => void;
  removeOffGcdAction: (abilityIndex: number, actionId: string) => void;
  loadRotation: (rotation: Rotation) => void;
  clearBuilder: () => void;
  buildRotation: () => Rotation;
  saveRotation: () => void;
  deleteSaved: (id: string) => void;
  getAllRotations: () => Rotation[];
}

function shiftOffGcdAfterRemove(
  offGcdActions: Record<number, string[]>,
  removedIndex: number,
): Record<number, string[]> {
  const next: Record<number, string[]> = {};
  for (const [keyStr, actions] of Object.entries(offGcdActions)) {
    const key = Number(keyStr);
    if (key < removedIndex) {
      next[key] = [...actions];
    } else if (key > removedIndex) {
      next[key - 1] = [...actions];
    }
  }
  return next;
}

function shiftOffGcdAfterInsert(
  offGcdActions: Record<number, string[]>,
  insertIndex: number,
): Record<number, string[]> {
  const next: Record<number, string[]> = {};
  for (const [keyStr, actions] of Object.entries(offGcdActions)) {
    const key = Number(keyStr);
    if (key < insertIndex) {
      next[key] = [...actions];
    } else {
      next[key + 1] = [...actions];
    }
  }
  return next;
}

function shiftOffGcdForMove(
  offGcdActions: Record<number, string[]>,
  fromIndex: number,
  toIndex: number,
): Record<number, string[]> {
  const fromActions = offGcdActions[fromIndex] ?? [];
  let without = { ...offGcdActions };
  delete without[fromIndex];
  without = shiftOffGcdAfterRemove(without, fromIndex);
  const next: Record<number, string[]> = {};
  for (const [keyStr, actions] of Object.entries(without)) {
    const key = Number(keyStr);
    if (key < toIndex) {
      next[key] = [...actions];
    } else {
      next[key + 1] = [...actions];
    }
  }
  next[toIndex] = [...fromActions];
  return next;
}

export const useRotationBuilderStore = create<RotationBuilderState>()((set, get) => ({
  name: '',
  abilities: [],
  offGcdActions: {},
  isDirty: false,
  loadedRotationId: null,

  setName: (name) => set({ name, isDirty: true }),

  setAbility: (index, abilityId) => {
    const abilities = [...get().abilities];
    abilities[index] = abilityId;
    set({ abilities, isDirty: true });
  },

  insertAbility: (index, abilityId) => {
    const abilities = [...get().abilities];
    abilities.splice(index, 0, abilityId);
    const offGcdActions = shiftOffGcdAfterInsert(get().offGcdActions, index);
    set({ abilities, offGcdActions, isDirty: true });
  },

  removeAbility: (index) => {
    const abilities = [...get().abilities];
    abilities.splice(index, 1);
    const offGcdActions = shiftOffGcdAfterRemove(get().offGcdActions, index);
    set({ abilities, offGcdActions, isDirty: true });
  },

  moveAbility: (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    const abilities = [...get().abilities];
    const [moved] = abilities.splice(fromIndex, 1);
    abilities.splice(toIndex, 0, moved);
    const offGcdActions = shiftOffGcdForMove(get().offGcdActions, fromIndex, toIndex);
    set({ abilities, offGcdActions, isDirty: true });
  },

  addOffGcdAction: (abilityIndex, actionId) => {
    const offGcdActions = { ...get().offGcdActions };
    const existing = offGcdActions[abilityIndex] ?? [];
    if (existing.includes(actionId)) return;
    offGcdActions[abilityIndex] = [...existing, actionId];
    set({ offGcdActions, isDirty: true });
  },

  removeOffGcdAction: (abilityIndex, actionId) => {
    const offGcdActions = { ...get().offGcdActions };
    const existing = offGcdActions[abilityIndex];
    if (!existing) return;
    const filtered = existing.filter((id) => id !== actionId);
    if (filtered.length === 0) {
      delete offGcdActions[abilityIndex];
    } else {
      offGcdActions[abilityIndex] = filtered;
    }
    set({ offGcdActions, isDirty: true });
  },

  loadRotation: (rotation) => {
    set({
      name: rotation.name,
      abilities: [...rotation.abilities],
      offGcdActions: rotation.offGcdActions
        ? JSON.parse(JSON.stringify(rotation.offGcdActions))
        : {},
      isDirty: false,
      loadedRotationId: rotation.id,
    });
  },

  clearBuilder: () => {
    set({
      name: '',
      abilities: [],
      offGcdActions: {},
      isDirty: false,
      loadedRotationId: null,
    });
  },

  buildRotation: () => {
    const state = get();
    const id = state.loadedRotationId ?? `user-${Date.now()}`;
    const offGcdEntries = Object.entries(state.offGcdActions);
    const rotation: Rotation = {
      id,
      name: state.name || 'Untitled Rotation',
      abilities: [...state.abilities],
    };
    if (offGcdEntries.length > 0) {
      rotation.offGcdActions = {};
      for (const [key, actions] of offGcdEntries) {
        rotation.offGcdActions[Number(key)] = [...actions];
      }
    }
    return rotation;
  },

  saveRotation: () => {
    const rotation = get().buildRotation();
    saveUserRotation(rotation);
    set({ isDirty: false, loadedRotationId: rotation.id });
  },

  deleteSaved: (id) => {
    deleteUserRotation(id);
    const state = get();
    if (state.loadedRotationId === id) {
      set({
        name: '',
        abilities: [],
        offGcdActions: {},
        isDirty: false,
        loadedRotationId: null,
      });
    }
  },

  getAllRotations: () => {
    return [...builtInRotations, ...getUserRotations()];
  },
}));
