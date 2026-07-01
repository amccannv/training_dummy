import { useEffect, useState, useRef, useCallback } from 'react';
import { usePracticeStore } from '../store/practiceStore';
import { useKeybindStore } from '../store/keybindStore';
import { playHitSound, playMissSound } from '../utils/audio';

export type FeedbackQuality = 'instant' | 'perfect' | 'early';

export interface PracticeFeedback {
  type: 'hit' | 'miss';
  actionId: string | null;
  keyCode: string;
  offsetMs?: number;
  reason?: 'wrong-action' | 'wrong-timing';
  quality?: FeedbackQuality;
  id: number;
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

export function usePracticeInput() {
  const [feedback, setFeedback] = useState<PracticeFeedback | null>(null);
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  const [activeModifierCode, setActiveModifierCode] = useState<string | null>(null);
  const feedbackIdRef = useRef(0);
  const modStackRef = useRef<string[]>([]);

  const sessionActive = usePracticeStore((s) => s.sessionActive);
  const handleKeypress = usePracticeStore((s) => s.handleKeypress);
  const getBinding = useKeybindStore((s) => s.getBinding);

  const addPressed = useCallback((code: string) => {
    setPressedKeys((prev) => {
      if (prev.has(code)) return prev;
      const next = new Set(prev);
      next.add(code);
      return next;
    });
  }, []);

  const removePressed = useCallback((code: string) => {
    setPressedKeys((prev) => {
      if (!prev.has(code)) return prev;
      const next = new Set(prev);
      next.delete(code);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!sessionActive) return;

    const onDown = (e: KeyboardEvent) => {
      addPressed(e.code);

      if (isModifierCode(e.code)) {
        modStackRef.current = modStackRef.current.filter(c => c !== e.code);
        modStackRef.current.push(e.code);
        setActiveModifierCode(e.code);
        return;
      }

      if (MODIFIER_KEYS.has(e.key)) return;

      e.preventDefault();
      e.stopPropagation();

      const keybind = {
        code: e.code,
        ctrl: e.ctrlKey,
        shift: e.shiftKey,
        alt: e.altKey,
        meta: e.metaKey,
      };

      const result = handleKeypress(keybind, getBinding);

      if (result.type !== 'ignored') {
        const id = ++feedbackIdRef.current;
        setFeedback({
          type: result.type === 'prayer-toggle' ? 'hit' : result.type,
          actionId: result.type === 'hit' || result.type === 'prayer-toggle' ? result.actionId : null,
          keyCode: e.code,
          offsetMs: result.type === 'hit' ? result.offsetMs : undefined,
          reason: result.type === 'miss' ? result.reason : undefined,
          quality: result.type === 'hit' ? result.quality : undefined,
          id,
        });

        if (result.type === 'hit') {
          playHitSound();
        } else if (result.type === 'miss') {
          playMissSound();
        }
        // prayer-toggle: no audio
      }
    };

    const onUp = (e: KeyboardEvent) => {
      removePressed(e.code);

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
  }, [sessionActive, handleKeypress, getBinding, addPressed, removePressed]);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 250);
    return () => clearTimeout(timer);
  }, [feedback]);

  return { feedback, pressedKeys, activeModifierCode };
}
