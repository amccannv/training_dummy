import { useMemo } from 'react';
import type { ActionCategory } from '../../types';
import { actions } from '../../data/actions';
import { useKeybindStore } from '../../store/keybindStore';
import { useKeybindCapture } from '../../hooks/useKeybindCapture';
import ActionRow from './ActionRow';
import './KeybindEditor.css';

const CATEGORY_ORDER: ActionCategory[] = [
  'ranged:basic',
  'ranged:threshold',
  'ranged:ultimate',
  'eof',
  'special',
  'prayer',
];

const CATEGORY_LABELS: Record<ActionCategory, string> = {
  'ranged:basic': 'Ranged Basic Abilities',
  'ranged:threshold': 'Ranged Threshold Abilities',
  'ranged:ultimate': 'Ranged Ultimate Abilities',
  'eof': 'EOF Activation',
  'special': 'Weapon Special Attacks',
  'prayer': 'Prayers',
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
  const { capturingActionId, conflict, startCapture } = useKeybindCapture();

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
    </div>
  );
}
