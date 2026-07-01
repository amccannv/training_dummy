import { useMemo } from 'react';
import type { Rotation, StepResult } from '../../types';
import { actions } from '../../data/actions';

interface ResultsScreenProps {
  rotation: Rotation;
  allResults: StepResult[];
  onPracticeAgain: () => void;
  onReset: () => void;
}

function computeStats(results: StepResult[]) {
  const hits = results.length;
  const misses = results.reduce((sum, r) => sum + r.extraMisses, 0);
  const total = hits + misses;
  const accuracy = total > 0 ? ((hits / total) * 100).toFixed(1) : '—';

  return { hits, misses, accuracy };
}

function getMissedActions(results: StepResult[]) {
  const counts: Record<string, { name: string; misses: number }> = {};
  let hasData = false;

  for (const result of results) {
    for (const action of result.actions) {
      const def = actions.find((a) => a.id === action.actionId);
      if (def && result.extraMisses > 0) {
        hasData = true;
        if (!counts[action.actionId]) {
          counts[action.actionId] = { name: def.name, misses: 0 };
        }
        counts[action.actionId].misses += result.extraMisses;
      }
    }
  }

  if (!hasData) return [];

  return Object.values(counts)
    .sort((a, b) => b.misses - a.misses);
}

export default function ResultsScreen({
  rotation,
  allResults,
  onPracticeAgain,
  onReset,
}: ResultsScreenProps) {
  const stats = useMemo(() => computeStats(allResults), [allResults]);
  const missedActions = useMemo(() => getMissedActions(allResults), [allResults]);

  return (
    <div className="results-screen">
      <h2 className="results-title">Practice Complete</h2>
      <p className="results-rotation">{rotation.name}</p>

      <div className="results-grid">
        <div className="result-stat">
          <span className="stat-value">{stats.hits}</span>
          <span className="stat-label">Hits</span>
        </div>
        <div className="result-stat">
          <span className="stat-value">{stats.misses}</span>
          <span className="stat-label">Misses</span>
        </div>
        <div className="result-stat">
          <span className="stat-value">{stats.accuracy}%</span>
          <span className="stat-label">Accuracy</span>
        </div>
      </div>

      {missedActions.length > 0 && (
        <div className="most-missed">
          <h3 className="most-missed-title">Most Missed Actions</h3>
          <div className="most-missed-list">
            {missedActions.slice(0, 5).map((item) => (
              <div key={item.name} className="most-missed-row">
                <span className="most-missed-name">{item.name}</span>
                <span className="most-missed-count">{item.misses} miss{item.misses > 1 ? 'es' : ''}</span>
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
