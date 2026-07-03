# Rotation Builder — V1 Implementation Plan

## Summary

Add a drag-and-drop rotation builder that lets users create their own ability rotations with GCD abilities and off-GCD items. Users can load built-in rotations, modify them, and save their own. Built rotations are stored locally and appear alongside built-in rotations in the practice view.

The builder produces `Rotation` objects with optional `offGcdActions` — even though the practice runtime doesn't execute off-GCD actions yet (see `docs/off-gcd-v1-plan.md`), the data structure is ready from day one.

### What's in V1

| Feature | |
|---|---|
| Drag from palette → timeline | Add GCD abilities or off-GCD items |
| Insert between slots | Drop at indicator between existing slots |
| Remove actions | X button on slots and off-GCD tags |
| Reorder slots | Up/down arrow buttons |
| Off-GCD support (data) | Items dropped onto a slot attach as off-GCD; produces `offGcdActions` on `Rotation` |
| Rotation management | Save, load (built-in + user), rename, delete, duplicate |
| Persistence | `rs3-user-rotations` in localStorage |
| Practice integration | User rotations appear in practice screen alongside built-in |

### What's out (deferred)

- Drag-to-reorder within the timeline (use arrow buttons instead)
- Bulk import/export (JSON copy-paste could be added later)
- Rotation validation (e.g., adrenaline requirements, style compatibility)
- Mobile/touch support (desktop-only app)
- Runtime execution of off-GCD actions (see off-GCD v1 plan)

---

## Architecture

### Data Flow

```
Palette (drag source)                    Timeline (drop target)
┌────────────────────┐          ┌─────────────────────────────┐
│ actions.ts         │          │  rotationBuilderStore.ts    │
│   ↓                │  DnD     │   (ephemeral Zustand store) │
│ Palette reads      │ ──────→  │   abilities: string[]       │
│ ActionDefinition[] │          │   offGcdActions: Record     │
│ + KeybindStore     │          │       .buildRotation()      │
└────────────────────┘          └──────────┬──────────────────┘
                                           │ save
                                           ▼
                                    localStorage
                                    rs3-user-rotations
                                           │ load
                                           ▼
                                    PracticeView.tsx
                                    (merged with built-in)
```

### Rotation ID Scheme

- Built-in: arbitrary strings (e.g. `'one-minute-ranged-drill'`)
- User-created: `user-{Date.now()}` to guarantee uniqueness

### Palette Groups

Mirrors the keybind editor's `CATEGORY_ORDER`, with the new `items:*` categories included:

```
Magic        (basic / threshold / ultimate)
Ranged       (basic / threshold / ultimate)
Melee        (basic / threshold / ultimate)
Necromancy   (basic / threshold / ultimate)
Constitution (basic / threshold / special / ultimate)
Defensives   (basic / threshold / ultimate)
Items        (consumables / equipment / target)
Prayers
Utility
```

Each group is a collapsible column section. Each item shows icon + name + bound key (from `keybindStore`).

---

## File-by-File Changes

### 1. `src/types/index.ts`

**Add categories:**
```typescript
export type ActionCategory =
  | /* existing categories... */
  | 'items:consume' | 'items:equipment' | 'items:target';
```

**Add `offGcdActions` to `Rotation`:**
```typescript
export interface Rotation {
  id: string;
  name: string;
  abilities: string[];
  offGcdActions?: Record<number, string[]>;  // ability index → off-GCD action IDs
}
```

**Add persistence type:**
```typescript
export interface StoredUserRotations {
  version: 1;
  rotations: Rotation[];
}
```

### 2. `src/data/actions.ts`

Add 5 new item action definitions after the prayers section:

```typescript
// ── Items: Consumables ──
{ id: 'VulnBomb', name: 'Vuln Bomb', category: 'items:consume', durationTicks: 0, isChanneled: false },
{ id: 'AdrenalineRenewal', name: 'Adrenaline Renewal', category: 'items:consume', durationTicks: 0, isChanneled: false },

// ── Items: Equipment ──
{ id: 'EofSwap', name: 'EOF Swap', category: 'items:equipment', durationTicks: 0, isChanneled: false },
{ id: 'AmmoSwap', name: 'Ammo Swap', category: 'items:equipment', durationTicks: 0, isChanneled: false },

// ── Items: Target ──
{ id: 'TargetCycle', name: 'Target Cycle', category: 'items:target', durationTicks: 0, isChanneled: false },
```

