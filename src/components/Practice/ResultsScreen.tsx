import { useMemo } from 'react';
import type { Rotation, TimedAction } from '../../types';
import { actions } from '../../data/actions';

interface ResultsScreenProps {
  rotation: Rotation;
  completed: TimedAction[];
  missed: string[];
  wrongPresses: number;
  prayerHits?: number;
  prayerMisses?: number;
  onPracticeAgain: () => void;
  onReset: () => void;
}

interface StatEntry {
  name: string;
  count: number;
}

function computeMissedBreakdown(missed: string[]): StatEntry[] {
  const counts: Record<string, number> = {};
  for (const id of missed) {
    counts[id] = (counts[id] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([id, count]) => {
      const def = actions.find((a) => a.id === id);
      return { name: def?.name ?? id, count };
    })
    .sort((a, b) => b.count - a.count);
}

export default function ResultsScreen({
  rotation,
  completed,
  missed,
  wrongPresses,
  prayerHits = 0,
  prayerMisses = 0,
  onPracticeAgain,
  onReset,
}: ResultsScreenProps) {
  const stats = useMemo(() => {
    const hits = completed.length;
    const totalMiss = missed.length + wrongPresses;
    const totalExpected = hits + missed.length;
    const accuracy =
      totalExpected > 0 ? ((hits / totalExpected) * 100).toFixed(1) : '\u2014';
    const avgOffset =
      completed.length > 0
        ? Math.round(
            completed.reduce((s, c) => s + Math.abs(c.offsetMs), 0) /
              completed.length,
          )
        : 0;

    const perfect = completed.filter((c) => c.quality === 'perfect').length;
    const early = completed.filter((c) => c.quality === 'early').length;
    const instant = completed.filter((c) => c.quality === 'instant').length;

    const prayerTotal = prayerHits + prayerMisses;
    const prayerAcc =
      prayerTotal > 0
        ? ((prayerHits / prayerTotal) * 100).toFixed(1)
        : null;

    return { hits, totalMiss, accuracy, avgOffset, totalExpected, perfect, early, instant, prayerHits, prayerMisses, prayerTotal, prayerAcc };
  }, [completed, missed, wrongPresses, prayerHits, prayerMisses]);

  const missedBreakdown = useMemo(
    () => computeMissedBreakdown(missed),
    [missed],
  );

  return (
    <div className="results-screen">
      <h2 className="results-title">Practice Complete</h2>
      <p className="results-rotation">{rotation.name}</p>

      <div className="results-grid">
        <div className="result-stat">
          <span className="stat-value">{stats.hits}</span>
          <span className="stat-label">Total Hits</span>
        </div>
        <div className="result-stat">
          <span className="stat-value">{stats.accuracy}%</span>
          <span className="stat-label">Window Acc</span>
        </div>
        <div className="result-stat">
          <span className="stat-value">{stats.totalMiss}</span>
          <span className="stat-label">Misses</span>
        </div>
      </div>

      <div className="results-detail">
        <span className="detail-item perfect">{stats.perfect} perfect</span>
        <span className="detail-item">{stats.early} early</span>
        <span className="detail-item">{stats.instant} instant</span>
      </div>

      {stats.prayerTotal > 0 && (
        <div className="results-prayer">
          <h3 className="results-prayer-title">Prayer Checks</h3>
          <div className="results-detail">
            <span className="detail-item">{stats.prayerHits} hit</span>
            <span className="detail-item">{stats.prayerMisses} miss</span>
            <span className="detail-item">{stats.prayerAcc}% acc</span>
          </div>
        </div>
      )}

      <div className="results-detail">
        <span className="detail-item">{missed.length} missed window</span>
        <span className="detail-item">{wrongPresses} wrong keys</span>
        {stats.avgOffset > 0 && (
          <span className="detail-item">Avg offset \u00B1{stats.avgOffset}ms</span>
        )}
      </div>

      {missedBreakdown.length > 0 && (
        <div className="most-missed">
          <h3 className="most-missed-title">Missed Actions</h3>
          <div className="most-missed-list">
            {missedBreakdown.slice(0, 5).map((item) => (
              <div key={item.name} className="most-missed-row">
                <span className="most-missed-name">{item.name}</span>
                <span className="most-missed-count">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

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
