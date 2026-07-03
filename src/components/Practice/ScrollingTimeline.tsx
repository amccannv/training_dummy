import { useEffect, useRef, useMemo, useState } from 'react';
import type { ActivationEvent, PrayerAttack, PrayerFlickSettings } from '../../types';
import type { Keybind } from '../../types';
import { actions, getActionById } from '../../data/actions';
import { formatKeybind } from '../../utils/keybindFormat';
import type { PracticeFeedback } from '../../hooks/usePracticeInput';
import './ScrollingTimeline.css';

const PX_PER_TICK = 52;
const PX_PER_MS = PX_PER_TICK / 600;
const TICK_MS = 600;
const CARD_HALF = 26;
const PREVIEW_AHEAD_MS = 30000;
const PREVIEW_BEHIND_MS = 4000;
const FADE_RAMP_MS = 4000;

interface CardData {
  id: string;
  x: number;
  targetMs: number;
  diff: number;
  state: 'pending' | 'approaching' | 'active' | 'hit' | 'missed';
  icon?: string;
  name: string;
  keyLabel: string;
  opacity: number;
}

interface LineData {
  x: number;
  tickNum: number;
}

interface ScrollingTimelineProps {
  events: ActivationEvent[];
  feedback: PracticeFeedback | null;
  bindings: Record<string, Keybind | null>;
  startTimeMs: number;
  prayerAttacks: PrayerAttack[];
  flickSettings: PrayerFlickSettings;
}

function deflectIcon(style: string): string | undefined {
  switch (style) {
    case 'melee': return getActionById('DeflectMelee')?.iconUrl;
    case 'magic': return getActionById('DeflectMagic')?.iconUrl;
    case 'ranged': return getActionById('DeflectMissiles')?.iconUrl;
    case 'necromancy': return getActionById('DeflectNecromancy')?.iconUrl;
    default: return undefined;
  }
}

function deflectName(style: string): string {
  switch (style) {
    case 'melee': return 'Deflect Melee';
    case 'magic': return 'Deflect Magic';
    case 'ranged': return 'Deflect Missiles';
    case 'necromancy': return 'Deflect Necro';
    default: return style;
  }
}

function computeLines(elapsed: number, hitX: number, width: number): LineData[] {
  const lines: LineData[] = [];
  const startTick = Math.floor(Math.max(0, elapsed - 2000) / TICK_MS);
  const endTick = Math.ceil((elapsed + PREVIEW_AHEAD_MS + 2000) / TICK_MS);

  for (let t = startTick; t <= endTick; t++) {
    const x = hitX + (t * TICK_MS - elapsed) * PX_PER_MS;
    if (x < -10 || x > width + 10) continue;
    lines.push({ x, tickNum: t });
  }

  return lines;
}

function computeCards(
  events: ActivationEvent[],
  elapsed: number,
  feedback: PracticeFeedback | null,
  bindings: Record<string, Keybind | null>,
  hitX: number,
  width: number,
): CardData[] {
  const cards: CardData[] = [];

  for (const event of events) {
    const targetMs = (event.tick + 0.5) * TICK_MS;
    const diff = targetMs - elapsed;
    if (diff > PREVIEW_AHEAD_MS || diff < -PREVIEW_BEHIND_MS) continue;

    const x = hitX + diff * PX_PER_MS;
    if (x < -CARD_HALF * 3 || x > width + CARD_HALF * 2) continue;

    const aId = event.primary;
    const def = actions.find((a) => a.id === aId);
    const kb = bindings[aId];

    let state: CardData['state'] = 'pending';
    if (event.result === 'hit') state = 'hit';
    else if (event.result === 'miss') state = 'missed';
    else if (feedback?.type === 'hit' && feedback.actionId === aId) state = 'hit';
    else if (feedback?.type === 'miss' && feedback.actionId === aId) state = 'missed';
    else if (diff <= 0 && diff > -TICK_MS) state = 'active';
    else if (diff < TICK_MS && diff > 0) state = 'approaching';

    let opacity = 1;
    if (state === 'pending') {
      const t = Math.max(0, Math.min(1, 1 - diff / FADE_RAMP_MS));
      opacity = 0.6 + 0.4 * t;
    }

    cards.push({
      id: `${aId}-${event.tick}`,
      x,
      targetMs,
      diff,
      state,
      icon: def?.iconUrl,
      name: def?.name ?? aId,
      keyLabel: kb ? formatKeybind(kb) : def?.isAuto ? 'AUTO' : '',
      opacity,
    });
  }

  cards.sort((a, b) => a.targetMs - b.targetMs);
  return cards;
}