No icons or sounds for now. These actions appear in the builder palette and can be keybound in the editor.

### 3. `src/utils/storage.ts`

Add rotation CRUD helpers using the existing `getItem`/`setItem`/`removeItem`:

```typescript
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
```

### 4. `src/store/rotationBuilderStore.ts` (new)

Zustand store for ephemeral builder state. NOT persisted — only saved `Rotation` objects go to localStorage.

```typescript
import { create } from 'zustand';
import { getUserRotations, saveUserRotation, deleteUserRotation } from '../utils/storage';
import type { Rotation } from '../types';

interface RotationBuilderState {
  name: string;
  abilities: string[];
  offGcdActions: Record<number, string[]>;
  isDirty: boolean;
  loadedRotationId: string | null;

  setName: (name: string) => void;
  setAbility: (index: number, abilityId: string) => void;
  insertAbility: (index: number, abilityId: string) => void;
  removeAbility: (index: number) => void;
  moveAbility: (fromIndex: number, toIndex: number) => void;
  addOffGcdAction: (abilityIndex: number, actionId: string) => void;
  removeOffGcdAction: (abilityIndex: number, actionId: string) => void;
  loadRotation: (rotation: Rotation) => void;
  clearBuilder: () => void;
  buildRotation: () => Rotation;
  saveRotation: () => void;
  deleteSavedRotation: (id: string) => void;
  getAllRotations: () => Rotation[];
}
```

Key behavior:
- `insertAbility(index, abilityId)`: inserts at position, shifts existing. If `index == abilities.length`, appends.
- `removeAbility(index)`: removes GCD ability AND its off-GCD actions, shifts remaining offGcdActions indices down.
- `moveAbility(from, to)`: swaps the ability. Its off-GCD actions move with it.
- `addOffGcdAction(index, actionId)`: appends to `offGcdActions[index]`, creating the array if needed.
- `removeOffGcdAction(index, actionId)`: filters out the action. Removes the key if array becomes empty.
- `loadRotation(rotation)`: copies all data into builder state. Sets `loadedRotationId` to `rotation.id`.
- `clearBuilder()`: resets to empty defaults.
- `buildRotation()`: returns a `Rotation` object. New rotation gets `id: 'user-{Date.now()}'`. Existing reuses `loadedRotationId`.
- `saveRotation()`: calls `buildRotation()` then `saveUserRotation()`. Sets `isDirty = false`.
- `deleteSavedRotation(id)`: calls `deleteUserRotation`. If currently loaded, calls `clearBuilder()`.
- `getAllRotations()`: returns `[...builtInRotations, ...getUserRotations()]` for the load dropdown.
- `isDirty` is set to `true` on any mutation (name, abilities, offGcdActions).

### 5. `src/App.tsx`

Add third tab:

```typescript
type Mode = 'practice' | 'builder' | 'edit';
```

```tsx
<nav className="mode-nav">
  <button className={mode === 'practice' ? 'active' : ''} onClick={() => setMode('practice')}>
    Practice
  </button>
  <button className={mode === 'builder' ? 'active' : ''} onClick={() => setMode('builder')}>
    Builder
  </button>
  <button className={mode === 'edit' ? 'active' : ''} onClick={() => setMode('edit')}>
    Edit Keybinds
  </button>
</nav>
```

```tsx
<main className="app-main">
  {mode === 'practice' && <PracticeView />}
  {mode === 'builder' && <RotationBuilder />}
  {mode === 'edit' && <KeybindEditor />}
</main>
```

Warn before switching away from builder if dirty (use `window.confirm`).

### 6. `src/components/RotationBuilder/RotationBuilder.tsx` (new)

Main layout:

```tsx
export default function RotationBuilder() {
  return (
    <div className="rotation-builder">
      <BuilderToolbar />
      <div className="builder-body">
        <AbilityPalette />
        <RotationTimeline />
      </div>
    </div>
  );
}
```

