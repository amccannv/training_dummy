import { KEYBOARD_ROWS } from '../../data/keyboard';
import './Keyboard.css';

export interface KeyBindingInfo {
  actionId: string;
  iconUrl?: string;
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  meta: boolean;
}

interface KeyboardProps {
  keyMap: Map<string, KeyBindingInfo[]>;
  expectedKeys: Set<string>;
  pressedKeys: Set<string>;
  hitKeyCode: string | null;
  missKeyCode: string | null;
  activeModifierCode?: string | null;
  interactive?: boolean;
  onKeyClick?: (code: string, modCode: string | null) => void;
  activePrayerKeyCode?: string | null;
  missedPrayerKeyCode?: string | null;
  unit?: number;
}

const UNIT = 38;

function codeToModFlags(
  code: string | null,
): { ctrl: boolean; shift: boolean; alt: boolean; meta: boolean } | null {
  switch (code) {
    case 'ControlLeft': case 'ControlRight': return { ctrl: true, shift: false, alt: false, meta: false };
    case 'ShiftLeft':   case 'ShiftRight':   return { ctrl: false, shift: true, alt: false, meta: false };
    case 'AltLeft':     case 'AltRight':     return { ctrl: false, shift: false, alt: true, meta: false };
    case 'MetaLeft':    case 'MetaRight':    return { ctrl: false, shift: false, alt: false, meta: true };
    default: return null;
  }
}

function findBestBinding(
  bindings: KeyBindingInfo[],
  activeMod: { ctrl: boolean; shift: boolean; alt: boolean; meta: boolean } | null,
): KeyBindingInfo | undefined {
  if (activeMod) {
    const exact = bindings.find(
      (b) =>
        b.ctrl === activeMod.ctrl &&
        b.shift === activeMod.shift &&
        b.alt === activeMod.alt &&
        b.meta === activeMod.meta,
    );
    if (exact) return exact;
  }
  return bindings.find((b) => !b.ctrl && !b.shift && !b.alt && !b.meta);
}

export default function Keyboard({
  keyMap,
  expectedKeys,
  pressedKeys,
  hitKeyCode,
  missKeyCode,
  activeModifierCode = null,
  interactive = false,
  onKeyClick,
  activePrayerKeyCode = null,
  missedPrayerKeyCode = null,
  unit,
}: KeyboardProps) {
  const size = unit ?? UNIT;
  const activeMod = codeToModFlags(activeModifierCode);

  return (
    <div className={`keyboard ${interactive ? 'interactive' : ''}`}>
      {KEYBOARD_ROWS.map((row, ri) => (
        <div key={ri} className="keyboard-row">
          {row.map((key) => {
            const isExpected = expectedKeys.has(key.code);
            const isPressed = pressedKeys.has(key.code);
            const isHit = hitKeyCode === key.code;
            const isMiss = missKeyCode === key.code;
            const isActivePrayer = activePrayerKeyCode === key.code;
            const isMissedPrayer = missedPrayerKeyCode === key.code;

            const bindings = keyMap.get(key.code);
            const best = bindings
              ? findBestBinding(bindings, activeMod)
              : undefined;
            const isBound = !!best;

            const classNames = ['key'];
            if (isBound && !isActivePrayer) classNames.push('bound');
            if (isExpected) classNames.push('expected');
            if (isPressed) classNames.push('pressed');
            if (isHit) classNames.push('hit');
            if (isMiss || isMissedPrayer) classNames.push('miss');
            if (isActivePrayer) classNames.push('active-prayer');

            const style: React.CSSProperties = {
              width: `${(key.width ?? 1) * size}px`,
              height: `${size}px`,
              fontSize: `${Math.round(size * 0.3)}px`,
            };

            return (
              <button
                key={key.code}
                type="button"
                className={classNames.join(' ')}
                style={style}
                disabled={!interactive}
                onMouseDown={(e) => {
                  if (interactive && onKeyClick) {
                    e.preventDefault();
                    onKeyClick(key.code, activeModifierCode);
                  }
                }}
                title={key.label || key.code}
              >
                {best?.iconUrl && (
                  <img className="key-icon" src={best.iconUrl} alt="" style={{ width: Math.round(size * 0.47), height: Math.round(size * 0.47) }} />
                )}
                <span className="key-label" style={{ fontSize: `${Math.round(size * 0.26)}px` }}>
                  {key.code === 'Space' ? null : key.label}
                </span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
