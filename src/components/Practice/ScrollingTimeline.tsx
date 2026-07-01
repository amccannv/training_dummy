import { useEffect, useRef, useMemo, useState } from 'react';
import type { Rotation, TimedAction, PrayerCheckEvent } from '../../types';
import type { Keybind } from '../../types';
import { actions } from '../../data/actions';
import { formatKeybind } from '../../utils/keybindFormat';
import type { PracticeFeedback } from '../../hooks/usePracticeInput';
import './ScrollingTimeline.css';

const PX_PER_TICK = 40;
const PX_PER_MS = PX_PER_TICK / 600;
const TICK_MS = 600;
const HIT_ZONE_X = 50;
const CARD_HALF = 45;
const PREVIEW_AHEAD_MS = 4000;
const PREVIEW_BEHIND_MS = 2000;

interface CardData {
  id: string;
  x: number;
  targetMs: number;
  diff: number;
  state: 'pending' | 'approaching' | 'active' | 'hit' | 'missed';
  icon?: string;
  name: string;
  keyLabel: string;
  isPrayer: boolean;
  tickDots: number;
}

interface LineData {
  x: number;
  isGcd: boolean;
}

interface ScrollingTimelineProps {
  rotation: Rotation;
  currentActive: string[];
  completed: TimedAction[];
  missed: string[];
  feedback: PracticeFeedback | null;
  bindings: Record<string, Keybind | null>;
  startTimeMs: number;
  prayerChecks?: PrayerCheckEvent[];
}

function computeTickDots(targetMs: number, elapsed: number): number {
  const dist = targetMs - elapsed;
  if (dist < 0) return 3;
  const ticksAway = Math.ceil(dist / TICK_MS);
  return Math.max(0, 3 - ticksAway);
}

function computeCards(
  rotation: Rotation,
  elapsed: number,
  currentActive: string[],
  completed: TimedAction[],
  missed: string[],
  feedback: PracticeFeedback | null,
  bindings: Record<string, Keybind | null>,
  hitX: number,
  width: number,
  prayerChecks: PrayerCheckEvent[],
): CardData[] {
  const cards: CardData[] = [];

  for (const step of rotation.steps) {
    for (const aId of step.actions) {
      const diff = step.targetTimeMs - elapsed;
      if (diff > PREVIEW_AHEAD_MS || diff < -PREVIEW_BEHIND_MS) continue;

      const x = hitX + diff * PX_PER_MS;
      if (x < -CARD_HALF * 3 || x > width + CARD_HALF * 2) continue;

      const def = actions.find((a) => a.id === aId);
      const kb = bindings[aId];

      let state: CardData['state'] = 'pending';
      if (feedback?.type === 'hit' && feedback.actionId === aId) state = 'hit';
      else if (feedback?.type === 'miss' && feedback.actionId === aId) state = 'missed';
      else if (completed.some((c) => c.actionId === aId)) state = 'hit';
      else if (missed.includes(aId)) state = 'missed';
      else if (currentActive.includes(aId)) state = 'active';
      else if (diff < TICK_MS && diff >= 0) state = 'approaching';

      cards.push({
        id: aId,
        x,
        targetMs: step.targetTimeMs,
        diff,
        state,
        icon: def?.iconUrl,
        name: def?.name ?? aId,
        keyLabel: kb ? formatKeybind(kb) : '',
        isPrayer: false,
        tickDots: (state === 'approaching' || state === 'active')
          ? computeTickDots(step.targetTimeMs, elapsed)
          : (state === 'hit' || state === 'missed' ? 3 : 0),
      });
    }
  }

  // Prayer check cards
  for (const check of prayerChecks) {
    const diff = check.targetTimeMs - elapsed;
    if (diff > PREVIEW_AHEAD_MS || diff < -PREVIEW_BEHIND_MS) continue;

    const x = hitX + diff * PX_PER_MS;
    if (x < -CARD_HALF * 3 || x > width + CARD_HALF * 2) continue;

    const def = actions.find((a) => a.id === check.requiredPrayerId);
    const kb = bindings[check.requiredPrayerId];

    let state: CardData['state'] = 'pending';
    if (check.state === 'hit') state = 'hit';
    else if (check.state === 'missed') state = 'missed';
    else if (diff < TICK_MS && diff >= 0) state = 'approaching';

    cards.push({
      id: `prayer-${check.targetTimeMs}`,
      x,
      targetMs: check.targetTimeMs,
      diff,
      state,
      icon: def?.iconUrl,
      name: def?.name ?? check.requiredPrayerId,
      keyLabel: kb ? formatKeybind(kb) : '',
      isPrayer: true,
      tickDots: state === 'approaching'
        ? computeTickDots(check.targetTimeMs, elapsed)
        : 3,
    });
  }

  cards.sort((a, b) => a.targetMs - b.targetMs);
  return cards;
}