Layout: toolbar (full width) → below: palette (300px fixed) + timeline (flex: 1). Both independently scrollable.

Empty state when abilities is empty: a centered prompt "Drag abilities from the palette to start building" with a subtle arrow.

Handles unsaved-changes warnings via `beforeunload` event and tab-switch confirmation dialog.

### 7. `src/components/RotationBuilder/BuilderToolbar.tsx` (new)

```
┌─────────────────────────────────────────────────────────────────────┐
│  Rotation Name [_____________________________________]             │
│  [Save] [Load ▾] [Duplicate] [Clear] [Delete]                     │
│                                                                     │
│  12 actions · ~36.0s est. duration                                  │
└─────────────────────────────────────────────────────────────────────┘
```

States:
- **New rotation**: name blank, Save enabled if abilities non-empty, Delete hidden
- **Editing existing**: name populated, Save enabled, Delete visible
- **After save**: brief "Saved!" toast (2s, fades out)

Load dropdown:
- "Built-in Rotations" header → list of built-in rotations
- Separator
- "My Rotations" header → list of user rotations (if any)
- Each item shows name + ability count
- Click loads into builder (prompts if dirty)

Duplicate: clones current state with "(Copy)" appended to name, clears `loadedRotationId`.

Clear: resets builder. Confirms if dirty.

Delete: removes from localStorage. Confirms. If currently loaded, clears builder.

Save: calls `saveRotation()`. Shows toast. Disabled if name is empty or abilities is empty.

Duration estimation: uses `compileEndTick` from `compiler.ts`.

### 8. `src/components/RotationBuilder/AbilityPalette.tsx` (new)

Left sidebar, 300px, scrollable:

```
┌──────────────────────┐
│ [Search____________] │
│                      │
│ ▼ Magic              │
│   ▼ Basic (6)        │
│     [icon] G Sonic Q │
│     [icon] D Breath W│
│     [icon] G Chain E │
│     ...              │
│   ▶ Threshold (5)    │
│   ▶ Ultimate (3)     │
│                      │
│ ▼ Ranged             │
│   ...                │
│                      │
│ ▼ Items              │
│   ▼ Consumables (2)  │
│     · Vuln Bomb   B  │
│     · Adren Renewal  │
│   ▼ Equipment (2)    │
│     · EOF Swap    N  │
│     · Ammo Swap   M  │
│   ▼ Target (1)       │
│     · Target Cycle   │
│                      │
│ ▼ Prayers            │
│ ▶ Utility            │
└──────────────────────┘
```

Search: text input filters by name (case-insensitive). Matching groups auto-expand, non-matching collapse.

Each item (`PaletteItem`) is `draggable="true"`, sets drag data (actionId + category) on dragStart.

Off-GCD items (`items:*`): shown with a dot (·) placeholder for the icon and a dashed left border to visually distinguish them from ability actions.

### 9. `src/components/RotationBuilder/PaletteItem.tsx` (new)

```tsx
interface PaletteItemProps {
  action: ActionDefinition;
  keyLabel: string;
}

export default function PaletteItem({ action, keyLabel }: PaletteItemProps) {
  const onDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      actionId: action.id,
      category: action.category,
    }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const isItem = action.category.startsWith('items:');

  return (
    <div
      className={`palette-item ${isItem ? 'off-gcd' : ''}`}
      draggable
      onDragStart={onDragStart}
      title={isItem ? 'Drag onto an ability slot to add as off-GCD' : undefined}
    >
      {action.iconUrl
        ? <img className="palette-item-icon" src={action.iconUrl} alt="" />
        : <span className="palette-item-dot">·</span>}
      <span className="palette-item-name">{action.name}</span>
      {keyLabel && <span className="palette-item-key">{keyLabel}</span>}
    </div>
  );
}
```

### 10. `src/components/RotationBuilder/RotationTimeline.tsx` (new)

Right side, flex: 1, scrollable. Handles `onDragOver` at the timeline level to determine the closest insert position.

