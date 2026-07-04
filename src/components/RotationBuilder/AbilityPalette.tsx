import { useState, useMemo, useEffect } from 'react';
import type { ActionCategory } from '../../types';
import { actions } from '../../data/actions';
import PaletteItem from './PaletteItem';

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
  'magic:basic': 'Basic', 'magic:threshold': 'Threshold', 'magic:ultimate': 'Ultimate',
  'ranged:basic': 'Basic', 'ranged:threshold': 'Threshold', 'ranged:ultimate': 'Ultimate',
  'melee:basic': 'Basic', 'melee:threshold': 'Threshold', 'melee:ultimate': 'Ultimate',
  'necro:basic': 'Basic', 'necro:threshold': 'Threshold', 'necro:ultimate': 'Ultimate',
  'constitution:basic': 'Basic', 'constitution:threshold': 'Threshold', 'constitution:special': 'Special', 'constitution:ultimate': 'Ultimate',
  'defence:basic': 'Basic', 'defence:threshold': 'Threshold', 'defence:ultimate': 'Ultimate',
  'items:consume': 'Consumables', 'items:equipment': 'Equipment',
  'utility': 'Utility', 'prayer': 'Prayers',
};

const GROUP_DEFS: { label: string; categories: ActionCategory[] }[] = [
  { label: 'Magic', categories: ['magic:basic', 'magic:threshold', 'magic:ultimate'] },
  { label: 'Ranged', categories: ['ranged:basic', 'ranged:threshold', 'ranged:ultimate'] },
  { label: 'Melee', categories: ['melee:basic', 'melee:threshold', 'melee:ultimate'] },
  { label: 'Necromancy', categories: ['necro:basic', 'necro:threshold', 'necro:ultimate'] },
  { label: 'Constitution', categories: ['constitution:basic', 'constitution:threshold', 'constitution:special', 'constitution:ultimate'] },
  { label: 'Defensives', categories: ['defence:basic', 'defence:threshold', 'defence:ultimate'] },
  { label: 'Items', categories: ['items:consume', 'items:equipment'] },
  { label: 'Utility', categories: ['utility'] },
];

const STORAGE_KEY = 'rs3-builder-sections';

function loadCollapsed(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch { /* ignore */ }
  return new Set(CATEGORY_ORDER);
}

export default function AbilityPalette() {
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState<Set<string>>(loadCollapsed);

  const grouped = useMemo(() => {
    const map = new Map<ActionCategory, string[]>();
    for (const cat of CATEGORY_ORDER) {
      map.set(cat, []);
    }
    const lowerSearch = search.toLowerCase();
    for (const action of actions) {
      if (!map.has(action.category)) continue;
      if (lowerSearch && !action.name.toLowerCase().includes(lowerSearch)) continue;
      map.get(action.category)!.push(action.id);
    }
    return map;
  }, [search]);

  const effectiveCollapsed = useMemo(() => {
    if (!search) return collapsed;
    return new Set<ActionCategory>();
  }, [search, collapsed]);

  const toggleCategory = (cat: ActionCategory) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...collapsed]));
  }, [collapsed]);

  return (
    <div className="ability-palette">
      <input
        className="palette-search"
        type="text"
        placeholder="Search actions..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="palette-groups">
        {GROUP_DEFS.map((group) => {
          const hasVisible = group.categories.some((cat) => {
            const ids = grouped.get(cat);
            return ids && ids.length > 0;
          });
          if (!hasVisible) return null;

          return (
            <div key={group.label} className="palette-group">
              <div className="palette-group-header">{group.label}</div>
              {group.categories.map((cat) => {
                const ids = grouped.get(cat);
                const isCollapsed = effectiveCollapsed.has(cat);

                if (!ids || ids.length === 0) {
                  if (!search) return null;
                  // show empty categories when searching
                }

                return (
                  <div key={cat} className="palette-category">
                    <button
                      className="palette-category-toggle"
                      onClick={() => toggleCategory(cat)}
                      type="button"
                    >
                      <span className="palette-arrow">
                        {isCollapsed ? '\u25B6' : '\u25BC'}
                      </span>
                      <span className="palette-cat-label">{CATEGORY_LABELS[cat]}</span>
                      {ids && <span className="palette-cat-count">{ids.length}</span>}
                    </button>
                    {!isCollapsed && ids && (
                      <div className="palette-category-items">
                        {ids.map((id) => (
                          <PaletteItem key={id} actionId={id} category={cat} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
