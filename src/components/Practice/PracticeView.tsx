import { useEffect, useMemo, useState } from 'react';
import { usePracticeStore } from '../../store/practiceStore';
import { useKeybindStore } from '../../store/keybindStore';
import { rotations } from '../../data/rotations';
import { actions } from '../../data/actions';
import type { PrayerConfig } from '../../types';
import { usePracticeInput } from '../../hooks/usePracticeInput';
import { playCompleteSound } from '../../utils/audio';
import PracticeTimer from './PracticeTimer';
import ScrollingTimeline from './ScrollingTimeline';
import ResultsScreen from './ResultsScreen';
import Keyboard, { type KeyBindingInfo } from '../shared/Keyboard';
import './PracticeView.css';

const OVERHEAD_PRAYERS = actions.filter((a) => a.category === 'prayer');

export default function PracticeView() {
  const rotation = usePracticeStore((s) => s.rotation);
  const sessionActive = usePracticeStore((s) => s.sessionActive);
  const currentActive = usePracticeStore((s) => s.currentActive);
  const completed = usePracticeStore((s) => s.completed);
  const missed = usePracticeStore((s) => s.missed);
  const wrongPresses = usePracticeStore((s) => s.wrongPresses);
  const startTimeMs = usePracticeStore((s) => s.startTimeMs);
  const activePrayerId = usePracticeStore((s) => s.activePrayerId);
  const prayerChecks = usePracticeStore((s) => s.prayerChecks);
  const prayerHits = usePracticeStore((s) => s.prayerHits);
  const prayerMisses = usePracticeStore((s) => s.prayerMisses);
  const prayerFeedback = usePracticeStore((s) => s.prayerFeedback);
  const startPractice = usePracticeStore((s) => s.startPractice);
  const reset = usePracticeStore((s) => s.reset);

  const bindings = useKeybindStore((s) => s.bindings);

  const { feedback, pressedKeys, activeModifierCode } = usePracticeInput();

  const [prayerEnabled, setPrayerEnabled] = useState(false);
  const [enabledPrayerIds, setEnabledPrayerIds] = useState<string[]>(
    OVERHEAD_PRAYERS.map((p) => p.id),
  );
  const [checkIntervalTicks, setCheckIntervalTicks] = useState(5);

  const defaultRotation = rotations[0];
  const totalMs =
    defaultRotation.steps[defaultRotation.steps.length - 1].targetTimeMs + 600;

  const hasAnyBindings = useMemo(
    () =>
      defaultRotation.steps.some((step) =>
        step.actions.some((aId) => bindings[aId] !== null),
      ),
    [bindings],
  );

  const unboundInRotation = useMemo(() => {
    const ids = new Set<string>();
    for (const step of defaultRotation.steps) {
      for (const aId of step.actions) {
        if (bindings[aId] === null) ids.add(aId);
      }
    }
    return ids.size;
  }, [bindings]);

  const expectedKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const aId of currentActive) {
      const kb = bindings[aId];
      if (kb) keys.add(kb.code);
    }
    return keys;
  }, [currentActive, bindings]);

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

  const activePrayerKeyCode = useMemo(() => {
    if (!activePrayerId) return null;
    const kb = bindings[activePrayerId];
    return kb?.code ?? null;
  }, [activePrayerId, bindings]);

  const missedPrayerKeyCode = useMemo(() => {
    if (!prayerFeedback || prayerFeedback.type !== 'miss') return null;
    const kb = bindings[prayerFeedback.actionId];
    return kb?.code ?? null;
  }, [prayerFeedback, bindings]);

  const togglePrayerInPool = (id: string) => {
    setEnabledPrayerIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  // Poll and process expired windows
  useEffect(() => {
    if (!sessionActive) return;
    const interval = setInterval(() => {
      usePracticeStore.getState().processExpired(Date.now());
    }, 50);
    return () => clearInterval(interval);
  }, [sessionActive]);

  // Play sound on completion
  useEffect(() => {
    if (!sessionActive && rotation && completed.length > 0) {
      playCompleteSound();
    }
  }, [sessionActive, rotation, completed.length]);

  // Clear prayer feedback after 250ms
  useEffect(() => {
    if (!prayerFeedback) return;
    const timer = setTimeout(() => {
      usePracticeStore.setState({ prayerFeedback: null });
    }, 250);
    return () => clearTimeout(timer);
  }, [prayerFeedback]);

  // Idle: show start screen
  if (!rotation && !sessionActive) {
    return (
      <div className="practice-start">
        <h2 className="practice-title">{defaultRotation.name}</h2>
        <p className="practice-desc">
          {defaultRotation.steps.length} actions &middot;{' '}
          {(totalMs / 1000).toFixed(1)}s duration
        </p>

        {!hasAnyBindings ? (
          <div className="no-bindings-notice">
            <p>No keybinds configured.</p>
            <p className="no-bindings-hint">
              Set some keybinds in the{' '}
              <span className="link-like">Edit Keybinds</span> tab first.
            </p>
          </div>
        ) : (
          <>
            {unboundInRotation > 0 && (
              <p className="unbound-warning">
                {unboundInRotation} action{unboundInRotation > 1 ? 's' : ''}{' '}
                without a keybind will be skipped.
              </p>
            )}

            <div className="prayer-config-section">
              <label className="prayer-toggle-label">
                <input
                  type="checkbox"
                  checked={prayerEnabled}
                  onChange={(e) => setPrayerEnabled(e.target.checked)}
                />
                <span>Prayer Practice</span>
              </label>

              {prayerEnabled && (
                <div className="prayer-config-panel">
                  <div className="prayer-pool">
                    <span className="prayer-pool-label">Pool:</span>
                    <div className="prayer-toggles">
                      {OVERHEAD_PRAYERS.map((p) => (
                        <label key={p.id} className="prayer-checkbox">
                          <input
                            type="checkbox"
                            checked={enabledPrayerIds.includes(p.id)}
                            onChange={() => togglePrayerInPool(p.id)}
                          />
                          {p.iconUrl && (
                            <img className="prayer-check-icon" src={p.iconUrl} alt="" />
                          )}
                          <span>{p.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="prayer-interval">
                    <label>
                      Attack interval:{' '}
                      <select
                        value={checkIntervalTicks}
                        onChange={(e) => setCheckIntervalTicks(Number(e.target.value))}
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((t) => (
                          <option key={t} value={t}>
                            {t} tick{t > 1 ? 's' : ''} ({(t * 0.6).toFixed(1)}s)
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>
              )}
            </div>

            <button
              className="btn-primary btn-start"
              onClick={() => {
                const config: PrayerConfig = { enabledIds: enabledPrayerIds, checkIntervalTicks };
                startPractice(defaultRotation, prayerEnabled ? config : null);
              }}
            >
              Start Practice
            </button>
          </>
        )}
      </div>
    );
  }

  // Completed: show results
  if (!sessionActive && rotation) {
    return (
      <ResultsScreen
        rotation={rotation}
        completed={completed}
        missed={missed}
        wrongPresses={wrongPresses}
        prayerHits={prayerHits}
        prayerMisses={prayerMisses}
        onPracticeAgain={() => {
          const config = { enabledIds: enabledPrayerIds, checkIntervalTicks };
          startPractice(defaultRotation, prayerEnabled ? config : null);
        }}
        onReset={reset}
      />
    );
  }

  // Practicing
  return (
    <div className="practice-active">
      <div className="practice-top-bar">
        <span className="practice-rotation-name">{rotation!.name}</span>
        <div className="top-bar-right">
          {prayerChecks.length > 0 && (
            <span className={`active-prayer-pill ${activePrayerId ? 'on' : 'off'}`}>
              {'\uD83D\uDEE1\uFE0F'} {activePrayerId ? actions.find(a => a.id === activePrayerId)?.name : '\u2014'}
            </span>
          )}
          <button className="btn-cancel" onClick={reset}>
            Cancel
          </button>
        </div>
      </div>

      <PracticeTimer startTimeMs={startTimeMs} totalMs={totalMs} />

      <ScrollingTimeline
        rotation={rotation!}
        currentActive={currentActive}
        completed={completed}
        missed={missed}
        feedback={feedback}
        bindings={bindings}
        startTimeMs={startTimeMs}
        prayerChecks={prayerChecks}
      />

      <Keyboard
        keyMap={keyMap}
        expectedKeys={expectedKeys}
        pressedKeys={pressedKeys}
        hitKeyCode={feedback?.type === 'hit' ? feedback.keyCode : null}
        missKeyCode={feedback?.type === 'miss' ? feedback.keyCode : null}
        activeModifierCode={activeModifierCode}
        activePrayerKeyCode={activePrayerKeyCode}
        missedPrayerKeyCode={missedPrayerKeyCode}
      />
    </div>
  );
}
