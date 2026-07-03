import { useState, useCallback } from 'react';
import KeybindEditor from './components/KeybindEditor/KeybindEditor';
import PracticeView from './components/Practice/PracticeView';
import RotationBuilder from './components/RotationBuilder/RotationBuilder';
import { useRotationBuilderStore } from './store/rotationBuilderStore';

type Mode = 'practice' | 'builder' | 'edit';

export default function App() {
  const [mode, setMode] = useState<Mode>('practice');
  const isDirty = useRotationBuilderStore((s) => s.isDirty);

  const switchMode = useCallback(
    (next: Mode) => {
      if (isDirty && mode === 'builder' && next !== 'builder') {
        if (!window.confirm('You have unsaved changes. Discard?')) return;
        useRotationBuilderStore.getState().clearBuilder();
      }
      setMode(next);
    },
    [isDirty, mode],
  );

  return (
    <div className="app">
      <header className="app-header">
        <h1>RS3 Rotation Trainer</h1>
        <nav className="mode-nav">
          <button
            className={mode === 'practice' ? 'active' : ''}
            onClick={() => switchMode('practice')}
          >
            Practice
          </button>
          <button
            className={mode === 'builder' ? 'active' : ''}
            onClick={() => switchMode('builder')}
          >
            Builder
          </button>
          <button
            className={mode === 'edit' ? 'active' : ''}
            onClick={() => switchMode('edit')}
          >
            Edit Keybinds
          </button>
        </nav>
      </header>

      <main className="app-main">
        {mode === 'edit' && <KeybindEditor />}
        {mode === 'practice' && (
          <PracticeView
            onNavigateBuilder={(rotation) => {
              useRotationBuilderStore.getState().loadRotation(rotation);
              setMode('builder');
            }}
          />
        )}
        {mode === 'builder' && <RotationBuilder />}
      </main>
    </div>
  );
}
