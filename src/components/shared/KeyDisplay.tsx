import type { Keybind } from '../../types';
import { formatKeybind } from '../../utils/keybindFormat';

interface KeyDisplayProps {
  keybind: Keybind | null;
  capturing?: boolean;
}

export default function KeyDisplay({ keybind, capturing }: KeyDisplayProps) {
  if (capturing) {
    return <span className="key-capture">Press any key...</span>;
  }

  if (!keybind) {
    return <span className="key-unbound">Unbound</span>;
  }

  return <span className="key-bound">{formatKeybind(keybind)}</span>;
}