```
┌───────────────────────────────────────────────────────────┐
│                                                           │
│  ┌── #0 ──────────────────────────────────────────────┐  │
│  │  ┌──────────┐                                       │  │
│  │  │ G Sonic  │  [Key: Q]                   [✕] [▲▼] │  │
│  │  └──────────┘                                       │  │
│  │  ┌──────────┐ ┌──────────┐                         │  │
│  │  │Vuln Bomb │ │Target Cyc│                         │  │
│  │  └──────────┘ └──────────┘                         │  │
│  └─────────────────────────────────────────────────────┘  │
│  ─ ─ ─ ─ drop indicator (appears on dragOver) ─ ─ ─ ─ ─  │
│  ┌── #1 ──────────────────────────────────────────────┐  │
│  │  ┌──────────┐                                       │  │
│  │  │ D Breath │  [Key: W]                   [✕] [▲▼] │  │
│  │  └──────────┘                                       │  │
│  └─────────────────────────────────────────────────────┘  │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│  ┌── #2 ──────────────────────────────────────────────┐  │
│  │  ┌──────────┐                                       │  │
│  │  │ Wild Mag │  [Key: E]                   [✕] [▲▼] │  │
│  │  └──────────┘                                       │  │
│  │  ┌──────────┐                                       │  │
│  │  │Adren Pot │                                       │  │
│  │  └──────────┘                                       │  │
│  └─────────────────────────────────────────────────────┘  │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐  │
│  │            Drop ability here to add                 │  │
│  │               (or item for off-GCD)                 │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

**Drop routing logic:**

```typescript
const handleDragOver = (e: React.DragEvent) => {
  e.preventDefault();
  // Calculate cursor position relative to timeline container
  // Determine nearest slot index for insert indicator
  setDropIndex(nearestIndex);
};

const handleDrop = (e: React.DragEvent) => {
  e.preventDefault();
  const data = JSON.parse(e.dataTransfer.getData('application/json')) as BuilderDragData;
  
  if (data.category.startsWith('items:')) {
    // Dropped onto a slot's ability area → attach as off-GCD
    addOffGcdAction(targetSlotIndex, data.actionId);
  } else {
    // Dropped between slots → insert new GCD ability
    insertAbility(dropIndex, data.actionId);
  }
};
```

When dropping ONTO a specific slot's ability card area:
- If item category → `addOffGcdAction(slotIndex, actionId)`
- If ability category → `setAbility(slotIndex, actionId)` (replaces)

**Visual feedback on dragOver:**
- The nearest drop indicator gets `border-color: var(--accent)`, `height: 3px`, animated opacity
- The slot being hovered gets a subtle `box-shadow` highlight
- The end-of-list zone gets `border-color: var(--accent)` when hovered

### 11. `src/components/RotationBuilder/AbilitySlot.tsx` (new)

```tsx
interface AbilitySlotProps {
  index: number;
  abilityId: string;
  offGcdIds: string[];
  canMoveUp: boolean;
  canMoveDown: boolean;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemoveOffGcd: (actionId: string) => void;
  onDropAbility: (actionId: string) => void;
  onDropOffGcd: (actionId: string) => void;
}
```

Layout:
- Slot number badge (`#0`, `#1`, ...) at left edge
- Ability card: icon from `getActionById(abilityId).iconUrl` + name
- Key pill: reads from `keybindStore.bindings[abilityId]`
- Remove button (`✕`): calls `onRemove()`
- Reorder buttons (`▲▼`): disabled if at boundary, calls `onMoveUp()`/`onMoveDown()`
- Off-GCD tag row: renders `OffGcdTag` for each `offGcdIds`

### 12. `src/components/RotationBuilder/OffGcdTag.tsx` (new)

```tsx
interface OffGcdTagProps {
  actionId: string;
  onRemove: () => void;
}
```

Small pill: dot (·) + action name + `✕` button. Muted colors, 0.6875rem font. Semi-transparent background. Dashed border to indicate off-GCD nature.

### 13. `src/components/RotationBuilder/SlotDropIndicator.tsx` (new)

Thin horizontal strip that becomes visible during `dragOver`:

```tsx
interface SlotDropIndicatorProps {
  visible: boolean;
}
```

- Height: 0 normally, 3px when visible
- Background: `var(--accent)`
- Border-radius, subtle glow
- CSS transition on height/opacity

