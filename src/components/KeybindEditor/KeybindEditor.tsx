import { useMemo, useState, useEffect, useRef } from 'react';
import type { ActionCategory, Keybind } from '../../types';
import { actions } from '../../data/actions';
import { useKeybindStore } from '../../store/keybindStore';
import { useKeybindCapture } from '../../hooks/useKeybindCapture';
import ActionRow from './ActionRow';
import Keyboard, { type KeyBindingInfo } from '../shared/Keyboard';
import './KeybindEditor.css';

const CATEGORY_ORDER: ActionCategory[] = [
  'magic:basic', 'magic:threshold', 'magic:ultimate',
  'ranged:basic', 'ranged:threshold', 'ranged:ultimate',
  'melee:basic', 'melee:threshold', 'melee:ultimate',
  'necro:basic', 'necro:threshold', 'necro:ultimate',
  'constitution:basic', 'constitution:threshold', 'constitution:special', 'constitution:ultimate',
  'defence:basic', 'defence:threshold', 'defence:ultimate',
  'items:consume', 'items:equipment',
  'utility', 'prayer',
];

const CATEGORY_LABELS: Record<ActionCategory, string> = {
  'magic:basic': 'Basic',
  'magic:threshold': 'Threshold',
  'magic:ultimate': 'Ultimate',
  'ranged:basic': 'Basic',
  'ranged:threshold': 'Threshold',
  'ranged:ultimate': 'Ultimate',
  'melee:basic': 'Basic',
  'melee:threshold': 'Threshold',
  'melee:ultimate': 'Ultimate',
  'necro:basic': 'Basic',
  'necro:threshold': 'Threshold',
  'necro:ultimate': 'Ultimate',
  'constitution:basic': 'Basic',
  'constitution:threshold': 'Threshold',
  'constitution:special': 'Special',
  'constitution:ultimate': 'Ultimate',
  'defence:basic': 'Basic',
  'defence:threshold': 'Threshold',
  'defence:ultimate': 'Ultimate',
  'items:consume': 'Consumables',
  'items:equipment': 'Equipment',
  'utility': 'Utility',
  'prayer': 'Prayers',
};

interface StyleGroup {
  label: string;
  categories: ActionCategory[];
}

const TOP_GROUPS: StyleGroup[] = [
  { label: 'Magic', categories: ['magic:basic', 'magic:threshold', 'magic:ultimate'] },
  { label: 'Ranged', categories: ['ranged:basic', 'ranged:threshold', 'ranged:ultimate'] },
  { label: 'Melee', categories: ['melee:basic', 'melee:threshold', 'melee:ultimate'] },
  { label: 'Necromancy', categories: ['necro:basic', 'necro:threshold', 'necro:ultimate'] },
];

const BOTTOM_GROUPS: StyleGroup[] = [
  { label: 'Constitution', categories: ['constitution:basic', 'constitution:threshold', 'constitution:special', 'constitution:ultimate'] },
  { label: 'Defensives', categories: ['defence:basic', 'defence:threshold', 'defence:ultimate'] },
  { label: 'Items', categories: ['items:consume', 'items:equipment'] },
  { label: 'Prayers', categories: ['prayer'] },
  { label: 'Utility', categories: ['utility'] },
];

const COLLAPSE_STORAGE_KEY = 'rs3-editor-sections';

function loadCollapsed(): Set<string> {
  try {
    const raw = localStorage.getItem(COLLAPSE_STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set<string>();
  } catch {
    return new Set<string>();
  }
}

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
  const [collapsed, setCollapsed] = useState<Set<string>>(loadCollapsed);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const clearAll = useKeybindStore((s) => s.clearAll);
  const bindings = useKeybindStore((s) => s.bindings);
  const setBinding = useKeybindStore((s) => s.setBinding);
  const { capturingActionId, conflict, startCapture, activeModifierCode, pressedKeys } = useKeybindCapture();
  const clearAllRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showClearConfirm) return;
    const onDocumentClick = (e: MouseEvent) => {
      if (clearAllRef.current && !clearAllRef.current.contains(e.target as Node)) {
        setShowClearConfirm(false);
      }
    };
    document.addEventListener('click', onDocumentClick, true);
    return () => document.removeEventListener('click', onDocumentClick, true);
  }, [showClearConfirm]);

  useEffect(() => {
    localStorage.setItem(COLLAPSE_STORAGE_KEY, JSON.stringify([...collapsed]));
  }, [collapsed]);

  const toggleCollapse = (key: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

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

  const renderCategorySection = (category: ActionCategory) => {
    const categoryActions = groups.get(category);
    if (!categoryActions || categoryActions.length === 0) return null;
    const isCollapsed = collapsed.has(category);

    return (
      <div key={category} className="category-section">
        <button
          className="category-toggle"
          onClick={() => toggleCollapse(category)}
          type="button"
        >
          <span className="category-arrow">{isCollapsed ? '\u25B6' : '\u25BC'}</span>
          <span className="category-label">{CATEGORY_LABELS[category]}</span>
          <span className="category-count">{categoryActions.length}</span>
        </button>
        {!isCollapsed && (
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
        )}
      </div>
    );
  };

  const renderStyleColumn = (group: StyleGroup) => (
    <div key={group.label} className="style-column">
      <div className="style-heading">{group.label}</div>
      {group.categories.map((cat) => renderCategorySection(cat))}
    </div>
  );

  return (
    <div className="keybind-editor">
      <div className="editor-header">
        <h2>Keybind Editor</h2>
        <div className="clear-all-wrapper" ref={clearAllRef}>
          <button className="btn-clear-all" onClick={() => setShowClearConfirm(true)}>
            Clear All
          </button>
          {showClearConfirm && (
            <div className="clear-confirm">
              <span className="clear-confirm-text">Clear all keybinds?</span>
              <div className="clear-confirm-actions">
                <button
                  className="clear-confirm-cancel"
                  onClick={() => setShowClearConfirm(false)}
                >
                  Cancel
                </button>
                <button
                  className="clear-confirm-do"
                  onClick={() => { clearAll(); setShowClearConfirm(false); }}
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="editor-grid">
        <div className="editor-top-row">
          {TOP_GROUPS.map((group) => renderStyleColumn(group))}
        </div>
        <div className="editor-bottom-row">
          {BOTTOM_GROUPS.map((group) => renderStyleColumn(group))}
        </div>
      </div>

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
          unit={52}
        />
      </div>
    </div>
  );
}
