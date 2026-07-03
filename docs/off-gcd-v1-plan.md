# Off-GCD Items/Gear — V1 Implementation Plan

## Summary

Extend the RS3 Rotation Trainer to support off-GCD actions (consumables, equipment swaps, target actions) that can fire on any tick, including the same tick as GCD abilities. These actions are not subject to GCD lock and have a relaxed timing window.

### What's in V1

| Feature | |
|---|---|
| Consumables | Vuln Bomb, Adrenaline Renewal |
| Equipment (lightweight) | EOF Swap, Ammo Swap |
| Target actions | Target Cycle |
| Timing model | Wide window — press anytime between scheduled tick and next GCD ability's tick |
| Scoring | Tracked separately from primary abilities |
| Keybinds | Configurable in editor under new "Items" column |

### What's out (deferred)

- Full gear/weapon/armor switching (requires action bar binding system)
- Tick-perfect off-GCD enforcement
- Reactive/freeform off-GCD presses (only pre-scripted in rotations)

---

## Architecture

### Data Flow

```
Rotation (abilities + offGcdActions)
    │
    ▼
compiler.ts: compileEventData() → { tick, duration, gcdEndTick }[]
compiler.ts: compileSupplementalActions() → SupplementalAction[]
    │
    ▼
practiceStore.ts: startPractice()
    ├── ActivationEvent[] (primary + supplemental for UI)
    └── SupplementalAction[] (resolution state, tracked in parallel)
    │
    ▼
handleKeypress: supplemental check first (no GCD lock) → primary check (GCD lock)
tick(): auto-resolve supplementals past deadline as miss
```

### Key Design Decisions

1. **Parallel tracking**: Off-GCD resolution state lives in a separate `SupplementalAction[]` array (same pattern as `prayerAttacks`), not smashed into the primary event list. This keeps timing windows independent.

2. **Index-anchored**: Off-GCD actions are keyed by GCD ability index in the rotation. They fire on the same tick as the GCD ability at that index, with a window extending to the next GCD ability's tick.

3. **Supplemental first**: In keypress handling, supplemental actions are checked before primary abilities. They bypass GCD lock entirely — you can always press them.

4. **Separate scoring**: Supplemental hits, misses, and wrong presses are tracked independently from primary abilities.

---

## File-by-File Changes

### 1. `src/types/index.ts`

**Add categories:**
```typescript
export type ActionCategory =
  | /* existing categories... */
  | 'items:consume' | 'items:equipment' | 'items:target';
```

**New interface:**
```typescript
export interface SupplementalAction {
  actionId: string;
  tick: number;          // scheduled tick (same as paired GCD ability)
  deadlineTick: number;  // must press before this tick (next GCD ability's tick)
  eventIndex: number;    // which primary ActivationEvent this belongs to
  resolved: boolean;
  result?: 'hit' | 'miss';
}
```

**Extend `Rotation`:**
```typescript
export interface Rotation {
  id: string;
  name: string;
  abilities: string[];
  offGcdActions?: Record<number, string[]>;  // ability index → off-GCD action IDs
}
```

**Extend `KeypressResult`** (add two new variants before closing):
```typescript
  | { type: 'supplemental-hit'; actionId: string }
  | { type: 'supplemental-miss'; reason: 'wrong-action' | 'wrong-timing' };
```

**Extend `TimedSession`:**
```typescript
  supplementalStats?: {
    hits: number;
    misses: number;
    actions: Array<{ actionId: string; tick: number; result: 'hit' | 'miss' }>;
  };
```

### 2. `src/data/actions.ts`

Add 5 new action definitions after the prayers section. No icons or sounds for now.

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

### 3. `src/utils/compiler.ts`

Add a new export:

```typescript
export function compileSupplementalActions(
  rotation: Rotation,
  eventTicks: number[],
): SupplementalAction[] {
  const result: SupplementalAction[] = [];
  if (!rotation.offGcdActions) return result;

  const GCD = 3;

  for (let i = 0; i < rotation.abilities.length; i++) {
    const actionIds = rotation.offGcdActions[i];
    if (!actionIds || actionIds.length === 0) continue;

    const scheduleTick = eventTicks[i];
    const deadlineTick = i + 1 < eventTicks.length
      ? eventTicks[i + 1]
      : scheduleTick + GCD;  // last event: use GCD as default window

    for (const actionId of actionIds) {
      result.push({
        actionId,
        tick: scheduleTick,
        deadlineTick,
        eventIndex: i,
        resolved: false,
      });
    }
  }
  return result;
}
```

