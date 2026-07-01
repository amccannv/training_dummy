import { useMemo } from 'react';
import type { ActionCategory, Keybind } from '../../types';
import { actions } from '../../data/actions';
import { useKeybindStore } from '../../store/keybindStore';
import { useKeybindCapture } from '../../hooks/useKeybindCapture';
import ActionRow from './ActionRow';
import Keyboard, { type KeyBindingInfo } from '../shared/Keyboard';
import './KeybindEditor.css';

const CATEGORY_ORDER: ActionCategory[] = [
  'ranged:basic',
  'ranged:threshold',
  'ranged:ultimate',
  'ranged:utility',
  'constitution:basic',
  'constitution:threshold',
  'constitution:special',
  'constitution:ultimate',
  'defence:basic',
  'defence:threshold',
  'defence:ultimate',
  'prayer',
];

const CATEGORY_LABELS: Record<ActionCategory, string> = {
  'ranged:basic': 'Ranged Basic',
  'ranged:threshold': 'Ranged Threshold',
  'ranged:ultimate': 'Ranged Ultimate',
  'ranged:utility': 'Ranged Utility',
  'constitution:basic': 'Constitution Basic',
  'constitution:threshold': 'Constitution Threshold',
  'constitution:special': 'Constitution Special',
  'constitution:ultimate': 'Constitution Ultimate',
  'defence:basic': 'Defence Basic',
  'defence:threshold': 'Defence Threshold',
  'defence:ultimate': 'Defence Ultimate',
  'prayer': 'Overhead Prayers',
};

function groupByCategory() {
  const groups: Map<ActionCategory, typeof actions> = new Map();
  for (const cat of CATEGORY_ORDER) {
    groups.set(cat, []);
  }
  for (const action of actions) {
    const group = groups.get(action.category);
    if (group) group.push(action);
  }
  return groups;
}

export default function KeybindEditor() {
  const groups = useMemo(() => groupByCategory(), []);
  const clearAll = useKeybindStore((s) => s.clearAll);
  const bindings = useKeybindStore((s) => s.bindings);
  const setBinding = useKeybindStore((s) => s.setBinding);
  const { capturingActionId, conflict, startCapture, activeModifierCode, pressedKeys } = useKeybindCapture();

  const keyMap = useMemo(() => {
    const map = new Map<string, KeyBindingInfo[]>();
    for (const [actionId, kb] of Object.entries(bindings)) {
      if (!kb) continue;
      const def = actions.find((a) => a.id === actionId);
      const info: KeyBindingInfo = {
        actionId,
        iconUrl: def?.iconUrl,
        ctrl: kb.ctrl,
        shift: kb.shift,
        alt: kb.alt,
        meta: kb.meta,
      };
      if (!map.has(kb.code)) map.set(kb.code, []);
      map.get(kb.code)!.push(info);
    }
    return map;
  }, [bindings]);

  const handleKeyClick = (code: string, modCode: string | null) => {
    if (!capturingActionId) return;
    const keybind: Keybind = { code, ctrl: false, shift: false, alt: false, meta: false };
    if (modCode) {
      if (modCode === 'ControlLeft' || modCode === 'ControlRight') keybind.ctrl = true;
      if (modCode === 'ShiftLeft'   || modCode === 'ShiftRight')   keybind.shift = true;
      if (modCode === 'AltLeft'     || modCode === 'AltRight')     keybind.alt = true;
      if (modCode === 'MetaLeft'    || modCode === 'MetaRight')    keybind.meta = true;
    }
    setBinding(capturingActionId, keybind);
  };

  return (
    <div className="keybind-editor">
      <div className="editor-header">
        <h2>Keybind Editor</h2>
        <button className="btn-clear-all" onClick={clearAll}>
          Clear All
        </button>
      </div>

      {CATEGORY_ORDER.map((category) => {
        const categoryActions = groups.get(category);
        if (!categoryActions || categoryActions.length === 0) return null;

        return (
          <section key={category} className="category-section">
            <h3 className="category-heading">{CATEGORY_LABELS[category]}</h3>
            <div className="category-actions">
              {categoryActions.map((action) => (
                <ActionRow
                  key={action.id}
                  action={action}
                  isCapturing={capturingActionId === action.id}
                  conflict={conflict}
                  onStartCapture={startCapture}
                />
              ))}
            </div>
          </section>
        );
      })}

      <div className="keyboard-wrapper">
        <Keyboard
          keyMap={keyMap}
          expectedKeys={new Set()}
          pressedKeys={pressedKeys}
          hitKeyCode={null}
          missKeyCode={null}
          interactive={true}
          onKeyClick={handleKeyClick}
          activeModifierCode={activeModifierCode}
        />
      </div>
    </div>
  );
}