function computeAttackCards(
  attacks: PrayerAttack[],
  elapsed: number,
  flickSettings: PrayerFlickSettings,
  hitX: number,
  width: number,
): CardData[] {
  const cards: CardData[] = [];
  const telegraphMs = flickSettings.telegraphTicks * TICK_MS;

  for (const attack of attacks) {
    const targetMs = (attack.tick + 0.5) * TICK_MS;
    const diff = targetMs - elapsed;
    if (diff > PREVIEW_AHEAD_MS || diff < -PREVIEW_BEHIND_MS) continue;

    const x = hitX + diff * PX_PER_MS;
    if (x < -CARD_HALF * 3 || x > width + CARD_HALF * 2) continue;

    let state: CardData['state'] = 'pending';
    let icon: string | undefined;
    let name: string;

    if (attack.result === 'hit') {
      state = 'hit';
      icon = deflectIcon(attack.style);
      name = deflectName(attack.style);
    } else if (attack.result === 'miss') {
      state = 'missed';
      icon = deflectIcon(attack.style);
      name = deflectName(attack.style);
    } else if (diff <= telegraphMs) {
      state = diff <= 0 && diff > -TICK_MS ? 'active' : 'approaching';
      icon = deflectIcon(attack.style);
      name = deflectName(attack.style);
    } else {
      icon = undefined;
      name = 'Incoming';
    }

    if (diff <= 0 && diff > -TICK_MS && !attack.resolved) {
      state = 'active';
    }

    let opacity = 1;
    if (state === 'pending') {
      const t = Math.max(0, Math.min(1, 1 - diff / FADE_RAMP_MS));
      opacity = 0.3 + 0.7 * t;
    }

    cards.push({
      id: `attack-${attack.tick}`,
      x,
      targetMs,
      diff,
      state,
      icon,
      name,
      keyLabel: '',
      opacity,
    });
  }

  cards.sort((a, b) => a.targetMs - b.targetMs);
  return cards;
}

export default function ScrollingTimeline({
  events,
  feedback,
  bindings,
  startTimeMs,
  prayerAttacks,
  flickSettings,
}: ScrollingTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [elapsed, setElapsed] = useState(0);
  const [width, setWidth] = useState(600);

  const hitX = width * 0.5;

  const hasAttacks = prayerAttacks.length > 0;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setWidth(el.offsetWidth);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    if (!startTimeMs) return;
    let raf: number;
    const tick = () => {
      setElapsed(performance.now() - startTimeMs);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [startTimeMs]);

  const abilityCards = useMemo(
    () => computeCards(events, elapsed, feedback, bindings, hitX, width),
    [events, elapsed, feedback, bindings, hitX, width],
  );

  const lines = useMemo(
    () => computeLines(elapsed, hitX, width),
    [elapsed, hitX, width],
  );

  const attackCards = useMemo(
    () => hasAttacks ? computeAttackCards(prayerAttacks, elapsed, flickSettings, hitX, width) : [],
    [prayerAttacks, elapsed, flickSettings, bindings, hitX, width, hasAttacks],
  );

  return (
    <div className={`scrolling-timeline ${hasAttacks ? 'has-attacks' : ''}`} ref={containerRef}>
      {lines.map((line, i) => (
        <div
          key={i}
          className="tl-grid"
          style={{ left: line.x }}
        />
      ))}

      {lines.slice(0, -1).map((line, i) => {
        const labelX = (line.x + lines[i + 1].x) / 2;
        return (
          <span
            key={`tick-${line.tickNum}`}
            className="tl-tick-label"
            style={{ left: labelX }}
          >
            {line.tickNum}
          </span>
        );
      })}

      <div className="tl-hit-zone" style={{ left: hitX }} />

      {abilityCards.map((card) => (
        <div
          key={card.id}
          className={`tl-card ability ${card.state}`}
          style={{ left: card.x, opacity: card.opacity }}
          title={card.name}
        >
          {card.icon && <img className="tl-card-icon" src={card.icon} alt={card.name} />}
          {!card.icon && <span className="tl-card-name">{card.name.charAt(0)}</span>}
          {card.keyLabel && (
            <span className="tl-card-key">{card.keyLabel}</span>
          )}
        </div>
      ))}

      {hasAttacks && attackCards.map((card) => (
        <div
          key={card.id}
          className={`tl-card attack ${card.state}`}
          style={{ left: card.x, opacity: card.opacity }}
          title={card.name}
        >
          {card.icon && <img className="tl-card-icon" src={card.icon} alt={card.name} />}
          {!card.icon && <span className="tl-card-name">?</span>}
          {card.keyLabel && (
            <span className="tl-card-key">{card.keyLabel}</span>
          )}
        </div>
      ))}
    </div>
  );
}