Also export `compileTicks` (already exists) for use in the store.

### 4. `src/utils/audio.ts`

Add two new exports with quieter parameters:

```typescript
export function playSupplementalHitSound(): void {
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sine';
    osc.connect(gain);
    gain.connect(c.destination);
    osc.frequency.setValueAtTime(550, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, c.currentTime + 0.05);
    gain.gain.setValueAtTime(0.12, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.08);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + 0.08);
  } catch {}
}

export function playSupplementalMissSound(): void {
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sawtooth';
    osc.connect(gain);
    gain.connect(c.destination);
    osc.frequency.setValueAtTime(150, c.currentTime);
    gain.gain.setValueAtTime(0.06, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.1);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + 0.1);
  } catch {}
}
```

### 5. `src/store/practiceStore.ts`

This is the largest change.

**State additions** — add to `PracticeStore` interface:
```typescript
  supplementalActions: SupplementalAction[];
  supplementalHits: number;
  supplementalMisses: number;
```

**`startPractice`** — after compiling events and prayer attacks, compile supplementals:
```typescript
const ticks = compileTicks(rotation);
const supplementalActions = compileSupplementalActions(rotation, ticks);
// ... store supplementalActions in state, reset supplementalHits/supplementalMisses to 0
```

**`handleKeypress`** — add supplemental check FIRST, before prayer check:
```typescript
// 1. CHECK SUPPLEMENTAL ACTIONS (no GCD lock)
const currentTick = currentTick(state.startTimeMs);
for (const sa of state.supplementalActions) {
  if (sa.resolved) continue;
  if (matchKeybind(sa.actionId, pressed, getBinding)) {
    if (currentTick >= sa.tick && currentTick < sa.deadlineTick) {
      const supplementalActions = state.supplementalActions.map((s) =>
        s === sa ? { ...s, resolved: true, result: 'hit' as const } : s
      );
      set({ supplementalActions, supplementalHits: state.supplementalHits + 1 });
      return { type: 'supplemental-hit', actionId: sa.actionId };
    }
    set({ supplementalMisses: state.supplementalMisses + 1 });
    return { type: 'supplemental-miss', reason: 'wrong-timing' };
  }
}
// If they press a key bound to ANY supplemental action (even resolved ones),
// consume it so it doesn't fall through to GCD checking
for (const sa of state.supplementalActions) {
  if (matchKeybind(sa.actionId, pressed, getBinding)) {
    set({ supplementalMisses: state.supplementalMisses + 1 });
    return { type: 'supplemental-miss', reason: 'wrong-action' };
  }
}

// 2. EXISTING PRAYER CHECK

// 3. EXISTING PRIMARY ABILITY CHECK
```

**`tick()`** — add supplemental auto-resolution alongside ability auto-resolution:
```typescript
// Auto-resolve supplementals past deadline
for (let i = 0; i < supplementalActions.length; i++) {
  if (supplementalActions[i].resolved) continue;
  if (tick >= supplementalActions[i].deadlineTick) {
    supplementalActions[i] = { ...supplementalActions[i], resolved: true, result: 'miss' };
    supplementalChanged = true;
    missedCount++;
  }
}
```

Track `supplementalChanged` flag similarly to `abilityChanged`/`prayerChanged` to trigger state updates.

**`finishSession`** — include supplemental stats in saved session:
```typescript
supplementalStats: state.supplementalActions.length > 0 ? {
  hits: state.supplementalHits,
  misses: state.supplementalMisses,
  actions: state.supplementalActions.map((sa) => ({
    actionId: sa.actionId,
    tick: sa.tick,
    result: (sa.result || 'miss') as 'hit' | 'miss',
  })),
} : undefined,
```

**`reset`** — reset supplemental state to empty.

### 6. `src/hooks/usePracticeInput.ts`

Handle new `KeypressResult` variants in the `onDown` handler:

```typescript
if (result.type === 'supplemental-hit') {
  playSupplementalHitSound();
  // no ability .ogg sound for items
  const id = ++feedbackIdRef.current;
  setFeedback({ type: 'hit', actionId: result.actionId, keyCode: e.code, id });
} else if (result.type === 'supplemental-miss') {
  playSupplementalMissSound();
  const id = ++feedbackIdRef.current;
  setFeedback({ type: 'miss', actionId: null, keyCode: e.code, reason: result.reason, id });
}
```

Note: Reuse existing `PracticeFeedback` shape (actionId populated for hit, null for miss) since the UI doesn't distinguish supplemental vs primary feedback.

### 7. `src/components/Practice/PracticeView.tsx`

