import { useEffect, useMemo, useState } from 'react';
import { usePracticeStore } from '../../store/practiceStore';
import { useKeybindStore } from '../../store/keybindStore';
import { rotations } from '../../data/rotations';
import { actions } from '../../data/actions';
import { compileTicks } from '../../utils/compiler';
import { usePracticeInput } from '../../hooks/usePracticeInput';
import { playCompleteSound } from '../../utils/audio';
import type { ActivationEvent, AttackStyle, PrayerFlickSettings } from '../../types';
import PracticeTimer from './PracticeTimer';
import ScrollingTimeline from './ScrollingTimeline';
import ChannelBar from './ChannelBar';
import ResultsScreen from './ResultsScreen';
import Keyboard, { type KeyBindingInfo } from '../shared/Keyboard';
import './PracticeView.css';

const TICK_MS = 600;

const FLICK_PRESETS: Record<string, PrayerFlickSettings> = {
  off: { enabled: false, attackRate: 5, telegraphTicks: 2, styles: ['melee'] },
  single: { enabled: true, attackRate: 5, telegraphTicks: 2, styles: ['melee'] },
  dual: { enabled: true, attackRate: 5, telegraphTicks: 2, styles: ['magic', 'ranged'] },
  all: { enabled: true, attackRate: 5, telegraphTicks: 2, styles: ['melee', 'magic', 'ranged', 'necromancy'] },
};

const STYLE_LABELS: Record<AttackStyle, string> = {
  melee: 'Melee',
  magic: 'Magic',
  ranged: 'Ranged',
  necromancy: 'Necromancy',
};

const ALL_STYLES: AttackStyle[] = ['melee', 'magic', 'ranged', 'necromancy'];

interface FlickSettingsPanelProps {
  settings: PrayerFlickSettings;
  onChange: (s: PrayerFlickSettings) => void;
}

