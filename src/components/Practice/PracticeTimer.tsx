import { useEffect, useState } from 'react';

interface PracticeTimerProps {
  startTimeMs: number;
  totalMs: number;
}

export default function PracticeTimer({ startTimeMs, totalMs }: PracticeTimerProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let raf: number;
    const tick = () => {
      setElapsed(performance.now() - startTimeMs);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [startTimeMs]);

  const pct = Math.min((elapsed / totalMs) * 100, 100);

  return (
    <div className="practice-timer">
      <div className="timer-bar">
        <div className="timer-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