- Update `activationEvents` memo to populate `supplemental` from the store's `supplementalActions`:
  ```typescript
  const activationEvents = useMemo(() => {
    const supplemental = usePracticeStore.getState().supplementalActions;
    return events.map((e, i): ActivationEvent => ({
      tick: e.tick,
      primary: e.abilityId,
      supplemental: supplemental
        .filter((sa) => sa.eventIndex === i)
        .map((sa) => sa.actionId),
      resolved: e.resolved,
      result: e.result,
      duration: e.duration,
      gcdEndTick: e.gcdEndTick,
    }));
  }, [events, supplementalActions]);
  ```

- Pass supplemental state to `ResultsScreen` and other child components as needed.

### 8. `src/components/Practice/ScrollingTimeline.tsx`

In `computeCards`, after processing primary events, add supplemental cards for events with non-empty `supplemental`:

```typescript
// After main card loop
for (const event of events) {
  if (!event.supplemental || event.supplemental.length === 0) continue;
  
  const targetMs = (event.tick + 0.5) * TICK_MS;
  const diff = targetMs - elapsed;
  // ... same visibility calculations ...

  for (let s = 0; s < event.supplemental.length; s++) {
    const aId = event.supplemental[s];
    const def = actions.find((a) => a.id === aId);
    const kb = bindings[aId];
    const offsetY = (s + 1) * 20;  // stack below primary

    cards.push({
      /* same shape, add offsetY, supplemental-specific state & styling */,
    });
  }
}
```

Add CSS classes: `.tl-card.supplemental` (smaller, offset, muted border color).

### 9. `src/components/Practice/TickList.tsx`

After each primary event row, insert supplemental rows if the event has them:

```typescript
// After primary row
{event.supplemental?.map((sId, si) => {
  const sDef = actions.find((a) => a.id === sId);
  const sKb = bindings[sId];
  // ... find supplemental action result ...
  return (
    <div key={`${event.primary}-${event.tick}-sup-${si}`} className="tick-row supplemental">
      <span className="tr-tick">{/* empty */}</span>
      <span className="tr-ability supplemental-indent">
        {sDef?.name ?? sId}
      </span>
      <span className="tr-key">{sKb ? formatKeybind(sKb) : '\u2014'}</span>
      <span className="tr-result">{/* hit/miss indicator */}</span>
    </div>
  );
})}
```

### 10. `src/components/Practice/ResultsScreen.tsx`

Add the supplemental stats panel. Pass as prop from `PracticeView`:

```typescript
interface ResultsScreenProps {
  // ... existing props ...
  supplementalStats?: {
    hits: number;
    misses: number;
    actions: Array<{ actionId: string; tick: number; result: 'hit' | 'miss' }>;
  };
}
```

In the "Ability Rotation" panel, add below the missed breakdown:
```tsx
{supplementalStats && supplementalStats.actions.length > 0 && (
  <div className="results-subsection">
    <h4 className="results-subsection-title">Off-GCD Items</h4>
    <div className="results-panel-detail">
      <span className="detail-pill">{supplementalStats.hits}/{supplementalStats.hits + supplementalStats.misses} hits</span>
    </div>
    {/* missed supplemental breakdown rows */}
  </div>
)}
```

### 11. `src/components/KeybindEditor/KeybindEditor.tsx`

Add items group to `BOTTOM_GROUPS`:
```typescript
{ label: 'Items', categories: ['items:consume', 'items:equipment', 'items:target'] },
```

Add labels for the new categories:
```typescript
'items:consume': 'Consumables',
'items:equipment': 'Equipment',
'items:target': 'Target',
```

Ensure they appear in `CATEGORY_ORDER` too.

### 12. `src/data/rotations.ts`

Add v1 example off-GCD usage to the existing ranged drill:

```typescript
{
  id: 'one-minute-ranged-drill',
  name: 'One Minute Ranged Drill',
  abilities: [
    'ImbueShadows',        // index 0 ← TargetCycle + VulnBomb on same tick
    'Ricochet',            // index 1
    'PiercingShot',        // index 2
    'GreaterDeathsSwiftness', // index 3
    'PiercingShot',        // index 4 ← AdrenalineRenewal on same tick
    'Galeshot',            // index 5
    // ... rest unchanged ...
  ],
  offGcdActions: {
    0: ['TargetCycle', 'VulnBomb'],
    4: ['AdrenalineRenewal'],
  },
},
```

---

## Keypress Resolution Flow

