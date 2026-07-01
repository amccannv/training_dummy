import { useEffect, useState } from 'react';
import { useKeybindStore } from '../store/keybindStore';
import type { Keybind } from '../types';

export interface ConflictInfo {
  actionId: string;
  time: number;
}

const MODIFIER_KEYS = new Set(['Control', 'Shift', 'Alt', 'Meta']);

export function useKeybindCapture() {
  const capturingActionId = useKeybindStore((s) => s.capturingActionId);
  const setBinding = useKeybindStore((s) => s.setBinding);
  const startCapture = useKeybindStore((s) => s.startCapture);
  const stopCapture = useKeybindStore((s) => s.stopCapture);

  const [conflict, setConflict] = useState<ConflictInfo | null>(null);

  useEffect(() => {
    if (!capturingActionId) return;

    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.key === 'Escape') {
        stopCapture();
        return;
      }

      if (MODIFIER_KEYS.has(e.key)) return;

      const keybind: Keybind = {
        code: e.code,
        ctrl: e.ctrlKey,
        shift: e.shiftKey,
        alt: e.altKey,
        meta: e.metaKey,
      };

      const result = setBinding(capturingActionId, keybind);
      if (!result.success) {
        setConflict({ actionId: result.conflictId, time: Date.now() });
      }
    };

    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [capturingActionId, setBinding, stopCapture]);

  useEffect(() => {
    if (!conflict) return;
    const timer = setTimeout(() => setConflict(null), 2000);
    return () => clearTimeout(timer);
  }, [conflict]);

  return { capturingActionId, conflict, startCapture, stopCapture };
}
