import { useEffect, useState, useRef } from 'react';
import { usePracticeStore } from '../store/practiceStore';
import { useKeybindStore } from '../store/keybindStore';
import { playHitSound, playMissSound, playAbilitySound } from '../utils/audio';
import { getActionById } from '../data/actions';

export interface PracticeFeedback {
  type: 'hit' | 'miss';
  actionId: string | null;
  keyCode: string;
  reason?: 'wrong-action' | 'wrong-timing' | 'gcd-locked';
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

export function usePracticeInput() {
  const [feedback, setFeedback] = useState<PracticeFeedback | null>(null);
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  const [activeModifierCode, setActiveModifierCode] = useState<string | null>(null);
  const feedbackIdRef = useRef(0);
  const modStackRef = useRef<string[]>([]);
  const heldModCodesRef = useRef<Set<string>>(new Set());

  const sessionActive = usePracticeStore((s) => s.sessionActive);
  const handleKeypress = usePracticeStore((s) => s.handleKeypress);
  const getBinding = useKeybindStore((s) => s.getBinding);

  useEffect(() => {
    if (!sessionActive) return;

    const onDown = (e: KeyboardEvent) => {
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

      if (MODIFIER_KEYS.has(e.key)) return;

      e.preventDefault();
      e.stopPropagation();

      const keybind: { code: string; ctrl: boolean; shift: boolean; alt: boolean; meta: boolean } = {
        code: e.code, ctrl: false, shift: false, alt: false, meta: false,
      };
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

      const result = handleKeypress(keybind, getBinding);

      if (result.type !== 'ignored') {
        if (result.type === 'prayer-change') {
          const def = getActionById(result.actionId);
          if (def?.soundUrl) playAbilitySound(def.soundUrl);
          return;
        }

        const id = ++feedbackIdRef.current;
        setFeedback({
          type: result.type,
          actionId: result.type === 'hit' ? result.actionId : null,
          keyCode: e.code,
          reason: result.type === 'miss' ? result.reason : undefined,
          id,
        });

        if (result.type === 'hit') {
          playHitSound();
          const def = getActionById(result.actionId);
          if (def?.soundUrl) playAbilitySound(def.soundUrl);
        } else if (result.type === 'miss') {
          playMissSound();
        }
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
  }, [sessionActive, handleKeypress, getBinding]);

  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(() => setFeedback(null), 250);
    return () => clearTimeout(timer);
  }, [feedback]);

  return { feedback, pressedKeys, activeModifierCode };
}