### 14. `src/components/Practice/PracticeView.tsx`

Replace the single-rotation start screen with a selector:

```tsx
const { builtIn, user } = useMemo(() => {
  const builtIn = rotations.map((r) => ({ ...r, source: 'builtin' as const }));
  const userRotations = getUserRotations().map((r) => ({ ...r, source: 'user' as const }));
  return { builtIn, user: userRotations };
}, []);
```

UI layout on start screen:
```
┌──────────────────────────────────────────────┐
│  Select a Rotation                           │
│                                              │
│  Built-in Rotations                          │
│  ┌────────────────────────────────────────┐  │
│  │ One Minute Ranged Drill                │  │
│  │ 33 abilities · ~60.0s                  │  │
│  │ [Practice] [Copy to Builder]           │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  My Rotations                                │
│  ┌────────────────────────────────────────┐  │
│  │ My Necro Sun Rotation                  │  │
│  │ 15 abilities · ~28.0s                  │  │
│  │ [Practice] [Edit in Builder] [Delete]  │  │
│  └────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────┐  │
│  │ My Ranged EOF Rot                      │  │
│  │ 22 abilities · ~42.0s                  │  │
│  │ [Practice] [Edit in Builder] [Delete]  │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ── Prayer Flick Settings ──                 │
│  ...                                         │
└──────────────────────────────────────────────┘
```

State: `selectedRotation: Rotation | null`. Clicking a rotation card selects it. Double-click or "Practice" button starts immediately.

"Copy to Builder": loads the built-in rotation into the builder store and switches tab.
"Edit in Builder": loads the user rotation into the builder store and switches tab.
"Delete": confirms, calls `deleteUserRotation`, removes from list.

The `startPractice` function takes a `Rotation` parameter instead of always using `rotations[0]`.

### 15. `src/components/KeybindEditor/KeybindEditor.tsx`

Add Items group to `BOTTOM_GROUPS`:
```typescript
{ label: 'Items', categories: ['items:consume', 'items:equipment', 'items:target'] },
```

Add labels:
```typescript
'items:consume': 'Consumables',
'items:equipment': 'Equipment',
'items:target': 'Target',
```

Add to `CATEGORY_ORDER` as well.

### 16. CSS (`src/components/RotationBuilder/RotationBuilder.css`, new)

Uses existing CSS variables. Key classes:

```css
.rotation-builder { display: flex; flex-direction: column; height: 100%; }
.builder-body { display: flex; gap: 0; flex: 1; min-height: 0; }

/* Palette */
.ability-palette { width: 300px; overflow-y: auto; border-right: 1px solid var(--border); }
.palette-search { margin: 0.5rem; }
.palette-item {
  display: flex; align-items: center; gap: 0.5rem;
  padding: 0.35rem 0.75rem; cursor: grab; user-select: none;
  transition: background 0.12s;
}
.palette-item:hover { background: var(--surface-hover); }
.palette-item.off-gcd { border-left: 2px dashed var(--text-muted); }
.palette-item-icon { width: 20px; height: 20px; object-fit: contain; }
.palette-item-dot { width: 20px; text-align: center; color: var(--text-muted); }
.palette-item-name { flex: 1; font-size: 0.8125rem; }
.palette-item-key {
  font-family: monospace; font-size: 0.625rem;
  padding: 1px 4px; border: 1px solid var(--border);
  border-radius: 3px; background: rgba(0,0,0,0.2); color: var(--text-muted);
}

/* Timeline */
.rotation-timeline { flex: 1; overflow-y: auto; padding: 0.5rem 1rem; }

/* Slot */
.ability-slot {
  border: 1px solid var(--border); border-radius: var(--radius);
  padding: 0.5rem 0.75rem; margin-bottom: 0;
  background: var(--surface);
  transition: border-color 0.15s, box-shadow 0.15s;
}
.ability-slot.drag-over {
  border-color: var(--accent);
  box-shadow: 0 0 8px rgba(88, 166, 255, 0.15);
}

/* Drop indicator */
.slot-drop-indicator {
  height: 0; opacity: 0;
  background: var(--accent); border-radius: 1px;
  transition: height 0.15s, opacity 0.15s;
}
.slot-drop-indicator.visible { height: 3px; opacity: 1; }

/* Off-GCD tag */
.off-gcd-tag {
  display: inline-flex; align-items: center; gap: 0.25rem;
  padding: 0.15rem 0.4rem; font-size: 0.6875rem;
  border: 1px dashed var(--border); border-radius: calc(var(--radius) - 2px);
  background: var(--surface); color: var(--text-muted);
}
.off-gcd-tag-remove {
  background: none; border: none; color: var(--text-muted);
  cursor: pointer; padding: 0; font-size: 0.75rem; line-height: 1;
  opacity: 0.5; transition: opacity 0.12s, color 0.12s;
}
.off-gcd-tag-remove:hover { opacity: 1; color: var(--danger); }

/* Add zone */
.add-slot-zone {
  border: 2px dashed var(--border); text-align: center;
  padding: 1rem; border-radius: var(--radius);
  color: var(--text-muted); font-size: 0.8125rem;
  transition: border-color 0.15s, background 0.15s;
}
.add-slot-zone.drag-over {
  border-color: var(--accent);
  background: rgba(88, 166, 255, 0.05);
}

/* Toolbar */
.builder-toolbar {
  padding-bottom: 1rem; border-bottom: 1px solid var(--border);
  margin-bottom: 1rem;
}
```

