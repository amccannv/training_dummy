import { useMemo } from 'react';
import type { TickEvent, PrayerSessionStats, AttackStyle } from '../../types';
import { actions, getActionById } from '../../data/actions';

interface ResultsScreenProps {
  rotationName: string;
  events: TickEvent[];
  wrongPresses: number;
  onPracticeAgain: () => void;
  onReset: () => void;
  prayerStats?: PrayerSessionStats;
}

interface MissedEntry {
  name: string;
  iconUrl?: string;
  count: number;
}

interface StyleRow {
  style: AttackStyle;
  iconUrl?: string;
  hit: number;
  miss: number;
}

const STYLE_LABELS: Record<AttackStyle, string> = {
  melee: 'Melee',
  magic: 'Magic',
  ranged: 'Ranged',
  necromancy: 'Necromancy',
};

function styleToDeflectId(style: AttackStyle): string {
  switch (style) {
    case 'melee': return 'DeflectMelee';
    case 'magic': return 'DeflectMagic';
    case 'ranged': return 'DeflectMissiles';
    case 'necromancy': return 'DeflectNecromancy';
  }
}

function computeMissedBreakdown(events: TickEvent[]): MissedEntry[] {
  const counts: Record<string, number> = {};
  for (const event of events) {
    if (event.result === 'miss') {
      counts[event.abilityId] = (counts[event.abilityId] || 0) + 1;
    }
  }
  return Object.entries(counts)
    .map(([id, count]) => {
      const def = actions.find((a) => a.id === id);
      return { name: def?.name ?? id, iconUrl: def?.iconUrl, count };
    })
    .sort((a, b) => b.count - a.count);
}

function computeStyleRows(stats: PrayerSessionStats): StyleRow[] {
  const byStyle: Record<string, { hit: number; miss: number }> = {};
  for (const a of stats.attacks) {
    if (!byStyle[a.style]) byStyle[a.style] = { hit: 0, miss: 0 };
    if (a.result === 'hit') byStyle[a.style].hit++;
    else byStyle[a.style].miss++;
  }
  return Object.entries(byStyle)
    .map(([style, data]): StyleRow => {
      const deflectId = styleToDeflectId(style as AttackStyle);
      return { style: style as AttackStyle, iconUrl: getActionById(deflectId)?.iconUrl, ...data };
    })
    .sort((a, b) => a.style.localeCompare(b.style));
}

function accuracyPct(hits: number, total: number): number {
  return total > 0 ? (hits / total) * 100 : 0;
}

function accuracyClass(pct: number): string {
  if (pct >= 80) return 'good';
  if (pct >= 60) return 'ok';
  return 'bad';
}

export default function ResultsScreen({
  rotationName,
  events,
  wrongPresses,
  onPracticeAgain,
  onReset,
  prayerStats,
}: ResultsScreenProps) {
  const hasPrayer = !!prayerStats;

  const rotHits = useMemo(() => events.filter((e) => e.result === 'hit').length, [events]);
  const rotTotal = events.length;
  const rotAcc = useMemo(() => accuracyPct(rotHits, rotTotal), [rotHits, rotTotal]);
  const rotAccClass = accuracyClass(rotAcc);

  const missedBreakdown = useMemo(
    () => computeMissedBreakdown(events),
    [events],
  );

  const prayerHits = prayerStats?.hits ?? 0;
  const prayerTotal = hasPrayer ? (prayerStats!.hits + prayerStats!.misses) : 0;
  const prayerAcc = hasPrayer ? accuracyPct(prayerHits, prayerTotal) : 0;
  const prayerAccClass = accuracyClass(prayerAcc);

  const ssUptimePct = hasPrayer && prayerStats!.totalTicks > 0
    ? Math.round((prayerStats!.ssUptimeTicks / prayerStats!.totalTicks) * 100)
    : 0;

  const ssIcon = getActionById('SoulSplit')?.iconUrl;

  const styleRows = useMemo(
    () => hasPrayer ? computeStyleRows(prayerStats!) : [],
    [prayerStats, hasPrayer],
  );

  return (
    <div className="results-screen">
      <h2 className="results-title">Practice Complete</h2>
      <p className="results-rotation">{rotationName}</p>

      <div className={`results-panels ${hasPrayer ? '' : 'single'}`}>
        <div className="results-panel">
          <h3 className="results-panel-title">Ability Rotation</h3>

          <div className="results-panel-stat">
            <span className="results-fraction">{rotHits}/{rotTotal}</span>
            <span className={`results-accuracy ${rotAccClass}`}>{rotAcc.toFixed(1)}%</span>
          </div>

          <div className="results-panel-detail">
            <span className="detail-pill">{wrongPresses} wrong keys</span>
          </div>

          {missedBreakdown.length > 0 && (
            <div className="results-subsection">
              <h4 className="results-subsection-title">Missed</h4>
              <div className="results-subsection-list">
                {missedBreakdown.slice(0, 5).map((item) => (
                  <div key={item.name} className="results-subrow">
                    {item.iconUrl && (
                      <img className="results-subrow-icon" src={item.iconUrl} alt="" />
                    )}
                    <span className="results-subrow-label">{item.name}</span>
                    <span className="results-subrow-value">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {hasPrayer && (
          <div className="results-panel">
            <h3 className="results-panel-title">Prayer Flick</h3>

            <div className="results-panel-stat">
              <span className="results-fraction">{prayerHits}/{prayerTotal}</span>
              <span className={`results-accuracy ${prayerAccClass}`}>{prayerAcc.toFixed(1)}%</span>
            </div>

            <div className="results-ss-row">
              {ssIcon && <img className="results-ss-icon" src={ssIcon} alt="" />}
              <span className="results-ss-text">{ssUptimePct}% uptime</span>
            </div>

            <div className="results-subsection">
              <div className="results-subsection-list">
                {styleRows.map((row) => {
                  const total = row.hit + row.miss;
                  const pct = total > 0 ? (row.hit / total) * 100 : 0;
                  return (
                    <div key={row.style} className="results-subrow">
                      {row.iconUrl && (
                        <img className="results-subrow-icon" src={row.iconUrl} alt="" />
                      )}
                      <span className="results-subrow-label">{STYLE_LABELS[row.style]}</span>
                      <div className="results-progress">
                        <div
                          className="results-progress-fill"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="results-subrow-value">{row.hit}/{total}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="results-actions">
        <button className="btn-primary" onClick={onPracticeAgain}>
          Practice Again
        </button>
        <button className="btn-secondary" onClick={onReset}>
          Back to Menu
        </button>
      </div>
    </div>
  );
}