function FlickSettingsPanel({ settings, onChange }: FlickSettingsPanelProps) {
  const [preset, setPreset] = useState(settings.enabled ? 'all' : 'off');
  const [rate, setRate] = useState(settings.attackRate);
  const [telegraph, setTelegraph] = useState(settings.telegraphTicks);
  const [styles, setStyles] = useState<AttackStyle[]>(
    settings.enabled ? settings.styles : ALL_STYLES,
  );

  const applyPreset = (key: string) => {
    setPreset(key);
    const p = FLICK_PRESETS[key];
    setRate(p.attackRate);
    setTelegraph(p.telegraphTicks);
    setStyles(p.enabled ? p.styles : ALL_STYLES);
    onChange({ ...p, attackRate: p.attackRate, telegraphTicks: p.telegraphTicks, styles: p.enabled ? p.styles : ALL_STYLES });
  };

  const emit = (enabled: boolean, r: number, t: number, s: AttackStyle[]) => {
    onChange({ enabled, attackRate: r, telegraphTicks: t, styles: s });
  };

  const toggleStyle = (style: AttackStyle) => {
    setPreset('off');
    const next = styles.includes(style)
      ? styles.filter((s) => s !== style)
      : [...styles, style];
    if (next.length === 0) return;
    setStyles(next);
    emit(true, rate, telegraph, next);
  };

  return (
    <div className="flick-settings">
      <div className="flick-settings-header">Prayer Flick</div>

      <div className="flick-row">
        <span className="flick-label">Preset</span>
        <div className="flick-preset-group">
          {Object.entries(FLICK_PRESETS).map(([key]) => (
            <button
              key={key}
              className={`flick-preset-btn ${preset === key ? 'active' : ''}`}
              onClick={() => applyPreset(key)}
            >
              {key === 'off' ? 'Off' : key === 'single' ? 'Single' : key === 'dual' ? 'Dual' : 'All'}
            </button>
          ))}
        </div>
      </div>

      <div className="flick-row">
        <span className="flick-label">Rate</span>
        <div className="flick-preset-group">
          {[4, 5, 6, 7].map((r) => (
            <button
              key={r}
              className={`flick-preset-btn ${rate === r ? 'active' : ''}`}
              onClick={() => { setPreset('off'); setRate(r); emit(true, r, telegraph, styles); }}
            >
              {r}t
            </button>
          ))}
        </div>
      </div>

      <div className="flick-row">
        <span className="flick-label">Telegraph</span>
        <div className="flick-preset-group">
          {[1, 2, 3].map((t) => (
            <button
              key={t}
              className={`flick-preset-btn ${telegraph === t ? 'active' : ''}`}
              onClick={() => { setPreset('off'); setTelegraph(t); emit(true, rate, t, styles); }}
            >
              {t}t
            </button>
          ))}
        </div>
      </div>

      <div className="flick-row">
        <span className="flick-label">Styles</span>
        <div className="flick-preset-group">
          {ALL_STYLES.map((style) => (
            <button
              key={style}
              className={`flick-style-btn ${styles.includes(style) ? 'active' : ''}`}
              onClick={() => toggleStyle(style)}
            >
              {STYLE_LABELS[style]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function PrayerIndicator({ activePrayer }: { activePrayer: string }) {
  const def = actions.find((a) => a.id === activePrayer);
  if (!def) return null;
  return (
    <div className="prayer-indicator">
      {def.iconUrl && <img className="prayer-indicator-icon" src={def.iconUrl} alt="" />}
      <span className="prayer-indicator-label">{def.name}</span>
    </div>
  );
}

export default function PracticeView() {
  const rotation = usePracticeStore((s) => s.rotation);
  const sessionActive = usePracticeStore((s) => s.sessionActive);
  const events = usePracticeStore((s) => s.events);
  const wrongPresses = usePracticeStore((s) => s.wrongPresses);
  const startTimeMs = usePracticeStore((s) => s.startTimeMs);
  const startPractice = usePracticeStore((s) => s.startPractice);
  const reset = usePracticeStore((s) => s.reset);
  const flickSettings = usePracticeStore((s) => s.flickSettings);
  const prayerAttacks = usePracticeStore((s) => s.prayerAttacks);
  const activePrayer = usePracticeStore((s) => s.activePrayer);
  const prayerHits = usePracticeStore((s) => s.prayerHits);
  const prayerMisses = usePracticeStore((s) => s.prayerMisses);
  const ssTicks = usePracticeStore((s) => s.ssTicks);
  const totalPrayerTicks = usePracticeStore((s) => s.totalPrayerTicks);
  const setFlickSettings = usePracticeStore((s) => s.setFlickSettings);

  const bindings = useKeybindStore((s) => s.bindings);
  const { feedback, pressedKeys, activeModifierCode } = usePracticeInput();

  const defaultRotation = rotations[0];
  const totalMs = useMemo(() => {
    if (!defaultRotation) return 0;
    const ticks = compileTicks(defaultRotation);
    if (ticks.length === 0) return 0;
    return (ticks[ticks.length - 1] + 2) * TICK_MS;
  }, [defaultRotation]);

  const hasAnyBindings = useMemo(
    () =>
      defaultRotation.abilities.some((aId) => bindings[aId] !== null),
    [bindings],
  );

  const unboundInRotation = useMemo(() => {
    if (!defaultRotation) return 0;
    let count = 0;
    for (const aId of defaultRotation.abilities) {
      if (bindings[aId] === null) count++;
    }
    return count;
  }, [bindings]);

  const activationEvents = useMemo(
    () =>
      events.map(
        (e): ActivationEvent => ({
          tick: e.tick,
          primary: e.abilityId,
          supplemental: [],
          resolved: e.resolved,
          result: e.result,
          duration: e.duration,
          gcdEndTick: e.gcdEndTick,
        }),
      ),
    [events],
  );

  const expectedKeys = useMemo(() => {
    const keys = new Set<string>();
    const ci = events.findIndex((e) => !e.resolved);
    if (ci !== -1) {
      const aId = events[ci].abilityId;
      const kb = bindings[aId];
      if (kb) keys.add(kb.code);
    }
    return keys;
  }, [events, bindings]);

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

  const activePrayerBinding = useMemo(() => {
    const kb = bindings[activePrayer];
    return kb ? kb.code : null;
  }, [bindings, activePrayer]);

  useEffect(() => {
    if (!sessionActive) return;
    const interval = setInterval(() => {
      usePracticeStore.getState().tick();
    }, 50);
    return () => clearInterval(interval);
  }, [sessionActive]);

  useEffect(() => {
    if (!sessionActive && rotation && events.length > 0) {
      playCompleteSound();
    }
  }, [sessionActive, rotation, events.length]);

  if (!rotation && !sessionActive) {
    return (
      <div className="practice-start">
        <h2 className="practice-title">{defaultRotation.name}</h2>
        <p className="practice-desc">
          {defaultRotation.abilities.length} actions &middot;{' '}
          {(totalMs / 1000).toFixed(1)}s est. duration
        </p>

        <FlickSettingsPanel settings={flickSettings} onChange={setFlickSettings} />

        {flickSettings.enabled && (
          <p className="flick-preview-note">
            Prayers enabled: {flickSettings.styles.map((s) => STYLE_LABELS[s]).join(', ')} &middot;{' '}
            {flickSettings.attackRate}t rate &middot; {flickSettings.telegraphTicks}t notice
          </p>
        )}

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

            <button
              className="btn-primary btn-start"
              onClick={() => startPractice(defaultRotation)}
            >
              Start Practice
            </button>
          </>
        )}
      </div>
    );
  }

  if (!sessionActive && rotation) {
    return (
      <ResultsScreen
        rotationName={rotation.name}
        events={events}
        wrongPresses={wrongPresses}
        onPracticeAgain={() => startPractice(defaultRotation)}
        onReset={reset}
        prayerStats={flickSettings.enabled ? {
          hits: prayerHits,
          misses: prayerMisses,
          ssUptimeTicks: ssTicks,
          totalTicks: totalPrayerTicks,
          attacks: prayerAttacks.map((a) => ({
            tick: a.tick,
            style: a.style,
            result: (a.result || 'miss') as 'hit' | 'miss',
          })),
        } : undefined}
      />
    );
  }

  return (
    <div className="practice-active">
      <div className="practice-top-bar">
        <span className="practice-rotation-name">{rotation!.name}</span>
        <div className="top-bar-right">
          {flickSettings.enabled && (
            <PrayerIndicator activePrayer={activePrayer} />
          )}
          <button className="btn-cancel" onClick={reset}>
            Cancel
          </button>
        </div>
      </div>

      <PracticeTimer startTimeMs={startTimeMs} totalMs={totalMs} />

      <ScrollingTimeline
        events={activationEvents}
        feedback={feedback}
        bindings={bindings}
        startTimeMs={startTimeMs}
        prayerAttacks={flickSettings.enabled ? prayerAttacks : []}
        flickSettings={flickSettings}
      />

      <ChannelBar />

      <Keyboard
        keyMap={keyMap}
        expectedKeys={expectedKeys}
        pressedKeys={pressedKeys}
        hitKeyCode={feedback?.type === 'hit' ? feedback.keyCode : null}
        missKeyCode={feedback?.type === 'miss' ? feedback.keyCode : null}
        activeModifierCode={activeModifierCode}
        activePrayerKeyCode={flickSettings.enabled ? activePrayerBinding : null}
        unit={52}
      />
    </div>
  );
}