---

## Drag-and-Drop Specification

### Drag Data

```typescript
interface BuilderDragData {
  actionId: string;
  category: ActionCategory;
}
```

Set via `JSON.stringify(data)` in `dataTransfer.setData('application/json', ...)` on `dragStart`.

### Drop Routing

1. Timeline container handles `onDragOver` → calculates nearest slot index from cursor Y position
2. `SlotDropIndicator` rendered at the calculated position
3. On `drop`:
   - If dropped on the indicator (between slots) → `insertAbility(index, actionId)` for abilities, or `addOffGcdAction(index, actionId)` for items
   - If dropped ONTO a slot's ability card area → `setAbility(index, actionId)` for abilities, `addOffGcdAction(index, actionId)` for items
4. `AbilitySlot` handles its own `onDrop` for the "onto a slot" case

### Data Compatibility

- `Rotation.offGcdActions` is **optional** (`offGcdActions?:`). Rotations saved before the builder existed have `undefined` — safe.
- Action IDs are immutable strings. Rotations reference them by ID, not by index. Adding/removing actions from `actions.ts` doesn't break rotation data.
- If a rotation references an unknown action ID, `getActionById` returns `undefined` — the builder shows "Unknown" and the practice store treats it as a standard GCD ability (graceful degradation).
- Indices in `offGcdActions` that exceed `abilities.length` are ignored during compilation.

---

## Execution Order

| Step | File(s) | Description |
|---|---|---|
| 1 | `types/index.ts` | Add categories + `offGcdActions` + `StoredUserRotations` |
| 2 | `data/actions.ts` | Add 5 item action definitions |
| 3 | `utils/storage.ts` | Add `getUserRotations`, `saveUserRotation`, `deleteUserRotation` |
| 4 | `store/rotationBuilderStore.ts` | Core builder state and actions |
| 5 | `App.tsx` | Add Builder tab + dirty-state navigation guards |
| 6 | `RotationBuilder.tsx` + CSS | Main layout component |
| 7 | `BuilderToolbar.tsx` | Toolbar: name, save/load/clear/delete |
| 8 | `AbilityPalette.tsx` + `PaletteItem.tsx` | Palette sidebar with search + DnD |
| 9 | `RotationTimeline.tsx` + `AbilitySlot.tsx` + `OffGcdTag.tsx` + `SlotDropIndicator.tsx` | Timeline with drop handling |
| 10 | `PracticeView.tsx` | Merge built-in + user rotations; selection UI |
| 11 | `KeybindEditor.tsx` | Add Items column |

### Dependencies

- **Blocks nothing** — adds new features without modifying existing paths
- **Blocked by nothing** — builds on existing types, stores, and data
- **Enables**: off-GCD v1 plan (provides `offGcdActions` data and action definitions the runtime can consume)
