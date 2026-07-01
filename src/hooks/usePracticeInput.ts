import { useEffect, useState, useRef } from 'react';
import { usePracticeStore } from '../store/practiceStore';
import { useKeybindStore } from '../store/keybindStore';
import { playHitSound, playMissSound } from '../utils/audio';

export interface PracticeFeedback {
  type: 'hit' | 'miss';
  actionId: string | null;
  id: number;
}

const MODIFIER_KEYS = new Set(['Control', 'Shift', 'Alt', 'Meta']);

export function usePracticeInput(): PracticeFeedback | null {
  const [feedback, setFeedback] = useState<PracticeFeedback | null>(null);
  const feedbackIdRef = useRef(0);

  const sessionActive = usePracticeStore((s) => s.sessionActive);
  const handleKeypress = usePracticeStore((s) => s.handleKeypress);
  const getBinding = useKeybindStore((s) => s.getBinding);

  useEffect(() => {
    if (!sessionActive) return;

    const handler = (e: KeyboardEvent) => {
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
          type: result.type,
          actionId: result.type === 'hit' ? result.actionId : null,
          id,
        });

        if (result.type === 'hit') {
          playHitSound();
        } else {
          playMissSound();
        }
      }
    };

    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [sessionActive, handleKeypress, getBinding]);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 250);
    return () => clearTimeout(timer);
  }, [feedback]);

  return feedback;
}
