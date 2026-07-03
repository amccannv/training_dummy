import type { TickEvent, Keybind } from '../../types';
import { actions } from '../../data/actions';
import { formatKeybind } from '../../utils/keybindFormat';
import './TickList.css';

interface TickListProps {
  events: TickEvent[];
  bindings: Record<string, Keybind | null>;
}

export default function TickList({ events, bindings }: TickListProps) {
  const ci = events.findIndex((e) => !e.resolved);

  return (
    <div className="tick-list">
      <div className="tick-list-header">
        <span className="tlh-tick">Tick</span>
        <span className="tlh-name">Ability</span>
        <span className="tlh-key">Key</span>
        <span className="tlh-result">Result</span>
      </div>
      <div className="tick-list-body">
        {events.map((event, i) => {
          const def = actions.find((a) => a.id === event.abilityId);
          const kb = bindings[event.abilityId];
          const isCurrent = i === ci;

          let rowClass = 'tick-row';
          if (event.result === 'hit') rowClass += ' hit';
          else if (event.result === 'miss') rowClass += ' miss';
          else if (isCurrent) rowClass += ' current';

          return (
            <div key={`${event.abilityId}-${event.tick}`} className={rowClass}>
              <span className="tr-tick">{event.tick}</span>
              <span className="tr-ability">
                {def?.iconUrl && (
                  <img className="tr-icon" src={def.iconUrl} alt="" />
                )}
                <span className="tr-name">{def?.name ?? event.abilityId}</span>
              </span>
              <span className="tr-key">
                {kb ? formatKeybind(kb) : '\u2014'}
              </span>
              <span className="tr-result">
                {event.result === 'hit' && '\u2713'}
                {event.result === 'miss' && '\u2717'}
                {isCurrent && '\u25C0'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
