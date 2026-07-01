# RS3 Rotation Trainer — Architecture

## 1. Technical Architecture

**Stack: React 18 + TypeScript + Vite + Zustand**

- React 18 for component model (scales V1→V6)
- TypeScript for maintainable data models
- Vite for zero-config fast builds/HMR
- Zustand (~1KB) for state management with built-in persist middleware
- CSS Modules for scoped styling (built into Vite)

**No router, no backend, no database.** Two views (edit/practice) toggled via parent state.

### Project Structure

```
src/
  types/index.ts          # All TypeScript interfaces
  data/
    actions.ts            # Hardcoded action definitions
    rotations.ts          # Hardcoded rotation(s)
  store/
    keybindStore.ts       # Zustand store: keybind config + localStorage
    practiceStore.ts      # Zustand store: session state (transient)
  hooks/
    useKeybindCapture.ts  # Keybind recording hook
    usePracticeInput.ts   # Practice keypress matching hook
  utils/
    keybindFormat.ts      # Keybind serialization/display
    storage.ts            # localStorage wrapper with versioning
  components/
    App.tsx
    KeybindEditor/        # Keybind configuration view
    Practice/             # Practice mode view
    shared/               # Reusable UI primitives
```

---

## 2. Data Model

### Action & Keybind

```typescript
type ActionCategory =
  | 'ranged:basic' | 'ranged:threshold' | 'ranged:ultimate'
  | 'eof' | 'special' | 'prayer';

interface Keybind {
  code: string;       // Physical key: "KeyA", "Digit1", "F1"
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  meta: boolean;
}

interface ActionDefinition {
  id: string;
  name: string;
  category: ActionCategory;
  durationTicks: number;   // 0=instant(no GCD), 1=standard, 4+=channeled
  isChanneled: boolean;    // Can be cancelled mid-execution
  iconUrl?: string;
}
```

Tick values:
- `0` — instant, no global cooldown (prayers)
- `1` — standard ability, 1-tick cast + GCD
- `4+` — channeled, player is locked in for N ticks; if `isChanneled`, can cancel early

### Rotation

```typescript
interface RotationStep {
  step: number;
  actions: string[];      // Action IDs executed simultaneously
}

interface Rotation {
  id: string;
  name: string;
  steps: RotationStep[];
}
```

The `RotationStep` object (not a flat list) allows adding `tick`/`windowMs` fields later without breaking existing code.

### Practice Session

```typescript
interface ActionResult {
  actionId: string;
  hit: boolean;
}

interface StepResult {
  step: number;
  actions: ActionResult[];
  extraMisses: number;
}

interface PracticeSession {
  rotationId: string;
  date: string;
  stepResults: StepResult[];
  completed: boolean;
}
```

### LocalStorage Schema

| Key | Payload | Version | Purpose |
|-----|---------|---------|---------|
| `rs3-keybinds` | `{ version, profileId, bindings[] }` | 1 | Keybind assignments |
| `rs3-sessions` | `{ version, sessions[] }` | 1 | Practice history |

Each key has a `version` field enabling forward migrations.

---

## 3. Component Hierarchy

```
App
├── [mode === 'edit'] KeybindEditor
│   ├── CategorySection × N
│   │   └── ActionRow × N
│   │       ├── Action name
│   │       ├── KeyDisplay (current binding)
│   │       └── (click → capture mode)
│   └── ClearAllButton
│
├── [mode === 'practice'] PracticeView
│   ├── StepDisplay
│   │   ├── Step counter
│   │   ├── ActionBadge × N (lights up on hit)
│   │   └── KeyDisplay (live feedback)
│   ├── ProgressBar
│   └── ResultsScreen
│
└── Footer (mode toggle)
```

No router — `App` holds a `mode` state. Two views, conditional rendering.

---

## 4. State Management

### keybindStore (persisted)

- `bindings: Record<string, Keybind | null>`
- `capturingActionId: string | null`
- `setBinding(actionId, keybind)`, `clearBinding()`, `clearAll()`
- `startCapture(actionId)`, `stopCapture()`
- Uses Zustand `persist` middleware → localStorage key `rs3-keybinds`

### practiceStore (transient)

- `rotation`, `currentStepIndex`, `completedActions`, `allResults`
- `extraMisses`, `sessionActive`
- `startPractice()`, `handleKeypress()`, `advanceStep()`, `finishSession()`, `reset()`

---

## 5. localStorage Strategy

- **Zustand `persist` middleware** handles auto-save/debounce/hydration for keybinds
- Practice sessions saved manually on completion via `storage.ts` utility
- All access wrapped in try/catch — corrupted data falls back to defaults
- Version field enables schema migrations

---

## 6. Milestones

| Milestone | Deliverables |
|-----------|--------------|
| M1 | Scaffold, types, data layer, stores |
| M2 | Keybind editor with capture |
| M3 | Practice mode core loop |
| M4 | Scoring, results, session history |
| M5 | Polish, error handling, README |

---

## 7. Key Design Decisions

- Store `code` (physical key position), not `key` — avoids QWERTY/AZERTY issues
- One keybind per action — alternates deferred to later
- Unmatched keypress counts as one miss per step (lenient — fumbled modifiers are common)
- No audio in V1 — adds complexity without validating the core hypothesis
- Single hardcoded rotation for V1 — rotation selection deferred to V1.5

---

## 8. Keyboard Handling

- Capture mode: click action row → global keydown listener → assign binding → stop listening
- Practice mode: global keydown listener → match against current step's expected keybinds → emit hit/miss
- `preventDefault()` on all matched keys during practice to stop browser interference
- OS-level shortcuts (Cmd+W, Alt+F4) cannot be intercepted — documented limitation
