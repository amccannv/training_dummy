import { useEffect, useState, useRef } from 'react';
import { useKeybindStore } from '../store/keybindStore';
import type { Keybind } from '../types';

export interface ConflictInfo {
  actionId: string;
  time: number;
}

const MODIFIER_KEYS = new Set(['Control', 'Shift', 'Alt', 'Meta']);

const MODIFIER_CODES = new Set([
  'ControlLeft', 'ControlRight',
  'ShiftLeft', 'ShiftRight',
  'AltLeft', 'AltRight',
  'MetaLeft', 'MetaRight',
]);

function isModifierCode(code: string): boolean {
  return MODIFIER_CODES.has(code);
}

function modifierPair(code: string): string | null {
  switch (code) {
    case 'ShiftLeft': return 'ShiftRight';
    case 'ShiftRight': return 'ShiftLeft';
    case 'ControlLeft': return 'ControlRight';
    case 'ControlRight': return 'ControlLeft';
    case 'AltLeft': return 'AltRight';
    case 'AltRight': return 'AltLeft';
    case 'MetaLeft': return 'MetaRight';
    case 'MetaRight': return 'MetaLeft';
    default: return null;
  }
}

export function useKeybindCapture() {
  const capturingActionId = useKeybindStore((s) => s.capturingActionId);
  const setBinding = useKeybindStore((s) => s.setBinding);
  const startCapture = useKeybindStore((s) => s.startCapture);
  const stopCapture = useKeybindStore((s) => s.stopCapture);

  const [conflict, setConflict] = useState<ConflictInfo | null>(null);
  const [activeModifierCode, setActiveModifierCode] = useState<string | null>(null);
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  const modStackRef = useRef<string[]>([]);
  const heldModCodesRef = useRef<Set<string>>(new Set());

  // Reset visual state when capture ends (cleanup after binding assignment)
  useEffect(() => {
    if (!capturingActionId) {
      setActiveModifierCode(null);
      setPressedKeys(new Set());
      modStackRef.current = [];
    }
  }, [capturingActionId]);

  // Single effect: always track pressed keys for visual feedback,
  // plus capture logic when capturingActionId is set
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.code === 'Tab') e.preventDefault();

      setPressedKeys((prev) => {
        const next = new Set(prev);
        next.add(e.code);
        const pair = modifierPair(e.code);
        if (pair) next.add(pair);
        return next;
      });

      if (isModifierCode(e.code)) {
        heldModCodesRef.current.add(e.code);
        modStackRef.current = modStackRef.current.filter(c => c !== e.code);
        modStackRef.current.push(e.code);
        setActiveModifierCode(e.code);
        return;
      }

      // Capture-specific: only intercept keys when actively capturing
      const currentCapture = useKeybindStore.getState().capturingActionId;
      if (!currentCapture) {
        if (MODIFIER_KEYS.has(e.key)) return;
        return; // just track, don't capture
      }

      e.preventDefault();
      e.stopPropagation();

      if (e.key === 'Escape') {
        stopCapture();
        return;
      }

      if (MODIFIER_KEYS.has(e.key)) return;

      // Build keybind with only the last-pressed modifier
      const keybind: Keybind = { code: e.code, ctrl: false, shift: false, alt: false, meta: false };
      const stack = modStackRef.current;
      if (stack.length > 0) {
        const lastMod = stack[stack.length - 1];
        switch (lastMod) {
          case 'ControlLeft': case 'ControlRight': keybind.ctrl = true; break;
          case 'ShiftLeft':   case 'ShiftRight':   keybind.shift = true; break;
          case 'AltLeft':     case 'AltRight':     keybind.alt = true; break;
          case 'MetaLeft':    case 'MetaRight':    keybind.meta = true; break;
        }
      }

      const result = setBinding(currentCapture, keybind);
      if (!result.success) {
        setConflict({ actionId: result.conflictId, time: Date.now() });
      }
    };

    const onUp = (e: KeyboardEvent) => {
      if (isModifierCode(e.code)) {
        heldModCodesRef.current.delete(e.code);
      }
      setPressedKeys((prev) => {
        const next = new Set(prev);
        next.delete(e.code);
        const pair = modifierPair(e.code);
        if (pair && !heldModCodesRef.current.has(e.code) && !heldModCodesRef.current.has(pair)) {
          next.delete(pair);
        }
        return next;
      });

      if (isModifierCode(e.code)) {
        modStackRef.current = modStackRef.current.filter(c => c !== e.code);
        if (modStackRef.current.length === 0) {
          setActiveModifierCode(null);
        } else {
          setActiveModifierCode(modStackRef.current[modStackRef.current.length - 1]);
        }
      }
    };

    window.addEventListener('keydown', onDown, true);
    window.addEventListener('keyup', onUp, true);
    return () => {
      window.removeEventListener('keydown', onDown, true);
      window.removeEventListener('keyup', onUp, true);
    };
  }, [setBinding, stopCapture]);

  useEffect(() => {
    if (!conflict) return;
    const timer = setTimeout(() => setConflict(null), 2000);
    return () => clearTimeout(timer);
  }, [conflict]);

  return { capturingActionId, conflict, startCapture, stopCapture, activeModifierCode, pressedKeys };
}
