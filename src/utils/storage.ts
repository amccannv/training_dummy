import type { StoredUserRotations, Rotation } from '../types';

const PREFIX = 'rs3-';

export function getItem<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

export function removeItem(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    // noop
  }
}

const USER_ROTATIONS_KEY = 'user-rotations';

export function getUserRotations(): Rotation[] {
  const stored = getItem<StoredUserRotations>(USER_ROTATIONS_KEY);
  return stored?.rotations ?? [];
}

export function saveUserRotation(rotation: Rotation): void {
  const stored = getItem<StoredUserRotations>(USER_ROTATIONS_KEY)
    ?? { version: 1, rotations: [] };
  const idx = stored.rotations.findIndex((r) => r.id === rotation.id);
  if (idx >= 0) {
    stored.rotations[idx] = rotation;
  } else {
    stored.rotations.push(rotation);
  }
  setItem(USER_ROTATIONS_KEY, stored);
}

export function deleteUserRotation(id: string): void {
  const stored = getItem<StoredUserRotations>(USER_ROTATIONS_KEY);
  if (!stored) return;
  stored.rotations = stored.rotations.filter((r) => r.id !== id);
  setItem(USER_ROTATIONS_KEY, stored);
}
