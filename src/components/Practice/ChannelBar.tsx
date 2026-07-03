import { useEffect, useState, useMemo } from 'react';
import { usePracticeStore } from '../../store/practiceStore';
import { getActionById } from '../../data/actions';
import type { TickEvent } from '../../types';
import './ChannelBar.css';

const TICK_MS = 600;

interface ChannelInfo {
  name: string;
  iconUrl?: string;
  startMs: number;
  endMs: number;
  durationTicks: number;
  tickStart: number;
}

function findActiveChannel(
  events: TickEvent[],
  elapsed: number,
): ChannelInfo | null {
  for (const e of events) {
    const def = getActionById(e.abilityId);
    if (!def?.isChanneled) continue;
    const startMs = e.tick * TICK_MS;
    const endMs = (e.gcdEndTick + 1) * TICK_MS;
    if (elapsed >= startMs && elapsed < endMs) {
      return {
        name: def.name,
        iconUrl: def.iconUrl,
        startMs,
        endMs,
        durationTicks: e.duration,
        tickStart: e.tick,
      };
    }
  }
  return null;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export default function ChannelBar() {
  const sessionActive = usePracticeStore((s) => s.sessionActive);
  const startTimeMs = usePracticeStore((s) => s.startTimeMs);
  const events = usePracticeStore((s) => s.events);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!sessionActive) {
      setElapsed(0);
      return;
    }
    let raf: number;
    const tick = () => {
      setElapsed(performance.now() - startTimeMs);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [sessionActive, startTimeMs]);

  const channel = useMemo(
    () => findActiveChannel(events, elapsed),
    [events, elapsed],
  );

  const active = channel !== null;
  let remaining = 0;
  let notchStates: { fill: number; key: number }[] = [];

  if (channel) {
    remaining = Math.max(0, Math.ceil((channel.endMs - elapsed) / TICK_MS));
    notchStates = Array.from({ length: channel.durationTicks }, (_, i) => {
      const notchStart = channel.startMs + i * TICK_MS;
      const fill = clamp((elapsed - notchStart) / TICK_MS, 0, 1);
      return { fill, key: channel.tickStart + i };
    });
  }

  return (
    <div className={`channel-bar${active ? ' active' : ''}`}>
      {channel && (
        <>
          <div className="channel-bar-name">
            {channel.iconUrl && (
              <img className="channel-bar-icon" src={channel.iconUrl} alt="" />
            )}
            {channel.name}
          </div>

          <div className="channel-bar-notches">
            {notchStates.map((ns) => (
              <div key={ns.key} className="channel-bar-notch">
                <div
                  className="channel-bar-notch-fill"
                  style={{ width: `${ns.fill * 100}%` }}
                />
              </div>
            ))}
          </div>

          <span className="channel-bar-remaining">{remaining}</span>
        </>
      )}
    </div>
  );
}