```
keydown
  ┌─────────────────────────────────────────────────────────────────────┐
  │ 1. CHECK: unresolved supplemental matching keybind                  │
  │    tick ≤ currentTick < deadlineTick?                               │
  │    ├── YES → supplemental-hit  (mark resolved)                      │
  │    └── NO  → supplemental-miss:wrong-timing                         │
  │                                                                     │
  │ 2. CHECK: any supplemental keybind (resolved, past, or future)      │
  │    └── YES → supplemental-miss:wrong-action                         │
  │                                                                     │
  │ 3. CHECK: prayer keybind (flick enabled)                            │
  │    └── YES → prayer-change                                          │
  │                                                                     │
  │ 4. CHECK: prayer keybind (flick off)                                │
  │    └── YES → ignored                                                │
  │                                                                     │
  │ 5. CHECK: current primary ability keybind                           │
  │    correct tick?                    → hit                           │
  │    GCD locked?                      → miss:gcd-locked               │
  │    wrong tick?                      → miss:wrong-timing             │
  │                                                                     │
  │ 6. CHECK: any rotation ability keybind (wrong ability for this tick)│
  │    └── YES → miss (reason from GCD lock state)                      │
  │                                                                     │
  │ 7. FALLTHROUGH                                                      │
  │    └── miss:wrong-action                                            │
  └─────────────────────────────────────────────────────────────────────┘
```

## Auto-Resolution Timing

```
Tick timeline:
    [0]  [1]  [2]  [3]  [4]  [5]  [6]  [7]  [8]  [9]
     |    |    |    |    |    |    |    |    |    |
     ├─ PriAbility #0 ────┤                        Primary: tick 3, GCD ends 5
     |    ├────── Supplemental window #0 ──────┤   Supp: tick 3, deadline=6
                          ├─ PriAbility #1 ────┤
                                   ├───── Supp window #1 ──┤

Supplemental #0: press on ticks 3,4,5 → hit. tick 6 → auto-miss.
Supplemental #1: press on ticks 6,7,8 → hit. tick 9 → auto-miss.
Primary #0: must press on tick 3 exactly.
Primary #1: must press on tick 6 exactly.
```

## Visual Feedback

| Event | Sound | Keyboard highlight | Timeline card flash |
|---|---|---|---|
| Primary hit | Loud sine sweep (existing) | Green flash | Green |
| Primary miss | Loud sawtooth (existing) | Red flash | Red |
| Supplemental hit | Quiet sine sweep (new) | Green flash | Green (small card) |
| Supplemental miss | Quiet sawtooth (new) | Red flash | Red (small card) |

## Order of Execution

The recommended order for implementing files:

| Step | File(s) | Rationale |
|---|---|---|
| 1 | `types/index.ts` | Foundation — everything depends on new types |
| 2 | `data/actions.ts` | Define items so keybinds can reference them |
| 3 | `utils/compiler.ts` | Compilation logic needed before store changes |
| 4 | `utils/audio.ts` | Standalone, no dependencies on other changes |
| 5 | `store/practiceStore.ts` | Core logic — largest change, depends on steps 1-3 |
| 6 | `hooks/usePracticeInput.ts` | Depends on new KeypressResult variants |
| 7 | `components/KeybindEditor/KeybindEditor.tsx` | UI — can be done in parallel with 5-6 |
| 8 | `components/Practice/PracticeView.tsx` | Wires everything together |
| 9 | `components/Practice/ScrollingTimeline.tsx` | Visual cards |
| 10 | `components/Practice/TickList.tsx` | Visual rows |
| 11 | `components/Practice/ResultsScreen.tsx` | Final stats |
| 12 | `data/rotations.ts` | Demo content — last so it compiles correctly |

## Risks / Edge Cases

1. **Same keybind for primary and supplemental**: Supplemental check runs first, so pressing that key will always be treated as a supplemental attempt. If no unresolved supplemental matches, it becomes a `supplemental-miss:wrong-action` — it will never reach the primary check. User must use different keybinds.

2. **Duplicate supplemental action IDs**: If index 0 and index 5 both use `['VulnBomb']`, the first unresolved one is matched. The second window doesn't open until the first is resolved or passed. Natural behavior.

3. **Empty rotation**: If `abilities` is empty but `offGcdActions` is populated, supplemental action compilation returns empty array (no tick events to anchor to).

4. **Off-GCD at last event**: The deadline for the last index defaults to `scheduleTick + GCD (3)`. If no primary ability follows, the window is 3 ticks.

5. **Typing lag**: If `currentTick` advances past `deadlineTick` before the `tick()` interval fires, auto-resolution catches up on the next `tick()` call (every 50ms).
