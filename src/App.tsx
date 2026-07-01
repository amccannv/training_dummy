import { useState } from 'react';
import KeybindEditor from './components/KeybindEditor/KeybindEditor';
import PracticeView from './components/Practice/PracticeView';

type Mode = 'edit' | 'practice';

export default function App() {
  const [mode, setMode] = useState<Mode>('practice');

  return (
    <div className="app">
      <header className="app-header">
        <h1>RS3 Rotation Trainer</h1>
        <nav className="mode-nav">
          <button
            className={mode === 'practice' ? 'active' : ''}
            onClick={() => setMode('practice')}
          >
            Practice
          </button>
          <button
            className={mode === 'edit' ? 'active' : ''}
            onClick={() => setMode('edit')}
          >
            Edit Keybinds
          </button>
        </nav>
      </header>

      <main className="app-main">
        {mode === 'edit' && <KeybindEditor />}
        {mode === 'practice' && <PracticeView />}
      </main>
    </div>
  );
}