function computeLines(elapsed: number, hitX: number, width: number): LineData[] {
  const lines: LineData[] = [];
  const relevantStart = Math.max(elapsed - 2000, Math.floor((hitX - 5000) / PX_PER_MS + elapsed));
  const relevantEnd = Math.min(elapsed + PREVIEW_AHEAD_MS, Math.ceil((width + 5000 - hitX) / PX_PER_MS + elapsed));
  const startTick = Math.floor(Math.min(relevantStart, elapsed - hitX / PX_PER_MS) / TICK_MS);
  const endTick = Math.ceil(Math.max(relevantEnd, elapsed + (width - hitX) / PX_PER_MS) / TICK_MS);

  for (let t = startTick; t <= endTick; t++) {
    const time = t * TICK_MS;
    const x = hitX + (time - elapsed) * PX_PER_MS;
    if (x < -5 || x > width + 5) continue;
    lines.push({ x, isGcd: t % 3 === 0 });
  }

  return lines;
}

export default function ScrollingTimeline({
  rotation,
  currentActive,
  completed,
  missed,
  feedback,
  bindings,
  startTimeMs,
  prayerChecks = [],
}: ScrollingTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [elapsed, setElapsed] = useState(0);
  const [width, setWidth] = useState(600);

  const hitX = HIT_ZONE_X;

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
      setElapsed(Date.now() - startTimeMs);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [startTimeMs]);

  const cards = useMemo(
    () =>
      computeCards(
        rotation, elapsed, currentActive, completed, missed,
        feedback, bindings, hitX, width, prayerChecks,
      ),
    [rotation, elapsed, currentActive, completed, missed, feedback, bindings, hitX, width, prayerChecks],
  );

  const lines = useMemo(
    () => computeLines(elapsed, hitX, width),
    [elapsed, hitX, width],
  );

  const abilityCards = cards.filter((c) => !c.isPrayer);
  const prayerCards = cards.filter((c) => c.isPrayer);

  return (
    <div className="scrolling-timeline" ref={containerRef}>
      {lines.map((line) => (
        <div
          key={`${line.x.toFixed(0)}-${line.isGcd ? 'gcd' : 'tick'}`}
          className={line.isGcd ? 'tl-grid gcd' : 'tl-grid tick'}
          style={{ left: line.x }}
        />
      ))}

      {/* Hit zone */}
      <div className="tl-hit-zone" style={{ left: hitX }} />

      <div className="tl-lane-label abilities">Abilities</div>
      <div className="tl-lane-label prayers">Prayers</div>

      {/* Ability cards — top lane */}
      {abilityCards.map((card) => {
        const prox = 1 - Math.max(0, Math.min(1, card.diff / PREVIEW_AHEAD_MS));
        const cardOpacity = card.state === 'pending' ? prox : 1;
        return (
          <div
            key={card.id}
            className={`tl-card ${card.state}`}
            style={{ left: card.x, top: 60, opacity: cardOpacity }}
          >
            {card.icon && <img className="tl-card-icon" src={card.icon} alt="" />}
            <span className="tl-card-name">{card.name}</span>
            {card.keyLabel && (
              <span className="tl-card-key">{card.keyLabel}</span>
            )}
            {(card.state === 'approaching' || card.state === 'active') && (
              <div className="tl-tick-dots">
                <span className={`dot ${card.tickDots >= 1 ? 'fill' : ''}`} />
                <span className={`dot ${card.tickDots >= 2 ? 'fill' : ''}`} />
                <span className={`dot ${card.tickDots >= 3 ? 'fill' : ''}`} />
              </div>
            )}
          </div>
        );
      })}

      {/* Prayer check cards — bottom lane */}
      {prayerCards.map((card) => {
        const prox = 1 - Math.max(0, Math.min(1, card.diff / PREVIEW_AHEAD_MS));
        const cardOpacity = card.state === 'pending' ? prox : 1;
        return (
          <div
            key={card.id}
            className={`tl-card tl-prayer ${card.state}`}
            style={{ left: card.x, top: 160, opacity: cardOpacity }}
          >
            {card.icon && <img className="tl-card-icon" src={card.icon} alt="" />}
            <span className="tl-card-name">{card.name}</span>
            {card.keyLabel && (
              <span className="tl-card-key">{card.keyLabel}</span>
            )}
            {card.state === 'approaching' && (
              <div className="tl-tick-dots">
                <span className={`dot ${card.tickDots >= 1 ? 'fill' : ''}`} />
                <span className={`dot ${card.tickDots >= 2 ? 'fill' : ''}`} />
                <span className={`dot ${card.tickDots >= 3 ? 'fill' : ''}`} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
